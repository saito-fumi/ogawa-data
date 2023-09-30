/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       2023/03/22     CPC_y
 *
 */
var so_ogj_custForm = '239';
var OGS_Domestic_Sales_Order='120';
var OGS_ProForma_Invoice='123';
var OGS_Sales_Order	='118';

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 * 
 * @appliedtorecord recordType
 * 
 * @param {String}
 *            type Operation types: create, edit, delete, xedit approve, reject,
 *            cancel (SO, ER, Time Bill, PO & RMA only) pack, ship (IF)
 *            markcomplete (Call, Task) reassign (Case) editforecast (Opp,
 *            Estimate)
 * @returns {Void}
 */
function userEventBeforeSubmit(type) {
	try{
		if (type == 'delete') {
			return;
		}
		var customform=nlapiGetFieldValue('customform');
		if(customform == so_ogj_custForm||customform == OGS_Domestic_Sales_Order ||customform == OGS_ProForma_Invoice||customform ==OGS_Sales_Order){ //OGJ/OGS
			var count=nlapiGetLineItemCount('item');
			for(var i=1;i<count+1;i++){	
				nlapiSelectLineItem('item', i);
				var povendor=nlapiGetCurrentLineItemValue('item', 'povendor');
				if(!isEmpty(povendor)){
					var povendorname=nlapiLookupField('vendor', povendor, 'altname');
					nlapiSetCurrentLineItemValue('item', 'custcol_ogw_vendorname', povendorname);
					nlapiCommitLineItem('item');
				}								
			}
		}
	}catch(e){
		nlapiLogExecution("debug", "e", e.message);
	}
}
	
/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */


function userEventAfterSubmit(type, form, request){
		try{
			if (type == 'delete') {
				return;
			}
			var soRecord = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
			var customform = soRecord.getFieldValue('customform');//カスタム・フォーム
			if(customform == so_ogj_custForm){ //OGJ
				if(type == 'create'){
					var itemArray= new Array();
					var soCount = soRecord.getLineItemCount('item');//注文書明細
					for(var i=1;i<soCount+1;i++){			 
						var item=soRecord.getLineItemValue('item', 'item', i);
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
					for(var p=1;p<soCount+1;p++){
						soRecord.selectLineItem('item', p);
						var item = soRecord.getCurrentLineItemValue('item', 'item');//アイテムID
						var KeyValue = itemKey[item];
						var KeyValueString = KeyValue.toString();
						if(!isEmpty(KeyValueString)){
							soRecord.setCurrentLineItemValue('item', 'description',KeyValueString);//説明
						}
						soRecord.commitLineItem('item');	
					}
				}
				var soTranid = soRecord.getFieldValue('tranid'); //注文番号 
				var soId = nlapiGetRecordId();
				getTranid(soTranid,soId);
				if(isEmpty(soRecord.getFieldValue('otherrefnum'))){ 
					soRecord.setFieldValue('otherrefnum', soTranid);//発注書番号
				}
				nlapiSubmitRecord(soRecord, false, true);
			}
		}catch(e){
			nlapiLogExecution("debug", "e", e.message);
		}
}


function getTranid(soTranid,soId){
	nlapiLogExecution("debug", "getTranid");
	var purchaseorderSearch   = nlapiSearchRecord("purchaseorder",null,
			[
			   ["type","anyof","PurchOrd"],  
			   "AND", 
			   ["createdfrom","anyof",soId],
			], 
			[
			   new nlobjSearchColumn("internalid"),
			]
			);
	if(!isEmpty(purchaseorderSearch)){
		var poIdList = new Array();
		for(var j = 0;j<purchaseorderSearch.length;j++){
			var poId = purchaseorderSearch[j].getValue("internalid");
			poIdList.push(poId);
		}
		poIdList = unique(poIdList);
		var poTranid = '';
		var poIdListLen = poIdList.length;
		for(var k = 0; k < poIdList.length; k++){
			var poId = poIdList[k];
			if(poIdListLen == 1){
				poTranid = soTranid
			}else{
				poTranid = soTranid+"/"+(k+1);
			}
			nlapiSubmitField('purchaseorder', poId, ['employee','tranid'], [nlapiGetUser(),poTranid], false);
		}
	}
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