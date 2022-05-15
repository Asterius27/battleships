import mongoose from "mongoose";
const { Schema } = mongoose;

// TODO (should be a singleton?)

export interface MatchManager extends mongoose.Document {
    readonly _id: mongoose.Schema.Types.ObjectId,
    wait_list: [mongoose.Schema.Types.ObjectId]
}

const matchManagerSchema = new Schema({
    wait_list: {
        type: [mongoose.Types.ObjectId],
        required: true
    }
});

export function getSchema() {return matchManagerSchema;}

let matchManagerModel;
export function getModel() : mongoose.Model<MatchManager> {
    if (!matchManagerModel) {
        matchManagerModel = mongoose.model('MatchManager', getSchema());
    }
    return matchManagerModel;
}

export function newMatchManager(data) : MatchManager {
    let _matchManagerModel = getModel();
    let matchManager = new _matchManagerModel(data);
    return matchManager;
}