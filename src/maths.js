export class Vector {
  constructor({
    x=0,
    y=0
  }) {
    this.x = x;
    this.y = y;
    Object.freeze(this); // enforce immutable pos
  }

  get magnitude() { return Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2)); }
  get direction() {
    let dir = Math.atan2(this.y, this.x);
    if (dir < 0) dir += 2 * Math.PI; // turn [-PI,PI] range into [0,TAU]
    return dir;
  }

  add(vector) {
    return new Vector({
      x: this.x + vector.x,
      y: this.y + vector.y
    });
  }
  sub(vector) {
    return new Vector({
      x: this.x - vector.x,
      y: this.y - vector.y
    });
  }

  scale(scale) {
    return new Vector({
      x: this.x * scale,
      y: this.y * scale
    });
  }

  equals(vector) { return this.x == vector.x && this.y == vector.y; }

  isZero() { return this.x == 0 && this.y == 0; }

  distanceFrom(vector) { return Math.sqrt(Math.pow(this.x-vector.x,2) + Math.pow(this.y-vector.y,2)); }
  directionFrom(vector) { return this.direction - vector.direction; }
}

export class Segment {
  constructor({
    vector=new Vector({}),
    offVector=new Vector({})
  }) { // both parameters are instances of [Vector]
    this.v = vector;
    this.o = offVector;
    Object.freeze(this)
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

  interpolate(percent) { // value in range [0,1]
    return this.v.add( this.o.scale(percent) );
  }
}

export function generateVectorList(points) { // Array<[x,y]>
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