function deepCopy(original) {
    return $.extend(true, {}, original);
}

function setURLParam(key, value) {
    if (history.pushState) {
        let params = new URLSearchParams(window.location.search);
        params.set(key, value);
        let newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + params.toString();
        window.history.pushState({path:newUrl},'',newUrl);
    }
}

function getURLParam(key) {
    if (history.pushState) {
        let params = new URLSearchParams(window.location.search);
        return params.get(key);
    }
}

let stateByYX = null;

let _requestsByYX = null;

const _dirX = [ -1, 0, 1, 0 ];
const _dirY = [ 0, -1, 0, 1 ];

let _version = 1;
let _currentGame = {};

function updateCurrentGameByRunningProgram() {
    _currentGame.runFunction = Function(_currentGame.program || "");
    let retBlock = _currentGame.runFunction();
    _currentGame.level = {
        v: 1,
        s: 4,
        n: 40,
    }
    try {
        if( retBlock.version >= _version ) {
            _currentGame.funcs = retBlock.funcs;
            _currentGame.level.v = retBlock.n_vars;
            _currentGame.level.s = retBlock.n_states;
            _currentGame.level.n = retBlock.n_grid;
        }
        else {
            console.log("Version mismatch.")
        }
    }
    catch {
    }
}

function stateProgramChanged(program) {
    // Called when the UI has changed the program.
    _currentGame.program = program;
    updateCurrentGameByRunningProgram();
    window.localStorage.setItem("saveGame", JSON.stringify(_currentGame));
}

function stateGet() {
    _currentGame = JSON.parse(window.localStorage.getItem("saveGame")) || {};
    updateCurrentGameByRunningProgram();
    return _currentGame;
}

let cellState = {
    render: 0,
    alive: 0,
    _x: 0,
    _y: 0,
    age: 0,
    vars: [],
    inc: function(which_v) {
        this.vars[which_v] = (this.vars[which_v] + 1) % _currentGame.level.s;
    },
    replicate: function(dir) {
        dir = dir % 4;
        let dstX = this._x + _dirX[dir];
        let dstY = this._y + _dirY[dir];
        if (0 <= dstX && dstX < _currentGame.level.n && 0 <= dstY && dstY < _currentGame.level.n) {
            if( ! stateByYX[dstY][dstX].render) {
                // If it has never been alive then it can be requested
                _requestsByYX[dstY][dstX].push(this);
            }
        }
    },
    rand: function(which_v) {
        let val = Math.floor(Math.random() * Math.floor(_currentGame.level.s)) % _currentGame.level.s;
        this.vars[which_v] = val;
    },
    stop: function() {
        this.alive = 0;
    },
    pop: function() {
        this.alive = 0;
        this.render = 0;
    },
};


function stateReset() {
    stateByYX = [];
    let {v, n} = _currentGame.level;

    for (let y=0; y < n; y++) {
        let xs = [];
        for (let x=0; x < n; x++) {
            let state = deepCopy(cellState);
            state._x = x;
            state._y = y;
            for (let i=0; i < v; i++) {
                state.vars.push(0);
            }
            xs.push(state);
        }
        stateByYX.push(xs);
    }

    let centerState = stateByYX[n / 2][n / 2];
    centerState.alive = 1;
    centerState.render = 1;
    return _currentGame;
}

function stateUpdate() {
    let {n, v} = _currentGame.level;

    _requestsByYX = [];
    for (let y=0; y < n; y++) {
        let requestX = [];
        for (let x=0; x < n; x++) {
            requestX.push([]);
        }
        _requestsByYX.push(requestX);
    }

    for (let y=0; y < n; y++) {
        for (let x=0; x < n; x++) {
            let state = stateByYX[y][x];
            if (state.alive != 0) {
                (_currentGame.funcs || []).map( i => i(state) );
                state.age ++;
            }
        }
    }

    // Activate if no contention
    for (let y=0; y < n; y++) {
        for (let x=0; x < n; x++) {
            let requests = _requestsByYX[y][x];
            if (requests.length == 1) {
                // Inherit memory state but reset age
                let request = requests[0];
                let state = stateByYX[y][x];
                for (let i=0; i < v; i++) {
                    state.vars[i] = request.vars[i];
                }
                state.age = 0;
                state.render = 1;
                state.alive = 1;
            }
        }
    }
}

/*
return {
	version: 1,

	funcs: [

		function(s) {
			s.rand(0);
		},
		function(s) {
			s.replicate(s.vars[0]);
		},
		function(s) {
			if(s.age > 4) s.stop();
		},
	],


	funcs1: [
		function(s) {
			s.inc(0);
		},
		function(s) {
			if(s.age > 1) {
				s.stop();
			}
		},
		function(s) {
			s.replicate(0);
		},
	],
}
*/