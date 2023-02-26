import { Vector, Segment, sign } from "./maths.js";
import { onMove, pos } from "./grid.js";
const trackElement = $("#background-tracks");
const ctx = trackElement.get(0).getContext("2d");
const trackElWidth = $("#background-tracks").width();
const trackElHeight = $("#background-tracks").height();
trackElement.attr("width", trackElWidth);
trackElement.attr("height", trackElHeight);
ctx.strokeStyle = "blue";
onMove(renderTracks);
export function renderTracks() {
    ctx.clearRect(0, 0, trackElWidth, trackElHeight);
    ctx.beginPath();
    tracks.forEach((track) => {
        ctx.moveTo(track.segment.x1 + pos.x, -track.segment.y1 + pos.y);
        ctx.lineTo(track.segment.x2 + pos.x, -track.segment.y2 + pos.y);
    });
    ctx.stroke();
    renderObjects();
}
;
function renderObjects() {
    objects.forEach((obj) => {
        obj.render(ctx, pos.x, pos.y);
    });
}
export const tracks = [];
var objects = [];
export class Track {
    constructor({ segment = new Segment({}), inTrack = null, // instance of Track
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
    searchForTrack(distance) {
        let dir = sign(distance);
        let skipFirstItt = dir < 0;
        distance = Math.abs(distance);
        let currentTrack = this;
        while (true) {
            if (!skipFirstItt) { // effectively skip first itteration of loop
                distance -= currentTrack.length;
            }
            else
                skipFirstItt = false;
            if (distance <= 0) {
                return (dir >= 0) ? [currentTrack, distance + currentTrack.length] : [currentTrack, -distance];
            }
            if (currentTrack.getTrackInDir(dir) == null) {
                return (dir > 0) ? [currentTrack, -distance] : [currentTrack, -distance];
            }
            currentTrack = currentTrack.getTrackInDir(dir);
        }
    }
    searchTrackFor(track) {
        let foreDistance = 0;
        let backDistance = 0;
        let forewardTrack = this;
        let backwardTrack = this.inTrack;
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
        if (forewardTrack == track)
            return foreDistance;
        else if (backwardTrack == track)
            return backDistance - backwardTrack.length;
        return null;
    }
    getTrackInDir(direction) {
        return (direction < 0) ? this.inTrack : this.outTrack;
    }
    getPosAt(distance) {
        const percent = Math.min(Math.max(distance / this.length, 0), 1); // constrains [percent] within range [0,1]
        return this.segment.interpolate(percent);
    }
    root(train) {
        this.c.push(train);
    }
    unRoot(train) {
        const index = this.c.indexOf(train);
        if (index == -1)
            return;
        this.c.splice(index, 1);
    }
}
export class BridgeTrack extends Track {
    constructor({ inTrackA = null, inTrackB = null, outTrackA = null, outTrackB = null }) {
        super({});
        this.t = [inTrackA, outTrackA, inTrackB, outTrackB];
        this.itA = true; // [i]n [t]rack [A]
        this.otA = true; // [o]ut [t]rack [B]
        this.switchInTrackState(false);
        this.switchOutTrackState(true);
    }
    get inTrack() { return this.t[this.itA ? 0 : 2]; }
    get outTrack() { return this.t[this.otA ? 1 : 3]; }
    set inTrack(track) {
        this.t[this.itA ? 0 : 2] = track;
        this.updateSegment();
    }
    set outTrack(track) {
        this.t[this.otA ? 1 : 3] = track;
        this.updateSegment();
    }
    switchInTrackState(state) {
        if (this.c.length != 0)
            return false; // unable to switch -- train in the way
        this.itA = state;
        if (this.t[0])
            this.t[0].outTrack = state ? this : null;
        if (this.t[2])
            this.t[2].outTrack = state ? null : this;
        this.updateSegment();
        return true; // switched properly
    }
    switchOutTrackState(state) {
        if (this.c.length != 0)
            return false; // unable to switch -- train in the way
        this.otA = state;
        if (this.t[1])
            this.t[1].inTrack = state ? this : null;
        if (this.t[3])
            this.t[3].inTrack = state ? null : this;
        this.updateSegment();
        return false; // switched properly
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
            offVector: this.outTrack.segment.origin.sub(new Vector({
                x: this.inTrack.segment.x2,
                y: this.inTrack.segment.y2
            }))
        });
    }
}
export function generateTracks(vectors) {
    let tempTracks = [];
    for (let i = 0; i < vectors.length - 1; i++) {
        tempTracks.push(new Track({
            segment: new Segment({
                vector: vectors[i],
                offVector: vectors[i + 1].add(vectors[i].scale(-1))
            }),
            inTrack: (i == 0) ? null : tempTracks[i - 1] // track leading into this track is previous track
        }));
        if (i != 0)
            tempTracks[i - 1].outTrack = tempTracks[i]; // last track leads into this track
    }
    ;
    return tempTracks;
}
export function addTracks(newTracks) {
    newTracks.forEach((track) => {
        tracks.push(track);
    });
    renderTracks();
}
export function setTracks(newTracks) {
    tracks.splice(0);
    addTracks(newTracks);
}
export function appendPoint(point) {
    if (tracks.length == 0)
        tracks.push(new Track({}));
    tracks.push(new Track({
        segment: new Segment({
            vector: tracks[tracks.length - 1].segment.termination,
            offVector: point.add(tracks[tracks.length - 1].segment.termination.scale(-1))
        }),
        inTrack: tracks[tracks.length - 1]
    }));
    if (tracks.length == 1) {
        tracks.splice(0, 1); // get rid of temporary track
        tracks[0].inTrack = null;
    }
    else {
        tracks[tracks.length - 2].outTrack = tracks[tracks.length - 1];
    }
}
export function appendTrack(track) {
    if (tracks.length != 0) {
        const inTrack = tracks[tracks.length - 1];
        track.inTrack = inTrack;
        inTrack.outTrack = track;
    }
    addTracks([track]);
}
export function addObject(obj) {
    objects.push(obj);
    return obj;
}
export function removeObject(obj) {
    const index = objects.indexOf(obj);
    if (index != -1)
        objects.splice(index, 1);
    return obj;
}
// contains no switches
// export class TrackNetwork {
//   constructor(vectors) { // Array<Vector>
//     this.t = [];
//     for (let i = 0; i < vectors.length-1; i++) {
//       this.t.push(
//         new Track({
//           segment: new Segment({
//             vector: vectors[i],
//             offVector: vectors[i+1].add(vectors[i].scale(-1))
//           }),
//           inTrack: (i == 0) ? null : this.t[i-1] // track leading into this track is previous track
//         })
//       )
//       if (i != 0) this.t[i-1].outTrack = this.t[i]; // last track leads into this track
//     };
//   }
// }
// export class TrackSystem {
//   constructor({
//     networks,
//     switches
//   }) {
//   }
// }
var mouse = new Vector({});
export var closestTrackData = null;
document.body.addEventListener("mousemove", (e) => {
    mouse = new Vector({
        x: -pos.x + e.pageX,
        y: pos.y - e.pageY
    });
    let minTrack = null;
    let minDistance = Infinity;
    let minA = 0;
    for (let track of tracks) {
        const normalized = mouse.sub(track.segment.origin);
        const angle = normalized.directionFrom(track.segment.offset);
        const distance = normalized.magnitude;
        const cos = Math.cos(angle);
        const mag = track.segment.offset.magnitude;
        const a = Math.max(distance * Math.abs(cos) - ((cos < 0) ? 0 : mag), 0);
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
//# sourceMappingURL=tracks.js.map