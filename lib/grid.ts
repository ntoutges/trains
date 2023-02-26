const gridSize = 50;
const metaGridSize = 4;
const ZOOM_POWER = 1.1;

const defaultColor = "#86bbc4";
const originColor = "#c98d8d";

const gridElement = $("#background-grid");
const ctx = ((gridElement!.get(0) as unknown) as HTMLCanvasElement)!.getContext("2d") as CanvasRenderingContext2D;

const gridWidth = $("#background-grid").width() as number;
const gridHeight = $("#background-grid").height() as number;

gridElement.attr("width", `${gridWidth}px`);
gridElement.attr("height", `${gridHeight}px`);

var draggable = true;
var gridLevel = 0;
var rawGridSize = gridSize;

// start with origin at bottom left
export const pos: { x: number, y:number, a:number } = {
  x: 0,
  y: gridHeight,
  a: 1 // zoom value
};
var offPos: { x: number, y:number, v:boolean } = { x:0, y:0, v:false }; // v=valid

ctx!.strokeStyle = defaultColor;
drawGrid();

export const dragging = {
  "startDrag": (x:number,y:number) => {
    if (!draggable) return false;
    gridElement.attr("moving", "1");
    offPos.x = pos.a * x;
    offPos.y = pos.a * y;
    offPos.v = true;
    return true;
  },
  "doDrag": (x:number,y:number, forceDrag:boolean = false) => {
    x *= pos.a;
    y *= pos.a;

    const oldOffX = offPos.x;
    const oldOffY = offPos.y;
    offPos.x = x;
    offPos.y = y;

    if (!offPos.v && !forceDrag) return draggable;
    
    pos.x += x - oldOffX;
    pos.y += y - oldOffY;  


    clearGrid();
    drawGrid();

    moveListeners.forEach(funct => { funct(pos); });
    return true;
  },
  "doZoom": (direction: number) => {
    // if (!offPos.v) return draggable;

    const oldZoom = pos.a;
    pos.a *= ZOOM_POWER ** Math.sign(direction);
    const oldV = offPos.v;
    dragging.doDrag(
      offPos.x / oldZoom,
      offPos.y / oldZoom,
      true
    );
    // moveListeners.forEach(funct => { funct(pos); });

    clearGrid();
    drawGrid();
    
    return true;
  },
  "stopDrag": (x:number,y:number) => {
    dragging.doDrag(x,y);
    offPos.v = false;
    gridElement.removeAttr("moving");
  }
}

export function setDraggable(state: boolean) {
  if (draggable && !state) dragging.stopDrag(pos.x,pos.y);

  draggable = state;
  draggable ? gridElement.addClass("actives") : gridElement.removeClass("actives");
}

export function getDraggable() { return draggable; }

export function getPos() {
  return {
    "x": pos.x,
    "y": pos.y
  }
}

export function clearGrid() { ctx.clearRect(0,0, gridWidth, gridHeight); }
export function drawGrid() { drawGridAt(pos.x, pos.y); }

export async function drawGridAt(x:number, y:number) {
  if (rawGridSize/pos.a < gridSize) {
    gridLevel++;
    rawGridSize = gridSize * metaGridSize**gridLevel;
  }
  else if (rawGridSize/pos.a > gridSize*metaGridSize) {
    gridLevel--;
    rawGridSize = gridSize * metaGridSize**gridLevel;
  }

  const startX = x % rawGridSize;
  const startY = y % rawGridSize;

  ctx.beginPath();
  ctx.lineWidth = 1;

  const width = gridWidth * pos.a;
  const height = gridHeight * pos.a;

  for (let x = startX; x < width; x += rawGridSize) { vLine(x/pos.a, 0,gridHeight); }
  for (let y = startY; y < height; y += rawGridSize) { hLine(y/pos.a, 0,gridWidth); }

  ctx.stroke();
  drawMetaGridAt(x,y);
  drawOrigin(x,y);
}

export function drawMetaGridAt(x,y) {
  const startX = x % (rawGridSize*metaGridSize);
  const startY = y % (rawGridSize*metaGridSize);

  ctx.beginPath();
  ctx.lineWidth = 5;

  const width = gridWidth * pos.a;
  const height = gridHeight * pos.a;

  for (let x = startX; x < width; x += rawGridSize*metaGridSize) { vLine(x/pos.a, 0,gridHeight); }
  for (let y = startY; y < height; y += rawGridSize*metaGridSize) { hLine(y/pos.a, 0,gridWidth); }
  ctx.stroke();
}

export function drawOrigin(x: number,y: number) {
  // unable to see origin, so no need to render
  if ((x > gridWidth || x < 0) && (y > gridHeight || y < 0)) return;

  ctx.beginPath();
  ctx.strokeStyle = originColor;
  ctx.lineWidth = 6; // origin always part of mega grid
  hLine(pos.y / pos.a, 0,gridWidth);
  vLine(pos.x / pos.a, 0,gridHeight);
  ctx.stroke();

  ctx.strokeStyle = defaultColor;
}

function hLine(y: number, x1: number,x2: number) {
  ctx.moveTo(x1,y);
  ctx.lineTo(x2,y);
}

function vLine(x: number, y1: number,y2: number) {
  ctx.moveTo(x,y1);
  ctx.lineTo(x,y2);
}

interface ListenerInterface {
  x: number,
  y: number,
  a: number
}

type ListenerType = (arg: ListenerInterface) => void;

const moveListeners: ListenerType[] = [];
export function onMove(funct: ListenerType) { moveListeners.push(funct); }