/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       2023/03/07	  CPC_宋
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
var so_ogj_form = '239';
var soCsvfile = '463';

function scheduled(type) {
	var fileid = nlapiGetContext().getSetting('SCRIPT','custscript_ogw_import_file');
	var fileRecordId = nlapiGetContext().getSetting('SCRIPT','custscript_ogw_import_filerecord_id');
	var csvType = nlapiGetContext().getSetting('SCRIPT','custscript_ogw_csv_type'); //Type
	var nowUser = nlapiGetContext().getSetting('SCRIPT','custscript_ogw_csv_user'); //USER
	var file = nlapiLoadFile(fileid); // CSVファイル
	var fileArr = file.getValue().split('\r\n');
	var oldFieldName=file.getName();
	var xmlString = 'エラー,注文番号,顧客,日付,通貨,NUMBER,アイテム,価格水準,DESCRIPTION,CUST. PO#,PACKING DETAILS,QTY,単価,ETA,TAX,CONSIGNEE,CONSIGNEE ADDRESS,SHIPPING MARK,SHIPPING MODE,INCOTERMS,顧客へのメッセージ,仕入先,購入契約書\r\n';
	var csvStatus = '';
	var custForm = nlapiGetContext().getSetting('SCRIPT','custscript_ogw_csv_custform'); //カスタム・フォーム
	soCsvRecord(fileArr,nowUser,xmlString,oldFieldName,fileRecordId,csvType,custForm)
}

function soCsvRecord(fileArr,nowUser,xmlString,oldFieldName,fileRecordId,csvType,custForm){
	var trandate = '';
	var eta = '';
	var importTranidArr = new Array();
	for(var i = 1 ; i  < fileArr.length ; i++){
		governanceYield();
		if(!isEmpty(fileArr[i])){
	         var tmpLine = fileArr[i].toString();
	         var tmpLines = tmpLine.replace(/" "/g,"");
	         var tmpLinesFir = tmpLine.split(',');
	         if(isEmpty(tmpLinesFir[0])){
	        	 xmlString+='"'+'注文書番号は空にできません'+'"\r\n';
				 csvStatus ="F";
				 break;
	         }
	         var fileLine = csvDataToArray(tmpLines);
			 var soTranid=fileLine[0]; 
			 var poPrice = defaultEmpty(fileLine[22]);//購入契約書
			 if(importTranidArr.indexOf(soTranid) < 0){
				 var itemArray=new Array(); 
				 var itemLineArr={};
				 var entity = defaultEmpty(fileLine[1]);// 顧客
				 var oldTrandate = defaultEmpty(fileLine[2]);// 日付
				 if(!isEmpty(oldTrandate)){
					trandate = getNewDate(oldTrandate);
				 }
				 var currency = defaultEmpty(fileLine[3]);//通貨
				 var number = defaultEmpty(fileLine[4]);//NUMBER
				 var item = defaultEmpty(fileLine[5]);// アイテム
				 var price = defaultEmpty(fileLine[6]);// 価格水準
				 var description = defaultEmpty(fileLine[7]);// 説明
				 var custPo = defaultEmpty(fileLine[8]);//CUST. PO#		 
				 var custcol1 = defaultEmpty(fileLine[9]);//PACKING DETAILS
				 var quantity = defaultEmpty(fileLine[10]);// 数量
				 var rate = fileLine[11];// 単価		
				 var oldEta = fileLine[12];// ETA
				 if(!isEmpty(oldEta)){
					 eta = getNewDate(oldEta);
				 }
				 var taxcode = fileLine[13];// 税金コード
				 var custbody1 = defaultEmpty(fileLine[14]);// CONSIGNEE
				 var consAdd = defaultEmpty(fileLine[15]);//CONSIGNEE ADDRESS
				 var custbody2 = defaultEmpty(fileLine[16]);//SHIPPING MARK
				 var custbody3 = defaultEmpty(fileLine[17]);//SHIPPING MODE
				 var incoterms = defaultEmpty(fileLine[18]);//INCOTERMS
				 var soMessage = defaultEmpty(fileLine[19]);//顧客へのメッセージ
				 var poTranid = defaultEmpty(fileLine[20]);//発注書番号
				 var soEntity = defaultEmpty(fileLine[21]);//仕入先
				 
				 itemArray.push(item);
				 itemLineArr[item]=new Array();
				 var itemLineValueArr = new Array();
				 itemLineValueArr.push([number],[price],[description],[custPo],[custcol1],[quantity],[eta],[taxcode],[soEntity],[rate],[poTranid],[currency]);
				 itemLineArr[item].push(itemLineValueArr);
				 
				 var etaInside = '';
				 for(var k = i+1 ; k  < fileArr.length ; k++){
					 governanceYield();
					 if(!isEmpty(fileArr[k])){
						 var fileLineInside = csvDataToArray(fileArr[k].toString());
						 var soTranidInside = fileLineInside[0];//注文書番号
						 if(soTranidInside == soTranid){ 
							 var currencyInside=fileLineInside[3];//通貨
							 var numberInside=fileLineInside[4];//NUMBER
							 var itemInside=fileLineInside[5];// アイテム
							 var priceInside=fileLineInside[6];// 価格水準
							 var descriptionInside = fileLineInside[7];// 説明
							 var custpoInside = fileLineInside[8];//CUST. PO#	
							 var custcol1Inside = fileLineInside[9];//PACKING DETAILS
							 var quantityInside = fileLineInside[10];// 数量							 
							 var rateInside = fileLineInside[11];// 単価
							 var oldEtaInside = fileLineInside[12];// ETA
							 if(!isEmpty(oldEtaInside)){
								 etaInside = getNewDate(oldEtaInside);
							 }
							 var taxcodeInside = fileLineInside[13];// 税金コード		
							 var poTranidInside = fileLineInside[20];//発注書番号
							 var soEntityInside = fileLineInside[21];//仕入先
							 
							 if(isEmpty(itemLineArr[itemInside])){
								  itemLineArr[itemInside]=new Array();
								  itemArray.push(itemInside);
							 }
							 var itemLineValueArr = new Array();
							 itemLineValueArr.push([numberInside],[priceInside],[descriptionInside],[custpoInside],[custcol1Inside],[quantityInside],[etaInside],[taxcodeInside],[soEntityInside],[rateInside],[poTranidInside],[currencyInside]);
							 itemLineArr[itemInside].push(itemLineValueArr); 
						 }
					 }
				 }	
				 
				 var soSearch = nlapiSearchRecord("salesorder",null,
						 [
						    ["type","anyof","SalesOrd"], 
						    "AND", 
						    ["numbertext","is",soTranid]
						 ], 
						 [
						    new nlobjSearchColumn("internalid",null,"GROUP")
						 ]
						 );
				 if(csvType == 'create'){ //新規
					 try{
						 if(isEmpty(soSearch)){
							 var soRecord = nlapiCreateRecord('salesorder');
							 soRecord.setFieldValue('tranid', soTranid); //注文番号
							 setHeaderValue(soRecord,custForm,entity,trandate,custbody1,consAdd,custbody2,custbody3,incoterms,soMessage,poPrice,currency);
							 for(var k=0;k<itemArray.length;k++){
								 governanceYield();
								 var itemText=itemArray[k];
								 nlapiLogExecution("debug", "itemText", itemText);
								 soRecord.selectNewLineItem('item'); //明細	
								 var itemSearch = nlapiSearchRecord("item",null,
										 [
										    ["name","is",itemText],
										    "AND",
										    ["isinactive","is","F"],
										 ], 
										 [
										    new nlobjSearchColumn("internalid",null,"GROUP"),
										    new nlobjSearchColumn("subsidiary",null,"GROUP")
										 ]
										 );
								 if(!isEmpty(itemSearch)){
									 soRecord.setCurrentLineItemValue('item', 'item', itemSearch[0].getValue("internalid",null,"GROUP"));//アイテム
									 var soItemLineValue=itemLineArr[itemText]; 
									 setLineValue(soRecord,soItemLineValue,eta);
								 }
							 }
							 var soId = nlapiSubmitRecord(soRecord, false,false);
							 if(!isEmpty(soId)){
								 setPurchasecontract(soId,poPrice,nowUser,itemArray);
							 }	
							 xmlString+='"'+'インポート成功'+'","'+soTranid+'","'+entity+'","'+trandate+'","'+number+'","'+item+'","'+price+'","'+description+'","'+custPo+'","'+custcol1+'","'+quantity+'","'+rate+'","'+eta+'","'+taxcode+'","'+custbody1+'","'+consAdd+'","'+custbody2+'","'+custbody3+'","'+incoterms+'","'+soMessage+'","'+soEntity+'","'+poPrice+'"\r\n';
							 csvStatus ="T";	 	 
						 }else{
							 xmlString+='"'+'データ重複'+'","'+soTranid+'","'+entity+'","'+trandate+'","'+number+'","'+item+'","'+price+'","'+description+'","'+custPo+'","'+custcol1+'","'+quantity+'","'+rate+'","'+eta+'","'+taxcode+'","'+custbody1+'","'+consAdd+'","'+custbody2+'","'+custbody3+'","'+incoterms+'","'+soMessage+'","'+soEntity+'","'+poPrice+'"\r\n';
							 csvStatus ="F";
						 }
					 }catch(e){
						 nlapiLogExecution("debug","createError");
						 csvStatus = e.message;
						 xmlString+='"'+e.message+'","'+soTranid+'","'+entity+'","'+trandate+'","'+number+'","'+item+'","'+price+'","'+description+'","'+custPo+'","'+custcol1+'","'+quantity+'","'+rate+'","'+eta+'","'+taxcode+'","'+custbody1+'","'+consAdd+'","'+custbody2+'","'+custbody3+'","'+incoterms+'","'+soMessage+'","'+soEntity+'","'+poPrice+'"\r\n';
					 }
				 }else if(csvType == 'edit'){ //更新
					 try{
						 if(!isEmpty(soSearch)){
							 var soInternalID = soSearch[0].getValue("internalid",null,"GROUP");
							 var soRecord = nlapiLoadRecord('salesorder', soInternalID);
							 setHeaderValue(soRecord,custForm,entity,trandate,custbody1,consAdd,custbody2,custbody3,incoterms,soMessage,poPrice,currency);
							 var soCount= soRecord.getLineItemCount('item'); //line
							 for(var j=0;j<itemArray.length;j++){
								 var itemText=itemArray[j];
								 var newItemFlag=true;
								 for(var p=1;p<soCount+1;p++){
									 governanceYield();
									 var itemName = soRecord.getLineItemText('item', 'item', p);
									 if(itemText == itemName){
										 newItemFlag=false;
										 soRecord.selectLineItem('item', p);
										 var soItemLineValue=itemLineArr[itemText];
										 setLineValue(soRecord,soItemLineValue,eta);
									 }
								 }
								 if(newItemFlag){
									 governanceYield();
									 soRecord.selectNewLineItem('item'); //明細	
									 var itemSearch = nlapiSearchRecord("item",null,
											 [
											    ["name","is",itemText],
											    "AND",
											    ["isinactive","is","F"],
											 ], 
											 [
											    new nlobjSearchColumn("internalid",null,"GROUP")
											 ]
											 );
									 if(!isEmpty(itemSearch)){
										 var itemValue = itemSearch[0].getValue("internalid",null,"GROUP");
										 nlapiLogExecution("debug", "itemValue", itemValue);
										 soRecord.setCurrentLineItemValue('item', 'item', itemSearch[0].getValue("internalid",null,"GROUP"));//アイテム
										 var soItemLineValue=itemLineArr[itemText]; 
										 setLineValue(soRecord,soItemLineValue,eta);
									 }
								 }
								 var soId = nlapiSubmitRecord(soRecord, false,true);
								 if(!isEmpty(soId)){
									 setPurchasecontract(soId,poPrice,nowUser,itemArray);
								 }
								 var soItemLineValue=itemLineArr[itemText];
								 var soPoTranidInside =soItemLineValue[0][10][0];//発注書番号
								 var poId = getPoId(soItemLineValue);
								 if(custForm == '239'){
									 if(!isEmpty(poId)){
										 var sltype = 'sendmail';
										 var sendMailFlg = 'T';
										 commonSendMail(sltype,poId,nowUser,sendMailFlg);
									 }
								 }
							 }	 
							 xmlString+='"'+'インポート成功'+'","'+soTranid+'","'+entity+'","'+trandate+'","'+number+'","'+item+'","'+price+'","'+description+'","'+custPo+'","'+custcol1+'","'+quantity+'","'+rate+'","'+eta+'","'+taxcode+'","'+custbody1+'","'+consAdd+'","'+custbody2+'","'+custbody3+'","'+incoterms+'","'+soMessage+'","'+soEntity+'","'+poPrice+'"\r\n';
							 csvStatus ="T";	 	 
						 }else{
							 xmlString+='"'+'注文書番号が正しくありません'+'","'+soTranid+'","'+entity+'","'+trandate+'","'+number+'","'+item+'","'+price+'","'+description+'","'+custPo+'","'+custcol1+'","'+quantity+'","'+rate+'","'+eta+'","'+taxcode+'","'+custbody1+'","'+consAdd+'","'+custbody2+'","'+custbody3+'","'+incoterms+'","'+soMessage+'","'+soEntity+'","'+poPrice+'"\r\n';
							 csvStatus ="F";
						 }
					 }catch(e){
						 csvStatus = e.message;
						 xmlString+='"'+e.message+'","'+soTranid+'","'+entity+'","'+trandate+'","'+number+'","'+item+'","'+price+'","'+description+'","'+custPo+'","'+custcol1+'","'+quantity+'","'+rate+'","'+eta+'","'+taxcode+'","'+custbody1+'","'+consAdd+'","'+custbody2+'","'+custbody3+'","'+incoterms+'","'+soMessage+'","'+soEntity+'","'+poPrice+'"\r\n';
						 nlapiLogExecution("debug", "edit error", e.message);
					 }
				 }else if(csvType == 'cancel'){//キャンセル  isclosed
					 try{
						 var type = '';
						 if(!isEmpty(soSearch)){
							 var soInternalID = soSearch[0].getValue("internalid",null,"GROUP");
							 var soRecord = nlapiLoadRecord('salesorder', soInternalID);
							 type == 'salesorder';
							 setCancleType(soRecord,type);
							 for(var j=0;j<itemArray.length;j++){
								 var itemText=itemArray[j];
								 var soItemLineValue=itemLineArr[itemText];
								 var poId = getPoId(soItemLineValue);
								 if(!isEmpty(poId)){
									 type == 'purchaseorder';
									 var poRecord = nlapiLoadRecord('purchaseorder', poId);
									 setCancleType(poRecord,type);
									 var sltype = 'sendmail';
									 var sendMailFlg = 'T';
									 commonSendMail(sltype,poId,nowUser,sendMailFlg);
								 }
							 }
							 csvStatus ="T";
							 xmlString+='"'+'インポート成功'+'","'+soTranid+'","'+entity+'","'+trandate+'","'+number+'","'+item+'","'+price+'","'+description+'","'+custPo+'","'+custcol1+'","'+quantity+'","'+rate+'","'+eta+'","'+taxcode+'","'+custbody1+'","'+consAdd+'","'+custbody2+'","'+custbody3+'","'+incoterms+'","'+soMessage+'","'+soEntity+'","'+poPrice+'"\r\n';
						 }else{
							 csvStatus = "F";
							 xmlString+='"'+'注文書番号が正しくありません'+'","'+soTranid+'","'+entity+'","'+trandate+'","'+number+'","'+item+'","'+price+'","'+description+'","'+custPo+'","'+custcol1+'","'+quantity+'","'+rate+'","'+eta+'","'+taxcode+'","'+custbody1+'","'+consAdd+'","'+custbody2+'","'+custbody3+'","'+incoterms+'","'+soMessage+'","'+soEntity+'","'+poPrice+'"\r\n';
						 }
					 }catch(e){
						 csvStatus = e.message;
						 xmlString+='"'+e.message+'","'+soTranid+'","'+entity+'","'+trandate+'","'+number+'","'+item+'","'+price+'","'+description+'","'+custPo+'","'+custcol1+'","'+quantity+'","'+rate+'","'+eta+'","'+taxcode+'","'+custbody1+'","'+consAdd+'","'+custbody2+'","'+custbody3+'","'+incoterms+'","'+soMessage+'","'+soEntity+'","'+poPrice+'"\r\n';
						 nlapiLogExecution("debug", "cancel error", e.message);
					 }
				 }
				 importTranidArr.push(soTranid);
			 }
		}
	}
	createFileAndRecord(oldFieldName,xmlString,fileRecordId,csvStatus);
}

function setCancleType(record,type){ 
	if(type == 'purchaseorder'){
		record.setFieldValue('custbody_ogw_cancle', 'T'); 
	}
	var itemList = record.getLineItemCount('item');//アイテム明細部		
	for(var i = 1; i < itemList+1; i++){
		 record.setLineItemValue('item', 'isclosed', i,'T');
		 record.commitLineItem('item');
	}
	nlapiSubmitRecord(record,false,true);
}

function setPurchasecontract(soId,poPrice,nowUser,itemArray){
	var poSearch = getSearchResults("purchaseorder",null,
			 [
			    ["type","anyof","PurchOrd"], 
			    "AND", 
			    ["createdfrom","anyof",soId]
			 ], 
			 [
			    new nlobjSearchColumn("internalid",null,"GROUP"),
			 ]
			 );
	var purchasecontractSearch = nlapiSearchRecord("purchasecontract",null,
			 [
			    ["type","anyof","PurchCon"], 
			    "AND", 
			    ["numbertext","is",poPrice]
			 ], 
			 [
			    new nlobjSearchColumn("internalid",null,"GROUP")
			 ]
			 );
	var purchasecontractId ='';
	if(!isEmpty(purchasecontractSearch) ){
		purchasecontractId = purchasecontractSearch[0].getValue("internalid",null,"GROUP");
	}
	if(!isEmpty(poSearch)){
		for(var j=0;j<itemArray.length;j++){
			 var itemText=itemArray[j];
			 
				for(var j=0;j<poSearch.length;j++){
					var poId = poSearch[j].getValue("internalid",null,"GROUP");
					 try{
						governanceYield();
						var por= nlapiLoadRecord('purchaseorder', poId);
						por.setFieldValue('employee', nowUser);
						var pocon=por.getLineItemCount('item');
						for(var pori=1;pori<pocon+1;pori++){
							var itemName = por.getLineItemText('item', 'item', pori);				
							if(itemText == itemName){
								por.setFieldValue('purchasecontract', purchasecontractId);
								por.selectLineItem('item', pori);
								por.setCurrentLineItemValue('item', 'purchasecontract', purchasecontractId); 
								por.commitLineItem('item');					
							}
						}
						nlapiSubmitRecord(por, false, true)
					 }catch(e){
						 nlapiLogExecution("debug", "purchasecontract error", e.message);
					 }
				}		 
		}
	}
}

function getPoId (soItemLineValue){
	 var soPoTranidInside =soItemLineValue[0][10][0];//発注書番号
	 if(!isEmpty(soPoTranidInside)){
		 var poSearch = nlapiSearchRecord("purchaseorder",null,
				 [
				    ["type","anyof","PurchOrd"], 
				    "AND", 
				    ["numbertext","is",soPoTranidInside]
				 ], 
				 [
				    new nlobjSearchColumn("internalid",null,"GROUP")
				 ]
				 );
		 if(!isEmpty(poSearch)){
			var poid = poSearch[0].getValue("internalid",null,"GROUP");
			nlapiLogExecution("debug", "cancle po id", poid);
			return poid;
		 }
	 }
}


function createFileAndRecord(oldFieldName,xmlString,fileRecordId) {
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

function setHeaderValue(soRecord,custForm,entity,trandate,custbody1,consAdd,custbody2,custbody3,incoterms,soMessage,poPrice,currency){
	//カスタム・フォーム
	 soRecord.setFieldValue('customform', custForm); 
		 
	// 顧客 
	 if(!isEmpty(entity)){ 
		 var customerSearch = nlapiSearchRecord("customer",null,
					[
					   ["entityid","is",entity]
					], 
					[
					   new nlobjSearchColumn("internalid",null,"GROUP")
					]
					);
		 if(!isEmpty(customerSearch)){
			 // CONSIGNEE
			 if(soRecord.getFieldText('entity')!=entity){	 
				 soRecord.setFieldValue('entity', customerSearch[0].getValue("internalid",null,"GROUP")); 
			 }
		 } 
	 }
	 
	  // 通貨
	  if(soRecord.getFieldText('currency')!=currency){	 
		  soRecord.setFieldText('currency', currency); 
	  }
	 
	 // 日付
	 if(soRecord.getFieldValue('trandate')!=trandate){	 
		 soRecord.setFieldValue('trandate', trandate); 
	 }
	 
	 if(!isEmpty(custbody1)){ 
		 var customerSearch = nlapiSearchRecord("customer",null,
					[
					   ["entityid","is",custbody1]
					], 
					[
					   new nlobjSearchColumn("internalid",null,"GROUP")
					]
					);
		 if(!isEmpty(customerSearch)){
			 // CONSIGNEE
			 if(soRecord.getFieldText('custbody1')!=custbody1){	 
				 soRecord.setFieldValue('custbody1', customerSearch[0].getValue("internalid",null,"GROUP")); 
			 }
		 } 
	 }
	 
	// CONSIGNEE ADDRESS
	 if(soRecord.getFieldValue('custbody_cons_add')!=consAdd){	 
		 soRecord.setFieldValue('custbody_cons_add', consAdd); 
	 }
	// SHIPPING MARK
	 if(soRecord.getFieldValue('custbody2')!=custbody2){	 
		 soRecord.setFieldValue('custbody2', custbody2); 
	 }
	// SHIPPING MODE
	 if(soRecord.getFieldText('custbody3')!=custbody3){	 
		 soRecord.setFieldText('custbody3', custbody3); 
	 }
	// INCOTERMS
	 if(soRecord.getFieldText('custbody_me_incoterms')!=incoterms){	 
		 soRecord.setFieldText('custbody_me_incoterms', incoterms); 
	 }
	// 顧客へのメッセージ
	 if(soRecord.getFieldValue('message')!=soMessage){	 
		 soRecord.setFieldValue('message', soMessage); 
	 }
	 
	 if(!isEmpty(poPrice)){ //購入契約書
			var purchasecontractSearch = nlapiSearchRecord("purchasecontract",null,
					[
					   ["type","anyof","PurchCon"], 
					   "AND", 
					   ["numbertext","is",poPrice]
					], 
					[
					   new nlobjSearchColumn("internalid",null,"GROUP")
					]
					);
			if(!isEmpty(purchasecontractSearch) ){
				var purchasecontractId = purchasecontractSearch[0].getValue("internalid",null,"GROUP");
				soRecord.setFieldValue('custbody_ogw_purchasecontract_select', purchasecontractId); 
			}
	 } 
}

function setLineValue(soRecord,soItemLineValue,eta){
	 var soNum = soItemLineValue[0][0][0];//NUMBER
	 var soprice =soItemLineValue[0][1][0];//価格水準
	 var soDescription =soItemLineValue[0][2][0];//説明
	 var soCustpo =soItemLineValue[0][3][0];//CUST. PO#
	 var soCustcol1 =soItemLineValue[0][4][0];//PACKING DETAILS
	 var soQuantity =soItemLineValue[0][5][0];//数量
	 var soEta =soItemLineValue[0][6][0];//ETA
	 var soTaxcode =soItemLineValue[0][7][0];//税金コード	
	 var soPoEntity =soItemLineValue[0][8][0];//仕入先
	 var soRate =soItemLineValue[0][9][0];//単価
	 if(soEta == eta){
		 if(!isEmpty(soEta)){
			 soRecord.setCurrentLineItemValue('item', 'custcol_eta', soEta); //ETA
		 }
	 }else{
		 if(!isEmpty(soEta)){
			 var newEta = getNewDate(soEta);
			 if(!isEmpty(newEta)){
				 soRecord.setCurrentLineItemValue('item', 'custcol_eta', newEta); //ETA
			 }
		 }
	 }
	 if(!isEmpty(soprice)){
		 if(soprice == "Base Price"){
			 soRecord.setCurrentLineItemValue('item', 'price', "1"); //価格水準
		 }else if(soprice == "Alternate Price 1"){
			 soRecord.setCurrentLineItemValue('item', 'price', "2"); //価格水準
		 }else if(soprice == "Alternate Price 2"){
			 soRecord.setCurrentLineItemValue('item', 'price', "3"); //価格水準
		 }else if(soprice == "Alternative"){
			 soRecord.setCurrentLineItemValue('item', 'price', "4"); //価格水準
		 }else if(soprice == "External Customer"){
			 soRecord.setCurrentLineItemValue('item', 'price', "6"); //価格水準
		 }else if(soprice == "Internal Customer"){
			 soRecord.setCurrentLineItemValue('item', 'price', "7"); //価格水準
		 }
	 }
	 if(Number(soNum)>0){
		 soRecord.setCurrentLineItemValue('item', 'custcol_number', soNum); //NUMBER
	 }
	 
	 if(!isEmpty(soDescription)){
		 soRecord.setCurrentLineItemValue('item', 'description', soDescription); //説明
	 }
	 
	 if(!isEmpty(soCustpo)){
		 soRecord.setCurrentLineItemValue('item', 'custcol7', soCustpo); //CUST. PO#
	 }
	 
	 if(!isEmpty(soCustcol1)){
		 soRecord.setCurrentLineItemValue('item', 'custcol1', soCustcol1); //PACKING DETAILS
	 }
	 if(!isEmpty(soQuantity)){
		 soRecord.setCurrentLineItemValue('item', 'quantity', soQuantity); //数量
	 }
	 if(!isEmpty(soRate)){
		 soRecord.setCurrentLineItemValue('item', 'rate', soRate); //単価
	 }
	 if(!isEmpty(soPoEntity)){
		 var vendorSearch = nlapiSearchRecord("vendor",null,
					[
					   ["entityid","is",soPoEntity]
					], 
					[
					   new nlobjSearchColumn("internalid"),
					]
					);
		 if(!isEmpty(vendorSearch)){
			 soRecord.setCurrentLineItemValue('item', 'povendor',vendorSearch[0].getValue("internalid")); 
		 }
	 }
	 var salestaxitemSearch = nlapiSearchRecord("salestaxitem",null,
				[
				   ["name","is",soTaxcode]
				], 
				[
				   new nlobjSearchColumn("internalid",null,"GROUP")
				]
				);
	 if(!isEmpty(salestaxitemSearch)){
		 soRecord.setCurrentLineItemValue('item', 'taxcode',salestaxitemSearch[0].getValue("internalid",null,"GROUP")); // 税金コード
	 }else{
		 soRecord.setCurrentLineItemValue('item', 'taxcode', '18041');  // 税金コード
	 }
	 soRecord.commitLineItem('item');	
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

function getNewDate(date){
	try{
		if(!isEmpty(date) && date!= ''){
			var dateValue = nlapiStringToDate(date);
			var year = dateValue.getFullYear();
			var month = dateValue.getMonth();
			var date = dateValue.getDate();
			var newDate = new Date(year,month,date);
			var dateString = nlapiDateToString(newDate);
			return dateString;	
		}
	}catch(e){
		nlapiLogExecution("debug", "getNewDate ", e.message);
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

//特殊文字変換です
function specialString (str){
	var custName = str.indexOf("&");
	var specialText='';
	if(custName < 0 ){
		specialText = str;
	}else{
		var CustName1 = str.substring(0,custName);
		var CustName2 = str.substring(custName+1,str.length);
		specialText = CustName1 + "&amp;" + CustName2;
	}
	return specialText;
}
