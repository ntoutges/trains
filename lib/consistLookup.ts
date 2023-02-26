import { Track } from "./tracks.js";
import { RollingStock, Car, Locomotive } from "./trains.js";

export enum Options {
  "Head"=0,
  "Car"
}

export function buildCar(option: Options, tracks: Track[], locomotive: RollingStock) {
  let train: RollingStock = null;
  switch (option) {
    case Options.Head:
      train = new Locomotive({
        locomotive,
        tracks
      });
      break;
    case Options.Car:
      train = new Car({
        locomotive,
        tracks
      })
      break;
    default:
      throw new Error(`Consist of type ${option} not implemented`);
  }

  return train;
}