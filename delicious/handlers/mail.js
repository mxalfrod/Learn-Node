const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth:{
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

const generateHMTL = (filename,options = {})=>{
    const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`,options);
    return html;
};

exports.send = async (options) =>{
    const html = generateHMTL(options.filename, options);
    const mailOptions = {
        from: `Alfonso Rodriguez <alfonso.rodriguez@mailinator.com>`,
        to: options.user.email,
        subject: options.subject,
        html,
        text: 'This will also be filled in later'
    };
    const sendMail = promisify(transport.sendMail, transport);
    return sendMail(mailOptions);

};