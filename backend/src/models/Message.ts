import mongoose from "mongoose";
const { Schema } = mongoose;

export interface Message extends mongoose.Document {
    readonly _id: mongoose.Schema.Types.ObjectId,
    owner: mongoose.Schema.Types.ObjectId,
    owner_username: string,
    content: string,
    visibility: boolean,
    createdAt: mongoose.Schema.Types.Date
}

const messageSchema = new Schema({
    owner: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    owner_username: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    visibility: {
        type: Boolean,
        required: true
    }
}, {
    timestamps: true
});

export function getSchema() {return messageSchema;}

let messageModel;
export function getModel() : mongoose.Model<Message> {
    if (!messageModel) {
        messageModel = mongoose.model('Message', getSchema());
    }
    return messageModel;
}

export function newMessage(data) : Message {
    let _messageModel = getModel();
    let message = new _messageModel(data);
    return message;
}
