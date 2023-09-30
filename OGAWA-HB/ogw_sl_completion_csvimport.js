/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       2023/04/10     CPC_宋
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */

var so_ogj_custform ="239";
var po_ogj_custform ='243';
var soCsvfile = '463';
var devpUrl='https://3701295.app.netsuite.com/';
function suitelet(request, response){
	if (request.getMethod() == 'POST') {
		run(request, response);
	}else{
		if (!isEmpty(request.getParameter('custparam_logform'))) {
			logForm(request, response,request.getParameter('custparam_logform'),request.getParameter('custparam_csvfileid'))
		}else{
			createForm(request, response);
		}
	}	 
}


function run(request, response){
	var xmlString = '注文書番号,注文日付,顧客,アイテム,CUST. PO#,注文数量,入荷済み数量,入荷待ち数量,販売単価,販売税金コード,ETA,発注書番号,購入単価,購入税金コード,仕入先,受領予定日,メモ\r\n';
	var ctx = nlapiGetContext();	
	var scheduleparams = new Array();
	var file=request.getFile('custpage_importfile'); //CSV File
	var parameter = new Array();
	if(!isEmpty(file)){
		file.setEncoding('SHIFT_JIS');
		file.setFolder(soCsvfile);
		var fileId = nlapiSubmitFile(file);
		scheduleparams['custscript_ogw_csv_file_id'] = fileId;	
		var resultR=nlapiCreateRecord('customrecord_ogw_csvimport_result');
		resultR.setFieldValue('custrecord_csvimport_name', '入荷完了品CSVインポート');
		resultR.setFieldValue('custrecord_ogw_csv_status', '1');
		resultR.setFieldValue('custrecord_ogw_old_file',fileId);
		var fileRecordId = nlapiSubmitRecord(resultR, false, true);
		scheduleparams['custscript_ogw_csv_filerecord_id'] = fileRecordId;
		runBatch('customscript_ogw_ss_completion_csvimport', 'customdeploy_ogw_ss_completion_csvimport', scheduleparams);
		parameter['custparam_logform'] = '1';
		parameter['custparam_csvfileid'] = fileRecordId;
	}else{
		var theCount = parseInt(request.getLineItemCount('list'));
		var soValue = '';
		for(var i = 0 ; i < theCount; i++){
			var chk = request.getLineItemValue('list', 'checkbox', i+1);//FLG
			var tranid = request.getLineItemValue('list', 'salesorder_no', i+1);//注文番号  
			var trandate = request.getLineItemValue('list', 'salesorder_date', i+1);//注文日付 
			var entity = request.getLineItemValue('list', 'salesorder_customer', i+1);//顧客 
			var item = request.getLineItemValue('list', 'salesorder_item', i+1);//アイテム
			var custcol7 = request.getLineItemValue('list', 'salesorder_custpo', i+1);//CUST. PO# 
			var quantity = request.getLineItemValue('list', 'salesorder_quantity', i+1);//注文数量		
			var quantitypicked = request.getLineItemValue('list', 'salesorder_received', i+1);//入荷済み数量 
			var entrywait = request.getLineItemValue('list', 'salesorder_entrywait', i+1);//入荷待ち数量	
			var soRate = request.getLineItemValue('list', 'salesorder_rate', i+1);//販売単価
			var taxcode = request.getLineItemValue('list', 'salesorder_tax', i+1);//税金コード 
			var eta = request.getLineItemValue('list', 'salesorder_eta', i+1);//ETA
			var poName = request.getLineItemValue('list', 'salesorder_poname', i+1);//発注書番号 
			var poRate = request.getLineItemValue('list', 'salesorder_porate', i+1);//購入単価
			var poTaxcod = request.getLineItemValue('list', 'salesorder_potax', i+1);//購入税金コード
			var poVendor = request.getLineItemValue('list', 'salesorder_povendor', i+1);//仕入先 
			var expectedreceiptdate = request.getLineItemValue('list', 'salesorder_reservationdate', i+1);//受領予定日 
			var description = request.getLineItemValue('list', 'salesorder_description', i+1);//メモ 
			if(chk == 'T'){
				xmlString+=tranid+',"'+trandate+'","'+entity+'","'+item+'","'+custcol7+'","'+quantity+'","'+quantitypicked+'","'+entrywait+'","'+
				soRate+'","'+taxcode+'",'+eta+',"'+poName+'","'+poRate+'","'+poTaxcod+'","'+poVendor+'","'+expectedreceiptdate+'","'+description+'"\r\n';
			}
		}
		var oldFieldName = "入荷完了品データ取込"
	    var nxlsFile = nlapiCreateFile(oldFieldName.split('.csv')[0]+'_'+RondomStr()+'_'+'results.csv', 'CSV', xmlString);
	    nxlsFile.setFolder(soCsvfile);
	    nxlsFile.setName(oldFieldName.split('.csv')[0]+'_'+RondomStr()+'_'+'results.csv');
	    nxlsFile.setEncoding('SHIFT_JIS');
	    var newFileID = nlapiSubmitFile(nxlsFile);
	    var resultR=nlapiCreateRecord('customrecord_ogw_csvimport_result');
		resultR.setFieldValue('custrecord_csvimport_name', '入荷完了品CSVインポート');
		resultR.setFieldValue('custrecord_ogw_csv_status', '1');
		resultR.setFieldValue('custrecord_ogw_old_file',newFileID);
		var fileRecordId = nlapiSubmitRecord(resultR, false, true);
		scheduleparams['custscript_ogw_csv_filerecord_id'] = fileRecordId;
		scheduleparams['custscript_ogw_csv_file_id'] = newFileID;	
		runBatch('customscript_ogw_ss_completion_csvimport', 'customdeploy_ogw_ss_completion_csvimport', scheduleparams);
		parameter['custparam_logform'] = '2';	
		parameter['custparam_csvfileid'] = fileRecordId;
	}
	nlapiSetRedirectURL('suitelet', ctx.getScriptId(), ctx.getDeploymentId(),null, parameter);
}

function logForm(request, response,logflag,csvfileid,recordid){
	var form = nlapiCreateForm('処理ステータス', false);
	form.setScript('customscript_ogw_cs_completion_csvimport');
	var csvStatusLabel = '';
	nlapiLogExecution("debug", "logflag", logflag);
	if(logflag == '1'){
		if(!isEmpty(csvfileid)){
			var csvRecord = nlapiLoadRecord('customrecord_ogw_csvimport_result', csvfileid);
			var csvStatus = csvRecord.getFieldText('custrecord_ogw_csv_status');
			csvStatusLabel = "CSVファイル" + "" + csvStatus;	
		}
	}
	// 実行情報
	form.addFieldGroup('custpage_run_info', '実行情報');
	form.addButton('custpage_refresh', '更新', 'refresh();');
	// バッチ状態
	var batchStatus = getStatus('customdeploy_ogw_ss_completion_csvimport');
	if (batchStatus == 'FAILED') {
		// 実行失敗の場合
		var runstatusField = form.addField('custpage_run_info_status', 'text','', null, 'custpage_run_info');
		runstatusField.setDisplayType('inline');
		var messageColour = '<font color="red"> バッチ処理を失敗しました </font>';
		runstatusField.setDefaultValue(messageColour+" "+csvStatusLabel);
		response.writePage(form);
	} else if (batchStatus == 'PENDING' || batchStatus == 'PROCESSING') {
		// 実行中の場合
		var runstatusField = form.addField('custpage_run_info_status', 'text','', null, 'custpage_run_info');
		runstatusField.setDisplayType('inline');
		runstatusField.setDefaultValue('バッチ処理を実行中'+" "+csvStatusLabel);
		response.writePage(form);
	}else{
		resultForm(csvfileid);	
	}
}


//画面作成
function createForm(request, response){
	//パラメータ取得
	var subsidiaryValue = request.getParameter('subsidiary');//子会社
	var salesorderValue = request.getParameter('salesorder');//注文書番号
	var purchaseorderValue = request.getParameter('purchaseorder');//発注書番号
	var customerValue = request.getParameter('customer');//顧客
	var itemValue = request.getParameter('item');//アイテム
	var vendorValue = request.getParameter('vendor');//仕入先
	var employeeValue = request.getParameter('employee');//従業員
	var soEtaValue = request.getParameter('eta');//eta
	var soDateValue = request.getParameter('date');//注文日付
	var soCreateDateValue = request.getParameter('createdate');//注文作成日
	var selectFlg = request.getParameter('selectFlg');
	var form = nlapiCreateForm('入荷完了品データ取込画面', false);
	form.setScript('customscript_ogw_cs_completion_csvimport');
	form.addFieldGroup('select_group', '検索');
	var subsidiaryField =form.addField('custpage_subsidiary', 'select', '子会社', 'subsidiary', 'select_group');
	subsidiaryField.setMandatory(true);
	if(selectFlg != 'T'){
		if(isEmpty(subsidiaryValue)){
			subsidiaryValue = 1;
		}
	}
	 
	var customerField = form.addField('custpage_customer', 'select', '顧客',null, 'select_group');
	var customerSearch  = getSearchResults("customer",null,
			[
			 	["subsidiary","anyof",subsidiaryValue],
			], 
			[
			   new nlobjSearchColumn("internalid"), 
			   new nlobjSearchColumn("altname"),
			   new nlobjSearchColumn("entityid"),
			]
			);	
	customerField.addSelectOption('','');
	for(var i = 0; i<customerSearch.length;i++){
		var customerText = '';
		var entityid = customerSearch[i].getValue('entityid');
		var altname = customerSearch[i].getValue('altname');
		if(!isEmpty(entityid)){
			customerText += entityid;
		}
		if(!isEmpty(altname)&& !isEmpty(customerText)){
			customerText += " " + altname;
		}
		customerField.addSelectOption(customerSearch[i].getValue("internalid"),customerText);
	}
	
	var soField = form.addField('custpage_salesorder', 'select', '注文書番号',null, 'select_group');	
	soField.addSelectOption('','');
	var oldTranidArr = new Array();
	var oldInternalidArr = new Array();
	var soSearch = getSearchResults('salesorder',null,
			
			[ 		
			 	 ["mainline","is","F"],
			 	 "AND",
			 	 ["subsidiary","anyof",subsidiaryValue],
			 	 "AND",
			 	 ["customform","anyof",so_ogj_custform],
			 	 "AND",
			 	["status","anyof","SalesOrd:B","SalesOrd:A","SalesOrd:D","SalesOrd:E"],
			],
			[
			   new nlobjSearchColumn("tranid"), 
			   new nlobjSearchColumn("internalid"),

			]
			);
	if(!isEmpty(soSearch)){
		for(var i = 0; i<soSearch.length;i++){
			oldTranidArr.push(soSearch[i].getValue("tranid"));//注文番号
			oldInternalidArr.push(soSearch[i].getValue("internalid"));//注文ID
		}
		var tranidArr = unique1(oldTranidArr);//注文書番号
		var internalidArr = unique1(oldInternalidArr);//注文ID
		for(var i = 0; i < tranidArr.length; i++){
			soField.addSelectOption(internalidArr[i],tranidArr[i]);
		}
	}
	
	var soDateField = form.addField('custpage_date', 'date', '注文日付',null, 'select_group');
	var soCreateDateField = form.addField('custpage_createdate', 'date', '注文作成日',null, 'select_group');

	var itemField =form.addField('custpage_item', 'select', 'アイテム',null, 'select_group');
	var searchItem = getSearchResults('item',null,
			["subsidiary","anyof",subsidiaryValue], 
			[
			   new nlobjSearchColumn("internalid"), 
			   new nlobjSearchColumn("itemid"),
			   new nlobjSearchColumn("displayname"),
			]
			);
	itemField.addSelectOption('', '');
	for(var i = 0; i<searchItem.length;i++){
		var itemText = '';
		var itemid = searchItem[i].getValue('itemid');
		var displayname = searchItem[i].getValue('displayname');
		if(!isEmpty(itemid)){
			itemText += itemid;
		}
		if(!isEmpty(displayname)&& !isEmpty(itemText)){
			itemText += " " + displayname;
		}
		itemField.addSelectOption(searchItem[i].getValue("internalid"),itemText);
	}
	
	var vendorField =form.addField('custpage_vendor', 'select', '仕入先',null, 'select_group');
	var searchVendor = getSearchResults('vendor',null,
				["subsidiary","anyof",subsidiaryValue], 
				[
				   new nlobjSearchColumn("entityid"), 
				   new nlobjSearchColumn("internalid"),
				   new nlobjSearchColumn("altname")
				]
				);
		vendorField.addSelectOption('', '');
		for(var i = 0; i<searchVendor.length;i++){
			var vendortxt='';
			var entityid = searchVendor[i].getValue('entityid');
			var altname = searchVendor[i].getValue('altname');
			if(!isEmpty(entityid)){
				vendortxt += entityid;
			}
			if(!isEmpty(altname)&& !isEmpty(vendortxt)){
				vendortxt += " " + altname;
			}
			vendorField.addSelectOption(searchVendor[i].getValue("internalid"),vendortxt);
		}

	var poField =form.addField('custpage_po', 'select', '発注書番号',null, 'select_group');
	poField.addSelectOption('', '');
	var poOldTranidArr = new Array();
	var poOldInternalidArr = new Array();
	var poSearch = getSearchResults('purchaseorder',null,		
			[ 		
			 	 ["mainline","is","F"],
			 	 "AND",
			 	 ["subsidiary","anyof",subsidiaryValue],
			 	 "AND",
			 	 ["customform","anyof",po_ogj_custform],
			 	 "AND",
			 	 ["createdfrom","noneof","@NONE@"]
			],
			[
			   new nlobjSearchColumn("tranid"), 
			   new nlobjSearchColumn("internalid"),
			]
			);
	if(!isEmpty(soSearch)){
		for(var i = 0; i<poSearch.length;i++){
			poOldTranidArr.push(poSearch[i].getValue("tranid"));//発注書番号
			poOldInternalidArr.push(poSearch[i].getValue("internalid"));
		}
		var poTranidArr = unique1(poOldTranidArr);//
		var poInternalidArr = unique1(poOldInternalidArr);//
		for(var i = 0; i < poTranidArr.length; i++){
			poField.addSelectOption(poInternalidArr[i],poTranidArr[i]);
		}
	}
	var soEtaField = form.addField('custpage_eta', 'date', 'ETA',null, 'select_group');
	var employeeField = form.addField('custpage_employee', 'select', '注文作成者','employee', 'select_group'); 
	if(selectFlg == 'T'){	
		soField.setDisplayType('inline');//注文書番号
		customerField.setDisplayType('inline');//顧客
		subsidiaryField.setDisplayType('inline');//子会社
		itemField.setDisplayType('inline');//アイテム
		employeeField.setDisplayType('inline');//注文作成者
		vendorField.setDisplayType('inline');//仕入先
		poField.setDisplayType('inline');//発注書番号
		soEtaField.setDisplayType('inline'); //ETA
		soDateField.setDisplayType('inline'); //注文日付
		soCreateDateField.setDisplayType('inline'); //注文作成日
		var fileField=form.addField('custpage_importfile', 'file', 'CSVファイルのアップロード');
		fileField.setLayoutType('outsideabove', 'startcol');
		var csvRecordId=request.getParameter('selectLine');
		var csvString = '';
		var selectLineArray=new Array();
		if(!isEmpty(csvRecordId)){
			var csvRecord=nlapiLoadRecord('customrecord_ogw_csv_download', csvRecordId);
			var csvRecordCon = csvRecord.getLineItemCount('recmachcustrecord_ogw_csv_download_list');
			for(var i=1;i<csvRecordCon+1;i++){
				csvRecord.selectLineItem('recmachcustrecord_ogw_csv_download_list', i);
				var jsonText = csvRecord.getCurrentLineItemValue('recmachcustrecord_ogw_csv_download_list', 'custrecord_ogw_json_text');
				var jsonTex2 = csvRecord.getCurrentLineItemValue('recmachcustrecord_ogw_csv_download_list', 'custrecord_ogw_json_text2');
				var jsonTex3 = csvRecord.getCurrentLineItemValue('recmachcustrecord_ogw_csv_download_list', 'custrecord_ogw_json_text3');
				var jsonTex4 = csvRecord.getCurrentLineItemValue('recmachcustrecord_ogw_csv_download_list', 'custrecord_ogw_json_text4');
				var jsonTex5 = csvRecord.getCurrentLineItemValue('recmachcustrecord_ogw_csv_download_list', 'custrecord_ogw_json_text5');
				var jsonTex6 = csvRecord.getCurrentLineItemValue('recmachcustrecord_ogw_csv_download_list', 'custrecord_ogw_json_text6');
				csvString+=jsonText+jsonTex2+jsonTex3+jsonTex4+jsonTex5+jsonTex6;
				if(!isEmpty(csvString)){
					selectLineArray=csvString.split("*");
				}
			}
		}	
	}
	
	subsidiaryField.setDefaultValue(subsidiaryValue);//子会社
	soField.setDefaultValue(salesorderValue);//注文書番号
	customerField.setDefaultValue(customerValue);//顧客
	itemField.setDefaultValue(itemValue);//アイテム
	vendorField.setDefaultValue(vendorValue);//仕入先
	poField.setDefaultValue(purchaseorderValue);//発注書番号
	employeeField.setDefaultValue(employeeValue);//注文作成者
	soEtaField.setDefaultValue(soEtaValue);//ETA
	soDateField.setDefaultValue(soDateValue);//注文日付
	soCreateDateField.setDefaultValue(soCreateDateValue);//注文作成日
	
	if(selectFlg == 'T'){
		var filit = new Array();
		filit.push(["type","anyof","SalesOrd"]);
//		//明細行
		filit.push("AND");
		filit.push(["mainline","is","F"]);
		//無効以外
		filit.push("AND");
		filit.push(["voided","is","F"]);
		//税金ライン外す
		filit.push("AND");
		filit.push(["taxline","is","F"]);
		//OGJ
		filit.push("AND");
		filit.push(["customform","anyof",so_ogj_custform]);
		//STATUS
		filit.push("AND");
		filit.push(["status","anyof","SalesOrd:B","SalesOrd:A","SalesOrd:D","SalesOrd:E"]);
		//子会社
		if(!isEmpty(subsidiaryValue)){
			filit.push("AND");
			filit.push(["subsidiary","anyof",subsidiaryValue]);
		}
		//注文書番号
		if(!isEmpty(salesorderValue)){
			filit.push("AND");
			filit.push(["internalid","anyof",salesorderValue]);
		}
		//顧客
		if(!isEmpty(customerValue)){
			filit.push("AND");
			filit.push(["entity","anyof",customerValue]);
		}
		//アイテム
		if(!isEmpty(itemValue)){
			filit.push("AND");
			filit.push(["item","anyof",itemValue]);
		}
		//仕入先
		if(!isEmpty(vendorValue)){
			filit.push("AND");
			filit.push(["purchaseorder.name","anyof",vendorValue]);
		}
		//発注書番号
		if(!isEmpty(purchaseorderValue)){
			filit.push("AND");
			filit.push(["purchaseorder","anyof",purchaseorderValue]);
		}
		//注文作成者
		if(!isEmpty(employeeValue)){
			filit.push("AND");
			filit.push(["createdby","anyof",employeeValue]);
		}
		//ETA
		if(!isEmpty(soEtaValue)){
			filit.push("AND");
			filit.push(["custcol_eta","on",soEtaValue]);
		}
		//日付
		if(!isEmpty(soDateValue)){
			filit.push("AND");
			filit.push(["trandate","on",soDateValue]);
		}
		//注文作成日
		if(!isEmpty(soCreateDateValue)){
			filit.push("AND");
			filit.push(["datecreated","on",soCreateDateValue]);
		}
		var salesorderSearch = getSearchResults("salesorder",null,
				filit, 
				[
				   new nlobjSearchColumn("internalid"), //内部id
				   new nlobjSearchColumn("tranid"), //注文番号
				   new nlobjSearchColumn("trandate"),//日付
				   new nlobjSearchColumn("entity"),// 顧客
				   new nlobjSearchColumn("item"), //アイテム
				   new nlobjSearchColumn("custcol7"),//CUST. PO# 
				   new nlobjSearchColumn("taxcode"), //税金コード
				   new nlobjSearchColumn("custcol_eta"), //ETA
				   new nlobjSearchColumn("tranid","purchaseOrder",null), //po番号
				   new nlobjSearchColumn("internalid","purchaseOrder",null), //poID
				   new nlobjSearchColumn("expectedreceiptdate"),//受領予定日 
				   new nlobjSearchColumn("memo"), //メモ 
				   new nlobjSearchColumn("line"), //line 
				   new nlobjSearchColumn("quantity"), //注文数量 
				   new nlobjSearchColumn("quantitypicked"),//入荷済み数量 
				   new nlobjSearchColumn("fxrate"),//販売単価
				   new nlobjSearchColumn("fxrate","purchaseOrder",null),//購入単価   
				   new nlobjSearchColumn("taxcode","purchaseOrder",null),//購入税金コード - 0509
				   new nlobjSearchColumn("internalid","item",null), //アイテムID
				   new nlobjSearchColumn("internalid","customer",null)//顧客 : 内部ID
				]
				);
		var purchaseorderSearch = getSearchResults("purchaseorder",null,
				[
				   ["type","anyof","PurchOrd"], 
				   "AND", 
				   ["customform","anyof",po_ogj_custform],
				   "AND",
				   ["createdfrom","noneof","@NONE@"],
				], 
				[
				   new nlobjSearchColumn("entity"), 
				   new nlobjSearchColumn("tranid"),
				   new nlobjSearchColumn("internalid"), 
				   new nlobjSearchColumn("rate","taxItem",null)//購入税率
				]
				);
		var poArr = new Array();
		if(!isEmpty(purchaseorderSearch)){
			for(var i = 0 ; i < purchaseorderSearch.length ;i++){
				poArr.push(purchaseorderSearch[i].getValue("tranid"));	
			}
		}

		var subList = form.addSubList('list', 'list', 'list');
		subList.addMarkAllButtons();
		subList.addField('checkbox', 'checkbox', '選択');
		var linkField=subList.addField('linkurl', 'url', '表示');
		linkField.setLinkText('表示');
		subList.addField('salesorder_no', 'text', '注文書番号');
		subList.addField('salesorder_soid', 'text', '注文書ID').setDisplayType('hidden');
		subList.addField('salesorder_date', 'date', '注文日付').setDisplayType('entry'); 
		subList.addField('salesorder_customer', 'text', '顧客');
		subList.addField('salesorder_customerid', 'text', '顧客ID').setDisplayType('hidden');
		subList.addField('salesorder_item', 'text', 'アイテム');
		subList.addField('salesorder_itemid', 'text', 'アイテムID').setDisplayType('hidden');
		subList.addField('salesorder_line', 'text', 'line').setDisplayType('hidden');
		subList.addField('salesorder_custpo', 'text', 'CUST. PO#').setDisplayType('entry');
		subList.addField('salesorder_quantity', 'text', '注文数量');
		subList.addField('salesorder_received', 'text', '入荷済み数量');
		subList.addField('salesorder_entrywait', 'float', '入荷待ち数量').setDisplayType('entry'); 
		subList.addField('salesorder_rate', 'text', '販売単価').setDisplayType('entry');
		subList.addField('salesorder_tax', 'text', '販売税金コード');
		subList.addField('salesorder_eta', 'date', 'ETA').setDisplayType('entry');
		subList.addField('salesorder_poname', 'text', '発注書番号');
		subList.addField('salesorder_porate', 'text', '購入単価').setDisplayType('entry');
		subList.addField('salesorder_potax', 'text', '購入税金コード');
		subList.addField('salesorder_poid', 'text', '発注書Id').setDisplayType('hidden');
		subList.addField('salesorder_povendor', 'text', '仕入先');
		subList.addField('salesorder_reservationdate', 'text', '受領予定日');
		subList.addField('salesorder_description', 'text', 'メモ'); 
		var xmlString = '注文書番号,注文日付,顧客,アイテム,CUST. PO#,注文数量,入荷済み数量,入荷待ち数量,販売単価,販売税金コード,ETA,発注書番号,購入単価,購入税金コード,仕入先,受領予定日,メモ\r\n';
		var consAdd = '';
		var custbody2 = '';
		var countText = 0;
		if(!isEmpty(salesorderSearch)){
			var lineCount = 1;
			for(var i = 0 ; i < salesorderSearch.length ;i++){
				var tranid = salesorderSearch[i].getValue("tranid");//注文番号
				var trandate = salesorderSearch[i].getValue("trandate");//日付
				var entity = salesorderSearch[i].getText("entity");//顧客
				var entityId = salesorderSearch[i].getValue("internalid","customer",null);//顧客ID
				var item = salesorderSearch[i].getText("item");//アイテム
				var itemId = salesorderSearch[i].getValue("internalid","item",null);//アイテムID
				var custcol7 = salesorderSearch[i].getValue("custcol7");//CUST. PO# 
				var taxcode = salesorderSearch[i].getText("taxcode");//税金コード
				var eta = salesorderSearch[i].getValue("custcol_eta");//ETA
				var poName = salesorderSearch[i].getValue("tranid","purchaseOrder",null);//PO番号
				var poId = salesorderSearch[i].getValue("internalid","purchaseOrder",null);//POID
				var rate = defaultEmpty(parseFloat(salesorderSearch[i].getValue("fxrate")));//販売単価
				var soInternalid = salesorderSearch[i].getValue("internalid");//注文ID
				poArr_index = poArr.indexOf(poName);
				if(poArr_index < 0){
					var poVendor = '';
				}else{
					var poVendor = purchaseorderSearch[poArr_index].getText("entity"); //仕入先
				}
				var line = salesorderSearch[i].getValue("line");//line
				var poTaxcode = salesorderSearch[i].getText("taxcode","purchaseOrder",null);//購入税金コード
				var poRate = defaultEmpty(parseFloat(salesorderSearch[i].getValue("fxrate","purchaseOrder",null)));//購入単価
				var expectedreceiptdate = salesorderSearch[i].getValue("expectedreceiptdate");//受領予定日 
				var description = salesorderSearch[i].getValue("memo");//メモ
				var quantity = defaultEmpty(parseFloat(salesorderSearch[i].getValue("quantity")));//注文数量 
				var quantitypicked = defaultEmpty(parseFloat(salesorderSearch[i].getValue("quantitypicked")));//入荷済み数量 
				var entrywait = Number(quantity-quantitypicked);//入荷待ち数量
				
				if(entrywait != 0){
					var theLink = nlapiResolveURL('RECORD', 'salesorder',soInternalid ,'VIEW');
					subList.setLineItemValue('linkurl',lineCount, theLink);//表示
					subList.setLineItemValue('salesorder_no', lineCount, tranid);//注文番号  
					subList.setLineItemValue('salesorder_soid', lineCount, soInternalid);//注文ID
					subList.setLineItemValue('salesorder_date', lineCount, trandate);//注文日付
					subList.setLineItemValue('salesorder_customer', lineCount, entity);//顧客
					subList.setLineItemValue('salesorder_customerid', lineCount, entityId);//顧客ID
					subList.setLineItemValue('salesorder_item', lineCount, item);//アイテム
					subList.setLineItemValue('salesorder_itemid', lineCount, itemId);//アイテムID
					subList.setLineItemValue('salesorder_line', lineCount, line);//line ID
					subList.setLineItemValue('salesorder_custpo', lineCount, custcol7);//CUST. PO# 
					subList.setLineItemValue('salesorder_rate', lineCount, rate);//販売単価
					subList.setLineItemValue('salesorder_potax', lineCount, poTaxcode);//購入税金コード
					subList.setLineItemValue('salesorder_tax', lineCount, taxcode);//税金コード
					subList.setLineItemValue('salesorder_eta', lineCount, eta);//ETA
					subList.setLineItemValue('salesorder_poname', lineCount, poName);//PO番号
					subList.setLineItemValue('salesorder_porate', lineCount, poRate);//購入単価
					subList.setLineItemValue('salesorder_poname', lineCount, poName);//PO番号
					subList.setLineItemValue('salesorder_poid', lineCount, poId);//poId
					subList.setLineItemValue('salesorder_povendor', lineCount, poVendor);//仕入先
					subList.setLineItemValue('salesorder_reservationdate', lineCount, expectedreceiptdate);//受領予定日 
					subList.setLineItemValue('salesorder_description', lineCount, description);//メモ
					subList.setLineItemValue('salesorder_quantity', lineCount, quantity);//注文数量
					subList.setLineItemValue('salesorder_received', lineCount, quantitypicked);//入荷済み数量 
					subList.setLineItemValue('salesorder_entrywait', lineCount, entrywait);//入荷待ち数量
					var csvValue=soInternalid+'|'+entityId+'|'+trandate+'|'+itemId+'|'+line;
					if(selectLineArray.indexOf(csvValue) > -1){
						xmlString+=tranid+',"'+trandate+'","'+entity+'","'+item+'","'+custcol7+'","'+quantity+'","'+quantitypicked+'","'+entrywait+'","'+rate+'","'+taxcode+'",'+eta+',"'+poName+'","'+
						poRate+'","'+poTaxcode+'","'+poVendor+'","'+expectedreceiptdate+'","'+description+'"\r\n';
					}
					lineCount++;
					countText++;
				}
			}
		}
	subList.setLabel('入荷待ち詳細:'+countText+'件')
	form.addButton('csvdownload', 'CSVテンプレートのダウンロード', 'csvDownload();');
	form.addButton('btn_return', '検索戻す','searchReturn()')
	form.addSubmitButton('実行');
	}else{
		form.addButton('btn_search', '検索', 'search()')
	}
	
	if(request.getParameter('downloadFlag')=='T'){
		var url=csvDown(xmlString);
		response.write(url);
	}else{
		response.writePage(form);
	}
}


function resultForm(csvfileid){  
	if(!isEmpty(csvfileid)){
		var csvfileRecord = nlapiLoadRecord('customrecord_ogw_csvimport_result', csvfileid);//CSVインポート結果
		var resultsCsv = csvfileRecord.getFieldValue('custrecord_ogw_csvimport_results');//CSVID
		if(!isEmpty(resultsCsv)){
			var file = nlapiLoadFile(resultsCsv); // CSVファイル
			var fileArr = file.getValue().split('\r\n');
			
			var form = nlapiCreateForm('入荷完了品データ取込画面結果', false);
			var subList = form.addSubList('list', 'list', '入荷待ち結果一覧');
			subList.addMarkAllButtons();
			var theLink = nlapiResolveURL('SUITELET', 'customscript_ogw_sl_completion_csvimport', 'customdeploy_ogw_sl_completion_csvimport');
			var backbtns = "window.location.href='"+devpUrl+theLink+"&whence='";
			form.addButton('custpage_refresh', '戻る', backbtns);
			subList.addField('csv_error', 'textarea', 'エラー');
			var csvLink=subList.addField('csv_link', 'url', '表示');
			csvLink.setLinkText('表示');
			subList.addField('csv_sonum', 'text', '注文書番号');
			subList.addField('csv_date', 'text', '注文日付');
			subList.addField('csv_entity', 'text', '顧客');
			subList.addField('csv_itme', 'text', 'アイテム');
			subList.addField('csv_custpo', 'text', 'CUST. PO#');
			subList.addField('csv_soquantity', 'text', '注文数量');
			subList.addField('csv_quantitypicked', 'text', '入荷済み数量');
			subList.addField('csv_quantity', 'text', '入荷待ち数量');
			subList.addField('csv_sorate', 'text', '販売単価');
			subList.addField('csv_tax', 'text', '販売税金コード');
			subList.addField('csv_eta', 'text', 'ETA');
			subList.addField('csv_ponum', 'text', '発注書番号');
			subList.addField('csv_porate', 'text', '購入単価');
			subList.addField('csv_potax', 'text', '購入税金コード');
			subList.addField('csv_poentity', 'text', '仕入先');
			subList.addField('csv_mode', 'text', '受領予定日');
			subList.addField('csv_memo', 'text', 'メモ');
			var cont = 1;
			var soSearch = getSearchResults("salesorder",null,
					[
					   ["type","anyof","SalesOrd"], 
					   "AND", 
					   ["customform","anyof",so_ogj_custform],
					], 
					[
					   new nlobjSearchColumn("tranid"), 
					   new nlobjSearchColumn("internalid"),
					]
					);
			var soArr = new Array();
			if(!isEmpty(soSearch)){
				for(var i = 0 ; i < soSearch.length ;i++){
					soArr.push(soSearch[i].getValue("tranid"));	
				}
			}
			for(var i = 1 ; i  < fileArr.length ; i++){
				if(!isEmpty(fileArr[i])){
					 var fileLine = csvDataToArray(fileArr[i].toString());
					 var csv_error=fileLine[0];// エラー
					 var csv_sonum=defaultEmpty(fileLine[1]);// 注文書番号
					 var csv_date=defaultEmpty(fileLine[2]);// 注文日付
					 var csv_entity=defaultEmpty(fileLine[3]);// 顧客
					 var csv_itme=defaultEmpty(fileLine[4]);// アイテム
					 var csv_custpo=defaultEmpty(fileLine[5]);// CUST. PO#
					 var csv_soquantity=defaultEmpty(fileLine[6]);// 注文数量
					 var csv_quantitypicked=defaultEmpty(fileLine[7]);// 入荷済み数量
					 var csv_quantity=defaultEmpty(fileLine[8]);// 入荷待ち数量
					 var csv_sorate=defaultEmpty(fileLine[9]);// 販売単価
					 var csv_tax=defaultEmpty(fileLine[10]);// 販売税金コード
					 var csv_eta=defaultEmpty(fileLine[11]);// ETA
					 var csv_poname=defaultEmpty(fileLine[12]);//発注書番号
					 var csv_porate=defaultEmpty(fileLine[13]);//購入単価
					 var csv_potax=defaultEmpty(fileLine[14]);//購入税金コード
					 var csv_poEntity=defaultEmpty(fileLine[15]);// 仕入先
					 var csv_mode=defaultEmpty(fileLine[16]);// 受領予定日
					 var csv_memo=defaultEmpty(fileLine[17]);// メモ
					 
					 var soArr_index = soArr.indexOf(csv_sonum);
					 if(soArr_index >= 0){
						var soId = soSearch[soArr_index].getValue("internalid"); //ID 
						if(!isEmpty(soId)){
							var csvTheLink = nlapiResolveURL('RECORD', 'salesorder',soId ,'VIEW');
							subList.setLineItemValue('csv_link',cont, csvTheLink);
						}
					 }
					 subList.setLineItemValue('csv_error', cont, csv_error);// エラー
					 subList.setLineItemValue('csv_sonum', cont, csv_sonum);// 注文書番号
					 subList.setLineItemValue('csv_date', cont, csv_date);//  注文日付
					 subList.setLineItemValue('csv_entity', cont, csv_entity);	// 顧客
					 subList.setLineItemValue('csv_itme', cont, csv_itme);// アイテム
					 subList.setLineItemValue('csv_custpo', cont, csv_custpo);// CUST. PO#
					 subList.setLineItemValue('csv_soquantity', cont, csv_soquantity);// 注文数量
					 subList.setLineItemValue('csv_quantitypicked', cont, csv_quantitypicked);// 入荷済み数量
					 subList.setLineItemValue('csv_quantity', cont, csv_quantity);//入荷待ち数量
					 subList.setLineItemValue('csv_sorate', cont, csv_sorate);//販売単価
					 subList.setLineItemValue('csv_tax', cont, csv_tax);// TAX
					 subList.setLineItemValue('csv_eta', cont, csv_eta);//ETA
					 subList.setLineItemValue('csv_ponum', cont, csv_poname);// 発注書番号
					 subList.setLineItemValue('csv_porate', cont, csv_porate);// 購入単価
					 subList.setLineItemValue('csv_potax', cont, csv_potax);//購入税金コード
					 subList.setLineItemValue('csv_poentity', cont, csv_poEntity);// 仕入先
					 subList.setLineItemValue('csv_mode', cont, csv_mode);// 受領予定日
					 subList.setLineItemValue('csv_memo', cont, csv_memo);// メモ
					 cont++;
				}
			}	
			response.writePage(form);
		}
	}
}


function csvDown(xmlString){
	try{
	
		var xlsFile = nlapiCreateFile('注文書' + '_' + getFormatYmdHms() + '.csv', 'CSV', xmlString);
		
		xlsFile.setFolder(soCsvfile);
		xlsFile.setName('注文書' + '_' + getFormatYmdHms() + '.csv');
		xlsFile.setEncoding('SHIFT_JIS');
	    
		// save file
		var fileID = nlapiSubmitFile(xlsFile);
		var fl = nlapiLoadFile(fileID);
		var url= fl.getURL();
		return url; 
	}
	catch(e){
		nlapiLogExecution('DEBUG', '', e.message)
	}
}

/**
 * システム時間の取得メソッド
 */
function getSystemTime() {

	// システム時間
	var now = new Date();
	var offSet = now.getTimezoneOffset();
	var offsetHours = 9 + (offSet / 60);
	now.setHours(now.getHours() + offsetHours);

	return now;
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
 * バッチ処理
 */
function runBatch(customscript, customdeploy, scheduleparams) {	
	try {
		var sleeptime = 10000;
		var status_jo;
		do {
			var status_jo = nlapiScheduleScript(customscript, customdeploy,
					scheduleparams);
			// バッチを呼び出し
			if (status_jo != 'QUEUED') {
				sleep(10000);
				sleeptime += 10000;
			}
			if (sleeptime >= 250000) {
				nlapiLogExecution('debug', '実行時間が超過しました');
				return;
			}
		} while (status_jo != 'QUEUED');		
	} catch (e) {
		nlapiLogExecution('debug', 'プロジェクト同期処理異常:', e);
	}
}

/**
 * sleep
 */
function sleep(waitMsec) {
    var startMsec = new Date();

    while (new Date() - startMsec < waitMsec);
}

/**
 * 定期バッチの実行ステータスを取得する
 * 
 * @param deploymentId
 * @returns {String}
 */
function getStatus(deploymentId) {

	var filters = new Array();
	filters.push(new nlobjSearchFilter('datecreated', null, 'onOrAfter',
			getScheduledScriptDate()));
	filters.push(new nlobjSearchFilter('scriptid', 'scriptdeployment', 'is',
			deploymentId));

	var columns = new Array();
	columns.push(new nlobjSearchColumn('datecreated', null, 'max')
			.setWhenOrderedBy('datecreated', null).setSort(true));
	columns.push(new nlobjSearchColumn('status', null, 'group'));

	var scheduledStatusList = nlapiSearchRecord('scheduledscriptinstance',
			null, filters, columns);
	var status = '';
	if (scheduledStatusList != null && scheduledStatusList.length > 0) {
		status = scheduledStatusList[0].getValue('status', null, 'group')
				.toUpperCase();
	}

	return status;
}

/**
 * バッチ実行日付を取得する
 * 
 * @returns
 */
function getScheduledScriptDate() {
	var now = getSystemTime();
	now.setHours(0, 0, 0, 0);
	return now;
}

function getFormatYmdHms() {

    // システム時間
    var now = getSystemTime();

    var str = now.getFullYear().toString();
    str += (now.getMonth() + 1).toString();
    str += now.getDate() + "_";
    str += now.getHours();
    str += now.getMinutes();
    str += now.getMilliseconds();

    return str;
}

function meaning (str){
	var meaningString = str.replace(/\r/g,"=").replace(/。/g,"=");
	return  meaningString;
}


function unique1(arr){
	  var hash=[];
	  for (var i = 0; i < arr.length; i++) {
	     if(hash.indexOf(arr[i])==-1){
	      hash.push(arr[i]);
	     }
	  }
	  return hash;
}

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
	   
	 //文字列置換
	   function replace(text)
	   {
	   if ( typeof(text)!= "string" )
	      text = text.toString() ;

	   text = text.replace(/,/g, "_") ;

	   return text ;
	   }
	   return (arrData[0]);
}

function defaultEmpty(src){
	return src || " ";
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