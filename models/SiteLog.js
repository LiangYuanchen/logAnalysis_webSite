var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Post Model
 * ==========
 */

var SiteLog = new keystone.List('SiteLog', {
	map: { name: 'logDate' },
	autokey: { path: 'slug', from: 'logDate', unique: true }
});

SiteLog.add({
	logDate:{type:Types.Date,default:Date.now,required:true,index:true},
	timeStamp:{type:Number,default:Date.now()/1000,required:true},
	postType: { type: String, index: true },
	message: { type: String},
	userName:{type:String}

});

SiteLog.defaultColumns = 'logDate, postType|20%, message|20%';
SiteLog.register();
