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

var ConsumptionEnergy= new keystone.List('ConsumptionEnergy', {
	map: { name: 'timeStamp' }
});

ConsumptionEnergy.add({
	timeStamp:{type:Number,default:0,required:true},
	uid:{type:String,required:true,default:0},
	gem:{type:String,required:true,default:0},
	cost:{type:Number},
	addedEnergy:{type:Number},
	boughtNum:{type:Number}
});

ConsumptionEnergy.schema.virtual('content.full').get(function() {
	return this.content.extended || this.content.brief;
});
ConsumptionEnergy.schema.pre("save",function(next){
	next();
});
ConsumptionEnergy.schema.post('save', function() {

}); 
ConsumptionEnergy.defaultColumns = 'timeStamp,uid,gem,cost,typeId';
ConsumptionEnergy.register();

// exports = module.exports = GlobalInnLogManager;
// var GlobalInnLogManager = function(){

// }

// GlobalInnLogManager.prototype.Analyze = function(){
// 	console.log("LogbalInnLogManager.Analyze");
// }