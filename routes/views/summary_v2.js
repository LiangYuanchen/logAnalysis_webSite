var keystone = require('keystone'),
	Summary = keystone.list('Summary');
var _config  = keystone.get("_config");
var util     = require("../../manager/util/utils");
var manager = require("../../manager/manager");
var summaryManager = require("../../manager/SummaryManager");
var async = require('async');
var _ = require('underscore');
var m = new manager();
var sm = new summaryManager();
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
    console.log("parm:%s",JSON.stringify(parm));
	  var start =(parm.page-1)*parm.rows;
   	var sort = parm.sort;
   	var order = parm.order;
    var q = Summary.model.find();
    var now = new Date();
    var lastDate = m.showDailyBegin(now/1000) - (parm.page-1)*parm.rows*86400 ;
    var firstDate = lastDate - parm.rows*86400;
    console.log("firstDate:%s,lastDate:%s",new Date(firstDate*1000),new Date(lastDate*1000));
    var summaryDates = [];
    var summarydate = firstDate;
    while(summarydate<=lastDate)
    {
      summaryDates.push(summarydate);
      summarydate+=86400;
    }
    async.waterfall([
      function(cb){
        var sql = {islogon:true};
        if(parm.region&&parm.region!="0")
          sql.region = parseInt(parm.region);

        sm.selectSummary(summaryDates,sql,function(err,datas){
          cb(err,datas);
        });
      },
      function(summarys,cb){
        if(!parm.country)
        {
          cb(null,summarys,null);
          return;
        }
        var uids = {};
        _.each(summarys,function(summary){
          _.each(summary,function(parm){
            uids[parm.uid]++;
          }); 
        });
        var uids = _.keys(uids);
        var sql = {uid:{$in:uids}};
        utils.getBsonOfCountry(parm.country,sql);
        debugger;
        keystone.list("Player_Info").model.find(sql).distinct("uid").exec(function(err,results){
          debugger;
          cb(null,summarys,results);
        });
      },
      function(summarys,uids,cb){
        var results = [];
        debugger;
        _.each(summarys,function(summary,index){
          var result_summary = {firstDate:summaryDates[index],Revenue:0,DAU:0,DNU:0,EDAU:0,ARPU:0,ARPPU:0,PaidMan:0,PaidPercentage:0,LTV7:0,LTV15:0,LTV30:0,LTV60:0,LTV90:0};
          if(uids)
          {
            var summary_parm = [];
            _.each(summary,function(parm){
              if(uids.indexOf(parm.uid)<0)
                return;
              summary_parm.push(parm);
            });
            summary = summary_parm;
          }
          _.each(summary,function(parm){
            if(uids&&uids.indexOf(parm.uid)<0)
            {
              return;
            }
            if(parm.isnew)
              result_summary.DNU++;
            if(parm.paymoney)
              result_summary.Revenue+=parm.paymoney;
            if(parm.paycount>0)
              result_summary.PaidMan++;
            if(parm.ltv7)
              result_summary.LTV7+=parm.ltv7;
            if(parm.ltv15)
              result_summary.LTV15+=parm.ltv15;
            if(parm.ltv30)
              result_summary.LTV30+=parm.ltv30;
            if(parm.ltv60)
              result_summary.LTV60+=parm.ltv60;
            if(parm.ltv90)
              result_summary.LTV90+=parm.ltv90;
          });

          result_summary.DAU = summary.length;
          result_summary.EDAU = result_summary.DAU - result_summary.DNU;
          if(result_summary.DAU)
          {
            result_summary.ARPU = result_summary.Revenue/result_summary.DAU;
            result_summary.PaidPercentage = result_summary.PaidMan/result_summary.DAU;
          }
          if(result_summary.PaidMan)
            result_summary.ARPPU = result_summary.Revenue/result_summary.PaidMan;
        
        if(result_summary.DNU)
        {
          result_summary.LTV7 = result_summary.LTV7/result_summary.DNU;
          result_summary.LTV15 = result_summary.LTV15/result_summary.DNU;
          result_summary.LTV30 = result_summary.LTV30/result_summary.DNU;
          result_summary.LTV60 = result_summary.LTV60/result_summary.DNU;
          result_summary.LTV90 = result_summary.LTV90/result_summary.DNU;          
        }
          results.push(result_summary);
          results = _.sortBy(results,function(parm){
            return parm.firstDate;
          });
          results = results.reverse();
        });
        locals.datas.rows=results;
        locals.datas.total=1000000;
        cb();
      }
      ],function(err){
        res.send(locals.datas);
    });
	});
	view.render('summary_v2');
	
};
