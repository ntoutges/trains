"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onMove = exports.drawOrigin = exports.drawMetaGridAt = exports.drawGridAt = exports.drawGrid = exports.clearGrid = exports.getPos = exports.getDraggable = exports.setDraggable = exports.dragging = exports.pos = void 0;
var gridSize = 50;
var metaGridSize = 5;
var defaultColor = "#86bbc4";
var originColor = "#c98d8d";
var gridElement = $("#background-grid");
var ctx = gridElement.get(0).getContext("2d");
var gridWidth = $("#background-grid").width();
var gridHeight = $("#background-grid").height();
gridElement.attr("width", "".concat(gridWidth, "px"));
gridElement.attr("height", "".concat(gridHeight, "px"));
var draggable = true;
// start with origin at bottom left
exports.pos = {
    x: 0,
    y: gridHeight
};
var offPos = null;
ctx.strokeStyle = defaultColor;
drawGrid();
exports.dragging = {
    "startDrag": function (x, y) {
        if (!draggable)
            return false;
        gridElement.attr("moving", "1");
        offPos = { x: x, y: y };
        return true;
    },
    "doDrag": function (x, y) {
        if (offPos == null)
            return draggable;
        exports.pos.x += x - offPos.x;
        exports.pos.y += y - offPos.y;
        offPos.x = x;
        offPos.y = y;
        clearGrid();
        drawGrid();
        moveListeners.forEach(function (funct) { funct(exports.pos); });
        return true;
    },
    "stopDrag": function (x, y) {
        exports.dragging.doDrag(x, y);
        offPos = null;
        gridElement.removeAttr("moving");
    }
};
function setDraggable(state) {
    if (draggable && !state)
        exports.dragging.stopDrag(exports.pos.x, exports.pos.y);
    draggable = state;
    draggable ? gridElement.addClass("actives") : gridElement.removeClass("actives");
}
exports.setDraggable = setDraggable;
function getDraggable() { return draggable; }
exports.getDraggable = getDraggable;
function getPos() {
    return {
        "x": exports.pos.x,
        "y": exports.pos.y
    };
}
exports.getPos = getPos;
function clearGrid() { ctx.clearRect(0, 0, gridWidth, gridHeight); }
exports.clearGrid = clearGrid;
function drawGrid() { drawGridAt(exports.pos.x, exports.pos.y); }
exports.drawGrid = drawGrid;
function drawGridAt(x, y) {
    var startX = x % gridSize;
    var startY = y % gridSize;
    ctx.beginPath();
    ctx.lineWidth = 1;
    for (var x_1 = startX; x_1 < gridWidth; x_1 += gridSize) {
        vLine(x_1, 0, gridHeight);
    }
    for (var y_1 = startY; y_1 < gridHeight; y_1 += gridSize) {
        hLine(y_1, 0, gridWidth);
    }
    ctx.stroke();
    drawMetaGridAt(x, y);
    drawOrigin(x, y);
}
exports.drawGridAt = drawGridAt;
function drawMetaGridAt(x, y) {
    var startX = x % (gridSize * metaGridSize);
    var startY = y % (gridSize * metaGridSize);
    ctx.beginPath();
    ctx.lineWidth = 5;
    for (var x_2 = startX; x_2 < gridWidth; x_2 += gridSize * metaGridSize) {
        vLine(x_2, 0, gridHeight);
    }
    for (var y_2 = startY; y_2 < gridHeight; y_2 += gridSize * metaGridSize) {
        hLine(y_2, 0, gridWidth);
    }
    ctx.stroke();
}
exports.drawMetaGridAt = drawMetaGridAt;
function drawOrigin(x, y) {
    // unable to see origin, so no need to render
    if (x > gridWidth || x < 0)
        return;
    if (y > gridHeight || y < 0)
        return;
    ctx.beginPath();
    ctx.strokeStyle = originColor;
    ctx.lineWidth = 6; // origin always part of mega grid
    hLine(exports.pos.y, 0, gridWidth);
    vLine(exports.pos.x, 0, gridHeight);
    ctx.stroke();
    ctx.strokeStyle = defaultColor;
}
exports.drawOrigin = drawOrigin;
function hLine(y, x1, x2) {
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
}
function vLine(x, y1, y2) {
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
}
var moveListeners = [];
function onMove(funct) { moveListeners.push(funct); }
exports.onMove = onMove;
//# sourceMappingURL=grid.js.map