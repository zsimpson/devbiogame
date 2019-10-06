function deepCopy(original) {
    return $.extend(true, {}, original);
}

let stateByYX = null;

let _requestsByYX = null;
let _stateVarOffsetByVarName = null;

const _compares = [ "<", "<=", "==", ">=", ">" ];
const _dirNames = ["West", "North", "East", "South"];
const _dirNameToNumber = {
    "West": 0,
    "North": 1,
    "East": 2,
    "South": 3,
}
const _dirX = [ -1, 0, 1, 0 ];
const _dirY = [ 0, -1, 0, 1 ];

const _opsVersion = 3;
const _ops = [
    // Each of the following are copied to make a state
    // For example when you click on ["Replicate", "West"] that will create
    // a "op" by cloning the "Replicate" block

    {
        name: "Replicate",
        letter: "r",
        operands: [],
        operandOptions: [
            {
                operand: "Direction",
                options: "_dirNames",
            },
        ],
    },
    {
        name: "If",
        letter: "f",
        operands: [],
        operandOptions: [
            {
                operand: "Left",
                options: "_varNames",
            },
            {
                operand: "Cmp",
                options: "_compares",
            },
            {
                operand: "Right",
                options: "_varNames",
            },
            {
                operand: "Goto",
                options: "_lineNames",
            },
        ],
    },
    {
        name: "Increment",
        letter: "i",
        operands: [],
        operandOptions: [
            {
                operand: "Variable",
                options: "_varNames",
            },
        ],
    },
    {
        name: "Goto",
        letter: "g",
        operands: [],
        operandOptions: [
            {
                operand: "Line",
                options: "_lineNames",
            },
        ],
    },
    {
        name: "Stop",
        letter: "s",
        operands: [],
        operandOptions: [],
    },
]

const _levels = [
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
        allowedOperations: [ "Replicate", "Increment", "Stop" ],
    },
    {
        name: "Filler",
        v: 1,
        s: 2,
        n: 40,
        l: 4,
        allowedOperations: [ "Replicate", "Increment", "Stop" ],
    },
]

let _saveGame = null;

function _decodeSaveGame(stateStr) {
}

function _encodeSaveGame(saveGame) {
    let programOps = [];
    saveGame.program.map( (opLine) => {
        let op = _ops.find( op => op.name == opLine.name );
        let level = _levels.find( i => i.name == saveGame.levelName );
    });
}


function stateGet() {
    // Called by the UI to request the information needed to populate the UI

    let encodedSaveGame = window.localStorage.getItem("saveGame");
    if(encodedSaveGame == null) {
        _saveGame = {
            level: "Alternator",
            program: [],
        }
    }
    else {
        _saveGame = _decodeSaveGame(encodedSaveGame);
    }

    let levelNames = _levels.map( i => i.name );

    let level = _levels.find( i => i.name == _saveGame.level );
    debugger;

    let allowedOperations = level.allowedOperations.map( opName => {
        let foundOp = _ops.find( i => i.name == opName );
        let op = deepCopy(foundOp);

        op.operandOptions.map( operandOption => {
            let options = [];
            switch(operandOption.options) {
                case "_lineNames":
                    options = new Array(level.l).fill().map( i => `${i+1}` );
                    break;

                case "_varNames":
                    options = new Array(level.v).fill().map( (i) => {
                        String.fromCharCode(65 + i);
                    });
                    break;

                case "_compares":
                    options = _compares;
                    break;

                case "_dirNames":
                    options = _dirNames;
                    break;
            }
            operandOption.options = options;
        })

        debugger;
        return op;
    });

    let program = {
        allowedOperations: allowedOperations,
        lines: [],
    };

    for( let line=0; line<level.l; line++ ) {
        program.lines.push({
            operation: "Choose",
            operands: [],
        });
    }

    return {levelNames, level, program};
}

function stateUpdateSaveGameFromUI(uiState) {
    saveGame.program = uiState.program;
    let encoded = _encodeSaveGame(saveGame);
    window.localStorage.setItem("saveGame", encoded);
}

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

function stateInit(level) {
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

function stateUpdate(level) {
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

