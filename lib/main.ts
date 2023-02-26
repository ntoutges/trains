import * as grid from "./grid.js";
import * as math from "./maths.js";
import * as tracks from "./tracks.js";
// import * as parts from "./trainParts.js";
import * as trains from "./trains.js";
import { TrackNetwork, TrackSystem } from "./metaTracks.js";

document.body.addEventListener("mousedown", (e) => {

  if (e.button == 1) {
    grid.setDraggable(!grid.getDraggable())
    e.preventDefault();
  }
  else if (e.button == 0) grid.dragging.startDrag(e.pageX, e.pageY);
  else if (e.button == 2) {
    const v = new math.Vector({x:e.pageX - grid.pos.x, y:-e.pageY + grid.pos.y});
    tracks.appendPoint(v);
  }
});
document.body.addEventListener("mouseup", (e) => { grid.dragging.stopDrag(e.pageX, e.pageY); });
document.body.addEventListener("mousemove", (e) => { grid.dragging.doDrag(e.pageX, e.pageY); });

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

const loco = new trains.FastLocomotive({
  tracks: tracks.tracks,
  keys: {
    0: ["accelerateTo", 0, 0.1],
    38: ["accelerateTo", 4,0.1],
    40: ["accelerateTo",-4,0.1],
    32:["uncouple", -1]
  }
});


const car1 = new trains.Car({
  locomotive: loco,
  tracks
})

const car2 = new trains.Car({
  locomotive: car1,
  tracks
})

// new trains.Car({
//   locomotive: car2,
//   tracks
// })

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

tracks.addTracks(system.tracks);

document.body.addEventListener("click", () => {
  system.getBridgeFrom("A").switchNext();
})