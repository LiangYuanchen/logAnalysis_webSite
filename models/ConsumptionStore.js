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

var ConsumptionStore = new keystone.List('ConsumptionStore', {
	map: { name: 'timeStamp' }
});

ConsumptionStore.add({
	timeStamp:{type:Number,default:0,required:true},
	uid:{type:String,required:true,default:0},
	gem:{type:String,required:true,default:0},
	cost:{type:Number},
	shopType:{type:Number},
	typeID:{type:Number}
});

ConsumptionStore.schema.virtual('content.full').get(function() {
	return this.content.extended || this.content.brief;
});
ConsumptionStore.schema.pre("save",function(next){
	next();
});
ConsumptionStore.schema.post('save', function() {

}); 
ConsumptionStore.defaultColumns = 'timeStamp,uid,gem,cost,typeId';
ConsumptionStore.register();

// exports = module.exports = GlobalInnLogManager;
// var GlobalInnLogManager = function(){

// }

// GlobalInnLogManager.prototype.Analyze = function(){
// 	console.log("LogbalInnLogManager.Analyze");
// }