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
    result: string,
    chat: mongoose.Schema.Types.ObjectId,
    createdAt: mongoose.Schema.Types.Date,
    setStartingPlayer: ()=>void,
    isMatchFinished: ()=>boolean,
    updateGrid: (move:string, player:boolean)=>void,
    validateMove: (move:string, player:boolean)=>boolean,
    updateMoves: (move:string)=>void
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
    },
    result: {
        type: String,
        required: false
    },
    chat: {
        type: mongoose.Types.ObjectId,
        required: true
    }
}, {
    timestamps: true
});

matchSchema.methods.setStartingPlayer = function() {
    let rnd = Math.floor(Math.random() * 2);
    if (rnd === 0) {
        this.startingPlayer = this.playerOne;
    } else {
        this.startingPlayer = this.playerTwo;
    }
}

let parseMove = function(move:string) : {i:number, j:number} {
    let i = 10;
    if (move.length === 2) {
        i = parseInt(move.charAt(1)) - 1;
    }
    if (move.length === 3) {
        i = 9;
    }
    let j = 0;
    switch (move.charAt(0)) {
        case 'A':
            j = 0;
            break;
        case 'B':
            j = 1;
            break;
        case 'C':
            j = 2;
            break;
        case 'D':
            j = 3;
            break;
        case 'E':
            j = 4;
            break;
        case 'F':
            j = 5;
            break;
        case 'G':
            j = 6;
            break;
        case 'H':
            j = 7;
            break;
        case 'I':
            j = 8;
            break;
        case 'J':
            j = 9;
            break;
        default:
            console.log("parse move error");
    }
    if (i === 10) {
        console.log("parse move error");
    }
    return {i, j};
}

matchSchema.methods.validateMove = function(move:string, player:boolean) : boolean {
    let {i, j} = parseMove(move);
    if (player) {
        if (this.gridTwo[i][j] === 'h' || this.gridTwo[i][j] === 'm' || this.gridTwo[i][j] === 'd') {
            return false;
        } else {
            return true;
        }
    } else {
        if (this.gridOne[i][j] === 'h' || this.gridOne[i][j] === 'm' || this.gridOne[i][j] === 'd') {
            return false;
        } else {
            return true;
        }
    }
}

let checkBoat = function(i:number, j:number, grid:string[][], d:string, c:string, s:string) : number {
    let boat = 0;
    if (d === 'n') {
        while (i > 0) {
            i = i - 1;
            if (grid[i][j] === c) {
                grid[i][j] = s;
                boat = boat + 1;
            } else {
                break;
            }
        }
        return boat;
    }
    if (d === 's') {
        while (i < grid.length - 1) {
            i = i + 1;
            if (grid[i][j] === c) {
                grid[i][j] = s;
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
            if (grid[i][j] === c) {
                grid[i][j] = s;
                boat = boat + 1;
            } else {
                break;
            }
        }
        return boat;
    }
    if (d === 'e') {
        while (j < grid.length - 1) {
            j = j + 1;
            if (grid[i][j] === c) {
                grid[i][j] = s;
                boat = boat + 1;
            } else {
                break;
            }
        }
        return boat;
    }
}

let checkDestroyedBoatHelper = function(i:number, j:number, grid:string[][]) {
    let north = checkBoat(i, j, grid, 'n', 'h', 'h');
    let south = checkBoat(i, j, grid, 's', 'h', 'h');
    let east = checkBoat(i, j, grid, 'e', 'h', 'h');
    let west = checkBoat(i, j, grid, 'w', 'h', 'h');
    let boat_length = 1 + north + south + east + west;
    if (north !== 0 && south === 0) {
        if (i - boat_length >= 0) {
            if (grid[i - boat_length][j] !== 'b') {
                grid[i][j] = 'd';
                checkBoat(i, j, grid, 'n', 'h', 'd');
            }
        } else {
            grid[i][j] = 'd';
            checkBoat(i, j, grid, 'n', 'h', 'd');
        }
    }
    if (south !== 0 && north === 0) {
        if (i + boat_length < grid.length) {
            if (grid[i + boat_length][j] !== 'b') {
                grid[i][j] = 'd';
                checkBoat(i, j, grid, 's', 'h', 'd');
            }
        } else {
            grid[i][j] = 'd';
            checkBoat(i, j, grid, 's', 'h', 'd');
        }
    }
    if (north !== 0 && south !== 0) {
        if (i - (north + 1) >= 0) {
            if (i + south + 1 < grid.length) {
                if (grid[i + south + 1][j] !== 'b' && grid[i - (north + 1)][j] !== 'b') {
                    grid[i][j] = 'd';
                    checkBoat(i, j, grid, 's', 'h', 'd');
                    checkBoat(i, j, grid, 'n', 'h', 'd');
                }
            } else {
                if (grid[i - (north + 1)][j] !== 'b') {
                    grid[i][j] = 'd';
                    checkBoat(i, j, grid, 's', 'h', 'd');
                    checkBoat(i, j, grid, 'n', 'h', 'd');
                }
            }
        } else {
            if (i + south + 1 < grid.length) {
                if (grid[i + south + 1][j] !== 'b') {
                    grid[i][j] = 'd';
                    checkBoat(i, j, grid, 's', 'h', 'd');
                    checkBoat(i, j, grid, 'n', 'h', 'd');
                }
            } else {
                grid[i][j] = 'd';
                checkBoat(i, j, grid, 's', 'h', 'd');
                checkBoat(i, j, grid, 'n', 'h', 'd');
            }
        }
    }
    if (east !== 0 && west === 0) {
        if (j + boat_length < grid.length) {
            if (grid[i][j + boat_length] !== 'b') {
                grid[i][j] = 'd';
                checkBoat(i, j, grid, 'e', 'h', 'd');
            }
        } else {
            grid[i][j] = 'd';
            checkBoat(i, j, grid, 'e', 'h', 'd');
        }
    }
    if (west !== 0 && east === 0) {
        if (j - boat_length >= 0) {
            if (grid[i][j - boat_length] !== 'b') {
                grid[i][j] = 'd';
                checkBoat(i, j, grid, 'w', 'h', 'd');
            }
        } else {
            grid[i][j] = 'd';
            checkBoat(i, j, grid, 'w', 'h', 'd');
        }
    }
    if (west !== 0 && east !== 0) {
        if (j - (west + 1) >= 0) {
            if (j + east + 1 < grid.length) {
                if (grid[i][j + east + 1] !== 'b' && grid[i][j - (west + 1)] !== 'b') {
                    grid[i][j] = 'd';
                    checkBoat(i, j, grid, 'e', 'h', 'd');
                    checkBoat(i, j, grid, 'w', 'h', 'd');
                }
            } else {
                if (grid[i][j - (west + 1)] !== 'b') {  
                    grid[i][j] = 'd';
                    checkBoat(i, j, grid, 'e', 'h', 'd');
                    checkBoat(i, j, grid, 'w', 'h', 'd');
                }
            }
        } else {
            if (j + east + 1 < grid.length) {
                if (grid[i][j + east + 1] !== 'b') {
                    grid[i][j] = 'd';
                    checkBoat(i, j, grid, 'e', 'h', 'd');
                    checkBoat(i, j, grid, 'w', 'h', 'd');
                }
            } else {
                grid[i][j] = 'd';
                checkBoat(i, j, grid, 'e', 'h', 'd');
                checkBoat(i, j, grid, 'w', 'h', 'd');
            }
        }
    }
}

let checkDestroyedBoat = function(i:number, j:number, grid:string[][]) {
    if (i > 0 && i < grid.length - 1 && j > 0 && j < grid.length - 1) {
        if (grid[i - 1][j] !== 'b' && grid[i + 1][j] !== 'b' && grid[i][j - 1] !== 'b' && grid[i][j + 1] !== 'b') {
            checkDestroyedBoatHelper(i, j, grid);
        }
    }
    if (i === 0) {
        if (j === 0) {
            if (grid[i + 1][j] !== 'b' && grid[i][j + 1] !== 'b') {
                checkDestroyedBoatHelper(i, j, grid);
            }
        }
        if (j === grid.length - 1) {
            if (grid[i + 1][j] !== 'b' && grid[i][j - 1] !== 'b') {
                checkDestroyedBoatHelper(i, j, grid);
            }
        }
        if (j > 0 && j < grid.length - 1) {
            if (grid[i + 1][j] !== 'b' && grid[i][j - 1] !== 'b' && grid[i][j + 1] !== 'b') {
                checkDestroyedBoatHelper(i, j, grid);
            }
        }
    }
    if (i === grid.length - 1) {
        if (j === 0) {
            if (grid[i - 1][j] !== 'b' && grid[i][j + 1] !== 'b') {
                checkDestroyedBoatHelper(i, j, grid);
            }
        }
        if (j === grid.length - 1) {
            if (grid[i - 1][j] !== 'b' && grid[i][j - 1] !== 'b') {
                checkDestroyedBoatHelper(i, j, grid);
            }
        }
        if (j > 0 && j < grid.length - 1) {
            if (grid[i - 1][j] !== 'b' && grid[i][j - 1] !== 'b' && grid[i][j + 1] !== 'b') {
                checkDestroyedBoatHelper(i, j, grid);
            }
        }
    }
    if (i > 0 && i < grid.length - 1) {
        if (j === 0) {
            if (grid[i - 1][j] !== 'b' && grid[i + 1][j] !== 'b' && grid[i][j + 1] !== 'b') {
                checkDestroyedBoatHelper(i, j, grid);
            }
        }
        if (j === grid.length - 1) {
            if (grid[i - 1][j] !== 'b' && grid[i + 1][j] !== 'b' && grid[i][j - 1] !== 'b') {
                checkDestroyedBoatHelper(i, j, grid);
            }
        }
    }
}

matchSchema.methods.updateGrid = function(move:string, player:boolean) {
    let {i, j} = parseMove(move);
    if (player) {
        if (this.gridTwo[i][j] === 'b') {
            this.gridTwo[i][j] = 'h';
            checkDestroyedBoat(i, j, this.gridTwo);
        }
        if (this.gridTwo[i][j] === 's') {
            this.gridTwo[i][j] = 'm';
        }
    } else {
        if (this.gridOne[i][j] === 'b') {
            this.gridOne[i][j] = 'h';
            checkDestroyedBoat(i, j, this.gridOne);
        }
        if (this.gridOne[i][j] === 's') {
            this.gridOne[i][j] = 'm';
        }
    }
}

matchSchema.methods.updateMoves = function(move:string) {
    this.moves.push(move);
}

matchSchema.methods.isMatchFinished = function() : boolean {
    let playerOneWon = true;
    let playerTwoWon = true;
    for (let i = 0; i < this.gridOne.length; i++) {
        for (let j = 0; j < this.gridOne[i].length; j++) {
            if (this.gridOne[i][j] === 'b') {
                playerTwoWon = false;
            }
        }
    }
    for (let i = 0; i < this.gridTwo.length; i++) {
        for (let j = 0; j < this.gridTwo[i].length; j++) {
            if (this.gridTwo[i][j] === 'b') {
                playerOneWon = false;
            }
        }
    }
    if (!playerOneWon && !playerTwoWon) {
        return false;
    }
    if (playerOneWon && !playerTwoWon) {
        this.result = "1-0";
        return true;
    }
    if (!playerOneWon && playerTwoWon) {
        this.result = "0-1";
        return true;
    }
    if (playerOneWon && playerTwoWon) {
        return null;
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
        if (i < grid.length - 1) {
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
        if (j < grid.length - 1) {
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

export function isValidGrid(grid:string[][]) : boolean {
    let temp = new Array(grid.length);
    for (let i = 0; i < temp.length; i++) {
        temp[i] = new Array(grid[i].length);
        for (let j = 0; j < temp[i].length; j++) {
            temp[i][j] = grid[i][j];
        }
    }
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
                    let north = checkBoat(i, j, temp, 'n', 'b', 'v');
                    let south = checkBoat(i, j, temp, 's', 'b', 'v');
                    let east = checkBoat(i, j, temp, 'e', 'b', 'v');
                    let west = checkBoat(i, j, temp, 'w', 'b', 'v');
                    if ((north !== 0 || south !== 0) && (east !== 0 || west !== 0)) {
                        return false;
                    }
                    if (north !== 0 || south !== 0) {
                        boat = boat + north + south;
                    }
                    if (west !== 0 || east !== 0) {
                        boat = boat + west + east;
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
        for (let k = 0; k < boats.length; k++) {
            if (boats[k] !== 0) {
                return false;
            }
        }
        return true;
    } else {
        return false;
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

export function isMove(move:string) : boolean {
    if (parseInt(move.charAt(1)) > 10 || parseInt(move.charAt(1)) < 1) {
        return false;
    }
    if (!("ABCDEFGHIJ".includes(move.charAt(0)))) {
        return false;
    }
    return true;
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