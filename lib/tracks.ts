import { Vector, Segment, sign } from "./maths.js";
import { onMove, pos } from "./grid.js";
import { ObjHeader, Obj } from "./objects.js"

const trackElement = $("#background-tracks");
const ctx = (trackElement.get(0) as HTMLCanvasElement).getContext("2d");

const trackElWidth = $("#background-tracks").width();
const trackElHeight = $("#background-tracks").height();

trackElement.attr("width", trackElWidth);
trackElement.attr("height", trackElHeight);

ctx.strokeStyle = "blue";

onMove(renderTracks);

export function renderTracks() {
  ctx.clearRect(0,0, trackElWidth, trackElHeight);
  ctx.beginPath();
  tracks.forEach((track) => {
    ctx.moveTo((track.segment.x1 + pos.x) / pos.a, (-track.segment.y1 + pos.y) / pos.a);
    ctx.lineTo((track.segment.x2 + pos.x) / pos.a, (-track.segment.y2 + pos.y) / pos.a);
  });
  ctx.stroke();
  renderObjects();
};

function renderObjects() {
  objects.forEach((obj) => {
    obj.render(ctx, pos.x,pos.y,pos.a);
  });
}


export const tracks: Track[] = [];
var objects = [];
export class Track {
  public s: Segment;
  public t: Track[];
  public c: Obj[];
  constructor({
    segment = new Segment({}),
    inTrack = null, // instance of Track
    outTrack = null // instance of Track
  }) {
    this.s = segment;
    this.t = [inTrack, outTrack]; // [in,out]
    this.c = []; // [c]hild trains (trains which have this set as their root)
  }

  get segment() { return this.s; }

  get inTrack() { return this.t[0]; }
  set inTrack(track) { this.t[0] = track; }
  get outTrack() { return this.t[1]; }
  set outTrack(track) { this.t[1] = track; }

  get length() { return this.segment.magnitude; }

  searchForTrack(distance: number): ObjHeader { // returns [finalTrack, residualDistance]
    let dir = sign(distance);
    let skipFirstItt = dir < 0;
    distance = Math.abs(distance);
    let currentTrack: Track = this;
    while (true) {
      if (!skipFirstItt) { // effectively skip first itteration of loop
        distance -= currentTrack.length;
      } else skipFirstItt = false;
      if (distance <= 0) { return (dir >= 0) ? [currentTrack, distance + currentTrack.length] : [currentTrack, -distance] }
      if (currentTrack.getTrackInDir(dir) == null) { return (dir > 0) ? [currentTrack, -distance] : [currentTrack, -distance]; }
      currentTrack = currentTrack.getTrackInDir(dir);
    }
  }

  searchTrackFor(track: Track) { // returns distance of [track] from this track
    let foreDistance = 0;
    let backDistance = 0;
    let forewardTrack: Track = this;
    let backwardTrack: Track = this.inTrack;
    while (forewardTrack != track && backwardTrack != track && (forewardTrack || backwardTrack)) {
      if (forewardTrack) {
        foreDistance += forewardTrack.length;
        forewardTrack = forewardTrack.outTrack;
      }
      if (backwardTrack) {
        backDistance -= backwardTrack.length;
        backwardTrack = backwardTrack.inTrack;
      }

    }
    if (forewardTrack == track) return foreDistance;
    else if (backwardTrack == track) return backDistance - backwardTrack.length;
    return null;
  }

  getTrackInDir(direction: number) { // -1 (inTrack) or 1 (outTrack)
    return (direction < 0) ? this.inTrack : this.outTrack;
  }

  getPosAt(distance: number) { // px from origin
    const percent = Math.min(Math.max(distance / this.length, 0), 1); // constrains [percent] within range [0,1]
    return this.segment.interpolate(percent);
  }

  root(train: Obj) {
    this.c.push(train);
  }
  unRoot(train: Obj) {
    const index = this.c.indexOf(train);
    if (index == -1) return;
    this.c.splice(index, 1);
  }
}

interface BridgeTrackInterface {
  inTracks: Track[]
  outTracks: Track[]
}

export class BridgeTrack extends Track {
  private itI: number; // in track index
  private otI: number; // out track index
  private tt: number; // track transition -- first index where [this.t] returns an outTrack 
  constructor({
    inTracks = [],
    outTracks = []
  }: BridgeTrackInterface) {
    if (inTracks.length == 0) throw new Error("Must have at least one inTrack");
    if (outTracks.length == 0) throw new Error("Must have at least one outTrack");

    super({});
    this.t = [].concat(inTracks, outTracks);
    this.itI = -1; // [i]n [t]rack [I]ndex
    this.otI = -1; // [o]ut [t]racks [I]ndex
    this.tt = inTracks.length;
    this.switchInTrackState(0);
    this.switchOutTrackState(0);
  }

  get inTrack() {
    return this.t[this.itI];
  }
  get outTrack() {
    return this.t[this.tt + this.otI];
  }
  set inTrack(track) {
    this.t[this.itI] = track;
    this.updateSegment();
  }
  set outTrack(track) {
    this.t[this.tt + this.otI] = track;
    this.updateSegment();
  }

  switchInTrackState(index: number) {
    const newItI = Math.max(Math.min(index, this.tt-1), 0);
    if (newItI == this.itI) return true; // no use repeating old action, but technically switched properly
    if (this.c.length != 0) return false; // unable to switch -- train in the way
    
    if (this.itI != -1) this.t[this.itI].outTrack = null;
    this.t[newItI].outTrack = this;
    this.itI = newItI;

    this.updateSegment();
    return true; // switched properly
  }
  switchOutTrackState(index: number) {
    const newOtI = Math.max(Math.min(index, this.t.length - this.tt - 1), 0);
    if (newOtI == this.otI) return true; // no use repeating old action, but technically switched properly
    if (this.c.length != 0) return false; // unable to switch -- train in the way
    
    if (this.otI != -1) this.t[this.otI + this.tt].inTrack = null;
    this.t[newOtI + this.tt].inTrack = this;

    this.otI = newOtI;
    this.updateSegment();
    return true; // switched properly
  }

  // go to next possible switch configuration
  switchNext() {
    const oldItI = this.itI;
    this.switchInTrackState(this.itI + 1);
    if (oldItI == this.itI) { // if nothing happened, reset and increment next
      this.switchInTrackState(0);
      const oldOtI = this.otI;
      this.switchOutTrackState(this.otI + 1);
      if (oldOtI == this.otI) { // if nothing happened, reset
        this.switchOutTrackState(0);
      }
    }
  }

  updateSegment() {
    if (!this.inTrack || !this.outTrack) {
      this.s = new Segment({});
      return;
    }
    this.s = new Segment({
      vector: new Vector({
        x: this.inTrack.segment.x2,
        y: this.inTrack.segment.y2
      }),
      offVector: this.outTrack.segment.origin.sub(
        new Vector({
          x: this.inTrack.segment.x2,
          y: this.inTrack.segment.y2
        })
      )
    });
  }
}


export function generateTracks(vectors) { // Array<Vector>
  let tempTracks = [];
  for (let i = 0; i < vectors.length-1; i++) {
    tempTracks.push(
      new Track({
        segment: new Segment({
          vector: vectors[i],
          offVector: vectors[i+1].add(vectors[i].scale(-1))
        }),
        inTrack: (i == 0) ? null : tempTracks[i-1] // track leading into this track is previous track
      })
    )
    if (i != 0) tempTracks[i-1].outTrack = tempTracks[i]; // last track leads into this track
  };
  return tempTracks;
}

export function addTracks(newTracks: Track[]) { // Array<Track>
  newTracks.forEach((track) => {
    tracks.push(track);
  })
  renderTracks();
}

export function setTracks(newTracks: Track[]) {
  tracks.splice(0);
  addTracks(newTracks);
}

export function appendPoint(point: Vector) { // point is a Vector
  if (tracks.length == 0) tracks.push(new Track({}));
  
  tracks.push(
    new Track({
      segment: new Segment({
        vector: tracks[tracks.length-1].segment.termination,
        offVector: point.add(tracks[tracks.length-1].segment.termination.scale(-1))
      }),
      inTrack: tracks[tracks.length-1]
    })
  );

  if (tracks.length == 1) {
    tracks.splice(0,1); // get rid of temporary track
    tracks[0].inTrack = null;
  }
  else {
    tracks[tracks.length-2].outTrack = tracks[tracks.length-1];
  }
}

export function appendTrack(track) {
  if (tracks.length != 0) {
    const inTrack = tracks[tracks.length-1];
    track.inTrack = inTrack;
    inTrack.outTrack = track;
  }
  addTracks([track]);
}

export function addObject(obj: Obj) {
  objects.push(obj);
  return obj;
}

export function removeObject(obj: Obj) {
  const index = objects.indexOf(obj);
  if (index != -1) objects.splice(index, 1);
  return obj;
}

var mouse = new Vector({});
export var closestTrackData = null;
document.body.addEventListener("mousemove", (e) => {
  mouse = new Vector({
    x: -pos.x + e.pageX,
    y: pos.y - e.pageY
  })

  let minTrack = null;
  let minDistance = Infinity;
  let minA = 0;
  for (let track of tracks) {
    const normalized = mouse.sub(track.segment.origin);
    const angle = normalized.directionFrom(track.segment.offset);
    const distance = normalized.magnitude;

    const cos = Math.cos(angle);
    const mag = track.segment.offset.magnitude;

    const a = Math.max(
      distance * Math.abs(cos) - (
        (cos < 0) ? 0 : mag
      ),
      0
    )
    const b = distance * Math.abs(Math.sin(angle));

    const mouseDistance = a + b;
    if (mouseDistance < minDistance) {
      minDistance = mouseDistance;
      minTrack = track;
      minA = Math.min(Math.max(distance * cos / mag, 0), 1);
    }
  }
  closestTrackData = [minTrack, minA];
});
