/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       2023/04/10     CPC_宋
 *
 */

function search(){
	var subsidiary = nlapiGetFieldValue('custpage_subsidiary');
	if(isEmpty(subsidiary)){
		alert("子会社は空白にできません。")
	}else{
		var parameter = setParam();
		parameter += '&selectFlg=T';
		var https = nlapiResolveURL('SUITELET', 'customscript_ogw_sl_completion_csvimport', 'customdeploy_ogw_sl_completion_csvimport');
		https = https + parameter;
		window.ischanged = false;
		window.location.href = https;
	}
}

function searchReturn(){
	var parameter = setParam();
	parameter += '&selectFlg=F';
	var https = nlapiResolveURL('SUITELET', 'customscript_ogw_sl_completion_csvimport', 'customdeploy_ogw_sl_completion_csvimport');
	https = https + parameter;
	window.ischanged = false;
	window.location.href = https;
}

function clientFieldChanged(type, name, linenum){
	 if(name=='custpage_subsidiary'){
		var thelink = nlapiResolveURL('SUITELET', 'customscript_ogw_sl_completion_csvimport', 'customdeploy_ogw_sl_completion_csvimport');
		var parameter = setParam();		
		parameter += '&selectFlg=F';		
		thelink += parameter;
		window.ischanged = false;
		window.location.href = thelink;
	 }
}


function clientSaveRecord() {
	var file = nlapiGetFieldValue('custpage_importfile');//csv file
	if(isEmpty(file)){
		var count = nlapiGetLineItemCount('list');
		var zeroflg = true;
		for(var i = 0 ; i < count ; i++){
			if(nlapiGetLineItemValue('list', 'checkbox',i+1) == 'T'){
				var entrywait = nlapiGetLineItemValue('list', 'salesorder_entrywait',i+1);//入荷待ち数量
				var quantity = nlapiGetLineItemValue('list', 'salesorder_quantity',i+1);//注文数量
				var quantitypicked = nlapiGetLineItemValue('list', 'salesorder_received',i+1);//入荷済み数量 
				if(Number(entrywait) > Number(quantity - quantitypicked)){
					alert(i+1 + '行目の入荷待ち数量が正しくありません');
					return false;
				}
				zeroflg = false;
			}
		}
		if(zeroflg){
			alert('対象選択してください。')
			return false;
		}
	}
	return true;
}


function csvDownload(){
	var theLink = nlapiResolveURL('SUITELET', 'customscript_ogw_sl_completion_csvimport', 'customdeploy_ogw_sl_completion_csvimport');
	theLink += '&selectFlg=T';
	theLink += '&downloadFlag=T';
	var selectLine='';
	var count=nlapiGetLineItemCount('list');
	var zeroflg = true;
	var csvRecord=nlapiCreateRecord('customrecord_ogw_csv_download'); //CSVテンプレートのダウンロード
	for(var i=1;i<count+1;i++){
		var checkbox=nlapiGetLineItemValue('list', 'checkbox', i);
		if(checkbox == 'T'){
			selectLine+=nlapiGetLineItemValue('list', 'salesorder_soid', i) //注文書ID
			+'|'+nlapiGetLineItemValue('list', 'salesorder_customerid', i) //顧客ID
			+'|'+nlapiGetLineItemValue('list', 'salesorder_date', i) //日付
			+'|'+nlapiGetLineItemValue('list', 'salesorder_itemid', i)
			+'|'+nlapiGetLineItemValue('list', 'salesorder_line', i)
			+'*'; //アイテムID
	
			if (i % 300 == 0 && i != 0) {
				selectLine+='&&';
			}		
			zeroflg = false;
		}
	}
	var selectLineSplit = selectLine.split('&&');
	var jsonValue = '';
	for ( var j = 0; j < selectLineSplit.length; j ++) {	
		csvRecord.selectNewLineItem('recmachcustrecord_ogw_csv_download_list');
		if(j == 0 ){
			csvRecord.setCurrentLineItemValue('recmachcustrecord_ogw_csv_download_list','custrecord_ogw_json_text',selectLineSplit[j]);
		}else if(j == 1){
			csvRecord.setCurrentLineItemValue('recmachcustrecord_ogw_csv_download_list','custrecord_ogw_json_text2',selectLineSplit[j]);
		}else if(j == 2){
			csvRecord.setCurrentLineItemValue('recmachcustrecord_ogw_csv_download_list','custrecord_ogw_json_text3',selectLineSplit[j]);
		}else if(j == 3){
			csvRecord.setCurrentLineItemValue('recmachcustrecord_ogw_csv_download_list','custrecord_ogw_json_text4',selectLineSplit[j]);
		}else if(j == 4){
			csvRecord.setCurrentLineItemValue('recmachcustrecord_ogw_csv_download_list','custrecord_ogw_json_text5',selectLineSplit[j]);
		}else if(j == 5){
			csvRecord.setCurrentLineItemValue('recmachcustrecord_ogw_csv_download_list','custrecord_ogw_json_text6',selectLineSplit[j]);
		}
		csvRecord.commitLineItem('recmachcustrecord_ogw_csv_download_list');
	}
	var csvRecordId = nlapiSubmitRecord(csvRecord);
	if(zeroflg){
		alert('対象選択してください。')
		return false;
	}else{
		theLink += '&selectLine='+csvRecordId;
		var rse = nlapiRequestURL(theLink);
		var url = rse.getBody();
		window.open(url);
	}
}

function setParam(){

	var parameter = '';
	parameter += '&subsidiary='+nlapiGetFieldValue('custpage_subsidiary'); //子会社
	parameter += '&customer='+nlapiGetFieldValue('custpage_customer');//顧客
	parameter += '&salesorder='+nlapiGetFieldValue('custpage_salesorder');//注文書番号
	parameter += '&item='+nlapiGetFieldValue('custpage_item');//アイテム
	parameter += '&vendor='+nlapiGetFieldValue('custpage_vendor');//仕入先
	parameter += '&purchaseorder='+nlapiGetFieldValue('custpage_po');//発注書番号
	parameter += '&employee='+nlapiGetFieldValue('custpage_employee');//従業員
	parameter += '&eta='+nlapiGetFieldValue('custpage_eta');//eta
	parameter += '&date='+nlapiGetFieldValue('custpage_date');//注文日付
	parameter += '&createdate='+nlapiGetFieldValue('custpage_createdate');//注文作成日
	return parameter;
}

function refresh(){
	window.ischanged = false;
	location=location;
}

function isEmpty(obj) {
	if (obj === undefined || obj == null || obj === '') {
		return true;
	}
	if (obj.length && obj.length > 0) {
		return false;
	}
	if (obj.length === 0) {
		return true;
	}
	for ( var key in obj) {
		if (hasOwnProperty.call(obj, key)) {
			return false;
		}
	}
	if (typeof (obj) == 'boolean') {
		return false;
	}
	if (typeof (obj) == 'number') {
		return false;
	}
	return true;
}