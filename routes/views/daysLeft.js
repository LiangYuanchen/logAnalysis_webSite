var keystone = require('keystone');
var async    = require('async');
var _        = require("underscore");
var _config  = keystone.get("_config");
var daysLeftManager = require("../../manager/DaysLeftManager");
var winston  = require("winston");
var manager  = require("../../manager/manager");
var m        = new manager();
var util    = require("../../manager/util/utils");
require("../../manager/util/datetime");
var getStrByDate = function(date){
  return new Date(date).format("MM/dd/yyyy hh:mm:ss");
}
var getFirstPaying = function(datas,logDate,pageCount,next)
{
  var validateAndInsert = function(data,firstpaydate,callback)
  {
    if(!data)
    {
      callback()
      return;
    }
    if(!data.firstpaid)
    {
      data.firstpaid=[];
    }
    var thefirstpay = m.showDailyBegin(firstpaydate);
    var theindex = parseInt(thefirstpay/86400 - data.logDate/86400);
    
    var validate=function(index){
      if(data.firstpaid[index])
      {
        return;
      }
      else
      {
        if((index-1)<0||data.firstpaid[index-1])
        {
          data.firstpaid.push({date:(data.logDate+index*86400),count:0});
        }
        else{
          validate(index-1);
        }
        validate(index);
      }
    }
    validate(theindex);
    data.firstpaid[theindex].count++;

    callback();
  }
//  var aaa = [];
  var firstDate = logDate;
  var lastDate = logDate+ 86400*pageCount;  
  keystone.list("GameUser").model.find({registerdate:{$gte:firstDate,$lt:lastDate},firstpaydate:{$exists:true}}).select("uid firstpaydate registerdate").exec(function(err,results){
    var i=-1;
    _.each(results,function(user){
          if(!user)
          {
            return;
          }
          if(!user.firstpaydate)
          {
              return;
          }
          if(user.firstpaydate&&user.firstpaydate!=0&&user.registerdate!=0)
          {
            var data = _.find(datas,function(data,index){
              if(data.logDate<=user.registerdate&&(data.logDate+86400)>user.registerdate)
              {
                datasIndex = index;
                return true;
              }
              else
                return false;
            });            
             validateAndInsert(data,user.firstpaydate,function(){});
          }
    });
    next(datas);
  });
}
exports = module.exports = function(req, res) {
       var view = new keystone.View(req, res),
       locals = res.locals;
       locals.title=_config.title;
       // locals.section is used to set the currently selected
       var pageCount = 30;
       // item in the header navigation.
       locals.section = 'daysLeft';
       locals.DataDaysLeft = [];
       locals.DataTop10 = [];
       locals.timezone = _config.timezone||0;
       locals.formatData = req.body || {};
        locals.filters = {
          date:req.query.date || getStrByDate(new Date(Date.now()-86400000*(pageCount-1))),
          country:req.query.country || "",
          registertype:(req.query.registertype)?req.query.registertype+"":"0",
          onlypaid:req.query.onlypaid || false,
          formatstatus:req.query.formatstatus || "0",
          region:req.query.region || "0",
          timezone:req.query.timezone || []
        };
        if(locals.filters.timezone&&locals.filters.timezone.length>0)
          locals.filters.timezone = locals.filters.timezone.split(",");
        locals.onSummaryRetention=keystone.get("onSummaryRetention");
        var permission = require("../../manager/permission");
        // Set locals
        var per = new permission();
        locals.hasPermission = false;
        if(req.user&&req.user.code)
          locals.hasPermission = per.HasPermisson("summary",req.user.code);
       // online
       var canAggregate = function(lists){
          if(!lists)
            return false;
          if(lists.length==1||lists.length==0)
            return false;
          return true;
       }
       var aggregate = function(lists){
        var results = {};
          _.each(lists,function(retention,index){
            if(!results[retention.logDate])
            {
              results[retention.logDate] = [];
            }
            results[retention.logDate].push(retention);
          });
          var aggre = function(arr){
             var result_retention = arr[0];
              //validate lists的logDate是不是都相等
              // _.each(lists,function(daysleft){
              //   if(result.logDate!=daysleft.logDate)
              //   {
              //       winston.error("#routes#daysleft#daysleft show error,logDate:%s,other logDate:%s",result.)
              //   }
              // });
              
              for(var i=1;i<arr.length;i++)
              {
                
                  var parm = arr[i];
                  result_retention.newuserCount += parm.newuserCount;
                  _.each(parm.retentions,function(retention,index){
                    if(isNaN(retention))
                      return;
                     if(!result_retention.retentions[index])
                        result_retention.retentions[index] = 0;
                      result_retention.retentions[index]+=retention;
                  });
              }

              
              var arrs = [];
              _.each(result_retention.retentions,function(retention,index){
                var dayleft = {
                  "dayleft":retention/result_retention.newuserCount*100,
                  "date":result_retention.logDate+index*86400
                };
                arrs.push(dayleft);
              });
              
              result_retention.daysLeft = JSON.stringify(arrs);
              
              return result_retention;           
          }
          var results2=[];
          var values = _.values(results);
          _.each(values,function(retentionArr,index){
            results2.push(aggre(retentionArr));
          });
          return results2;
       }
       view.on('get', function(next) {
       // console.log("update datetime:%s",Date.now());
        var manager =new  daysLeftManager(); 
          var date = null;
            
            date =  new Date(locals.filters.date)/1000;
             
            //console.log("date:%s",date);
            date = manager.showDailyBegin(date);
           //console.log("parmDate:%s,date:%s",locals.filters.date,date);
            var cb = function(err,result){
              if (err) {
                console.error("daysLeft view show error!");
                console.error(err);
              };

              if (result&&result.length>0) {
                if(canAggregate(result))
                {
                  var resultP = [];
                  resultP = aggregate(result);
                  result = resultP;
                }
               // getFirstPaying(result,result[0].logDate,pageCount,function(result){
                  _.each(result,function(r){
                    if(r.firstpaid)
                      r.firstpaids = JSON.stringify(r.firstpaid);
                    winston.debug("firstpaid:%s",JSON.stringify(r.firstpaid));
                  });
                  _.each(result,function(re){
                    re = _.pick(re,"logDate","daysLeft","newuserCount","retentions","sessionCount","firstpaids");
                  })                  
                  if(result[0].daysLeft)
                    locals.DataDaysLeft = eval("("+ result[0].daysLeft+")");
                  else
                    locals.DataDaysLeft = [];

                  locals.DataTop10 = result;
                  //console.log("#page# Dayleft#result:%s",JSON.stringify(result));
                  next();
               // });
              }
              else{
                next();
              }
            }
            var thelast = date + pageCount*86400;
            var sql = {category:0,logDate:{$gte:date,$lte:thelast},registerType:locals.filters.registertype};
            if(locals.filters.country)
              sql.country = locals.filters.country;
            else
              sql.country = {$exists:false};
            if(locals.filters.onlypaid)
              sql.onlypaid = {$exists:true};
            else 
              sql.onlypaid = {$exists:false};
            if(locals.filters.region!="0")
              sql.region = {$in:util.strArr2intArr(locals.filters.region.split(","))};
            else
              sql.region = {$exists:false};
            
            if(locals.filters.timezone&&locals.filters.timezone.length>0)
            {
              if(locals.filters.timezone.indexOf("all")>-1)
              {
                sql.timezone = {$exists:true};
              }
              else
                sql.timezone = {$in:util.strArr2intArr(locals.filters.timezone)};
            }
            else
                 sql.timezone = {$exists:false};
            
            winston.debug("sql.condition:%s",JSON.stringify(sql));
            var q = keystone.list("DaysLeft").model.find(sql).sort({logDate:1}).select().exec(cb);
          //  winston.debug("#page# Dayleft#sql:%s",JSON.stringify(sql));
            // manager.getDaysLeft(date,function(){
            //   //配置相应数据;
            //   locals.DataDaysLeft = manager.DaysLefts;
            // });
       });     
       view.render('daysLeft');   
};

