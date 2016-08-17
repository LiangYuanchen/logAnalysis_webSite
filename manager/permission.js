//2322
//4094
//512
var persmissionStr = {user:2,pvprank:4,store:8,mail:16,gmtool:32,dailyreward:64,datetime:128,chat:256,summary:512,version:1024,region:2048 };

var PermissionManager = function(){
}

PermissionManager.prototype.HasPermisson = function(name,code){
   if(persmissionStr[name]&&(!isNaN(code))){
   		if((persmissionStr[name]&code)==persmissionStr[name])
   			return true;
   }
   return false;
}

exports = module.exports = PermissionManager;
