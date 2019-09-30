// v is the number of variables per cell
// s is the number of states per variable
// n is the number of cells on each axis
// l is the number of instruction lines

const v = 2;
const s = 8;
const n = 50;
const l = 4;

let stateByYX = [];

let stateVarNames = new Array( v ).fill( 1 ).map( ( _, i ) => String.fromCharCode( 65 + i ) );

let stateVarOffsetByVarName = {}
for (i in stateVarNames) {
    stateVarOffsetByVarName[stateVarNames[i]] = i;
}

const lines = new Array( l ).fill().map( ( _, i ) => i+1 );

const dirNames = ["West", "North", "East", "South"];
const dirNameToNumber = {
    "West": 0,
    "North": 1,
    "East": 2,
    "South": 3,
}
const dirX = [ -1, 0, 1, 0 ];
const dirY = [ 0, -1, 0, 1 ];

// When the operationsVersion is incremented, it invalidates the save state
const opsVersion = 1;

const opsDefaults = {
    // Each of the following arrays is called an "opState".
    // The initial state of each operand is a descriptive default. eg "Direction" as opposed to "East", "West", etc
    "Replicate": [
        {
            operand: "Direction",
            options: dirNames,
        },
    ],
    "Increment": [
        {
            operand: "Variable",
            options: stateVarNames,
        },
    ],
    "Goto": [
        {
            operand: "Line",
            options: lines,
        },
    ],
    "If": [
        {
            operand: "Left",
            options: stateVarNames,
        },
        {
            operand: "Cmp",
            options: [ "<", "<=", "==", ">=", ">" ],
        },
        {
            operand: "Right",
            options: stateVarNames,
        },
        {
            operand: "Goto",
            options: lines.map( i => `Goto ${i}` ),
        },
    ],
    "Stop": [
    ],
};

function stateInit() {
    stateByYX = [];

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

    let centerState = stateByYX[0][n/2];
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
                return `replicate(${dirNameToNumber[dirName]}, state); state.line++;`;
            case "Increment":
                let varOffset = stateVarOffsetByVarName[opLine.operands[0].operand];
                return `state.vars[${varOffset}]++; state.line++;`;
            case "Goto":
                let gotoLine = opLine.operands[0].operand;
                return `state.line = ${gotoLine};`;
            case "Stop":
                let stopLine = opLine.operands[0].operand;
                return `state.update = false;`;
        }
    });

    _lineFuncs = lineFuncStrs.map( (i) => Function("state", i) );
}

function replicate(dir, srcState) {
    let dstX = srcState.x + dirX[dir];
    let dstY = srcState.y + dirY[dir];
    if (0 <= dstX && dstX < n && 0 <= dstY && dstY < n) {
        stateByYX[dstY][dstX].update = true;
        stateByYX[dstY][dstX].render = true;
        stateByYX[dstY][dstX].line = srcState.line;
    }
}

function stateUpdate() {
    for (let y=0; y<n; y++) {
        for (let x=0; x<n; x++) {
            let state = stateByYX[y][x];
            if (state.update) {
                _lineFuncs[state.line](state);
                state.line = state.line % l;
            }
        }
    }
}

