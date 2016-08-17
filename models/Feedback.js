var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Enquiry Model
 * =============
 */

var Feedback = new keystone.List('Feedback', {
	nocreate: true,
	noedit: true
});

Feedback.add({
	logs: { type:String },
	regionid: { type:Number },
	username: { type:String },
	uid: {type:String },
	tavername: {type:String },
	message: { type:String },
	timeStamp: { type:Number ,index:true},
	createdAt: { type: Date, default: Date.now },
	info: { type:String}
});

Feedback.schema.pre('save', function(next) {
	this.wasNew = this.isNew;
	next();
})

Feedback.schema.post('save', function() {

});



Feedback.defaultSort = '-createdAt';
Feedback.defaultColumns = 'username, tavername, tavernlv, message';
Feedback.register();
