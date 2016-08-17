function gettab(language)
{
	var $tab = $("<div title='"+language+"' style='padding:20px;'></div>");

	var $contents = $(".jumbotron").contents(".temlateActivity1ByLanguage") ;
	$contents = $contents.clone(true);
	$contents.css("display","block");
	$tab.append($contents);
	return $tab;
}

function addNewLanguageTab(self){
	var language =  $(self).parent().contents(".language").val();
	var base = $(self).parent().parent().next(".language_tab");

	var basePP = base.tabs("getTab","EN");
	var $tab = $("");
	if(basePP)
	{
		$tab = $(basePP).children();
		$tab = $tab.clone(true);
		$tab.attr("title",language);
	}
	else
		$tab = gettab(language);
	base.tabs("add",{
		title:language,
		selected:true,
		closable:true
	})
	var pp = base.tabs('getSelected');
	pp.append($tab);
}
function txtadd(self){
	var strFrom = $(self).prev().val().replace(/"/g,"\\\"");
	if(!strFrom)
	{
		return;
	}

	var warp = "<p><a class=\"del\" value=\""+strFrom+"\" onclick=\"txtdel(this)\" >x</a>\n"+strFrom+"</p>";

	$(self).parent().append(warp);
}
function txtdel(self){
	$(self).parent().remove();
}

function syncSubcontent(self){
	
}

function warpadd(self){
	var $warp = $(".jumbotron").contents(".templateActivitySub");
	$warp = $warp.clone(true);
	$warp.css("display","block");
	var intTypeid =  $(self).parent().find(".templateActivitySub").length;
	intTypeid ++;
	$warp.find(".typeid").text("typeId:"+intTypeid).val(intTypeid);
	$(self).parent().append($warp);
	return $warp;
}
function contentadd(self){
	var strFrom = $(self).parent().prev().contents(".content").val();

	var warp = "<p><a class=\"del\" value=\""+strFrom+"\" onclick=\"txtdel(this)\" >x</a>\n"+strFrom+"</p>";
	$(self).parent().next().contents(".warp_content").append(warp);
}
function delAllReq(self){
	var tabs = $(self).closest(".language_tab").tabs("tabs");
	var typeid = $(self).closest(".templateActivitySub").find(".typeid").text();
	var index = $(self).parent().index();
	_.each(tabs,function(tab){
		var tab = tab[0];
		var length = $(tab).find(".templateActivitySub").length;
		for(var i=0;i<length;i++)
		{
			var sub_warp = $(tab).find(".templateActivitySub")[i];
			if($(sub_warp).find(".typeid").text()==typeid)
			{
				$($(sub_warp).find(".warp_req").children()[index]).find(".del").parent().remove();
				break;
			}
		}
	});
}
function delAllReward(self){
	var tabs = $(self).closest(".language_tab").tabs("tabs");
	var typeid = $(self).closest(".templateActivitySub").find(".typeid").text();
	var index = $(self).parent().index();
	_.each(tabs,function(tab){
		var tab = tab[0];
		var length = $(tab).find(".templateActivitySub").length;
		for(var i=0;i<length;i++)
		{
			var sub_warp = $(tab).find(".templateActivitySub")[i];
			if($(sub_warp).find(".typeid").text()==typeid)
			{
				$($(sub_warp).find(".warp_reward").children()[index]).find(".del").parent().remove();
				break;
			}
		}
	});

}
function reqaddAll(self){
	var strFrom1 = $(self).parent().prev().contents(".req1").val();
	var strFrom2 = $(self).parent().prev().contents(".req2").val();
	var strFrom = strFrom1+"$&"+strFrom2;
	var warp = "<p class='p2' ><a class=\"del reqdel\" value=\""+strFrom+"\" onclick=\"delAllReq(this)\" >x</a>\n"+strFrom1+" "+strFrom2+"</p>";

	var tabs = $(self).closest(".language_tab").tabs("tabs");
	var typeid = $(self).closest(".templateActivitySub").find(".typeid").text();
	_.each(tabs,function(tab){
		var tab = tab[0];
		var length = $(tab).find(".templateActivitySub").length;
		for(var i=0;i<length;i++)
		{
			var sub_warp = $(tab).find(".templateActivitySub")[i];
			if($(sub_warp).find(".typeid").text()==typeid)
			{
				$(sub_warp).find(".warp_req").append(warp);	
				break;
			}
		}
	});	

	
}
function rewardaddAll(self){
	var itemid = $(self).parent().prev().contents(".itemid").val();
	var amount = $(self).parent().prev().contents(".amount").val();
	var warp = "<p class='p2' ><a class=\"del rewarddel\" value=\""+itemid+"$&"+amount+" \" onclick=\"delAllReward(this)\" >x</a>\n"+itemid+"  x"+amount+"</p>";

	var tabs = $(self).closest(".language_tab").tabs("tabs");
	var typeid = $(self).closest(".templateActivitySub").find(".typeid").text();
	_.each(tabs,function(tab){
		var tab = tab[0];
		var length = $(tab).find(".templateActivitySub").length;
		for(var i=0;i<length;i++)
		{
			var sub_warp = $(tab).find(".templateActivitySub")[i];
			if($(sub_warp).find(".typeid").text()==typeid)
			{
				$(sub_warp).find(".warp_reward").append(warp);	
				break;
			}
		}
	});	
}

function reqadd(self){
	var strFrom1 = $(self).parent().prev().contents(".req1").val();
	var strFrom2 = $(self).parent().prev().contents(".req2").val();
	var strFrom = strFrom1+"$&"+strFrom2;
	var warp = "<p class='p2' ><a class=\"del reqdel\" value=\""+strFrom+"\" onclick=\"delAllReq(this)\" >x</a>\n"+strFrom1+" "+strFrom2+"</p>";
	$(self).parent().next().contents(".warp_req").append(warp);	
}
function rewardadd(self){
	var itemid = $(self).parent().prev().contents(".itemid").val();
	var amount = $(self).parent().prev().contents(".amount").val();
	var warp = "<p class='p2' ><a class=\"del rewarddel\" value=\""+itemid+"$&"+amount+" \" onclick=\"delAllReward(this)\" >x</a>\n"+itemid+"  x"+amount+"</p>";

	$(self).parent().next().contents(".warp_reward").append(warp);
}
function initData(data_parm)
{
	var results=[];
	if(!data_parm||!data_parm.header)
	{
		return results;
	}
	_.each(data_parm.header,function(header){
		var data= {};
		data.language = header.language;
		data.title = header.title;
		data.helptext = header.helptext;
		data.content = header.content;
		data.isopen = data_parm.switch.isopen;
		data.start = data_parm.switch.start;
		data.end = data_parm.switch.end;
		if(data_parm.normalactivity)
		{
			data.typeid=data_parm.normalactivity.typeid;
			data.weight = data_parm.normalactivity.weight;
			if(data_parm.normalactivity.normalacts&&data_parm.normalactivity.normalacts.length>0)
			{
				var normalact = _.find(data_parm.normalactivity.normalacts,function(parm){
					return parm.language == data.language;
				});
				if(normalact)
				{
					data.pic = normalact.pic;
					data.text = normalact.text;
				}
			}
		}
		if(data_parm.subcontents)
		{
			data.subcontents = [];
			_.find(data_parm.subcontents,function(subcontent){
				var the_subcontent = {};	
				var subtexts = _.filter(subcontent.subtext,function(subtext){
					return subtext.language == data.language;
				});

				var hasFound = false;
				_.each(subtexts,function(subtext){
					hasFound = true;

					if(!the_subcontent.contents)
						the_subcontent.contents= [];
					the_subcontent.contents.push(subtext.content);
				});


				if(hasFound)
				{
					the_subcontent.req = subcontent.req;
					the_subcontent.rewards = subcontent.rewards;
					data.subcontents.push(the_subcontent);
				}


			});
		}
		results.push(data);
	});
	return results;
}

function loadActivityTab(strId,data)
{
	var parms = initData(data);
	if(parms.length>0)
	{
		var parm1 = parms[0];
		$("#"+strId+" .weight").val(parm1.weight);
		$("#"+strId+" .start").datetimebox("setText",formatDate(parm1.start));
		$("#"+strId+" .end").datetimebox("setText",formatDate(parm1.end));
		if(parm1.isopen)
			$("#"+strId+" .isopen").attr("checked","checked");
	}
	_.each(parms,function(parm){
		$("#"+strId+" .language_tab").tabs("add",{
		title:parm.language,
		selected:true,
		closable:true
		});
		var pp = $("#"+strId+" .language_tab").tabs('getSelected');
		var $tab = gettab(parm.language);
		pp.append($tab);

		$tab.find(".pic").val(parm.pic);
		$tab.find(".pic").next().click();
		$tab.find(".pic").val("");

		$tab.find(".text").val(parm.text);
		$tab.find(".text").next().click();
		$tab.find(".text").val("");

		$tab.find(".title").val(parm.title);
		$tab.find(".title").next().click();
		$tab.find(".title").val("");

		$tab.find(".helptext").val(parm.helptext);
		$tab.find(".helptext").next().click();
		$tab.find(".helptext").val("");

		$tab.find(".content").val(parm.content);
		$tab.find(".content").next().click();
		$tab.find(".content").val("");
		_.each(parm.subcontents,function(subcontent){
			$subcontent = warpadd($tab.find(".warpadd").eq(0));
			if(subcontent.req[0])
				$subcontent.find(".req1").val(subcontent.req[0]);
			if(subcontent.req[1])
				$subcontent.find(".req2").val(subcontent.req[1]);

			if(subcontent.req.length>0)
			{
				var reqadd_obj = $subcontent.find(".reqadd")[0];
				reqadd(reqadd_obj);
				$subcontent.find(".req1").val("");
				$subcontent.find(".req2").val("");
			}

			_.each(subcontent.contents,function(content){
				$subcontent.find(".content").val(content);
				$subcontent.find(".contentadd").click();
				$subcontent.find(".content").val("");	
			});
			_.each(subcontent.rewards,function(reward){
				$subcontent.find(".itemid").val(reward.itemid);

				$subcontent.find(".amount").val(reward.amount);
				var rewardadd_obj = $subcontent.find(".rewardadd")[0];
				rewardadd(rewardadd_obj);
				$subcontent.find(".itemid").val("");	
				$subcontent.find(".amount").val("");			
			})
			
		});

	});
}
function getValueOfTypeId(txt)
{
	var arr = txt.split(":");
	if(arr.length>1)
		return arr[1];
	else
		return 0;
}
function editActivityTab(strId)
{
	var normalactivity={};
	var activityswitch={};

	var activity = {};
	var headers = [];
	var subcontents = [];
	normalactivity.normalacts = [];
	var $base =  $("#"+strId+"");
	activityswitch.isopen = $base.find(".isopen:checked").length>0?"true":"false";
	activityswitch.start = parseInt( parseUTC($base.find(".start").datetimebox("getText")))/1000 + "";
	activityswitch.end = parseInt( parseUTC($base.find(".end").datetimebox("getText")))/1000 + "";
	
	normalactivity.typeid = typeids[strId];
	normalactivity.weight = $base.find(".weight").val();
	normalactivity.switch = activityswitch;
	//normalactivity.normalacts = 

	if($base.find(".language_tab").length==0)
	{
		return {};
	}
	var tabs = $base.find(".language_tab").tabs("tabs");
	_.each(tabs,function(tab){

		var normalact = {};
		var multilanHeader = {};
		var tab = tab[0];
		var language = $(tab).children().first().attr("title");

		var pic = $(tab).find(".picadd").next().find("a").attr("value");
		var text = $(tab).find(".textadd").next().find("a").attr("value");
		var title = $(tab).find(".titleadd").next().find("a").attr("value");
		var helptext = $(tab).find(".helptextadd").next().find("a").attr("value");

		var content = $(tab).find(".temlateActivity1ByLanguage").contents("div").contents("a.contentadd").next().find("a").attr("value");

		normalact.text = text;
		normalact.pic = pic;
		normalact.language = language;
		normalactivity.normalacts.push(normalact);

		multilanHeader.language = language;
		multilanHeader.title = title;
		multilanHeader.helptext = helptext;
		multilanHeader.content = content;
		headers.push(multilanHeader);


		var activitySubs = $(tab).find(".templateActivitySub");
		_.each(activitySubs,function(activitysub){
			var contents_warp = $(activitysub).find(".warp_content p");
			var req_warp = $(activitysub).find(".warp_req p");
			var rewards_warp = $(activitysub).find(".warp_reward p");
			var typeid = $(activitysub).find(".typeid").val();
			if(typeid=="")
			{
				typeid = getValueOfTypeId($(activitysub).find(".typeid").text());
			}
			if(!req_warp.length||req_warp.length==0)
			{
				alert("title:"+title+"有条目没有添加req!!!");
				return;
			}
			var parmReq = req_warp.eq(0).find("a").attr("value").split("$&");
			var req1 = parmReq[0];
			var req2 = parmReq[1];


			var	subcontent = {typeid:typeid,req:[],subtext:[],rewards:[]};
			if(req1)
				subcontent.req.push(req1);
			if(req2)
				subcontent.req.push(req2);
				

			_.each(contents_warp,function(content){
				var subtext = $(content).find("a").attr("value");
				var multilantext = {language:language,content:subtext};
				subcontent.subtext.push(multilantext);
			});
			_.each(rewards_warp,function(reward){
				var arr = $(reward).find("a").attr("value").split("$&");
				var itemid = arr[0];
				var amount =arr[1];
				var reward = {itemid:itemid,amount:amount};
				subcontent.rewards.push(reward);
			});
			subcontents.push(subcontent);
		});	
	});
	activity.normalactivity = normalactivity;
	activity.header = headers;
	activity.switch = activityswitch;
	var subcontents2 = {};
	var errMsg = "";
	_.each(subcontents,function(subcontent){
		if(!subcontents2[subcontent.typeid+""])
		{
			subcontents2[subcontent.typeid + ""]=subcontent;
		}
		else
		{
			var subcontent2 = subcontents2[subcontent.typeid+""];
			_.each(subcontent.subtext,function(multilantext){
				subcontent2.subtext.push(multilantext);
			});
		}
	});
	var result_subcontent = [];
	var arrValues = _.values(subcontents2);
	_.each(arrValues,function(values){
		result_subcontent.push(values);
	});
	activity.subcontents = result_subcontent;
	return activity;
}