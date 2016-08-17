 require("should");

require('dotenv').load();
 var keystone = require('keystone');
 keystone.init({
	'emails': '../templates/emails'
});
 keystone.set('email locals', {
	logo_src: '/images/logo-email.gif',
	logo_width: 194,
	logo_height: 76,
	theme: {
		email_bg: '#f9f9f9',
		link_color: '#2697de',
		buttons: {
			color: '#fff',
			background_color: '#2697de',
			border_color: '#1a7cb7'
		}
	}
});

// Setup replacement rules for emails, to automate the handling of differences
// between development a production.

// Be sure to update this rule to include your site's actual domain, and add
// other rules your email templates require.

keystone.set('email rules', [{
	find: '/images/',
	replace: (keystone.get('env') == 'production') ? 'http://www.your-server.com/images/' : 'http://localhost:3000/images/'
}, {
	find: '/keystone/',
	replace: (keystone.get('env') == 'production') ? 'http://www.your-server.com/keystone/' : 'http://localhost:3000/keystone/'
}]);

// Load your project's email test routes

keystone.set('email tests', require('../routes/emails'));

keystone.import('../models');



describe("SendMail", function() {
    it("sendMail,demo the callback", function(done) {
    	var sendMail = function(next){
			keystone.list('User').model.find().where('email', "liangyuanchen@163.com").exec(function(err, admins) {
				if (err)  {
					console.log("err");
					next(err);return;}
				new keystone.Email('innlogMatch').send({
					to: admins,
					from: {
						name: 'innSite',
						email: 'operations@innsite.com'
					},
					subject: '单元测试，收发邮件 ',
					data: {msg:"mongo count:"+000+",server file log count:"+000}
				}, next);
			});	   		
    	};
    	sendMail(function(err){
    		//console.log(JSON.stringify(arguments));
    		arguments[0].should.equal(null);
    		done();
    	}); 	
    });
});
	