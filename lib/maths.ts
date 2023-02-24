export class Vector {
  readonly x: number;
  readonly y: number;
  constructor({
    x=0,
    y=0
  }) {
    this.x = x;
    this.y = y;
  }

  get magnitude() { return Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2)); }
  get direction() {
    let dir = Math.atan2(this.y, this.x);
    if (dir < 0) dir += 2 * Math.PI; // turn [-PI,PI] range into [0,TAU]
    return dir;
  }

  add(vector: Vector) {
    return new Vector({
      x: this.x + vector.x,
      y: this.y + vector.y
    });
  }
  sub(vector: Vector) {
    return new Vector({
      x: this.x - vector.x,
      y: this.y - vector.y
    });
  }

  scale(scale: number) {
    return new Vector({
      x: this.x * scale,
      y: this.y * scale
    });
  }

  equals(vector: Vector) { return this.x == vector.x && this.y == vector.y; }

  isZero() { return this.x == 0 && this.y == 0; }

  distanceFrom(vector: Vector) { return Math.sqrt(Math.pow(this.x-vector.x,2) + Math.pow(this.y-vector.y,2)); }
  directionFrom(vector: Vector) { return this.direction - vector.direction; }
}

export class Segment {
  private readonly v: Vector;
  private readonly o: Vector;
  constructor({
    vector=new Vector({}),
    offVector=new Vector({})
  }) { // both parameters are instances of [Vector]
    this.v = vector;
    this.o = offVector;
  }

  get origin() { return this.v; }
  get offset() { return this.o; }
  get termination() { return this.v.add(this.o); }

  get x1() { return this.v.x; }
  get x2() { return this.v.x + this.o.x; }
  get y1() { return this.v.y; }
  get y2() { return this.v.y + this.o.y; }
  get magnitude() { return this.o.magnitude; }
  get direction() { return this.o.direction; }

  interpolate(percent: number) { // value in range [0,1]
    return this.v.add( this.o.scale(percent) );
  }
}

export function generateVectorList(points: Array<[x: number, y:number]>): Array<Vector> {
  const vectors = [];
  points.forEach((pair) => {
    vectors.push(
      new Vector({
        x: pair[0],
        y: pair[1]
      })
    );
  });
  return vectors;
}

export function sign(number: number) { return (number > 0) ? 1 : ((number < 0) ? -1 : 0); }