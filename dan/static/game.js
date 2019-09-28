var canvas = document.getElementById('game-canvas');
var g = canvas.getContext('2d');

// TODO: this should be part of a level configuration
var maxStates = 2;


var stateColors = {
    0: "#FF0000",
    1: "#00FF00"
};

class GameRenderer {
    constructor(game) {
        this.game = game;
        this.gridScale = 20;
    }
    render() {
        for (var x = 0; x < this.game.width; x++) {
            for (var y = 0; y < this.game.height; y++) {
                var agent = this.game.map[x][y].agent;
                if (agent != null) {
                    g.fillStyle = stateColors[agent.state];
                    g.fillRect(x * this.gridScale, y * this.gridScale, this.gridScale, this.gridScale);
                }
                g.strokeStyle = "#000000";
                g.strokeRect(x * this.gridScale, y * this.gridScale, this.gridScale, this.gridScale);
            }
        }
    }
}

function generateMap(width, height) {
    var map = create2DArray(width, height);
    for (var x = 0; x < this.game.width; x++) {
        for (var y = 0; y < this.game.height; y++) {
            map[x][y] = new Cell();
        }
    }
    return map;
}

class Game {
    start() {
        this.renderer = new GameRenderer(this);

        // TODO: these map fields should probably be encapsulated in their own class
        this.width = 100;
        this.height = 100;
        this.map = generateMap(this.width, this.height);
        this.actionMap = create2DArray(this.width, this.height);

        this.map[20][20].agent = new Agent();
    }
    update() {
        this.renderer.render();
        this.tick();
    }
    tick() {
        // Clear action map
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                this.actionMap[x][y] = [];
            }
        }

        // Generate action map
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                var agent = this.map[x][y].agent;
                if (agent != null) {
                    var action = agent.tick();
                    var targetX = x;
                    var targetY = y;
                    switch (action) {
                        case "rep_right":
                            targetX += 1;
                            break;
                    }
                    this.actionMap[targetX][targetY].push({ agent: agent, action: action });
                }
            }
        }

        // Execute actions
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                var actions = this.actionMap[x][y];
                for (var i = 0; i < actions.length; i++ ) {
                    var action = actions[i];
                    switch(action.action) {
                        case "inc_state":
                            action.agent.state = (action.agent.state + 1) % maxStates;
                            break;
                        case "rep_right":
                            this.map[x][y].agent = action.agent.replicate();
                            break;
                        case "hold":
                            action.agent.instructionPointer--;
                            break;
                    }
                }
            }
        }
    }
}

/**
 * Each cell optionally has a single agent.
 * 
 * Any new grid based mechanics can store their state in Cell.
 * 
 * Note that Cell is "cell" as in "grid cell", not as in "biological cell"
 */
class Cell {
    constructor() {
        this.agent = null;
    }
}

/**
 * Agents occupy a cell in the map, and are able to take a single action per tick, including:
 * 
 * Change State
 * Replicate in direction
 */
class Agent {
    constructor(agent) {
        this.state = 0;

        this.instructionPointer = 0;
        // TODO: this needs to be provided by player!
        this.instructions = [
            "inc_state",
            "rep_right",
            "hold"
        ];
    }
    tick() {
        var action = this.instructions[this.instructionPointer];
        this.instructionPointer += 1;
        return action;
    }
    replicate() {
        var child = new Agent();
        child.state = this.state;
        return child;
    }
}

var game = new Game();

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function init() {
    // Add handler so that resize is called whenever the window is resized
    window.addEventListener('resize', resizeCanvas, false);

    // First time resize
    resizeCanvas();

    // Call game's start function
    game.start();

    // Kick off update. It will requestAnimationFrame for itself for further updates
    update();
}

function update() {
    window.requestAnimationFrame(update);

    game.update();
}

document.addEventListener("DOMContentLoaded", function () {
    init();
});

function drawLine(x1, y1, x2, y2) {
    c.save();
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
    c.restore();
}

function rgbString(r, g, b) {
    return 'rgb( ' + r + ', ' + g + ', ' + b + ' )';
}

function create2DArray(width, height) {
    var arr = new Array(width);
    for (var i = 0; i < width; i++) {
        arr[i] = new Array(height);
    }
    return arr;
}
