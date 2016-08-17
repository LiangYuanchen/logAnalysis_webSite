var keystone = require('keystone'),
	Types = keystone.Field.Types,
	advBase = keystone.list("Adventurer");
var uuid = require('node-uuid');
var _=require("underscore");
var async = require("async");
var utils = require("../manager/util/utils");
var _config = keystone.get("_config");
var winston = require('winston');

//var _config =keystone.get("_config");
/**
 * Innlog Model
 * ==========
 */

var Innlog = new keystone.List('InnLog', {
	map: { name: 'timeStamp' }
});

Innlog.add({
	logDate			:{type:Types.Date,default:Date.now,required:true},
	timeStamp		:{type:Number,default:0,required:true,index:true},
	gameid			:{type:String,default:0,required:true},
	uid 			:{type:String,required:true,default:0},
	userRegTime 	:{type:Number,required:true,default:Date.now},
	logType 		:{type:String,required:true,default:"unknown"},
	innExp 			:{type:Number,required:true,default:0},
	gembuy 			:{type:Number,required:true,default:0},
	gemother 		:{type:Number,required:true,default:0},
	gold 			:{type:Number,required:true,default:0},
	power 			:{type:Number,required:true,default:0},
	pvpCoin			:{type:Number,required:true,default:0},
	odysseyCoin		:{type:Number,required:true,default:0},
	sweepTicket		:{type:Number,required:true,default:0},
	queenCoin		:{type:Number,required:true,default:0},
	guildCoin		:{type:Number,required:true,default:0},
	gembuytotal     :{type:Number,required:true,default:0},//0301
	gemothertotal   :{type:Number,required:true,default:0},
	fame            :{type:Number,required:true,default:0},
	subType 		:{type:String,default:""},
	code			:{type:Number},
	R1 				:{type:String},
	R2 				:{type:String},
	R3 				:{type:String},
	R4				:{type:String},
	R5				:{type:String},
	R6				:{type:String},
	message 		:{type:String,required:true,default:0},
	logtime			:{type:Number,default:0},
	sessionCount 	:{type:Number,default:0},
	category 		:{type:String,default:0},
	innLevel 		:{type:Number},//statistical
	country			:{type:String},
	hasIPO			:{type:Boolean,default:false},
	hasStatsd       :{type:Boolean,default:false},
	hasMysql		:{type:Boolean,default:false},
	hasLogTime		:{type:Boolean,default:false}
});

Innlog.schema.virtual('content.full').get(function() {
	return this.content.extended || this.content.brief;
});
Innlog.schema.pre("save",function(next){
	next();
});
Innlog.schema.post('save', function() {

}); 
Innlog.defaultColumns = 'timeStamp, logType, gem';
Innlog.register();
/* 
* 用来遍历指定对象所有的属性名称和值 
* obj 需要遍历的对象 
* author: Jet Mah 
*/ 
function allPrpos ( obj ) { 
	// 用来保存所有的属性名称和值 
	var props = "" ; 
	// 开始遍历 
	for ( var p in obj ){ 
	// 方法 
	if ( typeof ( obj [ p ]) == " function " ){ 
	obj [ p ]() ; 
	 console.log(JSON.stringify(obj [ p ]));
	} else { 
	// p 为属性名称，obj[p]为对应属性的值 
	props += p + " = " + obj [ p ] + " \t " ; 
	} 
	} 
	// 最后显示所有的属性 
} 
// exports = module.exports = GlobalInnLogManager;
// var GlobalInnLogManager = function(){

// }

// GlobalInnLogManager.prototype.Analyze = function(){
// 	console.log("LogbalInnLogManager.Analyze");
// }