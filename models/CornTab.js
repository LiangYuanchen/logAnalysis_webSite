var keystone = require('keystone'),
	Types = keystone.Field.Types;
var uuid = require('node-uuid');
var _config = keystone.get("_config");
var configLocal = keystone.get("config_gmtool");
var winston = require("winston");
var gameErrorManager = require("../manager/gameErrorManager");
var HOST = configLocal.host[0];
var PORT = configLocal.port[0];
//var _config =keystone.get("_config");
/**
 * GameUser Model
 * ==========
 */
var CronTab = new keystone.List('CronTab', {
	map: { name: 'timeStamp' }
});

CronTab.add({
	timeStamp 		:{type:Number,default:0,default:Date.now()},
	cron 			:{type:String,required:true,default:0},
	begindate		:{type:Number,default:Date.now()},
	cmd				:{type:String},
	onServer		:{type:Boolean,default:false},
	remark			:{type:String},
	tType:{type:Types.Select,default:1,options:[
	{value:0,label:"other"},//默认为实时统计
	{value:1,labal:"googlebroadcast"},
	{value:2,labal:"activity"},
	{value:3,labal:"google_play_version_check"}
	],index:true},

});
CronTab.schema.pre('remove',function(next){
	winston.info("pre remove demo");
	next();
})
var map_tType=[
	"",
	"opglobal,googlebroadcast,",
	"opglobal,commonsettingedit,"
];
var getOneWeekOrTwoWeek = function()
{
	var d = new Date();
	var now = d.getTime();
	var n = now - 259200000;
	var dayIndex = Math.ceil(n /86400000) - 1;
	var weekIndex = Math.ceil(dayIndex / 7);
	var ds = weekIndex % 2;
	return ds;
}
var CommonSettingEditGet = function(){
	var sevendays = {};
	var strSetting ={"sevendays":{"open":"true"},"accumulatebuygem":{"open":"true","start":"1450483200","end":"1450656000"},"boxshop":{"open":"true","start":"1449792000","end":"1449964800"},"discountshop":{"open":"true","start":"1450396800","end":"1450656000"},"bindfb":{"open":"true"},"followfb":{"open":"true"},"questrw":{"open":"true","start":"777600","end":"1555200"},"pvprw":{"open":"true","start":"127526400","end":"0"},"odyessyrw":{"open":"true","start":"604800","end":"1728000"}};	

}
CronTab.schema.pre('save', function(next) {
	var self = this;
	if(!_config.isCron)
	{
		self.onServer = false;
		next();
		return;
	}
	
	var crons = keystone.get("cronTabs");
	if(!crons)
	{
		crons={};
	}
	if(crons[self._id])
	{
		crons[self._id].stop();
		crons[self._id]=null;
	}
	
	// var now =Date.parse(Date.now());
	// if(now<self.begindate)
	// {
	// 	self.onServer = false;
	// 	next();
	// 	return;
	// }
	self.onServer = true;
	var CronJob = require('cron').CronJob;
	var serverCpp = require('../ServerCpp');
	var thejob =new CronJob(self.cron,function(){
	        var sc  = new serverCpp(PORT,HOST);
	        //var strP = "logindiffday,"+uid+",1:1";
	        var cmd = self.cmd;
	        var strP = "";
	        if(self.tType!=0&&!isNaN(self.tType))
	        	strP =map_tType[self.tType]+cmd+"";
	        else if(self.tType==3)
	        {
		        var exec = require('child_process').exec; 
		       // var cmdStr = "elinks -dump 0 'https://play.google.com/store/apps/details?id=com.nebuliumgames.tavernlegends' |grep -A1 'Current Version'";
		        var cmdStr = "elinks -dump 0 'https://play.google.com/store/apps/details?id=com.seagame.innfinity' |grep -A1 'Current Version'";
		        exec(cmdStr, function(err,stdout,stderr){
		            if(err) {
		                winston.info('api error:'+stderr);
		            } else {
		                var google_play_version = keystone.get("google_play_version");
		                if(!google_play_version)
		                {
		                    keystone.set("google_play_version",stdout);
		                    google_play_version = keystone.get("google_play_version");
		                }
		                /*
		                这个stdout的内容就是上面我curl出来的这个东西：
		                {"weatherinfo":{"city":"北京","cityid":"101010100","temp":"3","WD":"西北风","WS":"3级","SD":"23%","WSE":"3","time":"21:20","isRadar":"1","Radar":"JC_RADAR_AZ9010_JB","njd":"暂无实况","qy":"1019"}}
		                */
		                if(stdout!=google_play_version)
		                {
		                    //sendmail
		                    var data={
		                        msg:"old:"+google_play_version+";new:"+stdout,
		                        innSite:_config.title
		                    };
		                    keystone.list('User').model.find({emial:{$in:["liangyuanchen@163.com","qu.chen@nebuliumgames.com","maomao.li@nebuliumgames.com","luyu.yang@nebuliumgames.com","haogang.chen@nebuliumgames.com"]}}).exec(function(err, admins) {
		                        if (err) utils.showErr(err);
		                        //console.log(daily);
		                        new keystone.Email('daysleft-repertoire').send({
		                            to: admins,
		                            from: {
		                                name: 'innSite',
		                                email: 'operations@innsite.com'
		                            },
		                            subject: '无尽酒馆 谷歌版本更新',
		                            data: data
		                        }, function(){
		                            winston.info("send over /client_version");
		                        });
		                    });                    
		                    google_play_version = stdout;
		                    keystone.set("google_play_version",google_play_version);
		                }		
		                winston.info("cronTab job runed,google_play_version:%s",google_play_version);            
		            }
		        });
	        }
	      	else
	      		strP = cmd+"";
	      	if(self.tType!=3)
	      	{
		      	winston.info("crontab:strP:%s",strP);
		        sc.writeWithCallBack(strP,function(data){
		        	winston.info("cronTab job runed,strP:%s",strP);
		        });	      		
	      	}

          }, function () {
            // This function is executed when the job stops
            winston.info(new Date()+" stoped! cron---------thejob----------CronTab:"+self.cron);
          },
          true /* Start the job right now */,
          "UTC" /* Time zone of this job. */
        );      
	
    crons[self._id] = thejob;
    keystone.set("cronTabs",crons);
	next();
});
CronTab.schema.post('save', function() {

}); 
CronTab.schema.post('remove',function(){
	winston.info("post remove demo");
});
// GameUser.schema.methods.init = function(innlog,callback) {

// 	this.uid=innlog.uid;
// 	this.username=innlog.username;
// 	this.userRegTime=innlog.userRegTime;
// 	this.innExp=innlog.innExp;
// 	this.gem=innlog.gem;
// 	this.gold=innlog.gold;
// 	this.power=innlog.power;
// 	this.lastlogtime=innlog.timeStamp;
// 	this.lastlogdate=new Date(this.lastlogtime*1000);
// 	this.activetime=0;
// 	this.save(function(err){
// 		if (err) {
// 			console.error(JSON.stringify(err));
// 			callback(err);
// 		};
// 		console.log("GameUser init success!");
// 		callback();
// 	});
// }
CronTab.defaultColumns = 'timeStamp, cron, begindate,cmd';
CronTab.register();

// exports = module.exports = GlobalInnLogManager;
// var GlobalInnLogManager = function(){

// }

// GlobalInnLogManager.prototype.Analyze = function(){
// 	console.log("LogbalInnLogManager.Analyze");
// }