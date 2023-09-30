/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       2023/04/11	  CPC_宋
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
var so_ogj_form = '239'; //so_ogj
var soCsvfile = '463';
var inv_ogj_form = '240';//invoice_ogj
var ven_ogj_form = '242';//vendorbill_ogj
var itemful_ogj_form = '241';//itemfulfillment_ogj

function scheduled(type) {
	var fileid = nlapiGetContext().getSetting('SCRIPT','custscript_ogw_csv_file_id');
	nlapiLogExecution("debug", "fileid",fileid);
	if(!isEmpty(fileid)){
		var fileRecordId = nlapiGetContext().getSetting('SCRIPT','custscript_ogw_csv_filerecord_id');
		var file = nlapiLoadFile(fileid);
		var fileArr = file.getValue().split('\r\n');
		var oldFieldName=file.getName();
		var xmlString = 'エラー,注文書番号,注文日付,顧客,アイテム,CUST. PO#,注文数量,入荷済み数量,入荷待ち数量,販売単価,販売税金コード,ETA,発注書番号,購入単価,購入税金コード,仕入先,受領予定日,メモ\r\n';
		csvFileCreate(fileArr,xmlString,oldFieldName,fileRecordId);
	}
}

function csvFileCreate(fileArr,xmlString,oldFieldName,fileRecordId){
	var csvStatus = '';
	var importTranidArr = new Array();
	for(var i = 1 ; i  < fileArr.length ; i++){
		governanceYield();
		if(!isEmpty(fileArr[i])){
			var fileLine = csvDataToArray(fileArr[i].toString());
			var soTranid=defaultEmpty(fileLine[0]);// 注文書番号
			if(importTranidArr.indexOf(soTranid) < 0){
				var itemArray=new Array(); 
				var itemLineArr={};
				var trandate = defaultEmpty(fileLine[1]);//注文日付
				var entity = defaultEmpty(fileLine[2]);//顧客
				var item = defaultEmpty(fileLine[3]);// アイテム
				var custPo = defaultEmpty(fileLine[4]);// CUST. PO#
				var soQuantity = defaultEmpty(fileLine[5]);//注文数量
				var quantitypicked = defaultEmpty(fileLine[6]);//入荷済み数量
				var quantity = defaultEmpty(fileLine[7]);//入荷待ち数量
				var soRate = defaultEmpty(fileLine[8]);//販売単価 -0509
				var taxCode = defaultEmpty(fileLine[9]);// 税金コード
				var eta = fileLine[10];// ETA
				var poTranid = defaultEmpty(fileLine[11]);//発注書番号		
				var poRate = defaultEmpty(fileLine[12]);//購入単価-0509
				var poTaxcod = defaultEmpty(fileLine[13]);//購入税金コード-0509	
				var poEntity = defaultEmpty(fileLine[14]);//仕入先
				var expectedreceiptdate = defaultEmpty(fileLine[15]);//受領予定日
				var memo = defaultEmpty(fileLine[16]);//メモ	
								
				itemArray.push(item);
				itemLineArr[item]=new Array();
				var itemLineValueArr = new Array();
				itemLineValueArr.push([custPo],[quantity],[soRate],[eta],[poTranid],[poRate]);
				itemLineArr[item].push(itemLineValueArr);
				
				try{
					 var soSearch = nlapiSearchRecord("salesorder",null,
							 [
							    ["type","anyof","SalesOrd"], 
							    "AND", 
							    ["numbertext","is",soTranid]
							 ], 
							 [
							    new nlobjSearchColumn("internalid",null,"GROUP"),
							    new nlobjSearchColumn("subsidiary",null,"GROUP"),
							 ]
							 );
					 if(!isEmpty(soSearch)){
						 var soId = soSearch[0].getValue("internalid",null,"GROUP");
						 var soSubsidiary = soSearch[0].getValue("subsidiary",null,"GROUP");
					 }
					 
					 for(var k = i+1 ; k  < fileArr.length ; k++){
						 governanceYield();
						 if(!isEmpty(fileArr[k])){
							 var fileLineInside = csvDataToArray(fileArr[k].toString());
							 var soTranidInside = fileLineInside[0];//注文書番号
							 if(soTranidInside == soTranid){ 
								var itemInside = defaultEmpty(fileLineInside[3]);// アイテム
								var custPoInside = defaultEmpty(fileLineInside[4]);// CUST. PO#
								var quantityInside = defaultEmpty(fileLineInside[7]);//入荷待ち数量
								var soRateInside = defaultEmpty(fileLineInside[8]);//販売単価 -0509
								var etaInside = fileLineInside[10];// ETA
								var poTranidInside = defaultEmpty(fileLineInside[11]);//発注書番号		
								var poRateInside = defaultEmpty(fileLineInside[12]);//購入単価-0509
                                  
                                if(isEmpty(itemLineArr[itemInside])){
                                   itemLineArr[itemInside]=new Array();
							       itemArray.push(itemInside);
                                } 
                                var itemLineValueArr = new Array();
                                itemLineValueArr.push([custPoInside],[quantityInside],[soRateInside],[etaInside],[poTranidInside],[poRateInside]);
                                itemLineArr[itemInside].push(itemLineValueArr); 
                             }
						 }
					 }
					 if(!isEmpty(soId)){
						 try{
							 var soRecord = nlapiLoadRecord('salesorder', soId);
							 if(!isEmpty(trandate)){
								 soRecord.setFieldValue('trandate', trandate);//日付
							 }
							 var soCount= soRecord.getLineItemCount('item');
							 for(var j=0;j<itemArray.length;j++){
								 var itemText=itemArray[j];
								 for(var p=1;p<soCount+1;p++){
									 governanceYield();
									 var itemName = soRecord.getLineItemText('item', 'item', p);
									 if(itemText == itemName){
										 soRecord.selectLineItem('item', p);
										 var soItemLineValue=itemLineArr[itemText];
										 setLineValue(soRecord,soItemLineValue,itemText);		 
									 }
								 }
							 }	 
							 nlapiSubmitRecord(soRecord, false,true);
						 }catch(e){
							 var recordMessage = e.message;
						 }			 
						 var xmlStringError = csvCreateRecord(soId,itemArray,itemLineArr,soTranid,soSubsidiary);	 
						 if(!isEmpty(recordMessage)){
							 if(!isEmpty(xmlStringError)){
								 xmlString+='"'+recordMessage+""+xmlStringError+'",'+soTranid+','+trandate+',"'+entity+'","'+item+'",'+custPo+','+soQuantity+','+quantitypicked+','+quantity+','+soRate+','+taxCode+','+eta+','+poTranid+','+poRate+','+poTaxcod+',"'+poEntity+'",'+expectedreceiptdate+',"'+memo+'"\r\n';	
								 csvStatus ='F';
							 }else{
								 xmlString+='"'+recordMessage+'",'+soTranid+','+trandate+',"'+entity+'","'+item+'",'+custPo+','+soQuantity+','+quantitypicked+','+quantity+','+soRate+','+taxCode+','+eta+','+poTranid+','+poRate+','+poTaxcod+',"'+poEntity+'",'+expectedreceiptdate+',"'+memo+'"\r\n';	
								 csvStatus ='F';
							 }
						 }else{
							 if(!isEmpty(xmlStringError)){
								 xmlString+='"'+xmlStringError+'",'+soTranid+','+trandate+',"'+entity+'","'+item+'",'+custPo+','+soQuantity+','+quantitypicked+','+quantity+','+soRate+','+taxCode+','+eta+','+poTranid+','+poRate+','+poTaxcod+',"'+poEntity+'",'+expectedreceiptdate+',"'+memo+'"\r\n';	
								 csvStatus ='F';
							 }else{
								 xmlString+='"'+'インポート成功'+'",'+soTranid+','+trandate+',"'+entity+'","'+item+'",'+custPo+','+soQuantity+','+quantitypicked+','+quantity+','+soRate+','+taxCode+','+eta+','+poTranid+','+poRate+','+poTaxcod+',"'+poEntity+'",'+expectedreceiptdate+',"'+memo+'"\r\n';	
								 csvStatus ='T';
							 }
						 }
						 
					 }else{
						 xmlString+='"'+'注文書番号が正しくありません'+'",'+soTranid+','+trandate+',"'+entity+'","'+item+'",'+custPo+','+soQuantity+','+quantitypicked+','+quantity+','+soRate+','+taxCode+','+eta+','+poTranid+','+poRate+','+poTaxcod+',"'+poEntity+'",'+expectedreceiptdate+',"'+memo+'"\r\n';
						 csvStatus ='F';
					 }
				}catch(e){
					 nlapiLogExecution("debug", "e", e.message);
				}
				importTranidArr.push(soTranid);
			}
		}
	}
  	 createFileAndRecord(oldFieldName,xmlString,fileRecordId,csvStatus)
}

function setLineValue(soRecord,soItemLineValue,itemText){ 
	var soCustPo = soItemLineValue[0][0][0];//CUST. PO#
	var soRateValue = soItemLineValue[0][2][0];//販売単価
	var soEta = soItemLineValue[0][3][0];//ETA
	var poTranid = soItemLineValue[0][4][0];//発注書番号 
	var poRateValue = soItemLineValue[0][5][0];//購入単価
	
	if(!isEmpty(soCustPo)){
		 soRecord.setCurrentLineItemValue('item', 'custcol7', soCustPo); //Cust. PO#
	}
	if(!isEmpty(soEta)){
		 soRecord.setCurrentLineItemValue('item', 'custcol_eta', soEta); //ETA
	}
	if(!isEmpty(soRateValue)){
		 soRecord.setCurrentLineItemValue('item', 'rate', soRateValue); //単価
	}
	if(!isEmpty(poTranid)&& poTranid != 'null'){
		 var purchaseorderSearch  = nlapiSearchRecord("purchaseorder",null,
				 [
				    ["type","anyof","PurchOrd"], 
				    "AND", 
				    ["numbertext","is",poTranid]
				 ], 
				 [
				    new nlobjSearchColumn("internalid",null,"GROUP")
				 ]
				 );
		 if(!isEmpty(purchaseorderSearch)){
			 var poId = purchaseorderSearch[0].getValue("internalid",null,"GROUP");
			 var poRecord = nlapiLoadRecord('purchaseorder', poId);
			 var poCount= poRecord.getLineItemCount('item');
			 for(var p=1;p<poCount+1;p++){
				 governanceYield();
				 var itemName = poRecord.getLineItemText('item', 'item', p);
				 if(itemText == itemName){
					 newItemFlag=false;
					 poRecord.selectLineItem('item', p);
					 if(!isEmpty(poRateValue)){
						 poRecord.setCurrentLineItemValue('item', 'rate', poRateValue); //単価
					 }
					 poRecord.commitLineItem('item');
				 }
			 }
			 nlapiSubmitRecord(poRecord, false,true);
		 }
	}	
	soRecord.commitLineItem('item');
}


function csvCreateRecord(soId,itemArray,itemLineArr,soTranid,soSubsidiary){
	var itemfulfillmentErrorMessage = '';
	var invRecordErrorMessage= '';
	var vendorbillRecordErrorMessage = '';
	if(soSubsidiary == '1'){
		var locationValue = '1';
	}else if(soSubsidiary == '2'){
		var locationValue = '3';
	}
	
	try{
		//配送
		for(var j=0;j<itemArray.length;j++){
			 governanceYield();
			 var itemfulfillmentRecord = nlapiTransformRecord('salesorder',soId, 'itemfulfillment');
			 itemfulfillmentRecord.setFieldValue('shipstatus', 'C');
			 itemfulfillmentRecord.setFieldValue('customform',itemful_ogj_form);
			 var itemfulfillCount= itemfulfillmentRecord.getLineItemCount('item'); //配送line
			 var itemText=itemArray[j];
			 var soItemLineValue=itemLineArr[itemText];
			 var soQuantity =soItemLineValue[0][1][0];//数量
			 var soEta =soItemLineValue[0][3][0];//ETA
			 if(!isEmpty(soEta)&& soEta!= 'null'){
				itemfulfillmentRecord.setFieldValue('trandate', soEta);//日付
			 }
			 for(var p=1;p<itemfulfillCount+1;p++){
				 var itemName = itemfulfillmentRecord.getLineItemText('item', 'item', p);//配送Item
				 itemfulfillmentRecord.selectLineItem('item', p);	
				 if(itemText != itemName){
					 itemfulfillmentRecord.setCurrentLineItemValue('item', 'itemreceive', "F"); //配送
					 itemfulfillmentRecord.setCurrentLineItemValue('item', 'location', locationValue); //場所
				 }else{
					 itemfulfillmentRecord.setCurrentLineItemValue('item', 'location', locationValue); //場所
					 itemfulfillmentRecord.setCurrentLineItemValue('item', 'quantity', soQuantity); //数量
				 }
				 itemfulfillmentRecord.commitLineItem('item');	 
			 }
			var itemfulfillmentId = nlapiSubmitRecord(itemfulfillmentRecord, false,true);
			nlapiLogExecution("debug", "itemfulfillmentId", itemfulfillmentId); // 配送ID
		}
	}catch(e){
		nlapiLogExecution("debug", " csv create itemfulfillment", e.message);
		itemfulfillmentErrorMessage = e.message;
	}
	
	try {
		// 請求書
		for(var j=0;j<itemArray.length;j++){
			var type = 'invoice';
			governanceYield();
			var invRecord = nlapiTransformRecord('salesorder', soId, 'invoice');
			invRecord.setFieldValue('trandate',new Date());
			invRecord.setFieldValue('customform',inv_ogj_form);
			var invTranid = getTranid(soId,soTranid,type);
			invRecord.setFieldValue('tranid',invTranid);
			invRecord.setFieldValue('otherrefnum',invTranid);
			var invCount= invRecord.getLineItemCount('item'); //請求書line
			var itemText=itemArray[j];
			var soItemLineValue=itemLineArr[itemText];
			var soQuantity =soItemLineValue[0][1][0];//数量
			var soEta =soItemLineValue[0][3][0];//ETA
			if(!isEmpty(soEta)&& soEta!= 'null'){
				invRecord.setFieldValue('custbody21', soEta);//INVOICE DATE
				var lastDate = getLastDate(soEta);
				if(!isEmpty(lastDate)){
					invRecord.setFieldValue('trandate', lastDate);//日付
				}
			}
			for(var p=1;p<invCount+1;p++){
				var itemName = invRecord.getLineItemText('item', 'item', p);//請求書Item
				if(itemText != itemName){
					invRecord.removeLineItem('item',p);
				}else{
					invRecord.selectLineItem('item',p); 
					invRecord.setCurrentLineItemValue('item', 'quantity', soQuantity); //数量
					invRecord.commitLineItem('item');
				}
			}
	        var invRecordId = nlapiSubmitRecord(invRecord, false, true);
	        nlapiLogExecution("debug", "invRecordId", invRecordId); //請求書ID
		}
	}catch (e){
		invRecordErrorMessage =  e.message;
		nlapiLogExecution("debug", " csv create invoice", e.message);
	}
	
	try{
		//支払請求書 
		for(var j=0;j<itemArray.length;j++){
			 var type = 'vendorbill';
			 var itemText=itemArray[j];
			 var soItemLineValue=itemLineArr[itemText];
			 var soQuantity =soItemLineValue[0][1][0];//数量
			 var soEta =soItemLineValue[0][3][0];//ETA
			 var poTranid =soItemLineValue[0][4][0];//発注書番号
			if(!isEmpty(poTranid) && poTranid != 'null'){
				 var poSearch = nlapiSearchRecord("purchaseorder",null,
						 [
						    ["type","anyof","PurchOrd"], 
						    "AND", 
						    ["numbertext","is",poTranid]
						 ], 
						 [
						    new nlobjSearchColumn("internalid",null,"GROUP")
						 ]
						 );
				 if(!isEmpty(poSearch)){
					 governanceYield();
					 var poId = poSearch[0].getValue("internalid",null,"GROUP");
					 nlapiLogExecution("debug", "poId", poId);
					 var vendorbillRecord = nlapiTransformRecord('purchaseorder', poId, 'vendorbill');//支払請求書 
					 vendorbillRecord.setFieldValue('customform',ven_ogj_form);
					 var vendorbillTranid = getTranid(soId,soTranid,type);
					 vendorbillRecord.setFieldValue('tranid',vendorbillTranid);
					 var entity = vendorbillRecord.getFieldText('entity');
			    	 var entityText = entity.substring(0, 2);
			    	 if(entityText == '31'){
						 if(!isEmpty(soEta)&& soEta!= 'null'){//0504
								var lastDate = getLastDate(soEta);
								if(!isEmpty(lastDate)){
									vendorbillRecord.setFieldValue('trandate', lastDate);//日付
								}
						 }
			    	 }
					 var vendorbillCount= vendorbillRecord.getLineItemCount('item'); //支払請求書 line
					 for(var p=1;p<vendorbillCount+1;p++){
						 var itemName = vendorbillRecord.getLineItemText('item', 'item',p);//支払請求書 Item
						 if(itemText != itemName){
							 vendorbillRecord.removeLineItem('item',p);
						 }else{
							 vendorbillRecord.selectLineItem('item', p); 
							 vendorbillRecord.setCurrentLineItemValue('item', 'quantity', soQuantity); //数量
							 vendorbillRecord.commitLineItem('item');
						 }
					 }
					 var vendorbillRecordId = nlapiSubmitRecord(vendorbillRecord, false,true);
					 nlapiLogExecution("debug", "vendorbillRecordId", vendorbillRecordId); // 支払請求書ID
				 }
			}
		}
	}catch(e){
		nlapiLogExecution("debug", "create vendorbill", e.message);
		vendorbillRecordErrorMessage = e.message;
	}			
	messageValue = itemfulfillmentErrorMessage+""+invRecordErrorMessage+""+vendorbillRecordErrorMessage;
	return messageValue;
}

function getTranid(soId,soTranid,type){
	var newTranid = '';
	if(type == 'invoice'){
			var invoiceSearch  = nlapiSearchRecord("invoice",null,
					[
					   ["type","anyof","CustInvc"],  
					   "AND", 
					   ["createdfrom","anyof",soId],
					   "AND", 
					   ["mainline","is","F"], 
					   "AND", 
					   ["taxline","is","F"]
					], 
					[
					   new nlobjSearchColumn("tranid"),
					]
					);
			if(!isEmpty(invoiceSearch)){
				var invoiceTranidArr= new Array();
				for(var j = 0;j<invoiceSearch.length;j++){
					var invTranid = invoiceSearch[j].getValue("tranid");
					invoiceTranidArr.push(invTranid);
				}
				var invoiceLeng = invoiceTranidArr.length;
				newTranid = soTranid + "-"+(invoiceLeng+1);
			}else{
				newTranid = soTranid;
			}
	}else if(type == 'vendorbill'){
		var vendorbillSearch = nlapiSearchRecord("vendorbill",null,
				[
				   ["type","anyof","VendBill"],  
				   "AND", 
				   ["createdfrom.createdfrom","anyof",soId],
				   "AND", 
				   ["mainline","is","F"], 
				   "AND", 
				   ["taxline","is","F"]
				], 
				[
				   new nlobjSearchColumn("tranid")
				]
				);
		if(!isEmpty(vendorbillSearch)){
			var vendorTranidArr= new Array();
			for(var j = 0;j<vendorbillSearch.length;j++){
				var vendorTranid = vendorbillSearch[j].getValue("tranid");
				vendorTranidArr.push(vendorTranid);
			}
			var vendorbillLeng = vendorTranidArr.length;
			newTranid = soTranid + "-"+(vendorbillLeng+1);
		}else{
			newTranid = soTranid;
		}
	}
	return newTranid;
}


function createFileAndRecord(oldFieldName,xmlString,fileRecordId,csvStatus) {
	  var nxlsFile = nlapiCreateFile(oldFieldName.split('.csv')[0]+'_'+RondomStr()+'_'+'results.csv', 'CSV', xmlString);
	  nxlsFile.setFolder(soCsvfile);
	  nxlsFile.setName(oldFieldName.split('.csv')[0]+'_'+RondomStr()+'_'+'results.csv');
	  nxlsFile.setEncoding('SHIFT_JIS');
	  // save file
      var newFileID = nlapiSubmitFile(nxlsFile);  //fileRecordId
  	  var fileRecord = nlapiLoadRecord('customrecord_ogw_csvimport_result', fileRecordId);
	  if(!isEmpty(fileRecord)){
		fileRecord.setFieldValue('custrecord_ogw_csvimport_results', newFileID);
		if(csvStatus == 'T'){
			fileRecord.setFieldValue('custrecord_ogw_csv_status', '2');
		}else{
			fileRecord.setFieldValue('custrecord_ogw_csv_status', '3');
		}
		nlapiSubmitRecord(fileRecord, false, true);
	  }
}

function governanceYield() {
	if (parseInt(nlapiGetContext().getRemainingUsage()) <= 300) {
		var state = nlapiYieldScript();
		if (state.status == 'FAILURE') {
			nlapiLogExecution('DEBUG', 'Failed to yield script.');
		} else if (state.status == 'RESUME') {
			nlapiLogExecution('DEBUG', 'Resuming script');
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

/**
 * 内容にはカンマを含める処理
 * 
 * @param strData
 * @returns
 */
function csvDataToArray(strData) {

    strDelimiter = (",");

    var objPattern = new RegExp(
            ("(\\" + strDelimiter + "|\\r?\\n|\\r|^)" + "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" + "([^\"\\" + strDelimiter + "\\r\\n]*))"), "gi");

    var arrData = [[]];

    var arrMatches = null;

    while (arrMatches = objPattern.exec(strData)) {

        var strMatchedDelimiter = arrMatches[1];

        if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)) {
            arrData.push([]);
        }

        var strMatchedValue = '';
        if (arrMatches[2]) {
            strMatchedValue = arrMatches[2].replace(new RegExp("\"\"", "g"), "\"");

        } else {
            strMatchedValue = arrMatches[3];
        }

        arrData[arrData.length - 1].push(strMatchedValue);
    }

    return (arrData[0]);
}


function getLastDate(date){
	try{
		if(!isEmpty(date)){
			var dateValue = nlapiStringToDate(date);
			var year = dateValue.getFullYear();
			var month = dateValue.getMonth()+1;
			var date = 0;
			var laetDateValue = new Date(year,month,date);
			var lastDateString = nlapiDateToString(laetDateValue);
			return lastDateString;
		}
	}catch(e){
		nlapiLogExecution("debug", "e", e.message);
	}
}

function RondomStr(){
	  var arr1 = new Array("0","1","2","3","4","5","6","7","8","9");
	  var nonceStr=''
	  for(var i=0;i<5;i++){
	      var n = parseInt(Math.floor(Math.random()*5));
	      nonceStr+=arr1[n];
	  }
	  return parseInt(nonceStr)
}

function defaultEmpty(src){
	return src || " ";
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

function toEmptyString(src){
	var meaningString = src.replace(/null/g,"");
	return  meaningString;
}