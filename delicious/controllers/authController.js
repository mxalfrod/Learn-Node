const passport = require('passport');
const crypto = require('crypto');
const mongoose = require("mongoose");
const User = mongoose.model("User");
const promisify = require("es6-promisify");
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local',{
    failureRedirect:'/login',
    failureFlash:'Failed Login!',
    successRedirect:'/',
    successFlash:'you are now logged in!'
});

exports.logout = (req,res)=>{
    req.logout();
    req.flash('success','you are now logged out ');
    res.redirect('/');
};

exports.isLoggedIn =(req,res,next) =>{
    //first check if the user is authenticated
    if(req.isAuthenticated()){
        next();// carry on! they are logged in!
        return;
    }
    req.flash('error', 'oops you must be logged in to do that ');
    res.redirect('/login');
};

exports.forgot = async (req,res) =>{
    // 1. See if a user with that email exists
    const user = await User.findOne({ email: req.body.email});
    // 2. Set the reset tokens and expiry on their account
    if(!user){
        req.flash('error','No account with that email exists');
        return res.redirect('/login');
    }
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000;// 1 hour from now
    await user.save();
    // 3. Send them an email with the token
    const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;

    await mail.send({
        user,
        subject: 'Password Reset',
        resetURL,
        filename: 'password-reset'
    });
    req.flash("success",`the email has been sent with the url`);
    // 4. redirect to the login page
    res.redirect('/login');
};

exports.reset = async (req, res) =>{
  const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: {$gt:Date.now()}
  });
  if(!user){
      req.flash("error", "Password reset is invalid or has expired");
      return res.redirect("/login");
  }
  //if there is a user, show the reset password form
    res.render('reset',{title: 'Reset your Password'});
};
exports.confirmedPasswords = (req, res,next) => {
  if(req.body.password === req.body['password-confirm']){
      next(); //keep it going
      return;
  }
  req.flash('error','Password do not match');
  res.redirect('back');
};
exports.update = async (req,res) =>{
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {$gt:Date.now()}
    });
    if(!user){
        req.flash("error", "Password reset is invalid or has expired");
        return res.redirect("/login");
    }
    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    const updatedUser = await user.save();
    await req.login(updatedUser);
    req.flash('success',"Nice, your password has been reset! you are now logged in");
    res.redirect('/');

};