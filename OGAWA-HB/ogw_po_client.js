/**
 * pocs
 * 
 * Version    Date            Author           Remarks
 * 1.00       2022/12/06     CPC_苑
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

var po_ogj_custForm = "243";

function clientFieldChanged(type, name, linenum){

 if(name == 'entity' || name == 'item'){
	 try{
			 var custForm = nlapiGetFieldValue('customform');
			 if(custForm == po_ogj_custForm){	
				 var subsidiary=nlapiGetFieldValue('subsidiary');//子会社
				 var item= nlapiGetCurrentLineItemValue('item', 'item');//アイテム
				 var entity=nlapiGetFieldText('entity');//仕入先
				 var entityId=nlapiGetFieldValue('entity');//仕入先ID
				 var entityString = entity.toString();
				 var entityFirst = entityString.substr(0,1);//仕入先1位
				 var entityFive = entityString.substr(0,5);//仕入先5位
				 var itmeName = nlapiGetCurrentLineItemValue('item', 'item_display');
				 if(!isEmpty(itmeName)){
				 var itemString = itmeName.toString();			 			 
				 if(!isEmpty(subsidiary)&&!isEmpty(entityId)&&!isEmpty(item)&&!isEmpty(itemString)){
					 var inquiries='';
					 var pdfTemp='';
					 var inquiriesSearch = getSearchResults("customrecord_ogw_inquiries",null,
								[
								   ["custrecord_ogw_inquiries_subsidiary","anyof",subsidiary], 
								   "AND", 
								   ["custrecord_ogw_inquiries_vendor","anyof",entityId], 
								   "AND", 
								   ["custrecord_ogw_inquiries_item","anyof",item]
								], 
								[
								   new nlobjSearchColumn("custrecord_ogw_inquiries"),
								   new nlobjSearchColumn("custrecord_ogw_pdftemp"),
								]
								);
					 if(!isEmpty(inquiriesSearch)){
						 inquiries=inquiriesSearch[0].getValue("custrecord_ogw_inquiries"); //問い合わせ先					 				 
						 pdfTemp=inquiriesSearch[0].getValue("custrecord_ogw_pdftemp"); //発注書PDFテンプレート					 				 
					 }else{
						 var inquiriesSearch = getSearchResults("customrecord_ogw_inquiries",null,
									[
									   ["custrecord_ogw_inquiries_subsidiary","anyof",subsidiary], 
									   "AND", 
									   ["custrecord_ogw_inquiries_vendor","anyof",entityId], 
									   "AND", 
									   ["custrecord_ogw_inquiries_item","anyof","@NONE@"]
									], 
									[
									   new nlobjSearchColumn("custrecord_ogw_inquiries"),
									   new nlobjSearchColumn("custrecord_ogw_pdftemp"),
									]
									);
						 if(!isEmpty(inquiriesSearch)){
							 inquiries=inquiriesSearch[0].getValue("custrecord_ogw_inquiries"); //問い合わせ先 
							 pdfTemp=inquiriesSearch[0].getValue("custrecord_ogw_pdftemp"); //発注書PDFテンプレート	 						
						 }else{
							 var inquiriesSearch = getSearchResults("customrecord_ogw_inquiries",null,
										[
										   ["custrecord_ogw_inquiries_subsidiary","anyof",subsidiary], 
										   "AND", 
										   ["custrecord_ogw_inquiries_item","anyof",item],
										   "AND", 
										   ["custrecord_ogw_inquiries_vendor","anyof","@NONE@"]
										], 
										[
										   new nlobjSearchColumn("custrecord_ogw_inquiries"),
										   new nlobjSearchColumn("custrecord_ogw_pdftemp"),
										]
										);						 						 
							 if(!isEmpty(inquiriesSearch)){
								 inquiries=inquiriesSearch[0].getValue("custrecord_ogw_inquiries"); //問い合わせ先								 
								 pdfTemp=inquiriesSearch[0].getValue("custrecord_ogw_pdftemp"); //発注書PDFテンプレート								 
							 }else{
								 inquiries='';
								 pdfTemp='';				 				
							 }								 
						 }
					 }
					 setTempValue(entityFirst,entityFive,itemString,pdfTemp,inquiries);
				 }
			 }
			 } 
	 }catch(e){}
	 if(name == 'entity'){
			 nlapiSetFieldValue("custbody_ogw_po_mail_template", ""); //発注書送信テンプレート
			 nlapiSetFieldValue("custbody_ogw_to", ""); //TO
			 nlapiSetFieldValue("custbody_ogw_cc", ""); //CC
			 nlapiSetFieldValue("custbody_ogw_person", ""); //担当者
			 nlapiSetFieldValue("custbody_ogw_change_content", ""); //変更内容
			 nlapiSetFieldValue("custbody_ogw_cancle_content", ""); //キャンセル内容
			 nlapiSetFieldValue("custbody_ogw_content", "");//内容
	 } 	
 }
}

function setTempValue (str,str1,itemString,pdfTemp,inquiries){
	var first = str;
	var five = str1;
	if(first == "3"){
		nlapiSetCurrentLineItemValue('item', 'custcol_ogw_po_pdf_temp', '1', false, true);//日本語フォーマット
	}else if(first == "1" && five != "10115"){
		nlapiSetCurrentLineItemValue('item', 'custcol_ogw_po_pdf_temp', '2', false, true);//英語フォーマット
	}else if(first == "1" && five == "10115"){
		 if(itemString.substr(0,1) == "4" && itemString.length == "11"){
			 nlapiSetCurrentLineItemValue('item', 'custcol_ogw_po_pdf_temp', "1", false, true);//日本語フォーマット
		 }else{
			 nlapiSetCurrentLineItemValue('item', 'custcol_ogw_po_pdf_temp', "2", false, true);//英語フォーマット
		 }
	}else{
		 nlapiSetCurrentLineItemValue('item', 'custcol_ogw_po_pdf_temp', pdfTemp, false, true);
	}
	 nlapiSetCurrentLineItemValue('item', 'custcol_ogw_inquiries', inquiries, false, true); //問い合わせ先
}

function getSearchResults(type, id, filters, columns) {
    var search = nlapiCreateSearch(type, filters, columns);

    // 検索し、結果を渡す
    var searchResult = search.runSearch();
    var maxCount = 0;
    var results = [];
  if(!isEmpty(searchResult)){
    var resultInfo;
    try{
    do {
        resultInfo = searchResult.getResults(maxCount, maxCount + 1000);
        if (!isEmpty(resultInfo)) {
            resultInfo.forEach(function(row) {
                results.push(row);
            });
        }
        maxCount += 1000;
    } while (resultInfo.length == 1000);
    }catch(e){}
   }
    return results;
}


function creatPdf() {
	var id=nlapiGetRecordId();
	var poRecord=nlapiLoadRecord('purchaseorder', id);
	var custForm = poRecord.getFieldValue('customform');
	if(custForm == po_ogj_custForm){
		var theLink = nlapiResolveURL('SUITELET', 'customscript_ogw_sl_mailandpdf', 'customdeploy_ogw_sl_mailandpdf');
		theLink += '&sltype=creatpdf';
	    theLink += '&poid=' + id;  
	    var rse = nlapiRequestURL(theLink);
	    var url = rse.getBody();	    
	    if(!isEmpty(url)){
	    	var urlArr=url.split('|||');
	    	 for(var i=0;i<urlArr.length-1;i++){
	    		 window.open(urlArr[i]);
	    	 } 
	    }    
	}
}


function poSendMailtest (){
	var poid=nlapiGetRecordId();
	var theLink = nlapiResolveURL('SUITELET','customscript_ogw_sl_sendmail_update','customdeploy_ogw_sl_sendmail_update');
	theLink+='&poid=' + poid;
    nlExtOpenWindow(theLink, 'newwindow',700, 400, this, false, '送信');
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
