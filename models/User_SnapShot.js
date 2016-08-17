var keystone = require('keystone'),
	Types = keystone.Field.Types;
var uuid = require('node-uuid');
var _config = keystone.get("_config");
var gameErrorManager = require("../manager/gameErrorManager");


var User_SnapShot = new keystone.List('User_SnapShot', {
	map: { name: 'Crt_DT' }
});

User_SnapShot.add({
	User_ID:{type:Number,required:true,default:0,index:true},
	User_DvcID:{type:String,required:true,default:""},
	User_Server:{type:Number,required:true,default:0},
	Crt_DT:{type:Date,required:true,default:0},
	User_name:{type:String,required:true,default:""},
	User_Level:{type:Number,required:true,default:0},
	User_Gld:{type:Number,required:true,default:0},
	User_Gem_Buy:{type:Number,required:true,default:0},
	User_Gem_Other:{type:Number,required:true,default:0},
	User_Vip:{type:Number,required:true,default:0},
	User_EXP:{type:Number,required:true,default:0},
	User_Energy:{type:Number,required:true,default:0},
	User_Coin:{type:Number,required:true,default:0},
	User_Odsy_Coin:{type:Number,required:true,default:0},
	User_Gld_Coin:{type:Number,required:true,default:0},
	User_Swp_Tkt:{type:Number,required:true,default:0},
	User_Fame:{type:Number,required:true,default:0},
	User_M_Card:{type:Number,required:true,default:0},
	User_Adv_normal:{type:Number,required:true,default:0},
	User_Adv_Hard:{type:Number,required:true,default:0},
	User_Odsy_Progress:{type:Number,required:true,default:0},
	User_Arena_Process:{type:Number,required:true,default:0},
	User_Arena_Rank:{type:Number,required:true,default:0},
	User_Eqp_Rating_Avg:{type:Number,required:true,default:0},
	User_Star_Rating_Avg:{type:Number,required:true,default:0},
	User_Lv_Rating_Avg:{type:Number,required:true,default:0},
	User_Power_Sum:{type:Number,required:true,default:0}
});
User_SnapShot.schema.methods.Save = function(log,callback) {
	var self = this;
}

User_SnapShot.defaultColumns = 'User_ID,User_DvcID';
User_SnapShot.register();
