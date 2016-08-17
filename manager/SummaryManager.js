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

var SummaryManager = function(){
	manager.call(this);
	var self = this;
}
var summaryManager = null;
var models = {};
var summarylogs = "SummaryLogs";
util.inherits(SummaryManager,manager);
SummaryManager.prototype.selectSummary = function(summaryDates,sql,cb){
	var self = this;
	var i = 0;
	var results = [];
	async.whilst(
		function(){
			return i<summaryDates.length;
		},
		function(callback){
			var summaryDate = new Date(summaryDates[i]*1000).format("yyyy_MM_dd");
			var modelName = self.getOrCreateModel(summaryDate);
			keystone.list(modelName).model.find(sql).exec(function(err,datas){
				if(err){
					winston.error("#SummaryManager#selectSummaryManager#select error");
					utils.showErr(err);
					debugger;
				}
				else
				{
					results.push(datas);
				}
				i++;
				callback();
			});			
		},
		function(){
			cb(null,results);
		}
	);
}
SummaryManager.prototype.getOrCreateModel = function(summaryDate){

	var modelData = models[summaryDate];
	var modelName = "SummaryLogs" + summaryDate;
	if (!modelData) {
		winston.info('create summary model:' + modelName);

		var model = new keystone.List(modelName
		// 	, {
		//     autokey: { path: 'slug', from: 'uid', unique: true },
		//     map: { name: 'uid' },
		//     defaultSort: '-regtime'
		// }
		);
		 
		model.add({
			uid: { type: String },
			regtime: { type: Number,default:0},
			paycount: { type: Number,default:0 },
			isnew: { type: Boolean },
			region: { type: Number},
			paymoney:{ type:Number},
			ltv7:{ type:Number},
			ltv15:{ type:Number},
			ltv30:{ type:Number},
			ltv60:{ type:Number},
			ltv90:{ type:Number}
		});

		model.defaultColumns = 'uid, regtime';
		model.register();

		modelData = {model: model};
		models[summaryDate] = modelData;
	}
	return modelName;
}

exports = module.exports = SummaryManager;