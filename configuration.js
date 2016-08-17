var config = {
	title:"本地InnSite",									//网站title
	isServer:false,
	isPhase:true,							//两个nodejs进程，在这里进行区分
	logLevel:"debug",
	serverBase64:"YW5kcm9pZA==",						//IPO需要的服务器IDbase64值
	prefix:"AN",								//通用前缀
	memcacheq:"",//memcacheq:"127.0.0.1:22201",
	timezone:8,
	momentTimezone:"Asia/Shanghai",//UTC
	statsd:{
		prefix:"TH_AN.all.",							//statsd前缀
		host:'127.0.0.1',								//statsd服务ip地址
		port:'8125'										//statsd服务端口
	},
	mongo:{
		uri:'mongodb://innsite:innsite@101.201.52.205:27017/innsite'			//mongodb数据库地址
		//uri:'mongodb://127.0.0.1:27017/innsite'			//mongodb数据库地址
	},
	innSite:{
		host:"http://127.0.0.1:3000",										//网站host
		port:"3000",									//网站端口  两个nodejs进程，这里不能相同
		portLog:"4545",              					//server服务器log接收端口
		portGame:"4548",
		portBase:"4547",
		portOther:"4546",
		portCplusplus:"4755",
		ipBase:"127.0.0.1",
		ipGame:"127.0.0.1",
		ipOther:"127.0.0.1",
		ipCplusplus:"127.0.0.1",
		isGame:false,
		isOther:true,
		isBase:false,
		isWorld:true,
		isCplusplus:true,
		domainName:"http://115.29.146.38:3000"			//网站domain
	},
	gameids:["1","2","3"],									//服务器连接的逻辑服务器ID
	/////////////////////////////////////////////////////////////////////////////////////
	mysql:{
		isopen:true,
		host:'127.0.0.1',
		user:'root',
		password:'dmtlyc8220',
		database:'infiniteinn'
	},
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
		summaryHost:"0.0.0.0",
		hostLog:"",
		hostGlobal:"",
		portMonitor:"843"
		//portMonitor:"5003"
	},
	logTime:{
		sessionCountBase:1,
		logTimeBase:0//0
	},
	subType:{
		buygem:"buygem",
		paid:"paid"
	},
	hardWare:{
		freeRate:10
	},
	CurrencyRatio:1,
	logType:{
		gemBuy:"BuyGemReq",
		mgrErr:"MgrErr",
		handlerErr:"HandlerErr",
		register:"Register",
		statistical:"Statistical",
		shopRefresh:"ShopRefresh",
		advSummon:"AdvSummon",
		fameShopPurchase:"FameShopPurchase",
		tutorial:"Tutorial",
		advSummon:"AdvSummon",
		shopPurchase:["GemShopPurchase"],
		quickFinish:["SmithMakeFinish","SmithStrongFinish","DishCookFinish"],
		TavernBuyEnergy:"TavernBuyEnergy",
		ListRefresh:["NormalShopRefresh","OdysseyShopRefresh","PvPShopRefresh","CoinShopRefresh","BlackShopRefresh"],
		EquipReplenish:"EquipReplenish",
		getHostName:"GetHostName",
		LogOut:"LogOut",
		userBindAccount:"UserBindAccount",
		logTime:"logTime",
		heartbeat:"HeartBeat",
		buygem:["TavernBuyGem"],
		updateUser:["Register","LogOut", "UserBindAccount", "GetHostName","TavernBuyGem", "GuildCrate2", "GuildExit2", "GuildBePermit", "GuildNotify", "LogInLog", "RegisterLog", "QuestFinish", "QuestEliteFinish","RevengeFinish","PvPFinish","BePvPFinish","PvPGet","Statistical","TavernBuyGem"],
		guildWar:["GWRegister2","GWMatch","GWRw"]
	},
	paidContentLogType:[],
	logTypeID:{
		msgErr:"9",
		handlerErr:"10"
	},
	phaseStatistical:{
		countConfig : {series:["AllUserCount","LogOnCount","AllLogOnCount","AvgLogOnCount","NewUserCount","ActiveUserCount","AvgOnlineCount","LossUserCount"],
		title:"运营数据",
		subtitle:"星云素",
		ytitle:"数量 （个）",
		name:"countC"
		},
		goldAll:{series:["GoldGet","GoldCost"],
		title:"金币总收支",
		subtitle:"星云素",
		ytitle:"数量 （个）",
		name:"GoldAll"
		},
		goldAllPaidMan:{series:["GoldGetPaidMan","GoldCostPaidMan"],
		title:"付费金币总收支",
		subtitle:"星云素",
		ytitle:"数量 （个）",
		name:"GoldAllPaidMan"
		},
		gemBuyGemOther:{series:["GemGet","GemCost"],
		title:"宝石总收支",
		subtitle:"星云素",
		ytitle:"数量 （个）",
		name:"GemBuyOtherC"
	    },
	    gemGetGembuy:{
	    	series:["GemGet","GemConsumed"],
	    	title:"付费占比",
	    	subtitle:"星云素",
	    	ytitle:"数量",
	    	name:"GemGetBuyC"
	    },
		gemBuyGemOtherPaidMan:{series:["GemGetPaidMan","GemCostPaidMan"],
		title:"宝石总收支",
		subtitle:"星云素",
		ytitle:"数量 （个）",
		name:"GemBuyOtherPaidManC"
	    },
	    gemGetGembuyPaidMan:{
	    	series:["GemGetPaidMan","GemConsumedPaidMan"],
	    	title:"付费占比",
	    	subtitle:"星云素",
	    	ytitle:"数量",
	    	name:"GemGetBuyPaidManC"
	    },
	    sweepTicketConfig:{series:["SweepTicketGet","SweepTicketCost"],
		title:"扫荡券",
		subtitle:"",
		ytitle:"数量 （个）",
		name:"sweepTicketC"
	    },
		paidboughtConfig:{series:["BuyGemBuy","BuyGemOther","SubGemBuy","SubGemOther"],
		title:"宝石收支",
		subtitle:"星云素",
		ytitle:"数量 （个）",
		name:"GemC"
		},
		logConfig : {series:["LogOn","LogOut","Register"],
		title:"登录注册",
		subtitle:"星云素",
		ytitle:"数量 （个）",
		name:"logC"
		},
		pvpConfig : {series:["PvP","PvPFinish","PvPCount","PvPAvg","Revenge"],
		title:"PvP",
		subtitle:"星云素",
		ytitle:"数量 （个）",
		name:"pvpC"
		},
		advConfig : {series:["AdvOut","AdvIn","AdvEat","AdvGene","AdvLearnSkill","AdvSummon","AdvUpWeapon","AdvUpArmor","AdvUpItem","AdvUpSkill","AdvSetPvP","AdvUpStar","AdvLvUp","AdvUpEquipSet"],
		title:"冒险者",
		subtitle:"星云素",
		ytitle:"数量 （个）",
		name:"advC"
		},
		familiarConfig :{series:["FamiliarEat","FamiliarUpSkill"],
		title:"佣兽",
		subtitle:"星云素",
		ytitle:"数量 （个）",
		name:"familiarC"
		},
		payConfig : {series:["AllPayUsers","GemConsumed","PayUsers","PerPayOfUsers","PerPayOfActiveUsers","PayDegree","PayDegreeAvg","Conversion","NewUserConversion"],
		title:"支付",
		subtitle:"星云素",
		ytitle:"数量或百分比",
		name:"payC"
		},
		otherConfig : {series:["ChapterUnlock","TaskUp"],
		title:"其他",
		subtitle:"星云素",
		ytitle:"数量 （个）",
		name:"otherC"
		},
		dishConfig : {series:["DishCook","DishCookFinish","DishCookCancel"],
		title:"做饭",
		subtitle:"星云素",
		ytitle:"数量 （个）",
		name:"dishC"
		},
		questConfig : {series:["QuestStart","QuestFinish","QuestAbandon","QuestResetCount","QuestEliteFinish","QuestEliteReset","QuestRewardStart","QuestRewardFinish","QuestUnlock","QuestSweep"],
		title:"副本",
		subtitle:"星云素",
		ytitle:"数量 （个）"	,
		name:"questC"
		},
		roomConfig : {series:["RoomUnlockSkill","RoomAdd"],
		title:"房间",
		subtitle:"星云素",
		ytitle:"数量 （个）"	,
		name:"roomC"
		},
		smithConfig : {series:["SmithMakeStart","SmithMakeFinish","SmithMakeCancel","SmithStrongStart","SmithStrongFinish","SmithDecompose","SmithStrongCancel"],
		title:"铁匠",
		subtitle:"星云素",
		ytitle:"数量 （个）",
		name:"smithC"
		},
		storageConfig : {series:["StorageSell","StorageDiffDay","StorageAdd","StorageRemove","StorageTakeOut"],
		title:"仓库",
		subtitle:"星云素",
		ytitle:"数量 （个）",
		name:"storageC"
		},
		tavernConfig : {series:["ItemAdd","ItemRemove"],
		title:"道具",
		subtitle:"星云素",
		ytitle:"数量 （个）",
		name:"tavernC"
		},
		itemConfig : {series:["TavernUpEnergy","TavernBuyGem","TavernLvUp"],
		title:"酒馆",
		subtitle:"星云素",
		ytitle:"数量 （个）",
		name:"itemC"
		},
		storeConfig : {series:["NormalShopRefresh","OdysseyShopRefresh","PvPShopRefresh","CoinShopRefresh","GemShopPurchase","CoinShopPurchase","PvPCoinShopPurchase","OdysseyCoinShopPurchase","FameShopPurchase"],
		title:"商店",
		subtitle:"星云素",
		ytitle:"数量 (个)",
		name:"shopC"
		},
		mailConfig : {series:["MailNew","MailRemove","MailTake"],
		title:"邮件",
		subtitle:"星云素",
		ytitle:"数量 （个)",
		name:"mailC"
		}
	},
	userStepsTrackKey:["12010000","12000000","12000010","12000020","12000030","1001000","12000130","1001001","12000152","1001002","12000151","1001003","12000060","1001004","12000045","1001005","12000050","1001006","12000085","12000250","1001007","12000270","1001008","12000155","1001009","12000180","1002000","12000070","12000080","1002001","1002002","1002003","12000210","1002004","1002005","1002006","1002007","12000260","12000240","1002008","1002009","12000220","12001000","1003000","1003001","1003002","1003003","1003004","1003005","1003006","12000160","1003007","1003008","1003009","12000170","1004000","1004001","1004002","1004003","1004004","1004005","1004006","1004007","1004008","1004009","12000120","12000200","12000140","12000141","12000142","12000400","12000410","12000420","12000221","12000222"],
	userStepsTrackValue:["开场战斗","命名酒馆","门外招募","主动招募","开始第一关","1-1","第一次穿装备","1-2","第二次穿装备","1-3","套装效果","1-4","喝啤酒","1-5","领取成就","1-6","做啤酒","1-7","领取100声望","兑换冒险者","1-8","每日任务","1-9","穿装备提醒","1-10","第一次奖励关卡","2-1","做面包","吃面包","2-2","2-3","2-4","升级装备","2-5","2-6","2-7","2-8","商店","储藏室","2-9","2-10","竞技场","奖励关卡2","3-1","3-2","3-3","3-4","3-5","3-6","3-7","解锁难度","3-8","3-9","3-10","奥德赛","4-1","4-2","4-3","4-4","4-5","4-6","4-7","4-8","4-9","4-10","结账教学","升星教学","合成技能书","学技能","技能图鉴","公会","公会贡献","公会Boss","解锁竞技场第二组阵容","解锁竞技场第三组阵容"],
	userStepsTrackWithoutSort:{"12000120":"结账教学","12000200":"升星教学","12000140":"合成技能书","12000141":"学技能","12000142":"技能图鉴","12000400":"公会","12000410":"公会贡献","12000420":"公会Boss","12000221":"解锁竞技场第二组阵容","12000222":"解锁竞技场第三组阵容"},
	tutorialids:[12010000,12000000,12000010,12000020,12000030,1001000,12000045,1001001,12000060,1001002,1001003,12000050,1001004,1001005,12000070,12000080,12000082,1001006,12000085,1001007,1001008,1001009,12000180,1002000,1002001,12000210,1002002,1002003,12000260,1002004,12000240,1002005,1002006,1002007,12000270,1002008,1002009,12000220,12001000,1003000,1003001,1003002,1003003,1003004,1003005,1003006,12000160,1003007,1003008,1003009,12000170,1004000,1004001,1004002,1004003,1004004,1004005,1004006,1004007,1004008,1004009,12000120,12000091,12000250,12000200,12000140,12000141,12000142,12000400,12000410,12000420,12000221,12000222],
	tutorialnames:["开场战斗","命名酒馆","门外招募","主动招募","开始第一关","1-1","领取成就","1-2","吃经验食物","1-3","1-4","做经验食物","1-5","1-6","做技能食物","吃技能食物","佣兽指引","1-7","第二次领取成就","1-8","1-9","1-10","奖励关卡1","2-1","2-2","升级装备","2-3","2-4","商店","2-5","储藏室","2-6","2-7","2-8","日常任务","2-9","2-10","竞技场","奖励关卡2","3-1","3-2","3-3","3-4","3-5","3-6","3-7","解锁难度","3-8","3-9","3-10","奥德赛","4-1","4-2","4-3","4-4","4-5","4-6","4-7","4-8","4-9","4-10","结账教学","选冒险者上阵","兑换冒险者","升星教学","合成技能书","学技能","技能图鉴","公会","公会贡献","公会Boss","解锁竞技场第二组阵容","解锁竞技场第三组阵容"],
	sessionCount:[],
	uidFilter:[
	]
}
exports = module.exports = config