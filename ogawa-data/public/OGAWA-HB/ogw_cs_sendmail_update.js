/**
 * pocs
 * 
 * Version    Date            Author           Remarks
 * 1.00       2023/03/16     CPC_宋
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */


function saveReturn(){ //保存
	alert("保存中ですので、画面を閉じないでください");
	var poid = nlapiGetFieldValue("custpage_poid");
	nlapiSubmitField('purchaseorder', poid, ['custbody_ogw_po_mail_template','custbody_ogw_to','custbody_ogw_cc','custbody_ogw_content','custbody_ogw_person','custbody_ogw_cancle_content','custbody_ogw_change_content'],[nlapiGetFieldValue('custpage_template'),nlapiGetFieldValue('custpage_to'),nlapiGetFieldValue('custpage_cc'),nlapiGetFieldValue('custpage_content'),nlapiGetFieldValue('custpage_person'),nlapiGetFieldValue('custpage_cancle'),nlapiGetFieldValue('custpage_change')], false);		
	window.ischanged = false;
	parent.location.reload();
}

function sandmail(){//送信
	alert("送信中ですので、画面を閉じないでください");
	var poid = nlapiGetFieldValue("custpage_poid");
	nlapiSubmitField('purchaseorder', poid, ['custbody_ogw_po_mail_template','custbody_ogw_to','custbody_ogw_cc','custbody_ogw_content','custbody_ogw_person','custbody_ogw_cancle_content','custbody_ogw_change_content'],[nlapiGetFieldValue('custpage_template'),nlapiGetFieldValue('custpage_to'),nlapiGetFieldValue('custpage_cc'),nlapiGetFieldValue('custpage_content'),nlapiGetFieldValue('custpage_person'),nlapiGetFieldValue('custpage_cancle'),nlapiGetFieldValue('custpage_change')], false);
	var poRecord = nlapiLookupField('purchaseorder', poid, ['custbody_ogw_po_mail_template','custbody_ogw_to']);
	var templateValue = poRecord.custbody_ogw_po_mail_template;

		var toValue = poRecord.custbody_ogw_to;
		if(isEmpty(toValue)){
			alert('「TO」を入力してください。');
		}else{
			var userid = nlapiGetUser();
			var theLink = nlapiResolveURL('SUITELET', 'customscript_ogw_sl_mailandpdf', 'customdeploy_ogw_sl_mailandpdf');
			theLink += '&sltype=sendmail';
		    theLink += '&poid=' + poid;
		    theLink += '&userid=' + userid;
		    var rse = nlapiRequestURL(theLink);
		    var flag = rse.getBody();
		    if (flag == 'T') {
		    	window.ischanged = false;
		    	parent.location.reload();
		    } else {
		    	var http = nlapiResolveURL('SUITELET','customscript_ogw_sl_sendmail_update','customdeploy_ogw_sl_sendmail_update');
		    	http += '&errorValue='+flag;
		    	window.ischanged = false;
		    	window.location.href = http;
		    }			
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

