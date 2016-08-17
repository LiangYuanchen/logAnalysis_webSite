var keystone = require('keystone');
var async    = require('async');
var _        = require("underscore");
var manager = require("../../manager/manager");
var _config  = keystone.get("_config");
require("../../manager/util/datetime");
var getDateByString = function(str)
{
  return  new Date(str)/1000;
}
var getStrByDate = function(date){
  return new Date(date*1000).format("MM/dd/yyyy hh:mm:ss");
}
var changeTwoDecimal = function (floatvar)
{
var f_x = parseFloat(floatvar);
if (isNaN(f_x))
{
return 0;
}
var f_x = Math.round(floatvar*100)/100;
return f_x;
}
exports = module.exports = function(req, res) {
       var view = new keystone.View(req, res),
       locals = res.locals;
       locals.title=_config.title;
       // locals.section is used to set the currently selected
       // item in the header navigation.
       var mager = new manager();
       var dateObj = {};
       mager.getFirstAndLastDate(dateObj,"daily",Date.now()/1000);
       //console.log("dateObj:%s",JSON.stringify(dateObj));
       locals.section = 'tutorial';
       locals.datas = {};
       locals.list = [];
       locals.userCount = 0;
       locals.timezone = _config.timezone||0;
       locals.tutorialnames=_config.tutorialnames;
       locals.formatData = req.body || {};
       locals.filters = {
          firstDate:req.query.firstDate || getStrByDate(dateObj.firstDate),
          lastDate:req.query.lastDate || getStrByDate(dateObj.lastDate),
          stype: req.query.stype || "daily",
          country:req.query.country || ""
        };
        var countrytype;
      var setCountrytype=function(thecountry)
      {
        countrytype=thecountry;
        if(!countrytype)
        {
          countrytype=false;
        }
        else if(countrytype=="Not_CN")
        {
          countrytype={$ne:"CN"};
        }
      }
       setCountrytype(locals.filters.country); 

      var permission = require("../../manager/permission");
           // Set locals
           var per = new permission();
           locals.hasPermission = false;
           if(req.user&&req.user.code)
              locals.hasPermission = per.HasPermisson("summary",req.user.code);
       var getData = function(firstDate,lastDate,callback){
        console.log("countrytype:%s",JSON.stringify(countrytype));
          async.waterfall([
            function(cb){
              var parmObj ={};
              if(countrytype)
                parmObj={logType:"Register",country:countrytype};
              else
                parmObj={logType:"Register"};
                keystone.list("InnLog").model.find(parmObj).where("timeStamp").lt(lastDate).where("timeStamp").gte(firstDate).distinct('uid').exec(function(err,results){
                  //console.log("statistical Result:%s",results);
                    var count = results.length;
                    if(count<=0)
                      cb(null,0,[]);
                    else
                      cb(null,count,results);                 
                  });
            },
            function(usercount,uids,cb){
              //console.log("abc:%s",JSON.stringify(uids));
              locals.userCount = usercount;
              var parmObj ={};
              if(countrytype)
                parmObj={uid:{$in:uids},country:countrytype,logType:"Tutorial",message:/^f/};
              else
                parmObj={uid:{$in:uids},logType:"Tutorial",message:/^f/};
              var q = keystone.list("InnLog").model.find(parmObj).where("timeStamp").lt(lastDate).where("timeStamp").gte(firstDate).exec(function(err,results){
               // console.log("results:%s,",JSON.stringify(results));
              if(err) console.log(new Date() + "err on getData at tutorial.js");
              var datas={},list=[];
              _.each(_config.tutorialids,function(parm,index){
                   var tutorialname = _config.tutorialnames[index];
                   var p = {tutorialID:parm,tutorialName:tutorialname,finishCount:0,conversion:0,trend:{}};
                  list.push(p);
                  datas[parm] = 0;
              });
              _.each(results,function(parm){
                  datas[parm.category] ++;
  
                    for(var i=0;i<list.length;i++){
                      if(list[i].tutorialID == parm.category)
                      {
                          list[i].finishCount++;
                          break;
                      }
                    }
                  
              });
              var perFinishCount = usercount;
              _.each(list,function(parm){
                if(usercount==0){
                  parm.conversion = 0;
                  parm.conversionPer = 0;
                }
                else{
                  parm.conversionPer = (parseFloat(parm.finishCount)/parseFloat(perFinishCount)*100).toFixed(2);
                  parm.conversion = (parseFloat(parm.finishCount)/parseFloat(usercount)*100).toFixed(2);
                }
                  perFinishCount = parm.finishCount;
              });
              cb(null,datas,list);
            });
            }
            ],function(err,dataa,list){
              var datas = {};
              datas.data = dataa;
              datas.list = list;
              callback(err,datas);
          });
       }
       var getTrend = function(list,stype,firstDate,lastDate,cb){
        var parm = [];
          switch(stype){
            case "daily":
            for(var i =0;i<8;i++){
              var p = {firstDate:firstDate-i*86400,lastDate:lastDate-i*86400};
              parm.push(p);
            }
            break;
            case "weekly":
            for(var i =0;i<8;i++){
              var p = {firstDate:firstDate-i*86400*7,lastDate:lastDate-i*86400*7};
              parm.push(p);
            }
            break;
            case "monthly":
            for(var i =0;i<8;i++){
              var p = {firstDate:firstDate-i*86400*30,lastDate:lastDate-i*86400*30};
              parm.push(p);
            }
            break;
            default:break;
          }

          var getConversion = function(i,firstDate,lastDate,callback){
              var parmObj ={};
              if(countrytype)
                parmObj={logType:"Register",country:countrytype};
              else
                parmObj={logType:"Register"};
            keystone.list("InnLog").model.find(parmObj).where("timeStamp").lt(lastDate).where("timeStamp").gte(firstDate).distinct("uid").exec(function(err,result){
              var count = result.length;
              var uids = result;
              if(count>0){
                var parmObj ={};
              if(countrytype)
                parmObj={uid:{$in:uids},country:countrytype,logType:"Tutorial",message:/^f/};
              else
                parmObj={uid:{$in:uids},logType:"Tutorial",message:/^f/};
              var q = keystone.list("InnLog").model.find(parmObj).where("timeStamp").lt(lastDate).where("timeStamp").gte(firstDate).where("category",list.tutorialID).count(function(err,tuoCount){
               
                list.trend[firstDate] = tuoCount/count*100;
                console.log("list.trend:%s",JSON.stringify(list));
                if(i>0){
                  --i;
                  getConversion(i,parm[i].firstDate,parm[i].lastDate,callback);            
                }
                else{
                  callback();
                }

              });
            }
            else {
                if(i>0){
                  --i;
                  getConversion(i,parm[i].firstDate,parm[i].lastDate,callback);            
                }
                else{
                  callback();
                }             
            }
            });
          }
          getConversion(7,parm[7].firstDate,parm[7].lastDate,function(){
            cb();
          });
       }
       // online
       view.on('get', function(next) {
          console.log("locals.filters:%s",JSON.stringify(locals.filters));
          var firstDate = getDateByString(locals.filters.firstDate);
          var lastDate = getDateByString(locals.filters.lastDate);
          getData(firstDate,lastDate,function(err,datas){
            locals.list = {total:datas.list.length,rows:datas.list} ;
            var keys = _.keys(datas.data);
            var values = _.values(datas.data);
            var keys2=[],values2=[];
            _.each(_config.tutorialids,function(parm,index){
              for(var i=0;i<keys.length;i++){
                if(keys[i]==parm){
                      keys2.push(_config.tutorialnames[index]);
                      values2.push(values[i]);
                      continue;
                  }
              }
            });
            locals.datas ={key:keys2,value:values2};
            next();
          });
       });  
       view.on("post",function(next){
          var list = req.body.list;
          console.log("post:%s",JSON.stringify(req.body));
          list.trend = {};
          setCountrytype(req.body.country);
          getTrend(list,req.body.stype,parseInt(req.body.firstDate),parseInt(req.body.lastDate),function(){
            var datas ={};
            datas.key = _.keys(list.trend);
            datas.value = _.values(list.trend);
            datas.title= "TutorialID"+list.tutorialID;
            for(var i=0;i<datas.key.length;i++){
              datas.key[i] = new Date(parseInt(datas.key[i])*1000).format("MM/dd");
            }
            res.send(datas);
          });
              });   
       view.render('tutorial');   
};

