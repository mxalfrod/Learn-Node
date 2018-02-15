const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require("md5");
const validator = require('validator');
const mongodbErrorHanlder = require("mongoose-mongodb-errors");
const passpostLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email:{
        type:String,
        unique:true,
        lowercase:true,
        trim:true,
        validate:[validator.isEmail,'Invalid Email Address'],
        required: 'Please Supply an email address'
    },
    name:{
        type:String,
        required:'Please Supply a name',
        trim: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    hearts: [
        { type: mongoose.Schema.ObjectId, ref:'Store'}
    ]
});

userSchema.virtual('gravatar').get(function(){
    const hash = md5(this.email);
    return `//gravatar.com/avatar/${hash}?s=200`;
});

userSchema.plugin(passpostLocalMongoose,{usernameField:'email'});
userSchema.plugin(mongodbErrorHanlder);
module.exports = mongoose.model('User', userSchema);