import mongoose from "mongoose";
const { Schema } = mongoose;

export interface Match extends mongoose.Document {
    readonly _id: mongoose.Schema.Types.ObjectId,
    playerOne: mongoose.Schema.Types.ObjectId,
    playerTwo: mongoose.Schema.Types.ObjectId,
    gridOne: string[][],
    gridTwo: string[][],
    startingPlayer: mongoose.Schema.Types.ObjectId,
    moves: string[],
    createdAt: mongoose.Schema.Types.Date,
    isValidGrid: (grid:string[][])=>boolean,
    setStartingPlayer: ()=>void,
    createRandomGrid: ()=>string[][]
}

const matchSchema = new Schema({
    playerOne: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    playerTwo: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    gridOne: {
        type: [[String]],
        required: false
    },
    gridTwo: {
        type: [[String]],
        required: false
    },
    startingPlayer: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    moves: {
        type: [String],
        required: false
    }
}, {
    timestamps: true
});

let checkBoat = function(i:number, j:number, grid:string[][], d:string) : number {
    let boat = 0;
    if (d === 'n') {
        while (i > 0) {
            i = i - 1;
            if (grid[i][j] === 'b') {
                grid[i][j] = 'v';
                boat = boat + 1;
            } else {
                break;
            }
        }
        return boat;
    }
    if (d === 's') {
        while (i < grid.length) {
            i = i + 1;
            if (grid[i][j] === 'b') {
                grid[i][j] = 'v';
                boat = boat + 1;
            } else {
                break;
            }
        }
        return boat;
    }
    if (d === 'w') {
        while (j > 0) {
            j = j - 1;
            if (grid[i][j] === 'b') {
                grid[i][j] = 'v';
                boat = boat + 1;
            } else {
                break;
            }
        }
        return boat;
    }
    if (d === 'e') {
        while (j < grid.length) {
            j = j + 1;
            if (grid[i][j] === 'b') {
                grid[i][j] = 'v';
                boat = boat + 1;
            } else {
                break;
            }
        }
        return boat;
    }
}

let checkVisited = function(i:number, j:number, grid:string[][], d:string) : number {
    if (d === 'n') {
        if (i > 0) {
            i = i - 1;
            if (grid[i][j] === 'b') {
                return 0;
            }
            if (grid[i][j] === 'v' || grid[i][j] === 'c') {
                return 2;
            }
        }
        return 1;
    }
    if (d === 's') {
        if (i < grid.length) {
            i = i + 1;
            if (grid[i][j] === 'b') {
                return 0;
            }
            if (grid[i][j] === 'v' || grid[i][j] === 'c') {
                return 2;
            }
        }
        return 1;
    }
    if (d === 'w') {
        if (j > 0) {
            j = j - 1;
            if (grid[i][j] === 'b') {
                return 0;
            }
            if (grid[i][j] === 'v' || grid[i][j] === 'c') {
                return 2;
            }
        }
        return 1;
    }
    if (d === 'e') {
        if (j < grid.length) {
            j = j + 1;
            if (grid[i][j] === 'b') {
                return 0;
            }
            if (grid[i][j] === 'v' || grid[i][j] === 'c') {
                return 2;
            }
        }
        return 1;
    }
}

matchSchema.methods.isValidGrid = function(grid:string[][]) : boolean {
    let temp = [...grid];
    let boats = [2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 5];
    if(temp.length === 10) {
        for (let i = 0; i < temp.length; i++) {
            if (temp[i].length !== 10) {
                return false;
            }
        }
        for (let i = 0; i < temp.length; i++) {
            for (let j = 0; j < temp.length; j++) {
                if (temp[i][j] === 'b') {
                    temp[i][j] = 'c';
                    let boat = 1;
                    let flag = false;
                    let north = checkBoat(i, j, temp, 'n');
                    let south = checkBoat(i, j, temp, 's');
                    let east = checkBoat(i, j, temp, 'e');
                    let west = checkBoat(i, j, temp, 'w');
                    if ((north !== 0 || south !== 0) && (east !== 0 || west !== 0)) {
                        return false;
                    }
                    if (north !== 0 || south !== 0) {
                        boat = north + south;
                    }
                    if (west !== 0 || east !== 0) {
                        boat = west + east;
                    }
                    for (let h = 0; h < boats.length; h++) {
                        if (boats[h] === boat && !flag) {
                            boats[h] = 0;
                            flag = true;
                        }
                    }
                    if (!flag) {
                        return false;
                    }
                }
                if (temp[i][j] === 'v') {
                    let north = checkVisited(i, j, temp, 'n');
                    let south = checkVisited(i, j, temp, 's');
                    let east = checkVisited(i, j, temp, 'e');
                    let west = checkVisited(i, j, temp, 'w');
                    if (north === 0 || south === 0 || east === 0 || west === 0) {
                        return false;
                    }
                    if ((north === 2 || south === 2) && (east === 2 || west === 2)) {
                        return false;
                    }
                }
            }
        }
        return true;
    } else {
        return false;
    }
}

matchSchema.methods.setStartingPlayer = function() {
    let rnd = Math.floor(Math.random() * 2);
    if (rnd === 0) {
        this.startingPlayer = this.playerOne;
    } else {
        this.startingPlayer = this.playerTwo;
    }
}

// TODO remove
let printGrid = function(grid:string[][]) {
    console.log(" ");
    for (let i = 0; i < grid.length; i++) {
        let s = "";
        for (let j = 0; j < grid[i].length; j++) {
            s = s + grid[i][j] + " ";
        }
        console.log(s);
    }
}

let boatFits = function(x:number, y:number, l:number, grid:string[][], d:string) : boolean {
    if (d === 'v') {
        for (let i = 0; i < l; i++) {
            if (grid[y - i][x] === 'b' || grid[y - i][x] === 'f') {
                return false;
            }
        }
        return true;
    }
    if (d === 'h') {
        for (let i = 0; i < l; i++) {
            if (grid[y][x - i] === 'b' || grid[y][x - i] === 'f') {
                return false;
            }
        }
        return true;
    }
}

let regenerateAvailableCoords = function(grid:string[][]) : number[] {
    let availableCoords = new Array();
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            if (grid[i][j] === 's') {
                availableCoords.push(i * 10 + j);
            }
        }
    }
    return availableCoords;
}

export function createRandomGrid() : string[][] {
    let grid = new Array(10);
    let boats = [2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 5];
    for (let i = 0; i < grid.length; i++) {
        grid[i] = new Array(10);
        for (let j = 0; j < grid[i].length; j++) {
            grid[i][j] = 's';
        }
    }
    let availableCoords = new Array(100);
    for (let i = 0; i < availableCoords.length; i++) {
        availableCoords[i] = i;
    }
    let i = 0;
    let j = 0;
    while (i < boats.length) {
        if (j > 150) {
            return null;
        }
        j = j + 1;
        let rnd = Math.floor(Math.random() * 2);
        if (rnd === 0) {
            let coord = 0;
            while (coord < ((boats[i] * 10) - 10)) {
                coord = availableCoords[Math.floor(Math.random() * availableCoords.length)];
            }
            let x = coord % 10;
            let y = Math.trunc(coord / 10);
            if (boatFits(x, y, boats[i], grid, 'v')) {
                if (y < grid.length - 1) {
                    grid[y + 1][x] = 'f'
                }
                for (let j = 0; j < boats[i]; j++) {
                    grid[y - j][x] = 'b';
                    if (x > 0) {
                        grid[y - j][x - 1] = 'f';
                    }
                    if (x < grid.length - 1) {
                        grid[y - j][x + 1] = 'f';
                    }
                }
                if ((y - (boats[i] - 1)) > 0) {
                    grid[y - boats[i]][x] = 'f';
                }
                availableCoords = regenerateAvailableCoords(grid);
                i = i + 1;
            }
        }
        if (rnd === 1) {
            let coord = 0;
            while ((coord % 10) < (boats[i] - 1)) {
                coord = availableCoords[Math.floor(Math.random() * availableCoords.length)];
            }
            let x = coord % 10;
            let y = Math.trunc(coord / 10);
            if (boatFits(x, y, boats[i], grid, 'h')) {
                if (x < grid.length - 1) {
                    grid[y][x + 1] = 'f'
                }
                for (let j = 0; j < boats[i]; j++) {
                    grid[y][x - j] = 'b';
                    if (y > 0) {
                        grid[y - 1][x - j] = 'f';
                    }
                    if (y < grid.length - 1) {
                        grid[y + 1][x - j] = 'f';
                    }
                }
                if ((x - (boats[i] - 1)) > 0) {
                    grid[y][x - boats[i]] = 'f';
                }
                availableCoords = regenerateAvailableCoords(grid);
                i = i + 1;
            }
        }
    }
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            if (grid[i][j] === 'f') {
                grid[i][j] = 's';
            }
        }
    }
    return grid;
}

export function getSchema() {return matchSchema;}

let matchModel;
export function getModel() : mongoose.Model<Match> {
    if (!matchModel) {
        matchModel = mongoose.model('Match', getSchema());
    }
    return matchModel;
}

export function newMatch(data) : Match {
    let _matchModel = getModel();
    let match = new _matchModel(data);
    return match;
}