"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.closestTrackData = exports.removeObject = exports.addObject = exports.appendTrack = exports.appendPoint = exports.setTracks = exports.addTracks = exports.generateTracks = exports.BridgeTrack = exports.Track = exports.tracks = exports.renderTracks = void 0;
var maths_1 = require("./maths");
var grid_1 = require("./grid");
var trackElement = $("#background-tracks");
var ctx = trackElement.get(0).getContext("2d");
var trackElWidth = $("#background-tracks").width();
var trackElHeight = $("#background-tracks").height();
trackElement.attr("width", trackElWidth);
trackElement.attr("height", trackElHeight);
ctx.strokeStyle = "blue";
(0, grid_1.onMove)(renderTracks);
function renderTracks() {
    ctx.clearRect(0, 0, trackElWidth, trackElHeight);
    ctx.beginPath();
    exports.tracks.forEach(function (track) {
        ctx.moveTo(track.segment.x1 + grid_1.pos.x, -track.segment.y1 + grid_1.pos.y);
        ctx.lineTo(track.segment.x2 + grid_1.pos.x, -track.segment.y2 + grid_1.pos.y);
    });
    ctx.stroke();
    renderObjects();
}
exports.renderTracks = renderTracks;
;
function renderObjects() {
    objects.forEach(function (obj) {
        obj.render(ctx, grid_1.pos.x, grid_1.pos.y);
    });
}
exports.tracks = [];
var objects = [];
var Track = /** @class */ (function () {
    function Track(_a) {
        var _b = _a.segment, segment = _b === void 0 ? new maths_1.Segment({}) : _b, _c = _a.inTrack, inTrack = _c === void 0 ? null : _c, // instance of Track
        _d = _a.outTrack // instance of Track
        , // instance of Track
        outTrack = _d === void 0 ? null : _d // instance of Track
        ;
        this.s = segment;
        this.t = [inTrack, outTrack]; // [in,out]
        this.c = []; // [c]hild trains (trains which have this set as their root)
    }
    Object.defineProperty(Track.prototype, "segment", {
        get: function () { return this.s; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Track.prototype, "inTrack", {
        get: function () { return this.t[0]; },
        set: function (track) { this.t[0] = track; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Track.prototype, "outTrack", {
        get: function () { return this.t[1]; },
        set: function (track) { this.t[1] = track; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Track.prototype, "length", {
        get: function () { return this.segment.magnitude; },
        enumerable: false,
        configurable: true
    });
    Track.prototype.searchForTrack = function (distance) {
        var dir = Math.sign(distance);
        var skipFirstItt = dir < 0;
        distance = Math.abs(distance);
        var currentTrack = this;
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
    };
    Track.prototype.searchTrackFor = function (track) {
        var foreDistance = 0;
        var backDistance = 0;
        var forewardTrack = this;
        var backwardTrack = this.inTrack;
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
    };
    Track.prototype.getTrackInDir = function (direction) {
        return (direction < 0) ? this.inTrack : this.outTrack;
    };
    Track.prototype.getPosAt = function (distance) {
        var percent = Math.min(Math.max(distance / this.length, 0), 1); // constrains [percent] within range [0,1]
        return this.segment.interpolate(percent);
    };
    Track.prototype.root = function (train) {
        this.c.push(train);
    };
    Track.prototype.unRoot = function (train) {
        var index = this.c.indexOf(train);
        if (index == -1)
            return;
        this.c.splice(index, 1);
    };
    return Track;
}());
exports.Track = Track;
var BridgeTrack = /** @class */ (function (_super) {
    __extends(BridgeTrack, _super);
    function BridgeTrack(_a) {
        var _b = _a.inTrackA, inTrackA = _b === void 0 ? null : _b, _c = _a.inTrackB, inTrackB = _c === void 0 ? null : _c, _d = _a.outTrackA, outTrackA = _d === void 0 ? null : _d, _e = _a.outTrackB, outTrackB = _e === void 0 ? null : _e;
        var _this = _super.call(this, {}) || this;
        _this.t = [inTrackA, outTrackA, inTrackB, outTrackB];
        _this.itA = true; // [i]n [t]rack [A]
        _this.otA = true; // [o]ut [t]rack [B]
        _this.switchInTrackState(false);
        _this.switchOutTrackState(true);
        return _this;
    }
    Object.defineProperty(BridgeTrack.prototype, "inTrack", {
        get: function () { return this.t[this.itA ? 0 : 2]; },
        set: function (track) {
            this.t[this.itA ? 0 : 2] = track;
            this.updateSegment();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BridgeTrack.prototype, "outTrack", {
        get: function () { return this.t[this.otA ? 1 : 3]; },
        set: function (track) {
            this.t[this.otA ? 1 : 3] = track;
            this.updateSegment();
        },
        enumerable: false,
        configurable: true
    });
    BridgeTrack.prototype.switchInTrackState = function (state) {
        if (this.c.length != 0)
            return false; // unable to switch -- train in the way
        this.itA = state;
        if (this.t[0])
            this.t[0].outTrack = state ? this : null;
        if (this.t[2])
            this.t[2].outTrack = state ? null : this;
        this.updateSegment();
        return true; // switched properly
    };
    BridgeTrack.prototype.switchOutTrackState = function (state) {
        if (this.c.length != 0)
            return false; // unable to switch -- train in the way
        this.otA = state;
        if (this.t[1])
            this.t[1].inTrack = state ? this : null;
        if (this.t[3])
            this.t[3].inTrack = state ? null : this;
        this.updateSegment();
        return false; // switched properly
    };
    BridgeTrack.prototype.updateSegment = function () {
        if (!this.inTrack || !this.outTrack) {
            this.s = new maths_1.Segment({});
            return;
        }
        this.s = new maths_1.Segment({
            vector: new maths_1.Vector({
                x: this.inTrack.segment.x2,
                y: this.inTrack.segment.y2
            }),
            offVector: this.outTrack.segment.origin.sub(new maths_1.Vector({
                x: this.inTrack.segment.x2,
                y: this.inTrack.segment.y2
            }))
        });
    };
    return BridgeTrack;
}(Track));
exports.BridgeTrack = BridgeTrack;
function generateTracks(vectors) {
    var tempTracks = [];
    for (var i = 0; i < vectors.length - 1; i++) {
        tempTracks.push(new Track({
            segment: new maths_1.Segment({
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
exports.generateTracks = generateTracks;
function addTracks(newTracks) {
    newTracks.forEach(function (track) {
        exports.tracks.push(track);
    });
    renderTracks();
}
exports.addTracks = addTracks;
function setTracks(newTracks) {
    exports.tracks.splice(0);
    addTracks(newTracks);
}
exports.setTracks = setTracks;
function appendPoint(point) {
    if (exports.tracks.length == 0)
        exports.tracks.push(new Track({}));
    exports.tracks.push(new Track({
        segment: new maths_1.Segment({
            vector: exports.tracks[exports.tracks.length - 1].segment.termination,
            offVector: point.add(exports.tracks[exports.tracks.length - 1].segment.termination.scale(-1))
        }),
        inTrack: exports.tracks[exports.tracks.length - 1]
    }));
    if (exports.tracks.length == 1) {
        exports.tracks.splice(0, 1); // get rid of temporary track
        exports.tracks[0].inTrack = null;
    }
    else {
        exports.tracks[exports.tracks.length - 2].outTrack = exports.tracks[exports.tracks.length - 1];
    }
}
exports.appendPoint = appendPoint;
function appendTrack(track) {
    if (exports.tracks.length != 0) {
        var inTrack = exports.tracks[exports.tracks.length - 1];
        track.inTrack = inTrack;
        inTrack.outTrack = track;
    }
    addTracks([track]);
}
exports.appendTrack = appendTrack;
function addObject(obj) {
    objects.push(obj);
    return obj;
}
exports.addObject = addObject;
function removeObject(obj) {
    var index = objects.indexOf(obj);
    if (index != -1)
        objects.splice(index, 1);
    return obj;
}
exports.removeObject = removeObject;
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
var mouse = new maths_1.Vector({});
exports.closestTrackData = null;
document.body.addEventListener("mousemove", function (e) {
    mouse = new maths_1.Vector({
        x: -grid_1.pos.x + e.pageX,
        y: grid_1.pos.y - e.pageY
    });
    var minTrack = null;
    var minDistance = Infinity;
    var minA = 0;
    for (var _i = 0, tracks_1 = exports.tracks; _i < tracks_1.length; _i++) {
        var track = tracks_1[_i];
        var normalized = mouse.sub(track.segment.origin);
        var angle = normalized.directionFrom(track.segment.offset);
        var distance = normalized.magnitude;
        var cos = Math.cos(angle);
        var mag = track.segment.offset.magnitude;
        var a = Math.max(distance * Math.abs(cos) - ((cos < 0) ? 0 : mag), 0);
        var b = distance * Math.abs(Math.sin(angle));
        var mouseDistance = a + b;
        if (mouseDistance < minDistance) {
            minDistance = mouseDistance;
            minTrack = track;
            minA = Math.min(Math.max(distance * cos / mag, 0), 1);
        }
    }
    exports.closestTrackData = [minTrack, minA];
});
//# sourceMappingURL=tracks.js.map