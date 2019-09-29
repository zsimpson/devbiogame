// d is the pixel dimension of each cell at 1:1 scaling
const d = 20;

function _createTris(nativeDim) {
    let halfPi = Math.PI / 2;
    let twoPi = Math.PI * 2;

    function createTri(rot, hue) {
        let triCanvas = z("canvas", { width: nativeDim, height: nativeDim } );
        let _c = triCanvas.getContext("2d");
        let d2 = nativeDim / 2;
        _c.save();
            _c.translate(d2, d2);
            _c.rotate(rot);
            _c.fillStyle = `hsl(${hue}, 100%, 50%)`;
            _c.beginPath();
            _c.moveTo(0, 0);
            _c.lineTo(-d2, -d2);
            _c.lineTo(-d2, +d2);
            _c.fill();
            _c.closePath();
        _c.restore();
        return triCanvas;
    }

    let trisByRotAndState = [];
    for (let rot=0; rot < v; rot++) {
        let tris = [];
        for (let state=0; state < s; state ++) {
            let tri = createTri(rot * twoPi / v, 360 * state / s );
            tris.push(tri);
        }
        trisByRotAndState.push(tris);
    }

    return trisByRotAndState;
}

const _trisByRotAndState = _createTris(d);

let _mainCanvas = null;
let _lastTime = null;
let _c = null;

function renderInit(mainCanvas) {
    _mainCanvas = mainCanvas;
    _c = mainCanvas.getContext("2d");

    _c.strokeStyle = "black";
    _c.fillStyle = "black";
    _c.lineWidth = 1;
    _c.font = "normal 16pt Arial";

    _lastTime = performance.now();
}


function render() {
    _c.clearRect(0, 0, _mainCanvas.width, _mainCanvas.height);

    _c.save();
        _c.scale(1, 1);
        let r = 0;//4 * Math.random();

        // DRAW the cells
        for (let y=0; y<n; y++) {
            for (let x=0; x<n; x++) {
                let state = stateByYX[y][x];
                if (state.render) {
                    for (let i=0; i<v; i++) {
                        _c.drawImage(_trisByRotAndState[i][state.vars[i]], x*d+r, y*d+r);
                    }
                }
            }
        }

        // OVERDRAW the grid
        _c.beginPath();
        for (let y=0; y<=n; y++) {
            _c.moveTo(0, y*d+0.5);
            _c.lineTo(n*d, y*d+0.5);
            _c.stroke();
        }

        for (let x=0; x<=n; x++) {
            _c.moveTo(x*d, 0);
            _c.lineTo(x*d, n*d);
            _c.stroke();
        }

        // DRAW FPS
        let now = performance.now();
        let fps = 1000.0 / (now - _lastTime);
        lastTime = now;
        // _c.fillText(`${fps.toFixed(0)} fps`, 10, 26);
    _c.restore();
}

