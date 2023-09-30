/**
 * 発注書のUserEvent
 * PO UserEvent
 * Version    Date            Author           Remarks
 * 1.00       2023/01/11     
 *
 */

// SO-OGJ-カスタム・フォーム
var so_ogj_custForm = "239";

// PO-OGJ-カスタム・フォーム
var po_ogj_custForm = "243";

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */
function userEventBeforeLoad(type, form, request){
	form.setScript('customscript_ogw_po_client');
	if(type=='view'){
		var record =nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
		var customform = record.getFieldValue('customform');
		setFieldHidden(record);
		var itemList = record.getLineItemCount('item');//アイテム明細部		
		var cancleFlag=true;
		 for(var ca = 1; ca < itemList+1; ca++){
			 if(record.getLineItemValue('item', 'isclosed', ca)!='T'){
				 cancleFlag=false;
			 }
		 }
		if(customform == po_ogj_custForm){
			var flg = record.getFieldValue('custbody_ogw_po_sendmail');
			var tranidField = nlapiGetField('tranid'); //発注書番号
			var tranidLabel = tranidField.getLabel(); //LABEL
			if(tranidLabel == "発注書番号"){
				form.addButton('custpage_pdf', 'PDF作成', 'creatPdf();');
				if(flg != 'T'){
					form.addButton('custpage_posendmail', '送信', 'poSendMailtest();');  
				}
			}else{
				form.addButton('custpage_pdf', 'View PDF', 'creatPdf();');
				if(flg != 'T'){
					form.addButton('custpage_posendmail', 'Send Mail', 'poSendMailtest();');  
				}
			}
			if(cancleFlag&&nlapiGetFieldValue('custbody_ogw_cancle')!='T'){
				record.setFieldValue('custbody_ogw_po_sendmail','F');
				record.setFieldValue('custbody_ogw_cancle','T');
				nlapiSubmitRecord(record, false, true);
				nlapiSetRedirectURL('RECORD', 'purchaseorder',nlapiGetRecordId(), 'VIEW');
			}
		}
	}else if(type=='edit'){
		var record =nlapiLoadRecord('purchaseorder', nlapiGetRecordId());
		setFieldHidden(record);
	}    
}


/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function userEventAfterSubmit(type, form, request) {
	try {
		if (type == 'delete') {
			return;
		}
		
		// PO
		var poRecord = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
		
		// POカスタム・フォーム
		var poCustomform = poRecord.getFieldValue('customform'); 
		var soLineArr = new Array();
		
		// POカスタム・フォーム=OGJ
		if (poCustomform == po_ogj_custForm) {
			
			// 作成元
			var createdfrom = poRecord.getFieldValue('createdfrom'); 
			if (!isEmpty(createdfrom)) {
				
				// SO
				var soRecord = nlapiLoadRecord('salesorder', createdfrom);
				
				// SOカスタム・フォーム
				var soCustomform = soRecord.getFieldValue('customform');
				
				// SOカスタム・フォーム=OGJ
				if (soCustomform == so_ogj_custForm) {
					var soCount = soRecord.getLineItemCount('item');
					var poCount = poRecord.getLineItemCount('item');
					for (var i = 1; i < soCount + 1; i++) {
						
					    // 直送アイテム&& SO item line poid= PO id
						if (soRecord.getLineItemValue('item', 'createpo', i) == 'DropShip'
								&& soRecord.getLineItemValue('item', 'poid', i) == nlapiGetRecordId()) {
							
							// SO item line アイテム
							var soItem = soRecord.getLineItemValue('item','item', i);
							
							// SO item line 税金コード
							var soTaxcode = soRecord.getLineItemValue('item','taxcode', i);
							
							// SO item line 数量
							var quantity = soRecord.getLineItemValue('item','quantity', i); 
							
							// SO item line Number
							var linNum = soRecord.getLineItemValue('item','custcol_number', i); 

							for (var j = 1; j < poCount + 1; j++) {
								if (poRecord.getLineItemValue('item', 'item', j) == soItem
										&& poRecord.getLineItemValue('item','quantity', j) == quantity
										&& poRecord.getLineItemValue('item','custcol_number', j) == linNum) {

									poRecord.setLineItemValue('item','taxcode', j, soTaxcode);
									poRecord.commitLineItem('item');
								}
							}
						}
					}
					nlapiSubmitRecord(poRecord, false, true);
				}
			}
		}
	} catch (e) {
		nlapiLogExecution('debug', 'エラー', e.message);
	}
  
  
  	try {		
		var poRecord = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());	
		// POカスタム・フォーム
		var poCustomform = poRecord.getFieldValue('customform'); 
		if (poCustomform == po_ogj_custForm) {
				 var itemArray= new Array();
				 var count=poRecord.getLineItemCount('item');
				 for(var i=1;i<count+1;i++){			 
					 var item=poRecord.getLineItemValue('item', 'item', i);
					 itemArray.push(item); //アイテム
				 }
				 itemArray=unique(itemArray);
				 var subsidiary=poRecord.getFieldValue('subsidiary');//子会社
				 var entity=poRecord.getFieldText('entity');//仕入先
				 var entityId=poRecord.getFieldValue('entity');//仕入先Id
				 var entityString = entity.toString();
				 var entityFirst = entityString.substr(0,1);//仕入先1位
				 var entityFive = entityString.substr(0,5);//仕入先5位
				 var lineKey = {};
				 var inquiriesSearch = getSearchResults("customrecord_ogw_inquiries",null,
						 [
						   ["custrecord_ogw_inquiries_subsidiary","anyof",subsidiary], 
						   "AND", 
						   [[["custrecord_ogw_inquiries_vendor","anyof",entityId],"AND",["custrecord_ogw_inquiries_item","anyof",itemArray]]], 
						   "OR", 
						   [[["custrecord_ogw_inquiries_vendor","anyof",entityId],"AND",["custrecord_ogw_inquiries_item","anyof","@NONE@"]]], 
						   "OR", 
						   [[["custrecord_ogw_inquiries_vendor","anyof","@NONE@"],"AND",["custrecord_ogw_inquiries_item","anyof",itemArray]]]
						], 
						 [
						    new nlobjSearchColumn("custrecord_ogw_inquiries"), 
						    new nlobjSearchColumn("custrecord_ogw_pdftemp"), 
						    new nlobjSearchColumn("custrecord_ogw_inquiries_vendor"), 
						    new nlobjSearchColumn("custrecord_ogw_inquiries_item"), 
						    new nlobjSearchColumn("formulatext").setFormula("{custrecord_ogw_inquiries_vendor.internalid}||{custrecord_ogw_inquiries_item.internalid}")
						 ]
						 );
	
				 if(!isEmpty(inquiriesSearch)){
					 for(var k = 0 ; k < inquiriesSearch.length; k++){
						 var pdftemp = inquiriesSearch[k].getValue("custrecord_ogw_pdftemp"); //発注書PDFテンプレート
						 var inquiries = inquiriesSearch[k].getValue("custrecord_ogw_inquiries"); //問い合わせ先
						 var column = inquiriesSearch[0].getAllColumns();
						 var poLineKey = inquiriesSearch[k].getValue(column[4]);//仕入先内部ID + アイテム内部ID
						 
						 var itemLineValueArr = new Array();
						 itemLineValueArr.push([pdftemp],[inquiries]);
						 lineKey[poLineKey] = new Array();
						 lineKey[poLineKey].push(itemLineValueArr);// key:PDFテンプレート/問い合わせ先
					 }
				 }
				 		 
				 for(var p=1;p<count+1;p++){
					 poRecord.selectLineItem('item', p);
					 var itemId = poRecord.getCurrentLineItemValue('item', 'item');//アイテムID
					 var itmeName = poRecord.getCurrentLineItemValue('item', 'item_display');//アイテム名前
					 var poLineKeyNum1 = entityId + "" + itemId; // key 仕入先ID + アイテムID
					 var poLineKeyNum2 = entityId; 				 // key 仕入先ID
					 var poLineKeyNum3 = itemId;				 // key アイテムID
					 var lineKeyValue1 = lineKey[poLineKeyNum1];
					 var lineKeyValue2 = lineKey[poLineKeyNum2];
					 var lineKeyValue3 = lineKey[poLineKeyNum3];			 
					 if(!isEmpty(itmeName)){
						 var itemString = itmeName.toString();
					 }
					 var inquiries='';
					 var pdfTemp='';
					 if(!isEmpty(lineKeyValue1)){
						 pdfTemp = lineKeyValue1[0][0];//発注書PDFテンプレート
						 inquiries = lineKeyValue1[0][1];//問い合わせ先
					 }else if(!isEmpty(lineKeyValue2)){ 
						 pdfTemp = lineKeyValue2[0][0];//発注書PDFテンプレート
						 inquiries = lineKeyValue2[0][1];//問い合わせ先
					 }else if(!isEmpty(lineKeyValue3)){
						 pdfTemp = lineKeyValue3[0][0];//発注書PDFテンプレート
						 inquiries = lineKeyValue3[0][1];//問い合わせ先
					 }else{
						 pdfTemp = '';
						 inquiries = '';
					 }
					 if(isEmpty(poRecord.getCurrentLineItemValue('item','custcol_ogw_po_pdf_temp')) && isEmpty(poRecord.getCurrentLineItemValue('item','custcol_ogw_inquiries'))){
						 setTempValue(entityFirst,entityFive,itemString,pdfTemp,inquiries,poRecord);
						 poRecord.commitLineItem('item');
					 }
				 }			 
				 nlapiSubmitRecord(poRecord, false, true);
		}
	} catch (e) {
		nlapiLogExecution('debug', 'エラー', e.message);
	}
  
  	try {
		// PO
		var poRecord = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
		
		// POカスタム・フォーム
		var poCustomform = poRecord.getFieldValue('customform'); 
		var soLineArr = new Array();
		var sendMailFlagNeedChange=false;
		var sendMailFlag=poRecord.getFieldValue('custbody_ogw_po_sendmail');
		// POカスタム・フォーム=OGJ
		if (poCustomform == po_ogj_custForm) {
			var poCount = poRecord.getLineItemCount('item');
			for (var i = 1; i < poCount + 1; i++) {
				// item line 数量
				var quantity = poRecord.getLineItemValue('item','quantity', i);
				
				// item line ETA
				var eta = poRecord.getLineItemValue('item','custcol_eta', i);
				
				// item line 元数量
				var oldquantity = poRecord.getLineItemValue('item','custcol_ogw_old_quantity', i);
				
				// item line 元ETA
				var oldeta = poRecord.getLineItemValue('item','custcol_ogw_old_eta', i);
				
				if(sendMailFlag=='T'){
					if(eta!=oldeta||quantity!=oldquantity){
						sendMailFlagNeedChange=true;
					}
				}						
				poRecord.setLineItemValue('item','custcol_ogw_old_eta', i, eta);
				poRecord.setLineItemValue('item','custcol_ogw_old_quantity', i, quantity);
				poRecord.commitLineItem('item');
			}
			if(sendMailFlagNeedChange){
				poRecord.setFieldValue('custbody_ogw_po_sendmail', 'F');
				poRecord.setFieldValue('custbody_ogw_po_change', 'T');
			}
			nlapiSubmitRecord(poRecord, false, true);
		}
	} catch (e) {
		nlapiLogExecution('debug', 'エラー', e.message);
	}
  
  		try {
		
		// PO
		var poRecord = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
		
		// POカスタム・フォーム
		var poCustomform = poRecord.getFieldValue('customform'); 
		// POカスタム・フォーム=OGJ
		if (poCustomform == po_ogj_custForm) {
			var entityId=poRecord.getFieldValue('entity'); //仕入先ID
			var entityRecord=nlapiLookupField('vendor', entityId, ['custentity_ogw_to','custentity_ogw_po_mail_template']); //仕入先
			var mToAddress=entityRecord.custentity_ogw_to; //仕入先のTO
			if(!isEmpty(mToAddress) && isEmpty(poRecord.getFieldValue('custbody_ogw_to'))){
					poRecord.setFieldValue('custbody_ogw_to', mToAddress); //発注書のTO
			}
         
			var itemArray= new Array();
			var count=poRecord.getLineItemCount('item');
			for(var i=1;i<count+1;i++){			 
				var item=poRecord.getLineItemValue('item', 'item', i);
				itemArray.push(item); //アイテム
			}
			itemArray=unique(itemArray);
			var subsidiary = poRecord.getFieldValue('subsidiary'); 
			var inquiries_ccArr = new Array();
			var inquiriesSearch = getSearchResults("customrecord_ogw_inquiries",null,
					 [
					   ["custrecord_ogw_inquiries_subsidiary","anyof",subsidiary], 	   
					   "AND", 
					   [[["custrecord_ogw_inquiries_vendor","anyof",entityId],"AND",["custrecord_ogw_inquiries_item","anyof",itemArray]]], 
					   "OR", 
					   [[["custrecord_ogw_inquiries_vendor","anyof",entityId],"AND",["custrecord_ogw_inquiries_item","anyof","@NONE@"]]], 
					   "OR", 
					   [[["custrecord_ogw_inquiries_vendor","anyof","@NONE@"],"AND",["custrecord_ogw_inquiries_item","anyof",itemArray]]]
					 ], 
					 [
					    new nlobjSearchColumn("custrecord_ogw_inquiries_cc"), //CC
					 ]
					 );
			if(!isEmpty(inquiriesSearch)){
				for(var k = 0 ; k < inquiriesSearch.length; k++){
					var inquiries_cc = inquiriesSearch[k].getValue("custrecord_ogw_inquiries_cc");//CC
					var ccValue = inquiries_cc.split(';');
					for(i=0; i < ccValue.length; i++){
						inquiries_ccArr.push(ccValue[i]);
					}
				}
			}
			inquiries_ccArr=unique(inquiries_ccArr);
			var ccString = '';
			for(var p = 0;p<inquiries_ccArr.length;p++){
				if(!isEmpty(inquiries_ccArr[p])){
					var cc = inquiries_ccArr[p] + "" + ";"
					ccString += cc;
				}
			}
			if(!isEmpty(ccString)){
				var ccText = ccString.toString();
				ccText = ccString.substr(0,ccText.length-1);
				if(isEmpty(poRecord.getFieldValue('custbody_ogw_cc'))){
					poRecord.setFieldValue('custbody_ogw_cc', ccText); //発注書のCC
				}
			} 
          
			var mtemplate=entityRecord.custentity_ogw_po_mail_template; //仕入先の発注書送信テンプレート
			if(!isEmpty(mtemplate)){
				if(isEmpty(poRecord.getFieldValue('custbody_ogw_po_mail_template'))){
					poRecord.setFieldValue('custbody_ogw_po_mail_template', mtemplate); //発注書の発注書送信テンプレート
				}
				var mtemplateRecord=nlapiLookupField('customrecord_ogw_po_mail_template', mtemplate, ['custrecord_ogw_content','custrecord_ogw_cancel_content','custrecord_ogw_change_content']);//発注書送信テンプレート
				var mBodyContent=mtemplateRecord.custrecord_ogw_content;//内容
				var mBodyCancle=mtemplateRecord.custrecord_ogw_cancel_content;//キャンセル内容
				var mBodyChange=mtemplateRecord.custrecord_ogw_change_content;//変更内容
				if(!isEmpty(mBodyContent) && isEmpty(poRecord.getFieldValue('custbody_ogw_content'))){
					poRecord.setFieldValue('custbody_ogw_content', mBodyContent); //発注書の内容
				}
				if(!isEmpty(mBodyCancle) && isEmpty(poRecord.getFieldValue('custbody_ogw_cancle_content'))){
					poRecord.setFieldValue('custbody_ogw_cancle_content', mBodyCancle); //発注書のキャンセル内容
				}
				if(!isEmpty(mBodyChange)&& isEmpty(poRecord.getFieldValue('custbody_ogw_change_content'))){
					poRecord.setFieldValue('custbody_ogw_change_content', mBodyChange); //発注書の変更内容
				}
			}
			if(type == 'create'){
				var itemArray= new Array();
				var poCount = poRecord.getLineItemCount('item');//注文書明細
				for(var i=1;i<poCount+1;i++){			 
					var item=poRecord.getLineItemValue('item', 'item', i);
					itemArray.push(item); //アイテム
				}
				itemArray=unique(itemArray);
				var itemKey = {};
				var itemSearch = getSearchResults("item",null,
						[
						   ["internalid","anyof",itemArray]
						], 
						[
						   new nlobjSearchColumn("purchasedescription"), 
						   new nlobjSearchColumn("internalid")
						]
						);
				if(!isEmpty(itemSearch)){
					 for(var k = 0 ; k < itemSearch.length; k++){
						 var itemExplain = itemSearch[k].getValue("purchasedescription");//購入の説明
						 var itemId = itemSearch[k].getValue("internalid");//内部ID
						 
						 var itemExplainValue = new Array();
						 itemExplainValue.push(itemSearch[k].getValue("purchasedescription"));//購入の説明
						 itemKey[itemId] = new Array();
						 itemKey[itemId].push(itemExplainValue);// key:itemID value:購入の説明
					 }
				}
				
				for(var p=1;p<poCount+1;p++){
					poRecord.selectLineItem('item', p);
					var item = poRecord.getCurrentLineItemValue('item', 'item');//アイテムID
					var KeyValue = itemKey[item];
					var KeyValueString = KeyValue.toString();
					if(!isEmpty(KeyValueString)){
						poRecord.setCurrentLineItemValue('item', 'description',KeyValueString);//説明
					}
					poRecord.commitLineItem('item');	
				}	
			}	  
          
          
			nlapiSubmitRecord(poRecord, false, true);
		}
	} catch (e) {
		nlapiLogExecution('debug', 'エラー', e.message);
	}
  
  	try {
			// PO
			var poRecord = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
			var poId = nlapiGetRecordId();
			// POカスタム・フォーム
			var poCustomform = poRecord.getFieldValue('customform'); 
			if (poCustomform == po_ogj_custForm) {
				// 作成元
				var createdfrom = poRecord.getFieldValue('createdfrom');
				if(!isEmpty(createdfrom)){
					var soRecord = nlapiLoadRecord('salesorder', createdfrom); 
					var soCustomform = soRecord.getFieldValue('customform');//SOカスタム・フォーム
					if(soCustomform == so_ogj_custForm){
						var soMessage = soRecord.getFieldValue('message'); //顧客へのメッセージ
						if(!isEmpty(soMessage) && isEmpty(poRecord.getFieldValue('message'))){
							poRecord.setFieldValue('message', soMessage);
						}
						var soShipmark =  soRecord.getFieldValue('custbody2');//SHIPPING MARK
						if(!isEmpty(soShipmark) && isEmpty(poRecord.getFieldValue('custbody2'))){
							poRecord.setFieldValue('custbody2', soShipmark);
						}
						nlapiSubmitRecord(poRecord, false, true);
					}
				}
			}
	}catch(e){
		nlapiLogExecution('debug', 'エラー', e.message);
	}
	
	try {
		nlapiLogExecution("debug", "type", type);
//		if(type == 'dropship'){
			var poRecord = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
			var createdfrom = poRecord.getFieldValue('createdfrom');
			if(!isEmpty(createdfrom)){
				var soRecord = nlapiLoadRecord('salesorder', createdfrom); 
				var soCustomform = soRecord.getFieldValue('customform');//SOカスタム・フォーム
				if(soCustomform == '118'){
					var entity = soRecord.getFieldValue('entity');//顧客
					if(!isEmpty(entity)){
						var entityTerms = nlapiLookupField('customer', entity, 'terms');
						if(!isEmpty(entityTerms) && entityTerms == '17' || entityTerms == '58' || entityTerms == '35' || entityTerms == '16'){
							if(isEmpty(poRecord.getFieldValue('message'))){
								poRecord.setFieldValue('message','Shipped after payment confirmation');
							}
							nlapiSubmitRecord(poRecord, false, true);
						}
					}
				}
			}
//		}
	}catch(e){
		nlapiLogExecution('debug', 'エラー', e.message);
	}
}



function setTempValue (str,str1,itemString,pdfTemp,inquiries,poRecord){
	var first = str;
	var five = str1;
	if(first == "3"){
		poRecord.setCurrentLineItemValue('item', 'custcol_ogw_po_pdf_temp','1');//発注書PDFテンプレート JP
	}else if(first == "1" && five != "10115"){
		poRecord.setCurrentLineItemValue('item', 'custcol_ogw_po_pdf_temp','2');//発注書PDFテンプレート ENG
	}else if(first == "1" && five == "10115"){
		if(!isEmpty(itemString)){
			 if(itemString.substr(0,1) == "4" && itemString.length == "11"){
				 poRecord.setCurrentLineItemValue('item', 'custcol_ogw_po_pdf_temp','1');//発注書PDFテンプレート JP
			 }else{
				 poRecord.setCurrentLineItemValue('item', 'custcol_ogw_po_pdf_temp','2');//発注書PDFテンプレート ENG
			 }
		}  
	}else{
		poRecord.setCurrentLineItemValue('item', 'custcol_ogw_po_pdf_temp',pdfTemp);//発注書PDFテンプレート 
	}
	poRecord.setCurrentLineItemValue('item', 'custcol_ogw_inquiries', inquiries); //問い合わせ先
}




/**
 * 重複データを削除する
 * 
 * @param array
 *            リスト
 * @returns リスト
 */
function unique(array) {
	var resultArr = new Array();
	var numberOBJ = {};
	for (var i = 0; i < array.length; i++) {
		if (!numberOBJ[array[i]]) {
			resultArr.push(array[i]);
			numberOBJ[array[i]] = 1;
		}
	}
	return resultArr;
}



/**
 * 検索からデータを取得する
 * 
 * @param strSearchType
 * @param filters
 * @param columns
 * @returns {Array}
 */
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


/**
 * 空値を判断
 * 
 * @param str
 *            対象
 * @returns 判断結果
 */
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

/**
 * 制御の無効化
 * 
 * @param fileNmae
 *            コントロール
 */
function setFieldDisableType(fileName, type) {
	try {
		var field = nlapiGetField(fileName);
		if (!isEmpty(field)) {
			field.setDisplayType(type);
		}
	} catch (e) {
		nlapiLogExecution('debug', fileName + '無効化の異常', e);
	}
}

function  setFieldHidden (record){
	var changeFlg = record.getFieldValue('custbody_ogw_po_change'); // CHANGE
	var cancleFlg = record.getFieldValue('custbody_ogw_cancle'); // CANCLE
	if(changeFlg != 'T' && cancleFlg != 'T'){
		setFieldDisableType('custbody_ogw_cancle_content','hidden'); //キャンセル内容
		setFieldDisableType('custbody_ogw_change_content','hidden'); //変更内容
	}else if(changeFlg == 'T' && cancleFlg == 'F'){
		setFieldDisableType('custbody_ogw_cancle_content','hidden'); //キャンセル内容
		setFieldDisableType('custbody_ogw_content','hidden'); //内容
	}else if(cancleFlg == 'T' && changeFlg == 'F'){
		setFieldDisableType('custbody_ogw_content','hidden'); //内容
		setFieldDisableType('custbody_ogw_change_content','hidden'); //変更内容
	}else if(cancleFlg == 'T' && changeFlg == 'T'){
		setFieldDisableType('custbody_ogw_content','hidden'); //内容
		setFieldDisableType('custbody_ogw_change_content','hidden'); //変更内容
	}
}