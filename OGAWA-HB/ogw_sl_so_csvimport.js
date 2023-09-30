/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       2023/03/03     CPC_宋
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
var devpUrl='https://3701295.app.netsuite.com';
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
	var ctx = nlapiGetContext();	
	var scheduleparams = new Array();
	var file=request.getFile('custpage_importfile'); //CSV File
	var csvType=request.getParameter('custpage_sotype'); //Csv type
	var csvCustForm = request.getParameter('custpage_custform'); //カスタム・フォーム
	var parameter = new Array();
       //custpage_employee
	var user = request.getParameter('custpage_employee'); //Csv type
	if(!isEmpty(file)){
		file.setEncoding('SHIFT_JIS');
		file.setFolder(soCsvfile);
		var fileId = nlapiSubmitFile(file);
		scheduleparams['custscript_ogw_import_file'] = fileId;	
		var resultR=nlapiCreateRecord('customrecord_ogw_csvimport_result');
		resultR.setFieldValue('custrecord_csvimport_name', '注文書CSVインポート');
		resultR.setFieldValue('custrecord_ogw_csv_status', '1');
		resultR.setFieldValue('custrecord_ogw_old_file',fileId);
		var fileRecordId = nlapiSubmitRecord(resultR, false, true);
		scheduleparams['custscript_ogw_import_filerecord_id'] = fileRecordId;
		scheduleparams['custscript_ogw_csv_type'] = csvType;
		scheduleparams['custscript_ogw_csv_user'] = user;
		scheduleparams['custscript_ogw_csv_custform'] = csvCustForm;
		runBatch('customscript_ogw_ss_so_csvimport', 'customdeploy_ogw_ss_so_csvimport', scheduleparams);
		parameter['custparam_logform'] = '1';
		parameter['custparam_csvfileid'] = fileRecordId;
	}else{
		nlapiLogExecution("debug", "test");
		parameter['custparam_logform'] = '2';		
	}
	nlapiSetRedirectURL('suitelet', ctx.getScriptId(), ctx.getDeploymentId(),null, parameter);
}

function logForm(request, response,logflag,csvfileid){
	var form = nlapiCreateForm('処理ステータス', false);
	form.setScript('customscript_ogw_cs_so_csvimport');
	if(!isEmpty(csvfileid)){
		var csvRecord = nlapiLoadRecord('customrecord_ogw_csvimport_result', csvfileid)
		var csvStatus = csvRecord.getFieldText('custrecord_ogw_csv_status');
		var csvStatusLabel = "CSVファイル" + "" + csvStatus;
		
	}
	// 実行情報
	form.addFieldGroup('custpage_run_info', '実行情報');
	if(logflag == '1'){
		form.addButton('custpage_refresh', '更新', 'refresh();');
		// バッチ状態
		var batchStatus = getStatus('customdeploy_ogw_ss_so_csvimport');
		if (batchStatus == 'FAILED') {
			// 実行失敗の場合
			var runstatusField = form.addField('custpage_run_info_status', 'text','', null, 'custpage_run_info');
			runstatusField.setDisplayType('inline');
			var messageColour = '<font color="red"> バッチ処理を失敗しました </font>';
			runstatusField.setDefaultValue(messageColour+"、"+csvStatusLabel);
			response.writePage(form);
		} else if (batchStatus == 'PENDING' || batchStatus == 'PROCESSING') {

			// 実行中の場合
			var runstatusField = form.addField('custpage_run_info_status', 'text',
					'', null, 'custpage_run_info');
			runstatusField.setDisplayType('inline');
			runstatusField.setDefaultValue('バッチ処理を実行中'+"、"+csvStatusLabel);
			response.writePage(form);
		}else{
			resultForm(csvfileid);
		}
	}else if(logflag == '2'){
		var runstatusField = form.addField('custpage_run_info_status', 'text',
				'', null, 'custpage_run_info');
		runstatusField.setDisplayType('inline');
		var messageColour = '<font color="red"> CSVファイルをアップロードしていません</font>';
		runstatusField.setDefaultValue(messageColour);
		var theLink = nlapiResolveURL('SUITELET', 'customscript_ogw_sl_so_csvimport', 'customdeploy_ogw_sl_so_csvimport');
		var backbtns = "window.location.href='"+devpUrl+theLink+"&whence='";
		form.addButton('backbtns', '検索画面に戻る', backbtns);
		response.writePage(form);
	}
}


//画面作成
function createForm(request, response){
	//パラメータ取得
	var subsidiaryValue = request.getParameter('subsidiary');//子会社
	var custformValue = request.getParameter('custform');//カスタム・フォーム
	var salesorderValue = request.getParameter('salesorder');//注文書番号
	var purchaseorderValue = request.getParameter('purchaseorder');//発注書番号
	var customerValue = request.getParameter('customer');//顧客
	var itemValue = request.getParameter('item');//アイテム
	var vendorValue = request.getParameter('vendor');//仕入先
	var employeeValue = request.getParameter('employee');//従業員
	var selectFlg = request.getParameter('selectFlg');
	
	var form = nlapiCreateForm('注文書CSV Import画面', false);
	form.setScript('customscript_ogw_cs_so_csvimport');
	 
	if(selectFlg == 'T'){
		form.addFieldGroup('select_csvtype', 'CSV Import種類');
		var soTypeField = form.addField('custpage_sotype', 'select', 'CSV Import種類',null,'select_csvtype');	
		soTypeField.addSelectOption('create','新規');
		soTypeField.addSelectOption('edit','更新');
		if(custformValue == 239){
			soTypeField.addSelectOption('cancel','キャンセル');
		}
	}
	
	form.addFieldGroup('select_group', '検索');
	var subsidiaryField =form.addField('custpage_subsidiary', 'select', '子会社', 'subsidiary', 'select_group');
	subsidiaryField.setMandatory(true);
	if(selectFlg != 'T'){
		if(isEmpty(subsidiaryValue)){
			subsidiaryValue = 1;
		}
	}
	var custformField = form.addField('custpage_custform', 'select', 'カスタム・フォーム ',null, 'select_group');
	custformField.setMandatory(true);
	if(selectFlg != 'T'){
		if(isEmpty(custformValue)){
			custformValue = 239;
		}
	}
	custformField.addSelectOption('239','OGJ Sales Order');
	custformField.addSelectOption('118','OGS Sales Order');
	
	var employeeField = form.addField('custpage_employee', 'select', '従業員','employee', 'select_group').setDisplayType('hidden'); 
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
			 	 ["customform","anyof",custformValue],
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
	
		
	if(selectFlg == 'T'){	
		soField.setDisplayType('inline');
		customerField.setDisplayType('inline');
		subsidiaryField.setDisplayType('inline');
		custformField.setDisplayType('inline');
		itemField.setDisplayType('inline');
		employeeField.setDisplayType('inline');
		vendorField.setDisplayType('inline');
		poField.setDisplayType('inline');
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
	
	subsidiaryField.setDefaultValue(subsidiaryValue);
	soField.setDefaultValue(salesorderValue);
	customerField.setDefaultValue(customerValue);
	itemField.setDefaultValue(itemValue);
	vendorField.setDefaultValue(vendorValue);
	poField.setDefaultValue(purchaseorderValue);
	var nowUser = nlapiGetUser();
	employeeField.setDefaultValue(nowUser);
	custformField.setDefaultValue(custformValue);
	
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
		if(!isEmpty(custformValue)){
			filit.push("AND");
			filit.push(["customform","anyof",custformValue]);
		}
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
			filit.push(["vendor","anyof",vendorValue]);
		}
		//発注書番号
		if(!isEmpty(purchaseorderValue)){
			filit.push("AND");
			filit.push(["purchaseorder","anyof",purchaseorderValue]);
		}
		var salesorderSearch = getSearchResults("salesorder",null,
				filit, 
				[
				   new nlobjSearchColumn("internalid"), //内部id
				   new nlobjSearchColumn("tranid"), //注文番号
				   new nlobjSearchColumn("entity"),// 顧客
				   new nlobjSearchColumn("trandate"),//日付
				   new nlobjSearchColumn("item"), //アイテム
				   new nlobjSearchColumn("memo"), //説明
				   new nlobjSearchColumn("custcol_number"), //Number
				   new nlobjSearchColumn("custcol7"), //Cust. PO#
				   new nlobjSearchColumn("custcol1"), //PACKING DETAILS
				   new nlobjSearchColumn("quantity"), //数量
				   new nlobjSearchColumn("fxrate"), //単価
				   new nlobjSearchColumn("custcol_eta"), //ETA
				   new nlobjSearchColumn("taxcode"), //税金コード
				   new nlobjSearchColumn("custbody1"), //CONSIGNEE
				   new nlobjSearchColumn("custbody_cons_add"), //CONSIGNEE ADDRESS
				   new nlobjSearchColumn("custbody2"), //SHIPPING MARK
				   new nlobjSearchColumn("custbody3"), //SHIPPING MODE
				   new nlobjSearchColumn("custbody_me_incoterms"), //INCOTERMS 
				   new nlobjSearchColumn("tranid","purchaseOrder",null), //po番号
				   new nlobjSearchColumn("pricelevel"),//価格水準
				   new nlobjSearchColumn("message"),//顧客へのメッセージ
				   new nlobjSearchColumn("custbody_ogw_purchasecontract_select"),//購入契約書
				   new nlobjSearchColumn("internalid","item",null), //アイテムID
				   new nlobjSearchColumn("internalid","customer",null),//顧客 : 内部ID
				   new nlobjSearchColumn("currency"), //通貨
				   new nlobjSearchColumn("line"), //line 
				]
				);
		
		var purchaseorderSearch = getSearchResults("purchaseorder",null,
				[
				   ["type","anyof","PurchOrd"], 
				   "AND", 
				   ["customform","anyof",po_ogj_custform],
				   "AND",
				   ["taxline","is","F"],
				   "AND",
				   ["createdfrom","noneof","@NONE@"]
				], 
				[
				   new nlobjSearchColumn("entity"), 
				   new nlobjSearchColumn("createdfrom"), 
				]
				);
		var poArr = new Array();
		if(!isEmpty(purchaseorderSearch)){
			for(var i = 0 ; i < purchaseorderSearch.length ;i++){
				poArr.push(purchaseorderSearch[i].getValue("createdfrom"));	
			}
		}
		var subList = form.addSubList('list', 'list', 'list');
		subList.addMarkAllButtons();
		subList.addField('checkbox', 'checkbox', '選択');
		var linkField=subList.addField('linkurl', 'url', '表示');
		linkField.setLinkText('表示');
		subList.addField('salesorder_no', 'text', '注文書番号');
		subList.addField('salesorder_id', 'text', '注文書ID').setDisplayType('hidden');
		subList.addField('salesorder_customer', 'text', '顧客');
		subList.addField('salesorder_customerid', 'text', '顧客ID').setDisplayType('hidden');
		subList.addField('salesorder_date', 'text', '日付');
		subList.addField('salesorder_currency', 'text', '通貨');
		subList.addField('salesorder_line', 'text', 'line').setDisplayType('hidden');
		subList.addField('salesorder_num', 'text', 'NUMBER');
		subList.addField('salesorder_item', 'text', 'アイテム');
		subList.addField('salesorder_itemid', 'text', 'アイテムID').setDisplayType('hidden');
		subList.addField('salesorder_price', 'text', '価格水準');
		subList.addField('salesorder_description', 'text', 'Description'); 
		subList.addField('salesorder_custpo', 'text', 'CUST. PO#'); 	
		subList.addField('salesorder_packing', 'text', 'PACKING DETAILS');
		subList.addField('salesorder_quantity', 'text', 'QTY');
		subList.addField('salesorder_rate', 'text', '単価');
		subList.addField('salesorder_eta', 'text', 'ETA');
		subList.addField('salesorder_tax', 'text', 'TAX');
		subList.addField('salesorder_consignee', 'text', 'CONSIGNEE');
		subList.addField('salesorder_consigneeadd', 'text', 'CONSIGNEE ADDRESS');
		subList.addField('salesorder_shippingmark', 'text', 'SHIPPING MARK');
		subList.addField('salesorder_shippingmode', 'text', 'SHIPPING MODE');
		subList.addField('salesorder_incoterms', 'text', 'INCOTERMS');
		subList.addField('salesorder_message', 'text', '顧客へのメッセージ');
		subList.addField('salesorder_poname', 'text', '発注書を作成');
		subList.addField('salesorder_povendor', 'text', '仕入先');
		subList.addField('salesorder_purchase', 'text', '購入契約書');
		var xmlString = '注文番号,顧客,日付,通貨 ,NUMBER,アイテム,価格水準,DESCRIPTION,CUST. PO#,PACKING DETAILS,QTY,単価,ETA,TAX,CONSIGNEE,CONSIGNEE ADDRESS,SHIPPING MARK,SHIPPING MODE,INCOTERMS,顧客へのメッセージ,発注書番号,仕入先,購入契約書\r\n';
		var consAdd = '';
		var custbody2 = '';
		var description = '';
		var countText = 0;
		if(!isEmpty(salesorderSearch)){
			var lineCount = 1;
			for(var i = 0 ; i < salesorderSearch.length ;i++){
				var tranid = salesorderSearch[i].getValue("tranid");//注文番号
				var entity = salesorderSearch[i].getText("entity");//顧客
				var entityId = salesorderSearch[i].getValue("internalid","customer",null);//顧客ID
				var trandate = salesorderSearch[i].getValue("trandate");//日付
				var soInternalid = salesorderSearch[i].getValue("internalid");//注文ID
				var number = salesorderSearch[i].getValue("custcol_number");//number
				var custPo = salesorderSearch[i].getValue("custcol7");//Cust. PO#	
				var item = salesorderSearch[i].getText("item");//アイテム
				var itemId = salesorderSearch[i].getValue("internalid","item",null);//アイテムID
				var description = salesorderSearch[i].getValue("memo");//説明
				var custcol1 = salesorderSearch[i].getValue("custcol1");//PACKING DETAILS
				var quantity = parseFloat(salesorderSearch[i].getValue("quantity"));//数量
				var rate = parseFloat(salesorderSearch[i].getValue("fxrate"));//単価
				var eta = salesorderSearch[i].getValue("custcol_eta");//ETA
				var taxcode = salesorderSearch[i].getText("taxcode");//税金コード
				var price = salesorderSearch[i].getText("pricelevel");//価格水準
				var custbody1 = salesorderSearch[i].getText("custbody1");//CONSIGNEE
				var consAddString = salesorderSearch[i].getValue("custbody_cons_add");//CONSIGNEE ADDRESS
				if(!isEmpty(consAddString)){
					consAdd = meaning(consAddString);
				}
				var custbodyString = salesorderSearch[i].getValue("custbody2");//SHIPPING MARK
				if(!isEmpty(custbodyString)){
					custbody2 = meaning(custbodyString);
				}	
				var custbody3 = salesorderSearch[i].getText("custbody3");//SHIPPING MODE
				var incoterms = salesorderSearch[i].getText("custbody_me_incoterms");//INCOTERMS
				var message = salesorderSearch[i].getValue("message");//顧客へのメッセージ
				var poName = salesorderSearch[i].getValue("tranid","purchaseOrder",null);//PO番号
				var purchasecontract = salesorderSearch[i].getText("custbody_ogw_purchasecontract_select"); //購入契約書
				poArr_index = poArr.indexOf(soInternalid);
				if(poArr_index < 0){
					var poVendor = '';
				}else{
					var poVendor = purchaseorderSearch[poArr_index].getText("entity"); //仕入先
				}
				var currency = salesorderSearch[i].getText("currency");//通貨
				var line = salesorderSearch[i].getValue("line");//line
				var theLink = nlapiResolveURL('RECORD', 'salesorder',soInternalid ,'VIEW');
				
				subList.setLineItemValue('salesorder_no', lineCount, tranid);//注文番号
				subList.setLineItemValue('salesorder_id', lineCount, soInternalid);//注文ID
				subList.setLineItemValue('linkurl',lineCount, theLink);//表示
				subList.setLineItemValue('salesorder_customer', lineCount, entity);//顧客
				subList.setLineItemValue('salesorder_customerid', lineCount, entityId);//顧客ID
				subList.setLineItemValue('salesorder_date', lineCount, trandate);//日付
				subList.setLineItemValue('salesorder_currency', lineCount, currency);//通貨
				subList.setLineItemValue('salesorder_line', lineCount, line);//line ID
				subList.setLineItemValue('salesorder_item', lineCount, item);//アイテム
				subList.setLineItemValue('salesorder_itemid', lineCount, itemId);//アイテムID
				subList.setLineItemValue('salesorder_custpo', lineCount, custPo);//Cust. PO#	
				subList.setLineItemValue('salesorder_num', lineCount, number);//number
				subList.setLineItemValue('salesorder_price', lineCount, price);//価格水準
				subList.setLineItemValue('salesorder_description', lineCount, description);//説明
				subList.setLineItemValue('salesorder_packing', lineCount, custcol1);//PACKING DETAILS
				subList.setLineItemValue('salesorder_quantity', lineCount, quantity);//数量
				subList.setLineItemValue('salesorder_rate', lineCount, rate);//単価
				subList.setLineItemValue('salesorder_eta', lineCount, eta);//ETA
				subList.setLineItemValue('salesorder_tax', lineCount, taxcode);//税金コード
				subList.setLineItemValue('salesorder_consignee', lineCount, custbody1);//CONSIGNEE
				subList.setLineItemValue('salesorder_consigneeadd', lineCount, consAdd);//CONSIGNEE ADDRESS
				subList.setLineItemValue('salesorder_shippingmark', lineCount, custbody2);//SHIPPING MARK
				subList.setLineItemValue('salesorder_shippingmode', lineCount, custbody3);//SHIPPING MODE
				subList.setLineItemValue('salesorder_incoterms', lineCount, incoterms);//INCOTERMS
				subList.setLineItemValue('salesorder_message', lineCount, message);//顧客へのメッセージ
				subList.setLineItemValue('salesorder_poname', lineCount, poName);//PO番号
				subList.setLineItemValue('salesorder_povendor', lineCount, poVendor);//仕入先
				subList.setLineItemValue('salesorder_purchase', lineCount, purchasecontract);//購入契約書
				 
				var csvValue=soInternalid+'|'+entityId+'|'+itemId+'|'+trandate+'|'+line;
				if(selectLineArray.indexOf(csvValue) > -1){
					xmlString+=tranid+',"'+entity+'",'+trandate+','+currency+','+number+',"'+item+'",'+price+',"'+description+'","'+custPo+'","'+custcol1+'",'+
					quantity+','+rate+','+eta+','+taxcode+',"'+custbody1+'","'+consAdd+'","'+custbody2+'","'+custbody3+'","'+incoterms+'","'+message+'",'+poName+',"'+poVendor+'",'+purchasecontract+'\r\n';
				}
				lineCount++;
				countText++;
			}
		}
	subList.setLabel('注文書詳細:'+countText+'件');
	form.addButton('csvdownload', 'CSVテンプレートのダウンロード', 'csvDownload();');
	form.addButton('btn_return', '検索戻す','searchReturn()')
	form.addSubmitButton('CSV Import');
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
			var form = nlapiCreateForm('CSVインポート結果', false);
			var subList = form.addSubList('list', 'list', 'CSVインポート結果一覧');
			var theLink = nlapiResolveURL('SUITELET', 'customscript_ogw_sl_so_csvimport', 'customdeploy_ogw_sl_so_csvimport');
			var backbtns = "window.location.href='"+devpUrl+theLink+"&whence='";
			form.addButton('custpage_refresh', '戻る', backbtns);
			
			subList.addField('csv_error', 'text', 'エラー');
			var csvLink=subList.addField('csv_link', 'url', '表示');
			csvLink.setLinkText('表示');
			subList.addField('csv_sonum', 'text', '注文書番号');
			subList.addField('csv_entity', 'text', '顧客');
			subList.addField('csv_date', 'text', '日付');
			subList.addField('csv_num', 'text', 'NUMBER ');
			subList.addField('csv_item', 'text', 'アイテム ');
			subList.addField('csv_price', 'text', '価格水準 ');
			subList.addField('csv_explain', 'text', 'DESCRIPTION');
			subList.addField('csv_custpo', 'text', 'csv_custpo');
			subList.addField('csv_packling', 'text', 'PACKING DETAILS');
			subList.addField('csv_qty', 'text', 'QTY');
			subList.addField('csv_rate', 'text', '単価');
			subList.addField('csv_eta', 'text', 'ETA');
			subList.addField('csv_tax', 'text', 'TAX');
			subList.addField('csv_con', 'text', 'CONSIGNEE');
			subList.addField('csv_address', 'text', 'CONSIGNEE ADDRESS');
			subList.addField('csv_mark', 'text', 'SHIPPING MARK');
			subList.addField('csv_mode', 'text', 'SHIPPING MODE');
			subList.addField('csv_incote', 'text', 'INCOTERMS');
			subList.addField('csv_message', 'text', '顧客へのメッセージ');
			subList.addField('csv_vendor', 'text', '仕入先');
			subList.addField('csv_purchase', 'text', '購入契約書');
			var cont = 1;
			
			
			var soSearch = getSearchResults("salesorder",null,
					[
					   ["type","anyof","SalesOrd"], 
					   "AND", 
					   ["customform","anyof",so_ogj_custform],
					   "OR", 
					   ["customform","anyof","118"],
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
					 var csv_entity=defaultEmpty(fileLine[2]);// 顧客
					 var csv_date=defaultEmpty(fileLine[3]);// 日付
					 var csv_num=defaultEmpty(fileLine[4]);// NUMBER
					 var csv_item=defaultEmpty(fileLine[5]);// アイテム
					 var csv_price=defaultEmpty(fileLine[6]);// 価格水準
					 var csv_explain=defaultEmpty(fileLine[7]);// DESCRIPTION
					 var csv_custpo=defaultEmpty(fileLine[8]);//CUST. PO#
					 var csv_packling=defaultEmpty(fileLine[9]);// PACKING DETAILS
					 var csv_qty=defaultEmpty(fileLine[10]);// QTY
					 
					 var csv_rate=defaultEmpty(fileLine[11]);// 単価
					 var csv_eta=defaultEmpty(fileLine[12]);// ETA
					 var csv_tax=defaultEmpty(fileLine[13]);// TAX
					 var csv_con=defaultEmpty(fileLine[14]);// CONSIGNEE
					 var csv_address=defaultEmpty(fileLine[15]);// CONSIGNEE ADDRESS
					 var csv_mark=defaultEmpty(fileLine[16]);// SHIPPING MARK
					 var csv_mode=defaultEmpty(fileLine[17]);// SHIPPING MODE
					 var csv_incote=defaultEmpty(fileLine[18]);// INCOTERMS
					 var csv_message=defaultEmpty(fileLine[19]);// 顧客へのメッセージ
					 var csv_vendor=defaultEmpty(fileLine[20]);// 仕入先
					 var csv_purchase=defaultEmpty(fileLine[21]);// 購入契約書
					 
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
					 subList.setLineItemValue('csv_entity', cont, csv_entity);// 顧客
					 subList.setLineItemValue('csv_date', cont, csv_date);	// 日付	
					 subList.setLineItemValue('csv_num', cont, csv_num);	//NUMBER
					 subList.setLineItemValue('csv_item', cont, csv_item);// アイテム
					 subList.setLineItemValue('csv_price', cont, csv_price);// 価格水準
					 subList.setLineItemValue('csv_explain', cont, csv_explain);// DESCRIPTION
					 subList.setLineItemValue('csv_custpo', cont, csv_custpo);//CUST. PO#
					 subList.setLineItemValue('csv_packling', cont, csv_packling);// PACKING DETAILS
					 subList.setLineItemValue('csv_qty', cont, csv_qty);// QTY
					 subList.setLineItemValue('csv_rate', cont, csv_rate);// 単価
					 subList.setLineItemValue('csv_eta', cont, csv_eta);// ETA 
					 subList.setLineItemValue('csv_tax', cont, csv_tax);// TAX
					 subList.setLineItemValue('csv_con', cont, csv_con);// CONSIGNEE
					 subList.setLineItemValue('csv_address', cont, csv_address);// CONSIGNEE ADDRESS
					 subList.setLineItemValue('csv_mark', cont, csv_mark);// SHIPPING MARK
					 subList.setLineItemValue('csv_mode', cont, csv_mode);// SHIPPING MODE
					 subList.setLineItemValue('csv_incote', cont, csv_incote);// INCOTERMS
					 subList.setLineItemValue('csv_message', cont, csv_message);// 顧客へのメッセージ
					 subList.setLineItemValue('csv_vendor', cont, csv_vendor);// 仕入先
					 subList.setLineItemValue('csv_purchase', cont, csv_purchase);// 購入契約書
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
	var meaningString = str.replace(/\r/g," ").replace(/。/g," ");
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