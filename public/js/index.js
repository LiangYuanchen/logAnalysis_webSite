/**扩展自定义的日期类***/
$.fn.datebox.defaults.formatter = function(date){
var y = date.getFullYear();
var m = date.getMonth()+1;
var d = date.getDate();
var h = date.getHours() > 9 ? date.getHours() : '0'+date.getHours();
var mm = date.getMinutes() > 9 ? date.getMinutes() : '0'+date.getMinutes();
var s = date.getSeconds() > 9 ? date.getSeconds() : '0'+date.getSeconds();
return y+'-'+m+'-'+d;
}



    /***扩展editors的datetimebox方法*****/
        $.extend($.fn.datagrid.defaults.editors, {
        numberspinner: {
                init: function(container, options){
                    var input = $('<input type="text">').appendTo(container);
                    return input.numberspinner(options);
                },
                destroy: function(target){
                    $(target).numberspinner('destroy');
                },
                getValue: function(target){
                    return $(target).numberspinner('getValue');
                },
                setValue: function(target, value){
                    $(target).numberspinner('setValue',value);
                },
                resize: function(target, width){
                    $(target).numberspinner('resize',width);
                }
            },
        datetimebox: {//datetimebox就是你要自定义editor的名称
                init: function(container, options){
                    var editor = $('<input />').appendTo(container);
                    editor.enableEdit = false;
                    editor.datetimebox(options);
                    return editor;
                },
                getValue: function(target){
                var new_str = $(target).datetimebox('getValue').replace(/:/g,'-');
                new_str = new_str.replace(/ /g,'-');
                var arr = new_str.split("-");
                var datum = new Date(Date.UTC(arr[0],arr[1]-1,arr[2],arr[3]-8,arr[4],arr[5]));
                var timeStamp = datum.getTime();
                
                return new Date(timeStamp).format("yyyy-MM-dd hh:mm:ss");
                    //return timeStamp;
               },
                setValue: function(target, value){
                if(value)
                $(target).datetimebox('setValue',new Date(value).format("yyyy-MM-dd hh:mm:ss"));
                else
                $(target).datetimebox('setValue',new Date().format("yyyy-MM-dd hh:mm:ss"));
                },
                resize: function(target, width){
                   $(target).datetimebox('resize',width);        
                },
                destroy: function(target){
                $(target).datetimebox('destroy');
                }
            }
        });


        var uname;
        function request(paras)
        {
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
        if (!request("uid")) {
                window.history.go(-1);
        };
        $(function(){
            $.post('/getUserName',{uid:request("uid"),reg:request("reg")},function(data){
                var name = "";
                if(taverneditCount>0)
                    name += " *";
                $("h1").text("Welcome : "+name);
                $("h3").text(data);
                uname=data;
                load();
               //getallrecode();
           });
            document.onkeydown = function(e){
                var ev = document.all ? window.event:e;
                if (ev.keyCode == 13) {
                    accept();
                };
            }
        });

   $("[name=Upload]").click(function(){
        alert(request("uid"));
        $("[name=uid]").val(request("uid"));
        $("[name=form_import]").submit();
   });

   var user;
   var globaluser;


   var baseTavern = {};
   var baseAdventurer = {};
   var baseFamiliar = {};
   var baseTask = {};
   var baseDish = {};
   var baseMeterial ={};
   var baseSkill = {};
   var baseQuest = {};
   var baseTutorial = {};
   var baseEquip = {};
   var baseItem = {};
   var weaCategory = "6000000";
   var armCategory = "6100000";
   var itemCategory = "6200000";
   var offhandCategory = "6300000";
    var equipCategory = "6000000:6100000:6200000:6300000";
   var dishCategory = "2000000";
   var mtrCategory = "9000000:9100000:9200000:9300000:9400000:9500000";
   var skillCategory = "4000000";
   var familiarRace = "5001000";
   var tableModing = [
   {name:"酒馆",value:"pg"},
   {name:"冒险者",value:"dg"},
    {name:"佣兽",value:"dgFamiliar"},
   {name:"存档",value:"dgBack"},
   {name:"pvp统计",value:"dgState"},
   {name:"任务",value:"dgquest"},
   {name:"仓库-烹饪",value:"dgdish"},
   {name:"仓库-材料",value:"dgmtr"},
    {name:"仓库-技能",value:"dgskill"},
    {name:"玩家任务",value:"dgtask"},
    {name:"新手指引",value:"dgTutorial"},
    {name:"装备",value:"Dgequip"}
   ]
    $(function(){
        var strHtml = "";
        for (var i = 0; i < tableModing.length; i++) {
            strHtml += "<a href='#"+tableModing[i].value+"1' >"+tableModing[i].name+"</a>  ";
        };
        $("h2").html(strHtml);
    });

    $(function(){
        if(islive){
            $("#clearAll").hide();
            $("#clearStorage").hide();
        }
    });

    var tooldgTutorial = [
        {
            text:"添加",
            iconCls:'icon-add',
            handler:appendTutorial
        },
        {
            text:'刷新',
            iconCls:'icon-reload',
            handler:loadTutorial
        },
        {
            text:'保存',
            iconCls:'icon-save',
            handler:acceptTutorial
        },
        {
            text:'删除',
            iconCls:'icon-remove',
            handler:removeitTutorial
        },
        {
            text:'撤销',
            iconCls:'icon-undo',
            handler:rejectTutorial
        },
        {
            text:'GetChanges',
            iconCls:'icon-search',
            handler:getChangesTutorial
        },
        {
            text:"TutorialAll",
            iconCls:'icon-save',
            handle:TutorialAll
        }
     ];
    if(!islive){
        tooldgTutorial.push(        {
            text:'Clear',
            iconCls:'icon-remove',
            handler:clearTutorial
        });
    }
    var tooldgtask = [
        {
            text:"添加",
            iconCls:'icon-add',
            handler:appendDgtask
        },
        {
            text:'刷新',
            iconCls:'icon-reload',
            handler:loadtask
        },
        {
            text:'保存',
            iconCls:'icon-save',
            handler:acceptDgtask
        },
        {
            text:'删除',
            iconCls:'icon-remove',
            handler:removeitDgtask
        },
        {
            text:'撤销',
            iconCls:'icon-undo',
            handler:rejectDgtask
        },
        {
            text:'GetChanges',
            iconCls:'icon-search',
            handler:getChangesDgtask
        }
     ];
    if(!islive){
        tooldgtask.push(         {
            text:'Clear',
            iconCls:'icon-remove',
            handler:clearDgtask
        } );
    }
    var tooldgquest = [
        {
            text:"添加",
            iconCls:'icon-add',
            handler:appendDgquest
        },
        {
            text:'刷新',
            iconCls:'icon-reload',
            handler:loadQuest
        },
        {
            text:'保存',
            iconCls:'icon-save',
            handler:acceptDgquest
        },
        {
            text:'删除',
            iconCls:'icon-remove',
            handler:removeitDgquest
        },
        {
            text:'撤销',
            iconCls:'icon-undo',
            handler:rejectDgquest
        },
        {
            text:'GetChanges',
            iconCls:'icon-search',
            handler:getChangesDgquest
        },
        {
            text:'UnlockNextChapter',
            iconCls:'icon-reload',
            handler:unlockChapter
        },
        {
            text:"resetQuest",
            iconCls:'icon-search',
            handler:resetQuest
        },{
            text:"AddAllQuests",
            iconCls:'icon-search',
            handler:AddAllQuests
        }
     ];
    if(!islive){
        tooldgquest.push(         {
            text:'Clear',
            iconCls:'icon-remove',
            handler:clearDgquest
        });
    }
    var tooldgequip = [
        {
            text:"添加",
            iconCls:'icon-add',
            handler:appendDgequip
        },
        {
            text:'刷新',
            iconCls:'icon-reload',
            handler:loadEquip
        },
        {

            text:'保存',
            iconCls:'icon-save',
            handler:acceptDgequip
        },
        {
            text:'删除',
            iconCls:'icon-remove',
            handler:removeitDgequip
        },
        {
            text:'撤销',
            iconCls:'icon-undo',
            handler:rejectDgequip
        },
        {
            text:'GetChanges',
            iconCls:'icon-search',
            handler:getChangesDgequip
        }
     ];
    var tooldgwea = [
        // {
        //     text:"添加",
        //     iconCls:'icon-add',
        //     handler:appendDgwea
        // },
        {
            text:'刷新',
            iconCls:'icon-reload',
            handler:loadWeapon
        }//,
        // {

        //     text:'保存',
        //     iconCls:'icon-save',
        //     handler:acceptDgwea
        // },
        // {
        //     text:'删除',
        //     iconCls:'icon-remove',
        //     handler:removeitDgwea
        // },
        // {
        //     text:'撤销',
        //     iconCls:'icon-undo',
        //     handler:rejectDgwea
        // },
        // {
        //     text:'GetChanges',
        //     iconCls:'icon-search',
        //     handler:getChangesDgwea
        // }
     ];
    var tooldgarmer = [
        // {
        //     text:"添加",
        //     iconCls:'icon-add',
        //     handler:appendDgarmer
        // },
        {
            text:'刷新',
            iconCls:'icon-reload',
            handler:loadArmer
        }//,
        // {

        //     text:'保存',
        //     iconCls:'icon-save',
        //     handler:acceptDgarmer
        // },
        // {
        //     text:'删除',
        //     iconCls:'icon-remove',
        //     handler:removeitDgarmer
        // },
        // {
        //     text:'撤销',
        //     iconCls:'icon-undo',
        //     handler:rejectDgarmer
        // },
        // {
        //     text:'GetChanges',
        //     iconCls:'icon-search',
        //     handler:getChangesDgarmer
        // }
     ];
    var tooldgdish = [
        {
            text:"添加",
            iconCls:'icon-add',
            handler:appendDgdish
        },
        {
            text:'刷新',
            iconCls:'icon-reload',
            handler:loadDish
        },
        {
            text:'保存',

            iconCls:'icon-save',
            handler:acceptDgdish
        },
        {
            text:'删除',
            iconCls:'icon-remove',
            handler:removeitDgdish
        },
        {
            text:'撤销',
            iconCls:'icon-undo',
            handler:rejectDgdish
        },
        {
            text:'GetChanges',
            iconCls:'icon-search',
            handler:getChangesDgdish
        },
        {
            text:'finishDish',
            iconCls:'icon-reload',
            handler:dishend
        }
     ];
    var tooldgmtr = [
        {
            text:"添加",
            iconCls:'icon-add',
            handler:appendDgmtr
        },
        {
            text:'刷新',
            iconCls:'icon-reload',
            handler:loadMtr
        },
        {
            text:'保存',
            iconCls:'icon-save',
            handler:acceptDgmtr
        },
        {
            text:'删除',
            iconCls:'icon-remove',
            handler:removeitDgmtr
        },
        {
            text:'撤销',
            iconCls:'icon-undo',
            handler:rejectDgmtr
        },
        {
            text:'GetChanges',
            iconCls:'icon-search',
            handler:getChangesDgmtr
        },
        {
            text:"apendSkillDebre",
            iconCls:"icon-add",
            handler:appendAllskilldebres
        }
     ];
    var tooldgitem = [
        // {
        //     text:"添加",
        //     iconCls:'icon-add',
        //     handler:appendDgitem
        // },
        {
            text:'刷新',
            iconCls:'icon-reload',
            handler:loadItem
        }//,
        // {
        //     text:'保存',
        //     iconCls:'icon-save',
        //     handler:acceptDgitem
        // },
        // {
        //     text:'删除',
        //     iconCls:'icon-remove',
        //     handler:removeitDgitem
        // },
        // {
        //     text:'撤销',
        //     iconCls:'icon-undo',
        //     handler:rejectDgitem
        // },
        // {
        //     text:'GetChanges',
        //     iconCls:'icon-search',
        //     handler:getChangesDgitem
        // }
     ];
    var tooldgskill = [
        {
            text:"添加",
            iconCls:'icon-add',
            handler:appendDgskill
        },
        {
            text:'刷新',
            iconCls:'icon-reload',
            handler:loadSkill
        },
        {
            text:'保存',
            iconCls:'icon-save',
            handler:acceptDgskill
        },
        {
            text:'删除',
            iconCls:'icon-remove',
            handler:removeitDgskill
        },
        {
            text:'撤销',
            iconCls:'icon-undo',
            handler:rejectDgskill
        },
        {
            text:'GetChanges',
            iconCls:'icon-search',
            handler:getChangesDgskill
        }
     ];

    var toolDg    = [
        {
            text:'刷新',
            iconCls:'icon-reload',
            handler:connect
        },
        {
            text:'添加',
            iconCls:'icon-add',
            handler:append
        },
        {
            text:'保存',
            iconCls:'icon-save',
            handler:accept
        },
        {
            text:'撤销',
            iconCls:'icon-undo',
            handler:reject
        },
        {
            text:'Delete',
            iconCls:'icon-remove',
            handler:deleteAdv
        },
        {
            text:'Changes',
            iconCls:'icon-search',
            handler:getChanges
        },
        {
            text:'allCreate',
            iconCls:'icon-add',
            handler:appendAll
        },
        {
            text:'otherCreate',
            iconCls:'icon-add',
            handler:appendAllOthers
        },
        {
            text:'unlockskill',
            iconCls:"icon-add",
            handler:unlockskill
        },
        {
            text:"AddOutSideAdv",
            iconCls:"icon-add",
            handler:outsideAdv
        }
    ];
    if(!islive){
        toolDg.push({
            text:'Clear',
            iconCls:'icon-remove',
            handler:clearAdv
        });
    }
   var toolDgFamiliar    = [
        {
            text:'刷新',
            iconCls:'icon-reload',
            handler:loadFamiliar
        },
        {
            text:'添加',
            iconCls:'icon-add',
            handler:appendFamiliar
        },
        {
            text:'保存',
            iconCls:'icon-save',
            handler:acceptFamiliar
        },
        {
            text:"Delete",
            iconCls:"icon-remove",
            handler:delelteFamiliar
        },
        // {
        //     text:'Clear',
        //     iconCls:'icon-remove',
        //     handler:clearAdvFamiliar
        // },
        {
            text:'撤销',
            iconCls:'icon-undo',
            handler:rejectFamiliar
        },
        {
            text:'Changes',
            iconCls:'icon-search',
            handler:getChangesFamiliar
        },
        {
            text:'allCreate',
            iconCls:'icon-add',
            handler:apendAllFamiliars
        }
    ];


    var toolState = [
        {
            text:'刷新',
            iconCls:'icon-reload',
            handler:getrecode
        }
    ];
    if(!islive){
        toolState.push(        {
            text:'Clear',
            iconCls:'icon-remove',
            handler:clearRecode
        });
    }
    var toolBackup = [
        {   text:'刷新',
            iconCls:'icon-reload',
            handler:getbackuplist
        },
        {
            text:'存档',
            iconCls:'icon-add',
            handler:setbackup
        },
        {
            text:'读档',
            iconCls:'icon-undo',
            handler:getbackup
        }
        ,{
            text:'Clone',
            iconCls:'icon-search',
            handler:cloneBackup
        },{
            text:'Export',
            iconCls:'icon-reload',
            handler:exportBackup
        },{
            text:"Import",
            iconCls:'icon-remove',
            handler:importBackup
        }
    ];
    if(!islive){
        toolBackup.push(        {
            text:'Clear',
            iconCls:'icon-remove',
            handler:clearBackup
        });
    }
    var toolPg = [
        {
            text:'刷新',
            iconCls:'icon-reload',
            handler:loadTavern
        },
        {
            text:'保存',
            iconCls:'icon-add',
            handler:AcceptPgChanges
        }
    ]
    if(!islive){
        toolPg.push(        {
            text:'Clear',
            iconCls:'icon-remove',
            handler:PgClear
        });
    }
        var advMg,racMg,claMg,armMg,iteMg,queMg,weaMg,skiMg,maxLevel,RaceClass,disMg,mtrMg,skipMg,taskMg,tutorialMg,tavernlevelMg,familarMg,familiarskillMg;

        var editIndex = undefined;
        function AllDebug(){
            $.get("/AllDebug",{uid:request("uid"),reg:request("reg")},function(data){
                window.location.reload();
            })
        }
        function resetQuest(){
            $.post("/resetQuest",{uid:request("uid"),reg:request("reg")},function(data){
                overHandle();
                loadQuest();
            });
        }
        function AddAllQuests(){
            $.post('/questclear',{uid:uid,reg:request("reg")},function(re){
                for(var i=0;i<8;i++){
                    $.post('/unlockchapter',{uid:uid,reg:request("reg")},function(re){
                           });
                }
                var rows = [];
                for(var i=0;i<queMg.length;i++){
                    var row = {typeid:queMg[i].value,star:1,playcount:1,starttime:0,lastplaytime:0,cmplv:0};
                    if(row.typeid!="1009999"&&parseInt(row.typeid)<1009998) rows.push(row);
                }
                $.post("/questedit",{uid:request("uid"),data:rows,reg:request("reg")},function(re){
                    loadQuest();
                });
            });

        }
        function dishend(){
            $.post("/dishend",{uid:request("uid"),reg:request("reg")},function(data){
                overHandle();
                loadDish();
            });
        }
        function logindiffday(){
            $.post("/logindiffday",{uid:request("uid"),reg:request("reg")},function(data){
                overHandle();
                load();
            })
        }
        function resetodyssey(){
            $.post("/resetodyssey",{uid:request("uid"),reg:request("reg")},function(data){
                overHandle();
                load();
            })
        }
        function delbind_facebook(){
            $.post("/delfacebookbind",{uid:request("uid"),reg:request("reg")},function(data){
                overHandle();
                load();
            });
        }
        function UpdateRace(obj){
            var currentRaceId = null;
            if (editIndex!=undefined) {
                if (obj==undefined) {
                    currentRaceId = $("#dg").datagrid("getRows")[editIndex].raceid + "";
                }else{
                    currentRaceId = obj.value;
                }
                for (var i = racMg.length - 1; i >= 0; i--) {
                     if(racMg[i].value == currentRaceId)
                        $("#dg").datagrid("getRows")[editIndex].raceskillid =  racMg[i].raceskillid;
                };

            }
        }
        function updateTask(obj){
            var curentClassId=null;
            if (editIndexDgtask!=undefined) {
                if (obj==undefined) {
                    curentValue = $("#dgtask").datagrid("getRows")[editIndexDgtask].tasktype_finishtype + "";
                }else{
                    curentValue = obj.text;
                }
                for (var i = taskMg.length - 1; i >= 0; i--) {
                    if(taskMg[i].text == curentValue){
                         $("#dgtask").datagrid("getRows")[editIndexDgtask].tasktype = taskMg[i].tasktype;
                         $("#dgtask").datagrid("getRows")[editIndexDgtask].finishtype = taskMg[i].finishtype;
                    }
                };
            }
        }

        function UpdateWeapon(){
            if(editIndex!=undefined){
                var weapons =_.filter($("#Dgequip").datagrid("getRows"),function(obj){ return parseInt(obj.typeid/100000)==(parseInt(weaCategory)/100000) });
                var results =[];
                for(parm in weapons){
                    var weapon = weapons[parm];
                    var obj = {};
                    obj.value = weapon.instid;
                    var equipMgParm = _.find(equipMg,function(obj){return obj.value == weapon.typeid})
                    obj.text = equipMgParm.text +" "+ weapon.instid;
                    results.push(obj);
                }
                var cb  = $("#dg").datagrid('getEditor',{field:'weaponid',index:editIndex});
                if(!cb)
                    return;
                $(cb.target).combobox('loadData',results);
            }
        }
        function UpdateArmor(){
             if(editIndex!=undefined){
                var armors =_.filter($("#Dgequip").datagrid("getRows"),function(obj){ return parseInt(obj.typeid/100000)==(parseInt(armCategory)/100000) });
                var results =[];
                for(parm in armors){
                    var armor = armors[parm];
                    var obj = {};
                    obj.value = armor.instid;
                    var equipMgParm = _.find(equipMg,function(obj){return obj.value == armor.typeid})
                    obj.text = equipMgParm.text + " "+ armor.instid;
                    results.push(obj);
                }
                var cb  = $("#dg").datagrid('getEditor',{field:'armorid',index:editIndex});
                if(!cb)
                    return;
                $(cb.target).combobox('loadData',results);
            }
        }
        function UpdateItem(){
             if(editIndex!=undefined){
                var items =_.filter($("#Dgequip").datagrid("getRows"),function(obj){ return parseInt(obj.typeid/100000)==(parseInt(itemCategory)/100000) });
                var results =[];
                for(parm in items){
                    var item = items[parm];
                    var obj = {};
                    obj.value = item.instid;
                    var equipMgParm = _.find(equipMg,function(obj){return obj.value == item.typeid})
                    obj.text = equipMgParm.text + " " + item.instid;
                    results.push(obj);
                }
                var cb  = $("#dg").datagrid('getEditor',{field:'itemid',index:editIndex});
                if(!cb)
                    return;
                $(cb.target).combobox('loadData',results);
            }
        }
        function UpdateOffhand(){
            if(editIndex!=undefined){
                var offhands =_.filter($("#Dgequip").datagrid("getRows"),function(obj){ return parseInt(obj.typeid/100000)==(parseInt(offhandCategory)/100000) });
                var results =[];
                for(parm in offhands){
                    var offhand = offhands[parm];
                    var obj = {};
                    obj.value = offhand.instid;
                    var equipMgParm = _.find(equipMg,function(obj){return obj.value == offhand.typeid})
                    obj.text = equipMgParm.text +" "+ offhand.instid;
                    results.push(obj);
                }
                var cb  = $("#dg").datagrid('getEditor',{field:'offhandid',index:editIndex});
                if(!cb)
                    return;
                $(cb.target).combobox('loadData',results);
            }
        }

        function UpdateSkill(obj){
            var curentClassId=null;
            if (editIndex!=undefined) {
                if (obj==undefined) {
                    var typeid = $("#dg").datagrid("getRows")[editIndex].typeid;

                }else{
                    typeid = obj.value;
                }
                curentClassId = getClassIDByTypeID(typeid) + "";
                var skiMgSeed = [];
                //alert(JSON.stringify(skiMg));
                for (var i = skiMg.length - 1; i >= 0; i--) {
                    if(skiMg[i].classid == curentClassId ){
                        skiMgSeed.push(skiMg[i]);
                    }
                }
               var ed1 = $("#dg").datagrid('getEditor',{field:'skillid1',index:editIndex});
               var ed2 = $("#dg").datagrid('getEditor',{field:'skillid2',index:editIndex});
               var ed3 = $("#dg").datagrid('getEditor',{field:'skillid3',index:editIndex});
               var ed4 = $("#dg").datagrid('getEditor',{field:'skillid4',index:editIndex});

              // var ed4 = $("#dg").datagrid('getEditor',{field:'skillid4',index:editIndex});

               //alert(JSON.stringify(skiMgSeed));
               $(ed1.target).combobox('loadData',skiMgSeed);
               $(ed2.target).combobox('loadData',skiMgSeed);
               $(ed3.target).combobox('loadData',skiMgSeed);
               $(ed4.target).combobox('loadData',skiMgSeed);
              // $(ed4.target).combobox('loadData',skiMgSeed);

               //$(ed.target).combobox('loadData',skiMgSeed);
            }
        }

        function GetExpByLevel(levelid)
        {
            var result;
            for (var i = maxLevel.length - 1; i >= 0; i--) {
                if (levelid==maxLevel[i].levelid) {
                    return maxLevel[i].maxexp-1;
                };
            };
            alert("没有配置该等级");
            return 0;
        }
        function getTutorialIndex(id){
            for(var i=0;i<tutorialids.length;i++){
                if(id==tutorialids[i])
                    return i;
            }
            return -1;
        }
        function CheckTutorialMg(parms){
            var results = [];
            if(!parms.length)
                return;
            for(var i=0;i<parms.length;i++){
                var parm = parms[i];
                var index = getTutorialIndex(parm.typeId);
                if(index>=0){
                    parm.text = tutorialnames[index] +" "+ tutorialids[index];
                    results.push(parm);
                }
            }
            return results;
        }
        function SetConfig(){
            $.ajax(
                    {
                        url:"/config",
                        async:false,
                        type:"post",
                        success:function(data){
                            if(!data||data=="null")
                            {
                                alert("与服务器连接中断");
                                return;
                            }
                             var  config = eval('('+data+')');
                            advMg = config.adventurer;
                            racMg = config.race;
                            claMg = config.classe;
                            armMg = config.armor;
                            iteMg = config.item;
                            queMg = config.quest;
                            weaMg = config.weapon;
                            skiMg = config.skill;
                            disMg = config.dish;
                            mtrMg = config.material;
                            skipMg= config.skillpoint;
                            equipMg =config.equip;
                            maxLevel = config.advlevel;
                            taskMg = config.task;
                            alltaskMg = config.alltask;
                            tutorialMg = CheckTutorialMg(config.tutorial);
                            tavernlevelMg = config.tavernlevel;
                            familarMg = config.familar;
                           },
                        error:function(data){
                            alert("链接失败");
                        }
                    }
                );
            $.post('/getRaceClass',{reg:request("reg")},function(data){
                RaceClass = data;
            });
        }
        SetConfig();
        function validatConfig(cb){

        }
        function IsRaceClass(raceid,classid){
            var parm = raceid +""+ classid+"";
            if (RaceClass) {
                                for (var i = RaceClass.length - 1; i >= 0; i--) {
                     if(RaceClass[i]==parm)
                        return true;
                }
                return false;
            }else{
                return false;
            }
        }
        function  IsSkillType(skillid,classid)
        {

            if (skillid=="undefined"||skillid=="0"||skillid==0||skillid=="") {
                return true;
            };
            var realClassIds,curentClassId;
            curentClassId = classid;
            for (var i = skiMg.length - 1; i >= 0; i--) {
                if(skiMg[i].classid == curentClassId||skiMg[i].classid == 0){
                    if (skiMg[i].value+""==skillid+"") {
                        return true;
                    };
                }
            }
            if (realClassIds+"" == curentClassId+"" || curentClassId +"" == '0') {
                return true;
            }
            return false;
        }
        // function IsSKillType(skillid,classid)
        // {
        //     var realClassNames,currentClassName;
        //     for (var i = skiMg.length - 1; i >= 0; i--) {
        //         if(skiMg[i].value == skillid){
        //             realClassNames = skiMg[i].class;
        //         }
        //     }
        //     for (var i = claMg.length - 1; i >= 0; i--) {
        //         if(claMg[i].value == classid){
        //             currentClassName = claMg[i].text;
        //         }
        //     }
        //     if (realClassNames.indexOf(currentClassName)<0&&realClassNames!="common") {
        //         return false;
        //     }
        //     return true;
        // }
        function fomatterAdv(val,row){
            if (!(advMg.length)) {
                SetConfig();
            };
            for (var i = advMg.length - 1; i >= 0; i--) {
                if(advMg[i].value==val)
                    return advMg[i].text;
            };
        };
        function getRaceIDByTypeID(typeid){
            for (var i = advMg.length - 1; i >= 0; i--) {
                if(advMg[i].value == typeid){
                    return  advMg[i].raceid;
                };
            };
        }
        function getClassIDByTypeID(typeid){
            for (var i = advMg.length - 1; i >= 0; i--) {
                if(advMg[i].value == typeid){
                    return  advMg[i].classid;
                };
            };
        }
        function fomatterRac(val,row){
            var typeid = row.typeid;
            var raceid = 0;
            for (var i = advMg.length - 1; i >= 0; i--) {
                if(advMg[i].value == typeid){
                    raceid = advMg[i].raceid;
                    break;
                };
            };
            for (var i = racMg.length - 1; i >= 0; i--) {
                if(racMg[i].value==raceid){
                    return racMg[i].text;
                }
            };
        };
        function fomatterCla(val,row){
            var typeid = row.typeid;
            var classid = 0;
            for (var i = advMg.length - 1; i >= 0; i--) {
                if(advMg[i].value == typeid){
                    classid = advMg[i].classid;
                    break;
                };
            };
            for (var i = claMg.length - 1; i >= 0; i--) {
                if(claMg[i].value==classid)
                    return claMg[i].text;
            };
        };

        function fomatterRaceSkill(val,row){
              for (var i = racMg.length - 1; i >= 0; i--) {
                if(racMg[i].raceskillid==val)
                {
                    //根据skillid获取skill text
                    for (var j = skiMg.length - 1; j >= 0; j--) {
                        if(skiMg[j].value==val)
                            return skiMg[j].text;
                    };
                }

            };
        }
        function fomatterunescape(val,row){
            return unescape(val);
        };
        function fomatterArm(val,row){
            for (var i = armMg.length - 1; i >= 0; i--) {
                if(armMg[i].value==val)
                    return armMg[i].text;
            };
        };
        function fomatterIte(val,row){
            for (var i = iteMg.length - 1; i >= 0; i--) {
                if(iteMg[i].value==val)
                    return iteMg[i].text;
            };
        };
        function fomatterQue(val,row){
            for (var i = queMg.length - 1; i >= 0; i--) {
                if(queMg[i].value==val)
                    return queMg[i].text;
            };
        };
        function fomatterWea(val,row){
            for (var i = weaMg.length - 1; i >= 0; i--) {
                if(weaMg[i].value==val)
                    return weaMg[i].text;
            };
        };
        function fomatterSki(val,row){
            for (var i = skiMg.length - 1; i >= 0; i--) {
                if(skiMg[i].value==val+"")
                    return skiMg[i].text;
            };
        };
        function fomatterDish(val,row){
            for (var i = disMg.length - 1; i >= 0; i--) {
                if(disMg[i].value==val)
                    return disMg[i].text;
            }
        };
        function formatterMtr(val,row){
             for (var i = mtrMg.length - 1; i >= 0; i--) {
                if(mtrMg[i].value==val)
                    return mtrMg[i].text;
            }
        }
        function formatterAdvId(val,row){
            var instid = val;
            var uid =request("uid");
            return "<a href='/gmtool/advskill?uid="+uid+"&instid="+ instid +"'' target='_blank'  >"+ val +"</a>";
        }
        function fomatterfamiliar(val,row){
            for(var i=familarMg.length-1; i>=0;i--){
                if(familarMg[i].value==val)
                {
                    return familarMg[i].text;
                }
            }
        }
        function formatterIsFinish(val,row){
            if(val)
                return "已完成";
            else
                return "未完成";
        }
        function formatterEquip(val,row){
          for (var i = equipMg.length - 1; i >= 0; i--) {
                if(equipMg[i].value==val){
                    return equipMg[i].text;
                }
            }
        }
        function formatterAdvWeapon(val,row){
            var equips = $("#Dgequip").datagrid("getRows");
            for (var i = equips.length - 1; i >= 0; i--) {
                 if(equips[i].instid==val)
                    return formatterEquip(equips[i].typeid);
            };
            return formatterEquip(row.weapontypeid);
        }
        function formatterAdvOffhand(val,row){
            var equips = $("#Dgequip").datagrid("getRows");
            for (var i = equips.length - 1; i >= 0; i--) {
                 if(equips[i].instid==val)
                    return formatterEquip(equips[i].typeid);
            };
            return formatterEquip(row.offhandtypeid);
        }
         function formatterAdvArmor(val,row){
            var equips = $("#Dgequip").datagrid("getRows");
            for (var i = equips.length - 1; i >= 0; i--) {
                 if(equips[i].instid==val)
                    return formatterEquip(equips[i].typeid);
            };
            return formatterEquip(row.armortypeid);
        }
        function formatterAdvItem(val,row){
            var equips = $("#Dgequip").datagrid("getRows");
            for (var i = equips.length - 1; i >= 0; i--) {
                 if(equips[i].instid==val)
                    return formatterEquip(equips[i].typeid);
            };
            return formatterEquip(row.itemtypeid);
        }
        function formatterTutorialName(val,row){
             for (var i = tutorialMg.length - 1; i >= 0; i--) {
                if(tutorialMg[i].value==row.typeid){
                    return tutorialMg[i].text.substring(0,tutorialMg[i].text.indexOf(' '));
                }
            }
        }
        function ValidatePDLevelID(val,row){
            var maxExp = 0;
            var minExp = 0;
            var frontLevel = parseInt(val)-1;
            var j =0;
            for (var i = tavernlevelMg.length - 1; i >= 0; i--) {
                if(tavernlevelMg[i].levelid==val)
                {
                    maxExp = parseInt(tavernlevelMg[i].exp);
                    j++;
                }
                if (tavernlevelMg[i].levelid==frontLevel) {
                    minExp = parseInt(tavernlevelMg[i].exp);
                    j++;
                };
                if (j==2) {break;};
            };
            if (isNaN(maxExp)) {
                alert(" tavern maxExp  isNaN");
            };
            if (isNaN(minExp)) {
                alert("tavern minExp isNaN");
            };
            var msg="";
            if ( (row.Exp>=maxExp||row.Exp<minExp)&&row.Exp!=0 ) {
                msg += "当前等级[ "+val+" ]经验区间为:"+minExp+"-"+maxExp+"\n "+row.Exp+"不在此区间";
                alert(msg);
                return false;
            }else{
                return true;
            }
           // alert("error: 该tavenlevel配置不存在,请更新配置或重启GMTool")；
        }
        function formatterTutorialRT(val,row){
            for (var i = tutorialMg.length - 1; i >= 0; i--) {
                if(tutorialMg[i].typeId == row.typeid)
                    return (tutorialMg[i].roomType || "" );
            };
        }
        function formatterTutorialRQ(val,row){
            for (var i = tutorialMg.length - 1; i >= 0; i--) {
                if(tutorialMg[i].typeId == row.typeid){
                    return tutorialMg[i].requireQuestId || "";
                }
            };
        }
        function formatterTutorialUL(val,row){
            for (var i = tutorialMg.length - 1; i >= 0; i--) {
                if(tutorialMg[i].typeId == row.typeid){
                    return tutorialMg[i].unlocks || "";
                }
            };
        }
        function fomatterSkiP(val,row){
            var preior = 925680;
             for (var i = skipMg.length - 1; i >= 0; i--) {
                if(skipMg[i].value==val)
                    return skipMg[i].text;
            }
            return 0;
        }
        function getFinishCount(val,row){
            var count = 0;
            if (row.tasktype=="specify") {
                return "特制任务完成";
            };
            for (var i = alltaskMg.length - 1; i >= 0; i--) {

                if(alltaskMg[i].finishtype == row.finishtype){
                    if(row.finishvalue>=alltaskMg[i].finishvalue)
                        count++;
                }
            };
            //alert(count);
           // row.count = count;
            return count;
        }
        function fomattertasktype_finishtype(val,row)
        {
            return val;
           // return row.tasktype+" "+row.finishtype;
        }
        function fomatterTaskType(val,row){
              for (var i = taskMg.length - 1; i >= 0; i--) {
                if(taskMg[i].value==row.tasktype_finishtype){
                    row.tasktype = taskMg[i].tasktype;
                    return taskMg[i].tasktype;
                }
            }
        }
        function fomatterFinishType(val,row){
             for (var i = taskMg.length - 1; i >= 0; i--) {
                if(taskMg[i].value==row.tasktype_finishtype){
                    row.finishtype=taskMg[i].finishtype;
                    return taskMg[i].finishtype;
                }
            }
        }
        function getTypeID(val,row){
            return row.id;
        }
        var editIndex = undefined;
        var uid = request("uid");
        function load(cb){

            getallrecode();
            getbackuplist();
            loadTavern();
            //loadWeapon();
            loadDish();
           // loadArmer();
            loadSkill();
           // loadItem();
            loadMtr();
            loadQuest();
            loadtask();
            loadTutorial();
            loadEquip(function(){
                connect();
            });
            loadFamiliar();
                   }

        function connect(){
            var uid = request("uid");
            //$("#dg").datagrid({url:"/getAdventurers?uid="+uid+"&type=1"});
            $.post("/getAdventurers?uid="+uid+"&type=1",{reg:request("reg")},function(data){
                if(data.length==0)
                    return;
                var result = eval("("+data+")");
                if (result.total==0) {
                    result.rows = [];
                };
                $("#dg").datagrid("loadData",result);
                UpdateWeapon();
                UpdateItem();
                UpdateArmor();
                UpdateOffhand();
            })
        }

        function loadtask(){
            var uid = request("uid");
            //$("#dg").datagrid({url:"/getAdventurers?uid="+uid+"&type=1"});
            $.post("/tasklist?uid="+uid+"&type=1",{reg:request("reg")},function(data){

                $("#dgtask").datagrid("loadData",data);
            })
        }
        function loadTutorial(){
            var uid = request("uid");
            $.post("/tutoriallist?uid="+uid+"",{reg:request("reg")},function(data){
              // alert(JSON.stringify(data));
               var results = [];
               for(var i=0;i<tutorialids.length;i++){
                var parm = null;
                for(var j=0;j<data.total;j++)
                {
                    if(data.rows[j].typeid==tutorialids[i])
                    {
                        parm = data.rows[j];
                        parm.isfinish = true;
                        break;
                    }
                }
                if(!parm){
                    parm = {};
                    parm.typeid= tutorialids[i];
                    parm.isfinish = false;
                }
                results.push(parm);
               }
               // for(var i=0;i<data.total;i++){
               //  var parm = data.rows[i];
               //  var index = getTutorialIndex(parm.typeid);
               //  if(index>=0)
               //      results.push(parm);
               // }
               var result={};
               result.total = results.length;
               result.rows = results;
                $("#dgTutorial").datagrid("loadData",results);
            })
        }
        function loadFamiliar(){
            var uid = request("uid");
            //$("#dg").datagrid({url:"/getAdventurers?uid="+uid+"&type=1"});
            $.post("/getFamiliar?uid="+uid+"&type=1",{reg:request("reg")},function(data){
                if(data.length==0)
                    return;
                var result = eval("("+data+")");
                if (!result.rows){
                    result.rows=[];
                }
                $("#dgFamiliar").datagrid("loadData",result);
            })        }
        function loadQuest(){
            var uid = request("uid");
            $.post("/questlist?uid="+uid+"&type=1",{reg:request("reg")},function(data){
               // var result = eval("("+data+")");
                $("#dgquest").datagrid("loadData",data);
            })
        }
        function loadEquip(next){
            var uid = request("uid");
            //alert("/storagelist?uid="+uid+"&category="+equipCategory);
            $.post("/storagelist?uid="+uid+"&category="+equipCategory,{reg:request("reg")},function(data){
                var result={rows:[],total:data.total};
                if (data&&data.rows&& data.rows.length) {
                    for (var i = data.rows.length - 1; i >= 0; i--) {
                        if (data.rows[i].instid!=0) {
                            result.rows.push(data.rows[i]);
                        }
                    };
                }
                else
                    result.total = 0;
                if (!result.rows) {
                    result.rows=[];
                };
                $("#Dgequip").datagrid("loadData",result);
                if(typeof next == "function")
                    next();
            });
            // $("#Dgequip").datagrid({
            //     url:"/storagelist?uid="+uid+"&category="+equipCategory
            // });
        }
        function loadWeapon(){
            var uid = request("uid");
            //alert("/storagelist?uid="+uid+"&category="+weaCategory);
            $("#dgwea").datagrid({
                url:"/storagelist?uid="+uid+"&category="+weaCategory
            })
        }
        function loadSkill(){
          var uid = request("uid");
            $("#dgskill").datagrid({
                url:"/storagelist?uid="+uid+"&category="+skillCategory
            })

        }
        function loadArmer(){
             var uid = request("uid");
            $("#dgarmer").datagrid({
                url:"/storagelist?uid="+uid+"&category="+armCategory
            })

        }
        function loadDish(){
            var uid = request("uid");
            $("#dgdish").datagrid({
                url:"/storagelist?uid="+uid+"&category="+dishCategory
            });
        }
        function loadItem(){
            var uid = request("uid");
            $("#dgitem").datagrid({
                url:"/storagelist?uid="+uid+"&category="+itemCategory
            })

        }
        function loadMtr(){
            var uid = request("uid");
            $("#dgmtr").datagrid({
                url:"/storagelist?uid="+uid+"&category="+mtrCategory
            });
        }
        function loadTavern(){
             var uid = request("uid");
            $("#pg").propertygrid({
                url:"/tavernshow?uid="+uid+""
            });
        }

        function tavernLoadSuccess(data){
            baseTavern = data;
        }
        function adventurerLoadSuccess(data){
            baseAdventurer = data;
        }
        function equipLoadSuccess(data){
            baseEquip = data;
        }
        function familiarLoadSuccess(data){
            baseFamiliar = data;
        }
        function questLoadSuccess(data){
            baseQuest = data;
        }
        function dishLoadSuccess(data){
            baseDish = data;
        }
        function meterialLoadSuccess(data){
            baseMeterial = data;
        }
        function skillLoadSuccess(data){
            baseSkill = data;
        }
        function taskLoadSuccess(data){
            baseTask = data;
        }
        function tutorialLoadSuccess(data){
            baseTutorial = data;
        }
        function itemLoadSuccess(data){
            baseItem = data;
        }

        function afterEditTavern(index,row){

            if(row.name == "BanLoginTime")
            {
                var uid = request("uid");
                var date = parseUTC(new Date(row.value))/1000;
                $.post("/changebanlogintime",{uid:uid,date:date},function(data){

                });
            }
            if(row.name == "DisChatTime")
            {
                var uid = request("uid");
                var date = parseUTC(new Date(row.value))/1000;
                $.post("/editdischat",{uid:uid,date:date},function(data){

                });
            }
        }

        function endEditing(){
            if (editIndex == undefined){return true}

                if ($('#dg').datagrid('validateRow', editIndex)){
                     $('#dg').datagrid('endEdit', editIndex);
                    editIndex = undefined;
                    return true;
                } else {
                    return false;
                }

        }
        function onEditBegin(rowIndex,rowData){
            // editIndex = rowIndex;
            UpdateSkill();
        }
        function onEditBefore(rowIndex,rowData){
            UpdateSkill();
        }
        function onClickRow(index){
            if (editIndex != index){
                if (endEditing()){
                    $('#dg').datagrid('selectRow', index)
                            .datagrid('beginEdit', index);
                                        editIndex = index;

                } else {
                    $('#dg').datagrid('selectRow', editIndex);
                }
                UpdateSkill();
                UpdateWeapon();
                UpdateArmor();
                UpdateItem();
                UpdateOffhand();
            }
        }

        function append(){
            // if (endEditing()){
            //     $('#dg').datagrid('appendRow',{status:'P'});
            //     editIndex = $('#dg').datagrid('getRows').length-1;
            //     $('#dg').datagrid('selectRow', editIndex)
            //             .datagrid('beginEdit', editIndex);
            // }
            if(endEditing()){
                $("#dg").datagrid('appendRow',{"armorid":0,"equipset":0,"exp":0,"instid":"0","istatus":"","itemid":0,"level":1,"level1":0,"level2":0,"level3":0,"level4":0,"raceskillid":0,"raceskilllevel":0,"skillexp":0,"skillid1":0,"skillid2":0,"skillid3":0,"skillid4":0,"star":0,"typeid":8000000,"weaponid":0});
                editIndex = $('#dg').datagrid('getRows').length-1;
                $('#dg').datagrid('selectRow', editIndex).datagrid('beginEdit', editIndex);
            }
                // $.post("/addAdventurers",{uid:request("uid")},function(){
                //    updatePvPList();
                //    });
        }
        function unlockskill()
        {
            var parm = $("#dg").datagrid("getSelected");
            if(parm)
            {
                var instid=parm.instid;
                $.post("/unlockskill",{uid:request("uid"),instid:instid,reg:request("reg")},function(data){
                    connect();
                });
            }

        }
        function appendAll(){
            $.post("/addAllAdv",{uid:request("uid"),reg:request("reg")},function(){
                updatePvPList();
            })
        }
        function appendAllOthers(){
            var tid = prompt("输入TypeID(为空表示全部生成)");
            if (tid!=null) {
                var cmd = tid;
                if (cmd=="") {cmd="1:1"};
                $.post("/addotheradvs",{uid:request("uid"),cmd:cmd,reg:request("reg")},function(data){
                    if (data) {
                        alert(data);
                    }else
                        alert("I'm copy");
                 });
            };

        }
        function apendAllFamiliars(){
             $.post("/addallfamiliars",{uid:request("uid"),reg:request("reg")},function(){
                loadFamiliar();
            })
        }
        function removeit(){
            if (editIndex == undefined){return}
            $('#dg').datagrid('cancelEdit', editIndex)
                    .datagrid('deleteRow', editIndex);
            editIndex = undefined;
        }
        function clearit(){
            if (confirm('重置账号?')) {
            $.post("/clearplay",{uid:uid,reg:request("reg")},function(){
                overHandle();
                load();
            });
            };
        }
        function clearAdv(){
            if(confirm('重置冒险者？'))
            {
                $.post('/clearAdventurer',{uid:uid,reg:request("reg")},function(){
                    connect();
                })
            }
        }
        function outsideAdv(){
                $.post("/newoutsideadv",{uid:uid,reg:request("reg")},function(){

                });

        }
        function deleteAdv(){
            var objAdv = $("#dg").datagrid("getSelected");
            if (objAdv==null) {
                    alert("没有选中的冒险者");
                    return;
            };
            if(endEditing()){
                var instid = parseInt(objAdv.instid);

                if (confirm('删除选中的冒险者？')) {
                    $.post("/deladv",{uid:uid,instid:instid,reg:request("reg")},function(){
                        connect();
                    });
                };
            }
        }
        function clearRecode(){
            if (confirm ("重置记录?")) {
                 $.post('/clearmyrecode',{uid:uid,reg:request("reg")},function(data){
                    //getallrecode();
                    getrecode();
                });
            }
        }
        function clearstorage(){
            if (confirm ("重置仓库?")) {
                 $.post('/storageclear',{uid:uid,reg:request("reg")},function(data){
                    overHandle();
                    //getallrecode();
                });
            }
        }
        function clearBackup(){
            if (confirm("重置备份?")) {
                $.post('/clearbackup',{uid:uid,reg:request("reg")},function(data){
                    overHandle();
                    getbackuplist();
                });
            }
        }
        function accept(){
            if (endEditing()){
                var rows = $("#dg").datagrid('getChanges');
                var validated = true;
                var msg = "";
                //把rows里的skills技能重置一下

                if (rows.length>0&&validated) {
                   // alert(JSON.stringify(rows));
                    $.post("/editAdventurer",{data:rows,uid:uid,type:2,reg:request("reg"),base:{}},function(){
                        updatePvPList();
                        loadEquip();
                    });
                    $('#dg').datagrid('acceptChanges');
                }else{
                    //alert(JSON.stringify(rows)+"changes error");
                }
            }
        }
        function reject(){
            $('#dg').datagrid('rejectChanges');
            editIndex = undefined;
        }
        function getChanges(){
            var rows = $('#dg').datagrid('getChanges');
            alert("Num:"+rows.length+"\n"+JSON.stringify(rows));

        }
        function onEndEdit(index,row,changes){
            var validated = true;
            var msg = "";
               // if(!IsRaceClass(row.raceid+"",row.classid+""))
               // {
               //      //alert("InstId:"+rows[i].instid+"的种族职业冲突，请重新选择");
               //      msg+="InstId:"+row.instid+"的种族职业冲突，请重新选择\n";
               //      msg+="currentRaceId+classId:"+row.raceid+row.classid+"\n";
               //      validated = false;
               // }
               // // //验证人类技能
               // // if(parseInt(row.raceid)!=5000000)
               // // {
               // //      if (row.skillid3) {
               // //          if (row.skillid3.length>0) {
               // //              msg +="InstId:"+row.instid+"不是人类，不能使用技能3";
               // //              validated = false;
               // //          }
               // //      }
               // // }
               // if(!(IsSkillType(row.skillid1+"",row.classid+"")))
               // {
               //      //alert("skillid1:"+rows[i].skillid1+"\n"+"classid:"+rows[i].classid);
               //      msg+="InstId:"+row.instid+" 职业技能1冲突\n";
               //      msg+="skillid1:"+row.skillid1+",classid:"+row.classid+"\n";
               //      validated = false;
               // }
               // if(!IsSkillType(row.skillid2+"",row.classid+""))
               // {
               //      msg+="InstId:"+row.instid+" 职业技能2冲突\n";
               //      msg+="skillid2:"+row.skillid2+",classid:"+row.classid+"\n";
               //      validated = false;
               // }
               // if(!IsSkillType(row.skillid3+"",row.classid+""))
               // {
               //      msg+="InstId:"+row.instid+" 职业技能3冲突\n";
               //      msg+="skillid3:"+row.skillid3+",classid:"+row.classid+"\n";
               //      validated = false;
               // }
            row.exp = GetExpByLevel(row.level);
           if(!validated){
               // alert(msg);
           }
        }
        function  setrecode(){
            $.post('/setrecode',{uid:uid,reg:request("reg")},function(data){
                    alert("finished setrecode");
            });
        }
        function getrecode(){
            $.post('/getrecode',{uid:uid,reg:request("reg")},function(data){
               // alert(JSON.stringify(data));
                $("#dgState").datagrid("loadData",data);
            });
        }
        function getallrecode(){
            $.post('/getallrecode',{uid:uid,reg:request("reg")},function(data){
                    //$('#dgState').datagrid({url:'/getallrecode'});

            });
        }
        $(function(){
            $(':file').change(function(){
                var file = this.files[0];
                var name = file.name;
                var size = file.size;
                var type = file.type;
                if(size>845240)
                {
                    alert("文件过大，传错了吧！！！");
                    this.files[0]=undefined;
                }
                else
                {
                    importUpload(file);
                }
                //Your validation
            });
        });
        function progressHandlingFunction(e){
            if(e.lengthComputable){
                $('progress').attr({value:e.loaded,max:e.total});
            }
        }
        function importUpload(file){
            var formData = new FormData();
            formData.append("uploadfile",$(":file").get(0).files[0]);
            formData.append("uid",request("uid"));

            var xhr = new XMLHttpRequest();
            xhr.upload.addEventListener("progress", uploadProgress, false);
            xhr.addEventListener("load", uploadComplete, false);
            xhr.addEventListener("error", uploadFailed, false);
            xhr.addEventListener("abort", uploadCanceled, false);xhr.open("POST", "/import");
            xhr.send(formData);
        }


        function uploadProgress(evt) {
            if(evt.lengthComputable) {
                var percentComplete = Math.round(evt.loaded * 100 / evt.total);
                $('#progress').text(percentComplete.toString() + "%");
            } else {
                $('#progress').text('unable to compute');
            }
        }

        function uploadComplete(evt) {
            uploadProgress(evt);
            alert("操作成功");
            getbackuplist();
            $("#fileform")[0].reset();
        }

        function uploadFailed(evt) {
            alert("There was an error attempting to upload the file.");
        }

        function uploadCanceled(evt) {
            alert("The upload has been canceled by the user or the browser dropped the connection.");
        }

        function importBackup(){
            var ie=navigator.appName=="Microsoft Internet Explorer" ? true : false;
            if(ie){
            document.getElementById("file").click();
            document.getElementById("filename").value=document.getElementById("file").value;
            }else{
            var a=document.createEvent("MouseEvents");//FF的处理
            a.initEvent("click", true, true);
            document.getElementById("file").dispatchEvent(a);
            }
            // $.post("/import",{uid:uid,reg:request("reg")},function(){
            //     getbackuplist();
            // });
        }
        function exportBackup(){
          //  $.post("/export",{uid:uid,reg:request("reg")},function(){});
            $.ajax({
                type: "POST",
                url: "/export",
                dataType:"binary",
                data: {uid:uid,reg:request("reg")},
                success: function(response, status, xhr) {
                    // check for a filename
                    var filename = "";
                    var disposition = xhr.getResponseHeader('Content-Disposition');
                    if (disposition && disposition.indexOf('attachment') !== -1) {
                        var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                        var matches = filenameRegex.exec(disposition);
                        if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, '');
                    }

                    var type = xhr.getResponseHeader('Content-Type');
                    var blob = new Blob([response], { type: "application/octet-stream" });

                    if (typeof window.navigator.msSaveBlob !== 'undefined') {
                        // IE workaround for "HTML7007: One or more blob URLs were revoked by closing the blob for which they were created. These URLs will no longer resolve as the data backing the URL has been freed."
                        window.navigator.msSaveBlob(blob, filename);
                    } else {
                        var URL = window.URL || window.webkitURL;
                        var downloadUrl = URL.createObjectURL(blob);

                        if (filename) {
                            // use HTML5 a[download] attribute to specify filename
                            var a = document.createElement("a");
                            // safari doesn't support this yet
                            if (typeof a.download === 'undefined') {
                                window.location = downloadUrl;
                            } else {
                                a.href = downloadUrl;
                                a.download = filename;
                                document.body.appendChild(a);
                                a.click();
                            }
                        } else {
                            window.location = downloadUrl;
                        }

                        setTimeout(function () { URL.revokeObjectURL(downloadUrl); }, 100); // cleanup
                    }
                }
            });
        }
        function cloneBackup () {
            // body...
            var name;
            var userName = prompt("存取的用户名:",uname);
            if (userName!=null) {
                $.post('/getUserID',{username:userName,reg:request("reg")},function(data){
                    var targetUid=data;
                    alert("targetUid:"+targetUid);
                    if (targetUid) {
                        if (!name) {
                            name="1";
                        }
                        name = escape(name);
                        $.post('/getallbackup',{uid:uid,name:name,targetuid:targetUid,reg:request("reg")},function(data){
                            load();
                        });
                    };
                });
            }
        }
        function setbackup(){
            var name = prompt("存档名:","0");
            var userName = prompt("存取的用户名:",uname);
            var isfacebook = confirm("是否是FaceBook账号?");

            if (name!=null&&userName!=null) {
                var intFaceB = "0";
                if(isfacebook)
                    intFaceB = "1";
                 $.post('/getUserID',{username:userName,isfacebook:intFaceB,reg:request("reg")},function(data){
                    var targetUid=data;
                    alert("targetUid:"+targetUid);
                    if (targetUid) {
                        if (!name) {
                            name="";
                        }
                        name = escape(name);
                        $.post('/setbackup',{uid:uid,name:name,targetuid:targetUid,reg:request("reg")},function(data){
                            getbackuplist();
                        });
                    };
                });
            };
        }
        function updatePvPList(){
            var advs = $("#dg").datagrid("getRows");
            var results = [];
            //alert("abc");
            for (var i = advs.length - 1; i >= 0; i--) {
                if(advs[i].istatus == "P"){
                    results.push(advs[i].instid);
                }
            };
            $.post('/editpvp',{uid:uid,data:results,reg:request("reg")},function(data){
                connect();
            });
        }
        function getbackup(){
            var cmd = $("#dgBack").datagrid("getSelected").date;
            if (cmd) {
                $.post('/getbackup',{uid:uid,cmd:cmd,reg:request("reg")},function(data){
                     location.reload();
                })
            }
        }

        function getbackuplist(){
            $("#bgBack").datagrid('loadData', { total: 0, rows: [] });
            $("#dgBack").datagrid({url:'/getbackuplist?uid='+uid+'&type=1'});
        }
        function getBackupDate(val,row){
            var parm =new Date(parseInt(val)*1000);
            return parm.toLocaleString();
        }
        function formatterVic(val,row){
            if(val=="1")
                return "输";
            else
                return "赢";
        }
        function formatterDateStr(val,row){
            var parm;


            if (isNaN(val)) {
                parm = new Date(val);
            }
            else{
                parm = new Date(val*1000)
            }
            return parm.toLocaleString();
        }
        function formatDate(val,row)
        {
            if(isNaN(val))
                {
                    val = row.begindate = Date.parse(val);
                }
                return (new Date(parseInt(val))).format("yyyy-MM-dd hh:mm:ss");
        }    
//       　function formatDate(now) {
//     　　var year=now.getYear();
//     　　var month=now.getMonth()+1;
//     　　var date=now.getDate();
//     　　var hour=now.getHours();
//     　　var minute=now.getMinutes();
//     　　var second=now.getSeconds();
//     　　return year+"-"+month+"-"+date+" "+hour+":"+minute+":"+second;
// 　　    }
        function update2Global(intType)
        {
            $.post("/update2global",{type:intType,uid:uid,reg:request("reg")},function(data){
                overHandle();
            });
        }
        function overHandle()
        {
            alert("操作完成");
        }
        function getuser(){
            $.post('/user',{uid:uid,reg:request("reg")},function(data){
                overHandle();
                $('#user').text(data);                         });
        }
        function getglobaluser(){
            $.post('/globaluser',{uid:uid,cmd:uid,reg:request("reg")},function(data){
                overHandle();
                $('#globaluser').text(data);
            })
        }
        function loadDGBackError(){
            $("#bgBack").datagrid('loadData', { total: 0, rows: [] });          }
        function test(){

        }
        function GetPgChanges(){
            var rows = $('#pg').propertygrid('getChanges');
            alert(JSON.stringify(rows));
        }
        function AcceptPgChanges(){
            var rows = $("#pg").propertygrid("getRows");

            var parm = "{";
            for (var i = rows.length - 1; i >= 0; i--) {
                if (!isNaN(rows[i].value)&&rows[i].value!="")
                    parm += rows[i].name + ":" + rows[i].value +",";
                else if(typeof rows[i].value == "array" || typeof rows[i].value == "object")
                    parm += rows[i].name + ":[],";
                else
                    parm += rows[i].name + ":'" + rows[i].value  +"',";
             }
            parm = parm.substring(0,parm.length-1);
            parm += "}";
            parm = eval("("+parm+")");

            if(parm.GuildExitDate)
                parm.GuildExitDate = parseUTC(parm.GuildExitDate)/1000;
            if(parm.MCard)
                parm.MCard = parseUTC(parm.MCard)/1000;
            if(parm.SeniorMCard)
                parm.SeniorMCard = parseUTC(parm.SeniorMCard)/1000;

           // parm.uid = uid;
            if (ValidatePDLevelID(parm.Level,parm)) {
               // alert(JSON.stringify(parm));
               var url = "/tavernedit2";
               var arrChanges = $("#pg").propertygrid("getChanges");
               for(var i = 0;i<arrChanges.length;i++)
               {
                var change = arrChanges[i];
                if(change.name=="GemBuy"||change.name=="GemOther")
                    {
                        url="/tavernedit";
                        break;
                    }
               }
                $.post(url,{uid:uid,data:parm,reg:request("reg"),base:baseTavern},function(data){
                    loadTavern();
                });
            }
        }
        function PgClear(){
            if(confirm("重置基本信息么?"))
            {
                $.post("/tavernclear",{uid:uid,reg:request("reg")},function(data){
                    loadTavern();
                });
            }
        }
        //
        // int editIndexDgwea;
        // function addWeapon(){
        //     $("#dgwea").datagrid('appendRow',{typeid:0,count:0});
        // }
        // function endEditOnDgwea(){

        // }
        // function editWeapon(){
        //      var rows = $("#dgwea").datagrid("getChanges");
        //          $.post("/storageedit",{uid:uid,category:weaCategory,data:rows},function(re){});
        // }
        // function onClickDgweaRow(index){
        //     $('#dgwea').datagrid('selectRow', index)
        //                     .datagrid('beginEdit', index);
        // }
        // function rejectDgwea(){
        //     $('#dgwea').datagrid('rejectChanges');
        // }
        // function getDgweaChanges(){
        //     var rows = $("#dgwea").datagrid('getChanges');
        //     alert(JSON.stringify(rows));
        // }
        // function endEditingDgwea(){
        //     if (editIndex == undefined){return true}
        //     if ($('#dgwea').datagrid('validateRow', editIndex)){
        //         //var ed = $('#dg').datagrid('getEditor', {index:editIndex,field:'productid'});
        //         // var productname = $(ed.target).combobox('getText');
        //         // $('#dg').datagrid('getRows')[editIndex]['productname'] = productname;
        //          $('#dgwea').datagrid('endEdit', editIndex);
        //         editIndex = undefined;
        //         return true;
        //     } else {
        //         return false;
        //     }
        // }
        var editIndexDgwea = undefined;
        function endEditingDgwea(){
            if (editIndexDgwea == undefined){return true}
            if ($('#dgwea').datagrid('validateRow', editIndexDgwea)){
                // var ed = $('#dgwea').datagrid('getEditor', {index:editIndex,field:'productid'});
                // var productname = $(ed.target).combobox('getText');
                // $('#dgwea').datagrid('getRows')[editIndex]['productname'] = productname;
                $('#dgwea').datagrid('endEdit', editIndexDgwea);
                editIndexDgwea = undefined;
                return true;
            } else {
                return false;
            }
        }
        function onClickRowDgwea(index){
            if (editIndexDgwea != index){
                if (endEditingDgwea()){
                    $('#dgwea').datagrid('selectRow', index)
                            .datagrid('beginEdit', index);
                    editIndexDgwea = index;
                    UpdateSkill();
                } else {
                    $('#dgwea').datagrid('selectRow', editIndexDgwea);
                }
            }
        }
        function appendDgwea(){
            if (endEditingDgwea()){
                $('#dgwea').datagrid('appendRow',{tid:0,count:0});
                editIndexDgwea = $('#dgwea').datagrid('getRows').length-1;
                $('#dgwea').datagrid('selectRow', editIndexDgwea)
                        .datagrid('beginEdit', editIndexDgwea);
            }
        }
        function removeitDgwea(){
            if (editIndexDgwea == undefined){return}
            $('#dgwea').datagrid('cancelEdit', editIndexDgwea)
                    .datagrid('deleteRow', editIndexDgwea);
            editIndexDgwea = undefined;
        }
        function acceptDgwea(){
            if (endEditingDgwea()){
                var rows = $("#dgwea").datagrid("getChanges");
                $.post("/storageedit",{uid:uid,category:weaCategory,data:rows,reg:request("reg")},function(re){});
                $('#dgwea').datagrid('acceptChanges');
            }
        }
        function rejectDgwea(){
            $('#dgwea').datagrid('rejectChanges');
            editIndexDgwea = undefined;
        }
        function getChangesDgwea(){
            var rows = $('#dgwea').datagrid('getChanges');
            alert(rows.length+' rows are changed!');
        }
      // }
        var editIndexDgarmer = undefined;
        function endEditingDgarmer(){
            if (editIndexDgarmer == undefined){return true}
            if ($('#dgarmer').datagrid('validateRow', editIndexDgarmer)){
                // var ed = $('#dgwea').datagrid('getEditor', {index:editIndex,field:'productid'});
                // var productname = $(ed.target).combobox('getText');
                // $('#dgwea').datagrid('getRows')[editIndex]['productname'] = productname;
                $('#dgarmer').datagrid('endEdit', editIndexDgarmer);
                editIndexDgarmer = undefined;
                return true;
            } else {
                return false;
            }
        }
        function onClickRowDgarmer(index){
            if (editIndexDgarmer != index){
                if (endEditingDgarmer()){
                    $('#dgarmer').datagrid('selectRow', index)
                            .datagrid('beginEdit', index);
                    editIndexDgarmer = index;
                } else {
                    $('#dgarmer').datagrid('selectRow', editIndexDgarmer);
                }
            }
        }
        function appendDgarmer(){
            if (endEditingDgarmer()){
                $('#dgarmer').datagrid('appendRow',{tid:0,count:0});
                editIndexDgarmer = $('#dg').datagrid('getRows').length-1;
                $('#dgarmer').datagrid('selectRow', editIndexDgarmer)
                        .datagrid('beginEdit', editIndexDgarmer);
            }
        }
        function removeitDgarmer(){
            if (editIndexDgarmer == undefined){return}
            $('#dgarmer').datagrid('cancelEdit', editIndexDgarmer)
                    .datagrid('deleteRow', editIndexDgarmer);
            editIndexDgarmer = undefined;
        }
        function acceptDgarmer(){
            if (endEditingDgarmer()){
                var rows = $("#dgarmer").datagrid("getChanges");
                $.post("/storageedit",{uid:uid,category:armCategory,data:rows,reg:request("reg")},function(re){});
                $('#dgarmer').datagrid('acceptChanges');
            }
        }
        function rejectDgarmer(){
            $('#dgarmer').datagrid('rejectChanges');
            editIndexDgarmer = undefined;
        }
        function getChangesDgarmer(){
            var rows = $('#dgarmer').datagrid('getChanges');
            alert(rows.length+' rows are changed!');
        }

//
       var editIndexDgitem = undefined;
        function endEditingDgitem(){
            if (editIndexDgitem == undefined){return true}
            if ($('#dgitem').datagrid('validateRow', editIndexDgitem)){
                // var ed = $('#dgwea').datagrid('getEditor', {index:editIndex,field:'productid'});
                // var productname = $(ed.target).combobox('getText');
                // $('#dgwea').datagrid('getRows')[editIndex]['productname'] = productname;
                $('#dgitem').datagrid('endEdit', editIndexDgitem);
                editIndexDgitem = undefined;
                return true;
            } else {
                return false;
            }
        }
        function onClickRowDgitem(index){
            if (editIndexDgitem != index){
                if (endEditingDgitem()){
                    $('#dgitem').datagrid('selectRow', index)
                            .datagrid('beginEdit', index);
                    editIndexDgitem = index;
                } else {
                    $('#dgitem').datagrid('selectRow', editIndexDgitem);
                }
            }
        }
        function appendDgitem(){
            if (endEditingDgitem()){
                $('#dgitem').datagrid('appendRow',{tid:0,count:0});
                editIndexDgitem = $('#dgitem').datagrid('getRows').length-1;
                $('#dgitem').datagrid('selectRow', editIndexDgitem)
                        .datagrid('beginEdit', editIndexDgitem);
            }
        }
        function removeitDgitem(){
            if (editIndexDgitem == undefined){return}
            $('#dgitem').datagrid('cancelEdit', editIndexDgitem)
                    .datagrid('deleteRow', editIndexDgitem);
            editIndexDgitem = undefined;
        }
        function acceptDgitem(){
            if (endEditingDgitem()){
                var rows = $("#dgitem").datagrid("getChanges");
                $.post("/storageedit",{uid:uid,category:itemCategory,data:rows,reg:request("reg")},function(re){});
                $('#dgitem').datagrid('acceptChanges');
            }
        }
        function rejectDgitem(){
            $('#dgitem').datagrid('rejectChanges');
            editIndexDgitem = undefined;
        }
        function getChangesDgitem(){
            var rows = $('#dgitem').datagrid('getChanges');
            alert(rows.length+' rows are changed!');
        }
//
       var editIndexDgmtr = undefined;
        function endEditingDgmtr(){
            if (editIndexDgmtr == undefined){return true}
            if ($('#dgmtr').datagrid('validateRow', editIndexDgmtr)){
                // var ed = $('#dgwea').datagrid('getEditor', {index:editIndex,field:'productid'});
                // var productname = $(ed.target).combobox('getText');
                // $('#dgwea').datagrid('getRows')[editIndex]['productname'] = productname;
                $('#dgmtr').datagrid('endEdit', editIndexDgmtr);
                editIndexDgmtr = undefined;
                return true;
            } else {
                return false;
            }
        }
        function onClickRowDgmtr(index){
            if (editIndexDgmtr != index){
                if (endEditingDgmtr()){
                    $('#dgmtr').datagrid('selectRow', index)
                            .datagrid('beginEdit', index);
                    editIndexDgmtr = index;
                } else {
                    $('#dgmtr').datagrid('selectRow', editIndexDgmtr);
                }
            }
        }
        function appendDgmtr(){
            if (endEditingDgmtr()){
                $('#dgmtr').datagrid('appendRow',{tid:0,count:0});
                editIndexDgmtr = $('#dgmtr').datagrid('getRows').length-1;
                $('#dgmtr').datagrid('selectRow', editIndexDgmtr)
                        .datagrid('beginEdit', editIndexDgmtr);
            }
        }
        function appendAllskilldebres()
        {
            var skilldebres = [9300010,9300011,9300012,9300030,9300031,9300032,9300033,9300110,9300111,9300112,9300130,9300131,9300132,9300133,9300210,9300211,9300212,9300230,9300231,9300232,9300233,9300310,9300311,9300312,9300330,9300331,9300332,9300333,9300410,9300411,9300412,9300430,9300431,9300432,9300433,9300510,9300511,9300512,9300530,9300531,9300532,9300533,9300610,9300611,9300612,9300630,9300631,9300632,9300633];
             if (endEditingDgmtr()){
                var rows=[];
                for(var i=0;i<skilldebres.length;i++)
                {
                    var skilldebre = skilldebres[i];

                    var row = {tid:skilldebre,count:1000,typeid:skilldebre,id:skilldebre,instid:0};
                    rows.push(row);
                }
                $.post("/storageedit",{uid:uid,category:mtrCategory,data:rows,reg:request("reg")},function(re){
                    $('#dgmtr').datagrid('acceptChanges');
                    loadMtr();
                });
            }
        }
        function removeitDgmtr(){
             var objMtr = $("#dgmtr").datagrid("getSelected");
             if(objMtr==null)
             {
                alert("没有选中材料！");
                return;
             }
             var tid = objMtr.typeid;
             if (endEditingDgmtr()) {
                    $.post("/storagedel",{uid:uid,tid:tid,reg:request("reg")},function(){
                        loadMtr();
                    });
             };
        }
        function acceptDgmtr(){
            if (endEditingDgmtr()){
                var rows = $("#dgmtr").datagrid("getChanges");
                $.post("/storageedit",{uid:uid,category:mtrCategory,data:rows,reg:request("reg"),base:baseMeterial},function(re){});
                $('#dgmtr').datagrid('acceptChanges');
            }
        }
        function rejectDgmtr(){
            $('#dgmtr').datagrid('rejectChanges');
            editIndexDgmtr = undefined;
        }
        function getChangesDgmtr(){
            var rows = $('#dgmtr').datagrid('getChanges');
            alert(rows.length+' rows are changed!');
        }
//
       var editIndexDgdish = undefined;
        function endEditingDgdish(){
            if (editIndexDgdish == undefined){return true}
            if ($('#dgdish').datagrid('validateRow', editIndexDgdish)){
                // var ed = $('#dgwea').datagrid('getEditor', {index:editIndex,field:'productid'});
                // var productname = $(ed.target).combobox('getText');
                // $('#dgwea').datagrid('getRows')[editIndex]['productname'] = productname;
                $('#dgdish').datagrid('endEdit', editIndexDgdish);
                editIndexDgdish = undefined;
                return true;
            } else {
                return false;
            }
        }
        function onClickRowDgdish(index){
            if (editIndexDgdish != index){
                if (endEditingDgdish()){
                    $('#dgdish').datagrid('selectRow', index)
                            .datagrid('beginEdit', index);
                    editIndexDgdish = index;
                } else {
                    $('#dgdish').datagrid('selectRow', editIndexDgdish);
                }
            }
        }
        function appendDgdish(){
            if (endEditingDgdish()){
                $('#dgdish').datagrid('appendRow',{tid:0,count:0});
                editIndexDgdish = $('#dgdish').datagrid('getRows').length-1;
                $('#dgdish').datagrid('selectRow', editIndexDgdish)
                        .datagrid('beginEdit', editIndexDgdish);
            }
        }
        function removeitDgdish(){
            var obj = $("#dgdish").datagrid("getSelected");
            if (obj==null) {
                alert("未选中烹饪");
                return;
            };
            var tid = obj.typeid;
            $.post("/storagedel",{uid:uid,tid:tid,reg:request("reg")},function(data){
                loadDish();
            })

            if (editIndexDgdish == undefined){return}
            $('#dgdish').datagrid('cancelEdit', editIndexDgdish)
                    .datagrid('deleteRow', editIndexDgdish);
            editIndexDgdish = undefined;
        }
        function acceptDgdish(){
            if (endEditingDgdish()){
                var rows = $("#dgdish").datagrid("getChanges");
                $.post("/storageedit",{uid:uid,category:dishCategory,data:rows,reg:request("reg"),base:baseDish},function(re){});
                $('#dgdish').datagrid('acceptChanges');
            }
        }
        function rejectDgdish(){
            $('#dgdish').datagrid('rejectChanges');
            editIndexDgdish = undefined;
        }
        function getChangesDgdish(){
            var rows = $('#dgdish').datagrid('getChanges');
            alert(rows.length+' rows are changed!');
        }
//
       var editIndexDgskill = undefined;
        function endEditingDgskill(){
            if (editIndexDgskill == undefined){return true}
            if ($('#dgskill').datagrid('validateRow', editIndexDgskill)){
                // var ed = $('#dgwea').datagrid('getEditor', {index:editIndex,field:'productid'});
                // var productname = $(ed.target).combobox('getText');
                // $('#dgwea').datagrid('getRows')[editIndex]['productname'] = productname;
                $('#dgskill').datagrid('endEdit', editIndexDgskill);
                editIndexDgskill = undefined;
                return true;
            } else {
                return false;
            }
        }
        function onClickRowDgskill(index){
            if (editIndexDgskill != index){
                if (endEditingDgskill()){
                    $('#dgskill').datagrid('selectRow', index)
                            .datagrid('beginEdit', index);
                    editIndexDgskill = index;
                } else {
                    $('#dgskill').datagrid('selectRow', editIndexDgskill);
                }
            }
        }
        function appendDgskill(){
            if (endEditingDgskill()){
                $('#dgskill').datagrid('appendRow',{tid:0,count:0});
                editIndexDgskill = $('#dgskill').datagrid('getRows').length-1;
                $('#dgskill').datagrid('selectRow', editIndexDgskill)
                        .datagrid('beginEdit', editIndexDgskill);
            }
        }
        function removeitDgskill(){
            if (editIndexDgskill == undefined){return}
            $('#dgskill').datagrid('cancelEdit', editIndexDgskill)
                    .datagrid('deleteRow', editIndexDgskill);
            editIndexDgskill = undefined;
        }
        function acceptDgskill(){
            if (endEditingDgskill()){
                var rows = $("#dgskill").datagrid("getChanges");
                $.post("/storageedit",{uid:uid,category:skillCategory,data:rows,reg:request("reg"),base:baseSkill},function(re){});
                $('#dgskill').datagrid('acceptChanges');
            }
        }
        function rejectDgskill(){
            $('#dgskill').datagrid('rejectChanges');
            editIndexDgskill = undefined;
        }
        function getChangesDgskill(){
            var rows = $('#dgskill').datagrid('getChanges');
            alert(rows.length+' rows are changed!');
        }

//
//
       var editIndexDgquest= undefined;
        function endEditingDgquest(){
            if (editIndexDgquest== undefined){return true}
            if ($('#dgquest').datagrid('validateRow', editIndexDgquest)){
                // var ed = $('#dgwea').datagrid('getEditor', {index:editIndex,field:'productid'});
                // var productname = $(ed.target).combobox('getText');
                // $('#dgwea').datagrid('getRows')[editIndex]['productname'] = productname;
                var row = $("#dgquest").datagrid('getRows')[editIndexDgquest];
                if(row.lastplaytime){
                    if (isNaN(row.lastplaytime)) {
                        row.lastplaytime = ((new Date(row.lastplaytime)).getTime())/1000;
                    }
                }
                if (row.starttime) {
                    if(isNaN(row.starttime)){
                        row.starttime = ((new Date(row.starttime)).getTime())/1000;
                    }
                }
                $('#dgquest').datagrid('endEdit', editIndexDgquest);
                editIndexDgquest= undefined;
                return true;
            } else {
                return false;
            }
        }
        function onClickRowDgquest(index){
            if (editIndexDgquest!= index){
                if (endEditingDgquest()){
                    $('#dgquest').datagrid('selectRow', index)
                            .datagrid('beginEdit', index);
                    editIndexDgquest= index;
                } else {
                    $('#dgquest').datagrid('selectRow', editIndexDgquest);
                }
            }
        }
        function appendDgquest(){
            if (endEditingDgquest()){
                $('#dgquest').datagrid('appendRow',{typeid:0,star:1,playcount:0,starttime:0,lastplaytime:0,cmplv:0});
                editIndexDgquest= $('#dgquest').datagrid('getRows').length-1;
                $('#dgquest').datagrid('selectRow', editIndexDgquest)
                        .datagrid('beginEdit', editIndexDgquest);
            }
        }
        function removeitDgquest(){
            if (editIndexDgquest== undefined){return}

            var obj = $("#dgquest").datagrid("getSelected");
            if(obj==null)
            {
                alert("未选中任务！");
                return ;
            }
            var typeid = obj.typeid;
            $.post("/questdel",{uid:uid,cmd:typeid,reg:request("reg")},function(data){
                loadQuest();
            });

            $('#dgquest').datagrid('cancelEdit', editIndexDgquest)
                    .datagrid('deleteRow', editIndexDgquest);
            editIndexDgquest= undefined;

        }
        function acceptDgquest(){
            if (endEditingDgquest()){
                var rows = $("#dgquest").datagrid("getChanges");
                $.post("/questedit",{uid:uid,data:rows,reg:request("reg"),base:baseQuest},function(re){});
                $('#dgquest').datagrid('acceptChanges');
            }
        }
        function rejectDgquest(){
            $('#dgquest').datagrid('rejectChanges');
            editIndexDgquest= undefined;
        }
        function getChangesDgquest(){
            var rows = $('#dgquest').datagrid('getChanges');
            alert(rows.length+' rows are changed!');
        }
        function clearDgquest(){
            $.post('/questclear',{uid:uid,reg:request("reg")},function(re){
                loadQuest();
            });
        }
        function unlockChapter()
        {
             $.post('/unlockchapter',{uid:uid,reg:request("reg")},function(re){
                loadQuest();            });
        }


//
//
       var editIndexDgtask= undefined;
        function endEditingDgtask(){
            if (editIndexDgtask== undefined){return true}
            if ($('#dgtask').datagrid('validateRow', editIndexDgtask)){
                // var ed = $('#dgwea').datagrid('getEditor', {index:editIndex,field:'productid'});
                // var productname = $(ed.target).combobox('getText');
                // $('#dgwea').datagrid('getRows')[editIndex]['productname'] = productname;
                var row = $("#dgtask").datagrid('getRows')[editIndexDgtask];
                // if(row.lastplaytime){
                //     if (isNaN(row.lastplaytime)) {
                //         row.lastplaytime = ((new Date(row.lastplaytime)).getTime())/1000;
                //     }
                // }
                // if (row.starttime) {
                //     if(isNaN(row.starttime)){
                //         row.starttime = ((new Date(row.starttime)).getTime())/1000;
                //     }
                // }
                $('#dgtask').datagrid('endEdit', editIndexDgtask);
                editIndexDgtask= undefined;
                return true;
            } else {
                return false;
            }
        }
        function onClickRowDgtask(index){
            if (editIndexDgtask!= index){
                if (endEditingDgtask()){
                    $('#dgtask').datagrid('selectRow', index)
                            .datagrid('beginEdit', index);
                    editIndexDgtask= index;
                } else {
                    $('#dgtask').datagrid('selectRow', editIndexDgtask);
                }
            }
        }
        function appendDgtask(){
            if (endEditingDgtask()){
                $('#dgtask').datagrid('appendRow',{tasktype_finishtype:null,tasktype:null,finishtype:null,finishvalue:0});
                editIndexDgtask= $('#dgtask').datagrid('getRows').length-1;
                $('#dgtask').datagrid('selectRow', editIndexDgtask)
                        .datagrid('beginEdit', editIndexDgtask);
            }
        }
        function removeitDgtask(){
            if (editIndexDgtask== undefined){return}
            $('#dgtask').datagrid('cancelEdit', editIndexDgtask)
                    .datagrid('deleteRow', editIndexDgtask);
            editIndexDgtask= undefined;
        }
        function acceptDgtask(){
            if (endEditingDgtask()){
                var rows = $("#dgtask").datagrid("getChanges");
                $.post("/taskedit",{uid:uid,data:rows,reg:request("reg"),base:baseTask},function(re){});
                $('#dgtask').datagrid('acceptChanges');
            }
        }
        function rejectDgtask(){
            $('#dgtask').datagrid('rejectChanges');
            editIndexDgtask= undefined;
        }
        function getChangesDgtask(){
            var rows = $('#dgtask').datagrid('getChanges');
            alert(rows.length+' rows are changed!');
        }
        function clearDgtask(){
            $.post('/taskclear',{uid:uid,reg:request("reg")},function(re){
            });
        }
//
        var editIndexFamiliar = undefined;
        function acceptFamiliar(){
            if (endEditingFamiliar()){
                var rows = $("#dgFamiliar").datagrid('getChanges');
                var validated = true;
                var msg = "";

                if (rows.length>0&&validated) {
                    $.post("/editFamiliar",{data:rows,uid:uid,type:2,reg:request("reg"),base:baseFamiliar},function(){
                    });
                    $('#dgFamiliar').datagrid('acceptChanges');
                }else if(!validated)
                {
                    alert(msg);
                }
            }
        }
        function rejectFamiliar(){
            $('#dgFamiliar').datagrid('rejectChanges');
            editIndexFamiliar = undefined;
        }
        function getChangesFamiliar(){
            var rows = $('#dgFamiliar').datagrid('getChanges');
            alert("Num:"+rows.length+"\n"+JSON.stringify(rows));

        }
        function delelteFamiliar(){

            var obj  = $("#dgFamiliar").datagrid("getSelected");
            if (!obj) {
                alert("未选中佣兽");
                return;
            };
            var instid = obj.instid;
            if(confirm("删除么?"))
            {
                $.post("/delfamiliar",{uid:uid,instid:instid,reg:request("reg")},function(data){
                    loadFamiliar();
                });
            }
        }
        function clearAdvFamiliar(){
            if(confirm('重置佣兽？'))
            {
                $.post('/clearFamiliar',{uid:uid,reg:request("reg")},function(){
                    loadFamiliar();                })
            }
        }
        function onClickRowFamiliar(index){
            if (editIndexFamiliar != index){
                if (endEditing()){
                    $('#dgFamiliar').datagrid('selectRow', index)
                            .datagrid('beginEdit', index);
                                        editIndexFamiliar = index;

                } else {
                    $('#dgFamiliar').datagrid('selectRow', editIndexFamiliar);
                }
                UpdateSkillFamiliar();
            }

        }
        function appendFamiliar(){
            // if (endEditing()){
            //     $('#dg').datagrid('appendRow',{status:'P'});
            //     editIndex = $('#dg').datagrid('getRows').length-1;
            //     $('#dg').datagrid('selectRow', editIndex)
            //             .datagrid('beginEdit', editIndex);
            // }
                $.post("/addFamiliar",{uid:request("uid"),reg:request("reg")},function(){
                   loadFamiliar();                   });
        }
        function endEditingFamiliar(){
            if (editIndexFamiliar == undefined){return true}
            if ($('#dgFamiliar').datagrid('validateRow', editIndexFamiliar)){
                //var ed = $('#dg').datagrid('getEditor', {index:editIndex,field:'productid'});
                // var productname = $(ed.target).combobox('getText');
                // $('#dg').datagrid('getRows')[editIndex]['productname'] = productname;
                 $('#dgFamiliar').datagrid('endEdit', editIndexFamiliar);
                editIndexFamiliar = undefined;
                return true;
            } else {
                return false;
            }
        }
        function onEditBeginFamiliar(rowIndex,rowData){
            // editIndex = rowIndex;
            UpdateSkillFamiliar();
        }
        function onEditBeforeFamiliar(rowIndex,rowData){
            UpdateSkillFamiliar();
        }
        function UpdateSkillFamiliar(obj){
            var curentClassId=null;
            if (editIndexFamiliar!=undefined) {
                if (obj==undefined) {
                    curentClassId = $("#dgFamiliar").datagrid("getRows")[editIndexFamiliar].classid + "";
                }else{
                    curentClassId = obj.value;
                }
                var skiMgSeed = [];
                //alert(JSON.stringify(skiMg));
                for (var i = skiMg.length - 1; i >= 0; i--) {
                    if(skiMg[i].class != "Familiar")
                        continue;

                        skiMgSeed.push(skiMg[i]);

                }
               var ed1 = $("#dgFamiliar").datagrid('getEditor',{field:'skillid1',index:editIndexFamiliar});
               var ed2 = $("#dgFamiliar").datagrid('getEditor',{field:'skillid2',index:editIndexFamiliar});

              // var ed4 = $("#dg").datagrid('getEditor',{field:'skillid4',index:editIndex});

               //alert(JSON.stringify(skiMgSeed));
               $(ed1.target).combobox('loadData',skiMgSeed);
               $(ed2.target).combobox('loadData',skiMgSeed);

              // $(ed4.target).combobox('loadData',skiMgSeed);

               //$(ed.target).combobox('loadData',skiMgSeed);
            }
        }

//tutorial
//
        var editIndexTutorial = undefined;
        function acceptTutorial(){
            if (endEditingTutorial()){
                var rows = $("#dgTutorial").datagrid('getRows');
                var validated = true;
                var msg = "";
                var data_rows = [];
                //alert(JSON.stringify(rows));
                for(var i=0;i<rows.length;i++)
                   {
                        if(rows[i].isfinish)
                        {
                          //  alert(JSON.stringify(rows[i]));
                            data_rows.push({typeid:rows[i].typeid});
                        }
                   }
                   //alert(JSON.stringify(data_rows));
                if (rows.length>0&&validated) {
                    $.post("/tutorialedit",{data:data_rows,uid:uid,reg:request("reg"),base:baseTutorial},function(){
                        loadTutorial();
                    });
                    $('#dgTutorial').datagrid('acceptChanges');
                }else if(!validated)
                {
                    alert(msg);
                }
            }
        }
        function rejectTutorial(){
            $('#dgTutorial').datagrid('rejectChanges');
            editIndexTutorial = undefined;
        }
        function getChangesTutorial(){
            var rows = $('#dgTutorial').datagrid('getChanges');
            alert("Num:"+rows.length+"\n"+JSON.stringify(rows));
        }
        function clearTutorial(){
            if(confirm('重置tutorial? '))
            {
                $.post('/tutorialclear',{uid:uid,reg:request("reg")},function(){
                    loadTutorial();                })
            }
        }
        function onClickRowTutorial(index){
            if (editIndexTutorial != index){
                if (endEditingTutorial()){
                    $('#dgTutorial').datagrid('selectRow', index)
                            .datagrid('beginEdit', index);
                                        editIndexTutorial = index;

                } else {
                    $('#dgTutorial').datagrid('selectRow', editIndexTutorial);
                }
                //UpdateSkillTutorial();
            }
        }

        function appendTutorial(){
            // if (endEditing()){
            //     $('#dg').datagrid('appendRow',{status:'P'});
            //     editIndex = $('#dg').datagrid('getRows').length-1;
            //     $('#dg').datagrid('selectRow', editIndex)
            //             .datagrid('beginEdit', editIndex);
            // }
            if (endEditingTutorial()){
                $('#dgTutorial').datagrid('appendRow',{typeid:"12000000",isfinish:true});
                editIndexTutorial= $('#dgTutorial').datagrid('getRows').length-1;
                $('#dgTutorial').datagrid('selectRow', editIndexTutorial)
                        .datagrid('beginEdit', editIndexTutorial);
            }
        }

        function TutorialAll(){
            if (endEditingTutorial()){
                var rows = $("#dgTutorial").datagrid('getRows');
                var validated = true;
                var msg = "";
                var data_rows = [];
                //alert(JSON.stringify(rows));
                for(var i=0;i<rows.length;i++)
                   {
                            data_rows.push({typeid:rows[i].typeid});
                   }
                   //alert(JSON.stringify(data_rows));
                if (rows.length>0&&validated) {
                    $.post("/tutorialedit",{data:data_rows,uid:uid,reg:request("reg")},function(){
                        loadTutorial();
                    });
                    $('#dgTutorial').datagrid('acceptChanges');
                }else if(!validated)
                {
                    alert(msg);
                }
            }
        }

        function endEditingTutorial(){
            if (editIndexTutorial == undefined){return true}
            if ($('#dgTutorial').datagrid('validateRow', editIndexTutorial)){
                //var ed = $('#dg').datagrid('getEditor', {index:editIndex,field:'productid'});
                // var productname = $(ed.target).combobox('getText');
                // $('#dg').datagrid('getRows')[editIndex]['productname'] = productname;
                $('#dgTutorial').datagrid('endEdit', editIndexTutorial);
                editIndexTutorial = undefined;
                return true;
            } else {
                return false;
            }
        }
        function onEditBeginTutorial(rowIndex,rowData){
            // editIndex = rowIndex;
            UpdateSkillTutorial();
        }
        function onEditBeforeTutorial(rowIndex,rowData){
            UpdateSkillTutorial();
        }
        function removeitTutorial(){
            var obj = $("#dgTutorial").datagrid("getSelected");
            if (obj==null) {
                alert("未选中新手指引");
                return;
            };
            var tid = obj.typeid;
            $.post("/tutorialdel",{uid:uid,cmd:tid,reg:request("reg")},function(data){
                loadTutorial();
            });

            if (editIndexTutorial == undefined){return}

            $('#dgTutorial').datagrid('cancelEdit', editIndexTutorial)
                    .datagrid('deleteRow', editIndexTutorial);
            editIndexTutorial = undefined;
        }
//equip
        var editIndexDgequip = undefined;
        function endEditingDgequip(){
            if (editIndexDgequip == undefined){return true}
            if ($('#Dgequip').datagrid('validateRow', editIndexDgequip)){
                // var ed = $('#Dgequip').datagrid('getEditor', {index:editIndex,field:'productid'});
                // var productname = $(ed.target).combobox('getText');
                // $('#Dgequip').datagrid('getRows')[editIndex]['productname'] = productname;
                $('#Dgequip').datagrid('endEdit', editIndexDgequip);
                editIndexDgequip = undefined;
                return true;
            } else {
                return false;
            }
        }
        function onClickRowDgequip(index){
            if (editIndexDgequip != index){
                if (endEditingDgequip()){
                    $('#Dgequip').datagrid('selectRow', index)
                            .datagrid('beginEdit', index);
                    editIndexDgequip = index;
                } else {
                    $('#Dgequip').datagrid('selectRow', editIndexDgequip);
                }
            }
        }
        function appendDgequip(){
            if (endEditingDgequip()){
                $('#Dgequip').datagrid('appendRow',{typeid:10010101,count:1});
                var rows = $("#Dgequip").datagrid("getChanges");
                $.post("/storageedit",{uid:uid,category:equipCategory,data:rows,reg:request("reg")},function(re){
                    $('#Dgequip').datagrid('acceptChanges');
                    loadEquip();
                });
            }
        }
        function removeitDgequip(){
            if (editIndexDgequip == undefined){return}

            var parm = $("#Dgequip").datagrid("getRows")[editIndexDgequip];
            $.post("/equipremove",{uid:uid,typeid:parm.typeid,instid:parm.instid,reg:request("reg")},function(){
                $('#Dgequip').datagrid('cancelEdit', editIndexDgequip).datagrid('deleteRow', editIndexDgequip);
                editIndexDgequip = undefined;
            });
        }
        function acceptDgequip(){
            if (endEditingDgequip()){
                var rows = $("#Dgequip").datagrid("getChanges");
                $.post("/equipedit",{uid:uid,category:equipCategory,data:rows,reg:request("reg"),base:{}},function(re){
                    $('#Dgequip').datagrid('acceptChanges');
                });
            }
        }
        function editDgequip(){
            if (endEditingDgequip()){

            }
        }
        function rejectDgequip(){
            $('#Dgequip').datagrid('rejectChanges');
            editIndexDgequip = undefined;
        }
        function getChangesDgequip(){
            var rows = $('#Dgequip').datagrid('getChanges');
            alert(rows.length+' rows are changed! they are\n'+JSON.stringify(rows));
        }
