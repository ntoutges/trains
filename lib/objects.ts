import { Vector, sign } from "./maths.js";
import { Track } from "./tracks.js";

export type StrictFollowers = FastFollower | Tracer;
export type Followers = StrictFollowers | FloatingFollower;
export type Tickable = Followers | CenteredBox;
export type ObjHeader = [track: Track, extra: number] | null;

export class Obj {
  public p: Vector;
  public c: string;
  constructor(pos=new Vector({}), color:string="black") {
    this.p = pos;
    this.c = color;
  }
  getScreenCoords(offX: number, offY: number, zoom: number): [x: number, y:number] {
    return [
      (this.p.x + offX) / zoom,
      (-this.p.y + offY) / zoom
    ];
  }
  render(ctx: CanvasRenderingContext2D, offX:number=0, offY:number=0, zoom: number=1) {
    ctx.beginPath();
    const oldStyle = ctx.strokeStyle;
    const oldWidth = ctx.lineWidth;
    ctx.strokeStyle = this.c;
    ctx.lineWidth = 2;
    ctx.arc.apply(
      ctx,
      this.getScreenCoords(
        offX,
        offY,
        zoom
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
  public h: ObjHeader
  public r: Track | null;
  public f: Array<Followers>;
  public en: boolean;
  public type: number;
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
  follow(obj: Followers) { this.f.push(obj); }
  unfollow(obj: Followers) {
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
        const code = parseInt(follower.tick().toString());
        if (!isNaN(code) && code < toAdjust) {
          limitFollower = follower;
          toAdjust = code;
        }
      });
      if (toAdjust < 0 && this.h != null) {
        this.h = this.h[0].searchForTrack(this.h[1] + (toAdjust * sign(limitFollower.d)));
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

  reRoot(newRoot: Track) {
    if (this.r) this.r.unRoot(this);
    this.r = newRoot;
    this.r.root(this);
  }

  // these are solely to prevent TS errors
  get leader() { return null; }
  set leader(newLader) { return; }
}

export class DragTracer extends Tracer {
  constructor({
    color="blue"
  }) {
    super({ color });
    this.type = 2;
  }
  tickC(closestTrack: Track, mag: number) { // Vector to try and get to
    if (!this.en) return;
    this.p = closestTrack.segment.interpolate(mag);
    this.h = [closestTrack, mag * closestTrack.segment.magnitude]
    if (this.r != this.h[0]) this.reRoot(this.h[0]); 
    super.tick();
  }
}

export class AutoTracer extends Tracer {
  public l: number;
  public s: number;
  public loop: boolean;
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
  tickO(originTrack) { // Array<Track>
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
  public acc: number;
  public tAcc: number;
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
    this.acc = Math.abs(acc) * sign(this.tAcc - this.s);
  }
  get velocity() { return this.s; }
  
  tickO(originTrack) {
    this.s += this.acc;
    if (Math.abs(this.s - this.tAcc) < Math.abs(this.acc)) {
      this.acc = 0;
      this.s = this.tAcc;
    }
    if (super.tickO(originTrack)) this.setVelocity(0);
    return false;
  }
}

interface FastFollowerInterface {
  leader: Followers
  color?: string
  distance?: number
}

export class FastFollower extends Obj {
  public l: Followers;
  public h: [track: Track, extra: number] | null;
  public d: number;
  public r: Track | null;
  public type: number;
  constructor({
    leader,
    color="blue",
    distance = 20 // positive indicates ahead of leader, negative indicates behind follower
  }: FastFollowerInterface) {
    super(new Vector({}), color);
    this.l = leader;
    this.h = null;
    this.d = distance;
    this.r = null; // stores old root
    leader.follow(this);
    this.type = 0;
  }
  tick(offset=0) { // Array<Track>
    if (this.l.h == null) return 0; // originally return false
    this.h = this.l.h[0].searchForTrack(this.l.h[1] + this.d + offset);
    if (this.r != this.h[0]) this.reRoot(this.h[0]);
    this.p = this.h[0].getPosAt(this.h[1]);
    return (this.h[1] < 0) ? (this.d > 0 ? this.h[1] : this.h[1]) : 1;
  }
  follow(obj: Followers) { this.l.follow(obj); }
  unfollow(obj: Followers) { this.l.unfollow(obj); }
  set leader(leader) { this.l = leader; }
  get leader() { return this.l; }

  get rotation() {
    if (!this.h) return 0;
    return this.h[0].segment.direction;
  }

  reRoot(newRoot: Track) {
    if (this.r) this.r.unRoot(this);
    this.r = newRoot;
    this.r.root(this);
  }
}

export class SlowFollower extends FastFollower {
  constructor({
    leader,
    color="darkgreen",
    distance = 20 // positive indicates ahead of leader, negative indicates behind follower
  }: FastFollowerInterface) {
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
        const code = super.tick(offsetAdd * sign(this.d));
        // don't try to reposition follower if cannot move further
        if (code < 0) return code / 2; // I literally have no clue why this `/ 2` needs to be here, but it works...
      }
    }
    return 1;
  }
}

interface FloatingFollowerInterface {
  leaderA: Followers
  leaderB: Followers
  color?: string
  weight?: number
}

export class FloatingFollower extends Obj {
  l1: Followers;
  l2: Followers;
  public type: number;
  readonly w: number;
  constructor({
    color="orange",
    leaderA = new Tracer({}), // either tracer or follower
    leaderB = new Tracer({}), // either tracer or follower,
    weight = 0.5 // bias position towards/from either leader (in range [0,1])
  }: FloatingFollowerInterface) {
    super(new Vector({}), color);
    this.l1 = leaderA; // l1/leaderA is the Object to follow
    this.l2 = leaderB;
    this.w = weight;
    this.l1.follow(this);
    this.type = 0;
  }
  tick() {
    this.p = this.l1.p.scale(this.w).add(this.l2.p.scale(1-this.w));
    return 0;
  }
  follow(obj) { this.l1.follow(obj); }
  unfollow(obj) { this.l1.unfollow(obj); }
  set leader(leader) { this.l1 = leader; }
  get leader() { return this.l1; }

  render(ctx, offX=0, offY=0, zoom=1) {
    ctx.beginPath();
    const oldStyle = ctx.strokeStyle;
    const oldWidth = ctx.lineWidth;
    ctx.strokeStyle = this.c;
    ctx.lineWidth = 2;
    ctx.arc.apply(
      ctx,
      this.getScreenCoords(
        offX,
        offY,
        zoom
      ).concat(
        6,0,Math.PI*2
      )
    );
    ctx.moveTo.apply(ctx, this.l1.getScreenCoords(offX,offY,zoom));
    ctx.lineTo.apply(ctx, this.getScreenCoords(offX,offY,zoom));
    ctx.lineTo.apply(ctx, this.l2.getScreenCoords(offX,offY,zoom));    
    ctx.stroke();
    ctx.strokeStyle = oldStyle;
    ctx.lineWidth = oldWidth;
  }

  get h() { return this.l1.h; }
  set h(newHeader) { this.l1.h = newHeader; }
}


export class Box extends Obj {
  public b: Vector;
  public r: number;
  public a: number;
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

  centerOn(pos1: Vector, pos2: Vector) {
    this.p = pos1.scale(0.5).add(pos2.scale(0.5));
    this.r = -Math.atan2(pos1.y-pos2.y, pos1.x-pos2.x);
  }

  render(ctx, offX=0, offY=0, zoom=1) {
    ctx.beginPath();
    const oldStyle = ctx.strokeStyle;
    const oldFill = ctx.fillStyle;
    const oldWidth = ctx.lineWidth;
    const coords = this.getScreenCoords(offX,offY,zoom)

    ctx.strokeStyle = this.c;
    ctx.fillStyle = this.c;
    ctx.lineWidth = 2;
    ctx.translate(coords[0], coords[1]);
    ctx.rotate(this.r);
    ctx.translate(-coords[0], -coords[1]);
    ctx.rect(coords[0] - this.b.x/(2*zoom), coords[1] - this.b.y/(2*zoom), this.b.x / zoom, this.b.y / zoom);
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
  public o1: Obj;
  public o2: Obj;
  public type: number;
  constructor({
    bounds=new Vector({ x:10, y:10 }),
    color="black",
    alpha=0.2,
    obj1 = new Obj(),
    obj2 = new Obj()
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