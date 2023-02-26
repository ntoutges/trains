import { Options } from "./consistLookup.js";
import { RollingStock } from "./trains.js";
import { buildCar } from "./consistLookup.js";
import { Track } from "./tracks.js";

interface ConsistInterface {
  sequence: Array<Options>
  tracks: Array<Track>
}

export class Consist {
  private t: Array<RollingStock>
  private m: Record<number,number[]> // maps types of [RollingStock] to their indicies in [this.t]
  constructor({
    sequence,
    tracks
  }: ConsistInterface) {
    if (sequence.length == 0) throw new Error("Empty consist");

    this.t = [];
    
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
        }
        
        // new locomotive created, but not yet documented
        while (this.t[0].cf) {
          this.t.splice(0,0, this.t[0].cf);
          types.splice(0,0, Options.Head);
        }
        
        // construct [this.m] map
        this.m = {};
        for (let i in types) {
          if (types[i] in this.m) this.m[types[i]].push(+i);
          else this.m[types[i]] = [+i];
        }
      }

  get head() { return this.t[0]; }
  get trains() { return this.t; }

  getRollingStock(indecies: number[]) {
    const trains: RollingStock[] = [];
    for (const index of indecies) { trains.push(this.t[index]); }
    return trains;
  }

  getRollingStockByType(optionType: Options) {
    return this.getRollingStock(this.m[optionType]);
  }

  accelerateTo(finalValue=1, acc=0.1) {
    this.head.accelerateTo(finalValue, acc);
  }
}