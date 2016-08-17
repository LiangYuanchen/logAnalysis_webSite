var keystone = require('keystone'),
	Types = keystone.Field.Types;
var uuid = require('node-uuid');
var _config = keystone.get("_config");
var gameErrorManager = require("../manager/gameErrorManager");

var Summary = new keystone.List('Summary', {
	map: { name: 'timeStamp' }
});

Summary.add({
	Revenue: 			{type:Number,required:true,default:0,index:true},
	DAU: 				{type:Number,required:true,default:0,index:true},
	DNU: 				{type:Number,required:true,default:0,index:true},
	EDAU: 				{type:Number,required:true,default:0,index:true},
	ARPU: 				{type:Number,required:true,default:0,index:true},
	ARPPU: 				{type:Number,required:true,default:0,index:true},
	PaidMan: 			{type:Number,required:true,default:0,index:true},
	PaidPercentage: 	{type:Number,required:true,default:0,index:true},
	LTV7: 				{type:Number,required:true,default:0,index:true},
	LTV15: 				{type:Number,required:true,default:0,index:true},
	LTV30: 				{type:Number},
	logDate: 			{type:Number,required:true,default:0,index:true},
	firstDate: 			{type:Number,required:true,default:0,index:true},
	lastDate: 			{type:Number,required:true,default:0,index:true},
	registers: 			{type:String,required:false,default:""},
	revenues: 			{type:String,required:false,default:""},
	country:            {type:String},
	region:             {type:Number},
	LTV60:              {type:Number},
	LTV90:              {type:Number}
});
Summary.schema.add({
	priceCount:         {type:Number},
	paiduids:           {type:Object}

});

Summary.schema.post('save', function() {

}); 
Summary.schema.post('remove',function(){

});
Summary.defaultColumns = 'Revenue, DAU, DNU,EDAU,ARPU,ARPPU,PaidMan,PaidPercentage,LTV7,LTV15,firstDate,lastDate';
Summary.register();

