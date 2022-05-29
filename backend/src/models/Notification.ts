import mongoose from "mongoose";
const { Schema } = mongoose;

export interface Notification extends mongoose.Document {
    readonly _id: mongoose.Schema.Types.ObjectId,
    user: mongoose.Schema.Types.ObjectId,
    friend_request: boolean,
    match_invite: boolean,
    friend_request_accepted: boolean,
    friend_messages: mongoose.Schema.Types.ObjectId[],
    moderator_messages: mongoose.Schema.Types.ObjectId[],
    match_alerts: mongoose.Schema.Types.ObjectId[],
    setNotifications: (data:any)=>void,
    deleteNotifications: (data:any)=>void
}

const notificationSchema = new Schema({
    user: {
        type: mongoose.Types.ObjectId,
        required: true,
        unique: true
    },
    friend_request: {
        type: Boolean,
        required: true
    },
    match_invite: {
        type: Boolean,
        required: true
    },
    friend_request_accepted: {
        type: Boolean,
        required: true
    },
    friend_messages: {
        type: [mongoose.Schema.Types.ObjectId],
        required: true
    },
    moderator_messages: {
        type: [mongoose.Schema.Types.ObjectId],
        required: true
    },
    match_alerts: {
        type: [mongoose.Schema.Types.ObjectId],
        required: true
    }
});

notificationSchema.methods.deleteNotifications = function(data:any) {
    if (data.friend_request !== undefined) {
        this.friend_request = data.friend_request
    }
    if (data.match_invite !== undefined) {
        this.match_invite = data.match_invite;
    }
    if (data.friend_request_accepted !== undefined) {
        this.friend_request_accepted = data.friend_request_accepted;
    }
    if (data.friend_messages) {
        for (let i = 0; i < data.friend_messages.length; i++) {
            let index = this.friend_messages.indexOf(data.friend_messages[i]);
            if (index > -1) {
                this.friend_messages.splice(index, 1);
            }
        }
    }
    if (data.moderator_messages) {
        for (let i = 0; i < data.moderator_messages.length; i++) {
            let index = this.moderator_messages.indexOf(data.moderator_messages[i]);
            if (index > -1) {
                this.moderator_messages.splice(index, 1);
            }
        }
    }
    if (data.match_alerts) {
        for (let i = 0; i < data.match_alerts.length; i++) {
            let index = this.match_alerts.indexOf(data.match_alerts[i]);
            if (index > -1) {
                this.match_alerts.splice(index, 1);
            }
        }
    }
}

export function getSchema() {return notificationSchema;}

let notificationModel;
export function getModel() : mongoose.Model<Notification> {
    if (!notificationModel) {
        notificationModel = mongoose.model('Notification', getSchema());
    }
    return notificationModel;
}

export function newNotification(data) : Notification {
    let _notificationModel = getModel();
    let notification = new _notificationModel(data);
    return notification;
}
