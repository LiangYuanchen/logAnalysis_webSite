var keystone = require('keystone'),
	Types = keystone.Field.Types;
var _ = require("underscore");
var async = require("async");
var manager = require("../manager/manager");
var m = new manager();
var winston = require("winston");
/**
 * Gallery Model
 * =============
 */

var DaysLeft = new keystone.List('DaysLeft', {
	map: { name: 'logDate' }
});

DaysLeft.add({
	logDate: { type: Number, required: true,default:0 ,index:true},
	firstDate:{type:Number},
	lastDate:{type:Number},
	daysLeft: {type:String,required:true,default:""},
	newuserCount:{type:Number,required:true,default:0},
	category:{type:Number,required:true,default:0},//0表示daysleft，其他的表示tutorial
	sort:{type:Number,required:true,default:0},
	timeStamp:{type:Number},
	tType:{type:Types.Select,default:1,options:[
	{value:0,label:"实时统计"},//默认为实时统计
	{value:1,labal:"日阶段统计"},
	{value:2,label:"周阶段统计"},
	{value:3,label:"月阶段统计"}
	],index:true},
	country:{type:String},
	registerType:{type:Types.Select,default:"0",options:[
	{value:"0",label:"全部"},
	{value:"1",label:"成功登录"}
	]},
	onlypaid:{type:Boolean},
	sessions:{type:String},
	firstpaids:{type:String},
	summary:{type:Types.Relationship,ref:'Summary'},
	region:{type:Number},
	timezone:{type:Number}
});


DaysLeft.schema.add({
	uids:{type:[String]},
	retentions:{type:[Number]},
	sessionCount:{type:[Number]}
});



DaysLeft.defaultSort = '-logDate';
DaysLeft.defaultColumns = 'logDate, newuserCount';
DaysLeft.register();