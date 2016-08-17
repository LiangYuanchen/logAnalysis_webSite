var keystone = require("keystone"),
	async = require('async'),
	_ = require('underscore'),
	middleware = require("../routes/middleware");
var util = require("util");
var utils = require("./util/utils");
var manager = require("./manager");
var _config = keystone.get("_config");
var winston = require("winston");

    Types = keystone.Field.Types;

var category = 0;
var tutorials = [];
var tttype = "";
var RetentionManager = function(){
	manager.call(this);
	var self = this;
}

var models = {};

util.inherits(RetentionManager,manager);
RetentionManager.prototype.selectRetention = function(registeDates,timezoneStr,sql,cb){
	var self = this;
	var i = 0;
	var results = [];
	async.whilst(
		function(){
			return i<registeDates.length;
		},
		function(callback){
			var registeDate = new Date(registeDates[i]*1000).format("yyyy_MM_dd");
			var modelName = self.getOrCreateModel(registeDate, timezoneStr);	

			
			keystone.list(modelName).model.find(sql).exec(function(err,datas){
				
				if(err){
					winston.error("#RetentionManager#selectRetention#select error");
					utils.showErr(err);
				}
				else
					results.push(datas);
				i++;
				callback();
			});			
		},
		function(){
			cb(null,results);
		}
	);

}
RetentionManager.prototype.addRetention = function(logObj, cb){
	var registeDate = new Date(parseInt(logObj.userRegTime) * 1000).format("dd_MM_yyyy");
	var loginDate = new Date(parseInt(logObj.timeStamp) * 1000).format("dd_MM_yyyy");

	var modelName = this.getOrCreateModel(registeDate, loginDate);
	keystone.list(modelName).model.findOne({uid: logObj.uid}).exec(function(err, log) {
		if (!log) {
			var param = {};
			param.uid = logObj.uid;
			//param.country = logObj.country;
			//param.timezone = 
			param.region = logObj.R2;
			param[loginDate] = true;

			var model = keystone.list(modelName).model;
			var data = new model(param);
			data.save(function(err){
				cb();
			})
		} else {
			log[loginDate] = true;
			log.save(function(err){
				cb();
			})
		}
	});
}

RetentionManager.prototype.getRetention = function(logObj, cb) {
	var registeDate = new Date(parseInt(logObj.userRegTime) * 1000).format("dd_MM_yyyy");
	var loginDate = new Date(parseInt(logObj.timeStamp) * 1000).format("dd_MM_yyyy");
	var modelName = this.getOrCreateModel(registeDate, loginDate);
	keystone.list(modelName).model.findOne({uid: logObj.uid}).exec(function(err, log) {
		cb(log);
	});
}

RetentionManager.prototype.getOrCreateModel = function(registeDate, timezoneStr) {

	var modelData = models[registeDate+timezoneStr];
	var modelName = "rentention_" + registeDate + "_" + timezoneStr;
	if (!modelData) {
		winston.info('create model:' + modelName);

		var model = new keystone.List(modelName
		// 	, {
		//     autokey: { path: 'slug', from: 'uid', unique: true },
		//     map: { name: 'uid' },
		//     defaultSort: '-createdAt'
		// }
		);
		
		model.add({
		    uid: { type: String },
		    country: { type: String },
		    region: { type: Number, default: 0},
		    day0: {type:Boolean},
		    day1: {type:Boolean},
		    day2: {type:Boolean},
		    day3: {type:Boolean},
		    day4: {type:Boolean},
		    day5: {type:Boolean},
		    day6: {type:Boolean},
		    day7: {type:Boolean},
		    day8: {type:Boolean},
		    day9: {type:Boolean},
		    day10: {type:Boolean},
		    day11: {type:Boolean},
		    day12: {type:Boolean},
		    day13: {type:Boolean},
		    day14: {type:Boolean},
		    day15: {type:Boolean},
		    day16: {type:Boolean},
		    day17: {type:Boolean},
		    day18: {type:Boolean},
		    day19: {type:Boolean},
		    day20: {type:Boolean},
		    day21: {type:Boolean},
		    day22: {type:Boolean},
		    day23: {type:Boolean},
		    day24: {type:Boolean},
		    day25: {type:Boolean},
		    day26: {type:Boolean},
		    day27: {type:Boolean},
		    day28: {type:Boolean},
		    day29: {type:Boolean},
		    day30: {type:Boolean}
		});
		 
		model.defaultColumns = 'uid';
		model.register();

		modelData = {model: model, dates: []};
		models[registeDate+timezoneStr] = modelData;
	}

	return modelName;
}

exports = module.exports = RetentionManager;