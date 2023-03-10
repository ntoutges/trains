import * as parts from "./trainParts.js";
import * as obj from "./objects.js";
import * as math from "./maths.js";
import { pos, onMove } from "./grid.js";
import { tracks, renderTracks, addObject, removeObject, Track } from "./tracks.js";

const conatiner = $("#train-parts-container");
const trainCars = [];

let oldZoom = 1;
onMove((pos) => {
  if (pos.a != oldZoom) { // detect when zoom changed
    trainCars.forEach((part) => {
      part.updateImageSize();
    })
    oldZoom = pos.a;
  }
});

interface RollingStockInterface {
  box: parts.TrainBox
  source: string
  tracks: Track[],
  mass: math.Mass;
}

export class RollingStock {
  public box: parts.TrainBox;
  public t: Track[];
  public e: JQuery<HTMLImageElement>;
  public cf: RollingStock; // coupler (forwards)
  public cb: RollingStock; // coupler (backwards)
  public mass: math.Mass; // measured in kilograms (the superior unit)
  constructor({
    box,
    source,
    tracks,
    mass
  }: RollingStockInterface) {
    this.box = box;
    this.t = tracks;
    this.e = $(`<img src=\"graphics/${source}\" class=\"trainParts trainDecks\" style=\"width:${box.o.b.x}px;height:${box.o.b.y}px\" draggable=\"false\">`);

    this.mass = mass

    this.cf = null; // (c)oupled (f)ront
    this.cb = null; // (c)oupled (b)ack

    conatiner.append(this.e);
    trainCars.push(this);

    this.updateImageSize();
  }

  tick(...params) {
    this.box.tick.apply(this.box, params);
  }
  render() {
    this.box.updateGraphics(true);
    const [x,y] = this.box.o.getScreenCoords(pos.x, pos.y, pos.a);
    // subtraction to center image
    this.e.css("left", x - this.box.o.b.x / (2*pos.a));
    this.e.css("top", y - this.box.o.b.y / (2*pos.a));
    this.e.css("transform", `rotate(${this.box.o.r}rad)`);
  }
  updateImageSize() {
    this.e.css("width", this.box.o.b.x / pos.a);
    this.e.css("height", this.box.o.b.y / pos.a);
  }

  coupleTo(locomotive: RollingStock, distance=10) {
    if (distance < 0) { // negative distance indicates this car coupled in front (acting as locomotive)
      return locomotive.coupleTo(this, -distance);
    }
    if (this.cf) { this.uncouple(distance, true); }
    this.box.coupleTo(locomotive.box, distance);
    this.cf = locomotive;
    locomotive.cb = this;
  }
  uncoupleA() {
    const oldCB = this.cb;
    if (oldCB) { this.cb.uncouple(1, true); }
    const oldCF = this.cf;
    return { oldCF, oldCB }
  }
  uncoupleB(oldCB: RollingStock) {
    if (oldCB) { oldCB.coupleTo(this); }
  }

  uncouple(direction=1, _override=false) { // negative direction indicates to uncouple rear from front (this acting as locomotive)
    if (direction < 0) {
      if (!this.cb) return;
      this.cb.uncouple(-direction);
      return;
    }
    
    if (!this.cf) return;
    this.box.uncouple();
    this.cf.cb = null;
    this.cf = null;
  }

  accelerateTo(finalValue=0, acc=0.1) {
    if (this.cf) this.cf.accelerateTo(finalValue, acc);
    // if no front end locomotive, don't do anything, as there is no locomotive
  }

  remove() {
    if (this.cf) this.uncouple(1, true);
    if (this.cb) this.uncouple(-1);

    this.box.remove();
    this.e.remove();
    const index = trainCars.indexOf(this);
    if (index == -1) return;
    trainCars.splice(index, 1);
  }
}

interface HeadInterface {
  tracks: Track[]
}

// this MUST be at the front of a set of trains
export class Head extends RollingStock {
  public r: Track; // root track
  public l: obj.HeadTracer;
  constructor({
    tracks
  }: HeadInterface) {
    const loco = addObject(
      new obj.HeadTracer({  })
    ) as obj.HeadTracer;
    super({
      box: new parts.SmallTrainBox({
        object: loco
      }),
      source: "missing.png",
      tracks,
      mass: new math.Mass({ dryMass: 1 })
    });

    this.r = null; // root track
    this.l = loco;
  }
  
  accelerateTo(finalValue=0, acc=0.1) {
    if (this.cf) this.cf.accelerateTo(finalValue, acc); // must pass task of accelerating to front end locomotive
    this.l.accelerateTo(finalValue, acc);
  }
  getVelocity() { return this.l.velocity; }

  tick() {
    if (this.r == null) {
      if (this.t.length == 0) return;
      this.r = this.t[0];
    }
    super.tick(this.r);
    this.setRoot();
  }
  forceTick() { if (this.t.length > 0) super.tick(this.t[0]); }

  setRoot() {
    if (this.box.h && this.box.h[0] != this.r && this.getVelocity() != 0) {
      if (this.getVelocity() > 0) {
        this.l.l += this.box.h[0].searchTrackFor(this.r); // this.l[ocomotiveTracer].l[eaderProgress]
      }
      else { this.l.l += this.box.h[0].searchTrackFor(this.r); } // this.l[ocomotiveTracer].l[eaderProgress]
      this.r = this.box.h[0];
    }
  }

  coupleTo(locomotive, distance=10) {
    if (distance < 0) { // negative distance indicates this car coupled in front (acting as locomotive)
      return locomotive.coupleTo(this, -distance);
    }
    this.cb.coupleTo(locomotive, distance);
  }
}

interface FastHeadInterface {
  tracks: Track[]
  keys?: Object
}

export class FastHead extends Head {
  keys: Object;
  constructor({
    tracks,
    keys={ // in format of { keyCode: [vel, acc]... }
      38: ["accelerateTo", 2,0.01],
      40: ["accelerateTo",-2,0.01],
      32:["uncouple", -1]
    }
  }: FastHeadInterface) {
    super({ tracks });
    if (!(0 in keys)) keys[0] = ["accelerateTo", 0, 0.005]; // specifies deceleration
    this.keys = keys;

    document.body.addEventListener("keydown", (e) => { this.onKeyDown(e.keyCode); })
    document.body.addEventListener("keyup", (e) => { this.onKeyUp(e.keyCode); });
  }

  onKeyDown(keyCode: number) { if (keyCode in this.keys) this[this.keys[keyCode][0]].apply(this, this.keys[keyCode].slice(1)); }
  onKeyUp(keyCode: number) { if (keyCode in this.keys && this.keys[keyCode][0] == "accelerateTo") { this[this.keys[0][0]].apply(this, this.keys[0].slice(1)); } }
}

interface CarInterface {
  tracks: Track[]
  locomotive?: RollingStock,
  mass: math.Mass,
  source?: string
  bounds?: math.Vector
  truckInset?: number
  truckMidpointWeight?: number
  truckSpacing?: number
  truckAxles?: number
}

export class Car extends RollingStock {
  constructor({
    locomotive=null,
    tracks,
    mass,
    bounds=new math.Vector({ x:300,y:70 }), // x=width, y=length
    truckInset=60, // distance from center of truck to edge of box
    truckMidpointWeight=0.5,
    truckSpacing=40,
    truckAxles=2,
    source="wagon.png"
  }: CarInterface) {
    super({
      box: new parts.TrainBox({
        bounds,
        object: new obj.AutoTracer({ step:0 }), // temporary object
        truckInset,
        truckMidpointWeight,
        truckSpacing,
        truckAxles
      }),
      source,
      tracks,
      mass
    });
    if (locomotive) this.coupleTo(locomotive);
    // else this.coupleTo(new Head({ tracks })); // [Car]s cannot exist without a locomotive
    else this.uncouple();
  }

  coupleTo(locomotive: RollingStock, distance=10) {
    if (distance < 0) { // negative distance indicates this car coupled in front (acting as locomotive)
      return locomotive.coupleTo(this, -distance);
    }
    if (this.cf && this.cf instanceof Head) this.cf.remove();
    super.coupleTo(locomotive, distance);
  }
  uncouple(direction=1, override=false) { // negative direction indicates to uncouple rear from front (this acting as locomotive)
    if (direction < 0) {
      if (!this.cb) return;
      this.cb.uncouple(-direction);
      return;
    }
    const {oldCF, oldCB} = super.uncoupleA();
    super.uncouple();
    if (!override) {
      const head = new Head({ tracks });
      const h = oldCF?.box.backTruck.getAxle(-1).o.h;
      if (h) {
        head.box.h = h;
        head.r = h[0];
        head.l.l = h[1] - oldCF.box.i - 20;
      }
      head.box.i = -this.box.i-1;
      
      this.coupleTo(head,1); // using 1 to signify direction of couple
    }
    super.uncoupleB(oldCB);
  }

  tick() {
    this.box.o.tick();
  }
  forceTick() { if (this.t.length > 0) super.tick(this.t[0]); }
}

interface LocomotiveInterface extends CarInterface {
  tractiveEffort: number // measured in Newtons (because SI is superior)
}

export class Locomotive extends Car {
  private readonly tE: number;
  constructor({
    locomotive=null,
    tracks,
    tractiveEffort,
    mass,
    bounds=new math.Vector({ x:430,y:70 }), // x=width, y=length
    truckInset=80, // distance from center of truck to edge of box
    truckMidpointWeight=0.7,
    truckSpacing=40,
    truckAxles=3,
    source="locomotive.png"
  }: LocomotiveInterface) {
    super({
      locomotive,
      tracks,
      mass,
      bounds,
      truckInset,
      truckMidpointWeight,
      truckSpacing,
      truckAxles,
      source
    });
    this.tE = tractiveEffort;
  }

  get tractiveEffort() { return this.tE; }
}

export function tickTrains(doRender:boolean = false) {
  trainCars.forEach((trainCar) => { trainCar.tick(); });
  if (doRender) { trainCars.forEach((trainCar) => { trainCar.render(); }); }
}