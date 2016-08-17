var keystone = require('keystone'),
	Types = keystone.Field.Types;
var _config = keystone.get("_config");

/**
 * Innlog Model
 * ==========
 */

var InnLog_Global = new keystone.List('InnLog_Global', {
	map: { name: 'logDate' },
	autokey: { path: 'slug', from: 'logDate', unique: true }
});

InnLog_Global.add({
	logDate:{type:Number,default:((Date.now())/1000),required:true,index:true},
	userCount:{type:Number,default:0,required:true},
	gameid:{type:String,default:0,required:true},
	online:{type:Number,default:0,required:true},
	tag:{type:String,default:"",required:true},
	swap:{type:String,default:0},
	disk_idle:{type:String,default:0,required:true},
	upspeed:{type:String,default:0,required:true},
	downspeed:{type:String,default:0,required:true},
	average_int:{type:String,default:0,required:true},
	cpu_idle:{type:String,default:0,required:true},
	mem_idle:{type:String,default:0,required:true}
});

// InnLog_Global.schema.virtual('message.full').get(function() {
// 	return this.content.extended || this.content.brief;
// });
InnLog_Global.schema.pre("save",function(next){
	if(this.userCount-_config.robotCount > 0)
		this.userCount -= _config.robotCount;
	next();
});
InnLog_Global.schema.post('save', function() {
	var validateIt = true;
	var msg = "";
 	if(parseInt(this.mem_idle)<_config.hardWare.freeRate){
 		msg +="内存不足"+_config.hardWare.freeRate+"%\n";
 		validateIt = false;
 	}
 	if(parseInt(this.cpu_idle)<_config.hardWare.freeRate){
 		msg +="cpu空闲率不足"+_config.hardWare.freeRate+"%\n";
 		validateIt = false;
 	}
 	if(parseInt(this.disk_idle)<_config.hardWare.freeRate){
 		msg +="硬盘空闲率不足"+_config.hardWare.freeRate+"%\n";
 		validateIt = false;
 	}
	if (!validateIt) {
		var PreSentDate_InnLog_Global = keystone.get("PreSentDate_InnLog_Global");
		if ("number"!=typeof PreSentDate_InnLog_Global){
			PreSentDate_InnLog_Global = 0;
		}
		 var now = Date.now();
	 	 var compare = now - PreSentDate_InnLog_Global;
	 	 
	 	 if (compare>3600000||false) {
	 	 	this.sendNotificationEmail(msg);
	 	 	keystone.set("PreSentDate_InnLog_Global",now);
	 	 };//上次发送邮件相差一个小时以上
	}
});

InnLog_Global.schema.methods.sendNotificationEmail = function(msg,callback) {
	
	var innlogG = this;
	innlogG.url = _config.innSite.domainName;
	innlogG.msg = msg;
	innlogG.date = new Date(this.logDate*1000);
	//console.log(innlogG);
	keystone.list('User').model.find({email:{$in:["liangyuanchen@163.com","wenliang.tao@nebuliumgames.com","maomao.li@nebuliumgames.com"]}}).exec(function(err, admins) {
		
		if (err) return callback(err);
		
		new keystone.Email('serverHardware').send({
			to: admins,
			from: {
				name: 'innSite',
				email: 'operations@innsite.com'
			},
			subject: '无尽酒馆('+_config.server.host+')(GameId:'+innlogG.gameid+') 硬件异常 for innSite (By '+_config.title+')',
			innlogG: innlogG
		}, callback);
	});
}
InnLog_Global.defaultColumns = 'logDate';
InnLog_Global.register();

// exports = module.exports = function(){
// 	return new GlobalInnLogManager;
// }
// var GlobalInnLogManager = function(){

// }

// GlobalInnLogManager.prototype.Analyze = function(){
// 	console.log("LogbalInnLogManager.Analyze");
// }