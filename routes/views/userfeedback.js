var keystone = require('keystone');
var _config  = keystone.get("_config");
var winston = require("winston");
exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	// Set locals
	locals.section = 'userfeedback';
	// Set locals
	var permission = require("../../manager/permission");
	var per = new permission();
	locals.hasPermission = false;
    if(req.user&&req.user.code)
      locals.hasPermission = per.HasPermisson("summary",req.user.code);
	// Load the galleries by sortOrder
	locals.formatData = req.body || {};
	locals.datas = {};
	locals.timezone = _config.timezone||0;

	function clearFeedbacklist(feedbackiplist)
	{
		var overdue = 60*5;
		var feedbackiplist = keystone.get("feedbackiplist");
		var now = Date.now()/1000;
		_.each(feedbackiplist,function(feedbackip){
			if((now - feedbackip.date) > overdue )
				feedbackip.count = 0;
		});
	}

	function getFeedbacklist()
	{
		return keystone.get("feedbackiplist");
	}

	function saveFeedbacklist(feedbackiplist)
	{
		keystone.set("feedbackiplist",feedbackiplist);
	}

	function getFeedbackByIp(uid)
	{
		var feedbackiplist = keystone.get("feedbackiplist");
		if(!feedbackiplist)
		{
			feedbackiplist = {};
			saveFeedbacklist(feedbackiplist);
		}
			
		if(!feedbackiplist[uid])
		{
			feedbackiplist[uid] = {date:Date.now()/1000};
			saveFeedbacklist(feedbackiplist);
		}
		return feedbackiplist[uid];
	}

	view.on("post",function(next){
		var parm = {};

		clearFeedbacklist(getFeedbacklist());
		
		var feedbackip = getFeedbackByIp(req.ip);
		if(feedbackip.count >=5 )
		{
			winston.error("Feedback Err, repeat feedback",feedbackip);
			res.send("feedback send count > 5");
			return;
		}
		
		parm.username = req.headers.username;
		parm.regionid = req.headers.regionid;
		parm.uid 	  = req.headers.userid;
		parm.tavername = req.headers.tavername;

		parm.timeStamp = Date.now()/1000;
		parm.message  = unescape(req.body.message);
		parm.logs	  = unescape(req.body.logs);
		parm.info	  = unescape(req.body.info);
		

		if(!parm.uid)
		{
			winston.error("FeedBackErr,parm:",parm);
			winston.error("req:",req);
		}
		var feedback = keystone.list("Feedback").model;
		var data = new feedback(parm);
		data.save(function(){
			if(!feedbackip.count)
				feedbackip.count = 0;
			feedbackip.count ++;
			winston.info("winston log :",feedbackip,req.ip);
			res.send("feedback saved");
		});
	});
	
	view.render('userfeedback');
};
