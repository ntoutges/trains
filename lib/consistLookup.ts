import { Mass, Vector } from "./maths.js";
import { Track } from "./tracks.js";
import { RollingStock, Car, Head, Locomotive } from "./trains.js";

export enum Options {
  "Head"=0,
  "Car",
  "Locomotive",
  "Unknown"
}

export function buildCar(option: Options, tracks: Track[], locomotive: RollingStock) {
  let train: RollingStock = null;
  switch (option) {
    case Options.Head:
      train = new Head({
        tracks
      });
      break;
    case Options.Locomotive:
      train = new Locomotive({
        tracks,
        locomotive,
        tractiveEffort: 820000,
        mass: new Mass({
          dryMass: 188000
        })
      })
      break;
    case Options.Car:
      train = new Car({
        locomotive,
        tracks,
        mass: new Mass({
          dryMass: 129730
        })
      });
      break;
    default:
      throw new Error(`Consist of type ${option} not implemented`);
  }

  return train;
}