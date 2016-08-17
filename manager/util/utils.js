var keystone = require("keystone");
var hasProp = Object.prototype.hasOwnProperty;
var utils = module.exports ;
var _ = require('underscore');
var _config = keystone.get("_config");
var winston  = require("winston");
var config_timezone = require("../../config/configuration_timezone");
var moment = require("moment");
var fs = require("fs");
utils.quest_finishType = {
	win:0,
	lost:1,
	exit:2
}
utils.questElite_finishType = {
	win:0,
	lost:1,
	exit:2
}
utils.quest_challengeStar = {
	normal:1,
	hard:2,
	hell:3
}
utils.getBsonOfCountry = function(country,sql)
{
	if(country=="Not_CN")
        sql.country = {$ne:"CN"};
    else if(country)
        sql.country = country;
    return sql;
}
utils.getDateByString = function(str)
{
  var self = this;
  var date = str;
  if(str.indexOf("/")>-1)
  {
    var strArr = str.split("/");
    date = strArr[2]+"-"+strArr[0]+"-"+strArr[1];
  }
  return self.parseDate(date);
}
utils.parseDate = function(strDate){
	var result = 0;
	var _config = keystone.get("_config") || 0;
	var timezone = parseInt(_config.timezone) || 0;
	if(!isNaN(timezone))
		result = (moment(strDate).utc(strDate).valueOf() - timezone*3600*1000);
	else
		result = moment(strDate).utc(strDate).valueOf();
	
	console.log("parseDate:%s",new Date(result));
	return result/1000;
}
utils.getRequest = function(url,paras)
{
    var paraString = url.split("&");
    var paraObj = {}
    for (i=0; j=paraString[i]; i++){
    paraObj[j.substring(0,j.indexOf("=")).toLowerCase()] = j.substring(j.indexOf("=")+1,j.length);
    }
    var returnValue = paraObj[paras.toLowerCase()];
    if(typeof(returnValue)=="undefined"){
    return "";
    }else{
    // if(returnValue.indexOf('#')>-1)
    //     returnValue = returnValue.substring(0,returnValue.indexOf('#'));
    return returnValue;
    }        
}
utils.clearFeedbacklist = function (feedbackiplist)
{
    var overdue = 60*5;
    var feedbackiplist = keystone.get("feedbackiplist");
    var now = Date.now()/1000;
    _.each(feedbackiplist,function(feedbackip){
        if((now - feedbackip.date) > overdue )
            feedbackip.count = 0;
    });
}

utils.getFeedbacklist = function ()
{
    return keystone.get("feedbackiplist");
}

utils.saveFeedbacklist = function (feedbackiplist)
{
    keystone.set("feedbackiplist",feedbackiplist);
}

utils.getFeedbackByIp = function (uid)
{
    var feedbackiplist = keystone.get("feedbackiplist");
    if(!feedbackiplist)
    {
        feedbackiplist = {};
        utils.saveFeedbacklist(feedbackiplist);
    }
        
    if(!feedbackiplist[uid])
    {
        feedbackiplist[uid] = {date:Date.now()/1000};
        utils.saveFeedbacklist(feedbackiplist);
    }
    return feedbackiplist[uid];
}  
function throwsMessage(err) {
	return '[Throws: ' + (err ? err.message : '?') + ']';
}

//下面是64个基本的编码
var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var base64DecodeChars = new Array(
-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
-1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);
//编码的方法
function base64encode(str) {
var out, i, len;
var c1, c2, c3;
len = str.length;
i = 0;
out = "";
while(i < len) {
c1 = str.charCodeAt(i++) & 0xff;
if(i == len)
{
out += base64EncodeChars.charAt(c1 >> 2);
out += base64EncodeChars.charAt((c1 & 0x3) << 4);
out += "==";
break;
}
c2 = str.charCodeAt(i++);
if(i == len)
{
out += base64EncodeChars.charAt(c1 >> 2);
out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
out += base64EncodeChars.charAt((c2 & 0xF) << 2);
out += "=";
break;
}
c3 = str.charCodeAt(i++);
out += base64EncodeChars.charAt(c1 >> 2);
out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >>6));
out += base64EncodeChars.charAt(c3 & 0x3F);
}
return out;
}
//解码的方法
function base64decode(str) {
var c1, c2, c3, c4;
var i, len, out;
len = str.length;
i = 0;
out = "";
while(i < len) {

do {
c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
} while(i < len && c1 == -1);
if(c1 == -1)
break;

do {
c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
} while(i < len && c2 == -1);
if(c2 == -1)
break;
out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));

do {
c3 = str.charCodeAt(i++) & 0xff;
if(c3 == 61)
return out;
c3 = base64DecodeChars[c3];
} while(i < len && c3 == -1);
if(c3 == -1)
break;
out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));

do {
c4 = str.charCodeAt(i++) & 0xff;
if(c4 == 61)
return out;
c4 = base64DecodeChars[c4];
} while(i < len && c4 == -1);
if(c4 == -1)
break;
out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
}
return out;
}

function safeGetValueFromPropertyOnObject(obj, property) {
	if (hasProp.call(obj, property)) {
		try {
			return obj[property];
		}
		catch (err) {
			return throwsMessage(err);
		}
	}

	return obj[property];
}
function strArr2intArr(strArr)
{
	var intArr=[];
	_.each(strArr,function(str){
		if(isNaN(str))
			winston.error("strArr2intArr error,strArr:%s",JSON.stringify(strArr));
		else
			intArr.push(parseInt(str));
	});
	return intArr;
}
function ensureProperties(obj) {
	var seen = [ ]; // store references to objects we have seen before

	function visit(obj) {
		if (obj === null || typeof obj !== 'object') {
			return obj;
		}

		if (seen.indexOf(obj) !== -1) {
			return '[Circular]';
		}
		seen.push(obj);

		if (typeof obj.toJSON === 'function') {
			try {
				return visit(obj.toJSON());
			} catch(err) {
				return throwsMessage(err);
			}
		}

		if (Array.isArray(obj)) {
			return obj.map(visit);
		}

		return Object.keys(obj).reduce(function(result, prop) {
			// prevent faulty defined getter properties
			result[prop] = visit(safeGetValueFromPropertyOnObject(obj, prop));
			return result;
		}, {});
	};

	return visit(obj);
}
utils.stringify = function(data){
	return JSON.stringify(ensureProperties(data));
}

utils.combinations = function(set) {
  return (function acc(xs, set) {
    var x = xs[0];
    if(typeof x === "undefined")
      return set;
    for(var i = 0, l = set.length; i < l; ++i)
      set.push(set[i].concat(x));
    return acc(xs.slice(1), set);
  })(set, [[]]).slice(1);
};
utils.showErr = function(err){

	if (err) {
		if (err.name == 'ValidationError') {
			for (field in err.errors) {
			  winston.error(JSON.stringify(err.errors[field]));
			}
		} else {
		// A general error (db, crypto, etc…)
			 winston.error(JSON.stringify(err));
		}
	}
}
utils.GetSerial_No = function(next){
	var no = 0;
	fs.readFile("./config/serial_no", function(err, data){
		utils.showErr(err);
		no = parseInt(data) || 0;
		no++;

		fs.writeFile("./config/serial_no", no,function(err){
			utils.showErr(err);
			next(no);
		});
	});
}

//根据渠道获取订单单号
utils.GetOrder_ID = function(channel,msg)
{
	var self = this;
	var arrMsg = msg.split(",");
	if(channel == "2")//android
	{
		try{
			orderid = JSON.parse( arrMsg[5]+"}").orderId;
		}
		catch(err){
			try{
				orderid = JSON.parse( arrMsg[2]+"}").orderId;
			}
			catch(err)
			{
				try{
					orderid = JSON.parse( arrMsg[4]+"}").orderId;
				}
				catch(err)
				{
					try{
						orderid = JSON.parse( arrMsg[3]+"}").orderId;
					}
					catch(err)
					{
						self.showErr(err);
						winston.error("#utils#insertPayingInfo error,err:%s,the message:%s",arrMsg[5]+"\"}",msg);
						return undefined;						
					}
				}
			}
		}
		return orderid;
	}
	return "";
}
utils.GetProduct_ID = function(channel,msg)
{
	var arrStr = msg.split(",");
	//数据在第五个json里面，把第五个json拿出来很困难
	if(channel == "2")
	{
		var ob = msg.substring(msg.indexOf("productId") + 12).split(",")[0];
		ob = ob.substring(0,ob.length -1);
		return ob;
	}
	return "";
}
utils.GetProduct_Price = function(channel,msg){
	var arrStr = msg.split(",");
	if(channel == "2")
	{
		var money = parseFloat(msg.substring(msg.indexOf('$')+1).split(',')[0]);
		return money;
	}
	return 0;
}

utils.GetZoneTm = function(logdate,timezone)
{
	return logdate += parseFloat(timezone) * 3600;
}

utils.GetZoneTmHours = function(logdate)
{
	return new Date(logdate*1000).getUTCHours();
}

utils.GetTimeZoneByCountry = function(country)
{
	return config_timezone[country];
}
utils.GetLevels = function(innExp,innLevelMaxExps)
{
  var self = this;
  var map_maxExps = _.values(innLevelMaxExps);
  var map_level = _.keys(innLevelMaxExps);
  if(map_maxExps[0]>=innExp)
    return map_level[0];
  for(var i=1;i<map_maxExps.length;i++)
  {
    if(innExp<=map_maxExps[i])
    {
      return map_level[i];
    }
  }
}
utils.constantType = {
	quest:1000000
};
utils.getType = function(typeid)
{
	return typeid<10000000? parseInt(typeid/100000)*100000:parseInt(typeid/1000000)*1000000;
}
utils.GetVipLevel = function(gembuytotoal,viplevels)
{
	var map_maxGems = _.values(viplevels);
	var map_viplevel = _.keys(viplevels);
	for(var i=0;i<map_maxGems.length;i++)
	{
		if(gembuytotoal<=map_maxGems[i])
		{
			return map_viplevel[i];
		}
	}
}

utils.strArr2intArr	   = strArr2intArr;
utils.base64encode     = base64encode;
utils.base64decode     = base64decode;
utils.ensureProperties = ensureProperties;
