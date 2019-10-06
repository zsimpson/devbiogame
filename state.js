function deepCopy(original) {
    return $.extend(true, {}, original);
}

let stateByYX = null;

let _requestsByYX = null;

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

let _currentLevel = null;

let _saveGame = null;

function _decodeSaveGame(stateStr) {
}

function _encodeSaveGame(saveGame) {
    let programOps = [];

    let lineCodes = saveGame.programLines.map( (programLine) => {
        // LOOKUP the programLine.operation in the _ops
        let _operation = _ops.find( opI => opI.name == programLine.operation );
        if( _operation ) {
            // For each operand, CONVERT each option to it's offset in  _operation.operandOptions
            let lineCodes = programLine.operands.map( (operand, operandI) => {
                let allowedOptions = _currentLevel.optionsByName[ _operation.operandOptions[operandI].options ];
                let selectedOption = operand.operand;
                console.log("allowedOptions", allowedOptions);
                let foundOffset = allowedOptions.findIndex( op => op == selectedOption );
                return `${foundOffset}`;
            });
            return _operation.letter + lineCodes.join(".");
        }
        return "x";
    });

    console.log(lineCodes);
}

function stateGet(levelName) {
    // Called by the UI to request the information needed to populate the UI
    // If levelName is "" then this is the startup condition
    // otherwise a level request button was pressed.
    if(levelName == "") {
        // Load from save game or create new game
        let encodedSaveGame = null;//window.localStorage.getItem("saveGame");
        if(encodedSaveGame == null) {
            _saveGame = {
                levelName: "Alternator",
                programLines: [],
            }
        }
        else {
            _saveGame = _decodeSaveGame(encodedSaveGame);
        }
        levelName = _saveGame.levelName;
    }

    let level = _levels.find( i => i.name == levelName );

    _currentLevel = level;

    let levelNames = _levels.map( i => i.name );

    let optionsByName = {
        _lineNames: Array(level.l).fill().map( (_,i) => `${i+1}` ),
        _varNames: Array(level.v).fill().map( (_,i) => String.fromCharCode(65 + i) ),
        _compares: _compares,
        _dirNames: _dirNames,
    }
    _currentLevel.optionsByName = optionsByName;

    let allowedOperations = level.allowedOperations.map( opName => {
        let foundOp = _ops.find( i => i.name == opName );
        let op = deepCopy(foundOp);

        op.operandOptions.map( operandOption => {
            let options = [];
            operandOption.options = optionsByName[operandOption.options];
        })

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

let _lineFuncs = [];

function stateProgramChanged(programLines) {
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

    // UPDATE save game
    _saveGame.programLines = programLines;
    window.localStorage.setItem("saveGame", JSON.stringify(_saveGame));
    let encoded = _encodeSaveGame(_saveGame);

    let lineFuncStrs = programLines.map( (programLine) => {
        switch(programLine.operation) {
            case "Replicate":
                let dirName = programLine.operands[0].operand;
                return `replicate(${_dirNameToNumber[dirName]}, state); state.line++;`;
            case "Increment":
                let varOffset = programLine.operands[0].operand.charCodeAt(0) - 65;
                return `state.vars[${varOffset}] = (state.vars[${varOffset}] + 1) % _currentLevel.s; state.line++;`;
            case "Goto":
                let gotoLine = programLine.operands[0].operand;
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
    if (0 <= dstX && dstX < _currentLevel.n && 0 <= dstY && dstY < _currentLevel.n) {
        if( ! stateByYX[dstY][dstX].render) {
            // If it has never been alive then it can be requested
            _requestsByYX[dstY][dstX].push(srcState);
        }
    }
}

function stateReset() {
    stateByYX = [];
    let {v, n} = _currentLevel;

    for (let y=0; y < n; y++) {
        let xs = [];
        for (let x=0; x < n; x++) {
            let state = {
                line: 0,
                render: false,
                update: false,
                x: x,
                y: y,
                vars: [],
            };
            for (let i=0; i < v; i++) {
                state.vars.push(0);
            }
            xs.push(state);
        }
        stateByYX.push(xs);
    }

    let centerState = stateByYX[n / 2][n / 2];
    centerState.update = true;
    centerState.render = true;
}

function stateUpdate() {
    let {n , v, l} = _currentLevel;

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
            if (state.update) {
                _lineFuncs[state.line](state);
                state.line = state.line % l;
            }
        }
    }

    // Activate if no contention
    for (let y=0; y < n; y++) {
        for (let x=0; x < n; x++) {
            let requests = _requestsByYX[y][x];
            if (requests.length == 1) {
                // Inherit memory state but not line
                let request = requests[0];
                let state = stateByYX[y][x];
                for (let i=0; i < v; i++) {
                    state.vars[i] = request.vars[i];
                }
                state.line = 0;
                state.render = true;
                state.update = true;
            }
        }
    }
}

