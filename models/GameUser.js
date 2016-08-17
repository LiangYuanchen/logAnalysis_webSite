var keystone = require('keystone'),
	Types = keystone.Field.Types;
var uuid = require('node-uuid');
var _config = keystone.get("_config");
var gameErrorManager = require("../manager/gameErrorManager");
//var _config =keystone.get("_config");
/**
 * GameUser Model
 * ==========
 */

var GameUser = new keystone.List('GameUser', {
	utokey: { path: 'slug', from: 'uid', unique: true },
	map: { name: 'uid' }
});

GameUser.add({
	timeStamp 		:{type:Number,default:0},
	uid 			:{type:String,required:true,default:0,index:true},
	username 		:{type:String,default:0},
	userRegTime 	:{type:Number,required:true,default:0},
	innExp 			:{type:Number,required:true,default:0},
	gembuy 			:{type:Number,required:true,default:0},
	gemother 		:{type:Number,required:true,default:0},
	gold 			:{type:Number,required:true,default:0},
	power 			:{type:Number,required:true,default:0},
	fame			:{type:Number,required:true,default:0},
	gameid			:{type:Number,required:true,default:0},
	pvpCoin			:{type:Number,required:true,default:0},
	odysseyCoin		:{type:Number,required:true,default:0},
	sweepTicket		:{type:Number,required:true,default:0},
	guildCoin		:{type:Number,required:true,default:0},	
	tavernlevel		:{type:Number,required:true,default:0},
	m_card			:{type:Number,required:true,default:0},
	pvp_score		:{type:Number,required:true,default:0},
	lastlogtime 	:{type:Number,default:0,index:true},
	registerdate 	:{type:Number,default:0,index:true},
	lastlogdate 	:{type:Date,default:Date.now()},
	firstpaydate	:{type:Number,required:true,default:0},
	queenCoin		:{type:Number},
	lastpaydate		:{type:Number},
	vip				:{type:Number,required:true,default:0},
	activetime  	:{type:Number,default:0},
	advCount 		:{type:Number,default:0},
	lastQuest 		:{type:String,default:"C1_L1_TITLE"},
	lastQuestTypeId :{type:Number,default:0},
	lastHardQuestTypeId:{type:Number,default:0},
	lastOdyQuestTypeId:{type:Number,default:0},
	tavernName  	:{type:String,default:""},
	country 		:{type:String},
	region			:{type:Number},
	loss			:{type:Number},//1表示流失,
	gembuytotal		:{type:Number,required:true,default:0},
	gemothertotal	:{type:Number,required:true,default:0},
	paidtime		:{type:Number,required:true,default:0},
	guildid			:{type:Number,required:true,default:0},
	timezone		:{type:Number},
	device_type		:{type:Number},
	device_id		:{type:String},
	lastlogin_ip	:{type:String},
	lastlogin_app_ver:{type:String},
	lastlogin_OS_ver:{type:String},
	pvp_rank		:{type:Number},
	pvpfp			:{type:Number},
	pvp_rank_type	:{type:Number},
	pvp_wincount	:{type:Number},
	pvp_totalcount	:{type:Number},
	user_pay_amt	:{type:Number},
	user_pay_times	:{type:Number},
	user_pay_all	:{type:Number},
	eng_gem_cost	:{type:Number},
	speed_gem_cost	:{type:Number},
	fill_gem_cost	:{type:Number},
	shop_gem_cost	:{type:Number}
});
GameUser.schema.add({
	bindAccout		:{type:[String] },
	tutorials 		:{type:[{
		tutorialId:{type:String},
		timeStamp:{type:Number}
	}]},
	advs			:{type:[{
		instId:{type:Number},
		typeId:{type:Number},
		islegend:{type:Boolean},
		level:{type:Number},
		equipSet:{type:Number},
		star:{type:Number},
		rating:{type:Number}
	}]}
});

GameUser.schema.post('save', function() {

}); 
// GameUser.schema.methods.init = function(innlog,callback) {

// 	this.uid=innlog.uid;
// 	this.username=innlog.username;
// 	this.userRegTime=innlog.userRegTime;
// 	this.innExp=innlog.innExp;
// 	this.gem=innlog.gem;
// 	this.gold=innlog.gold;
// 	this.power=innlog.power;
// 	this.lastlogtime=innlog.timeStamp;
// 	this.lastlogdate=new Date(this.lastlogtime*1000);
// 	this.activetime=0;
// 	this.save(function(err){
// 		if (err) {
// 			console.error(JSON.stringify(err));
// 			callback(err);
// 		};
// 		console.log("GameUser init success!");
// 		callback();
// 	});
// }
GameUser.defaultColumns = 'uid, username, innExp,gem,gold,power,lastlogdate';
GameUser.register();

// exports = module.exports = GlobalInnLogManager;
// var GlobalInnLogManager = function(){

// }

// GlobalInnLogManager.prototype.Analyze = function(){
// 	console.log("LogbalInnLogManager.Analyze");
// }