const mongoose = require('mongoose');
const sanitizeHtml = require('sanitize-html');
mongoose.Promise = global.Promise;

const ReviewSchema = new mongoose.Schema({
    text: {
        type: String,
        trim:true,
        required:''
    }, 
    author:{
        type:mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an author'
    },
    created:{
        type:Date,
        default: Date.now
    },
    store:{
        type:mongoose.Schema.ObjectId,
        ref: 'Store',
        required: 'You must supply a reviewed Store'
    },
    rating:{
        type: Number,
        min:1,
        max:5
    }
});
function autopopulate(next){
    this.populate('author');
    next();
}
ReviewSchema.pre('find',autopopulate);
ReviewSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Review', ReviewSchema);