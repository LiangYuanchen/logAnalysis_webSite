var keystone = require('keystone'),
	Types = keystone.Field.Types;
var uuid = require('node-uuid');
var _=require("underscore");
var _config = keystone.get("_config");
var gameErrorManager = require("../manager/gameErrorManager");
//var _config =keystone.get("_config");
/**
 * Consumption Model
 * ==========
 */

var ConsumptionAdvSummon = new keystone.List('ConsumptionAdvSummon', {
	map: { name: 'timeStamp' }
});

ConsumptionAdvSummon.add({
	timeStamp:{type:Number,default:0,required:true},
	uid:{type:String,required:true,default:0},
	gem:{type:String,required:true,default:0},
	cost:{type:Number},
	typeId:{type:Number},
	instId:{type:Number},
	advType:{type:Number},
});

ConsumptionAdvSummon.schema.virtual('content.full').get(function() {
	return this.content.extended || this.content.brief;
});
ConsumptionAdvSummon.schema.pre("save",function(next){
	next();
});
ConsumptionAdvSummon.schema.post('save', function() {

}); 
ConsumptionAdvSummon.defaultColumns = 'timeStamp,uid,gem,cost,instId,advType';
ConsumptionAdvSummon.register();

// exports = module.exports = GlobalInnLogManager;
// var GlobalInnLogManager = function(){

// }

// GlobalInnLogManager.prototype.Analyze = function(){
// 	console.log("LogbalInnLogManager.Analyze");
// }