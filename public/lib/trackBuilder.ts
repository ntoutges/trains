import { pos } from "./grid.js";
import { Segment, Vector } from "./maths.js";
import { appendTrack, setTracks, Track } from "./tracks.js";

var points: Vector[] = [];
export function addPoint(pageX: number, pageY: number) {
  const x = pageX * pos.a - pos.x;
  const y = -pageY * pos.a + pos.y;
  
  points.push(
    new Vector({ x,y })
  );
  
  if (points.length > 1) {
    const track = new Track({
      segment: new Segment({
        vector: points[points.length-2],
        offVector: points[points.length-1].sub(points[points.length-2])
      })
    });
    appendTrack(track);
  }
}

export function reset() {
  points.splice(0);
  setTracks([]);
}

export function getPoints() {
  return points;
}

export function getPointPairs() {
  const pairs: Array<[x: number, y:number]> = [];
  for (const point of points) {
    pairs.push([
      point.x,
      point.y
    ]);
  }
  return pairs;
}