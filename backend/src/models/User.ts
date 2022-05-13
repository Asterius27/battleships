import mongoose from "mongoose";
import crypto = require('crypto');
const { Schema } = mongoose;

export interface User extends mongoose.Document {
    readonly _id: mongoose.Schema.Types.ObjectId,
    name: string,
    surname: string,
    username: string,
    mail: string,
    role: string,
    friends_list: mongoose.Schema.Types.ObjectId[],
    friend_requests: mongoose.Schema.Types.ObjectId[],
    temporary: boolean,
    salt: string,
    digest: string,
    setPassword: (pwd:string)=>void,
    validatePassword: (pwd:string)=>boolean,
    hasModeratorRole: ()=>boolean,
    setModeratorRole: ()=>void
}

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    mail: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        required: true
    },
    friends_list: {
        type: [mongoose.Types.ObjectId],
        required: false
    },
    friend_requests: {
        type: [mongoose.Types.ObjectId],
        required: false
    },
    temporary: {
        type: Boolean,
        required: false
    },
    salt: {
        type: String,
        required: false
    },
    digest: {
        type: String,
        required: false
    }
});

userSchema.methods.setPassword = function(pwd:string) {
    this.salt = crypto.randomBytes(16).toString('hex');
    let hmac = crypto.createHmac('sha512', this.salt);
    hmac.update(pwd);
    this.digest = hmac.digest('hex');
}

userSchema.methods.validatePassword = function(pwd:string) : boolean {
    let hmac = crypto.createHmac('sha512', this.salt);
    hmac.update(pwd);
    let digest = hmac.digest('hex');
    return (this.digest === digest);
}

userSchema.methods.hasModeratorRole = function() : boolean {
    if (this.role === 'MODERATOR') {
        return true;
    }
    else {
        return false;
    }
}

userSchema.methods.setModeratorRole = function() {
    this.role = 'MODERATOR';
}

export function getSchema() {return userSchema;}

let userModel;
export function getModel() : mongoose.Model<User> {
    if (!userModel) {
        userModel = mongoose.model('User', getSchema());
    }
    return userModel;
}

export function newUser(data) : User {
    let _userModel = getModel();
    let user = new _userModel(data);
    return user;
}