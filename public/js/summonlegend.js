function request(paras,region)
{ 
	if(!isNaN(region))
	{
		return region;
	}
	var url = location.href; 
	var paraString = url.substring(url.indexOf("?")+1,url.length).split("&"); 
	var paraObj = {} 
	for (i=0; j=paraString[i]; i++){ 
	paraObj[j.substring(0,j.indexOf("=")).toLowerCase()] = j.substring(j.indexOf("=")+1,j.length); 
	}
	var returnValue = paraObj[paras.toLowerCase()]; 
	if(typeof(returnValue)=="undefined"){ 
	return "";
	}else{ 
	if(returnValue.indexOf('#')>-1)
	returnValue = returnValue.substring(0,returnValue.indexOf('#'));
	return returnValue;
	}
}
var summonlegend_data = [];
var currentregion = 0;
var editregions = [];
var tooldg = [
        {
            text:'删除',
            iconCls:'icon-remove',
            handler:deleteCurrent
        }
];
function deleteCurrent()
{
	var row =  $("#tt").datagrid("getSelected");
	if(!row)
	{
		alert("没有选中的数据");
		return;
	}
	var index = $("#tt").datagrid("getRowIndex",row);
	$("#tt").datagrid("deleteRow",index);
	editregions.push(currentregion);
}

var addToRegion = function(region,data)
{
	var summonlegend = _.find(summonlegend_data,function(parm){
		return parm.regionid == region;
	});
	if(!summonlegend)
	{
		summonlegend = {regionid:region,sumsetting:[]};
		summonlegend_data.push(summonlegend);
	}
	data.isedit = true;
	summonlegend.sumsetting.push(data);
}
var RemoveFromRegion = function(region,data)
{
	var summonlegend = _.find(summonlegend_data,function(parm){
		return parm.regionid == region;
	});
	if(!summonlegend)
	{
		return;
	}
	else
	{
		var result = [];
		_.each(summonlegend.sumsetting,function(parm){
			if(parm.advid==data.advid)
			{
				return;
			}
			result.push(parm);
		})
		summonlegend.sumsetting = result;
	}

}
var save = function()
{
	editregions = _.uniq(editregions);
	if(editregions.length==0)
	{
		alert("没有更改！");
	}
	var willedit = [];
	_.each(editregions,function(regionid){
		var basedatas = _.find(summonlegend_data,function(parm){
			return parm.regionid == regionid;
		});
		willedit.push(basedatas);
	});
	if(confirm("确定要更改如下内容？\n"+JSON.stringify(willedit)))
	{
		var i = 0;
		_.each(willedit,function(result){
			$.post("/summonlegendedit",{data:result},function(){
				i++;
				if(i==willedit.length)
				{
					load();
					alert("操作完成");
				}

			});
		});
		editregions=[];
	}
	//$.post("/summonlegendedit",{data:basedatas})
}
var deleteSummonlegend = function(){
	var advid = $("#advid").val();
	var regionId = $("#regionid").val();
	var excludeRegionId = $("#excluderegionid").val();

	var result_region = getRegion(regionId,excludeRegionId);

	var resultData = {advid:advid};
	_.each(result_region,function(regionid){
		editregions.push(regionid);
		RemoveFromRegion(regionid,resultData);
	});
	alert("操作完成");
	showTable();
}
var getRegion = function(regionId,excludeRegionId)
{
	var region = regionId.split(",");
	if(regionId=="")
	{
		alert("regionId不能为空");
		// region = [];
		// _.each(summonlegend_data,function(data){
		// 	region.push(data.regionid);
		// });
	}
	var region_parmsarr = [];
	_.each(region,function(id){
		if(isNaN(id))
		{
			var arrid =id.split("-");
			if(arrid.length!=2)
			{
				alert("region符号错误");
				return;
			}
			for(var i = parseInt(arrid[0]);i<=parseInt(arrid[1]);i++)
			{
				region_parmsarr.push(i);
			}
		}
		else
			region_parmsarr.push(id);
	});
	region = _.uniq(region_parmsarr);
	var excluded = excludeRegionId.split(",");
	var result_region=[];
	_.each(region,function(id){
		if(!_.contains(excluded,id+""))
		{
			result_region.push(id);
		}
	});
	return result_region;
}
var edit = function()
{
	var advid = $("#advid").val();
	var start = parseInt(parseUTC($("#start").datetimebox("getText")))/1000 + "";
	var end = parseInt(parseUTC($("#end").datetimebox("getText")))/1000 + "";
	var regionId = $("#regionid").val();
	var excludeRegionId = $("#excluderegionid").val();

	var result_region = getRegion(regionId,excludeRegionId);

	var resultData = {advid:advid,start:start,end:end};
	_.each(result_region,function(regionid){
		editregions.push(regionid);
		addToRegion(regionid,resultData);
	});
	alert("操作完成");
	bind();
	
}
var changecurrentregion = function(regionid){
	currentregion = regionid;
	showTable();
}
var region0 = function(){
	var results = [];

	_.each(summonlegend_data,function(parm){
		results = results.concat(parm.sumsetting);
	});
	results =  _.uniq(results,function(item,key,value){
		return item.advid+item.start+item.end;
	});
	var result = {regionid:0,sumsetting:results};
	return result;
}
var initData = function()
{
	_.each(summonlegend_data,function(parm)
	{
		atRegionAssignment(parm);
	});
}
var atRegionAssignment = function(showdata){
		showdata.sumsetting = _.sortBy(showdata.sumsetting,"advid");
		
		_.each(showdata.sumsetting,function(parm){
			parm.atRegion=[];
			_.each(summonlegend_data,function(parm2){
					_.each(parm2.sumsetting,function(parm3){
						if(parm3.advid==parm.advid&&parm3.start==parm.start&&parm3.end==parm.end)
						{
							parm.atRegion.push(parseInt(parm2.regionid));
						}
					})
				
			});
			parm.atRegion = _.uniq(parm.atRegion);
			if(parm.atRegion&&parm.atRegion.length>0)
			{

				parm.atRegion = _.sortBy(parm.atRegion,function(num){
					return parseInt(num);
				});
				var iscontinuous = true;
				for(var i=0;i<parm.atRegion.length-1;i++)
				{
					if(parm.atRegion[i+1]-parm.atRegion[i]!=1)
					{
						iscontinuous=false;
						break;
					}
				}
				if(iscontinuous)
				{
					parm.atRegion = parm.atRegion[0]+"-"+parm.atRegion[parm.atRegion.length-1];
				}
				else
				{
					parm.atRegion = parm.atRegion.join(",");
				}
				if(!parm.isedit)
				{
					parm.isedit = "";
				}
			}
		});	
	return showdata;
}
var showTable = function(){
	if(currentregion!=0)
	{
		var showdata = _.find(summonlegend_data,function(parm){
			return parm.regionid==currentregion;
		})
		if(!showdata)	
		{
			return;
		}
		atRegionAssignment(showdata);

		var tableData = {rows:showdata.sumsetting,total:showdata.sumsetting.length};
		$("#tt").datagrid("loadData",tableData);
		$("#currentregionid_show").text(currentregion);		
	}
	else
	{
		var data = region0();
		var tableData = {rows:data.sumsetting,total:data.sumsetting.length};
		$("#tt").datagrid("loadData",tableData);
		$("#currentregionid_show").text(currentregion);
	}

}
var bind = function(){
		initData();
		var divRegion=$("#region");
		divRegion.html("");
		summonlegend_data = _.sortBy(summonlegend_data,"regionid");
		_.each(summonlegend_data,function(parm){
			var template= $( "<a class='easyui-linkbutton' onclick='changecurrentregion("+parm.regionid+")' data-options=\"iconCls:'icon-reload',plain:true\" href='javascript:void(0)' >分区"+parm.regionid+"</a>&nbsp;&nbsp;");
			divRegion.append(template);
		});
		
		var template= $( "<a class='easyui-linkbutton' onclick='changecurrentregion(0)' data-options=\"iconCls:'icon-reload',plain:true\" href='javascript:void(0)' >分区0</a>&nbsp;&nbsp;");
		divRegion.prepend(template);
		showTable();	
}
var load = function(){
	$.post("/summonlegendlist",{},function(data){
		summonlegend_data = JSON.parse(data) || [];
		currentregion = parseInt(request("region")) || 1;
		bind();
		// for(var i=firstRegionId;i<lastRegionId+1;i++)
		// 	{
		// 		var aregion =$( "<a class='easyui-linkbutton' data-options=\"iconCls:'icon-reload',plain:true\" href='?region="+i+"' >分区"+i+"</a>");
		// 		divRegion.append(aregion);
		// 	}
	});		
};
$(function(){
	load();
});