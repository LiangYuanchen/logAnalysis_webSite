var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * InnLogCategory Model
 * ==================
 */

var InnLogCategory = new keystone.List('InnLogCategory', {
	autokey: { from: 'name', path: 'key', unique: true }
});

InnLogCategory.add({
	name: { type: String, required: true },
	describe:{type: String}
});

InnLogCategory.relationship({ ref: 'InnLog', path: 'categories' });

InnLogCategory.register();
