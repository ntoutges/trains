import * as grid from "./grid.js";
import * as math from "./maths.js";
import * as tracks from "./tracks.js";
// import * as parts from "./trainParts.js";
import * as trains from "./trains.js";
import { generateNetworks, TrackNetwork, TrackSystem } from "./metaTracks.js";
import { activeConsist, Consist } from "./consist.js";
import { Options } from "./consistLookup.js";
import * as builder from "./trackBuilder.js";
import { JDON } from "./JDON.js";

document.body.addEventListener("mousedown", (e) => {

  if (e.button == 1) {
    // grid.setDraggable(!grid.getDraggable())
    e.preventDefault();
    console.log(JSON.stringify(builder.getPointPairs()));
    // builder.reset();
  }
  else if (e.button == 0) grid.dragging.startDrag(e.pageX, e.pageY);
  else if (e.button == 2) {
    builder.addPoint(e.pageX, e.pageY);
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
    Options.Locomotive,
    Options.Car,
    Options.Car,
    Options.Car,
    Options.Car,
    Options.Car
  ],
  tracks: tracks.tracks
});

// setTimeout(() => {
//   consist.splitAt(1);
// }, 2000)

document.addEventListener("keydown", (e) => {
  if (e.keyCode == 38) activeConsist.accelerateTo(10);
  else if (e.keyCode == 40) activeConsist.accelerateTo(-10);
})

document.addEventListener("keyup", (e) => {
  if ([38,40].includes(e.keyCode)) activeConsist.accelerateTo(0);
})

setInterval(() => {
  trains.tickTrains(true);
  tracks.renderTracks();
}, 10);

const data = new JDON({
  filename: "/test.jdon"
})

data.onData(() => {
  const systemData: Record<string, Array<[x: number, y:number]>> = {};
  for (const property of data.getProps()) {
    systemData[property] = JSON.parse(data.getProp(property));
  }
  
  const system = new TrackSystem({
    networks: generateNetworks(systemData),
    switches: {
      "MAIN": ["MAIN2", "SIDING"],
      "MAIN2": ["LOOP"],
      "SIDING": ["LOOP"],
      "LOOP": ["MAIN"]
    }
  });
  document.addEventListener("click", (e) => {
    system.getBridgeFrom("MAIN").switchNext();
  });
  document.addEventListener("click", (e) => {
    system.getBridgeFrom("MAIN2").switchNext();
  })

  tracks.addTracks(system.tracks);
})