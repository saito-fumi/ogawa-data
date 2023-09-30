/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       2023/01/27     CPC_苑
 *
 */

function sepc(){
	var entitysearch=nlapiGetFieldValue('entitysearch');
	var tranidsearch=nlapiGetFieldValue('tranidsearch');
	var effectivitybasedonsearch=nlapiGetFieldValue('effectivitybasedonsearch');
	var startdatesearch=nlapiGetFieldValue('startdatesearch');
	var enddatesearch=nlapiGetFieldValue('enddatesearch');
	var theLink = nlapiResolveURL('SUITELET', 'customscript_ogw_sl_pc_csvimport', 'customdeploy_ogw_sl_pc_csvimport');
	theLink += '&searchFlag=T';
	theLink +='&entitysearch=' + entitysearch;
	theLink +='&tranidsearch=' + tranidsearch;	
	theLink +='&effectivitybasedonsearch=' + effectivitybasedonsearch;
	theLink +='&startdatesearch=' + startdatesearch;
	theLink +='&enddatesearch=' + enddatesearch;
	window.ischanged = false;
	location.href = theLink;
}

function backToSearch(){
	var entitysearch=nlapiGetFieldValue('entitysearch');
	var tranidsearch=nlapiGetFieldValue('tranidsearch');
	var effectivitybasedonsearch=nlapiGetFieldValue('effectivitybasedonsearch');
	var startdatesearch=nlapiGetFieldValue('startdatesearch');
	var enddatesearch=nlapiGetFieldValue('enddatesearch');
	var theLink = nlapiResolveURL('SUITELET', 'customscript_ogw_sl_pc_csvimport', 'customdeploy_ogw_sl_pc_csvimport');
	theLink += '&searchFlag=F';
	theLink +='&entitysearch=' + entitysearch;
	theLink +='&tranidsearch=' + tranidsearch;	
	theLink +='&effectivitybasedonsearch=' + effectivitybasedonsearch;
	theLink +='&startdatesearch=' + startdatesearch;
	theLink +='&enddatesearch=' + enddatesearch;
	window.ischanged = false;
	location.href = theLink;
}

function csvDownload(){
	var theLink = nlapiResolveURL('SUITELET', 'customscript_ogw_sl_pc_csvimport', 'customdeploy_ogw_sl_pc_csvimport');
	theLink += '&searchFlag=T';
	theLink += '&downloadFlag=T';
	var chkflag=false;
	var selectLine='';
	var count=nlapiGetLineItemCount('details');
	for(var i=1;i<count+1;i++){
		var chk=nlapiGetLineItemValue('details', 'checkbox', i);
		if(chk=='T'){
			chkflag=true;
			selectLine+=nlapiGetLineItemValue('details', 'tranid', i)
			+'|'+nlapiGetLineItemValue('details', 'item', i)
			+'|'+nlapiGetLineItemValue('details', 'fromquantity', i)
			+'***';
		}
	}
	//if(chkflag){
		theLink += '&selectLine='+selectLine;
		 var rse = nlapiRequestURL(theLink);
		 var url = rse.getBody();
		 window.open(url);
//	}else{
//	alert('選択されていません');
//	}
}
/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function clientPageInit(type){
   
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @returns {Boolean} True to continue save, false to abort save
 */
function clientSaveRecord(){
    return true;
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function clientFieldChanged(type, name, linenum){
    if(name=='entitysearch'){
    	var entitysearch=nlapiGetFieldValue('entitysearch');
    	var effectivitybasedonsearch=nlapiGetFieldValue('effectivitybasedonsearch');
    	var startdatesearch=nlapiGetFieldValue('startdatesearch');
    	var enddatesearch=nlapiGetFieldValue('enddatesearch');
    	var theLink = nlapiResolveURL('SUITELET', 'customscript_ogw_sl_pc_csvimport', 'customdeploy_ogw_sl_pc_csvimport');
    	theLink += '&searchFlag=F';
    	theLink +='&entitysearch=' + entitysearch;
    	theLink +='&effectivitybasedonsearch=' + effectivitybasedonsearch;
    	theLink +='&startdatesearch=' + startdatesearch;
    	theLink +='&enddatesearch=' + enddatesearch;
    	window.ischanged = false;
    	location.href = theLink;
    }
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