var keystone = require("keystone"),
	async = require('async'),
	_ = require('underscore'),
    util = require("util");
    utils = require("./util/utils");
var User = keystone.list("User");
var nodemailer = require('nodemailer');
var user = module.exports ;
var winston = require("winston");
var _config = keystone.get("_config");
// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport('smtps://yuanchen.liang%40nebuliumgames.com:x7JfMpWDxLhkdB4R@smtp.exmail.qq.com');

// setup e-mail data with unicode symbols
var mailOptions = {
    from: '"lyuanchen 👥" yuanchen.liang@nebuliumgames.com', // sender address
    to: 'liangyuanchen@163.com, yuanchen.liang@nebuliumgames.com', // list of receivers
    subject: 'Hello ✔', // Subject line
    text: 'Hello world 🐴', // plaintext body
    html: '<b>Hello world 🐴</b>' // html body
};
var mailTemplate_Authentication = "";

// // send mail with defined transport object
// transporter.sendMail(mailOptions, function(error, info){
//     if(error){
//         return console.log(error);
//     }
//     console.log('Message sent: ' + info.response);
// });
function createAdmin(admin, done) {
	var theModel = User.model;
	var newAdmin = new theModel(admin);
	
	newAdmin.isAdmin = true;
	newAdmin.save(function(err) {
		if (err) {
			console.error("Error adding admin " + admin.email + " to the database:");
			console.error(err);
		} else {
			console.log("Added admin " + admin.email + " to the database.");
		}
		done(err);
	});
}
user.sendMailForAuthentication = function(email,code,next){
	async.waterfall([
		function(cb){
			require("crypto").randomBytes(48,function(ex,buf){
				token = buf.toString('base64').replace(/\//g,'_').replace(/\+/g,'-');
				cb(null,token);
			});
		},
		function(token,cb){
			keystone.list("User").model.findOne({email:email}).exec(function(err,result){
				if(!result)
				{
					//new
					var newone =	{ email:email, password: 'xingyunsu', name: { first: 'unknown', last: 'unknown' } ,isAdmin:false,code:code};
					newone.validUtil = (new Date())/1000 + 86400*2;
					newone.token = token;
					createAdmin(newone,cb);
				}
				else
				{
					result.validUtil = (new Date())/1000 + 86400*2;
					result.token = token;
					result.code = code;
					
					result.save(function(){
						
						cb(null,token);
					})
				}
			});
		},
		function(token,cb){
			mailOptions.to = email;
			mailOptions.text=mailOptions.html = _config.innSite.host+"/validate?token="+token;
			transporter.sendMail(mailOptions, function(error, info){
			    if(error){
			        return console.log(error);
			    }
			    console.log('Message sent: ' + info.response);
			    cb();
			});
		}
		],function(){
			next();
	});
}