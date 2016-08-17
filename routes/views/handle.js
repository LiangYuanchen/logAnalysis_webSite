var keystone = require('keystone');
  async = require('async');
  _ = require("underscore");
  fs = require("fs");
var winston = require('winston');
  readline = require("readline");
var _config = keystone.get("_config");
var util = require('util');
var mm = require("../../manager/manager");
var innlogManager = require("../../manager/innlogManager");
var statisticalManager = require("../../manager/statistical");
var daysLeftManager = require('../../manager/DaysLeftManager');
var syncManager= require("../../manager/SYNCGameUserManager");
var innlogHandle = require("../../manager/innlogHandle");
require("../../manager/util/datetime");
var gameUserManager = require("../../manager/gameUserManager");
var statisticalHandle= require("../../manager/StatisticalHandle");
var conn_mysql = require("../../manager/databases/mysql/conn");
var im = new innlogManager();
var getStrByDate = function(date){
  return new Date(date*1000).format("MM/dd/yyyy hh:mm:ss");
}
var isHandleing = false;
exports = module.exports = function(req, res) {
 // console.log("aaa");
   var view = new keystone.View(req, res);
   locals = res.locals;
   locals.title=_config.title;
   // locals.section is used to set the currently selected
   // item in the header navigation.
   locals.section = 'handle';
   locals.formatData = req.body || {};
   locals.filters = {
         page:req.query.page || 1,
         pagesize:req.query.rows || 10
   };
   locals.onMonitoring=keystone.get("onMonitoring");
   locals.userlist={total:0,rows:[]};
   locals.timezone = _config.timezone||0;
   locals.pages = {page:1,pagesize:10,total:0};
   locals.datas={total:0,rows:[]};
   var permission = require("../../manager/permission");
   // Set locals
   var per = new permission();
   locals.hasPermission = false;
   if(req.user&&req.user.code)
      locals.hasPermission = per.HasPermisson("user",req.user.code);
   var getRegister = function(err,results){
      var getIt = function(i,cb){
            var parm ={};
            parm.uid=results[i].uid;
            var arrStr = results[i].message.split(',');
            parm.username=arrStr[0];
            parm.userRegTime=results[i].userRegTime;
            parm.innExp=results[i].innExp;
            parm.gembuy=results[i].gembuy;
            parm.gemother=results[i].gemother;
            parm.gold=results[i].gold;
            parm.power=results[i].power;
            parm.lastlogtime=results[i].timeStamp;
            parm.lastlogdate=new Date(parm.lastlogtime*1000);
            parm.registerdate = results[i].timeStamp;
            parm.activetime=0;

            var gameUser = keystone.list("GameUser");

            gameUser.model.find({uid:parm.uid}).exec(function(err,users){
               if(users.length>0){
                  parm._id = users[0]._id;
                  if(users.length>1)
                  {
                   //  console.log("asdf");

                     keystone.list("GameUser").model.find({uid:parm.uid,_id:{$ne:parm._id}}).remove(function(err){
                        if(err)
                           console.log(err);
                     });
                  }
                  if(++i<results.length)
                     getIt(i,cb);
                  else
                     cb();
               }
               else
               {
                  var userData = new gameUser.model(parm);
                  userData.save(function(err){
                     if (err) {
                        console.error(JSON.stringify(err));
                     }else
                         console.log("userData save success");
                     if(++i<results.length)
                        getIt(i,cb);
                     else
                        cb();
                  });
               }
            });

      }
      getIt(0,function(){
         console.log("userData get Over");
      });
   };

   view.on("post",{actions:"phaseStatistical"},function(next){
         var isStatistical= keystone.get("onStatistical");
         if(!isStatistical)
         {
           var beginDate = new Date();
           var sta =new syncManager();
           var logDate = Date.now()/1000-86400;
           if(req.body.logdate)
          {
            logDate = parseInt(req.body.logdate);
          }
          keystone.set("onStatistical",logDate);
          keystone.set("onSummaryRetention",logDate);
           //console.log("daily statistical,beginDate:"+beginDate+",logDate:"+logDate);
           sta.dailyStatistical(logDate,function(err){
              var endDate = new Date();
              //console.log("daily statistical,beginDate:"+beginDate+";endDate:"+endDate);
              if (err) {console.log(err)};
              keystone.set("onStatistical",false);
           });
         }
         next();
   });
  view.on("post",{actions:"appsflyerlist"},function(next){
    var datas = {};
    var parm = locals.formatData;
    var sql = {};
    var sort = parm.sort;
    var order = parm.order;
    var start =(parm.page-1)*parm.rows;
    var q = keystone.list("AppsflyerData").model.find(sql);
    if (sort) {
      if (order=="asc") {
        q = q.sort(sort);
      }
      else{
        q = q.sort("-"+sort);
      }
    }else{
      q = q.sort({timeStamp:-1});
    }
    q = q.skip(start).limit(parm.rows).exec(function(err,datas){
      if(err){
        console.error(err);
      };
      // console.log("b");
      var results = [];
      _.each(datas,function(data){
        results.push(JSON.parse(data.strData));
      });
      datas.rows=results;
      // keystone.list("InnLog").model.find().where("logType","Register").exec(getRegister);
      if (datas.length>0) {
        var q2 = keystone.list("AppsflyerData").model.find(sql);
        q2.count(function(err,count){
        datas.total=count;
        res.send(datas);
        });
      }
      else
      {
        datas.total = 0;
        res.send(datas);
      }
    });
  });
  view.on("post",{actions:"feedbacklist"},function(next){
    var datas = {};
    var parm = locals.formatData;
    var theparm = req.body;
      var start =(parm.page-1)*parm.rows;
      var sort = parm.sort;
      var order = parm.order;
    var sql = {};
    if(theparm.uid)
      sql.uid = eval('/'+theparm.uid+'/i');
    if(theparm.tavername)
      sql.tavername = eval('/'+theparm.tavername+'/i');
    var q = keystone.list("Feedback").model.find(sql).select("uid timeStamp regionid username tavername message");
    if (sort) {
      if (order=="asc") {
        q = q.sort(sort);
      }
      else{
        q = q.sort("-"+sort);
      }
    }else{
      q = q.sort({timeStamp:-1});
    }

    q = q.skip(start).limit(parseInt(parm.rows)).exec(function(err,results){
      if(err){
        console.error(err);
      };
      // console.log("b");
      datas.rows=results;
      // keystone.list("InnLog").model.find().where("logType","Register").exec(getRegister);
      if (datas.rows&&datas.rows.length>0) {
        var sql2 = {};
        if(theparm.uid)
          sql2.uid = eval('/'+theparm.uid+'/i');
        if(theparm.tavername)
          sql2.tavername = eval('/'+theparm.tavername+'/i');        
        var q2 = keystone.list("Feedback").model.find(sql2);
        q2.count(function(err,count){
        datas.total=count;
        res.send(datas);
        });
      }else
      {
        datas.rows=[];
        datas.total = 0;
        res.send(datas);
      }
    });
  });
  view.on("post",{actions:"RegisterLog"},function(next){
         var files = [];
         var file = {};
         var onlygembuy = req.body.onlygembuy;
        // console.log("onlygembuy:%s",onlygembuy);
         var folderPath=_config.baseDataFilePath;
         var gm = new gameUserManager();
         async.waterfall([
          function(cb){
            gm.initGameUser(function(){
              cb();
            });
          },
          function(cb){
            fs.readdir(folderPath,function(err,results){
                  if (err) {
                     console.log(err);
                  };
                  var k =0;
                  var paths = results;
                  var GetTheLogs = function(i,thenext){
                     var filePath = folderPath+paths[i];
                     var rs = fs.createReadStream(filePath);
                     var arrLogs = [];
                     console.log(paths[i]);
                     var insertTheLog = function(arrlogs,callback){
                        gm.updateRegisterAllByLog(arrLogs,function(){
                          callback();
                        })
                      };
                     var rd = readline.createInterface({
                        input:rs,
                        output:process.stdout,
                        terminal:false
                     });
                     console.log("read the filePath:%s",filePath);
                     rd.on("line",function(line){
                        //console.log(line);
                        //im.insertLog(line,null,true);

                        if((line.indexOf(",Register,")!=-1))
                            arrLogs.push(line);
                        if((line.indexOf(",RegisterLog,")!=-1))
                            arrLogs.push(line);
                        if((line.indexOf(",TavernBuyGem,")!=-1))
                            arrLogs.push(line);                        
                        
                       if(arrLogs.length==10000)
                       {
                         rd.pause();
                          insertTheLog(arrLogs,function(){
                              arrLogs=[];
                              /** signal mongo to continue, fetch next record **/
                              console.log("over get 10000");
                              rd.resume();
                          });
                       }
                     }).on("close",function(){
                          insertTheLog(arrLogs,function(){
                              arrLogs=[];
                              /** signal mongo to continue, fetch next record **/
                              console.log("over get ");
                              if(++i<paths.length)
                              {
                               GetTheLogs(i,thenext);
                              }
                              else
                              {
                               thenext();
                              }
                          });
                     });
                  }
                  GetTheLogs(0,function(){
                     console.log("readed over");
                  });
               });
              cb();
          }
          ],function(){
          next();
         });
         //console.log("path:%s",folderPath);
   
   });

   view.on("post",{actions:"baseLog"},function(next){
         var files = [];
         var file = {};
         var onlygembuy = req.body.onlygembuy;
        // console.log("onlygembuy:%s",onlygembuy);
         var folderPath=_config.baseDataFilePath;
         var im = new innlogManager();
         //console.log("path:%s",folderPath);
         fs.readdir(folderPath,function(err,results){
            if (err) {
               console.log(err);
            };
            var k =0;
            var paths = results;
            var GetTheLogs = function(i,thenext){
               var filePath = folderPath+paths[i];
               var rs = fs.createReadStream(filePath);
               var arrLogs = [];
               console.log(paths[i]);
               var insertTheLog = function(arrlogs,callback){
                   var getLog = function(j,next)
                   {
                      var thelog = arrlogs[j];
                        // if((++j)<arrlogs.length)
                        //    getLog(j,next);
                        // else
                        //    next();
                     im.insertLog_only(thelog,null,false,function(){
                         console.log("over handle %s",++k);
                        if((++j)<arrlogs.length)
                           getLog(j,next);
                        else
                           next();
                     });
                   }
                   getLog(0,function(){
                   //console.log("b");
                     callback();
                   });
              }
               var rd = readline.createInterface({
                  input:rs,
                  output:process.stdout,
                  terminal:false
               });
               console.log("read the filePath:%s",filePath);
               rd.on("line",function(line){
                  //console.log(line);
                  rd.pause();
                 keystone.get("innlogManager").insertLog_only(line,null,true,function(){
                    rd.resume();
                 });
                 //  if(onlygembuy)
                 //  {
                 //     if((line.indexOf("buygem")!=-1)||(line.indexOf("Register")!=-1))
                 //        arrLogs.push(line);
                 //  }
                 //  else
                 //     arrLogs.push(line);

                 // if(arrLogs.length==1000)
                 // {
                 //   rd.pause();
                 //    insertTheLog(arrLogs,function(){
                 //        arrLogs=[];
                 //        /** signal mongo to continue, fetch next record **/
                 //        console.log("over get 1000");
                 //        rd.resume();
                 //    });
                 // }
               }).on("close",function(){
                        if(++i<paths.length)
                        {
                         GetTheLogs(i,thenext);
                        }
                        else
                        {
                         thenext();
                        }
               });
            }
            GetTheLogs(0,function(){
               console.log("readed over");
            });
         });
         next();
   });

   view.on("post",{actions:"updateErrorID"},function(next){
      //更能性代码，更新所有HandlerErr的ErrorID
         var GetIt = function(err,results){
            var getItIt = function(i,cb){
               var parm = results[i];
               var errorID = parm.message.split(",");
               errorID = errorID[0];
               keystone.list("InnLog").model.update({_id:parm._id},{category:errorID},function(){
                  //console.log("update ErrorID,data:%s,errorID:%s",JSON.stringify(parm),errorID);
                  if (i == results.length-1) {
                     return;
                  }else{
                     i++;
                     getItIt(i,cb);
                  }
               });
            }
            getItIt(0,function(){
               console.log("end init innlog");
            })
         }
         keystone.list("InnLog").model.find({logType:"HandlerErr"}).exec(GetIt);
         next();
   });

   view.on('post',{actions:"userData"},function(next){
         var gameUser = keystone.list("GameUser");
         keystone.list("InnLog").model.find().where("logType","Register").exec(getRegister);
         next();
   });

   view.on('post',{actions:"sendEmail"},function(next){
      var Manager = require("../../manager");
      var sta = new Manager();
      console.log("dailyMail");
      sta.dailyMail(function(err){
         if (err) {
            console.error("jobMail eror!\n"+JSON.stringify(err));
            return;
         };
         console.log("over daily Mail");
         next();
      });
   });
   view.on("post",{actions:"updateUser_Country"},function(next){
     
      var gum = new gameUserManager();
      gum.updateAll_Country(function(){
         console.log("over updateUser_Country");
      });
      next();
   });
    view.on("post",{actions:"getMySqlCount"},function(next){
      var i = parseInt(req.body.days | 0);
      var startTime = (Date.now() / 86400000 | 0) * 86400 - i * 86400;
      var ret = "Date     dnu orders<br>";
      async.whilst(
        function(){return i >= 0},
        function(callback){
          var logDate = startTime + i * 86400;
          ret += new Date(logDate * 1000).format();
          var conn = new conn_mysql();
          async.waterfall([
            function(cb){
              conn.getCount("User_Register_Logs", logDate, function(count){
                ret += " " + count;
                cb();
              });
            },
            function(cb){
              conn.getCount("Sys_orders", logDate, function(count){
                ret += " " + count;
                cb();
              });
            },
            ], function(){
              i--;
              ret += "<br>";
              callback();
          });
        },
        function(err){
          res.send(ret);
          next();
        }
      );
   });
   view.on("post",{actions:"updateUser"},function(next){
      var gum = new gameUserManager();
      gum.updateAll(function(){
         console.log("over updateUser");
               });
      next();
   });
   view.on("post",{actions:"moveAllData"},function(next){
         var isStatistical= keystone.get("onStatistical");
         if(!isStatistical)
         {
          var linshi = function(i,cb){
            var sss=new statisticalManager();
            var date = new Date()/1000-86400*i;
            sss.LinshiFunction_GetGem("daily",date,function(){
              if(--i<1){
                cb();
              }
              else
              {
                linshi(i,cb);
              }
            });
          }
          linshi(17,function(){
             console.log("all lishi over");
          });
       }
         next();
   });
   view.on("post",{actions:"getSummary"},function(next){
      var summaryGetting = keystone.get("onSummary");
    var syncManager= require("../../manager/SYNCGameUserManager");
      var sm = new syncManager();
      if(!!summaryGetting==false)
      {
         // var statisticalhandler = require("../../manager/innlogHandle");
         // var Manager = require("../../manager/manager");
         // var manager = new Manager();
         var logDate = Date.now()/1000 - 86400;


         keystone.set("onSummary",logDate);
         sm.Linshi_getSummary(logDate,function(){
            keystone.set("onSummary",false);
         });
         // var firstDate = manager.showDailyBegin(logDate);
         // var lastDate = manager.showDailyEnd(logDate);
         // var sh = new statisticalhandler();
         // sh.phaseStatisticalAll({firstDate:firstDate,lastDate:lastDate,logDate:logDate},function(err){
         //  keystone.set("onSummary",false);
         //  next();
         // });

      }
      next();
   });
   view.on("post",{actions:"getSummaryByDate"},function(next){
      var summaryGetting = keystone.get("onSummary");
    var syncManager= require("../../manager/SYNCGameUserManager");
      var sm = new syncManager();
      if(!!summaryGetting==false)
      {
         // var statisticalhandler = require("../../manager/innlogHandle");
         // var Manager = require("../../manager/manager");
         // var manager = new Manager();
         var logDate = parseInt(req.body.date);

         if(isNaN(logDate))
         {
            return;
         }
         keystone.set("onSummary",logDate);
         sm.Linshi_getSummary(logDate,function(){
            keystone.set("onSummary",false);
         });
         // var firstDate = manager.showDailyBegin(logDate);
         // var lastDate = manager.showDailyEnd(logDate);
         // var sh = new statisticalhandler();
         // sh.phaseStatisticalAll({firstDate:firstDate,lastDate:lastDate,logDate:logDate},function(err){
         //  keystone.set("onSummary",false);
         //  next();
         // });

      }
      next();
   });
  view.on("post",{actions:"getIPO"},function(next){
      if(isHandleing)
      {
        next();
        return;
      }
      isHandleing = true;
      var days = parseInt(req.body.days) || 20;
      var i=days-1;
      var j = 0;
      
      async.whilst(
        function(){return i>=0},
        function(callback){
          var m = new mm();
          var logDate = Date.now()/1000-i*86400;
          var firstDate = m.showDailyBegin(logDate);
          var lastDate = m.showDailyEnd(logDate);
          i--;
          var stream = keystone.list("InnLog").model.find({logType:{$in:["LogOn","TavernBuyGem","RegisterLog"]},timeStamp:{$gte:firstDate,$lt:lastDate}}).sort({timeStamp:1}).stream();
          stream.on('data',function(item){
            stream.pause();
            //item.hasIPO = false;
            item.save(function(err){
              stream.resume();
              j++;
              if(j%10000==0)
              {
                winston.info("over IPO " + j);
              }
            });

                // item.save(function(err){
                //   stream.resume();
                //   j++;
                //   if(j%100==0)
                //   {
                //     winston.info("over IPO "+j + "," + new Date(firstDate*1000).format("MM/dd"));
                //   }
                // });              
              // im.preSave(item,im.initOptions(item),function(err,log){
              //     // if(!log.hasIPO)
              //     //   //log.hasIPO = true;
              //     // log.save(function(err){
              //     //   //stream.resume();
              //     //   j++;
              //     //   if(j%100==0)
              //     //   {
              //     //     winston.info("over IPO "+j + "," + new Date(firstDate*1000).format("MM/dd"));
              //     //   }
              //     // });
              //          j++;
              //          stream.resume();
              //       if(j%100==0)
              //       {
              //         winston.info("over IPO "+j + "," + new Date(firstDate*1000).format("MM/dd"));
              //       }           
              
              // });
          });
          stream.on('end',function(){});
          stream.on("close",function(){
              j = 0;
              winston.info("IPO over %s",new Date(firstDate*1000).format("MM/dd"));
              callback();
          });
        },
        function(err){
          winston.info("over getIPO");
          isHandleing = false;
        }
        );
        next();
  });
  view.on("post",{actions:"getIPO_Date"},function(next){
      var j = 0;
      var m = new mm();
      var logDate = parseInt(req.body.date);
      var firstDate = m.showDailyBegin(logDate);
      var lastDate = m.showDailyEnd(logDate);
      var stream = keystone.list("InnLog").model.find({timeStamp:{$gte:firstDate,$lt:lastDate}}).sort({timeStamp:1}).stream();
      stream.on('data',function(item){
          stream.pause();
          //item.hasIPO = false;
          keystone.get("innlogManager").preSave(item,keystone.get("innlogManager").initOptions(item),function(){
            stream.resume();
            j++;
            if(j%10000==0)
            {
              winston.info("over IPO " + j);
            }
          });           

      });
      stream.on("error",function(err){
        winston.info("error:%s",err);
      })
      stream.on('end',function(){ //console.log('query ended');
        winston.info("all end IPO");
        }
        );
      stream.on('close',function(){ //console.log('query closed');
        winston.info("all over IPO");
       });
      next();
  });
    view.on("post",{actions:"getMysql_days"},function(next){
     
      var m = new mm();
      var days = parseInt(req.body.days) || 20;
      var i=days-1;
      var end = parseInt(req.body.end) || 0;
      async.whilst(
        function(){
          return i>=end;
        },
        function(callback)
        {
          var j = 0;
          var logDate = Date.now()/1000-i*86400;
          var firstDate = m.showDailyBegin(logDate);
          var lastDate = m.showDailyEnd(logDate);
          var conn = new conn_mysql();
          async.waterfall([
            function(cb){
              conn.deleteByCrt_DT(firstDate,"User_Register_Logs",cb);
            },
            function(cb){
              conn.deleteByCrt_DT(firstDate,"Res_log_Gem",cb);
            },
            function(cb){
              conn.deleteByCrt_DT(firstDate,"Res_log_Coin",cb);
            },   
            function(cb){
              conn.deleteByCrt_DT(firstDate,"Res_log_PvPCoin",cb);
            },  
            function(cb){
              conn.deleteByCrt_DT(firstDate,"Res_log_Energy",cb);
            },  
            function(cb){
              conn.deleteByCrt_DT(firstDate,"Res_log_GldCoin",cb);
            }, 
            function(cb){
              conn.deleteByCrt_DT(firstDate,"Res_log_OdsyCoin",cb);
            },  
            function(cb){
              conn.deleteByCrt_DT(firstDate,"Res_log_AreaPt",cb);
            },  
            function(cb){
              conn.deleteByCrt_DT(firstDate,"Res_log_VIP",cb);
            },  
            function(cb){
              conn.deleteByCrt_DT(firstDate,"Res_log_Fame",cb);
            },  
            function(cb){
              conn.deleteByCrt_DT(firstDate,"Res_log_EXP",cb);
            },  
            function(cb){
              conn.deleteByCrt_DT(firstDate,"Res_log_Food",cb);
            },  
            function(cb){
              conn.deleteByCrt_DT(firstDate,"Res_log_itm",cb);
            },  
            function(cb){
              conn.deleteByCrt_DT(firstDate,"Res_log_Eqp",cb);
            },  
            function(cb){
              conn.deleteByCrt_DT(firstDate,"Act_log_Hero_EXP",cb);
            }, 
            function(cb){
              conn.deleteByCrt_DT(firstDate,"Act_log_Adv",cb);
            },
            function(cb){
              conn.deleteByCrt_DT(firstDate,"Act_log_odsy",cb);
            },
            function(cb){
              conn.deleteByCrt_DT(firstDate,"Act_log_Arena",cb);
            },
            function(cb){
              conn.deleteByCrt_DT(firstDate,"Sys_Store",cb);
            },
            function(cb){
              conn.deleteByCrt_DT(firstDate,"Sys_Summon",cb);
            },
            function(cb){
              conn.deleteByCrt_DT(firstDate,"Sys_orders",cb);
            },
            function(cb){
              var stream = keystone.list("InnLog").model.find({timeStamp:{$gte:firstDate,$lt:lastDate}}).sort({timeStamp:1}).stream();
              stream.on('data',function(item){
                  stream.pause();
                  //item.hasIPO = false;
                  keystone.get("innlogManager").preSave(item,keystone.get("innlogManager").initOptions(item),function(){
                    stream.resume();
                    j++;
                    if(j%10000==0)
                    {
                      winston.info("over IPO " + j);
                    }
                  });   
                  // im.preSave(item,im.initOptions(item),function(err,log){
                  //   j++;
                  //   if(j%100==0)
                  //   {
                  //     winston.info("over getMysql_days "+j + "," + new Date(firstDate*1000).format("MM/dd"));
                  //   }
                  //   stream.resume();
                  // });
              });
              stream.on("error",function(err){
                winston.info("error:%s",err);
              })
              stream.on('end',function(){ //console.log('query ended');
                winston.info("all end getMysql_days");
                }
                );
              stream.on('close',function(){ //console.log('query closed');
                winston.info("all over mysql_byDays,J:%s",j);
                cb();
               });          
            }
            // function(cb){
            //   var syncManager= require("../../manager/StatisticalHandle");
            //   var sm = new syncManager(logDate);
            //   sm.handleOnlyMysql({},cb);
            // }
            ],function(){
              i--;
              callback();
          });
        },
        function(err){
          winston.info("over getMysql_days");
        }
        );
        next();
  });
  view.on("post",{actions:"getMysql_register"},function(next){
    var user_register = require("../../manager/databases/mysql/user_register");
    var j = 0;
     var conn = new conn_mysql();
      async.waterfall([
        function(cb){
          conn.deleteLessDate(1462752000,"User_Register_Logs",cb);
        },
        function(cb){
          winston.info("#handle#getMysql_Date#begin getMysql_mysql_register!");
          var stream = keystone.list("InnLog").model.find({logType:"RegisterLog",timeStamp:{$lt:1462752000}}).stream();
          stream.on('data',function(item){
                  stream.pause();
                  // j++;
                  // if(j%10000==0)
                  // {
                  //   winston.info("over mysql " + j);
                  // }                  
                  // stream.resume();
                  var arrStr = item.message.split(",");
                  //item.hasIPO = false;
                  var the_parm = {
                      uid:item.uid,
                      username:arrStr[0],
                      gameid:item.gameid,
                      logDate:item.timeStamp,
                      region_id:parseInt(item.R2),
                      ip:arrStr[1],
                      User_country:item.country || "",
                      app_Ver:arrStr[2],
                      OS_Ver:arrStr[3],
                      OS_Type:arrStr[4],
                      User_local:arrStr[7]
                  }
                  var the_user_register = new user_register(the_parm);
                the_user_register.save(function(){
                    stream.resume();
                    j++;
                    if(j%10000==0)
                    {
                      winston.info("over mysql " + j);
                    }
                });
          });
          stream.on("error",function(err){
            winston.info("error:%s",err);
          });
          stream.on('end',function(){ //console.log('query ended');
            winston.info("all end getMysql_register");
            }
            );
          stream.on('close',function(){ //console.log('query closed');
            winston.info("all over getMysql_register,J:%s",j);
            cb();
           });  
        }  
        ],function(){
          console.log("over mysql_byDate");
      });
      next();
  });
  view.on("post",{actions:"getMysql_order"},function(next){
    var Sys_orders = require("../../manager/databases/mysql/Sys_orders");
    var j = 0;
     var conn = new conn_mysql();
      async.waterfall([
        function(cb){
          conn.deleteAll("Sys_orders",cb);
        },
        function(cb){
          winston.info("#handle#getMysql_Date#begin getMysql_Date!");
          var stream = keystone.list("InnLog").model.find({logType:"TavernBuyGem"}).sort({timeStamp:1}).stream();
          stream.on('data',function(item){
                  stream.pause();
                  var arrMsg = item.message.split(",");
                  //item.hasIPO = false;
                  var orderid = arrMsg[2];
                  var uid = item.uid;
                  var region = item.R2;
                  var product_id = "";
                  if(isNaN(item.R2))
                    region=1;
                  if(orderid.length<=8)
                  {
                    try{
                      
                      orderid = JSON.parse( arrMsg[5]+"}").orderId;
                      product_id = JSON.parse( arrMsg[5]+"}").productId;
                    }
                    catch(err){
                      try{
                        orderid = JSON.parse( arrMsg[2]+"}").orderId;
                        product_id = JSON.parse( arrMsg[2]+"}").productId;
                      }
                      catch(err)
                      {
                        try{
                          orderid = JSON.parse( arrMsg[4]+"}").orderId;
                          product_id = JSON.parse( arrMsg[4]+"}").productId;
                        }
                        catch(err)
                        {
                          try{
                            orderid = JSON.parse( arrMsg[3]+"}").orderId;
                            product_id = JSON.parse( arrMsg[3]+"}").productId;
                          }catch(err)
                          {
                             utils.showErr(err);
                            winston.error("#StatisticalHandle#insertPayingInfo error,err:%s,the message:%s",arrMsg[5]+"\"}",item.message);
                            return undefined;                             
                          }

       
                        }
                      }
                    }
                  }
                    var gembuy = parseInt(arrMsg[2]);
                  if(isNaN(gembuy))
                    gembuy = 0;
                  var gemother = parseInt(arrMsg[3]);
                  if(isNaN(gemother))
                    gemother = 0;
                  gameUserManager.getGameUser(item.uid,function(gameuser){
                    var res_log = new Sys_orders({
                      User_ID:item.uid,
                      User_DvcID:gameuser.username,
                      User_Server:item.gameid,
                      Crt_DT:(new Date(item.timeStamp*1000)).format(),
                      region_id:parseInt(item.R2),
                      Order_currency_type:"$",
                      Order_price:utils.GetProduct_Price("2",item.message),
                      Order_success:1,
                      Order_portal:arrMsg[1],
                      Order_gem:gembuy+gemother,
                      Order_Vip_Exp:gembuy,
                      Order_kind_id:orderid,
                      Order_Invoice:product_id,
                      Order_Channel:"android",
                      Order_Pkg_ID:0
                    });
                    res_log.save(function(){
                      //self.hasMysql = true;
                      stream.resume();
                      j++;
                      if(j%10000==0)
                      {
                        winston.info("over IPO " + j);
                      }
                    });
                  });
          });
          stream.on("error",function(err){
            winston.info("error:%s",err);
          });
          stream.on('end',function(){ //console.log('query ended');
            winston.info("all end getMysql_Date");
            }
            );
          stream.on('close',function(){ //console.log('query closed');
            winston.info("all over mysql_byDate,J:%s",j);
            cb();
           });  
        }
        // function(cb){
          
        //   var sm = new statisticalHandle(logDate);
        //   sm.handleOnlyMysql({},cb);
        // }   
        ],function(){
          console.log("over mysql_byDate");
      });
      next();
  });
    view.on("post",{actions:"getMysql_Date"},function(next){
      var j = 0;
      var m = new mm();
      var logDate = parseInt(req.body.date);
      var firstDate = m.showDailyBegin(logDate);
      var lastDate = m.showDailyEnd(logDate);
      var conn = new conn_mysql();
      async.waterfall([
       function(cb){
          conn.deleteByCrt_DT(firstDate,"User_Register_Logs",cb);
        },
        function(cb){
          conn.deleteByCrt_DT(firstDate,"Res_log_Gem",cb);
        },
        function(cb){
          conn.deleteByCrt_DT(firstDate,"Res_log_Coin",cb);
        },   
        function(cb){
          conn.deleteByCrt_DT(firstDate,"Res_log_PvPCoin",cb);
        },  
        function(cb){
          conn.deleteByCrt_DT(firstDate,"Res_log_Energy",cb);
        },  
        function(cb){
          conn.deleteByCrt_DT(firstDate,"Res_log_GldCoin",cb);
        }, 
        function(cb){
          conn.deleteByCrt_DT(firstDate,"Res_log_OdsyCoin",cb);
        },  
        function(cb){
          conn.deleteByCrt_DT(firstDate,"Res_log_AreaPt",cb);
        },  
        function(cb){
          conn.deleteByCrt_DT(firstDate,"Res_log_VIP",cb);
        },  
        function(cb){
          conn.deleteByCrt_DT(firstDate,"Res_log_Fame",cb);
        },  
        function(cb){
          conn.deleteByCrt_DT(firstDate,"Res_log_EXP",cb);
        },  
        function(cb){
          conn.deleteByCrt_DT(firstDate,"Res_log_Food",cb);
        },  
        function(cb){
          conn.deleteByCrt_DT(firstDate,"Res_log_itm",cb);
        },  
        function(cb){
          conn.deleteByCrt_DT(firstDate,"Res_log_Eqp",cb);
        },  
        function(cb){
          conn.deleteByCrt_DT(firstDate,"Act_log_Hero_EXP",cb);
        }, 
        function(cb){
          conn.deleteByCrt_DT(firstDate,"Act_log_Adv",cb);
        },
        function(cb){
          conn.deleteByCrt_DT(firstDate,"Act_log_odsy",cb);
        },
        function(cb){
          conn.deleteByCrt_DT(firstDate,"Act_log_Arena",cb);
        },
        function(cb){
          conn.deleteByCrt_DT(firstDate,"Sys_Store",cb);
        },
        function(cb){
          conn.deleteByCrt_DT(firstDate,"Sys_Summon",cb);
        },
        function(cb){
          conn.deleteByCrt_DT(firstDate,"Sys_orders",cb);
        },
        function(cb){
          winston.info("#handle#getMysql_Date#begin getMysql_Date!");
          var stream = keystone.list("InnLog").model.find({timeStamp:{$gte:firstDate,$lt:lastDate}}).sort({timeStamp:1}).stream();
          stream.on('data',function(item){
                  stream.pause();
                  //item.hasIPO = false;
                  keystone.get("innlogManager").preSave(item,keystone.get("innlogManager").initOptions(item),function(){
                    stream.resume();
                    j++;
                    if(j%10000==0)
                    {
                      winston.info("over IPO " + j);
                    }
                  });   
          });
          stream.on("error",function(err){
            winston.info("error:%s",err);
          });
          stream.on('end',function(){ //console.log('query ended');
            winston.info("all end getMysql_Date");
            }
            );
          stream.on('close',function(){ //console.log('query closed');
            winston.info("all over mysql_byDate,J:%s",j);
            cb();
           });  
        }
        // function(cb){
          
        //   var sm = new statisticalHandle(logDate);
        //   sm.handleOnlyMysql({},cb);
        // }   
        ],function(){
          console.log("over mysql_byDate");
      });
      next();
  });
   view.on("post",{actions:"getCluster"},function(next){
    var syncManager= require("../../manager/SYNCGameUserManager");
      var sm = new syncManager();
      sm.clusterDemo(function(){
        winston.info("getcluster over");
      });
      next();
   });
   view.on("post",{actions:"addSignCountry"},function(next){
      var s = new statisticalManager();
      s.addSignCountryOfInnLog(req.body.op,req.body.ed,function(){
        winston.info("over handle add Signcountry");
      });
      next();
   });
   view.on("post",{actions:"summaryAll"},function(next){
      var summaryAllgetting = keystone.get("onSummary");
    var syncManager= require("../../manager/SYNCGameUserManager");

      if(!!summaryAllgetting==false)
      {

        var i=0;
        var max=  isNaN(req.body.days)?2:parseInt(req.body.days);
        i=max;
        async.whilst(
          function(){return i>=0},
          function(callback){
            var logDate = Date.now()/1000 -i*86400;
            keystone.set("onSummary",logDate);
            var sm = new syncManager();
            sm.Linshi_getSummary(logDate,function(){
              winston.info("#handle#summaryAll#over get Summary day:%d",logDate);
              i--;
              callback();
            });
              // theinnloghandle.phaseStatistical(firstDate,lastDate,logDate,"Not_CN",function(err){
              //   i++;
              //   callback();
              // });
          },
          function(err){
            keystone.set("onSummary",false);
            winston.info("over summaryAll");
          }
          );
       }
      next();
   });
  view.on("post",{actions:"Dayleft"},function(next){
    var onSummaryRetention = keystone.get("onSummaryRetention");
    if(!onSummaryRetention)
    {
       var days = parseInt(req.body.days) || 20;
      var i=days-1;
      async.whilst(
        function(){return i>=0},
        function(callback){
          var syncManager= require("../../manager/SYNCGameUserManager");

          var logDate = Date.now()/1000-i*86400;
          keystone.set("onSummaryRetention",logDate);
          i--;
          var sm = new syncManager();
          winston.info("begin get Linshi_getRetention "+ new Date(logDate*1000).format());
          sm.Linshi_getRetention(logDate,function(){
            winston.info("get Linshi_getRetention over");
             callback();
          });
        },
        function(err){
          keystone.set("onSummaryRetention",false);
          winston.info("over Linshi_getRetention");
        }
        );
    }
    next();
  });
  view.on("post",{actions:"SYNCDailyStatistical_onlyTutorial"},function(next){
 var onStatistical = keystone.get("onStatistical");
    if(!onStatistical)
    {
       var days = parseInt(req.body.days) || 20;
       var end = parseInt(req.body.end) || 0;
      var i=days-1;
      var timezone = req.body.timezone;
      if(!isNaN(timezone))
        timezone = parseInt(timezone);
      async.whilst(
        function(){return i>=end},
        function(callback){
          var syncManager= require("../../manager/StatisticalHandle");

          var logDate = Date.now()/1000-i*86400;
          keystone.set("onStatistical",logDate);
          //keystone.set("onSummaryRetention",logDate);
          i--;
          var sm = null;
          if(isNaN(timezone))
            sm = new syncManager(logDate);
          else
            sm = new syncManager(logDate,timezone);
          sm.dailyStatistical_onlyStepTrack(function(){
            winston.info("get SYNCDailyStatistical_onlyTutorial over,logDate:%s,timezone:%s",logDate,timezone);
             callback();
          });
        },
        function(err){
          keystone.set("onStatistical",false);
          //keystone.set("onSummaryRetention",false);
          winston.info("over SYNCDailyStatistical");
        }
        );
    }    
    next();
  });
   view.on("post",{actions:"SYNCDailyStatistical_onlySummary"},function(next){
    var onStatistical = keystone.get("onStatistical");
    if(!onStatistical)
    {
       var days = parseInt(req.body.days) || 20;
       var end = parseInt(req.body.end) || 0;
      var i=days-1;
      var timezone = req.body.timezone;
      if(!isNaN(timezone))
        timezone = parseInt(timezone);
      async.whilst(
        function(){return i>=end},
        function(callback){
          var syncManager= require("../../manager/StatisticalHandle");

          var logDate = Date.now()/1000-i*86400;
          keystone.set("onStatistical",logDate);
          keystone.set("onSummaryRetention",logDate);
          i--;
          var sm = null;
          if(isNaN(timezone))
            sm = new syncManager(logDate);
          else
            sm = new syncManager(logDate,timezone);
          sm.dailyStatistical_onlySummary(function(){
            winston.info("get dailyStatistical_onlySummary over,logDate:%s,timezone:%s",logDate,timezone);
             callback();
          });
        },
        function(err){
          keystone.set("onStatistical",false);
          keystone.set("onSummaryRetention",false);
          winston.info("over SYNCDailyStatistical");
        }
        );
    }
    next();
  }); 
   view.on("post",{actions:"SYNCDailyStatistical_onlyRetention"},function(next){
    var onStatistical = keystone.get("onStatistical");
    if(!onStatistical)
    {
       var days = parseInt(req.body.days) || 20;
       var end = parseInt(req.body.end) || 0;
      var i=days-1;
      var timezone = req.body.timezone;
      if(!isNaN(timezone))
        timezone = parseInt(timezone);
      async.whilst(
        function(){return i>=end},
        function(callback){
          var syncManager= require("../../manager/StatisticalHandle");

          var logDate = Date.now()/1000-i*86400;
          keystone.set("onStatistical",logDate);
          keystone.set("onSummaryRetention",logDate);
          i--;
          var sm = null;
          if(isNaN(timezone))
            sm = new syncManager(logDate);
          else
            sm = new syncManager(logDate,timezone);
          sm.dailyStatistical_onlyRetention(function(){
            winston.info("get SYNCDailyStatistical_onlyRetention over,logDate:%s,timezone:%s",logDate,timezone);
            sm = null;
             callback();
          });
        },
        function(err){
          keystone.set("onStatistical",false);
          keystone.set("onSummaryRetention",false);
          winston.info("over SYNCDailyStatistical");
        }
        );
    }
    next();
  }); 
  view.on("post",{actions:"SYNCDailyStatistical"},function(next){
    var onStatistical = keystone.get("onStatistical");
    if(!onStatistical)
    {
       var days = parseInt(req.body.days) || 20;
       var end = parseInt(req.body.end) || 0;
      var i=days-1;
      var timezone = req.body.timezone;
      if(!isNaN(timezone))
        timezone = parseInt(timezone);
      async.whilst(
        function(){return i>=end},
        function(callback){
          var syncManager= require("../../manager/StatisticalHandle");

          var logDate = Date.now()/1000-i*86400;
          keystone.set("onStatistical",logDate);
          keystone.set("onSummaryRetention",logDate);
          i--;
          var sm = null;
          if(isNaN(timezone))
            sm = new syncManager(logDate);
          else
            sm = new syncManager(logDate,timezone);
          sm.dailyStatistical(function(){
            winston.info("get SYNCDailyStatistical over,logDate:%s,timezone:%s",logDate,timezone);
             callback();
          });
        },
        function(err){
          keystone.set("onStatistical",false);
          keystone.set("onSummaryRetention",false);
          winston.info("over SYNCDailyStatistical");
        }
        );
    }
    next();
  });
  view.on("post",{actions:"getRT"},function(next){
    var syncManager= require("../../manager/SYNCGameUserManager");
    var sm = new syncManager();
    sm.RTStatistical(function(){
      winston.info("over getRT");
    })
  });

  function getInnState(next)
  {
      keystone.list("SiteState").model.find().sort("-createdAt").select("lastSYNCAt").limit("1").exec(function(err,results){
        if(results&&results[0])
          next(results[0]);
        else
          next("");
      });
  }
  view.on("post",{actions:"lastlogdateSummary"},function(next){
    getInnState(function(innstate){
      if(innstate)
        res.send(getStrByDate(innstate.lastSYNCAt));
      else
      {
        keystone.list("Summary").model.find().sort({logDate:-1}).limit(1).exec(function(err,results){
          if(results.length==1)
            res.send(getStrByDate(results[0].logDate));
          else
            res.send("");
        });
      }
    });
  });
   view.on("post",{actions:"lastlogdateStatistical"},function(next){
    getInnState(function(innstate){
      if(innstate)
        res.send(getStrByDate(innstate.lastSYNCAt));
      else
      {
        keystone.list("DaysLeft").model.find().sort({logDate:-1}).limit(1).exec(function(err,results){
          if(results.length==1)
            res.send(getStrByDate( results[0].logDate));
          else
            res.send("");
        });
      }
    });
  });
   view.on("post",{actions:"paidusercount"},function(next){
    keystone.list("GameUser").model.find({firstpaydate:{$exists:true}}).count(function(err,count){
      console.log("count:%d",count);
      res.send(count+"");
    });
  });
   view.on("post",{actions:"SYNCDailyStatisticalLinshi"},function(next){
    var onStatistical = keystone.get("onStatistical");
    if(!onStatistical)
    {
      async.waterfall([
        function(cb){
          var days = parseInt(req.body.days) || 20;
          var i=days-1;
          async.whilst(
            function(){return i>=0},
            function(callback){
              var syncManager= require("../../manager/SYNCGameUserManager");

              var logDate = Date.now()/1000-i*86400;
               keystone.set("onStatistical",logDate);
              i--;
              winston.debug("begin SYNCDailyStatisticalLinshi");
              var sm = new syncManager();
              sm.Linshi_Gold(logDate,function(){
                winston.info("get SYNCDailyStatistical over");
                 callback();
              });
            },
            function(err){
              keystone.set("onStatistical",false);
              winston.info("over SYNCDailyStatisticalLinshi");
            }
            );
        }
        ],function(err){
      });
    }
    next();
  });
   view.on("post",{actions:"payinginfo"},function(next){
     var syncManager= require("../../manager/StatisticalHandle");
     var sm = new syncManager();
     winston.info("begin get allpayinginfo");
     var first = req.body.firstdate;
     var last = req.body.lastdate;
     keystone.list("PayingInfo").model.find().remove(function(err){
        winston.info("deleted payinginfos");
        keystone.list("GameUser").model.find({}).select("_id uid").exec(function(err,results){
          winston.info("loaded gameusers");
          sm.set_gameusers(results);
          var sql = {logType:"TavernBuyGem"};
          var doIt = function(arrLog,thenext)
          {
             var i=-1;
             if(!arrLog||arrLog.length==0)
             {
               thenext();
               return;
             }
             var payinginfos = [];
             _.each(arrLog,function(log){
              var payinginfo = sm.initPayingInfo(log);
              if(payinginfo)
                payinginfos.push(payinginfo);
             });
            sm.batchInsertAnyCollection("PayingInfo",payinginfos,function(err){
              utils.showErr(err);
              thenext();
            });             
             winston.info("over get :%d",arrLog.length);
          }
          sm.selectByStream(sql,doIt,function(){
            winston.info("get all payinginfo over");
          });
        });
     });
     next();
   });
  view.on("post",{actions:"getdiffofinnlogs"},function(next){
    var sm = new syncManager();
    var fileMore = [];
    var logDate =parseInt(req.body.logdate);
    sm.dataBind({logDate:logDate},function(){
       var folderPath = process.cwd()+"/baseData/";
       fs.readdir(folderPath,function(err,results){
          if (err) {
             console.log(err);
          };
          var k =0;
          var paths = results;
          var GetTheLogs = function(i,thenext){
             var filePath = folderPath+paths[i];
             var rs = fs.createReadStream(filePath);
             var arrLogs = [];
             //console.log(paths[i]);

             var rd  = readline.createInterface({
                input:rs,
                output:process.stdout,
                terminal:false
             });
             console.log("read the filePath:%s",filePath);
             rd.on("line",function(line){
                var parm = _.find(sm.logs,function(log){return line.indexOf(log.timeStamp+"")>-1&&line.indexOf(log.message+"")>-1});
                winston.info("parm:%s,find line:%s",JSON.stringify(parm),line);
                if(!parm)
                {
                   winston.info("fileMore:%s",line);
                }
             }).on("close",function(){
                process.nextTick(function(){
                    /** signal mongo to continue, fetch next record **/
                    console.log("over get，i:%d,paths.length:%d ",i,paths.length);
                    if(++i<paths.length)
                    {
                     GetTheLogs(i,thenext);
                    }
                    else
                    {
                     thenext();
                    }
                });
             });
          }
          GetTheLogs(0,function(){
              console.log("readed over");
          });
      });
    });
    next();
  });
  view.on("post",{actions:"paidtimeHandle"},function(next){
    winston.debug("#paidtime#begin");
      var uid = req.body.uid;
      if(!uid)
      {
        winston.debug("#paidtime#uid not defined")
        res.send("--");
      }
      else
      {
        keystone.list("PayingInfo").model.find({uid:uid}).count(function(err,count){
          winston.debug("#paidtime#count finded,count:%d",count);
          res.send(count+"");
        });
      }
  });
  view.on("post",{actions:"getStorageNow"},function(next){
     var syncManager= require("../../manager/SYNCGameUserManager");
     var sm = new syncManager();
     sm.getStorageNow(function(){
      winston.info("getStorageNow over");
     });
     next();
   });
  view.on("post",{actions:"testStatisticalHandle"},function(next){
     var date = parseInt(req.body.date);
     var timezone = parseInt(req.body.timezone);
     var rManager = require("../../manager/StatisticalHandle");
     var sm = new rManager(date,timezone);
    keystone.set("onStatistical",date);
    keystone.set("onSummaryRetention",date);
     sm.dailyStatistical(function(){
      keystone.set("onStatistical",false);
      keystone.set("onSummaryRetention",false);
      winston.info("over all test");
     });
     next();
   });
   view.on("post",{actions:"summary"},function(next){
      var firstdate = parseInt(req.body.firstdate);
      var lastdate = parseInt(req.body.lastdate);
      if(isNaN(firstdate)||isNaN(lastdate))
      {
        next();
        return;
      }
      var ih = new innlogHandle();
      ih.getLTV_v2(firstdate,lastdate,"","",function(){
        winston.info("over get summary,firstdate:%s,lastdate:%s",firstdate,lastdate);
      });
      next();
   });
   view.on("post",{actions:"summary"},function(next){
      var firstdate = parseInt(req.body.firstdate);
      var lastdate = parseInt(req.body.lastdate);
      if(isNaN(firstdate)||isNaN(lastdate))
      {
        next();
        return;
      }
      var ih = new innlogHandle();
      ih.getLTV_v2(firstdate,lastdate,"","",function(){
        winston.info("over get summary,firstdate:%s,lastdate:%s",firstdate,lastdate);
      });
      next();
   });   

   view.on("post",{actions:"removeRepeatedUser"},function(next){
      var gameUserManager = require("../../manager/gameUserManager");
      var gum = new gameUserManager();
      gum.removeRepeatUser(function(){
         console.log("over removeRepeatedUser");
               });
      next();
   });
   view.on("post",{actions:"newUser"},function(next){
      var UserManager = require("../../manager/UserManager");
      var mail = req.body.email;
      var code = req.body.code || 4094;
      
      if(!mail)
      {
        next();
        return;
      }
      UserManager.sendMailForAuthentication(mail,code,function(){
        res.send("email created success");
      });
   });   
   view.on("post",{actions:"testRetentions"},function(next){
      var m = new mm();
      var logDate = parseInt(req.body.date);
      var firstDate = m.showDailyBegin(logDate);
      var lastDate = m.showDailyEnd(logDate);
      var retenionDate = parseInt(req.body.date2);
      var firstDate2 = m.showDailyBegin(retenionDate);
      var lastDate2 = m.showDailyEnd(retenionDate);
      async.waterfall([
        function(cb){
          keystone.list("GameUser").model.find({registerdate:{$gte:firstDate,$lt:lastDate}}).distinct("uid").exec(function(err,datas){
            cb(null,datas);
          });
        },
        function(uids,cb){
          keystone.list("InnLog").model.find({logType:{$in:["LogOn"]},timeStamp:{$gte:firstDate2,$lt:lastDate2},uid:{$in:uids}}).distinct("uid").exec(function(err,datas){
            var str = "#handle#testRetentions#newuserCount:"+uids.length+",day:"+new Date(logDate*1000).format()+",retention:"+datas.length+",retentionsDay:"+new Date(retenionDate*1000).format()+"\nretentionArr:"+JSON.stringify(datas)+"";
            console.log("#handle#testRetentions#newuserCount:%s,day:%s,retention:%s,retentionsDay:%s\nretentionArr:%s",uids.length,new Date(logDate*1000).format(),datas.length,new Date(retenionDate*1000).format(),JSON.stringify(datas));
            res.send(str);
            cb();
          });
        }
        ],function(){

      });
   });
  
   view.on("post",{actions:"devicd_id"},function(next){
      async.waterfall([
        function(cb){
          keystone.list("GameUser").model.find({devicd_id:{$exists:false}}).distinct("uid").exec(function(err,results){
            if(err)
            {
              winston.info("#handle#gameuser search error");
              utils.showErr(err);
            }
            cb(null,results);
          });
        },
        function(cb){

        },
        function(uids,cb){
          keystone.list("InnLog").model.find({logType:"RegisterLog",uid:{$in:uids}}).exec(function(err,logObjs){
            var gm = new gameUserManager();
            var i=0;
            async.whilst(function(){
              return i<logObjs.length; 
            },
            function(cbb){
              var logObj = logObjs[i];
              gm.InsertInnLog(logObj,function(){
                i++;
                cbb();
              });
            },
            function(){
              cb();
            });
          });
        }
        ],function(){
          winston.info("over handle devicd_id");
      });
      next();
   });  


   view.on("post",{actions:"LTV"},function(next){
      var m = new mm();
      var logDate = parseInt(req.body.date);
      if(isNaN(logDate))
      {
        next();
        return;
      }      
      var firstDate = m.showDailyBegin(logDate);
      var lastDate = m.showDailyEnd(logDate);
      var ltv7Date = lastDate + 86400*7;

      async.waterfall([
        function(cb){
          keystone.list("GameUser").model.find({registerdate:{$gte:firstDate,$lt:lastDate}}).distinct("uid").exec(function(err,results){
            if(err)
            {
              winston.info("#handle#gameuser search error");
              utils.showErr(err);
            }
            cb(null,results);
          });
        },
        function(uids,cb){
          keystone.list("PayingInfo").model.find({timeStamp:{$gte:firstDate,$lt:ltv7Date},uid:{$in:uids}}).select("money").exec(function(err,payinginfos){
            var money = 0;
            _.each(payinginfos,function(paying){
              money+=parseFloat(paying.money);
            });
            var str = "date:"+(new Date(firstDate*1000)).format()+",LTV:" + money*0.7/uids.length+",money:"+money +",payinginfos.length:"+payinginfos.length+",uids.length:"+uids.length;
            winston.info(str);
            res.send(str);
            cb();
          });
        },
        ],function(){

      });
   });  

   view.on("post",{actions:"monitoring"},function(next){
      var showMem = function() {
           var mem = process.memoryUsage();
           var format = function(bytes) {
                return (bytes/1024/1024).toFixed(2)+'MB';
           };
      }
      if(locals.onMonitoring)
      {
        //close
        keystone.set("onMonitoring",false);
        var thejob = keystone.get("monitoring");
        if(typeof thejob.stop == "function")
        {
          thejob.stop();
        }
      }
      else
      {
        //begin
        var CronJob = require('cron').CronJob;
         var stamanager =  require("../../manager/statistical");
         var s = new stamanager();
        var thejob = new CronJob('* * * * * *', function(){
              //day

              var format = function(bytes) {
                    return (bytes/1024/1024).toFixed(2);
              };
              var spawn = require('child_process').spawn;
              var prc = spawn('./shellTemplate/testPressure.sh');
              prc.stdout.setEncoding('utf8');

              prc.stdout.on('data', function (data) {
                  //console.log("mongodb rss:%s",data);

                  var mem = process.memoryUsage();
                  //console.log("nodejs:%s,mongodb:%s",format(mem.rss),data);
                  s.getMem(data,format(mem.rss),function(){});
               });
          }, function () {
            // This function is executed when the job stops
            console.log(new Date()+" stoped! cron---------thejob----------%s");
          },
          true /* Start the job right now */,
          "UTC" /* Time zone of this job. */
        );
        keystone.set("monitoring",thejob);
        keystone.set("onMonitoring",Date.now());
      }
      next();
   });

   if(locals.hasPermission)
    view.render('handleSomeThing');
  else
    view.render('summary');
};

