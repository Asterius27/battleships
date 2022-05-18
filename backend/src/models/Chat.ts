import mongoose from "mongoose";
const { Schema } = mongoose;

export interface Chat extends mongoose.Document {
    readonly _id: mongoose.Schema.Types.ObjectId,
    participants: mongoose.Schema.Types.ObjectId[],
    messages: mongoose.Schema.Types.ObjectId[],
    type: string
}

const chatSchema = new Schema({
    participants: {
        type: [mongoose.Types.ObjectId],
        required: true
    },
    messages: {
        type: [mongoose.Types.ObjectId],
        required: true
    },
    type: {
        type: String,
        required: true
    }
});

export function getSchema() {return chatSchema;}

let chatModel;
export function getModel() : mongoose.Model<Chat> {
    if (!chatModel) {
        chatModel = mongoose.model('Chat', getSchema());
    }
    return chatModel;
}

export function newChat(data) : Chat {
    let _chatModel = getModel();
    let chat = new _chatModel(data);
    return chat;
}