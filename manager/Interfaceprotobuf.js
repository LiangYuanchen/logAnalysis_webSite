
var fs = require("fs");
var q  = require("protobufjs");
var commonpath = "pbfiles/common/dbinterface.proto";

var Interfaceprotobuf = function(){

}
Interfaceprotobuf.prototype.test = function(data,next){
	
	var builder = q.newBuilder({convertFieldsToCamelCase:true});
	q.loadProtoFile(commonpath,builder);
	
	var gs = builder.build();
	console.log(JSON.stringify(gs));
	var a = gs.DB_GlobalGuild.decode(data);
	console.log(JSON.stringify(a));
	next();
}

exports = module.exports = Interfaceprotobuf;