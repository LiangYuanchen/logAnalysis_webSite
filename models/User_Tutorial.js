var keystone = require('keystone');

/**
 * Tutorial Model
 * ==========
 */

var Tutorial = new keystone.List('user_tutorials',{
//		    autokey: { path: 'slug', from: 'uid', uinique: true },
//		    map: { name: 'uid' },
		    defaultSort: '-regtime'
});
Tutorial.add({
	uid:{type:String,default:0,required:true},
	timestamp:{type:Number,default:0,required:true,index:true},
	registertime:{type:Number,default:0,required:true},
	region:{type:Number,default:0,required:true},
	tutorialid:{type:String}
});

Tutorial.defaultColumns = 'uid, tutorialid';
Tutorial.register();
