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

var ConsumptionQuickFinish = new keystone.List('ConsumptionQuickFinish', {
	map: { name: 'timeStamp' }
});

ConsumptionQuickFinish.add({
	timeStamp:{type:Number,default:0,required:true},
	uid:{type:String,required:true,default:0},
	gem:{type:String,required:true,default:0},
	cost:{type:Number},
	roomId:{type:Number},
	typeId:{type:Number}
});

ConsumptionQuickFinish.schema.virtual('content.full').get(function() {
	return this.content.extended || this.content.brief;
});
ConsumptionQuickFinish.schema.pre("save",function(next){
	next();
});
ConsumptionQuickFinish.schema.post('save', function() {

}); 
ConsumptionQuickFinish.defaultColumns = 'timeStamp,uid,gem,cost,typeId';
ConsumptionQuickFinish.register();

// exports = module.exports = GlobalInnLogManager;
// var GlobalInnLogManager = function(){

// }

// GlobalInnLogManager.prototype.Analyze = function(){
// 	console.log("LogbalInnLogManager.Analyze");
// }