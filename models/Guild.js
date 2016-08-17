var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Enquiry Model
 * =============
 */

var Guild = new keystone.List('Guild', {
	nocreate: true,
	noedit: true
});

Guild.add({
	region 		         :{type:Number,default:0},
	instid               :{type:Number,default:0,index:true},
	totalpoint           :{type:Number,default:0},
	timeStamp            :{type:Number,default:0},
	point				 :{type:Number,default:0},
	name				 :{type:String,default:""},
	member_count		 :{type:Number,default:0},
	crt_dt				 :{type:Types.Date},
	quest_stage			 :{type:Number},
	current_quests       :{type:String},
	isregister			 :{type:Boolean},
	war_win_his			 :{type:Number,default:0},
	war_lose_his		 :{type:Number,default:0},
	war_draw_his		 :{type:Number,default:0},
	war_enemyguild		 :{type:Number},
	war_timeStamp		 :{type:Number},
	war_enemyguildregion :{type:Number},
	war_star			 :{type:Number},
	war_enemystar		 :{type:Number},
	war_member_count	 :{type:Number},
	war_wincount		 :{type:Number},
	war_losecount		 :{type:Number},
	war_drawcount		 :{type:Number},
	war_result			 :{type:Number}
});
// Guild.schema.add({
// 	guildIDs	:{type:[Number]},
// 	matchs      :{type:[String]},
// 	rewards     :{type:[String]}
// });

Guild.schema.pre('save', function(next) {
	next();
})

Guild.schema.post('save', function() {

});



Guild.defaultSort = '-timeStamp';
Guild.defaultColumns = 'name';
Guild.register();
