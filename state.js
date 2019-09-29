// v is the number of variables per cell
// s is the number of states per variable
// n is the number of cells on each axis
// l is the number of instruction lines

const v = 2;
const s = 8;
const n = 30;
const l = 4;

let stateByYX = [];

let stateVarNames = new Array( v ).fill( 1 ).map( ( _, i ) => String.fromCharCode( 65 + i ) );

// TODO: Correct loop here:
let stateVarOffsetByVarName = { "A": 0, "B": 1 }

const lines = new Array( l ).fill().map( ( _, i ) => i+1 );

const operations = {
    "Replicate": [
        {
            label: "Direction",
        },
        {
            operand: "Direction",
            options: ["West", "North", "East", "South"],
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
            label: "Goto",
        },
        {
            operand: "Goto",
            options: lines,
        },
    ],
    "Stop": [
    ],
};

function stateInit() {
    for (let y=0; y < n; y++) {
        let xs = [];
        for (let x=0; x < n; x++) {
            let state = {
                line: 0,
                alive: 0,
                vars: [],
            };
            for (let i=0; i < v; i++) {
                state.vars.push(0);
            }
            xs.push(state);
        }
        stateByYX.push(xs);
    }
}

let _lineFuncs = [];

function stateCompile(rawOpLines) {
    /*
    Transpile one line at a time

    Example:
    [
        1. Replicate East
        2. If A < 3 then Goto 5
        3. Inc A
        4. Goto 2
        5. Stop
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
        function(state) {
            state[0]++;
        },
        function(state) {
            line = 1;
        },
        function(state) {
        },
    ];
    */

    let lineFuncStrs = rawOpLines.map( (opLine) => {
        //console.log(opLine);
        switch(opLine.operation) {
            case "Replicate":
                const dirNameToNumber = {
                    "West": 0,
                    "North": 1,
                    "East": 2,
                    "South": 3,
                }
                let dirName = opLine.operands[0];
                //let a = `replicate(${dirNameToNumber[dirName]}); state.line++;`;
                let a = `state.line++;`;
                console.log(a);
                return a;
            /*
            case "Increment":
                const varNameToOffset = {
                    "A": 0,
                    "B": 1,
                }
                let varOffset = varNameToOffset[opLine.operands[0]];
                return `state.vars[${varOffset}]++; state.line++;`;
            case "Goto":
                let gotoLine = opLine.operands[0];
                return `state.line = ${gotoLine};`;
            */
        }
    });

    _lineFuncs = [];
    for(lineFuncStr in lineFuncStrs) {
        _lineFuncs.push(Function("state", lineFuncStr));
    }
    debugger;
}

function replicate(dir) {
    console.log("replicate", dir);
}

function stateRestart() {
    stateByYX[n/2][n/2].alive = 1;
}

function stateUpdate() {
    for (let y=0; y<n; y++) {
        for (let x=0; x<n; x++) {
            let state = stateByYX[y][x];
            if (state.alive) {
                debugger;
                console.log("old state", state);
                _lineFuncs[state.line](state);
                console.log("new state", state);
            }
        }
    }
}

