import { Options } from "./consistLookup.js";
import { Head, Locomotive, RollingStock } from "./trains.js";
import { buildCar } from "./consistLookup.js";
import { Track } from "./tracks.js";
import { FastFollower, HeadTracer } from "./objects.js";

const K = 0.1;

interface ConsistInterface {
  sequence: Array<Options>
  tracks: Array<Track>
}

const consists: Consist[] = [];
export var activeConsist: Consist = null;

function setConsistFocus() {
  if (activeConsist) {
    activeConsist.accelerateTo(0);
    for (const img of activeConsist.e) { img.removeAttr("data-focus"); }
  }
  for (const img of (this as Consist).e) { img.attr("data-focus", "1"); }
  activeConsist = this;
}

export class Consist {
  private t: Array<RollingStock>;
  public readonly e: Array<JQuery<HTMLImageElement>>;
  readonly tr: Array<Track>;
  private m: Record<number, number[]>;
  readonly head: Head;
  private totalMass: number; // Kg
  private totalEffort: number; // N
  constructor({
    sequence,
    tracks
  }: ConsistInterface) {
    this.tr = tracks;
    if (sequence.length == 0) throw new Error("Empty consist");

    this.t = [];
    this.e = [];
    const types: Options[] = []; // stores what type of [RollingStock] is at which index
    
    for (const option of sequence) {
      this.t.push(
        buildCar(
          option,
          tracks,
          (this.t.length != 0) ? this.t[this.t.length-1] : null
        )
      );
      types.push(option);
      this.e.push(
        this.t[this.t.length-1].e
      )
    }

    this.head = this.t[0].cf as Head; // locomotive auto-generated

    this.head.box.frontTruck.getAxle(0).o.data = "l"; // head is always the leader of the consist
    this.t[this.t.length-1].box.backTruck.getAxle(0).o.data = "f"; // tail of the consist (follower)

    // construct [this.m] map
    this.m = {};
    for (let i in types) {
      if (types[i] in this.m) this.m[types[i]].push(+i);
      else this.m[types[i]] = [+i];
    }
    
    for (let i = 1; i < this.t.length; i++) {
      if (!this.t[i].cf) {
        this.t[i].coupleTo(this.t[i-i]);
      }
    }

    this.calculateMassAndForce();

    consists.push(this);
    if (!activeConsist) setConsistFocus.call(this);
    this.addEventListener("click", setConsistFocus);
  }

  get tail() { return this.t[this.t.length-1]; }
  get trains() { return this.t; }
  get map() { return this.m; }

  getRollingStock(indecies: number[]) {
    const trains: RollingStock[] = [];
    for (const index of indecies) { trains.push(this.t[index]); }
    return trains;
  }

  calculateMassAndForce() {
    this.totalMass = 0;
    this.totalEffort = 0;
    for (const car of this.t) {
      this.totalMass += car.mass.wetMass;
      if (car instanceof Locomotive) this.totalEffort += car.tractiveEffort;
    }

    if (this.totalEffort == 0) {
      this.totalEffort = 10000000; // give force to decelerate train
      this.accelerateTo(0);
      this.totalEffort = 0; // reset force to none
    }
  }

  accelerateTo(finalValue=1) {
    // F=ma; F/m=a
    // const acc = K * this.totalEffort / this.totalMass;
    const acc = 1;
    this.head.accelerateTo(finalValue, acc);
  }

  appendConsist(consist:Consist, direction:number = 1) { // +direction = this consist in front, -direction = other consist in front
    if (direction < 0) return consist.appendConsist(this, -direction);
    consist.head.coupleTo(this.tail);

    for (let car of consist.trains) { this.t.push(car); }
    consist.empty();
  }

  appendCar(car:RollingStock, type:Options=Options.Unknown) {
    car.coupleTo(this.tail);
    this.trains.push(car);
  }

  splitAt(index: number) { // index marks the final car that is NOT removed
    if (index < 0) index += this.t.length-1;
    if (index < 0 || index >= this.t.length) throw new Error(`Invalid index [${index}] to split at`);
    index += 1;

    const mapArr: number[] = [];
    for (let optionType in this.m) {
      for (let optionIndex of this.m[optionType]) {
        mapArr[optionIndex] = +optionType;
      }
    }

    const locoH: [track: Track, extra: number] = this.t[index].box.frontTruck.getAxle(0).o.h;
    const otherConsist = new Consist({
      tracks: this.tr,
      sequence: mapArr.slice(index)
    });

    if (locoH) (otherConsist.head.box.frontTruck.o as HeadTracer).l = this.tr[0].searchTrackFor(locoH[0]) + locoH[1];

    for (const car of this.t.slice(index)) { car.remove(); }

    this.t.splice(index);
    mapArr.splice(index);
    this.calculateMassAndForce();

    const lastObj = this.t[this.t.length-1].box.backTruck.getAxle(0).o as FastFollower;
    const oldRoot = lastObj.unRoot(); // take off of track
    lastObj.data = "f"; // tail of the consist (follower)
    lastObj.reRoot(oldRoot); // put back on track, with new status
    return otherConsist;
  }

  empty() {
    this.t = [];
    this.m = [];
  }

  addEventListener(event="string", callback: (e) => void) {
    for (const img of this.e) {
      img.on(event, (e) => { callback.call(this, e); });
    }
  }
}

