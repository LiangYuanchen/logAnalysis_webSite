var keystone = require('keystone');
  async = require('async');
  var _config  = keystone.get("_config");
exports = module.exports = function(req, res) {
 // console.log("aaa");

   var view = new keystone.View(req, res),
   locals = res.locals;
   locals.title=_config.title;
   // locals.section is used to set the currently selected
   // item in the header navigation.
   locals.section = 'gameError';
   locals.formatData = req.body || {};
   locals.timezone = _config.timezone||0;
   locals.filters = {
      firstDate: req.query.firstDate,
      lastDate:  req.query.lastDate,
      num:       req.query.num||100,
      page:req.query.page || 1,
      pagesize:req.query.rows || 10,
      errorType:req.query.errorType,
      uid:       req.query.uid
   };
   locals.msgErr={total:0,rows:[]};
   locals.handlerErr={total:0,rows:[]};

   locals.xAxis =[];
   locals.yAxis = [];
   locals.datas = {};
   // online
  var permission = require("../../manager/permission");
  // Set locals
  var per = new permission();
  locals.hasPermission = false;
  if(req.user&&req.user.code)
    locals.hasPermission = per.HasPermisson("summary",req.user.code);
   view.on('post',function(next){
        var action = req.query.action;
        if (action=="handleErr") {
          handlerErrHandler(next);
        };
        if(action=="msgErr"){
          msgHandler(next);
        }
    });
    var handlerErrHandler = function(next){ 
    var parm = locals.formatData;
    var start =(parm.page-1)*parm.rows;
    var sort = parm.sort;
    var order = parm.order;

     var q = keystone.list("InnLog").model.find().where("logType","HandlerErr");
      if (!isNaN( parm.firstDate)) {
      q = q.where("timeStamp").gte(parm.firstDate);
    }
    if (!isNaN(parm.lastDate)) {
      q = q.where("timeStamp").lt(parm.lastDate);
    };
    if(parm.uid&&parm.uid.length>0)
      q = q.where("uid",eval('/'+ parm.uid +"/i"));
    //console.log(JSON.stringify(parm));
    if(parm.errorType){
      q = q.where("category",parseInt(parm.errorType));
    }

     if (sort) {
      if (order=="asc") {
        q = q.sort(sort);
      }else{
        q = q.sort("-"+sort);
      }
    }else{
      q = q.sort({timeStamp:-1});
    }
    //console.log(q);

     q = q.skip(start).limit(parm.rows).exec(function(err,datas){
      //console.log("q:%s,datas:%s",JSON.stringify(q),JSON.stringify(datas));
      if(err){
        console.error(err);
      };
     // console.log("b");
      locals.datas.rows=datas;
       // keystone.list("InnLog").model.find().where("logType","Register").exec(getRegister);
      if (datas.length>0) {
        var q2 = keystone.list("InnLog").model.find().where("logType","HandlerErr");
        if (!isNaN( parm.firstDate)) {
        q2 = q2.where("timeStamp").gte(parm.firstDate);
        }
        if (!isNaN(parm.lastDate)) {
          q2 = q2.where("timeStamp").lt(parm.lastDate);
        };
      if(parm.uid&&parm.uid.length>0)
        q2 = q2.where("uid",eval('/'+ parm.uid +"/i"));        
        if(parm.errorType){
          q2 = q2.where("category",parseInt( parm.errorType));
        }
        q2.count(function(err,count){
        locals.datas.total=count;
        for(var i=0;i<locals.datas.rows.length;i++){
          var data = locals.datas.rows[i];
          if(data.category==0)
            data.category = (data.message.split(","))[0];
          if(data.category==0)
            data.category = (data.message.split(","))[1];
        }
        res.send(locals.datas);
      });

      }else
      {
          locals.datas.total = 0;
          res.send(locals.datas);
      }
    });   
   }
   var msgHandler = function(next){ 
    var parm = locals.formatData;
    var start =(parm.page-1)*parm.rows;
    var sort = parm.sort;
    var order = parm.order;
    var q = keystone.list("InnLog").model.find().where("logType","MgrErr");
    if (!isNaN( parm.firstDate)) {
      q = q.where("timeStamp").gte(parm.firstDate);
    }
    if (!isNaN(parm.lastDate)) {
      q = q.where("timeStamp").lt(parm.lastDate);
    };
     if (sort) {
      if (order=="asc") {
        q = q.sort(sort);
      }else{
        q = q.sort("-"+sort);
      }
    }else{
      q = q.sort({timeStamp:-1});
    }
    //console.log(q);
     q = q.skip(start).limit(parm.rows).exec(function(err,datas){
      if(err){
        console.error(err);
      };
      locals.datas.rows=datas;
       // keystone.list("InnLog").model.find().where("logType","Register").exec(getRegister);
      if (datas.length>0) {
        var q2 = keystone.list("InnLog").model.find().where("logType","MgrErr");
        if (!isNaN( parm.firstDate)) {
          q2 = q2.where("timeStamp").gte(parm.firstDate);
        }
        if (!isNaN(parm.lastDate)) {
          q2 = q2.where("timeStamp").lt(parm.lastDate);
        };
        q2.count(function(err,count){
        locals.datas.total=count;
        res.send(locals.datas);
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
        locals.datas.total = 0;
        res.send(locals.datas);
      }
    });   
   };
   //console.log("ddd"); 
   view.render('gameError');
};
