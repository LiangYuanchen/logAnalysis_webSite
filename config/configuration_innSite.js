var config = {
	subType:{
		buygem:"buygem",
		paid:"paid"
	},
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
		updateUser:["Register","LogOut", "UserBindAccount", "GetHostName","TavernBuyGem", "GuildCrate2", "GuildExit2", "GuildBePermit", "GuildNotify", "LogInLog"],
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
	userStepsTrackKey:["12010000","12000000","12000010","12000020","12000030","1001000","12000130","1001001","12000152","1001002","12000150","1001003","12000045","1001004","12000060","1001005","12000050","1001006","12000085","1001007","12000270","1001008","12000155","1001009","12000180","1002000","12000070","12000080","12000082","1002001","12000260","1002002","1002003","1002004","1002005","1002006","12000210","1002007","12000240","1002008","1002009","12000220","12001000","1003000","1003001","1003002","1003003","1003004","1003005","1003006","12000160","1003007","1003008","1003009","12000170","1004000","1004001","1004002","1004003","1004004","1004005","1004006","1004007","1004008","1004009","12000120","12000091","12000250","12000200","12000140","12000141","12000142","12000190"],
	userStepsTrackValue:["开场战斗","命名酒馆","门外招募","主动招募","开始第一关","1-1","穿装备","1-2","第二次穿装备","1-3","穿套装","1-4","领取成就","1-5","吃经验食物","1-6","做经验食物","1-7","第二次领取成就","1-8","日常任务","1-9","提示穿装备","1-10","奖励关卡1","2-1","做技能食物","吃技能食物","佣兽指引","2-2","商店","2-3","2-4","2-5","2-6","2-7","升级装备","2-8","储藏室","2-9","2-10","竞技场","奖励关卡2","3-1","3-2","3-3","3-4","3-5","3-6","3-7","解锁难度","3-8","3-9","3-10","奥德赛","4-1","4-2","4-3","4-4","4-5","4-6","4-7","4-8","4-9","4-10","结账教学","选冒险者上阵","兑换冒险者","升星教学","合成技能书","学技能","技能图鉴","传奇招募"],
	userStepsTrackWithoutSort:{"12000120":"结账教学","12000091":"选冒险者上阵","12000250":"兑换冒险者","12000200":"升星教学","12000140":"合成技能书","12000141":"学技能","12000142":"技能图鉴",12000190:"传奇招募"},
	tutorialids:[12010000,12000000,12000010,12000020,12000030,12000130,12000150,12000045,12000155,12000060,12000050,12000085,12000270,12000180,12000070,12000080,12000082,12000260,12000210,12000240,12000220,12000160,12001000,12000170,12000120,12000091,12000250,12000200,12000140,12000141,12000142,12000190],
	tutorialnames:['过场动画','命名酒馆','门外招募','主动招募','第一关','穿装备','穿套装','领取成就','提示穿装备','吃经验食物','做经验食物','第二次领取成就','日常任务','奖励关卡1','做技能食物','吃技能食物','佣兽指引','商店','升级装备','储藏室','竞技场','解锁难度','奖励关卡2','奥德赛','结账教学','选冒险者上阵','兑换冒险者','升星教学','合成技能书','学技能','技能图鉴','传奇招募'],
	sessionCount:[]
}
exports = module.exports = config
