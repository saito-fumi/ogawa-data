/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       2023/03/16     CPC_宋
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */

function suitelet(request, response){
	var poId = request.getParameter('poid');//PO ID
	var errorValue = request.getParameter('errorValue'); //異常発生 

	if(!isEmpty(poId)){
		var poRecord = nlapiLookupField('purchaseorder', poId, ['custbody_ogw_po_mail_template','custbody_ogw_to','custbody_ogw_cc','custbody_ogw_content','custbody_ogw_cancle_content','custbody_ogw_change_content','custbody_ogw_person','custbody_ogw_po_change','custbody_ogw_cancle']);				
		var potTemplate = poRecord.custbody_ogw_po_mail_template; // 発注書送信テンプレート
		var potTo = poRecord.custbody_ogw_to; // TO
		var poCc = poRecord.custbody_ogw_cc; //CC
		var poContent = poRecord.custbody_ogw_content; // 内容
		var pocancelContent = poRecord.custbody_ogw_cancle_content; // キャンセル内容
		var pochangeContent = poRecord.custbody_ogw_change_content; // 変更内容
		var person = poRecord.custbody_ogw_person; // 担当者
		var changeFlg = poRecord.custbody_ogw_po_change; // CHANGE
		var cancleFlg = poRecord.custbody_ogw_cancle; // CANCLE
			var form = nlapiCreateForm('送信', true);
			
			var templateField =form.addField('custpage_template', 'select', '発注書送信テンプレート', null); //発注書送信テンプレート
			var templateSearch  = getSearchResults("customrecord_ogw_po_mail_template",null,
					[
					], 
					[
					   new nlobjSearchColumn("internalid"), 
					   new nlobjSearchColumn("name"),
					]
					);
			
			if(!isEmpty(templateSearch)){
				templateField.addSelectOption('', '');
				for(var i = 0; i<templateSearch.length;i++){
					templateField.addSelectOption(templateSearch[i].getValue("internalid"),templateSearch[i].getValue("name"));
				}
			}
			templateField.setDisplayType('inline');	
			var toField =form.addField('custpage_to', 'textarea', 'TO', null); //TO
			toField.setMandatory(true);
			var ccField =form.addField('custpage_cc', 'textarea', 'CC', null); //CC
			var personField =form.addField('custpage_person', 'select', '担当者','employee', null); //担当者
			if(cancleFlg != 'T' && changeFlg != 'T'){
				var contentField =form.addField('custpage_content', 'textarea', '内容', null); //内容
				contentField.setDefaultValue(poContent);//内容
			}else if(cancleFlg == 'T' && changeFlg == 'F'){
				var cancleField =form.addField('custpage_cancle', 'textarea', 'キャンセル内容', null); //キャンセル内容
				cancleField.setDefaultValue(pocancelContent);//キャンセル内容
			}else if(changeFlg == 'T' && cancleFlg == 'F'){
				var changeField =form.addField('custpage_change', 'textarea', '変更内容', null); //変更内容
				changeField.setDefaultValue(pochangeContent);//変更内容
			}else if(cancleFlg == 'T' && changeFlg == 'T'){
				var cancleField =form.addField('custpage_cancle', 'textarea', 'キャンセル内容', null); //キャンセル内容
				cancleField.setDefaultValue(pocancelContent);//キャンセル内容
			}
			var poIdField =form.addField('custpage_poid', 'text', 'poid', null); //発注書ID .setDisplayType('hidden');
			poIdField.setDisplayType('hidden');
			templateField.setDefaultValue(potTemplate); //発注書送信テンプレート
			toField.setDefaultValue(potTo);//TO
			ccField.setDefaultValue(poCc);//CC
			personField.setDefaultValue(person);//担当者
			poIdField.setDefaultValue(poId);//POID
			
			form.setScript('customscript_ogw_cs_sendmail_update');
			form.addButton('custpage_sandmail', '送信','sandmail()');
			form.addButton('custpage_save', 'ドロップ保存','saveReturn()');
			response.writePage(form);
	}
	if(!isEmpty(errorValue)){
		var form=nlapiCreateForm('送信ステータス', true);
		form.addButton('custpage_refresh', '戻る', 'parent.location.reload();');
		form.addField('custpage_lable1', 'label', '異常発生');
		var errorField =form.addField('custpage_error', 'textarea', '異常情報', null); //異常情報 
		errorField.setDisplayType('inline');	
		errorField.setDefaultValue(errorValue);
		response.writePage(form);
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
