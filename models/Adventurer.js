var keystone = require('keystone'),
	Types = keystone.Field.Types;
var uuid = require('node-uuid');
var _config = keystone.get("_config");
var gameErrorManager = require("../manager/gameErrorManager");


var Adventurer = new keystone.List('Adventurer', {
	map: { name: 'timeStamp' }
});

Adventurer.add({
	instId:{type:Number,required:true,default:0,index:true},
	typeId:{type:Number,default:0,index:true},
	islegend:{type:Boolean,required:true,default:0},
	star:{type:Number,required:true,default:0},
	uid:{type:String,required:true,default:""},
	equipSet:{type:Number,required:true,default:0},
	timeStamp:{type:Number,default:Date.now()/1000},
	level:{type:Number,default:0},
	generation:{type:Number,default:0} //1:招募 2:兑换
});


Adventurer.defaultColumns = 'uid,instId,typeId,star,equipSet,level,islegend';
Adventurer.register();
