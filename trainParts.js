import * as grid from "./grid.js";
import * as tracks from "./tracks.js";
import * as obj from "./objects.js";
import { Vector } from "./maths.js";

const conatiner = $("#train-parts-container");
// const trainParts = [];

// export function addTrainPart(part) {
//   trainParts.push(part);
//   return part;
// }

// export function removeTrainPart(part) {
//   const index = trainParts.indexOf(part);
//   if (index != -1) trainParts.splice(index, 1);
//   return part;
// }

export class TrainPart {
  constructor({
    source="missing.png",
    object,
    size=new Vector({ x: 50, y:50 })
  }) {
    this.o = object;
    this.s = source;
    this.b = size;
    this.e = $(`<img src=\"graphics/${source}\" class=\"trainParts\" style=\"width:${size.x}px;height:${size.y}px;\"></img>`);
    conatiner.append(this.e);
  }
  tick(...params) {
    this.o.tick.apply(this.o, params);
    // this.updateGraphics(true);
  }
  updateGraphics(updateRotation=true) {
    const [x,y] = this.o.getScreenCoords(grid.pos.x, grid.pos.y);
    this.e.css("left", x-this.b.x/2);
    this.e.css("top", y-this.b.y/2);
    if (updateRotation) this.updateRotation(-this.o.rotation);
  }
  updateRotation(rotation) { this.e.css("transform", `rotate(${rotation}rad)`); }

  get rotation() { return this.o.rotation; }
  get type() { return this.o.type; }

  remove() {
    this.e.remove();
    tracks.removeObject(this.o);
  }

  hide() { this.e.css("display", "none"); }
  show() { this.e.css("display", "block"); }
}

export class TrainParts {
  constructor({
    parts = [], // part at index 0 needs to be the leader Object, and index (len-1) must be follower Object
    objects = []
  }) {
    this.p = parts;
    this.ob = objects; // separate objects than exist in [parts]
  }
  tick(...params) {
    this.p[0].tick.apply(this.p[0], params);
    // for (let i = 1; i < this.p.length; i++) { this.p[i].updateGraphics(false); }
    for (let ob of this.ob) { ob.tick(); }
    // this.updateRotation();
  }
  updateGraphics(updateRotation) {
    for (const part of this.p) { part.updateGraphics(false); }
    if (updateRotation) this.updateRotation();
  }
  updateRotation() {
    if (this.p.length >= 2) {
      const rotation = Math.atan2(this.p[0].o.p.y-this.p[1].o.p.y, this.p[0].o.p.x-this.p[1].o.p.x)
      for (let part of this.p) {
        part.updateRotation(-rotation);
      }
    }
  }
 
  get o() { return (this.ob.length > 0) ? this.ob[0] : this.p[0].o; }
  get type() { return (this.p.length == 0) ? -1 : this.p[0].type; }

  remove() {
    for (const part of this.p) { part.remove(); }
    for (const ob of this.ob) { tracks.removeObject(ob); }
    // tracks.removeObject(this);
  }

  hide() { this.p.forEach((part) => { part.hide(); })}
  show() { this.p.forEach((part) => { part.show(); })}
}

export class TrainAxle extends TrainPart {
  constructor({
    object
  }) {
    super({
      source: "axle.png",
      object,
      size: new Vector({ x:10*3, y:22*3 })
    });
    this.f2 = null;
  }

  coupleTo(axle, distance=100) {
    if (this.f2 != null) return;
    const followers = this.o.f;
    const oldObject = tracks.removeObject(this.o);
    this.o = tracks.addObject(
      new obj.SlowFollower({
        leader: axle.o,
        distance: -distance,
        color: "#ff0000"
      })
    );
    if (!followers) return;
    for (const follower of followers) {
      if (follower.leader == oldObject) follower.leader = this.o;
      this.o.follow(follower);
    }
    this.f2 = followers;
  }

  uncouple() {
    if (this.f2 == null) return;

    const followers = this.f2;
    this.f2 = null;

    const oldObject = tracks.removeObject(this.o);
    this.o = tracks.addObject(
      new obj.AutoTracer({ step: 1 })
    );
    this.o.h = oldObject.h;
    this.o.p = oldObject.p;
    
    for (const follower of followers) {
      if (follower.leader == oldObject) follower.leader = this.o;
      oldObject.unfollow(follower);
      this.o.follow(follower);
    }
    oldObject.l.unfollow(oldObject);
  }
}

export class TrainTruck extends TrainParts {
  constructor({
    axles=2,
    spacing=40,
    object,
    midpointWeight=null
  }) {
    if (axles < 1) throw new Error("Invald axle count");
    const parts = [];
    const objects = [];
    parts.push(new TrainAxle({ object }));

    if (axles >= 2) {
      const followingAxles = axles-1;
      const follower = tracks.addObject(
        new obj.SlowFollower({
          leader: object,
          distance: -(axles-1) * spacing
        })
        );
        for (let i = 1; i < followingAxles; i++) {
          parts.push(
            new TrainAxle({
              object: tracks.addObject(
                new obj.FloatingFollower({
                  leaderA: object,
                leaderB: follower,
                weight: (i / followingAxles)
              })
            )
          })
        )
      }
      parts.push(new TrainAxle({ object: follower }))

      if (midpointWeight != null) {
        objects.push(
          tracks.addObject(
            new obj.FloatingFollower({
              leaderA: object,
              leaderB: follower,
              weight: midpointWeight
            })
          )
        );
      }
    }

    super({ parts, objects });
  }

  get rotation() { return this.p[0].rotation; }
  get midpoint() { return (this.ob.length > 0) ? this.ob[0] : this.p[0].o; }

  getAxle(num) {
    return this.p[(num < 0) ? num + this.p.length : num]
  }

  // back coupler couples/uncouples from front coupler
  coupleTo(truck, distance=100) { this.getAxle(0).coupleTo(truck.getAxle(truck.p.length-1), distance); }
  uncouple() { this.getAxle(0).uncouple(); }
}

export class TrainBox extends TrainParts {
  constructor({
    bounds=new Vector({ x:170,y:70 }), // x=width, y=length
    object,
    truckInset=40, // distance from center of truck to edge of box
    truckMidpointWeight=0.5,
    truckSpacing=40,
    truckAxles=2
  }) {
    const truck1 = new TrainTruck({
      object,
      axles: truckAxles,
      midpointWeight: truckMidpointWeight,
      spacing: truckSpacing
    });
    const leader = new obj.SlowFollower({
      leader: truck1.midpoint,
      distance: - (bounds.x - truckInset*2)
    });
    const truck2 = new TrainTruck({
      object: tracks.addObject(
        new obj.SlowFollower({
          leader,
          distance: 20
        })
      ),
      axles: truckAxles,
      midpointWeight: 1 - truckMidpointWeight,
      spacing: truckSpacing
    });

    super({
      parts: [truck1, truck2],
      objects: [
        tracks.addObject(
          new obj.CenteredBox({
            bounds,
            obj1: truck1.midpoint,
            obj2: truck2.midpoint
          })
        ),
        tracks.addObject( leader )
      ]
    });

    this.i = truckInset - ((truckAxles-1) * truckSpacing) * (1-truckMidpointWeight);
  }

  get frontTruck() { return this.p[0]; }
  get backTruck() { return this.p[1]; }
  get box() { return this.ob[0]; }

  get h() { return this.frontTruck.getAxle(0).o.h; }
  set h(newH) { this.frontTruck.getAxle(0).o.h = newH; }

  // back coupler couples/uncouples from front coupler
  coupleTo(box, couplerLength=10) { this.frontTruck.coupleTo(box.backTruck, this.i + box.i + couplerLength); }
  uncouple() { this.frontTruck.uncouple(); }
}

export class SmallTrainBox extends TrainBox {
  constructor({
    object
  }) {
    super({
      object,
      bounds: new Vector({ x:0, y:0 }),
      truckAxles: 1,
      truckInset: 0,
      truckSpacing: 0
    });

    this.hide();
  }

  remove() {
    this.frontTruck.remove();
    this.backTruck.remove();
    tracks.removeObject(this.box);
  }
}

// const loco = new obj.LocomotiveTracer({});

// addTrainPart(
//   new TrainBox({
//     object: tracks.addObject( loco ),
//     truckAxles: 3,
//     bounds: new Vector({ x: 350, y:70 }),
//     truckInset: 70,
//     truckMidpointWeight: 0.2
//   })
// )

// document.body.addEventListener("keydown", (e) => {
//   if (e.keyCode == 38) {
//     loco.accelerateTo(10, 0.02);
//   }
//   else if (e.keyCode == 40) {
//     loco.accelerateTo(-10, 0.02);
//   }
// });

// document.body.addEventListener("keyup", (e) => {
//   loco.accelerateTo(0, 0.005);
// });

// for (let i = 0; i < 10; i++) {
//   addTrainPart(
//     new TrainBox({
//       object: tracks.addObject( new obj.AutoTracer({ step:2 }) ),
//       bounds: new Vector({ x: 160, y: 70 })
//     })
//   )
//   trainParts[trainParts.length-1].coupleTo(trainParts[trainParts.length-2],-20);
// }



// export function tick() {
//   for (let part of trainParts) {
//     switch (part.type) {
//       case 0: // tick needs no parameter
//         part.tick();
//         break;
//       case 1: // tick needs origin track
//         part.tick(tracks.tracks[0])
//         break;
//       case 2: // tick needs closest track
//         if (tracks.closestTrackData) part.tick(tracks.closestTrackData[0], tracks.closestTrackData[1])
//         break;
//     }
//   }
// }
