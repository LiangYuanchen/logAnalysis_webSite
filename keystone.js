// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').load();

//var sleep = require("sleep");
//sleep.sleep(5);
var net = require('net');
var keystone = require('keystone');
var schedule = require('node-schedule');
var _ = require("underscore");
var hexy = require("hexy");
var mod_panic = require('panic');

var argv = process.argv;
var util = require('util');

var zlib = require('zlib');
// winston.log('info', 'Test Log Message', { anything: 'This is metadata' });
//winston.log('debug', 'Now my debug messages are written to console!');
//winston.debug("abc");
// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.
var _config,config_gmtool;
if(argv[2])
{
	_config = require(argv[2]);
}
else
{
	_config = require("./configuration");
}
if(argv[3])
{
	config_gmtool = require(argv[3]);
}
else
{
	config_gmtool = require("./config");
}
//console.log(JSON.stringify(argv));
process.on('uncaughtException', function(err){
	console.log(err);
	console.log(JSON.stringify(err));
});
mod_panic.enablePanicOnCrash();


keystone.init({
	'name': 'innSite',
	'brand': 'innSite',
	'port':_config.innSite.port,
	'less': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': 'jade',
	'emails': 'templates/emails',
	'auto update': true,
	'session': true,
	'auth': true,
	'mongo': process.env.MONGO_URI || process.env.MONGOLAB_URI || _config.mongo.uri,
	'user model': 'User',
	"signin redirect":'/',
	"signout redirect":'/',
	'cookie secret': 'vmC}~k).ViRv=&3aUXi@M=6uwgg/Ld1Muw9>3;zI$_o<|}98/%aD=&ZdG|9&X8sT'
});

keystone.set("_config",_config);
keystone.set("config_gmtool",config_gmtool);
require("./manager/util/datetime");
var utils = require("./manager/util/utils");

var isSite  =  true;
var isServer = _config.isServer;
var isPhase = _config.isPhase;
var isTest   =  false;
var isCron  = _config.isCron;


var port_compareInnlog=_config.innSite.port_compareInnlog;
//var innLogManager = require('./models/InnLog');
//var globalInnLogManager = require("./models/InnLog_Global");
var winston = require('winston');
//winston.remove(winston.transports.Console);
//winston.add(winston.transports.Console, {'timestamp':true,'colorize':true,handleExceptions:true});
//winston.log('info', 'Hello distributed log files!');
//winston.info('Hello again distributed logs');
winston.level = _config.logLevel;

winston.handleExceptions(new winston.transports.File({ filename: './logs/exceptions.log' }));
winston.add(winston.transports.File, {
	filename: './logs/all-logs.log',
	handleExceptions: true,
	level:'info',
	"timeStamp":true,
	json:false
});


var app =keystone.app;

if(app)
{
	//app.use(express.static(__dirname));
	app.set("uploadDir",'./uploads');

	var bodyParser = require('body-parser');
	app.use("/commonsettingedit",bodyParser.json({limit: '50mb'}));
	app.use("/commonsettingedit",bodyParser.urlencoded({limit: '50mb', extended: true}));
}
// Load your project's Models

keystone.import('models');
//require("./models");
//自定义配置
var sm = require("./manager/SummaryManager");
keystone.set("sessionCount",0);
keystone.set("registerCount",0);
keystone.set("onlineUid",[]);

keystone.set("gameids",_config.gameids);


// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js

keystone.set('locals', {
	_: require('underscore'),
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable
});

// Load your project's Routes
keystone.set('routes', require('./routes'));



//定义实时map
keystone.set('online_temp',{});
keystone.set('newone_temp',{});
keystone.set('session_temp',{});
keystone.set('pay_temp',{});

// Setup common locals for your emails. The following are required by Keystone's
// default email templates, you may remove them if you're using your own.

keystone.set('email locals', {
	logo_src: '/images/logo-email.gif',
	logo_width: 194,
	logo_height: 76,
	theme: {
		email_bg: '#f9f9f9',
		link_color: '#2697de',
		buttons: {
			color: '#fff',
			background_color: '#2697de',
			border_color: '#1a7cb7'
		}
	}
});

// Setup replacement rules for emails, to automate the handling of differences
// between development a production.

// Be sure to update this rule to include your site's actual domain, and add
// other rules your email templates require.

keystone.set('email rules', [{
	find: '/images/',
	replace: (keystone.get('env') == 'production') ? 'http://www.your-server.com/images/' : 'http://localhost:3000/images/'
}, {
	find: '/keystone/',
	replace: (keystone.get('env') == 'production') ? 'http://www.your-server.com/keystone/' : 'http://localhost:3000/keystone/'
}]);

// Load your project's email test routes

keystone.set('email tests', require('./routes/emails'));

// Configure the navigation bar in Keystone's Admin UI

keystone.set('nav', {
	'posts': ['posts', 'post-categories'],
	'galleries': 'galleries',
	'enquiries': 'enquiries',
	'users': 'users'
});


//keystone.set("innLogManager",innLogManager);
//keystone.set("globalInnLogManager",globalInnLogManager);
// Start Keystone to connect to your database and initialise the web server
app.use("/feedbackget",function(req, res, next) {
	var data = [];
	//debugger;
	req.addListener('data', function (chunk) {
		//debugger;
		if(req.method=="POST")
		data.push(new Buffer(chunk));
	});
	req.addListener('end', function () {
		//读取参数流结束后将转化的body字符串解析成 JSON 格式
		res.sendStatus(200);
		if(req.method=="POST")
		{
			var  buf = Buffer.concat(data);
			zlib.inflate(buf, function(err, result) {

				if (!err) {
					var strParm = result.toString();
					utils.clearFeedbacklist(utils.getFeedbacklist());

					var feedbackip = utils.getFeedbackByIp(req.ip);
					if(feedbackip.count >=5 )
					{
						winston.error("Feedback Err, repeat feedback",feedbackip);
						//res.send("feedback error");
						//res.end();
						//next();
						return;
					}

					var  parm ={};
					parm.username = req.headers.username;
					parm.regionid = req.headers.regionid;
					parm.uid      = req.headers.userid;
					parm.tavername = req.headers.tavername;

					parm.timeStamp = Date.now()/1000;
					parm.message  = unescape(utils.getRequest(strParm,"message"));
					parm.logs     = unescape(utils.getRequest(strParm,"logs"));
					parm.info     = unescape(utils.getRequest(strParm,"info"));
					var feedback = keystone.list("Feedback").model;
					var data = new feedback(parm);
					data.save(function(){
						if(!feedbackip.count)
						feedbackip.count = 0;
						feedbackip.count ++;
						winston.info("feedback:%s,%s",feedbackip,req.ip);
						//res.send("feedback saved");
						//res.end();
						//next();
					});
				} else {
					//res.send("err,%s",err);
					//res.end();
					//next(err);
				}
			});
		}
		else
		{
			//res.send("error route");
			//res.end();
			//next();
		}

	});
});

app.use("/rawsummary", function(req, res, next) {
	if (_config.server.summaryHost == "0.0.0.0"
	|| req.connection.remoteAddress == _config.server.summaryHost) {

		var timestamp = parseInt(req.query.timestamp | 0);
		if (timestamp > 0) {
			var dau = parseInt(req.query.dau | 0);
			var dnu = parseInt(req.query.dnu | 0);
			var orders = parseInt(req.query.orders | 0);

		}
	}
	res.end();
});

keystone.start();

var gameUserManager = require("./manager/gameUserManager");
var gum = new gameUserManager();
keystone.set("gameUserManager",gum);

var gameconfigExchange = require("./manager/GameConfigExchange");
var ge = new gameconfigExchange();

keystone.set("gameconfigExchange",ge);

var guildManager = require("./manager/GuildManager");
var gm = new guildManager();
keystone.set("guildManager",gm);

var innlogManager = require("./manager/innlogManager");
var im = new innlogManager();
keystone.set("innlogManager",im);


var retentionManager = require('./manager/RetentionManager');
keystone.set("retentionManager", new retentionManager());

if(_config.innSite.isCalculate)
{
	var statistical = require("./manager/StatisticalHandle");
	var sl = new statistical();
	keystone.set("statisticalManager",sl);
}
//是否跑取服务
//遍历遍计划任务表

if(_config.isCron)
{
	keystone.list("CronTab").model.find().exec(function(err,results){
		_.each(results,function(parm){
			parm.save(function(){});
		});
	});
}


if(isServer)
{
	var ipManager = require("./manager/dbipcountryManager");
	var i = new ipManager();
	i.getIps(function(){
		winston.info("#keystone#import IP mapping");
	});
	//init
	var globaldatas = require("./manager/GlobalDatas");
	globaldatas.initArrUserCountry();
	var s = require("./server.js");
}
if(isPhase){
	var innlogManager = require("./manager/innlogManager");
	var gameUserManager = require("./manager/gameUserManager");
	var innlogHandler = require("./manager/innlogHandle");

	var ipManager = require("./manager/dbipcountryManager");
	var i = new ipManager();
	i.getIps(function(){
		winston.info("#keystone#import IP mapping");
	});

	///demo lateri
	var statisticalManager = require("./manager/statistical");

	//实时监控相关
	var CronJob = require('cron').CronJob;

	var gum = new gameUserManager();
	gum.initGameUser(function(){
		winston.info("init GameUser over!");
	});
	var Manager = require("./manager/manager");

	//服务器状态检查
	function sendSocket(host,port,cb){
		var net = require('net');
		var socket = new net.Socket();

		console.log("host:%s,port:%s",host,port);

		socket.on('data',function(data){
			//console.log(data);
			//socket.close();
			socket.destroy();
			cb(true);

		});
		socket.on('timeout',function(data){
			console.log('timeout');
			cb(false);
		});
		socket.on('close',function(data){
			console.log('close');
		})
		socket.on('error',function(data){
			console.log("error,"+JSON.stringify(data));
			cb(false);
		})
		socket.connect({
			host:host,
			port:port
		},function(){
			socket.write("dfdf","utf-8",function(){});
		});
	}

	var jobDaily = new CronJob('00 05 00 * * *', function(){
		//day
		var beginDate = new Date();
		var statisticalManager = require("./manager/StatisticalHandle");
		var logDate = Date.now()/1000-86400;
		var sta =new statisticalManager(logDate);
		keystone.set("onStatistical",logDate);
		keystone.set("onSummaryRetention",logDate);
		async.waterfall([
			function(cb)
			{
				sta.dailyStatistical(function(err){
					var endDate = new Date();
					console.log("daily statistical,beginDate:"+beginDate+";endDate:"+endDate);
					keystone.set("onStatistical",false);
					keystone.set("onSummaryRetention",false);
					if (err) {console.log(err)};
					cb();
				});
			},
			function(cb){
				if(_config.mysql.isopen)
				sta.handleOnlyMysql({},cb);
				else
				cb();
			},
			function(cb){
				if(_config.momentTimezone=="Asia/Shanghai")
				{
					var logDate = new Date( (Date.now()/1000-86400)*1000 ).format("yyyy-MM-dd");
					var exec = require('child_process').exec;
					var cmdStr = './shellTemplate/mongodb_users_snapshot.sh '+ logDate;
					winston.info("will mongodb_users_snapshot cmdStr:%s",cmdStr);
					exec(cmdStr, function(err,stdout,stderr){
						if(err) {
							console.log('get  api error:'+stderr);
						} else {
							console.log("over child_process mongodb_users_snapshot,%s",JSON.stringify(stdout));
						}
						cb();
					});
				}
				else
				{
					cb();
				}
			}
		],function(err){
		});
	}, function () {
		// This function is executed when the job stops
		console.log(new Date()+" stoped! cron---------jobDaily----------");
	},
	true /* Start the job right now */,
	_config.momentTimezone /* Time zone of this job. */
);
}
if(isTest){
	var s = require("./Demo_Test.js");
}

//keystone.list("InnLog").model.find({userRegTime:{$gte:1467734400,$lt:1467820800},logType:"QuestFinish",message:/1002002/});

// // //临时表导数据的流程 带device_id的订单信息
// var Types = keystone.Field.Types;
// var modelName = "Temp_Payinginfos";
// var model = new keystone.List(modelName

// );
// model.add({
// 	orderId:{type:String,default:"",required:true},
// 	gem:{type:Number,default:0,required:true},
// 	money:{type:Number,default:0,required:true},
// 	timeStamp:{type:Number,default:0,required:true},
// 	uid:{type:String,default:"",required:true},
// 	registerdate:{type:Number},
// 	region:{type:Number},
// 	country:{type:String},
// 	device_id:{type:String}
// });
// model.schema.add({
// 	bindAccout		:{type:[String] }
// });
// model.defaultColumns = 'uid';
// model.register();

// async.waterfall([
// 	function(cb){
// 		keystone.list("PayingInfo").model.find({}).populate("gamer").exec(function(err,datas){
// 			var results = [];
// 			_.each(datas,function(parm){
// 				var a = {};
// 				a.timeStamp = parm.timeStamp;
// 				a.orderId = parm.orderId;
// 				a.gem = parm.gem;
// 				a.money = parm.money;
// 				a.uid = parm.uid;
// 				a.region = parm.region;
// 				debugger;
// 				a.country = parm.gamer.country;
// 				a.device_id = parm.gamer.device_id;
// 				a.registerdate = parm.gamer.registerdate;
// 				results.push(a);
// 			});

// 			cb(null,results);
// 		});
// 	},
// 	function(arr,cb){
// 		var bulk = keystone.list(modelName).model.collection.initializeOrderedBulkOp();
// 		var i=0;
// 		if(!arr||arr.length==0)
// 		{
// 			cb();
// 			return;
// 		}
// 		_.each(arr,function(statisticalJSON){
// 			try{    
// 				bulk.insert(statisticalJSON);
// 			}
// 			catch(e)
// 			{
// 				winston.debug(" batchInsert Error,e:%s,statisticalJSON:%s",JSON.stringify(e),JSON.stringify(statisticalJSON));
// 			}
// 		});
// 	  	bulk.execute(function(err,result) {
// 	  		if(err){
// 	  			console.log("batchInsertStatistical fail");
// 	  		}
// 	  		if(typeof cb=="function")
// 	  			cb();
// 	  		else
// 	  		{
// 	  			winston.info("batchInsertStatistical has no callback");
// 	  		}
// 	  	});
// 	}
// 	],function(){
// 	console.log("over all");
// });


//keystone.list("InnLog").model.find({userRegTime:{$gte:1467734400,$lt:1467820800},logType:"QuestFinish",message:/1002002/});

// // //临时表导数据的流程
// var Types = keystone.Field.Types;
// var modelName = "Temp_GameUserWithAllDollar";
// var model = new keystone.List(modelName

// );
// model.add({
//     uid: { type: String },
//     registerdate: {type:Number},
//     lastlogdate: {type:Date},
//     gembuy:{type:Number},
//     gemother:{type:Number},
//     innExp:{type:Number},
//     vip:{type:Number},
//     advCount:{type:Number},
//     tavernlevel:{type:Number},
//     lastQuest 		:{type:String,default:"C1_L1_TITLE"},
//     lastQuestTypeId:{type:Number},
//     lastHardQuestTypeId:{type:Number},
// 	device_type		:{type:Number},
// 	device_id		:{type:String},
// 	lastlogin_ip	:{type:String},
//     country: { type: String },
//     region: { type: Number, default: 0},
//     gembuytotal: {type:Number,default: 0},
//     dollars:{type:Number}
// });
// model.schema.add({
// 	bindAccout		:{type:[String] }
// });
// model.defaultColumns = 'uid';
// model.register();

// async.waterfall([
// 	function(cb){
// 		keystone.list("GameUser").model.find().select("uid registerdate lastlogdate gembuy gemother innExp vip advCount tavernlevel lastQuest lastQuestTypeId lastHardQuestTypeId device_type device_id lastlogin_ip country region gembuytotal bindAccout").exec(function(err,users){
// 			cb(null,users);
// 		})
// 	},
// 	function(users,cb){
// 		keystone.list("InnLog").model.find({logType:"RegisterLog"}).select("uid message").exec(function(err,datas){
// 			_.each(users,function(user){
// 				if(!user.device_id)
// 				{
// 					var data = _.find(datas,function(parm){return parm.uid == user.uid});
// 					if(data)
// 					{
// 						user.device_id=data.message.split(",")[5];
// 					}
// 				}
// 			})
// 			cb(null,users);
// 		});
// 	},
// 	function(users,cb){
// 		keystone.list("PayingInfo").model.find({}).select("uid money").exec(function(err,datas){
// 			var a = {};
// 			_.each(datas,function(parm){
// 				if(!a[parm.uid])
// 					a[parm.uid] = 0;
// 				 a[parm.uid] += parseFloat(parm.money);
// 			});
// 			_.each(users,function(user){
// 				user.dollars = a[user.uid];
// 			});
// 			cb(null,users);
// 		});
// 	},
// 	function(arr,cb){
// 		var bulk = keystone.list(modelName).model.collection.initializeOrderedBulkOp();
// 		var i=0;
// 		if(!arr||arr.length==0)
// 		{
// 			cb();
// 			return;
// 		}
// 		_.each(arr,function(statisticalJSON){
// 			try{    
// 				statisticalJSON = _.pick(statisticalJSON,"uid","registerdate","lastlogdate","gembuy","gemother","innExp","vip","advCount","tavernlevel","lastQuest","lastQuestTypeId","lastHardQuestTypeId","device_type","device_id","lastlogin_ip","country","region","gembuytotal","bindAccout","dollars");
// 				bulk.insert(statisticalJSON);
// 			}
// 			catch(e)
// 			{
// 				winston.debug(" batchInsert Error,e:%s,statisticalJSON:%s",JSON.stringify(e),JSON.stringify(statisticalJSON));
// 			}
// 		});
// 	  	bulk.execute(function(err,result) {
// 	  		if(err){
// 	  			console.log("batchInsertStatistical fail");
// 	  		}
// 	  		if(typeof cb=="function")
// 	  			cb();
// 	  		else
// 	  		{
// 	  			winston.info("batchInsertStatistical has no callback");
// 	  		}
// 	  	});
// 	}
// 	],function(){
// 	console.log("over all");
// });

// //临时表导数据的流程
// var modelName = "Temp_QueenCoinPurchase";
// var model = new keystone.List(modelName

// );
// model.add({
//     uid: { type: String },
//     country: { type: String },
//     region: { type: Number, default: 0},
//     gembuytotal: {type:Number,default: 0},
//     logDate:{type:String},
//     R3:{type:String},
//     R4:{type:String},
//     vip:{type:String},
//     innExp:{type:String}
// });
// model.defaultColumns = 'uid';
// model.register();

// async.waterfall([
// 	function(cb){
// 		keystone.list("InnLog").model.find({logType:"QueenCoinShopPurchase"}).select("logDate uid region R3 R4 innExp").exec(function(err,datas){
// 			cb(null,datas);
// 		});
// 	},
// 	function(datas,cb){
// 		var uids = {};
// 		_.each(datas,function(parm){
// 			if(!uids[parm.uid])
// 				uids[parm.uid] = 0;
// 		})
// 		var keys = _.keys(uids);
// 		keystone.list("GameUser").model.find({uid:{$in:keys}}).select("uid country vip gembuytotal").exec(function(err,users){
// 			_.each(datas,function(parm){
// 				var user = _.find(users,function(u){return u.uid==parm.uid});
// 				if(user)
// 				{
// 					parm.country = user.country;
// 					parm.vip = user.vip;
// 					parm.gembuytotal = user.gembuytotal;
// 				}
// 			})
// 			cb(null,datas);
// 		});
// 	},
// 	function(arr,cb){
// 		var bulk = keystone.list(modelName).model.collection.initializeOrderedBulkOp();
// 		var i=0;
// 		if(!arr||arr.length==0)
// 		{
// 			cb();
// 			return;
// 		}
// 		_.each(arr,function(statisticalJSON){
// 			try{
// 				statisticalJSON = _.pick(statisticalJSON,"uid","region","country","gembuytotal","logDate","R3","R4","vip","innExp");
// 				bulk.insert(statisticalJSON);
// 			}
// 			catch(e)
// 			{
// 				winston.debug(" batchInsert Error,e:%s,statisticalJSON:%s",JSON.stringify(e),JSON.stringify(statisticalJSON));
// 			}
// 		});
// 	  	bulk.execute(function(err,result) {
// 	  		if(err){
// 	  			console.log("batchInsertStatistical fail");
// 	  		}
// 	  		if(typeof next=="function")
// 	  			next();
// 	  		else
// 	  		{
// 	  			winston.info("batchInsertStatistical has no callback");
// 	  		}
// 	  	});
// 	}
// 	],function(){
// 	console.log("over all");
// });



// var i =0;
// async.waterfall([
// 	function(cb)
// 	{
// 		keystone.list("GameUser").model.find({country:"BR"}).select("uid country").exec(function(err,datas){
// 			cb(null,datas);
// 		});
// 	},
// 	function(datas,cb){
// 		keystone.list("PayingInfo").model.find({}).exec(function(err,parms){
// 			_.each(parms,function(parm){
// 				var user = _.find(datas,function(data){return data.uid==parm.uid});
// 				parm.country = user.country;
// 				parm.save(function(){
// 					console.log("success paying:%s",++i);
// 				});
// 			});
// 		})
// 	}
// 	],function(){
// 		console.log("over demo");
// });

// var file = "./remove.csv"
// var tofile = "./remove_withdate.csv";
// var readline = require("readline");
// var fs = require("fs");
// var rs = fs.createReadStream(file);
// var rd = readline.createInterface({
// 	input:rs,
// 	output:process.stdout,
// 	terminal:false
// });
// rd.on("line",function(line){

//  	rd.pause();
//  	var msgArr = line.split(",");
//  	if(isNaN(msgArr[1]))
//  		return;
//  	if(isNaN(msgArr[3]))
//  		return;

//  	var date2 = new Date(msgArr[1]*1000).format()
//  	var date4 = new Date(msgArr[3]*1000).format()
//  	msgArr[1] = date2;
//  	msgArr[3] = date4;
//  	var result = msgArr.join(",");
// 	fs.appendFile(tofile, result+"\n", function (err) {
// 		rd.resume();
// 	});
// }).on("close",function(){
// 	winston.info("over handle file");
// });
// keystone.mongoose.connection.on('open', function (ref) {
//     console.log('Connected to mongo server.');
//     //trying to get collection names
//     var date = new Date().format("yyyy-MM-dd");
//     keystone.mongoose.connection.db.collectionNames(function (err, names) {
//         console.log(names); // [{ name: 'dbname.myCollection' }]
//         module.exports.Collection = names;
//     });
// });

// var logDate = "2016-05-12";
// var exec = require('child_process').exec;
// debugger;
// var cmdStr = './shellTemplate/mongodb_users_snapshot.sh '+ logDate;
// exec(cmdStr, function(err,stdout,stderr){
// if(err) {
// console.log('get  api error:'+stderr);
// } else {
// var data = JSON.parse(stdout);
// console.log("over child_process mongodb_users_snapshot");
// console.log(data);
// }
// });
