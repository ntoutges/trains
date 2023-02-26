import * as parts from "./trainParts.js";
import * as obj from "./objects.js";
import * as math from "./maths.js";
import { pos } from "./grid.js";
import { tracks, renderTracks, addObject, Track } from "./tracks.js";

const conatiner = $("#train-parts-container");
const trainCars = [];

interface RollingStockInterface {
  box: parts.TrainBox
  source: string
  tracks: Track[]
}

export class RollingStock {
  public box: parts.TrainBox;
  public t: Track[];
  public e: JQuery<HTMLImageElement>;
  public cf: RollingStock; // coupler (forwards)
  public cb: RollingStock; // coupler (backwards)
  constructor({
    box,
    source,
    tracks
  }: RollingStockInterface) {
    this.box = box;
    this.t = tracks;
    this.e = $(`<img src=\"graphics/${source}\" class=\"trainParts trainDecks\" style=\"width:${box.o.b.x}px;height:${box.o.b.y}px\">`);

    this.cf = null; // (c)oupled (f)ront
    this.cb = null; // (c)oupled (b)ack

    conatiner.append(this.e);
    trainCars.push(this);
  }

  tick(...params) {
    this.box.tick.apply(this.box, params);
  }
  render() {
    this.box.updateGraphics(true);
    const [x,y] = this.box.o.getScreenCoords(pos.x, pos.y);
    // subtraction to center image
    this.e.css("left", x-this.box.o.b.x/2);
    this.e.css("top", y-this.box.o.b.y/2);
    this.e.css("transform", `rotate(${this.box.o.r}rad)`);
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
}

interface LocomotiveInterface {
  tracks: Track[]
  bounds?: math.Vector
  truckInset?: number
  truckMidpointWeight?: number
  truckSpacing?: number
  truckAxles?: number
  source?: string
}

export class Locomotive extends RollingStock {
  public r: Track; // root track
  public l: obj.LocomotiveTracer;
  constructor({
    tracks,
    bounds=new math.Vector({ x:430,y:70 }), // x=width, y=length
    truckInset=80, // distance from center of truck to edge of box
    truckMidpointWeight=0.5,
    truckSpacing=40,
    truckAxles=2,
    source="locomotive.png"
  }: LocomotiveInterface) {
    const loco = addObject(
      new obj.LocomotiveTracer({  })
    ) as obj.LocomotiveTracer;
    super({
      box: (bounds.isZero()) ? 
        new parts.SmallTrainBox({
          object: loco
        }) : 
        new parts.TrainBox({
          bounds,
          object: loco,
          truckInset,
          truckMidpointWeight,
          truckSpacing,
          truckAxles
        }),
      source,
      tracks
    });

    this.r = null; // root track
    this.l = loco;
  }
  
  accelerateTo(finalValue=0, acc=0.1) {
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
}

export class HeadlessLocomotive extends Locomotive {
  constructor({
    tracks
  }) {
    super({
      tracks,
      bounds: new math.Vector({ x:0, y:0 })
    });
  }

  coupleTo(locomotive, distance=10) {
    if (distance < 0) { // negative distance indicates this car coupled in front (acting as locomotive)
      return locomotive.coupleTo(this, -distance);
    }
    this.cb.coupleTo(locomotive, distance);
  }

  remove() {
    this.box.remove();
    const index = trainCars.indexOf(this);
    if (index == -1) { throw new Error("HeadlessLocomotive already removed"); }
    trainCars.splice(index, 1);
  }
}

export class Car extends RollingStock {
  constructor({
    locomotive,
    tracks,
    bounds=new math.Vector({ x:300,y:70 }), // x=width, y=length
    truckInset=60, // distance from center of truck to edge of box
    truckMidpointWeight=0.5,
    truckSpacing=40,
    truckAxles=2,
    source="wagon.png"
  }) {
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
      tracks
    });
    if (locomotive) this.coupleTo(locomotive);
    else this.coupleTo(new HeadlessLocomotive({ tracks })); // [Car]s cannot exist without a locomotive
  }

  coupleTo(locomotive, distance=10) {
    if (distance < 0) { // negative distance indicates this car coupled in front (acting as locomotive)
      return locomotive.coupleTo(this, -distance);
    }
    if (this.cf && this.cf instanceof HeadlessLocomotive) this.cf.remove();
    super.coupleTo(locomotive, distance);
  }
  uncouple(direction=1, override=false) { // negative direction indicates to uncouple rear from front (this acting as locomotive)
    if (direction < 0) {
      if (!this.cb) return;
      this.cb.uncouple(-direction);
      return;
    }
    
    const oldCB = this.cb;
    if (oldCB) { this.cb.uncouple(1, true); }
    const oldCF = this.cf;
    super.uncouple();
    
    
    if (!override) {
      const head = new HeadlessLocomotive({ tracks });
      const h = oldCF.box.backTruck.getAxle(-1).o.h;
      if (h) {
        head.box.h = h;
        head.r = h[0];
        head.l.l = h[1] - oldCF.box.i - 20;
      }
      this.coupleTo(head);
    }
    if (oldCB) { oldCB.coupleTo(this); }
  }

  tick() {
    this.box.o.tick();
  }
  forceTick() { if (this.t.length > 0) super.tick(this.t[0]); }
}

interface FastLocomotiveInterface {
  tracks: Track[]
  keys?: Object
  bounds?: math.Vector
  truckInset?: number
  truckMidpointWeight?: number
  truckSpacing?: number
  truckAxles?: number
  source?: string
}

export class FastLocomotive extends Locomotive {
  keys: Object;
  constructor({
    tracks,
    bounds=new math.Vector({ x:430,y:70 }), // x=width, y=length
    truckInset=80, // distance from center of truck to edge of box
    truckMidpointWeight=0.7,
    truckSpacing=40,
    truckAxles=3,
    source="locomotive.png",
    keys={ // in format of { keyCode: [vel, acc]... }
      38: ["accelerateTo", 2,0.01],
      40: ["accelerateTo",-2,0.01],
      32:["uncouple", -1]
    }
  }: FastLocomotiveInterface) {
    super({
      tracks,
      bounds,
      truckInset,
      truckMidpointWeight,
      truckSpacing,
      truckAxles,
      source
    });
    if (!(0 in keys)) keys[0] = ["accelerateTo", 0, 0.005]; // specifies deceleration
    this.keys = keys;

    document.body.addEventListener("keydown", (e) => { this.onKeyDown(e.keyCode); })
    document.body.addEventListener("keyup", (e) => { this.onKeyUp(e.keyCode); });
  }

  onKeyDown(keyCode) { if (keyCode in this.keys) this[this.keys[keyCode][0]].apply(this, this.keys[keyCode].slice(1)); }
  onKeyUp(keyCode) { if (keyCode in this.keys && this.keys[keyCode][0] == "accelerateTo") { this[this.keys[0][0]].apply(this, this.keys[0].slice(1)); } }
}

const loco = new FastLocomotive({
  tracks,
  keys: {
    0: ["accelerateTo", 0, 0.01],
    38: ["accelerateTo", 4,0.01],
    40: ["accelerateTo",-4,0.01],
    32:["uncouple", -1]
  }
});


const car1 = new Car({
  locomotive: loco,
  tracks
})

const car2 = new Car({
  locomotive: car1,
  tracks
})

new Car({
  locomotive: car2,
  tracks
})

setInterval(() => {
  trainCars.forEach((trainCar) => {
    trainCar.tick();
    trainCar.render();
  });
  renderTracks();
  // parts.tick();
}, 10);

setTimeout(() => {
  trainCars.forEach((trainCar) => {
    trainCar.forceTick();
    trainCar.render();
  });
}, 100);