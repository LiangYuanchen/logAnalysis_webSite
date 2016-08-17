var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Post Model
 * ==========
 */

var PayingInfo = new keystone.List('PayingInfo', {
	map: { name: 'Number' }
});

PayingInfo.add({
	timeStamp:{type:Number,default:0,required:true},
	orderId:{type:String,default:"",required:true},
	gamer:{type:Types.Relationship,ref:'GameUser'},
	innlog:{type:Types.Relationship,ref:'InnLog'},
	gem:{type:Number,default:0,required:true},
	money:{type:Number,default:0,required:true},
	uid:{type:String,default:"",required:true},
	region:{type:Number},
	country:{type:String}
});

PayingInfo.defaultColumns = 'orderId, gem|20%, money|20%, timeStamp|20%';
PayingInfo.register();
