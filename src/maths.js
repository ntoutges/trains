"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVectorList = exports.Segment = exports.Vector = void 0;
var Vector = /** @class */ (function () {
    function Vector(_a) {
        var _b = _a.x, x = _b === void 0 ? 0 : _b, _c = _a.y, y = _c === void 0 ? 0 : _c;
        this.x = x;
        this.y = y;
    }
    Object.defineProperty(Vector.prototype, "magnitude", {
        get: function () { return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2)); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Vector.prototype, "direction", {
        get: function () {
            var dir = Math.atan2(this.y, this.x);
            if (dir < 0)
                dir += 2 * Math.PI; // turn [-PI,PI] range into [0,TAU]
            return dir;
        },
        enumerable: false,
        configurable: true
    });
    Vector.prototype.add = function (vector) {
        return new Vector({
            x: this.x + vector.x,
            y: this.y + vector.y
        });
    };
    Vector.prototype.sub = function (vector) {
        return new Vector({
            x: this.x - vector.x,
            y: this.y - vector.y
        });
    };
    Vector.prototype.scale = function (scale) {
        return new Vector({
            x: this.x * scale,
            y: this.y * scale
        });
    };
    Vector.prototype.equals = function (vector) { return this.x == vector.x && this.y == vector.y; };
    Vector.prototype.isZero = function () { return this.x == 0 && this.y == 0; };
    Vector.prototype.distanceFrom = function (vector) { return Math.sqrt(Math.pow(this.x - vector.x, 2) + Math.pow(this.y - vector.y, 2)); };
    Vector.prototype.directionFrom = function (vector) { return this.direction - vector.direction; };
    return Vector;
}());
exports.Vector = Vector;
var Segment = /** @class */ (function () {
    function Segment(_a) {
        var _b = _a.vector, vector = _b === void 0 ? new Vector({}) : _b, _c = _a.offVector, offVector = _c === void 0 ? new Vector({}) : _c;
        this.v = vector;
        this.o = offVector;
    }
    Object.defineProperty(Segment.prototype, "origin", {
        get: function () { return this.v; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Segment.prototype, "offset", {
        get: function () { return this.o; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Segment.prototype, "termination", {
        get: function () { return this.v.add(this.o); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Segment.prototype, "x1", {
        get: function () { return this.v.x; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Segment.prototype, "x2", {
        get: function () { return this.v.x + this.o.x; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Segment.prototype, "y1", {
        get: function () { return this.v.y; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Segment.prototype, "y2", {
        get: function () { return this.v.y + this.o.y; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Segment.prototype, "magnitude", {
        get: function () { return this.o.magnitude; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Segment.prototype, "direction", {
        get: function () { return this.o.direction; },
        enumerable: false,
        configurable: true
    });
    Segment.prototype.interpolate = function (percent) {
        return this.v.add(this.o.scale(percent));
    };
    return Segment;
}());
exports.Segment = Segment;
function generateVectorList(points) {
    var vectors = [];
    points.forEach(function (pair) {
        vectors.push(new Vector({
            x: pair[0],
            y: pair[1]
        }));
    });
    return vectors;
}
exports.generateVectorList = generateVectorList;
//# sourceMappingURL=maths.js.map