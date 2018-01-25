const passport = require('passport');

exports.login = passport.authenticate('local',{
    failureRedirect:'/login',
    failureFlash:'Failed Login!',
    successRedirect:'/',
    successFlash:'you are now logged in!'
});