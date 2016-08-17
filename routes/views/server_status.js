var keystone = require('keystone');
var async    = require('async');
var _        = require("underscore");
var _config  = keystone.get("_config");

exports = module.exports = function(req, res) {
	var view = new keystone.View(req, res),
		locals = res.locals;
	locals.title=_config.title;
	// locals.section is used to set the currently selected
	// item in the header navigation.
	locals.section = 'server_status';
	locals.datas = [];
	locals.datasStr = "";
	locals.formatData = req.body || {};
	locals.validationErrors = {};
	locals.enquirySubmitted = false;
	locals.timezone = _config.timezone||0;
	var permission = require("../../manager/permission");
   // Set locals
   var per = new permission();
   locals.hasPermission = false;
   if(req.user&&req.user.code)
      locals.hasPermission = per.HasPermisson("summary",req.user.code);
	//var timeX = [];//输出的数量不对，及表示数据出现问题
	// online
	var  getGlobalInnLog = function(num,next){
		var gameids = keystone.get("gameids"); 
		var gameid = gameids[num];
		var q = keystone.list('InnLog_Global').model.find({'gameid':gameid}).sort({'logDate':-1}).limit(10);	
			var data={upspeed:[],downspeed:[],disk_idle:[],cpu_idle:[],mem_idle:[],xAxis:[]};
			locals.datas.push(data);
			data.gameid = gameid;
			var init = function(parm){
				//locals.datas.push(parm);
				data.upspeed.push(parseInt(parm.upspeed));
				data.downspeed.push(parseInt(parm.downspeed));
				data.disk_idle.push(parseInt(parm.disk_idle));
				data.cpu_idle.push(parseInt(parm.cpu_idle));
				data.mem_idle.push(parseInt(parm.mem_idle));
				var date = ((new Date(parm.logDate*1000)).format("MM/dd hh:mm"));
				data.xAxis.push(date);
			}
			q.exec(function(err, results) {
				//console.log(results);
				_.each(results,function(parm){
					init(parm);
				});
				if(num == gameids.length-1)
					next();
				else
					getGlobalInnLog(++num,next);
			});	
	}
	view.on('get', function(next) { 
		var gameids = keystone.get("gameids"); 
		if (!gameids){ 
			console.error("gameids is null"); 
			return; 
		}
		getGlobalInnLog(0,next);
	});	

	// On POST requests, add the Enquiry item to the database
	view.on('post', { action: 'server_status' }, function(next) {
		var gameids = keystone.get("gameids");
		var parm = locals.formatData;
		var op =Date.parse(parm["op"]);
		var ed =Date.parse(parm["ed"]);
		var num = parm["num"];
		if (!gameids){
			console.error("gameids is null");
			return;
		}
		for (var i = gameids.length - 1; i >= 0; i--) {
			var q = keystone.list('InnLog_Global').model.find({'gameid':gameids[i]}).sort({'logDate':-1});					
						//q = q.where("logDate").gt(1412859960);				
			if(op)
				q = q.where("logDate").gt(op/1000);
			if(ed)
				q = q.where("logDate").lt(ed/1000);
			if(num)
				q = q.limit(num);
			else 
				q = q.limit(10);
			console.log(q);
			getGlobalInnLog(q,gameids[i],next);
		};	
		//next();	
	});
	//这里需要加一个验证数据是否正确的函数
	// Render the view
	view.render('server_status');
	
};
