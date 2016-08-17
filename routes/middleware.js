/**
 * This file contains the common middleware used by your routes.
 *
 * Extend or replace these functions as your application requires.
 *
 * This structure is not enforced, and just a starting point. If
 * you have more middleware you may want to group it as separate
 * modules in your project's /lib directory.
 */

var _ = require('underscore'),
	querystring = require('querystring'),
	keystone = require('keystone');

/**
	Initialises the standard view locals

	The included layout depends on the navLinks array to generate
	the navigation in the header, you may wish to change this array
	or replace it with your own templates / logic.
*/

exports.initLocals = function(req, res, next) {

	var locals = res.locals;
	var permission = require("../manager/permission");
	// Set locals
	var per = new permission();
	locals.navLinks = [];
	if(!req.user||isNaN(req.user.code))
	{
		next();
		return;
	}

	if(per.HasPermisson("gmtool",req.user.code))
	{
		  locals.navLinks=locals.navLinks.concat([
			{ label: '主页',		key: 'home',		href: '/' },
			{ label: '实时-游戏',		key: 'statistical',		href: '/statistical' },
			{ label: '实时-硬件',		key: 'server_status',		href: '/server_status' },
			{ label: '阶段-日',		key: 'phaseStatistical',		href: '/phaseStatistical?ttype=1' },
			{ label: '阶段-周',		key: 'phaseStatistical',		href: '/phaseStatistical?ttype=2' },
			{ label: '阶段-月',		key: 'phaseStatistical',		href: '/phaseStatistical?ttype=3' },
			{ label: '日留存',		key: 'daysLeft',		href: '/daysLeft' },
			{ label: '日留存v2',		key: 'retentions',		href: '/retentions' },
			{ label: 'Debug',		key: 'gameError',		href: '/gameError' },
			// { label: 'Blog',		key: 'blog',		href: '/blog' },
			{ label: 'Gallery',		key: 'gallery',		href: '/gallery' },
			 //{ label: 'Contact',		key: 'contact',		href: '/contact' },
			 { label: 'GameUserInfo',		key: 'gameUser',		href: '/gameUser' },
			 { label: '数据分布',		key: 'gameUser',		href: '/globalStatistical' },
			 { label: 'Tutorial',		key: 'gameUser',		href: '/tutorial' },
			 { label: 'StepsTrack',		key: 'gameUser',		href: '/userStepsTrack' },
			 { label: 'StepsTrack_v2',		key: 'gameUser',		href: '/userStepsTrack_v2' },
			 { label: 'GMTool',		key: 'gameUser',		href: '/gmtool' },
			 { label: "Summary",	key:'summary',href:'/summary'},
			 { label: "Summary_v2",	key:'summary',href:'/summary_v2'},
			 { label:'宝石收支',	key:"gemStatistical",href:"/gemStatistical"},
			 { label:'金币收支',	key:"goldStatistical",href:"/goldStatistical"},
			 { label:'扫荡券',	key:"SweepTicket",href:"/sweepticket"},
			 { label:'内存监控', key:"monitoring",href:"/monitoring"},
			 { label:'订单查询', key:"payinginfo",href:"/payinginfo"},
			 { label:'玩家反馈', key:"feedback",href:"/feedback"},
			 { label:'Appsflyer', key:"appsflyer",href:"/appsflyer"}
		]);
	}
	else if(per.HasPermisson("user",req.user.code))
	{
		locals.navLinks=locals.navLinks.concat([
			{ label: 'GameUserInfo',		key: 'gameUser',		href: '/gameUser' },
			{ label: 'GMTool',		key: 'gameUser',		href: '/gmtool' },
			{ label: "分区",	key:'region',href:'/gmtool/regionsetting'},
			{ label: "邮件",	key:'mail',href:'/gmtool/mail'},
			{ label: "公告",	key:'newsletter',href:'/gmtool/newsletter'},
			{ label: "活动",	key:'activity',href:'/gmtool/activity'},
			{ label: "聊天",	key:'chat',href:'/gmtool/chat'},
			{ label: "评价",	key:'leavemsg',href:'/gmtool/leavemsg'}
	]);
	}
	else if(per.HasPermisson("summary",req.user.code))
	{
		  locals.navLinks=locals.navLinks.concat([
			{ label: 'GameUserInfo',		key: 'gameUser',		href: '/gameUser' },
			{ label: 'GMTool',		key: 'gameUser',		href: '/gmtool' },
			{ label: "分区",	key:'region',href:'/gmtool/regionsetting'},
			{ label: "邮件",	key:'mail',href:'/gmtool/mail'},
			{ label: "公告",	key:'newsletter',href:'/gmtool/newsletter'},
			{ label: "活动",	key:'activity',href:'/gmtool/activity'},
			{ label: "聊天",	key:'chat',href:'/gmtool/chat'},
			{ label: "评价",	key:'leavemsg',href:'/gmtool/leavemsg'},
			{ label: "Summary",	key:'summary',href:'/summary'},
		 	{label:'宝石收支',	key:"gemStatistical",href:"/gemStatistical"},
		 	{ label:'金币收支',	key:"goldStatistical",href:"/goldStatistical"},
		 	{ label:'订单查询', key:"payinginfo",href:"/payinginfo"},
		 	{ label: 'StepsTrack',		key: 'gameUser',		href: '/userStepsTrack' },
		 	{ label:'扫荡券',	key:"SweepTicket",href:"/sweepticket"},
		 	{ label:'玩家反馈', key:"feedback",href:"/feedback"}
		]);
	}

	locals.user = req.user;

	next();

};


/**
	Fetches and clears the flashMessages before a view is rendered
*/

exports.flashMessages = function(req, res, next) {

	var flashMessages = {
		info: req.flash('info'),
		success: req.flash('success'),
		warning: req.flash('warning'),
		error: req.flash('error')
	};

	res.locals.messages = _.any(flashMessages, function(msgs) { return msgs.length; }) ? flashMessages : false;

	next();

};


/**
	Prevents people from accessing protected pages when they're not signed in
 */

exports.requireUser = function(req, res, next) {
	if (!req.user) {
		if(req.url == "/feedback" && req.session.req.originalMethod == "POST")
		{
			next();
			return;
		}
		if(req.url == "/appsflyer" && req.session.req.originalMethod == "POST")
		{
			next();
			return;
		}
		
		if(req.url.indexOf("/validate")>-1)
		{
			next();
			return;
		}
		req.flash('error', 'Please sign in to access this page.');
		res.redirect('/keystone/signin');
	} else {
		//console.log(JSON.stringify(req.user));
		next();
	}

};
exports.formateDate = function(timeSpan){
	return (new Date(timeSpan*1000)).toLocalString();
}
