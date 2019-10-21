function _createTris(nativeDim, v, s) {
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
        for (let rot=0; rot < v; rot++) {
            let tris = [];
            for (let state=0; state < s; state ++) {
                let poly = null
                if(v == 1) {
                    poly = createQuad(360 * state / s, alive);
                }
                else {
                    poly = createTri(rot * twoPi / v, 360 * state / s, alive);
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
let _c = null;
let _d = null;

function renderInit(mainCanvas, v, s, n) {
    let w = $(mainCanvas).width();
    let h = $(mainCanvas).height();
    _d = Math.floor(Math.min(w, h) / n);

    _trisByAliveAndRotAndState = _createTris(_d, v, s);

    _mainCanvas = mainCanvas;
    _c = mainCanvas.getContext("2d");

    _c.strokeStyle = "black";
    _c.fillStyle = "black";
    _c.lineWidth = 1;
    _c.font = "normal 16pt Arial";

    _lastTime = performance.now();
}


function render(n, v, zoom) {
    _c.clearRect(0, 0, _mainCanvas.width, _mainCanvas.height);

    _c.save();
        _c.scale(zoom, zoom);

        // DRAW the cells
        for (let y=0; y < n; y++) {
            for (let x=0; x < n; x++) {
                let state = stateByYX[y][x];
                if (state.render != 0) {
                    for (let i=0; i < v; i++) {
                        _c.drawImage(_trisByAliveAndRotAndState[state.alive][i][state.vars[i]], x * _d, y * _d);
                    }
                }
            }
        }

        // OVERDRAW the grid
        _c.beginPath();
        for (let y=0; y <= n; y++) {
            _c.moveTo(0, y * _d);
            _c.lineTo(n * _d, y * _d);
            _c.stroke();
        }

        for (let x=0; x <= n; x++) {
            _c.moveTo(x * _d, 0);
            _c.lineTo(x * _d, n * _d);
            _c.stroke();
        }

        // DRAW FPS
        let now = performance.now();
        let fps = 1000.0 / (now - _lastTime);
        lastTime = now;
        // _c.fillText(`${fps.toFixed(0)} fps`, 10, 26);
    _c.restore();
}

