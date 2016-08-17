var keystone = require('keystone');

/**
 * LTV Model
 * ==========
 */

var LTV = new keystone.List('LTV');

LTV.add({
	payTime:{type:Number,default:0,required:true},
	regTime:{type:Number,default:0,required:true},
	gem:{type:Number,default:0,required:true},
	money:{type:Number,default:0,required:true},
	country:{type:String},
	region:{type:Number}
});

LTV.defaultColumns = 'payTime, regTime, money, country, region';
LTV.register();
