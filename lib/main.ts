import * as grid from "./grid.js";
import * as math from "./maths.js";
import * as tracks from "./tracks.js";
// import * as parts from "./trainParts.js";
import * as trains from "./trains.js";
import { TrackNetwork, TrackSystem } from "./metaTracks.js";
import { activeConsist, Consist } from "./consist.js";
import { Options } from "./consistLookup.js";
import { HeadTracer } from "./objects.js";

document.body.addEventListener("mousedown", (e) => {

  if (e.button == 1) {
    grid.setDraggable(!grid.getDraggable())
    e.preventDefault();
  }
  else if (e.button == 0) grid.dragging.startDrag(e.pageX, e.pageY);
  else if (e.button == 2) {
    const v = new math.Vector({x:e.pageX*grid.pos.a - grid.pos.x, y:-e.pageY*grid.pos.a + grid.pos.y});
    tracks.appendPoint(v);
  }
});
document.body.addEventListener("mouseup", (e) => { grid.dragging.stopDrag(e.pageX, e.pageY); });
document.body.addEventListener("mousemove", (e) => { grid.dragging.doDrag(e.pageX, e.pageY); });

document.body.addEventListener("keydown", (e) => {
  if (e.keyCode == 187) grid.dragging.doZoom(1);
  else if (e.keyCode == 189) grid.dragging.doZoom(-1);
});
document.addEventListener("wheel", (e) => {
  grid.dragging.doZoom(-e.deltaY);
})

document.body.oncontextmenu = (e) => { e.preventDefault(); }

// tracks.addTracks(
//   tracks.generateTracks(
//     math.generateVectorList([
//       [0,0],
//       [250,0],
//       [500,250],
//       [500,750],
//       [750,1000],
//       [1000,1000],
//       // [1000,1000],
//       [1250, 750],
//       // [2500,750]
//     ])
//   )
// )

const out1 = new tracks.Track({
  segment: new math.Segment({
    vector: new math.Vector({
      x: 1500,
      y: 750
    }),
    offVector: new math.Vector({
      x: 500,
      y: 0
    })
  })
})

const out2 = new tracks.Track({
  segment: new math.Segment({
    vector: new math.Vector({
      x: 1500,
      y: 650
    }),
    offVector: new math.Vector({
      x: 2000,
      y: 0
    })
  })
})

const in1 = new tracks.Track({
  segment: new math.Segment({
    vector: new math.Vector({
      x: 750,
      y: 600
    }),
    offVector: new math.Vector({
      x: 500,
      y: 0
    })
  })
})

// const bridge = new tracks.BridgeTrack({
//   inTracks: [tracks.tracks[tracks.tracks.length-1], in1],
//   outTracks: [out1, out2]
// });

// tracks.addTracks([bridge])
// tracks.addTracks([out1, out2, in1])

// const loco = new trains.FastLocomotive({
//   tracks: tracks.tracks,
//   keys: {
//     0: ["accelerateTo", 0, 0.1],
//     38: ["accelerateTo", 4,0.1],
//     40: ["accelerateTo",-4,0.1],
//     32:["uncouple", -1]
//   }
// });

// const car1 = new trains.Car({
//   locomotive: loco,
//   tracks: tracks.tracks
// })

// const car2 = new trains.Car({
//   locomotive: car1,
//   tracks: tracks.tracks
// })

// new trains.Car({
//   locomotive: car2,
//   tracks: tracks.tracks
// })

var consist = new Consist({
  sequence: [
    Options.Car,
    Options.Car,
    Options.Locomotive
  ],
  tracks: tracks.tracks
});

setTimeout(() => {
  consist.splitAt(1);
}, 2000)

document.addEventListener("keydown", (e) => {
  if (e.keyCode == 38) activeConsist.accelerateTo(5);
  else if (e.keyCode == 40) activeConsist.accelerateTo(-5);
})

document.addEventListener("keyup", (e) => {
  if ([38,40].includes(e.keyCode)) activeConsist.accelerateTo(0);
})

setInterval(() => {
  trains.tickTrains(true);
  tracks.renderTracks();
}, 10);

const system = new TrackSystem({
  networks: {
    "A": new TrackNetwork(
      math.generateVectorList([
        [0,1200],
        [1000,1000]
      ])
    ),
    "B": new TrackNetwork(
      math.generateVectorList([
        [0,0],
        [1000,200]
      ])
    ),
    "C": new TrackNetwork(
      math.generateVectorList([
        [2000,1000],
        [3000,1200]
      ])
    ),
    "D": new TrackNetwork(
      math.generateVectorList([
        [2000,200],
        [3000,0]
      ])
    ),
    "E": new TrackNetwork(
      math.generateVectorList([
        [0,600],
        [1000,600]
      ])
    )
  },
  switches: {
    "A": ["C"],
    "B": ["D"],
    "E": ["C", "D"]
  }
})

const ringTracks = tracks.generateRingTracks({
  origin: new math.Vector({
    x: 100,
    y: 100
  }),
  inAngles: [ 0,10,20,30,40,50,60,70,80,90 ],
  radius: 500
})

const radial = new tracks.RadialSwitch({
  ring: ringTracks 
})

tracks.addTracks(system.tracks);
tracks.appendTrack(ringTracks[0])
tracks.addTracks(ringTracks.slice(1))
tracks.addTracks([radial])

document.body.addEventListener("click", () => {
  system.getBridgeFrom("A").switchNext();
  radial.switchNext();
})
