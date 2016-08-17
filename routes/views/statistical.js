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
       locals.section = 'statistical';
       locals.online = [];
       locals.xAxis = [];
       locals.sessionCount = [];
       locals.registerCount = [];
       locals.onlineUidCount = [];
       locals.GemConsumed = [];
       locals.timezone = _config.timezone||0;
       locals.totalUser = [];
       locals.ttitle = "实时统计";
       locals.subtitle = "当日";
       locals.yAxisTitle = "数量（个）";
       locals.formatData = req.body || {};
       var permission = require("../../manager/permission");
       // Set locals
       var per = new permission();
       locals.hasPermission = false;
       if(req.user&&req.user.code)
          locals.hasPermission = per.HasPermisson("summary",req.user.code);
       var types = {
               "online":"1",//online
               "registerCount":"5",//newuser
               "totalUser":"3",//loguser
               "onlineUidCount": "6",//activeuser
               "sessionCount": "4",//session
               "GemConsumed": "7"
       };
       var timeX = [];//输出的数量不对，及表示数据出现问题
       var databind = function(i,q,cb){
               var keys = _.keys(types);
               //console.log("i:"+i+";keysLen:"+keys.length);
               if (keys[i]!="online") {
                       //console.log("timeX:"+JSON.stringify(timeX));
                       q = q.where('logDate').in(timeX);
                       q = q.where('logDate').in(timeX);
                       //q = keystone.list('Statistical').model.find().where('logDate').in(timeX);
               }
               q = q.sort({'logDate':-1});
               //console.log(q);
               var init = function(parm,next){
                       eval("locals."+keys[i]+".push(parm.count)");
                       if(keys[i]=="online"){
                               var date = ((new Date(parm.logDate*1000)).format("MM/dd hh:mm"));
                               locals.xAxis.push(date);
                               timeX.push(parm.logDate);
                               //console.log("timeX"+JSON.stringify(timeX));
                       }
                       next();
               }
               q.exec(function(err, results) {
                       //console.log(results);
                       if (!results) {
                               results = [];
                       };
                       //console.log("databind:"+keys[i]+":"+JSON.stringify(results));
               //      var j = 0;
                       async.forEach(results,init,function(){
                       //      j++;
                       //      if(j.length == results.length)
                               cb(err);
                       });     
                       //console.log("sessionCount:"+JSON.stringify(locals.sessionCount));

               });
       }
       view.on('post',{action:'statistical'},function(next){
               console.log("begin post on statistical");
               digui(0,next);
       });
       var digui = function(i,next){
               
               var stype = _.values(types);

               var q = keystone.list('Statistical').model.find().where('sType',stype[i]);

               var parm = locals.formatData;
               var op =Date.parse(parm["op"]);
               var ed =Date.parse(parm["ed"]);
               var num = parseInt(parm["num"]);
               //console.log("op:"+op+",ed:"+ed+",num:"+num);
               if(op)
                       q = q.where("logDate").gte(op/1000);
               if(ed)
                       q = q.where("logDate").lt(ed/1000);
               if(num)
                       q = q.limit(num);
               else 
                       q = q.limit(10);
                       
                       //console.log(q);
               if(i==stype.length)
                       databind(i,q,next);
               else
                       databind(i,q,function(err){
                               digui(++i,next);
                       });     
       }
       // online
       view.on('get', function(next) {
               digui(0,next);
       });     

       view.render('statistical');
       
};

