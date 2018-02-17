const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const Review = mongoose.model('Review');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');
const sanitizeHtml = require('sanitize-html');

const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter: (req,file,next)=>{
        const isPhoto = file.mimetype.startsWith('image/');
         if(isPhoto){
             next(null,true);
         }else{
             next({message:"That filetype isn\'t allowed!"}, false);
         }
    }
}

exports.homePage = (req, res) => {
    res.render('index');
};
exports.addStore = (req,res) => {
    res.render('editStore', {title:'Add Store'});
};

exports.resize = async (req, res, next) =>{
    //check if there is no new file to resize
    if(!req.file){
        next(); //skip to the next middleware
        return;
    }
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;
    //now we resize
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    //once we have written the photo to our filesystem, keep going!
    next();
};
exports.upload = multer(multerOptions).single('photo');

exports.createStore= async (req,res) => {
    req.body.author = req.user._id;
    const store = await (new Store(req.body)).save();
    req.flash('success',`Successfully Created ${store.name}. Care to
    leave a review?`);
    res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req,res) =>{
    const page = req.params.page || 1;
    const limit = 4;
    const skip=(page*limit)-limit;
    const storesPromise = Store
        .find()
        .skip(skip)
        .limit(limit)
        .sort({created:'desc'});
    const countPromise = Store.count();

    const [stores, count] = await Promise.all([storesPromise, countPromise]);

    const pages = Math.ceil(count / limit);
    if(!stores.length && skip){
        req.flash('info',`Hey! you asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
        res.redirect(`/stores/page/${pages}`);
        return;
    }
    res.render('stores',{title:'Stores',stores,page,pages,count});
};
exports.heartStores = async (req,res)=>{

    console.log(req.user.hearts);
    const stores = await Store.find({'_id':{$in:req.user.hearts}});
    console.log(stores);
    res.render('stores',{title:'Hearted stores',stores});
}

const confirmOwner = (store, user) =>{
    if(!store.author.equals(user._id)){
        throw Error('You must own a store in order to edit it!');
    }
};
exports.editStore = async (req, res)=>{
  
    const store = await Store.findOne({_id: req.params.id});
    //res.json(store);
    confirmOwner(store, req.user);
    res.render('editStore',{title:`Edit ${store.name}`,store});
};

exports.displayStore = async(req,res,next)=>{
    const store = await Store.findOne({ slug: req.params.slug}).populate('author reviews');
    //const reviews = await Review.find({_id:store.id}).populate('author');
    //console.log(reviews);
    if(!store){
        next();
        return;
    }
    res.render('store',{title:`${store.name}`,store});
};

exports.updateStore = async (req,res)=> {
      //set the location data to be a point
      req.body.location.type =  'Point';
    //const store = await (new Store(req.body)).save();
    req.body.name =sanitizeHtml(req.body.name);
const store = await Store.findByIdAndUpdate({_id:req.params.id}, req.body,{
    new:true, // return the new store instead of the old one
    runValidators:true
}).exec();
req.flash('success',`Successfully updated <strong>${store.name}</strong>.
<a href="/stores/${store.slug}">View Store </a>`);
res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoresByTag = async (req,res)=>{
    const tag = req.params.tag;
    const tagQuery = tag||{$exists:true};
    const tagsPromise = Store.getTagsList();
    const storePromise = Store.find({tags:tagQuery});
    const [tags,stores] = await Promise.all([tagsPromise,storePromise]);
    //res.json(tags);
    res.render('tag',{tags,title:'Tags',tag,stores});
};
exports.searchStores = async (req,res)=>{
    const stores = await Store
    .find({
        $text:{
            $search:req.query.q
        }
    },{
        score:{$meta: 'textScore'}
    })
    .sort({
        score:{$meta:'textScore'}
    })
    //limit
    .limit(5);
    res.json(stores);
};
exports.mapStores = async (req,res)=> {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
     const q = {
         location:{
             $near:{
                 $geometry:{
                     type: 'Point',
                     coordinates
                 },
                 $maxDistance: 10000 //10 km
             }
         }
     };
     const stores = await Store.find(q).select('slug name description location photo').limit(10);
    res.json(stores);

    //res.json(coordinates);
};
exports.mapPage = (req,res) => {
    res.render('map',{title:'Map'});
};
exports.heartStore = async (req,res)=>{
    const hearts = req.user.hearts.map(obj => obj.toString());
    const operator = hearts.includes(req.params.id)?'$pull':'$addToSet';
    const user = await User.findByIdAndUpdate(req.user._id,{[operator]:{hearts:req.params.id}},{new:true});
    res.json(user);
};
exports.getTopStores = async(req,res) =>{
    const stores = await Store.getTopStores();
    //res.json(stores);
    res.render('topStores', {stores,title:'Top Stores!'});
}