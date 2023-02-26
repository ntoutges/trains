const gridSize = 50;
const metaGridSize = 5;
const defaultColor = "#86bbc4";
const originColor = "#c98d8d";
const gridElement = $("#background-grid");
const ctx = gridElement.get(0).getContext("2d");
const gridWidth = $("#background-grid").width();
const gridHeight = $("#background-grid").height();
gridElement.attr("width", `${gridWidth}px`);
gridElement.attr("height", `${gridHeight}px`);
var draggable = true;
// start with origin at bottom left
export const pos = {
    x: 0,
    y: gridHeight
};
var offPos = null;
ctx.strokeStyle = defaultColor;
drawGrid();
export const dragging = {
    "startDrag": (x, y) => {
        if (!draggable)
            return false;
        gridElement.attr("moving", "1");
        offPos = { x, y };
        return true;
    },
    "doDrag": (x, y) => {
        if (offPos == null)
            return draggable;
        pos.x += x - offPos.x;
        pos.y += y - offPos.y;
        offPos.x = x;
        offPos.y = y;
        clearGrid();
        drawGrid();
        moveListeners.forEach(funct => { funct(pos); });
        return true;
    },
    "stopDrag": (x, y) => {
        dragging.doDrag(x, y);
        offPos = null;
        gridElement.removeAttr("moving");
    }
};
export function setDraggable(state) {
    if (draggable && !state)
        dragging.stopDrag(pos.x, pos.y);
    draggable = state;
    draggable ? gridElement.addClass("actives") : gridElement.removeClass("actives");
}
export function getDraggable() { return draggable; }
export function getPos() {
    return {
        "x": pos.x,
        "y": pos.y
    };
}
export function clearGrid() { ctx.clearRect(0, 0, gridWidth, gridHeight); }
export function drawGrid() { drawGridAt(pos.x, pos.y); }
export function drawGridAt(x, y) {
    const startX = x % gridSize;
    const startY = y % gridSize;
    ctx.beginPath();
    ctx.lineWidth = 1;
    for (let x = startX; x < gridWidth; x += gridSize) {
        vLine(x, 0, gridHeight);
    }
    for (let y = startY; y < gridHeight; y += gridSize) {
        hLine(y, 0, gridWidth);
    }
    ctx.stroke();
    drawMetaGridAt(x, y);
    drawOrigin(x, y);
}
export function drawMetaGridAt(x, y) {
    const startX = x % (gridSize * metaGridSize);
    const startY = y % (gridSize * metaGridSize);
    ctx.beginPath();
    ctx.lineWidth = 5;
    for (let x = startX; x < gridWidth; x += gridSize * metaGridSize) {
        vLine(x, 0, gridHeight);
    }
    for (let y = startY; y < gridHeight; y += gridSize * metaGridSize) {
        hLine(y, 0, gridWidth);
    }
    ctx.stroke();
}
export function drawOrigin(x, y) {
    // unable to see origin, so no need to render
    if (x > gridWidth || x < 0)
        return;
    if (y > gridHeight || y < 0)
        return;
    ctx.beginPath();
    ctx.strokeStyle = originColor;
    ctx.lineWidth = 6; // origin always part of mega grid
    hLine(pos.y, 0, gridWidth);
    vLine(pos.x, 0, gridHeight);
    ctx.stroke();
    ctx.strokeStyle = defaultColor;
}
function hLine(y, x1, x2) {
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
}
function vLine(x, y1, y2) {
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
}
const moveListeners = [];
export function onMove(funct) { moveListeners.push(funct); }
//# sourceMappingURL=grid.js.map