var winstonBase = require("winston");
var keystone = require("keystone");
var _config = keystone.get("_config");
var winston = null;
if(winston==null)
{
	winston = new (winstonBase.Logger)({
		transports:[
			new(winstonBase.transports.File)({
			    filename: './logs/logs-backup.log',
			    handleExceptions: true,
			    level:_config.logLevel,
			    timeStamp:true,
			    json:false			
			}),
		]
	});	
	winston.handleExceptions(new winstonBase.transports.File({ filename: './logs/exceptions-backup.log' }));
}

exports = module.exports = winston;