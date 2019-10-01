let level = null;
let _requestsByYX = null;
let stateByYX = null;
let _stateVarOffsetByVarName = null;

const _dirNames = ["West", "North", "East", "South"];
const _dirNameToNumber = {
    "West": 0,
    "North": 1,
    "East": 2,
    "South": 3,
}
const _dirX = [ -1, 0, 1, 0 ];
const _dirY = [ 0, -1, 0, 1 ];

// When the operationsVersion is incremented, it invalidates the save state
const opsVersion = 2;

const opsDefaults = {
    // Each of the following arrays is called an "opState".
    // The initial state of each operand is a descriptive default. eg "Direction" as opposed to "East", "West", etc
    // This table is the "all options" version; the levels cherry pick out of this.
    "Replicate": [
        {
            operand: "Direction",
            options: _dirNames,
        },
    ],
    "Increment": [
        {
            operand: "Variable",
            _options: "VarNames",
        },
    ],
    "Goto": [
        {
            operand: "Line",
            _options: "LineNames",
        },
    ],
    "If": [
        {
            operand: "Left",
            _options: "VarNames",
        },
        {
            operand: "Cmp",
            options: [ "<", "<=", "==", ">=", ">" ],
        },
        {
            operand: "Right",
            _options: "VarNames",
        },
        {
            operand: "Goto",
            _options: "GotoLineNames",
        },
    ],
    "Stop": [
    ],
};

const levels = [
    // v is the number of variables per cell
    // s is the number of states per variable
    // n is the number of cells on each axis
    // l is the number of instruction lines

    {
        name: "Alternator",
        v: 1,
        s: 2,
        n: 20,
        l: 4,
        ops: {
            "Replicate": opsDefaults["Replicate"],
            "Increment": opsDefaults["Increment"],
            "Stop": opsDefaults["Stop"],
        }
    },
    {
        name: "Filler",
        v: 1,
        s: 2,
        n: 40,
        l: 4,
        ops: {
            "Replicate": opsDefaults["Replicate"],
            "Increment": opsDefaults["Increment"],
            "Stop": opsDefaults["Stop"],
        }
    },
]

function stateSetLevel(levelName) {
    level = levels.find( i => i.name == levelName );
    _requestsByYX = [];
    stateByYX = [];
    for(let opI in level.ops) {
        let op = level.ops[opI];
        for(operation in op) {
            if("_options" in op[operation]) {
                let _options = op[operation]._options;
                if(_options == "VarNames") {
                    op[operation].options = [];
                    for(let i=0; i<level.v; i++ ) {
                        op[operation].options.push(String.fromCharCode(65 + i));
                    }
                }
                else if(_options == "LineNames") {
                    op[operation].options = [];
                    for(let i=0; i<level.l; i++ ) {
                        op[operation].options.push(`${i + 1}`);
                    }
                }
                else if(_options == "GotoLineNames") {
                    op[operation].options = [];
                    for(let i=0; i<level.l; i++ ) {
                        op[operation].options.push(`Goto ${i + 1}`);
                    }
                }
            }
        }
    }
    _stateVarOffsetByVarName = {}
    for(let i=0; i<level.v; i++ ) {
        _stateVarOffsetByVarName[String.fromCharCode(65 + i)] = i;
    }
}

function stateInit() {
    stateByYX = [];

    for (let y=0; y < level.n; y++) {
        let xs = [];
        for (let x=0; x < level.n; x++) {
            let state = {
                line: 0,
                render: false,
                update: false,
                x: x,
                y: y,
                vars: [],
            };
            for (let i=0; i < level.v; i++) {
                state.vars.push(0);
            }
            xs.push(state);
        }
        stateByYX.push(xs);
    }

    let centerState = stateByYX[level.n / 2][level.n / 2];
    centerState.update = true;
    centerState.render = true;
}


let _lineFuncs = [];


function stateCompile(opStates) {
    /*
    Transpile one line at a time into Function(state)

    Example:
    [
        Replicate East
        If A < 3 then Goto 5
    ]

    Will code generate the following
    let lineFuncs = [
        function(state) {
            replicate(2);
            state.line++;
        },
        function(state) {
            if( state.vars[0] < 3 ) {
                state.line = 5 - 1;
            }
        },
    ];
    */

    let lineFuncStrs = opStates.map( (opLine) => {
        switch(opLine.operation) {
            case "Replicate":
                let dirName = opLine.operands[0].operand;
                return `replicate(${_dirNameToNumber[dirName]}, state); state.line++;`;
            case "Increment":
                let varOffset = _stateVarOffsetByVarName[opLine.operands[0].operand];
                return `state.vars[${varOffset}] = (state.vars[${varOffset}] + 1) % level.s; state.line++;`;
            case "Goto":
                let gotoLine = opLine.operands[0].operand;
                return `state.line = ${gotoLine};`;
            case "Stop":
                return `state.update = false;`;
            default:
                return `state.line++;`;
        }
    });

    _lineFuncs = lineFuncStrs.map( (i) => Function("state", i) );
}

function replicate(dir, srcState) {
    let dstX = srcState.x + _dirX[dir];
    let dstY = srcState.y + _dirY[dir];
    if (0 <= dstX && dstX < level.n && 0 <= dstY && dstY < level.n) {
        if( ! stateByYX[dstY][dstX].render) {
            // If it has never been alive then it can be requested
            _requestsByYX[dstY][dstX].push(srcState);
        }
    }
}

function stateUpdate() {
    _requestsByYX = [];
    for (let y=0; y < level.n; y++) {
        let requestX = [];
        for (let x=0; x < level.n; x++) {
            requestX.push([]);
        }
        _requestsByYX.push(requestX);
    }

    for (let y=0; y < level.n; y++) {
        for (let x=0; x < level.n; x++) {
            let state = stateByYX[y][x];
            if (state.update) {
                _lineFuncs[state.line](state);
                state.line = state.line % level.l;
            }
        }
    }

    // Activate if no contention
    for (let y=0; y < level.n; y++) {
        for (let x=0; x < level.n; x++) {
            let requests = _requestsByYX[y][x];
            if (requests.length == 1) {
                // Inherit memory state but not line
                let request = requests[0];
                let state = stateByYX[y][x];
                for (let i=0; i < level.v; i++) {
                    state.vars[i] = request.vars[i];
                }
                state.line = 0;
                state.render = true;
                state.update = true;
            }
        }
    }
}

