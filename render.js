function _createTris(nativeDim, nVars, nStates) {
    let halfPi = Math.PI / 2;
    let twoPi = Math.PI * 2;

    function createTri(rot, hue, alive) {
        let triCanvas = z("canvas", { width: nativeDim, height: nativeDim } );
        let _c = triCanvas.getContext("2d");
        let d2 = nativeDim / 2;
        let sat = alive ? "100%" : "10%";
        _c.save();
            _c.translate(d2, d2);
            _c.rotate(rot);
            _c.fillStyle = `hsl(${hue}, ${sat}, 50%)`;
            _c.beginPath();
            _c.moveTo(0, 0);
            _c.lineTo(-d2, -d2);
            _c.lineTo(-d2, +d2);
            _c.fill();
            _c.closePath();
        _c.restore();
        return triCanvas;
    }

    function createQuad(hue, alive) {
        let quadCanvas = z("canvas", { width: nativeDim, height: nativeDim } );
        let _c = quadCanvas.getContext("2d");
        let d2 = nativeDim / 2;
        alive = alive * 50 + 50;
        let sat = alive ? "100%" : "10%";
        _c.save();
            _c.translate(d2, d2);
            _c.fillStyle = `hsl(${hue}, ${sat}, 50%)`;
            _c.beginPath();
            _c.moveTo(-d2, -d2);
            _c.lineTo(+d2, -d2);
            _c.lineTo(+d2, +d2);
            _c.lineTo(-d2, +d2);
            _c.fill();
            _c.closePath();
        _c.restore();
        return quadCanvas;
    }

    let alives = [];
    for (let alive=0; alive < 2; alive++) {
        let trisByRotAndState = [];
        for (let rot=0; rot < nVars; rot++) {
            let tris = [];
            for (let state=0; state < nStates; state ++) {
                let poly = null
                if(nVars == 1) {
                    poly = createQuad(360 * state / nStates, alive);
                }
                else {
                    poly = createTri(rot * twoPi / nVars, 360 * state / nStates, alive);
                }
                tris.push(poly);
            }
            trisByRotAndState.push(tris);
        }
        alives.push(trisByRotAndState);
    }
    return alives;
}

let _trisByAliveAndRotAndState = null;
let _mainCanvas = null;
let _lastTime = null;
let _c = null; // canvas context

let _nPixelsPerCellAtZoom1 = 20;
let _nPixelsPerCell = _nPixelsPerCellAtZoom1;

function renderGetFullZoom(mainCanvas, nCells) {
    let wrapperParent = $(mainCanvas).parent().parent();
    let w = $(wrapperParent).width();
    let h = $(wrapperParent).height();
    let windowDim = Math.min(w, h);
    return windowDim / (nCells * _nPixelsPerCellAtZoom1);
}

function renderInit(mainCanvas, nVars, nStates, nCells, zoom) {
    _nPixelsPerCell = Math.floor(_nPixelsPerCellAtZoom1 * zoom);

    // wrapper-parent
    //   wrapper
    //     canvas

    // The wrapper-parent is automatically sized so that is square and fits in
    // the full size of the window. With that I can find out what its true dims are.
    let wrapperParent = $(mainCanvas).parent().parent();
    let w = $(wrapperParent).width();
    let h = $(wrapperParent).height();
    let forceWrapperDim = Math.min(w, h);
    let wrapper = $(mainCanvas).parent();
    $(wrapper).width(forceWrapperDim).height(forceWrapperDim);

    // The canvas dimension is set by the size of the game map.
    // Note that the $(canvas).width() is DIFFERENT than the canvas.width.
    //   $(canvas).width() is the size of the DOM object
    //   $(canvas).width is the number of pixels in the canvas.
    // I set both to the same thing to maintain 1:1 pixel ratios.
    let canvasDim = nCells * _nPixelsPerCell;
    $(mainCanvas).width(canvasDim).height(canvasDim);
    mainCanvas.width = canvasDim;
    mainCanvas.height = canvasDim;

    _trisByAliveAndRotAndState = _createTris(_nPixelsPerCell, nVars, nStates);

    _mainCanvas = mainCanvas;
    _c = mainCanvas.getContext("2d");

    _c.strokeStyle = "black";
    _c.fillStyle = "black";
    _c.lineWidth = 1;
    _c.font = "normal 16pt Arial";

    _lastTime = performance.now();
}

function render(nCells, nVars) {
    _c.clearRect(0, 0, _mainCanvas.width, _mainCanvas.height);

    // DRAW the cells
    for (let y=0; y < nCells; y++) {
        for (let x=0; x < nCells; x++) {
            let state = stateByYX[y][x];
            if (state.render != 0) {
                for (let i=0; i < nVars; i++) {
                    _c.drawImage(
                        _trisByAliveAndRotAndState[state.alive][i][state.vars[i]],
                        x * _nPixelsPerCell,
                        y * _nPixelsPerCell
                    );
                }
            }
        }
    }

    /*
    // OVERDRAW the grid
    _c.beginPath();
    for (let y=0; y <= nCells; y++) {
        _c.moveTo(0, y * _nPixelsPerCell);
        _c.lineTo(nCells * _nPixelsPerCell, y * _nPixelsPerCell);
        _c.stroke();
    }

    for (let x=0; x <= nCells; x++) {
        _c.moveTo(x * _nPixelsPerCell, 0);
        _c.lineTo(x * _nPixelsPerCell, nCells * _nPixelsPerCell);
        _c.stroke();
    }

    // DRAW FPS
    let now = performance.now();
    let fps = 1000.0 / (now - _lastTime);
    lastTime = now;
    // _c.fillText(`${fps.toFixed(0)} fps`, 10, 26);
    */

}

