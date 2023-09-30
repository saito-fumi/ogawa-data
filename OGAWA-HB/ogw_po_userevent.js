/**
 * ��������UserEvent
 * PO UserEvent
 * Version    Date            Author           Remarks
 * 1.00       2023/01/11     
 *
 */

// SO-OGJ-�J�X�^���E�t�H�[��
var so_ogj_custForm = "239";

// PO-OGJ-�J�X�^���E�t�H�[��
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
		var itemList = record.getLineItemCount('item');//�A�C�e�����ו�		
		var cancleFlag=true;
		 for(var ca = 1; ca < itemList+1; ca++){
			 if(record.getLineItemValue('item', 'isclosed', ca)!='T'){
				 cancleFlag=false;
			 }
		 }
		if(customform == po_ogj_custForm){
			var flg = record.getFieldValue('custbody_ogw_po_sendmail');
			var tranidField = nlapiGetField('tranid'); //�������ԍ�
			var tranidLabel = tranidField.getLabel(); //LABEL
			if(tranidLabel == "�������ԍ�"){
				form.addButton('custpage_pdf', 'PDF�쐬', 'creatPdf();');
				if(flg != 'T'){
					form.addButton('custpage_posendmail', '���M', 'poSendMailtest();');  
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
		
		// PO�J�X�^���E�t�H�[��
		var poCustomform = poRecord.getFieldValue('customform'); 
		var soLineArr = new Array();
		
		// PO�J�X�^���E�t�H�[��=OGJ
		if (poCustomform == po_ogj_custForm) {
			
			// �쐬��
			var createdfrom = poRecord.getFieldValue('createdfrom'); 
			if (!isEmpty(createdfrom)) {
				
				// SO
				var soRecord = nlapiLoadRecord('salesorder', createdfrom);
				
				// SO�J�X�^���E�t�H�[��
				var soCustomform = soRecord.getFieldValue('customform');
				
				// SO�J�X�^���E�t�H�[��=OGJ
				if (soCustomform == so_ogj_custForm) {
					var soCount = soRecord.getLineItemCount('item');
					var poCount = poRecord.getLineItemCount('item');
					for (var i = 1; i < soCount + 1; i++) {
						
					    // �����A�C�e��&& SO item line poid= PO id
						if (soRecord.getLineItemValue('item', 'createpo', i) == 'DropShip'
								&& soRecord.getLineItemValue('item', 'poid', i) == nlapiGetRecordId()) {
							
							// SO item line �A�C�e��
							var soItem = soRecord.getLineItemValue('item','item', i);
							
							// SO item line �ŋ��R�[�h
							var soTaxcode = soRecord.getLineItemValue('item','taxcode', i);
							
							// SO item line ����
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
		nlapiLogExecution('debug', '�G���[', e.message);
	}
  
  
  	try {		
		var poRecord = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());	
		// PO�J�X�^���E�t�H�[��
		var poCustomform = poRecord.getFieldValue('customform'); 
		if (poCustomform == po_ogj_custForm) {
				 var itemArray= new Array();
				 var count=poRecord.getLineItemCount('item');
				 for(var i=1;i<count+1;i++){			 
					 var item=poRecord.getLineItemValue('item', 'item', i);
					 itemArray.push(item); //�A�C�e��
				 }
				 itemArray=unique(itemArray);
				 var subsidiary=poRecord.getFieldValue('subsidiary');//�q���
				 var entity=poRecord.getFieldText('entity');//�d����
				 var entityId=poRecord.getFieldValue('entity');//�d����Id
				 var entityString = entity.toString();
				 var entityFirst = entityString.substr(0,1);//�d����1��
				 var entityFive = entityString.substr(0,5);//�d����5��
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
						 var pdftemp = inquiriesSearch[k].getValue("custrecord_ogw_pdftemp"); //������PDF�e���v���[�g
						 var inquiries = inquiriesSearch[k].getValue("custrecord_ogw_inquiries"); //�₢���킹��
						 var column = inquiriesSearch[0].getAllColumns();
						 var poLineKey = inquiriesSearch[k].getValue(column[4]);//�d�������ID + �A�C�e������ID
						 
						 var itemLineValueArr = new Array();
						 itemLineValueArr.push([pdftemp],[inquiries]);
						 lineKey[poLineKey] = new Array();
						 lineKey[poLineKey].push(itemLineValueArr);// key:PDF�e���v���[�g/�₢���킹��
					 }
				 }
				 		 
				 for(var p=1;p<count+1;p++){
					 poRecord.selectLineItem('item', p);
					 var itemId = poRecord.getCurrentLineItemValue('item', 'item');//�A�C�e��ID
					 var itmeName = poRecord.getCurrentLineItemValue('item', 'item_display');//�A�C�e�����O
					 var poLineKeyNum1 = entityId + "" + itemId; // key �d����ID + �A�C�e��ID
					 var poLineKeyNum2 = entityId; 				 // key �d����ID
					 var poLineKeyNum3 = itemId;				 // key �A�C�e��ID
					 var lineKeyValue1 = lineKey[poLineKeyNum1];
					 var lineKeyValue2 = lineKey[poLineKeyNum2];
					 var lineKeyValue3 = lineKey[poLineKeyNum3];			 
					 if(!isEmpty(itmeName)){
						 var itemString = itmeName.toString();
					 }
					 var inquiries='';
					 var pdfTemp='';
					 if(!isEmpty(lineKeyValue1)){
						 pdfTemp = lineKeyValue1[0][0];//������PDF�e���v���[�g
						 inquiries = lineKeyValue1[0][1];//�₢���킹��
					 }else if(!isEmpty(lineKeyValue2)){ 
						 pdfTemp = lineKeyValue2[0][0];//������PDF�e���v���[�g
						 inquiries = lineKeyValue2[0][1];//�₢���킹��
					 }else if(!isEmpty(lineKeyValue3)){
						 pdfTemp = lineKeyValue3[0][0];//������PDF�e���v���[�g
						 inquiries = lineKeyValue3[0][1];//�₢���킹��
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
		nlapiLogExecution('debug', '�G���[', e.message);
	}
  
  	try {
		// PO
		var poRecord = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
		
		// PO�J�X�^���E�t�H�[��
		var poCustomform = poRecord.getFieldValue('customform'); 
		var soLineArr = new Array();
		var sendMailFlagNeedChange=false;
		var sendMailFlag=poRecord.getFieldValue('custbody_ogw_po_sendmail');
		// PO�J�X�^���E�t�H�[��=OGJ
		if (poCustomform == po_ogj_custForm) {
			var poCount = poRecord.getLineItemCount('item');
			for (var i = 1; i < poCount + 1; i++) {
				// item line ����
				var quantity = poRecord.getLineItemValue('item','quantity', i);
				
				// item line ETA
				var eta = poRecord.getLineItemValue('item','custcol_eta', i);
				
				// item line ������
				var oldquantity = poRecord.getLineItemValue('item','custcol_ogw_old_quantity', i);
				
				// item line ��ETA
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
		nlapiLogExecution('debug', '�G���[', e.message);
	}
  
  		try {
		
		// PO
		var poRecord = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
		
		// PO�J�X�^���E�t�H�[��
		var poCustomform = poRecord.getFieldValue('customform'); 
		// PO�J�X�^���E�t�H�[��=OGJ
		if (poCustomform == po_ogj_custForm) {
			var entityId=poRecord.getFieldValue('entity'); //�d����ID
			var entityRecord=nlapiLookupField('vendor', entityId, ['custentity_ogw_to','custentity_ogw_po_mail_template']); //�d����
			var mToAddress=entityRecord.custentity_ogw_to; //�d�����TO
			if(!isEmpty(mToAddress) && isEmpty(poRecord.getFieldValue('custbody_ogw_to'))){
					poRecord.setFieldValue('custbody_ogw_to', mToAddress); //��������TO
			}
         
			var itemArray= new Array();
			var count=poRecord.getLineItemCount('item');
			for(var i=1;i<count+1;i++){			 
				var item=poRecord.getLineItemValue('item', 'item', i);
				itemArray.push(item); //�A�C�e��
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
					poRecord.setFieldValue('custbody_ogw_cc', ccText); //��������CC
				}
			} 
          
			var mtemplate=entityRecord.custentity_ogw_po_mail_template; //�d����̔��������M�e���v���[�g
			if(!isEmpty(mtemplate)){
				if(isEmpty(poRecord.getFieldValue('custbody_ogw_po_mail_template'))){
					poRecord.setFieldValue('custbody_ogw_po_mail_template', mtemplate); //�������̔��������M�e���v���[�g
				}
				var mtemplateRecord=nlapiLookupField('customrecord_ogw_po_mail_template', mtemplate, ['custrecord_ogw_content','custrecord_ogw_cancel_content','custrecord_ogw_change_content']);//���������M�e���v���[�g
				var mBodyContent=mtemplateRecord.custrecord_ogw_content;//���e
				var mBodyCancle=mtemplateRecord.custrecord_ogw_cancel_content;//�L�����Z�����e
				var mBodyChange=mtemplateRecord.custrecord_ogw_change_content;//�ύX���e
				if(!isEmpty(mBodyContent) && isEmpty(poRecord.getFieldValue('custbody_ogw_content'))){
					poRecord.setFieldValue('custbody_ogw_content', mBodyContent); //�������̓��e
				}
				if(!isEmpty(mBodyCancle) && isEmpty(poRecord.getFieldValue('custbody_ogw_cancle_content'))){
					poRecord.setFieldValue('custbody_ogw_cancle_content', mBodyCancle); //�������̃L�����Z�����e
				}
				if(!isEmpty(mBodyChange)&& isEmpty(poRecord.getFieldValue('custbody_ogw_change_content'))){
					poRecord.setFieldValue('custbody_ogw_change_content', mBodyChange); //�������̕ύX���e
				}
			}
			if(type == 'create'){
				var itemArray= new Array();
				var poCount = poRecord.getLineItemCount('item');//����������
				for(var i=1;i<poCount+1;i++){			 
					var item=poRecord.getLineItemValue('item', 'item', i);
					itemArray.push(item); //�A�C�e��
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
						 var itemExplain = itemSearch[k].getValue("purchasedescription");//�w���̐���
						 var itemId = itemSearch[k].getValue("internalid");//����ID
						 
						 var itemExplainValue = new Array();
						 itemExplainValue.push(itemSearch[k].getValue("purchasedescription"));//�w���̐���
						 itemKey[itemId] = new Array();
						 itemKey[itemId].push(itemExplainValue);// key:itemID value:�w���̐���
					 }
				}
				
				for(var p=1;p<poCount+1;p++){
					poRecord.selectLineItem('item', p);
					var item = poRecord.getCurrentLineItemValue('item', 'item');//�A�C�e��ID
					var KeyValue = itemKey[item];
					var KeyValueString = KeyValue.toString();
					if(!isEmpty(KeyValueString)){
						poRecord.setCurrentLineItemValue('item', 'description',KeyValueString);//����
					}
					poRecord.commitLineItem('item');	
				}	
			}	  
          
          
			nlapiSubmitRecord(poRecord, false, true);
		}
	} catch (e) {
		nlapiLogExecution('debug', '�G���[', e.message);
	}
  
  	try {
			// PO
			var poRecord = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
			var poId = nlapiGetRecordId();
			// PO�J�X�^���E�t�H�[��
			var poCustomform = poRecord.getFieldValue('customform'); 
			if (poCustomform == po_ogj_custForm) {
				// �쐬��
				var createdfrom = poRecord.getFieldValue('createdfrom');
				if(!isEmpty(createdfrom)){
					var soRecord = nlapiLoadRecord('salesorder', createdfrom); 
					var soCustomform = soRecord.getFieldValue('customform');//SO�J�X�^���E�t�H�[��
					if(soCustomform == so_ogj_custForm){
						var soMessage = soRecord.getFieldValue('message'); //�ڋq�ւ̃��b�Z�[�W
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
		nlapiLogExecution('debug', '�G���[', e.message);
	}
	
	try {
		nlapiLogExecution("debug", "type", type);
//		if(type == 'dropship'){
			var poRecord = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
			var createdfrom = poRecord.getFieldValue('createdfrom');
			if(!isEmpty(createdfrom)){
				var soRecord = nlapiLoadRecord('salesorder', createdfrom); 
				var soCustomform = soRecord.getFieldValue('customform');//SO�J�X�^���E�t�H�[��
				if(soCustomform == '118'){
					var entity = soRecord.getFieldValue('entity');//�ڋq
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
		nlapiLogExecution('debug', '�G���[', e.message);
	}
}



function setTempValue (str,str1,itemString,pdfTemp,inquiries,poRecord){
	var first = str;
	var five = str1;
	if(first == "3"){
		poRecord.setCurrentLineItemValue('item', 'custcol_ogw_po_pdf_temp','1');//������PDF�e���v���[�g JP
	}else if(first == "1" && five != "10115"){
		poRecord.setCurrentLineItemValue('item', 'custcol_ogw_po_pdf_temp','2');//������PDF�e���v���[�g ENG
	}else if(first == "1" && five == "10115"){
		if(!isEmpty(itemString)){
			 if(itemString.substr(0,1) == "4" && itemString.length == "11"){
				 poRecord.setCurrentLineItemValue('item', 'custcol_ogw_po_pdf_temp','1');//������PDF�e���v���[�g JP
			 }else{
				 poRecord.setCurrentLineItemValue('item', 'custcol_ogw_po_pdf_temp','2');//������PDF�e���v���[�g ENG
			 }
		}  
	}else{
		poRecord.setCurrentLineItemValue('item', 'custcol_ogw_po_pdf_temp',pdfTemp);//������PDF�e���v���[�g 
	}
	poRecord.setCurrentLineItemValue('item', 'custcol_ogw_inquiries', inquiries); //�₢���킹��
}




/**
 * �d���f�[�^���폜����
 * 
 * @param array
 *            ���X�g
 * @returns ���X�g
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
 * ��������f�[�^���擾����
 * 
 * @param strSearchType
 * @param filters
 * @param columns
 * @returns {Array}
 */
function getSearchResults(type, id, filters, columns) {
    var search = nlapiCreateSearch(type, filters, columns);

    // �������A���ʂ�n��
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
 * ��l�𔻒f
 * 
 * @param str
 *            �Ώ�
 * @returns ���f����
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
 * ����̖�����
 * 
 * @param fileNmae
 *            �R���g���[��
 */
function setFieldDisableType(fileName, type) {
	try {
		var field = nlapiGetField(fileName);
		if (!isEmpty(field)) {
			field.setDisplayType(type);
		}
	} catch (e) {
		nlapiLogExecution('debug', fileName + '�������ُ̈�', e);
	}
}

function  setFieldHidden (record){
	var changeFlg = record.getFieldValue('custbody_ogw_po_change'); // CHANGE
	var cancleFlg = record.getFieldValue('custbody_ogw_cancle'); // CANCLE
	if(changeFlg != 'T' && cancleFlg != 'T'){
		setFieldDisableType('custbody_ogw_cancle_content','hidden'); //�L�����Z�����e
		setFieldDisableType('custbody_ogw_change_content','hidden'); //�ύX���e
	}else if(changeFlg == 'T' && cancleFlg == 'F'){
		setFieldDisableType('custbody_ogw_cancle_content','hidden'); //�L�����Z�����e
		setFieldDisableType('custbody_ogw_content','hidden'); //���e
	}else if(cancleFlg == 'T' && changeFlg == 'F'){
		setFieldDisableType('custbody_ogw_content','hidden'); //���e
		setFieldDisableType('custbody_ogw_change_content','hidden'); //�ύX���e
	}else if(cancleFlg == 'T' && changeFlg == 'T'){
		setFieldDisableType('custbody_ogw_content','hidden'); //���e
		setFieldDisableType('custbody_ogw_change_content','hidden'); //�ύX���e
	}
}