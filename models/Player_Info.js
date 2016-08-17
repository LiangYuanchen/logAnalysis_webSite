var keystone = require('keystone');

/**
 * LTV Model
 * ==========
 */

var Player_Info = new keystone.List('Player_Info',{
		    autokey: { path: 'slug', from: 'uid', unique: true },
		    map: { name: 'uid' },
		    defaultSort: '-regtime'
});
Player_Info.add({
	uid:{type:String,default:0,required:true},
	timestamp:{type:Number,default:0,required:true},
	registertime:{type:Number,default:0,required:true},
	region:{type:Number,default:0,required:true},
	country:{type:String},
	ip:{type:String},
	gold:{type:Number},
	gemother:{type:Number},
	innexp:{type:Number},
	lastlogtime:{type:Number},
	gembuy:{type:Number}
});

Player_Info.defaultColumns = 'uid';
Player_Info.register();
