var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Gallery Model
 * =============
 */

var GameError = new keystone.List('GameError', {
	map: { name: 'logDate' }
});

GameError.add({
	logDate: { type: Number, required: true,default:0,index:true },
	firstDate:{type:Number,required:true,default:0,index:true},
	endDate:{type:Number,required:true,default:0,index:true},
	count: {type:Number,required:true,default:""},
	mgrErrCount:{type:Number,default:0},
	category:{type:String}
});



GameError.schema.post('save', function() {

});

GameError.schema.methods.initCategory = function(arryCategory,callback) {
	
}
GameError.defaultSort = '-logDate';
GameError.defaultColumns = 'logDate, count';
GameError.register();