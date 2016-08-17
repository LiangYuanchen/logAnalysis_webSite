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
       locals.section = 'home';
       locals.country="";
       locals.online = [];
       locals.xAxis = [];
       locals.sessionCount = [];
       locals.registerCount = [];
       locals.onlineUidCount = [];
       locals.payingPlayer = [];
       locals.totalUser = [];
       locals.ttitle = "实时统计";
       locals.timezone = _config.timezone||0;
       locals.subtitle = "当日";
       locals.yAxisTitle = "数量（个）";
       locals.formatData = req.body || {};
       var region=0;
       var permission = require("../../manager/permission");
           // Set locals
      locals.enquirySubmitted = false;
       locals.filters = {
          country:req.query.country || "",
          region: req.query.region || 0
       };
       var per = new permission();
       locals.hasPermission = false;
       if(req.user&&req.user.code)
          locals.hasPermission = per.HasPermisson("summary",req.user.code);
       locals.msgErr=[];
       locals.handlerErr=[];
       var ma = new manager();
       var types = {
               "online":"1",//online
               "registerCount":"5",//newuser
               "totalUser":"3",//loguser
               "onlineUidCount": "6",//activeuser
               "sessionCount": "4",//session
               "payingPlayer": "11"
       };
       var timeX = [];//输出的数量不对，及表示数据出现问题
       var databind = function(i,q,cb){
        cb();
               // var keys = _.keys(types);
               // //console.log("i:"+i+";keysLen:"+keys.length);
               // // if (keys[i]!="online") {
               // //         //console.log("timeX:"+JSON.stringify(timeX));
               // //         q = q.where('logDate').in(timeX);
               // //         q = q.where('logDate').in(timeX);
               // //         //q = keystone.list('Statistical').model.find().where('logDate').in(timeX);
               // // }
               // q = q.sort({'logDate':1}).select("logDate count");
               // //console.log(q);
               // var init = function(parm,next){
               //        var data = [];
               //        data.push(parm.logDate*1000);
               //        data.push(parseInt(parm.count));
               //        debugger;
               //         eval("locals."+keys[i]+".push(data)");
               //         // if(keys[i]=="online"){
               //         //         var date = ((new Date(parm.logDate*1000)).format("MM/dd hh:mm"));
               //         //         locals.xAxis.push(date);
               //         //         timeX.push(parm.logDate);
               //         //         //console.log("timeX"+JSON.stringify(timeX));
               //         // }
               //         next();
               // }
               // q.exec(function(err, results) {
               //         //console.log(results);
               //         if (!results) {
               //                 results = [];
               //         };
               //         //console.log("databind:"+keys[i]+":"+JSON.stringify(results));
               // //      var j = 0;
               //         async.forEach(results,init,function(){
               //          eval("if(!locals."+keys[i]+") locals."+keys[i]+"=[] ");
               //         //      j++;
               //         //      if(j.length == results.length)
               //                 cb(err);
               //         });     
               //         //console.log("sessionCount:"+JSON.stringify(locals.sessionCount));

               // });
       }
       view.on('post',{action:'statistical'},function(next){
              // console.log("begin post on statistical");
              var parm = locals.formatData;
              region = parm.region;
               digui(0,next);
       });
       var digui = function(i,next){
               
               var stype = _.values(types);

               var q = keystone.list('Statistical').model.find().where('sType',stype[i]);
             if(region&&parseInt(region)>0)
              q = q.where("region",parseInt(region)); 
             else
              q= q.where("region",{$exists:false})
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
        region = req.query.region;
               digui(0,next);
       });     
       view.on("post",{actions:"geterror"},function(){
          var parm = locals.formatData;
          region = parm.region;
          var op = parm["op"];
         // console.log("formatData:%s",JSON.stringify(parm));
          if (!op||isNaN(op)) {
            op = Date.now()/1000 - 86400*2;
          }else{
            op = parseInt(parm["op"])/1000;
          }
         // console.log("op:%s"+op);
          async.waterfall([
            function(cb){
                var getMsgErr = function(err,results){
                 // console.log("bbb");
                  if (err) {
                    console.error("getMsg Error,"+JSON.stringify(err));
                  }else{
                    // locals.msgErr.rows=result;
                    // locals.msgErr.total =result.length;
                    for(var i=0;i<results.length;i++){
                      var data = [];
                      var result = results[i];
                      data.push(parseInt(result.logDate)*1000);
                      data.push(parseInt(result.count));
                      locals.msgErr.push(data);                     
                    }

                  }
                  //console.log(JSON.stringify(locals.msgErr));
                  cb();
                }
                var q = keystone.list("Statistical").model.find().where("sType",_config.logTypeID.msgErr);
             if(region&&parseInt(region)>0)
              q = q.where("region",parseInt(region)); 
             else
              q= q.where("region",{$exists:false})
                 q = q.sort({logDate:1}).where("logDate").gte(op).select("logDate count").exec(getMsgErr);        
            },
            function(cb){
                var getHandlerErr = function(err,results){
               // console.log("ccc");
                if (err) {
                  console.error("getHandlerErr,"+JSON.stringify(err));
                }else{
                  // locals.handlerErr.rows =result;
                  // locals.handlerErr.total = result.length;
                  for(var i=0;i<results.length;i++){
                    var data =[];
                    var result = results[i];
                    data.push(parseInt(result.logDate)*1000);   
                    data.push(result.count);
                    locals.handlerErr.push(data);                
                  }
                }
                //console.log(JSON.stringify(locals.handlerErr));
                //求阶段统计和实施统计信息
                cb();
                //view.render('gameError');
              };
                var q2 = keystone.list("Statistical").model.find().where("sType",_config.logTypeID.handlerErr);
             if(region&&parseInt(region)>0)
              q2 = q2.where("region",parseInt(region)); 
             else
              q2= q2.where("region",{$exists:false})             
                q2 = q2.sort({logDate:1}).where("logDate").gte(op).select("logDate count").exec(getHandlerErr);
            }

          ],function(err){
              if (err) {
                console.error("method get , error"+JSON.stringify(err));
                res.send("500");
              };
              var data = {handlerErr:{},msgErr:{}};
               data.handlerErr = locals.handlerErr;
               data.msgErr = locals.msgErr;
              res.send(data);
          });
       });
       view.on('post',{actions:"getresult"},function(){
          var parm = locals.formatData;
          region = parm.region;
          getResultByTypeName(parm["name"]);
       })
       view.on("post",{actions:"getserverstatus"},function(){
          var parm = locals.formatData;
          region = parm.region;
          var gameids = keystone.get("gameids");
          var op = parm["op"];
         // console.log("begin getserverstatus,parm:%s",JSON.stringify(parm));
          if (!op||isNaN(op)) {
            op = Date.now()/1000 - 86400*2;
          }else{
            op = parseInt(parm["op"])/1000;
          }
          var datas = [];
          var i=0;
          for( i;i<gameids.length;i++){
            var gameid = gameids[i];
            var q = keystone.list("InnLog_Global").model.find({'gameid':gameid}).sort({'logDate':-1}).limit(1);
            getGlobalInnLog(q,gameid,datas,function(){
              if(datas.length==gameids.length){
                res.send(datas);
              }
            });
          }
       });
      var  getGlobalInnLog = function(q,gameid,datas,next){
          var data={upspeed:0,downspeed:0,disk_idle:0,cpu_idle:0,mem_idle:0,xAxis:0,datetime:0};
          
          data.gameid = gameid;
          var init = function(parm,cb){
            //locals.datas.push(parm);
            data.upspeed=parseInt(parm.upspeed);
            data.downspeed=parseInt(parm.downspeed);
            data.disk_idle=parseInt(parm.disk_idle);
            data.cpu_idle=parseInt(parm.cpu_idle);
            data.mem_idle=parseInt(parm.mem_idle);
            var date = ((new Date(parm.logDate*1000)).format("yyyy-MM-dd hh:mm:ss"));
            data.datetime=date;
            datas.push(data);
            cb();
          }
          q.exec(function(err, results) {
            //console.log(results);
            async.forEach(results,init,next);
          }); 
      }

       var getResultByTypeName = function(name,next){
          var type = types[name];
          var parm = locals.formatData;
          var op =parm["op"] ;    
          var getCount = function(err,results){
            if (err) {
              console.error(err);
              return;
            };
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
          var q = keystone.list("Statistical").model.find().where('sType',type).where("logDate").gte(op/1000);
             if(region&&parseInt(region)>0)
              q = q.where("region",parseInt(region)); 
             else
              q= q.where("region",{$exists:false})     
          q.select("count logDate").sort({logDate:-1}).exec(getCount);

       }
      if(locals.hasPermission)
        view.render('summary');
      else if(req.user&&req.user.code&&per.HasPermisson("user",req.user.code))
        view.render('gmtool/login');
      else
        view.render('index');
       
};

