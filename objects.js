import { Vector } from "./maths.js";

export class Obj {
  constructor(pos=new Vector({}), color) {
    this.p = pos;
    this.c = color;
  }
  getScreenCoords(offX, offY) { // returns [x,y]
    return [
      this.p.x + offX,
      -this.p.y + offY
    ];
  }
  render(ctx, offX=0, offY=0) {
    ctx.beginPath();
    const oldStyle = ctx.strokeStyle;
    const oldWidth = ctx.lineWidth;
    ctx.strokeStyle = this.c;
    ctx.lineWidth = 2;
    ctx.arc.apply(
      ctx,
      this.getScreenCoords(
        offX,
        offY
      ).concat(
        10,0,Math.PI*2
      )
    );
    ctx.stroke();
    ctx.strokeStyle = oldStyle;
    ctx.lineWidth = oldWidth;
  }

  get rotation() { return 0; }
}

export class Tracer extends Obj {
  constructor({
    color="blue"
  }) {
    super(new Vector({}), color);
    this.h = null;
    this.r = null; // stores old root
    this.f = [];
    this.en = true;
    this.type = 0;
  }
  follow(obj) { this.f.push(obj); }
  unfollow(obj) {
    const index = this.f.indexOf(obj);
    if (index == -1) return;
    this.f.splice(index,1);
  }
  tick() {
    if (!this.en) return false;
    let wasAdjust = false;
    for (let i = 0; i < 100; i++) { // limit to 100 adjustments per tick
      let toAdjust = 0;
      let limitFollower = null;
      this.f.forEach((follower) => {
        const code = follower.tick();
        if (code < toAdjust) {
          limitFollower = follower;
          toAdjust = code;
        }
      });
      if (toAdjust < 0 && this.h != null) {
        this.h = this.h[0].searchForTrack(this.h[1] + (toAdjust * Math.sign(limitFollower.d)));
        if (this.r != this.h[0]) this.reRoot(this.h[0]);
        this.p = this.h[0].getPosAt(this.h[1]);
      }
      else { break; }
      wasAdjust = true;
    }
    return wasAdjust;
  }
  enable() { this.en = true; }
  disable() { this.en = false; }

  get rotation() {
    if (!this.h) return 0;
    return this.h[0].segment.direction;
  }

  reRoot(newRoot) {
    if (this.r) this.r.unRoot(this);
    this.r = newRoot;
    this.r.root(this);
  }
}

export class DragTracer extends Tracer {
  constructor({
    color="blue"
  }) {
    super({ color });
    this.type = 2;
  }
  tick(closestTrack, mag) { // Vector to try and get to
    if (!this.en) return;
    this.p = closestTrack.segment.interpolate(mag);
    this.h = [closestTrack, mag * closestTrack.segment.magnitude]
    if (this.r != this.h[0]) this.reRoot(this.h[0]); 
    super.tick();
  }
}

export class AutoTracer extends Tracer {
  constructor({
    color="blue",
    step=1
  }) {
    super({ color });
    this.l = 0;
    this.s = step;
    this.type = 1;
    this.loop = true;
  }
  tick(originTrack) { // Array<Track>
    if (!this.en) return;
    this.l += this.s;
    const oldP = this.p;
    let oldOffset = (this.h) ? this.h[1] : 0;
    this.h = originTrack.searchForTrack(this.l);
    if (this.r != this.h[0]) this.reRoot(this.h[0]);
    if (this.h[1] < 0) {
      this.h[1] = oldOffset;
      oldOffset = -1;
    }

    this.p = this.h[0].getPosAt(this.h[1]);
    const wasAdjust = super.tick();
    if (wasAdjust || oldOffset == -1) {
      const newPos = originTrack.searchTrackFor(this.h[0]) + this.h[1];
      if (newPos != null) this.l = newPos;
    }
    if (this.s != 0 && this.p.equals(oldP) && this.loop) this.l = 1;

    return wasAdjust || oldOffset == -1;
  }
}

export class LocomotiveTracer extends AutoTracer {
  constructor({
    color="blue"
  }) {
    super({ color, step:0 });
    this.acc = 0;
    this.tAcc = 0;
    this.loop = false;
  }

  setVelocity(step) {
    this.s = step;
    this.tAcc = step;
    this.acc = 0;
  }
  accelerateTo(velocity, acc=0.1) {
    this.tAcc = velocity;
    this.acc = Math.abs(acc) * Math.sign(this.tAcc - this.s);
  }
  get velocity() { return this.s; }
  
  tick(originTrack) {
    this.s += this.acc;
    if (Math.abs(this.s - this.tAcc) < Math.abs(this.acc)) {
      this.acc = 0;
      this.s = this.tAcc;
    }
    if (super.tick(originTrack)) this.setVelocity(0);
  }
}

export class FastFollower extends Obj {
  constructor({
    color="blue",
    leader = new Tracer({}), // either Tracer or Follower
    distance = 20 // positive indicates ahead of leader, negative indicates behind follower
  }) {
    super(new Vector({}), color);
    this.l = leader;
    this.h = null;
    this.d = distance;
    this.r = null; // stores old root
    leader.follow(this);
    this.type = 0;
  }
  tick(offset=0) { // Array<Track>
    if (this.l.h == null) return false;
    this.h = this.l.h[0].searchForTrack(this.l.h[1] + this.d + offset);
    if (this.r != this.h[0]) this.reRoot(this.h[0]);
    this.p = this.h[0].getPosAt(this.h[1]);
    return (this.h[1] < 0) ? (this.d > 0 ? this.h[1] : this.h[1]) : 1;
  }
  follow(obj) { this.l.follow(obj); }
  unfollow(obj) { this.l.unfollow(obj); }
  set leader(leader) { this.l = leader; }
  get leader() { return this.l; }

  get rotation() {
    if (!this.h) return 0;
    return this.h[0].segment.direction;
  }

  reRoot(newRoot) {
    if (this.r) this.r.unRoot(this);
    this.r = newRoot;
    this.r.root(this);
  }
}

export class SlowFollower extends FastFollower {
  constructor({
    color="darkgreen",
    leader = new Tracer({}), // either Tracer or Follower
    distance = 20 // positive indicates ahead of leader, negative indicates behind follower
  }) {
    super({ color, leader, distance });
  }
  tick() { // Array<Track>
    const code = super.tick();
    if (code) {
      if (code < 0) return code;
      let offsetAdd = 0;
      for (let i = 0; i < 100; i++) { // limit to 100 rounds of correction
        let offDistance = Math.abs(this.d) - this.l.p.distanceFrom(this.p);
        if (Math.round(offDistance) == 0) { break; }
        offsetAdd += offDistance;
        const code = super.tick(offsetAdd * Math.sign(this.d));
        // don't try to reposition follower if cannot move further
        if (code < 0) return code / 2; // I literally have no clue why this `/ 2` needs to be here, but it works...
      }
    }
    return 1;
  }
}

export class FloatingFollower extends Obj {
  constructor({
    color="orange",
    leaderA = new Tracer({}), // either tracer or follower
    leaderB = new Tracer({}), // either tracer or follower,
    weight = 0.5 // bias position towards/from either leader (in range [0,1])
  }) {
    super(new Vector({}), color);
    this.l1 = leaderA; // l1/leaderA is the Object to follow
    this.l2 = leaderB;
    this.w = weight;
    this.l1.follow(this);
    this.type = 0;
  }
  tick() {
    this.p = this.l1.p.scale(this.w).add(this.l2.p.scale(1-this.w));
  }
  follow(obj) { this.l1.follow(obj); }
  unfollow(obj) { this.l1.unfollow(obj); }
  set leader(leader) { this.l1 = leader; }
  get leader() { return this.l1; }

  render(ctx, offX=0, offY=0) {
    ctx.beginPath();
    const oldStyle = ctx.strokeStyle;
    const oldWidth = ctx.lineWidth;
    ctx.strokeStyle = this.c;
    ctx.lineWidth = 2;
    ctx.arc.apply(
      ctx,
      this.getScreenCoords(
        offX,
        offY
      ).concat(
        6,0,Math.PI*2
      )
    );
    ctx.moveTo.apply(ctx, this.l1.getScreenCoords(offX,offY));
    ctx.lineTo.apply(ctx, this.getScreenCoords(offX,offY));
    ctx.lineTo.apply(ctx, this.l2.getScreenCoords(offX,offY));    
    ctx.stroke();
    ctx.strokeStyle = oldStyle;
    ctx.lineWidth = oldWidth;
  }

  get h() { return this.l1.h; }
}


export class Box extends Obj {
  constructor({
    bounds=new Vector({ x:10, y:10 }),
    alpha=0.2,
    color="black"
  }) {
    super(new Vector({}), color);
    this.b = bounds;
    this.r = 0;
    this.a = alpha;
  }

  get pos() { return this.p; }
  get rotation() { return this.r; }

  centerOn(pos1, pos2) {
    this.p = pos1.scale(0.5).add(pos2.scale(0.5));
    this.r = -Math.atan2(pos1.y-pos2.y, pos1.x-pos2.x);
  }

  render(ctx, offX=0, offY=0) {
    ctx.beginPath();
    const oldStyle = ctx.strokeStyle;
    const oldFill = ctx.fillStyle;
    const oldWidth = ctx.lineWidth;
    const coords = this.getScreenCoords(offX,offY)

    ctx.strokeStyle = this.c;
    ctx.fillStyle = this.c;
    ctx.lineWidth = 2;
    ctx.translate(coords[0], coords[1]);
    ctx.rotate(this.r);
    ctx.translate(-coords[0], -coords[1]);
    ctx.rect(coords[0] - this.b.x/2, coords[1] - this.b.y/2, this.b.x, this.b.y);
    ctx.stroke();
    ctx.globalAlpha = this.a;
    ctx.fill();

    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset rotation
    ctx.fillStyle = oldFill;
    ctx.strokeStyle = oldStyle;
    ctx.lineWidth = oldWidth;
    ctx.globalAlpha = 1;
  }
}

export class CenteredBox extends Box {
  constructor({
    bounds=new Vector({ x:10, y:10 }),
    color="black",
    alpha=0.2,
    obj1 = new Obj({}),
    obj2 = new Obj({})
  }) {
    super({ bounds, color, alpha });
    this.o1 = obj1;
    this.o2 = obj2;
    this.type = 0;
  }

  tick() {
    this.centerOn(
      this.o1.p,
      this.o2.p
    );
  }
}