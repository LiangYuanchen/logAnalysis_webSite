var keystone = require('keystone'),
	Summary = keystone.list('Summary');
var _config  = keystone.get("_config");
var util     = require("../../manager/util/utils");
exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	locals.title=_config.title;
	// Set locals
	locals.section = 'summary';
	locals.formData = req.body || {};
	locals.validationErrors = {};
  locals.country="";
  locals.timezone = _config.timezone||0;
	locals.enquirySubmitted = false;
   locals.filters = {
   		page:req.query.page || 1,
   		pagesize:req.query.rows || 10,
      country:req.query.country || "",
      region:req.query.region || "0"
   };
  locals.onSummaryRetention = keystone.get("onSummaryRetention");
   locals.datas={total:0,rows:[]};
   
	// On POST requests, add the Enquiry item to the database
	view.on('post', function(next) {
		var parm = locals.formData;
	  var start =(parm.page-1)*parm.rows;
   	var sort = parm.sort;
   	var order = parm.order;
    var q = Summary.model.find();
    var regionsArr =parm.region;
    if(parm.country&&parm.country.length>0)
        q=q.where("country",parm.country);
    else
        q=q.where("country",{$exists:false});
    if(!parm.region||parm.region+""=="0")
       q=q.where("region",{$exists:false});
    else if(regionsArr&&regionsArr+""=="1")
      q=q.or([{region:regionsArr},{firstDate:{$lt:1439251200}}]);//1439251200日期之前没有分区
    else
       q=q.where("region",regionsArr);
     
    if (sort) {
     	if (order=="desc") {
     		q = q.sort("-"+sort);
     	}else{
     		q = q.sort(sort);
     	}
    }else{
    	q = q.sort({firstDate:-1});
    }
    console.log(q._conditions);

     q = q.skip(start).limit(parm.rows).exec(function(err,datas){
     	if(err){
     		console.error(err);
     	};
     	locals.datas.rows=datas;

     	if (datas.length>0) {
        var q = Summary.model.find();
        var regionsArr =parm.region;
        if(parm.country&&parm.country.length>0)
            q=q.where("country",parm.country);
        else
            q=q.where("country",{$exists:false});
        if(!parm.region||parm.region+""=="0")
           q=q.where("region",{$exists:false});
        else if(regionsArr&&regionsArr+""=="1")
          q=q.or([{region:regionsArr},{firstDate:{$lt:1439251200}}]);//1439251200日期之前没有分区
        else
           q=q.where("region",regionsArr);

     		q.count(function(err,count){
 				locals.datas.total=count;
 				res.send(locals.datas);
 			});
     	}
      else
      {
        res.send({});
      }

    });  			
	});
	view.render('summary');
	
};
