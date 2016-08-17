var fs = require("fs");

var logdir = "./logs/";
var writeStream = null;
var filename = "";
var syslog = function()
{
}

require("./manager/util/datetime");
syslog.prototype.writeLog = function(data){
	//var filename =logdir+ (new Date()).format("yyyy-MM-dd")+".log";
	//fs.appendFileSync(filename,new Date()+"####\n" + data+"\n");
}
module.exports = new syslog();