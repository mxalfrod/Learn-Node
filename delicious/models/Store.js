const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim:true,
        required:''
    },
    slug: String,
    description:{
        type: String,
        trim:true
    },
    tags: [String],
    created:{
        type:Date,
        default: Date.now
    },
    location:{
        type:{
            type: String,
            default:'Point'
        },
        coordinates:[{
            type:Number,
            required:'you must supplay coordinates!'
        }],
        address:{
            type:String,
            required:'you must supply an address!'
        }
    },
    photo: String,
    author:{
        type:mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an author'
    }
});

//Define Indexes
storeSchema.index({
    name: 'text',
    description: 'text'
});

storeSchema.pre('save', async function (next){
    if(!this.isModified('name')){
        next();// skip it
        return;// stop this function from running
    }
    this.slug = slug(this.name);
    // find other stores that have a similar slog
    const slugRegex = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`,'i');
    const storesWithSlug = await this.constructor.find({ slug: slugRegex});
    if(storesWithSlug.length){
        this.slug = `${this.slug}-${storesWithSlug.length +1}`;
    }
    next();
    //TODO make more resiliant so slugs are unique
});
storeSchema.statics.getTagsList  = function(){
    return this.aggregate([
        {$unwind: '$tags'},
        {$group: {_id:'$tags', count:{$sum:1}}},
        {$sort:{count:-1}}
    ]);
}
module.exports = mongoose.model('Store', storeSchema);