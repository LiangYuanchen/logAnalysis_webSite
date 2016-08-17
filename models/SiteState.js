var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Enquiry Model
 * =============
 */

var SiteState = new keystone.List('SiteState', {
	nocreate: true,
	noedit: true
});

SiteState.add({
	createdAt: { type: Date, default: Date.now },
	lastSYNCAt:{type:Number},
	hrtimeData:{type:String}
});

SiteState.schema.pre('save', function(next) {
	next();
})

SiteState.schema.post('save', function() {

});


SiteState.defaultSort = '-createdAt';
SiteState.defaultColumns = 'lastSYNCAt, createdAt';
SiteState.register();
