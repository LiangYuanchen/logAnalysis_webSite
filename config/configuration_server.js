var config = {
	title:"本地InnSite",									//网站title
	isServer:true,										//两个nodejs进程，在这里进行区分
	logLevel:"debug",
	serverBase64:"YW5kcm9pZA==",						//IPO需要的服务器IDbase64值
	prefix:"AN",										//通用前缀
	memcacheq:"127.0.0.1:22201",						
	statsd:{
		prefix:"TH_AN.all.",							//statsd前缀
		host:'127.0.0.1',								//statsd服务ip地址
		port:'8125'										//statsd服务端口
	},
	mongo:{
		uri:'mongodb://localhost:27017/innsite'			//mongodb数据库地址
	},
	innSite:{
		host:"",										//网站host
		port:"3000",									//网站端口  两个nodejs进程，这里不能相同
		portLog:"4545",									//server服务器log接收端口
		portGlobal:"4546",								//server服务器sendlog脚本内容接收端口
		portTest:"4548",								
		port_compareInnlog:"4547",						//server服务器compareInnLog.sh脚本内容接收端口
		domainName:"http://115.29.146.38:3000"			//网站domain
	},
	gameids:["1","2","3"],									//服务器连接的逻辑服务器ID
	/////////////////////////////////////////////////////////////////////////////////////
	// mysql:{
	// 	host:'localhost',
	// 	user:'root',
	// 	password:'dmtlyc8220',
	// 	database:'infiniteinn'
	// },
	//countrys:[	"CN",	"PH",	"US",	"AU",	"NL",	"KR",	"GB",	"NO",	"BD",	"MY",	"SE",	"SG",	"PK",	"RU",	"DK",	"HK",	"NZ",	"KW",	"CA",	"SY",	"ID",	"PR", "BE",	"FI",	"DE",	"VN",	"TH",	"MX",	"TW",	"MT",	"JP",	"BS",	"KZ",	"LT",	"BN",	"SR",	"BR",	"KH",	"PL",	"GR",	"FR",	"ES",	"UA",	"CH",	"SA",	"IR", "HU",	"IT",	"PT",	"BG",	"IE",	"IQ",	"LR",	"QA",	"SD"	],
	//countrys:["CN","Not_CN"],
	baseDataFilePath:"./baseData/",
	errorShowLimit:10,
	isTest:false,
	isCron:false,
	isLive:false,
	IPO_SYNC:true,
	whoisesize:50,
	distinguishCountry:true,//区分国别计算结果	
	countrys:[],
	dayLeft:{
		length:30
	},
	robotCount:1000,
	server:{
		host:"114.215.101.221",//114.215.101.221 172.30.0.97 127.0.0.1
		//host:"127.0.0.1",
		//host:"172.30.0.97",
		//host:"172.30.0.102",
		//host:"127.0.0.1",172.30.0.98 172.30.0.99 172.30.0.104
		checkHost:["114.215.101.221:843"],//[114.215.101.221:843] ["172.30.0.98:5003","172.30.0.99:5003"] ["172.30.0.101:2015"]
		//checkHost:["127.0.0.1:843"],
		//checkHost:["172.30.0.101:5003","172.30.0.101:5013","172.30.0.101:5023","172.30.0.101:5033"],
		//checkHost:["172.30.0.98:5003","172.30.0.99:5003"],
		hostLog:"",
		hostGlobal:"",
		portMonitor:"843"
		//portMonitor:"5003"
	},
	logTime:{ 
		sessionCountBase:1,
		logTimeBase:0//0
	},
	uidFilter:[
	],
	hardWare:{
		freeRate:10
	},
	CurrencyRatio:1	
}
exports = module.exports = config
