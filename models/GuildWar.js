var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Enquiry Model
 * =============
 */

var GuildWar = new keystone.List('GuildWar', {
	nocreate: true,
	noedit: true
});

GuildWar.add({
	timeStamp 		:{type:Number,default:0},
	firstDate       :{type:Number,default:0},
	lastDate        :{type:Number,default:0},
	guid            :{type:String,default:""}
});
GuildWar.schema.add({
	guildIDs	:{type:[Number]},
	matchs      :{type:[String]},
	rewards     :{type:[String]}
});

GuildWar.schema.pre('save', function(next) {
	next();
})

GuildWar.schema.post('save', function() {

});



GuildWar.defaultSort = '-createdAt';
GuildWar.defaultColumns = 'username, tavername, tavernlv, message';
GuildWar.register();
