var formatStatus=0;
function getpercentage(row,num){
	var val = row.daysLeft;
	if(formatStatus==1)
		val = row.firstpaids;
	if(val&&val[num]){
	var n = parseFloat(val[num].dayleft).toFixed(1);
	if(formatStatus==1)
		n = parseInt(val[num].count);
	if(formatStatus==2)
		n =  Math.ceil(row.newuserCount * val[num].dayleft / 100 )
		if(n&&formatStatus==0)
			return n + "%";
		else if(n)
			return n;
		else
			return 0;
	}
	return "/";
}
function formatterDaysLeft0(val,row){return getpercentage(row,0);};
function formatterDaysLeft1(val,row){return getpercentage(row,1);};
function formatterDaysLeft2(val,row){return getpercentage(row,2);};
function formatterDaysLeft3(val,row){return getpercentage(row,3);};
function formatterDaysLeft4(val,row){return getpercentage(row,4);};
function formatterDaysLeft5(val,row){return getpercentage(row,5);};
function formatterDaysLeft6(val,row){return getpercentage(row,6);};
function formatterDaysLeft7(val,row){return getpercentage(row,7);};
function formatterDaysLeft8(val,row){return getpercentage(row,8);};
function formatterDaysLeft9(val,row){return getpercentage(row,9);};
function formatterDaysLeft10(val,row){return getpercentage(row,10);};
function formatterDaysLeft11(val,row){return getpercentage(row,11);};
function formatterDaysLeft12(val,row){return getpercentage(row,12);};
function formatterDaysLeft13(val,row){return getpercentage(row,13);};
function formatterDaysLeft14(val,row){return getpercentage(row,14);};
function formatterDaysLeft15(val,row){return getpercentage(row,15);};
function formatterDaysLeft16(val,row){return getpercentage(row,16);};
function formatterDaysLeft17(val,row){return getpercentage(row,17);};
function formatterDaysLeft18(val,row){return getpercentage(row,18);};
function formatterDaysLeft19(val,row){return getpercentage(row,19);};
function formatterDaysLeft20(val,row){return getpercentage(row,20);};
function formatterDaysLeft21(val,row){return getpercentage(row,21);};
function formatterDaysLeft22(val,row){return getpercentage(row,22);};
function formatterDaysLeft23(val,row){return getpercentage(row,23);};
function formatterDaysLeft24(val,row){return getpercentage(row,24);};
function formatterDaysLeft25(val,row){return getpercentage(row,25);};
function formatterDaysLeft26(val,row){return getpercentage(row,26);};
function formatterDaysLeft27(val,row){return getpercentage(row,27);};
function formatterDaysLeft28(val,row){return getpercentage(row,28);};
function formatterDaysLeft29(val,row){return getpercentage(row,29);};
function formatterDaysLeft30(val,row){return getpercentage(row,30);};
function formatterDaysLeft31(val,row){return getpercentage(row,31);};