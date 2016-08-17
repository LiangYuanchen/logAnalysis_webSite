var keystone = require('keystone');
  async = require('async');
  _ = require("underscore");
  var winston = require("winston");
  var _config  = keystone.get("_config");
  var util = require("../../manager/util/utils");
exports = module.exports = function(req, res) {
 // console.log("aaa");
   var view = new keystone.View(req, res),
   locals = res.locals;
   locals.title=_config.title;
   // locals.section is used to set the currently selected
   // item in the header navigation.
   locals.section = 'payinginfo';
   locals.formatData = req.body || {};
   locals.filters = {
   		page:req.query.page || 1,
   		pagesize:req.query.rows || 10,
      uid:req.query.uid || "",
      country:req.query.country || "",
      region:req.query.region || "0"
   };
   locals.userlist={total:0,rows:[]};
   locals.pages = {page:1,pagesize:10,total:0};
   locals.datas={total:0,rows:[]};
   locals.timezone = _config.timezone||0;
   locals.mapDatas=[];
   var permission = require("../../manager/permission");
	// Set locals
	var per = new permission();
	locals.hasPermission = false;
	if(req.user&&req.user.code)
		locals.hasPermission = per.HasPermisson("summary",req.user.code);
  
  view.on('get',function(next){
  	next();
  });

	

   view.on('post',function(next){ 
   	//console.log("gameUser post method");
   	var parm = locals.formatData;
   	var start =(parm.page-1)*parm.rows;
   	var sort = parm.sort;
   	var order = parm.order;
    var region = parm.region;
  
    var q = keystone.list("PayingInfo").model;
    if(parm.uid&&parm.uid.length>0)
      {   
          q= q.find({"uid":parm.uid});
      }
    else
        q=q.find();
    if(region!="0")
      q=q.where("region",{$in:util.strArr2intArr(region)});

      //winston.debug(q);
     if (sort) {
     	if (order=="desc") {
     		q = q.sort("-"+sort);
     	}else{
     		q = q.sort(sort);
     	}
    }else{
    	q = q.sort({timeStamp:-1});
    }
   console.log(q._conditions);
    q = q.populate("gamer innlog");
     q = q.skip(start).limit(parm.rows).exec(function(err,datas){
     	if(err){
     		console.error(err);
     	};
     	locals.datas.rows=datas;

     // _.each(locals.datas.rows,function(data){
        //console.log("data:",JSON.stringify(data));
        //data.registerdate = data.gamer.registerdate;
      //});
     	//console.log(JSON.stringify(datas[0]));
       // keystone.list("InnLog").model.find().where("logType","Register").exec(getRegister);
     	if (datas.length>0) {
        var q2 = keystone.list("PayingInfo").model;
      if(parm.uid&&parm.uid.length>0)
        {   
            q2= q2.find({"uid":parm.uid});
        }
      else
          q2=q2.find();
      if(region!="0")
        q2=q2.where("region",{$in:util.strArr2intArr(region)});                
     		q2.count(function(err,count){
 				locals.datas.total=count;
 				res.send(locals.datas);
 			});

	     	// initData(0,function(){
	     	// //	console.log(JSON.stringify(locals.datas));
	     	// 	keystone.list("GameUser").model.find().count(function(err,count){
	     	// 		locals.datas.total=count;
	     	// 		res.send(locals.datas);
	     	// 	});
	     	// });
     	}else
      {
        res.send({});
      }

    });  	
   });
   view.render('payinginfo');
};
