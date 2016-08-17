var keystone = require('keystone');
var async    = require('async');
var _        = require("underscore");
var manager = require("../../manager/manager");
var _config  = keystone.get("_config");
var winston = require("winston");
var utils     = require("../../manager/util/utils");
require("../../manager/util/datetime");
var gameconfigExchange = require("../../manager/GameConfigExchange");
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
       var unlossuids=[];
       mager.getFirstAndLastDate(dateObj,"daily",Date.now()/1000 - 86400);
       //console.log("dateObj:%s",JSON.stringify(dateObj));
       locals.section = 'userStepsTrack';
       locals.datas = {};
       locals.timezone = _config.timezone||0;
       locals.list = [];
       locals.userCount = 0;
       locals.logonCount = 0;
       locals.paidCount = 0;
       locals.tutorialnames=_config.userStepsTrackValue;
       locals.formatData = req.body || {};
       locals.filters = {
          firstDate:req.query.firstDate || getStrByDate(dateObj.firstDate),
          lastDate:req.query.lastDate || getStrByDate(dateObj.lastDate),
          stype: req.query.stype || "daily",
          country:req.query.country || "",
          onlypaid:req.query.onlypaid || false,
          region:req.query.region || "0",
          onlyloss:req.query.onlyloss || false,
          rate:req.query.rate || "retention"
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
       var getLoss = function(lastDate,next){
          async.waterfall([
            function(cb){
              var first = mager.showDailyBegin(lastDate);
              var last = mager.showDailyEnd(lastDate);
              keystone.list("InnLog").model.find({logType:{$in:["LogOn","LogOut"]},timeStamp:{$gte:first,$lt:last}}).distinct("uid").exec(function(err,uids){
                unlossuids = uids;
                cb();
              });
            }
            ],function(err){
              next();
          });
       }
       var getSqlOfSelectGameUser = function(firstDate,lastDate){
              var parmObj = {};
              if(countrytype)
                parmObj={country:countrytype,registerdate:{$gte:firstDate,$lt:lastDate}};
              else
                parmObj={registerdate:{$gte:firstDate,$lt:lastDate}};
              if(locals.filters["onlypaid"])
                  parmObj.firstpaydate={$lt:lastDate};
              if(locals.filters["region"]+""!="0")
                  parmObj.region={$in:utils.strArr2intArr(locals.filters["region"].split(","))};        
              return parmObj;
       }
       var getData = function(firstDate,lastDate,callback){
       // console.log("countrytype:%s",JSON.stringify(countrytype));
          async.waterfall([
            function(cb){
              var parmObj ={};
              //临时添加，这里是因为gameuser不是全部都是及时获取数据导致不能很好处理新用户和成功登录用户数量
              var now = new Date()/1000;
              var parmdate= mager.showDailyBegin(now);
                  parmObj = getSqlOfSelectGameUser(firstDate,lastDate);
              if(locals.filters["onlyloss"])
                parmObj.uid={$nin:unlossuids};

                winston.debug("userStepsTrack parmObj:%s",JSON.stringify(parmObj));
                keystone.list("GameUser").model.find(parmObj).exec(function(err,results){
                  var count=0;
                  if(results&&results.length)
                    count = results.length;
                  else
                    count = 0;
                  locals.logonCount = 0;
                  _.each(results,function(user){
                    if(user.firstpaydate&&user.firstpaydate>0)
                      locals.paidCount++;
                  });
                    cb(null,count,results);                 
                  });
            },
            function(usercount,users,cb){
              //console.log("abc:%s",JSON.stringify(uids));
              locals.userCount = usercount;

              var datas={},list=[];//list是表格数据，datas是第一张图表数据
              var keys = _config.userStepsTrackKey;
              winston.debug("the keys:%s",JSON.stringify(keys));
              _.each(keys,function(parm,index){
                   var tutorialname = _config.userStepsTrackValue[index];
                   var p = {tutorialID:parm,tutorialName:tutorialname,finishCount:0,conversion:0,trend:{}};
                  list.push(p);
                  datas[parm] = 0;
              });
              var k=0;
              _.each(users,function(user){
                if(!user.tutorials)
                  return;
                var tutorials = user.tutorials;
                for(var i=0;i<tutorials.length;i++)
                {
                  var tutorial = tutorials[i];
                  //winston.debug("userstepsTrak,firstDate:%d,lastDate:%d,timeStamp:%d",firstDate,lastDate,tutorial.timeStamp);
                  datas[tutorial.tutorialId]++;
                  var line_list=_.find(list,function(parm){return parm.tutorialID==tutorial.tutorialId});
                  if(line_list==undefined)
                  {
                    //winston.info("page userStepsTrack err,tutorial:%s,line_list:%s",JSON.stringify(tutorial),JSON.stringify(list));
                    continue;
                  }
                  else
                    line_list.finishCount++;
                }
              });

              var perFinishCount = usercount;
              _.each(list,function(parm){
                var keysWithoutSort =_.keys( _config.userStepsTrackWithoutSort);
                if(usercount==0||_.contains(keysWithoutSort,parm.tutorialID)){
                  parm.conversion = "";
                  parm.conversionPer = "";
                }
                else{
                  parm.conversionPer = (parseFloat(parm.finishCount)/parseFloat(perFinishCount)*100).toFixed(2);
                  parm.conversion = (parseFloat(parm.finishCount)/parseFloat(usercount)*100).toFixed(2);
                }
                  perFinishCount = parm.finishCount;
              });
              cb(null,datas,list);
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

          var theDate = parseInt(firstDate);
          while(theDate<=lastDate)
          {
            var p = {firstDate:mager.showDailyBegin(theDate),lastDate:mager.showDailyEnd(theDate)};
            parm.push(p);
            theDate = theDate + 86400;
            console.log(JSON.stringify(p));
          }

          var getConversion = function(users,i,firstDate,lastDate,callback){
           // console.log("uid:%s",JSON.stringify(uids));
                var parmObj ={};
                _.each(users,function(user){
                    if(countrytype)
                    {
                      if(user.country!=countrytype)
                        return;
                    }
                   var tutorial =  _.find(user.tutorials,function(tutorial){return tutorial.tutorialId == list.tutorialID});
                   if(!tutorial)
                   {
                    return;
                   }
                  if(!list.trend[firstDate])
                      list.trend[firstDate] = 0;
                   list.trend[firstDate]++;
                   
                });
                if(i>0){
                  --i;
                  getConversion(users,i,parm[i].firstDate,parm[i].lastDate,callback);            
                }
                else{
                  callback();
                }                

          }
          async.waterfall([
            function(thenext){

              var sql = {};
              if(locals.filters["onlypaid"])
                sql.firstpaydate = {$lt:lastDate};
              if(locals.filters["region"]!="0")
                sql.region = {$in:locals.filters["region"].split(",")};
              sql.registerdate = {$gte:firstDate,$lt:lastDate};
              keystone.list("GameUser").model.find(sql).exec(function(err,results){
                
                thenext(null,results);
              });
            },
            function(users,thenext)
            {
             //winston.info( JSON.stringify(parm));

              getConversion(users,parm.length-1, parm[parm.length-1].firstDate,parm[parm.length-1].lastDate,thenext);            
            }
            ],function(){
              cb();
          });
       }
       // online
       view.on('get', function(next) {
          //console.log("locals.filters:%s",JSON.stringify(locals.filters));
          var doIt=function()
          {
            getData(firstDate,lastDate,function(err,datas){
              locals.list = {total:datas.list.length,rows:datas.list} ;
              var keys = _.keys(datas.data);
              var values = _.values(datas.data);
              var keys2=[],values2=[];
              _.each(_config.userStepsTrackKey,function(parm,index){
                for(var i=0;i<keys.length;i++){
                  if(keys[i]==parm){
                        keys2.push(_config.userStepsTrackValue[index]);
                        values2.push(values[i]);
                        continue;
                    }
                }
              });
              locals.datas ={key:keys2,value:values2};
              next();
            });
          }

          var firstDate = getDateByString(locals.filters.firstDate);
          var lastDate = getDateByString(locals.filters.lastDate);
          if(locals.filters.rate == "retention")
          {
            if(locals.filters.onlyloss)
            {
              getLoss(lastDate,function(){
                doIt();
              });
            }
            else
            {
              doIt();
            }
          }
          else if(locals.filters.rate == "levelrate")
          {
            getData_levelrate(firstDate,lastDate,function(){
              next();
            });
          }
          else if(locals.filters.rate == "tutorialrate")
          {
            getData_tutorialrate(firstDate,lastDate,function(){
              next();
            })
          }
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
            datas.title= "TutorialID"+list.tutorialID + "(不显示关卡数据)";
            for(var i=0;i<datas.key.length;i++){
              datas.key[i] = new Date(parseInt(datas.key[i])*1000).format("MM/dd");
            }
            res.send(datas);
          });
        });
        var hasTutorial = function(user,tutorialid)
        {
          var tutorials = user.tutorials;
          var t = _.find(tutorials,function(tutorial){
            return tutorial.tutorialId == tutorialid;
          });
          if(t&&t.tutorialId)
            return true;
          else 
            return false;
        }
        var tutoirlas_e = ["12000140","12000141","12000142","12000400","12000410","12000420","12000221","12000222"];
        var getLastTutorial = function(user)
        {
          var tutorials = user.tutorials;
          var lastTimeStamp = 0;
          var lastkey = 0;
          _.each(tutorials,function(tutorial){
            if(tutorial.timeStamp>lastTimeStamp&&_.contains(_config.userStepsTrackKey,(tutorial.tutorialId+""))&&!_.contains(tutoirlas_e,(tutorial.tutorialId+"")))
            {
              lastTimeStamp = tutorial.timeStamp;
              lastkey = tutorial.tutorialId;
            }
          });
          return lastkey;
        }
        var getTypeNameByIdOfStepTrack = function(typeid)
        {
          for(var i=0;i<_config.userStepsTrackKey.length;i++)
          {
            if(_config.userStepsTrackKey[i]==typeid)
            {
              return _config.userStepsTrackValue[i];
              break;
            }
          }
        }
       // var getData_questrate = function(firstDate,lastDate,callback)
       // {
       //  var self = this;
       //  async.waterfall([
       //    function(cb){
       //        var gc = new gameconfigExchange();
       //        gc.getHistoryExchange({table:"quests",typeid:"typeId",value:"title",firstDate:firstDate},function(data){
       //          self.quests = data;
       //          cb();
       //        });


       //    }
       //    ],function(err){

       //  });
       //  callback();
       // }
       var getData_tutorialrate = function(firstDate,lastDate,callback)
       {
          var self = this;
          var date_now = (new Date())/1000;
          var lossuser_date = date_now - 86400*3;
          var sql = getSqlOfSelectGameUser(firstDate,lastDate);
          var content = "_id uid registerdate lastlogtime tutorials";

          keystone.list("GameUser").model.find(sql).select(content).exec(function(err,users){
                var tutorialrate_data = {};
                var baseCount = 0;
                var surviced = 0;
                var first = {typeId:"00000000",typeName:"Null Tutorial",loss:0,count:0,survive:0,promotion:0};
                var test1 = [];
                var test2 = [];
                var test3 = [];
                var test4 = [];
                _.each(users,function(user){
                  var lasttutorial = getLastTutorial(user);
                  first.count++;
                  test1.push(user.uid);
                  if(!user.tutorials||user.tutorials.length==0)
                    {
                      first.loss++;
                      return;
                    }
                  var thisonetutorials = user.tutorials;

                  _.each(thisonetutorials,function(tutorial){
                    if(!tutorialrate_data[tutorial.tutorialId+""])
                      tutorialrate_data[tutorial.tutorialId+""] = {typeId:tutorial.tutorialId,typeName:getTypeNameByIdOfStepTrack(tutorial.tutorialId),loss:0,count:0,survive:0,promotion:0};
                    
                    tutorialrate_data[tutorial.tutorialId+""].count++;
                    if(tutorial.tutorialId=="12010000")
                      test2.push(user.uid);
                    if(tutorial.tutorialId=="12000000")
                      test4.push(user.uid);
                    if(lasttutorial==tutorial.tutorialId&&user.lastlogtime<lossuser_date)
                    {
                      tutorialrate_data[tutorial.tutorialId+""].loss++;
                      if(tutorial.tutorialId=="12010000")
                        test3.push(user.uid);
                    }
                  });
                });
                first.surviced_count = first.count;
                var test_result = [];
                _.each(test1,function(uid){
                  if(!_.contains(test2,uid))
                    test_result.push(uid);
                });
                var test_result2 = [];
                _.each(test_result,function(uid){
                  if(!_.contains(test3,uid))
                    test_result2.push(uid);
                });
                var test_result3 = [];
                _.each(test2,function(uid){
                  if(!_.contains(test4,uid))
                    test_result3.push(uid);
                })
                winston.info("test1 > test2 's user:%s",test_result.join(","));
                winston.info("test_result > test3 's user:%s,test3:%s",test_result2.join(","),test3.join(","));
                winston.info("test_result3:%s",test_result3.join(","));
                var baseCount = 0;
                var surviced = 0;
                var result_data=[];
                baseCount = first.count;
                surviced = baseCount - first.loss;
                first.survive = (surviced / baseCount * 100).toFixed(2) + "%";
                first.promotion = "100%";
                result_data.push(first);
                _.each(_config.userStepsTrackKey,function(key,index){

                  if(!tutorialrate_data[key+""])
                  {
                    tutorialrate_data[key+""] = {typeId:key,typeName:_config.userStepsTrackValue[index],loss:0,count:0,survive:0,promotion:0};
                    
                  }

                  surviced = surviced - tutorialrate_data[key+""].loss;
                  tutorialrate_data[key+""].surviced_count = _.clone(surviced);
                  tutorialrate_data[key+""].survive = (surviced / baseCount * 100).toFixed(2) + "%";
                  tutorialrate_data[key+""].promotion = (tutorialrate_data[key+""].count / baseCount * 100).toFixed(2) + "%";
                  result_data.push(tutorialrate_data[key+""]);
                });

                
                 locals.list = {rows:result_data,total:result_data.length};
                callback();
          });
       }
       var getData_levelrate = function(firstDate,lastDate,callback){
        var self = this;
        var date_now = (new Date())/1000;
        var lossuser_date = date_now - 86400*3;
        var sql = getSqlOfSelectGameUser(firstDate,lastDate);
        var content  = "_id uid registerdate lastlogtime innExp";
        
        keystone.list("GameUser").model.find(sql).select(content).exec(function(err,users){
          // _.each(users,function(user){
          //   user = _.pick(user,"uid","_id","region","country","registerdate","lastQuest","timezone","innExp","lastlogtime");
          // });
          async.waterfall([
            function(cb){
              var gc = new gameconfigExchange();
              gc.getHistoryExchange({table:"tavernLevels",typeid:"levelId",value:"maxExp",firstDate:firstDate},function(data){
                self.innLevelMaxExps = data;
                cb();
              });
            },
            function(cb){
              var levelrate_data = [];
              _.each(users,function(user){
                user.level = utils.GetLevels(user.innExp,self.innLevelMaxExps);
                if(parseInt(user.level)>60)
                {
                  console.log("user.uid:%s user.level:%s",user.uid,user.level);
                }
              });
              var baseCount = 0;
              var surviced = 0;
              _.each(self.innLevelMaxExps,function(levelData,levelKey){
                
                var thisone = {typeId:levelKey,typeName:levelKey,innExp:levelData,loss:0,count:0,survive:0,promotion:0};
                _.each(users,function(user){
                  
                  if(parseInt(user.level) >= parseInt(thisone.typeId))
                  { 
                    thisone.count++;
                    if(user.level==thisone.typeId && user.lastlogtime<lossuser_date)
                      thisone.loss++;
                  }
                });
                if(levelKey=="1")
                {
                  baseCount = thisone.count;
                  surviced = baseCount - thisone.loss;
                  
                }
                else
                {
                  surviced = surviced - thisone.loss;
                  
                }
                thisone.survive = (surviced / baseCount * 100).toFixed(2) + "%";
                thisone.promotion = (thisone.count / baseCount * 100).toFixed(2) + "%";
                levelrate_data.push(thisone);
              });
              
              locals.list = {rows:levelrate_data,total:levelrate_data.length};
              cb();
            }
            ],function(){

              callback();
          });
        });
       }
       view.render('userStepsTrack');   
};

