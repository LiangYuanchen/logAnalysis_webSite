var keystone = require('keystone');
var async    = require('async');
var _        = require("underscore");
var manager  = require("../../manager/manager");
var _config  = keystone.get("_config");
exports = module.exports = function(req, res) {
       var view = new keystone.View(req, res),
               locals = res.locals;
      locals.title=_config.title;
       locals.title=_config.title;


       // locals.section is used to set the currently selected
       // item in the header navigation.
       locals.section = 'monitoring';
       locals.country="";
       locals.online = [];
       locals.xAxis = [];
       locals.sessionCount = [];
       locals.registerCount = [];
       locals.onlineUidCount = [];
       locals.payingPlayer = [];
       locals.totalUser = [];
       locals.timezone = _config.timezone||0;
       locals.ttitle = "压力监控";
       locals.subtitle = "当日";
       locals.yAxisTitle = "数量（个）";
       locals.formatData = req.body || {};
       var permission = require("../../manager/permission");
           // Set locals
      locals.enquirySubmitted = false;
       locals.filters = {
          country:req.query.country || ""
       };
       var per = new permission();
       locals.hasPermission = false;
       if(req.user&&req.user.code)
          locals.hasPermission = per.HasPermisson("summary",req.user.code);

       locals.mongodb=[];
       locals.nodejs=[];
       var ma = new manager();
       var types = {
               "mongodb":"998",//online
               "nodejs":"999"
       };
       var timeX = [];//输出的数量不对，及表示数据出现问题
       var databind = function(i,q,cb){
               var keys = _.keys(types);
               //console.log("i:"+i+";keysLen:"+keys.length);
               // if (keys[i]!="online") {
               //         //console.log("timeX:"+JSON.stringify(timeX));
               //         q = q.where('logDate').in(timeX);
               //         q = q.where('logDate').in(timeX);
               //         //q = keystone.list('Statistical').model.find().where('logDate').in(timeX);
               // }
               q = q.sort({'logDate':1}).select("logDate count");
               //console.log(q);
               var init = function(parm,next){
                      var data = [];
                      data.push(parm.logDate*1000);
                      data.push(parseInt(parm.count));
                       eval("locals."+keys[i]+".push(data)");
                       // if(keys[i]=="online"){
                       //         var date = ((new Date(parm.logDate*1000)).format("MM/dd hh:mm"));
                       //         locals.xAxis.push(date);
                       //         timeX.push(parm.logDate);
                       //         //console.log("timeX"+JSON.stringify(timeX));
                       // }
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
                        eval("if(!locals."+keys[i]+") locals."+keys[i]+"=[] ");
                       //      j++;
                       //      if(j.length == results.length)
                               cb(err);
                       });     
                       //console.log("sessionCount:"+JSON.stringify(locals.sessionCount));

               });
       }
       var digui = function(i,next){
               
               var stype = _.values(types);

               var q = keystone.list('Statistical').model.find().where('sType',stype[i]);


              // var num = parseInt(parm["num"]);

              var date = Date.now()-2*86400000;
              q = q.where("logDate").gte(date/1000);
              // console.log(JSON.stringify(locals.formatData));
               // if(num)
               //         q = q.limit(num);
               // else 
               //         q = q.limit(10);
                       
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
 
       view.on('post',{actions:"getresult"},function(){
          var parm = locals.formatData;
          getResultByTypeName(parm["name"]);
       })
  


       var getResultByTypeName = function(name,next){
          var type = types[name];
          var parm = locals.formatData;
          var op =parm["op"] ;    
          var getCount = function(err,results){
            if (err) {
              console.error(err);
              return;
            };
           // console.log("results.length:%s",results.length);
            var datas =[];
            if (results) {
              for (var i = results.length - 1; i >= 0; i--) {
                  var x = results[i].logDate*1000;
                  var y = results[i].count;
                  datas.push([x,y]);
                };
            }
            res.send(datas);
          }
          var q = keystone.list("Statistical").model.find().where('sType',type).where("logDate").gte(op/1000).select("count logDate").sort({logDate:-1}).exec(getCount);

       }
      if(locals.hasPermission)
        view.render('monitoring');
      else
        view.render('summary');
       
};

