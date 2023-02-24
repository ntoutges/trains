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
exports.CenteredBox = exports.Box = exports.FloatingFollower = exports.SlowFollower = exports.FastFollower = exports.LocomotiveTracer = exports.AutoTracer = exports.DragTracer = exports.Tracer = exports.Obj = void 0;
var maths_1 = require("./maths");
var Obj = /** @class */ (function () {
    function Obj(pos, color) {
        if (pos === void 0) { pos = new maths_1.Vector({}); }
        if (color === void 0) { color = "black"; }
        this.p = pos;
        this.c = color;
    }
    Obj.prototype.getScreenCoords = function (offX, offY) {
        return [
            this.p.x + offX,
            -this.p.y + offY
        ];
    };
    Obj.prototype.render = function (ctx, offX, offY) {
        if (offX === void 0) { offX = 0; }
        if (offY === void 0) { offY = 0; }
        ctx.beginPath();
        var oldStyle = ctx.strokeStyle;
        var oldWidth = ctx.lineWidth;
        ctx.strokeStyle = this.c;
        ctx.lineWidth = 2;
        ctx.arc.apply(ctx, this.getScreenCoords(offX, offY).concat(10, 0, Math.PI * 2));
        ctx.stroke();
        ctx.strokeStyle = oldStyle;
        ctx.lineWidth = oldWidth;
    };
    Object.defineProperty(Obj.prototype, "rotation", {
        get: function () { return 0; },
        enumerable: false,
        configurable: true
    });
    return Obj;
}());
exports.Obj = Obj;
var Tracer = /** @class */ (function (_super) {
    __extends(Tracer, _super);
    function Tracer(_a) {
        var _b = _a.color, color = _b === void 0 ? "blue" : _b;
        var _this = _super.call(this, new maths_1.Vector({}), color) || this;
        _this.h = null;
        _this.r = null; // stores old root
        _this.f = [];
        _this.en = true;
        _this.type = 0;
        return _this;
    }
    Tracer.prototype.follow = function (obj) { this.f.push(obj); };
    Tracer.prototype.unfollow = function (obj) {
        var index = this.f.indexOf(obj);
        if (index == -1)
            return;
        this.f.splice(index, 1);
    };
    Tracer.prototype.tick = function () {
        if (!this.en)
            return false;
        var wasAdjust = false;
        var _loop_1 = function (i) {
            var toAdjust = 0;
            var limitFollower = null;
            this_1.f.forEach(function (follower) {
                var code = parseInt(follower.tick().toString());
                if (!isNaN(code) && code < toAdjust) {
                    limitFollower = follower;
                    toAdjust = code;
                }
            });
            if (toAdjust < 0 && this_1.h != null) {
                this_1.h = this_1.h[0].searchForTrack(this_1.h[1] + (toAdjust * Math.sign(limitFollower.d)));
                if (this_1.r != this_1.h[0])
                    this_1.reRoot(this_1.h[0]);
                this_1.p = this_1.h[0].getPosAt(this_1.h[1]);
            }
            else {
                return "break";
            }
            wasAdjust = true;
        };
        var this_1 = this;
        for (var i = 0; i < 100; i++) {
            var state_1 = _loop_1(i);
            if (state_1 === "break")
                break;
        }
        return wasAdjust;
    };
    Tracer.prototype.enable = function () { this.en = true; };
    Tracer.prototype.disable = function () { this.en = false; };
    Object.defineProperty(Tracer.prototype, "rotation", {
        get: function () {
            if (!this.h)
                return 0;
            return this.h[0].segment.direction;
        },
        enumerable: false,
        configurable: true
    });
    Tracer.prototype.reRoot = function (newRoot) {
        if (this.r)
            this.r.unRoot(this);
        this.r = newRoot;
        this.r.root(this);
    };
    return Tracer;
}(Obj));
exports.Tracer = Tracer;
var DragTracer = /** @class */ (function (_super) {
    __extends(DragTracer, _super);
    function DragTracer(_a) {
        var _b = _a.color, color = _b === void 0 ? "blue" : _b;
        var _this = _super.call(this, { color: color }) || this;
        _this.type = 2;
        return _this;
    }
    DragTracer.prototype.tickC = function (closestTrack, mag) {
        if (!this.en)
            return;
        this.p = closestTrack.segment.interpolate(mag);
        this.h = [closestTrack, mag * closestTrack.segment.magnitude];
        if (this.r != this.h[0])
            this.reRoot(this.h[0]);
        _super.prototype.tick.call(this);
    };
    return DragTracer;
}(Tracer));
exports.DragTracer = DragTracer;
var AutoTracer = /** @class */ (function (_super) {
    __extends(AutoTracer, _super);
    function AutoTracer(_a) {
        var _b = _a.color, color = _b === void 0 ? "blue" : _b, _c = _a.step, step = _c === void 0 ? 1 : _c;
        var _this = _super.call(this, { color: color }) || this;
        _this.l = 0;
        _this.s = step;
        _this.type = 1;
        _this.loop = true;
        return _this;
    }
    AutoTracer.prototype.tickO = function (originTrack) {
        if (!this.en)
            return;
        this.l += this.s;
        var oldP = this.p;
        var oldOffset = (this.h) ? this.h[1] : 0;
        this.h = originTrack.searchForTrack(this.l);
        if (this.r != this.h[0])
            this.reRoot(this.h[0]);
        if (this.h[1] < 0) {
            this.h[1] = oldOffset;
            oldOffset = -1;
        }
        this.p = this.h[0].getPosAt(this.h[1]);
        var wasAdjust = _super.prototype.tick.call(this);
        if (wasAdjust || oldOffset == -1) {
            var newPos = originTrack.searchTrackFor(this.h[0]) + this.h[1];
            if (newPos != null)
                this.l = newPos;
        }
        if (this.s != 0 && this.p.equals(oldP) && this.loop)
            this.l = 1;
        return wasAdjust || oldOffset == -1;
    };
    return AutoTracer;
}(Tracer));
exports.AutoTracer = AutoTracer;
var LocomotiveTracer = /** @class */ (function (_super) {
    __extends(LocomotiveTracer, _super);
    function LocomotiveTracer(_a) {
        var _b = _a.color, color = _b === void 0 ? "blue" : _b;
        var _this = _super.call(this, { color: color, step: 0 }) || this;
        _this.acc = 0;
        _this.tAcc = 0;
        _this.loop = false;
        return _this;
    }
    LocomotiveTracer.prototype.setVelocity = function (step) {
        this.s = step;
        this.tAcc = step;
        this.acc = 0;
    };
    LocomotiveTracer.prototype.accelerateTo = function (velocity, acc) {
        if (acc === void 0) { acc = 0.1; }
        this.tAcc = velocity;
        this.acc = Math.abs(acc) * Math.sign(this.tAcc - this.s);
    };
    Object.defineProperty(LocomotiveTracer.prototype, "velocity", {
        get: function () { return this.s; },
        enumerable: false,
        configurable: true
    });
    LocomotiveTracer.prototype.tickO = function (originTrack) {
        this.s += this.acc;
        if (Math.abs(this.s - this.tAcc) < Math.abs(this.acc)) {
            this.acc = 0;
            this.s = this.tAcc;
        }
        if (_super.prototype.tickO.call(this, originTrack))
            this.setVelocity(0);
        return false;
    };
    return LocomotiveTracer;
}(AutoTracer));
exports.LocomotiveTracer = LocomotiveTracer;
var FastFollower = /** @class */ (function (_super) {
    __extends(FastFollower, _super);
    function FastFollower(_a) {
        var _b = _a.color, color = _b === void 0 ? "blue" : _b, _c = _a.leader, leader = _c === void 0 ? new Tracer({}) : _c, // either Tracer or Follower
        _d = _a.distance // positive indicates ahead of leader, negative indicates behind follower
        , // either Tracer or Follower
        distance = _d === void 0 ? 20 : _d // positive indicates ahead of leader, negative indicates behind follower
        ;
        var _this = _super.call(this, new maths_1.Vector({}), color) || this;
        _this.l = leader;
        _this.h = null;
        _this.d = distance;
        _this.r = null; // stores old root
        leader.follow(_this);
        _this.type = 0;
        return _this;
    }
    FastFollower.prototype.tick = function (offset) {
        if (offset === void 0) { offset = 0; }
        if (this.l.h == null)
            return 0; // originally return false
        this.h = this.l.h[0].searchForTrack(this.l.h[1] + this.d + offset);
        if (this.r != this.h[0])
            this.reRoot(this.h[0]);
        this.p = this.h[0].getPosAt(this.h[1]);
        return (this.h[1] < 0) ? (this.d > 0 ? this.h[1] : this.h[1]) : 1;
    };
    FastFollower.prototype.follow = function (obj) { this.l.follow(obj); };
    FastFollower.prototype.unfollow = function (obj) { this.l.unfollow(obj); };
    Object.defineProperty(FastFollower.prototype, "leader", {
        get: function () { return this.l; },
        set: function (leader) { this.l = leader; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FastFollower.prototype, "rotation", {
        get: function () {
            if (!this.h)
                return 0;
            return this.h[0].segment.direction;
        },
        enumerable: false,
        configurable: true
    });
    FastFollower.prototype.reRoot = function (newRoot) {
        if (this.r)
            this.r.unRoot(this);
        this.r = newRoot;
        this.r.root(this);
    };
    return FastFollower;
}(Obj));
exports.FastFollower = FastFollower;
var SlowFollower = /** @class */ (function (_super) {
    __extends(SlowFollower, _super);
    function SlowFollower(_a) {
        var _b = _a.color, color = _b === void 0 ? "darkgreen" : _b, _c = _a.leader, leader = _c === void 0 ? new Tracer({}) : _c, // either Tracer or Follower
        _d = _a.distance // positive indicates ahead of leader, negative indicates behind follower
        , // either Tracer or Follower
        distance = _d === void 0 ? 20 : _d // positive indicates ahead of leader, negative indicates behind follower
        ;
        return _super.call(this, { color: color, leader: leader, distance: distance }) || this;
    }
    SlowFollower.prototype.tick = function () {
        var code = _super.prototype.tick.call(this);
        if (code) {
            if (code < 0)
                return code;
            var offsetAdd = 0;
            for (var i = 0; i < 100; i++) { // limit to 100 rounds of correction
                var offDistance = Math.abs(this.d) - this.l.p.distanceFrom(this.p);
                if (Math.round(offDistance) == 0) {
                    break;
                }
                offsetAdd += offDistance;
                var code_1 = _super.prototype.tick.call(this, offsetAdd * Math.sign(this.d));
                // don't try to reposition follower if cannot move further
                if (code_1 < 0)
                    return code_1 / 2; // I literally have no clue why this `/ 2` needs to be here, but it works...
            }
        }
        return 1;
    };
    return SlowFollower;
}(FastFollower));
exports.SlowFollower = SlowFollower;
var FloatingFollower = /** @class */ (function (_super) {
    __extends(FloatingFollower, _super);
    function FloatingFollower(_a) {
        var _b = _a.color, color = _b === void 0 ? "orange" : _b, _c = _a.leaderA, leaderA = _c === void 0 ? new Tracer({}) : _c, // either tracer or follower
        _d = _a.leaderB, // either tracer or follower
        leaderB = _d === void 0 ? new Tracer({}) : _d, // either tracer or follower,
        _e = _a.weight // bias position towards/from either leader (in range [0,1])
        , // either tracer or follower,
        weight = _e === void 0 ? 0.5 : _e // bias position towards/from either leader (in range [0,1])
        ;
        var _this = _super.call(this, new maths_1.Vector({}), color) || this;
        _this.l1 = leaderA; // l1/leaderA is the Object to follow
        _this.l2 = leaderB;
        _this.w = weight;
        _this.l1.follow(_this);
        _this.type = 0;
        return _this;
    }
    FloatingFollower.prototype.tick = function () {
        this.p = this.l1.p.scale(this.w).add(this.l2.p.scale(1 - this.w));
        return 0;
    };
    FloatingFollower.prototype.follow = function (obj) { this.l1.follow(obj); };
    FloatingFollower.prototype.unfollow = function (obj) { this.l1.unfollow(obj); };
    Object.defineProperty(FloatingFollower.prototype, "leader", {
        get: function () { return this.l1; },
        set: function (leader) { this.l1 = leader; },
        enumerable: false,
        configurable: true
    });
    FloatingFollower.prototype.render = function (ctx, offX, offY) {
        if (offX === void 0) { offX = 0; }
        if (offY === void 0) { offY = 0; }
        ctx.beginPath();
        var oldStyle = ctx.strokeStyle;
        var oldWidth = ctx.lineWidth;
        ctx.strokeStyle = this.c;
        ctx.lineWidth = 2;
        ctx.arc.apply(ctx, this.getScreenCoords(offX, offY).concat(6, 0, Math.PI * 2));
        ctx.moveTo.apply(ctx, this.l1.getScreenCoords(offX, offY));
        ctx.lineTo.apply(ctx, this.getScreenCoords(offX, offY));
        ctx.lineTo.apply(ctx, this.l2.getScreenCoords(offX, offY));
        ctx.stroke();
        ctx.strokeStyle = oldStyle;
        ctx.lineWidth = oldWidth;
    };
    Object.defineProperty(FloatingFollower.prototype, "h", {
        get: function () { return this.l1.h; },
        enumerable: false,
        configurable: true
    });
    return FloatingFollower;
}(Obj));
exports.FloatingFollower = FloatingFollower;
var Box = /** @class */ (function (_super) {
    __extends(Box, _super);
    function Box(_a) {
        var _b = _a.bounds, bounds = _b === void 0 ? new maths_1.Vector({ x: 10, y: 10 }) : _b, _c = _a.alpha, alpha = _c === void 0 ? 0.2 : _c, _d = _a.color, color = _d === void 0 ? "black" : _d;
        var _this = _super.call(this, new maths_1.Vector({}), color) || this;
        _this.b = bounds;
        _this.r = 0;
        _this.a = alpha;
        return _this;
    }
    Object.defineProperty(Box.prototype, "pos", {
        get: function () { return this.p; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Box.prototype, "rotation", {
        get: function () { return this.r; },
        enumerable: false,
        configurable: true
    });
    Box.prototype.centerOn = function (pos1, pos2) {
        this.p = pos1.scale(0.5).add(pos2.scale(0.5));
        this.r = -Math.atan2(pos1.y - pos2.y, pos1.x - pos2.x);
    };
    Box.prototype.render = function (ctx, offX, offY) {
        if (offX === void 0) { offX = 0; }
        if (offY === void 0) { offY = 0; }
        ctx.beginPath();
        var oldStyle = ctx.strokeStyle;
        var oldFill = ctx.fillStyle;
        var oldWidth = ctx.lineWidth;
        var coords = this.getScreenCoords(offX, offY);
        ctx.strokeStyle = this.c;
        ctx.fillStyle = this.c;
        ctx.lineWidth = 2;
        ctx.translate(coords[0], coords[1]);
        ctx.rotate(this.r);
        ctx.translate(-coords[0], -coords[1]);
        ctx.rect(coords[0] - this.b.x / 2, coords[1] - this.b.y / 2, this.b.x, this.b.y);
        ctx.stroke();
        ctx.globalAlpha = this.a;
        ctx.fill();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset rotation
        ctx.fillStyle = oldFill;
        ctx.strokeStyle = oldStyle;
        ctx.lineWidth = oldWidth;
        ctx.globalAlpha = 1;
    };
    return Box;
}(Obj));
exports.Box = Box;
var CenteredBox = /** @class */ (function (_super) {
    __extends(CenteredBox, _super);
    function CenteredBox(_a) {
        var _b = _a.bounds, bounds = _b === void 0 ? new maths_1.Vector({ x: 10, y: 10 }) : _b, _c = _a.color, color = _c === void 0 ? "black" : _c, _d = _a.alpha, alpha = _d === void 0 ? 0.2 : _d, _e = _a.obj1, obj1 = _e === void 0 ? new Obj() : _e, _f = _a.obj2, obj2 = _f === void 0 ? new Obj() : _f;
        var _this = _super.call(this, { bounds: bounds, color: color, alpha: alpha }) || this;
        _this.o1 = obj1;
        _this.o2 = obj2;
        _this.type = 0;
        return _this;
    }
    CenteredBox.prototype.tick = function () {
        this.centerOn(this.o1.p, this.o2.p);
    };
    return CenteredBox;
}(Box));
exports.CenteredBox = CenteredBox;
//# sourceMappingURL=objects.js.map