
Date.prototype.format = function(format){ 
	if(!format)
		format = "yyyy/MM/dd hh:mm:ss";	
	var self = this;
	if(timezone)
	{
		self = new Date((this/1000+timezone*3600)*1000);
	}
	var o = { 
	"M+" : self.getUTCMonth()+1, //month 
	"d+" : self.getUTCDate(), //day 
	"h+" : self.getUTCHours(), //hour 
	"m+" : self.getUTCMinutes(), //minute 
	"s+" : self.getUTCSeconds(), //second 
	"q+" : Math.floor((self.getUTCMonth()+3)/3), //quarter 
	"S" : self.getUTCMilliseconds() //millisecond 
	} 

	if(/(y+)/.test(format)) { 
	format = format.replace(RegExp.$1, (self.getUTCFullYear()+"").substr(4 - RegExp.$1.length)); 
	} 

	for(var k in o) { 
	if(new RegExp("("+ k +")").test(format)) { 
	format = format.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length)); 
	} 
	} 
	return format ; 
}

var  formatDate = function(val,rows){
	var date = new Date(val*1000);
	return date.format();
}

var  parseUTC = function(strDate){
	if(timezone)
		return (moment.utc(strDate).valueOf() - timezone*3600*1000);
	else
		return moment.utc(strDate).valueOf();
}

var showDailyBegin = function(logDate){
     var Nowdate=new Date(logDate);
     var day = Nowdate.getHours()*60*60*1000+Nowdate.getMinutes()*60*1000+Nowdate.getSeconds()*1000+Nowdate.getMilliseconds();
     var dailyBegin = new Date(Nowdate-day);
     dailyBegin = dailyBegin;
     return dailyBegin;
}
var showDailyEnd = function(logDate){
     var Nowdate=new Date(logDate);
     var day = Nowdate.getHours()*60*60*1000+Nowdate.getMinutes()*60*1000+Nowdate.getSeconds()*1000+Nowdate.getMilliseconds();
     var dailyBegin = new Date(Nowdate-day);
     var dailyEnd = new Date(Date.parse(dailyBegin)+86400000);
     var dailyEnd = dailyEnd;
     return dailyEnd;
}
var showWeekFirstDay = function(logDate)
{
var Nowdate=new Date(logDate);
var day = Nowdate.getHours()*60*60*1000+Nowdate.getMinutes()*60*1000+Nowdate.getSeconds()*1000+Nowdate.getMilliseconds();
var WeekFirstDay=new Date(Nowdate-(Nowdate.getDay()-1)*86400000-day);
WeekFirstDay = WeekFirstDay;
return WeekFirstDay;
}
var showWeekLastDay=function(logDate)
{
var Nowdate=new Date(logDate);
var day = Nowdate.getHours()*60*60*1000+Nowdate.getMinutes()*60*1000+Nowdate.getSeconds()*1000+Nowdate.getMilliseconds();
var WeekFirstDay=new Date(Nowdate-(Nowdate.getDay()-2)*86400000-day);
var WeekLastDay=new Date((WeekFirstDay/1000+6*86400)*1000);
WeekLastDay = WeekLastDay;
return WeekLastDay;
}
var showMonthFirstDay=function(logDate)
{
var Nowdate=new Date(logDate);
var MonthFirstDay=new Date(Nowdate.getYear()+1900,Nowdate.getMonth(),1);
MonthFirstDay = MonthFirstDay;
return MonthFirstDay;
}
var showMonthLastDay=function(logDate)
{
var Nowdate=new Date(logDate);
var MonthNextFirstDay=new Date(Nowdate.getYear()+1900,Nowdate.getMonth()+1,1);
var MonthLastDay=new Date(MonthNextFirstDay);
MonthLastDay = MonthLastDay;
return MonthLastDay;
}