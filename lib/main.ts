import * as grid from "./grid.js";
import * as math from "./maths.js";
import * as tracks from "./tracks.js";
// import * as parts from "./trainParts.js";
// import * as trains from "./trains.js";

import "./trainParts.js";
import "./trains.js";

var points = []

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

tracks.addTracks(
  tracks.generateTracks(
    math.generateVectorList([
      [0,0],
      [250,0],
      [500,250],
      [500,750],
      [750,1000],
      [1000,1000],
      // [1000,1000],
      [1250, 750],
      // [2500,750]
    ])
  )
)

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
      y: 500
    }),
    offVector: new math.Vector({
      x: 500,
      y: 0
    })
  })
})

const bridge = new tracks.BridgeTrack({
  outTrackA: out1,
  outTrackB: out2
});

var state = true;
document.body.addEventListener("click", () => {
  state = !state
  if (!bridge.switchOutTrackState(state)) {
    state = !state; // undo if not switched
  }
})

tracks.appendTrack(bridge)
tracks.addTracks([out1, out2])

// setInterval(() => {
//   console.log(bridge.c.length)
// }, 100);


// const switchTrack = new tracks.OutSwitchTrack({
//   inTrack: tracks.tracks[tracks.tracks.length-1],
//   segmentA: new math.Segment({
//     vector: new math.Vector({
//       x: 1010+500,
//       y: 740
//     }),
//     offVector: new math.Vector({
//       x: 500,
//       y: 0
//     })
//   }),
//   segmentB: new math.Segment({
//     vector: new math.Vector({
//       x: 1010+500,
//       y: 740
//     }),
//     offVector: new math.Vector({
//       x: 500,
//       y: 100
//     })
//   })
// })
// tracks.tracks[tracks.tracks.length-1].outTrack = switchTrack;

// tracks.addTracks([ switchTrack ])

// setInterval(() => {
//   switchTrack.cs = !switchTrack.cs;
// }, 1000)