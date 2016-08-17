var keystone = require('keystone');
  async = require('async');
  _ = require("underscore");
  var winston = require("winston");
  var _config  = keystone.get("_config");
  var syncManager = require("../../manager/SYNCGameUserManager");
  var gameconfigExchange = require("../../manager/GameConfigExchange");
  gc = new gameconfigExchange();
  sy = new syncManager();

exports = module.exports = function(req, res) {
 // console.log("aaa");
   var view = new keystone.View(req, res),
   locals = res.locals;
   locals.title=_config.title;
   // locals.section is used to set the currently selected
   // item in the header navigation.
   locals.section = 'gameUser';
   locals.formatData = req.body || {};
   locals.timezone = _config.timezone||0;
   locals.filters = {
   		page:req.query.page || 1,
   		pagesize:req.query.rows || 10,
      tavernName:req.query.tavernName || "",
      country:req.query.country || "",
      repeated:req.query.repeated || false,
      uid:req.query.uid || "",
      username:req.query.username || "",
      usernames:req.query.usernames
   };
   locals.userlist={total:0,rows:[]};
   locals.pages = {page:1,pagesize:10,total:0};
   locals.datas={total:0,rows:[]};
   locals.mapDatas=[];
   usernames=[];
   var permission = require("../../manager/permission");
   var uids=[];
	// Set locals
	var per = new permission();
	locals.hasPermission = false;
	if(req.user&&req.user.code)
		locals.hasPermission = per.HasPermisson("summary",req.user.code);
  
  view.on('get',function(next){
    var getMapDatas = function(err,results){
      if(err)
      {
          next();
          return;
      }
      _.each(results,function(parm){
        var thecountObj = JSON.parse(parm.countObj);
        var thekeys=_.keys(thecountObj);
        _.each(thekeys,function(key){
          if(locals.mapDatas[key])
            locals.mapDatas[key]+=thecountObj[key];
          else
            locals.mapDatas[key]=thecountObj[key];
        })
      });
       // locals.mapDatas =JSON.parse(results[0].countObj);
      if(locals.mapDatas)
      {
        var results=[];
        for(proto in locals.mapDatas)
        {
          var parm = {key:"",value:0};
          parm.key = proto;
          parm.value=locals.mapDatas[proto];
          results.push(parm);
        }
        locals.mapDatas = results;
      }
      console.log("mapDatas:%s",JSON.stringify(locals.mapDatas));
      next();
    }
    var q = keystone.list("Statistical").model.find({sType:"166"}).sort({logDate:-1}).exec(getMapDatas);
  });

   view.on('post',function(next){ 
   	//console.log("gameUser post method");
   	var parm = locals.formatData;
   	var start =(parm.page-1)*parm.rows;
   	var sort = parm.sort;
   	var order = parm.order;
     var q = keystone.list("GameUser").model;
    var uid = parm.uid;
    // winston.debug("parm is :%s",JSON.stringify(parm));
    var doit = function()
    {
        var sql = {};
        if(parm.tavernName&&parm.tavernName.length>0)
        {   
            sql.tavernName=eval('/'+parm.tavernName+'/i');
        }

        if(parm.username&&parm.username.length>0)
        {
          sql.username = eval('/'+ parm.username +"/i");
        }
        if(parm.usernames&&parm.usernames.length>0)
          sql.username = {$in:parm.usernames.split(",")};
       
        if(usernames.length>0)
          sql = {_id:{$in:usernames}};  
        q = q.find(sql);
        if(parm.country&&parm.country.length>0)
        {
          var arrStr = parm.country.toUpperCase().split(",");
          q = q.where("country").in(arrStr);
        }
        
        if(uid&&uid.length>0)
        {
          q=q.where("uid").in(uid.split(","));
        }

       if (sort) {
        if (order=="desc") {
          q = q.sort("-"+sort);
        }else{
          q = q.sort(sort);
        }
      }else{
        q = q.sort({lastlogtime:-1});
      }
      
      console.log("q:"+ q);
       q = q.skip(start).limit(parm.rows).exec(function(err,datas){
        if(err){
          console.error(err);
        };
        locals.datas.rows=datas || [];
         // keystone.list("InnLog").model.find().where("logType","Register").exec(getRegister);
        if (datas&&datas.length>0) {
          var q2 = keystone.list("GameUser").model;
          var sql2 = {};
          if(parm.tavernName&&parm.tavernName.length>0)
          {   
              sql2.tavernName=eval('/'+parm.tavernName+'/i');
          }

          if(parm.username&&parm.username.length>0)
          {
            sql2.username = eval('/'+ parm.usernames +"/i");
          }
          if(parm.usernames&&parm.usernames.length>0)
            sql2.username = {$in:parm.usernames.split(",")};    
          if(usernames.length>0)
            sql2 = {_id:{$in:usernames}};
          q2 = q2.find(sql2);
          if(parm.country&&parm.country.length>0)
          {
            var arrStr = parm.country.toUpperCase().split(",");

            q2 = q2.where("country").in(arrStr);
          }    
          if(uid&&uid.length>0)
          {
            q2=q2.where("uid").in(uid.split(","));
          }            
          q2.count(function(err,count){
          locals.datas.total=count;
          var refreshDatas = function(){
            var parmsDatas=[];
            _.each(datas,function(data){
               data.level = sy.getInnLevelByExp(data.innExp);
               data = _.pick(data,"gembuytotal","bindAccout","level","timeStamp","uid","username","userRegTime","innExp","gembuy","gemother","gold","power","lastlogtime","registerdate","lastlogdate","firstpaydate","activetime","advCount","lastQuest","lastQuestTypeId","lastHardQuestTypeId","tavernName","country","region","paidtime");
               parmsDatas.push(data);
               //console.log(JSON.stringify(data));
            });
            locals.datas.rows = parmsDatas;
          }
          if(sy.innLevelMaxExps.length==0)
          {
            gc.getHistoryExchange({table:"tavernLevels",typeid:"levelId",value:"maxExp",firstDate:new Date()/1000},function(data){
              sy.innLevelMaxExps = data;
             // winston.debug("innlevelMaxexps:%s",JSON.stringify(self.innLevelMaxExps))
              refreshDatas();
              res.send(locals.datas);
            });
          }
          else
          {
              refreshDatas();
              res.send(locals.datas);
          }
        });

          // initData(0,function(){
          // // console.log(JSON.stringify(locals.datas));
          //  keystone.list("GameUser").model.find().count(function(err,count){
          //    locals.datas.total=count;
          //    res.send(locals.datas);
          //  });
          // });
        }else
        {
          res.send({});
        }
      });   
     }
     
    if(parm.repeated)
    {
       keystone.list("GameUser").model.aggregate([{$group:{_id:"$username",count:{$sum:1}}},{$match:{count:{$gte:2}}}]).exec(
            function(err,results){
              winston.debug("gameUser results:%s",JSON.stringify(results));
              _.each(results,function(p){
                usernames.push(p._id);
              });
              doit();
            });
      // keystone.list("GameUser").model.aggregate([{$group:{_id:"$username"},count:{$sum:1}},{$match:{count:{$gte:2}}}]).exec(function(err,results){
      //   _.each(results,function(p){
      //     usernames.push(results._id);
      //   });
      //   doit();
      // });
    }
    else
    {
      doit();
    }
   });
   view.render('gameUser');
};
