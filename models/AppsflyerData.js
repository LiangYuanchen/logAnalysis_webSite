var keystone = require('keystone'),
	Types = keystone.Field.Types;
var uuid = require('node-uuid');
var _config = keystone.get("_config");



var AppsflyerData = new keystone.List('AppsflyerData', {
	map: { name: 'timeStamp' }
});

AppsflyerData.add({
	strData:{type:String},//ios
	timeStamp:{type:Number, index:true, default:Date.now()/1000},
	device_type:{type:String},
	download_time:{type:Types.Date},
	click_time:{type:Types.Date},
	ip:{type:String},
	cost_per_install:{type:String, default:null},
	is_retargeting:{type:Boolean},
	app_name:{type:String},
	re_targeting_conversion_type:{type:String, default:null},
	city:{type:String},
	af_sub1:{type:String, default:null},
	idfv:{type:String},
	af_sub2:{type:String, default:null},
	af_sub3:{type:String, default:null},
	af_sub4:{type:String, default:null},
	customer_user_id:{type:String},
	mac:{type:String, default:null},
	af_sub5:{type:String, default:null},
	currency:{type:String, default:""},
	install_time:{type:Types.Date},
	event_time:{type:Types.Date},
	platform:{type:String},
	sdk_version:{type:String},
	appsflyer_device_id:{type:String},
	device_name:{type:String},
	wifi:{type:Boolean},
	media_source:{type:String},
	country_code:{type:String},
	http_referrer:{type:String},
	idfa:{type:String},
	click_url:{type:String},
	language:{type:String},
	app_id:{type:String},
	app_version:{type:String},
	attribution_type:{type:String},
	af_siteid:{type:String, default:null},
	os_version:{type:String},
	event_type:{type:String},
	af_ad:{type:String},
	af_ad_id:{type:String},
	af_ad_type:{type:String},
	af_adset:{type:String},
	af_adset_id:{type:String},
	af_c_id:{type:String},
	af_channel:{type:String},
	af_cost_currency:{type:String},
	af_cost_model:{type:String},
	af_cost_value:{type:String},
	af_keywords:{type:String},
	device_model:{type:String},//android
	operator:{type:String, default:null},
	agency:{type:String, default:null},
	imei:{type:String},
	android_id:{type:String},
	campaign:{type:String},
	event_name:{type:String},
	advertising_id:{type:String},
	carrier:{type:String, default:null},
	device_brand:{type:String}
});
AppsflyerData.schema.add({
	event_value: {
		type:{
				af_revenue:{type:Number},
				af_currency:{type:String, default:null},
				af_content_id:{ type:String},
				af_content_type:{ type:String}
		}, default:""
	}


});

AppsflyerData.defaultColumns = 'timeStamp';
AppsflyerData.register();
