var util = require("util");

var keystone = require("keystone");
var _ = require("underscore");
var async = require("async");
var _config = keystone.get("_config");
var winston = require("./util/LogsBackup.js");
var fs = require("fs");
	readline = require("readline");
//var statistical = require("./statistical");
var timezone = _config.timezone || 0;
function manager(){
	this.sessionCountBase = _config.logTime.sessionCountBase;
	this.logTimeBase = _config.logTime.logTimeBase;//60
}
manager.prototype.sessionCountBase = 0;
manager.prototype.logTimeBase = 0;
manager.prototype.showDailyBegin = function(logDate){
	return ((logDate+timezone*3600) / 86400 | 0) * 86400 - timezone*3600;
}

manager.prototype.showDailyEnd = function(logDate){
	return (((logDate+timezone*3600) / 86400 | 0) + 1) * 86400 - timezone*3600;
}
manager.prototype.showWeekFirstDay = function(logDate)
{
var Nowdate=new Date(logDate*1000);
var day = Nowdate.getHours()*60*60*1000+Nowdate.getMinutes()*60*1000+Nowdate.getSeconds()*1000+Nowdate.getMilliseconds();
var WeekFirstDay=new Date(Nowdate-(Nowdate.getDay()-1)*86400000-day);
WeekFirstDay = WeekFirstDay/1000;
return WeekFirstDay;
}
manager.prototype.showWeekLastDay=function(logDate)
{
var Nowdate=new Date(logDate*1000);
var day = Nowdate.getHours()*60*60*1000+Nowdate.getMinutes()*60*1000+Nowdate.getSeconds()*1000+Nowdate.getMilliseconds();
var WeekFirstDay=new Date(Nowdate-(Nowdate.getDay()-2)*86400000-day);
var WeekLastDay=new Date((WeekFirstDay/1000+6*86400)*1000);
WeekLastDay = WeekLastDay/1000;
return WeekLastDay;
}
manager.prototype.showMonthFirstDay=function(logDate)
{
var Nowdate=new Date(logDate*1000);
var MonthFirstDay=new Date(Nowdate.getYear()+1900,Nowdate.getMonth(),1);
MonthFirstDay = MonthFirstDay/1000;
return MonthFirstDay;
}
manager.prototype.showError = function(err)
{
	if (err) {
		if (err.name == 'ValidationError') {
			for (field in err.errors) {
			  winston.error("mongodb operation error,", err.errors[field]);
			}
		} else {
		// A general error (db, crypto, etc…)
			 winston.error("mongodb operation error,", err);
		}
	}
}
manager.prototype.showMonthLastDay=function(logDate)
{
var Nowdate=new Date(logDate*1000);
var MonthNextDay=new Date(Nowdate.getYear()+1900,Nowdate.getMonth()+1,1);
var MonthLastDay=new Date(MonthNextDay);
MonthLastDay = MonthLastDay/1000;
return MonthLastDay;
}
// statisticalJSON是输出函数
manager.prototype.getFirstAndLastDate=function(statisticalJSON,stype,logDate){
	var firstDate=0,lastDate=0;
	//console.log("statisticalJSON:%s",JSON.stringify(statisticalJSON));
	switch(stype){
		case "daily":
			//求当天的开始和结束时间
			statisticalJSON.firstDate = this.showDailyBegin(logDate);
			statisticalJSON.lastDate = this.showDailyEnd(logDate);
		break;
		case "weekly":
			//求当周的开始和结束时间
			statisticalJSON.firstDate = this.showWeekFirstDay(logDate);
			statisticalJSON.lastDate = this.showWeekLastDay(logDate);
		break;
		case "monthly":
			//求当月的开始和结束时间
			statisticalJSON.firstDate = this.showMonthFirstDay(logDate);
			statisticalJSON.lastDate = this.showMonthLastDay(logDate);
		break;
		default:
			console.error("getFirstAndLastDate Error");
		break;
	}
}
manager.prototype.isArray=function(obj) {   
  return Object.prototype.toString.call(obj) === '[object Array]';
}
manager.prototype.validateCountry = function(logCountry,country)
{
	if(country=="Not_CN")
	{
		if(logCountry=="CN")
			return false;
		else
			return true;
	}
	else
	{
		if(country==logCountry)
			return true;
		else
			return false;
	}
}
manager.prototype.loadBaseDataFile = function(doSomeThing,next){
     //console.log("path:%s",folderPath);
     var folderPath = process.cwd()+"/baseData/";
     fs.readdir(folderPath,function(err,results){
        if (err) {
           console.log(err);
        };
        var k =0;
        var paths = results;
        var GetTheLogs = function(i,thenext){
           var filePath = folderPath+paths[i];
           var rs = fs.createReadStream(filePath);
           var arrLogs = [];
           //console.log(paths[i]);

           var rd  = readline.createInterface({
              input:rs,
              output:process.stdout,
              terminal:false
           });
           console.log("read the filePath:%s",filePath);
           rd.on("line",function(line){
                 arrLogs.push(line);
                 console.log(line);
           }).on("close",function(){
              process.nextTick(function(){
                  doSomeThing(arrLogs,function(){
                      /** signal mongo to continue, fetch next record **/
                      console.log("over get，i:%d,paths.length:%d ",i,paths.length);
                      if(++i<paths.length)
                      {
                       GetTheLogs(i,thenext);
                      }
                      else
                      {
                       thenext();
                      }
                  });
              });
           });
        }
        GetTheLogs(0,function(){
        	next();
            console.log("readed over");
        });
    });
}
manager.prototype.initStatisticalJSON = function(sType,logDate,statisticalType){
        var statisticalJSON =  {firstDate:0,lastDate:0,sType:"0",count:0,tType:0,countObj:""};

		this.getFirstAndLastDate(statisticalJSON,sType,logDate);
		switch(sType){
			case "daily":
				statisticalJSON.sType=statisticalType;
				statisticalJSON.tType=1;
			break;
			case "weekly":
				statisticalJSON.sType=statisticalType;
				statisticalJSON.tType=2;
			break;
			case "monthly":
				statisticalJSON.sType=statisticalType;
				statisticalJSON.tType=3;
			break;
			default:
			break;
		}
		statisticalJSON.logDate = logDate;
		return statisticalJSON;
}
manager.prototype.batchInsertStatistical = function(arr,next){
	var self = this;
	var bulk = keystone.list("Statistical").model.collection.initializeOrderedBulkOp();
	var i=0;
	if(!arr||arr.length==0)
	{
		next();
		return;
	}
	_.each(arr,function(statisticalJSON){
		statisticalJSON.tType = 1;
		if(statisticalJSON.region&&!isNaN(statisticalJSON.region))
			statisticalJSON.region = parseInt(statisticalJSON.region);
		try{
			bulk.insert(statisticalJSON);
		}
		catch(e)
		{
			winston.debug("statisticalJSON batchInsert Error,e:%s,statisticalJSON:%s",JSON.stringify(e),JSON.stringify(statisticalJSON));
		}
	});	
  	bulk.execute(function(err,result) {
  		if(err){
  			console.log("batchInsertStatistical fail");
  		}
  		if(typeof next=="function")
  			next();
  		else
  		{
  			winston.info("batchInsertStatistical has no callback");
  		}
  	});	
}
manager.prototype.batchInsertAnyCollection = function(collectionName,arr,next){
	var bulk = keystone.list(collectionName).model.collection.initializeOrderedBulkOp();
	var i=0;
	var self = this;
	if(!arr||arr.length==0)
	{
		next();
		return;
	}
	//winston.debug("begin batchInsert,arr.length:%d",arr.length);
	_.each(arr,function(statisticalJSON){
		//statisticalJSON.tType = 1;
		if(statisticalJSON&&statisticalJSON.region&&!isNaN(statisticalJSON.region))
			statisticalJSON.region = parseInt(statisticalJSON.region);
		try{
			bulk.insert(statisticalJSON);
		}
		catch(e)
		{
			winston.debug("statisticalJSON batchInsert Error,e:%s,statisticalJSON:%s",JSON.stringify(e),JSON.stringify(statisticalJSON));
		}
		i++;
	});
  	bulk.execute(function(err,result) {
  		self.showError(err);
  		if(err)
  		winston.debug("batchInsertAnyCollection over ,get error");
  		if(typeof next=="function")
  			next();
  	});

}
manager.prototype.selectByStream= function(parm,doLotsWork,next){
	var self = this;
	var stream = keystone.list("InnLog").model.find(parm).sort({timeStamp:1}).stream();
	var cache = [];
    stream.on('data',function(item){
        cache.push(item);
        if(cache.length==100000){
            /** signal mongo to pause reading **/
            stream.pause();
            process.nextTick(function(){
                doLotsWork(cache,function(){
                    cache=[];
                    /** signal mongo to continue, fetch next record **/
                   // console.log("over get 10000");
                    stream.resume();
                });
            });
        }
    });
    stream.on('end',function(){ //console.log('query ended');
     }
    	);
    stream.on('close',function(){ //console.log('query closed');
                 doLotsWork(cache,function(){
                    cache=[];
                    /** signal mongo to continue, fetch next record **/
                    //console.log("over get ");
                    next();
                   // stream.resume();
                });
     });
}
manager.prototype.selectOnlyByStream= function(parm,doLotsWork,parms,next){
	var self = this;
	var stream = keystone.list("InnLog").model.find(parm).select(parms).sort({timeStamp:1}).stream();
	var cache = [];
    stream.on('data',function(item){
        cache.push(item);
        if(cache.length==100000){
            /** signal mongo to pause reading **/
            stream.pause();
            process.nextTick(function(){
                doLotsWork(cache,function(){
                    cache=[];
                    /** signal mongo to continue, fetch next record **/
                   // console.log("over get 10000");
                    stream.resume();
                });
            });
        }
    });
    stream.on('end',function(){ //console.log('query ended');
     }
    	);
    stream.on('close',function(){ //console.log('query closed');
                 doLotsWork(cache,function(){
                    cache=[];
                    /** signal mongo to continue, fetch next record **/
                    //console.log("over get ");
                    next();
                   // stream.resume();
                });
     });
}
manager.prototype.getInnlogDataAndMail=function(count,date,next){
	var self = this;
	var date = new Date(date)/1000;
	var firstDate = self.showDailyBegin(date);
	var lastDate = self.showDailyEnd(date);
	var thefilecount = count;
	keystone.list("InnLog").model.find({timeStamp:{$gte:firstDate,$lt:lastDate},logType:{$ne:"LogTime"}}).count(function(err,theCount){
		winston.info("thefilecount:%s,thecount:%s",thefilecount+"",theCount+"");
		if(theCount!=thefilecount)
		{
			//mail
			winston.info("send mail because innlog does not match the server file log");
			keystone.list('User').model.find().where('email').in(["liangyuanchen@163.com","maomao.li@nebuliumgames.com"]).exec(function(err, admins) {
				if (err)  {next(err);return;}
				//console.log(daily);
				new keystone.Email('innlogMatch').send({
					to: admins,
					from: {
						name: 'innSite',
						email: 'operations@innsite.com'
					},
					subject: '无尽酒馆 InnLog与服务器不符合('+date+') ',
					data: {msg:"mongo count:"+theCount+",server file log count:"+thefilecount}
				}, next);
			});
		}
		else
		{
			winston.info("samed with the mongodb and service file data");
			next();
		}
	});
}
manager.prototype.getSendMailData=function(data,next){
	async.waterfall([
			//求总用户
			function(cb){
				//console.log(1);
				var getuser = function(err,result){
					//console.log("97:"+ JSON.stringify(result));
					if(err){
						console.error("dailyMail get AllUser error!\n"+JSON.stringify(err));
						cb(err);
					}
					if(!result){
						data.users =0;
					}else{
						data.users=result.count;
					}
					cb();
				}
				keystone.list("Statistical").model.find().where("sType","101").where("tType","1").where("firstDate",data.firstDate).where("lastDate",data.lastDate).sort({"logDate":-1}).findOne(getuser);
			},
			//活跃用户
			function(cb){
				var getactive = function(err,result){
					if(err){
						console.error("dailyMail get activeUser error!\n"+JSON.stringify(err));
						cb(err);
					}
					if(!result){
						data.activeUsers = 0;
					}else{
						data.activeUsers = result.count;
					}
					cb();
				}
				keystone.list("Statistical").model.find().where("sType","106").where("tType","1").where("firstDate",data.firstDate).where("lastDate",data.lastDate).findOne(getactive);
			},
			//新用户
			function(cb){
				var getnews = function(err,result){
					if(err){
						console.error("dailyMail get newUsers error!\n"+JSON.stringify(err));
						cb(err);
					}
					if(!result){
						data.newUsers = 0;
					}else{
						data.newUsers = result.count;
					}
					cb();
				}
				keystone.list("Statistical").model.find().where("sType","102").where("tType","1").where("firstDate",data.firstDate).where("lastDate",data.lastDate).findOne(getnews);
			},
			//一日留存
			function(cb){
				var getdaysleft = function(err,result){
					if(err){
						console.error("dailyMail get daysLeft error!\n"+JSON.stringify(err));
						cb(err);
					}
					if(!result){
						data.daysLeft = 0;
					}else{
						if(!result.daysLeft)
							data.daysLeft = 0 + "%";
						else
						{
							var dl = eval("("+result.daysLeft+")");
							if(dl&&dl.length>1&&(!isNaN(parseInt(dl[1].dayleft))) ){
								data.daysLeft = parseInt(dl[1].dayleft)+"%";
							}else{
								data.daysLeft = 0+"%";
							}
						}

					}
					cb();
				}
				keystone.list("DaysLeft").model.find({timezone:{$exists:false}}).where("logDate").gte(data.firstDate).where("logDate").lt(data.lastDate).findOne(getdaysleft);
			}
		],function(err,cb){
			if(err){
				console.error("dailyMail is error,"+JSON.stringify(err));
			}
			next();
	});
}
//必须在当天已经求完昨天的数据后进行
manager.prototype.dailyMail = function(callback){
		var yesterday = Date.now()/1000 - 86400;
		var dayBfYesterday = Date.now()/1000 - 86400*2;
		var data = {};
		data.daily = {firstDate:0,lastData:0};
		data.yestD = {firstDate:0,lastData:0};
		data.daily.url = _config.innSite.domainName;
		data.daily.date = (new Date()).format("yyyy-MM-dd");
		var self = this;
		self.getFirstAndLastDate(data.daily ,"daily",yesterday);
		self.getFirstAndLastDate(data.yestD,"daily",dayBfYesterday);
		async.waterfall([
				function(cb){
					var getDaily = function(){
						cb();
					};
					self.getSendMailData(data.daily,getDaily);
				},
				function(cb){
					var getYest = function(){
						cb();
					}
					self.getSendMailData(data.yestD,getYest);
				}
			],function(err,cb){
				//console.log(6);
					//console.log(innlogG);
				if(err){
					console.error("dailyMail is error,"+JSON.stringify(err));
				}
				var positive = "green";
				var negative = "red";
				data.proportion = {users:{},activeUsers:{},newUsers:{},daysLeft:{}};
				data.proportion.users.value=parseInt((Math.abs(data.daily.users-data.yestD.users)/data.yestD.users)*100);
				data.proportion.users.text =(data.daily.users-data.yestD.users)>0?positive:negative;
				data.proportion.activeUsers.value=parseInt((Math.abs(data.daily.activeUsers-data.yestD.activeUsers)/data.yestD.activeUsers)*100);
				data.proportion.activeUsers.text =(data.daily.activeUsers-data.yestD.activeUsers)>0?positive:negative;
				data.proportion.newUsers.value=parseInt((Math.abs(data.daily.newUsers-data.yestD.newUsers)/data.yestD.newUsers)*100);
				data.proportion.newUsers.text =(data.daily.newUsers-data.yestD.newUsers)>0?positive:negative;
				data.proportion.daysLeft.value=parseInt((Math.abs(data.daily.daysLeft-data.yestD.daysLeft)/data.yestD.daysLeft)*100);
				data.proportion.daysLeft.text =(data.daily.daysLeft-data.yestD.daysLeft)>0?positive:negative;
				keystone.list('User').model.find().where('email', "liangyuanchen@163.com").exec(function(err, admins) {
					if (err) return callback(err);
					//console.log(daily);
					new keystone.Email('dailyReport').send({
						to: admins,
						from: {
							name: 'innSite',
							email: 'operations@innsite.com'
						},
						subject: '无尽酒馆 每日统计('+_config.innSite.domainName+') ',
						data: data
					}, callback);
				});
		});

}


exports = module.exports = manager;
