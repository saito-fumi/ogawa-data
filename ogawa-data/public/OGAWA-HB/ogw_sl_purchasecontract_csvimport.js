/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       2023/01/12     CPC_苑
 *
 */

// 購入契約書csvimport

var devpUrl='https://3701295.app.netsuite.com/';

var folderId='440';
var folder_ogj_form='248'
/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response){
	response.setEncoding("SHIFT_JIS");
	if (request.getMethod() == 'POST') {
		run(request, response);
		
	}else{
		if (!isEmpty(request.getParameter('custparam_logform'))) {
			logForm(request, response,request.getParameter('custparam_logform'));
		}else{
			createForm(request, response);
		}
	}
	
	 
}

function run(request, response){
	
	var ctx = nlapiGetContext();	
	var scheduleparams = new Array();
	var file=request.getFile('custpage_importfile');
	var parameter = new Array();
	if(!isEmpty(file)){
	file.setEncoding('SHIFT_JIS');
	file.setFolder(folderId);
	var fileId = nlapiSubmitFile(file);
	scheduleparams['custscript_fileid'] = fileId;
	runBatch('customscript_ogw_ss_pc_csvimport', 'customdeploy_ogw_ss_pc_csvimport', scheduleparams);
	parameter['custparam_logform'] = '1';		
	}else{
	parameter['custparam_logform'] = '2';		
	}
	nlapiSetRedirectURL('suitelet', ctx.getScriptId(), ctx.getDeploymentId(),null, parameter);
}


//バッチ状態画面
function logForm(request, response,logflag) {

	var form = nlapiCreateForm('処理状態', false);
	// 実行情報
	form.addFieldGroup('custpage_run_info', '実行情報');
	
	
	if(logflag=='1'){
	var resetbtn = "window.location.href=window.location.href";
	form.addButton('resetbtn', '更新', resetbtn);
	// バッチ状態
	var batchStatus = getScheduledScriptRunStatus('customdeploy_ogw_ss_pc_csvimport');

	if (batchStatus == 'FAILED') {
		// 実行失敗の場合
		var runstatusField = form.addField('custpage_run_info_status', 'text',
				'', null, 'custpage_run_info');
		runstatusField.setDisplayType('inline');
		var messageColour = '<font color="red"> バッチ処理を失敗しました </font>';
		runstatusField.setDefaultValue(messageColour);
		response.writePage(form);
	} else if (batchStatus == 'PENDING' || batchStatus == 'PROCESSING') {

		// 実行中の場合
		var runstatusField = form.addField('custpage_run_info_status', 'text',
				'', null, 'custpage_run_info');
		runstatusField.setDisplayType('inline');
		runstatusField.setDefaultValue('バッチ処理を実行中');
		response.writePage(form);
	}else{
		createForm(request, response);
	}
	}else if(logflag=='2'){
		var runstatusField = form.addField('custpage_run_info_status', 'text',
				'', null, 'custpage_run_info');
		runstatusField.setDisplayType('inline');
		var messageColour = '<font color="red"> CSVファイルをアップロードしていません</font>';
		runstatusField.setDefaultValue(messageColour);
		var theLink = nlapiResolveURL('SUITELET', 'customscript_ogw_sl_pc_csvimport', 'customdeploy_ogw_sl_pc_csvimport');
		var backbtns = "window.location.href='"+devpUrl+theLink+"&whence='";
		form.addButton('backbtns', '検索画面に戻る', backbtns);
		response.writePage(form);
	}
}


//画面作成
function createForm(request, response){
	
	var form = nlapiCreateForm('購入契約書CSV Import画面', false);
	form.setScript('customscript_ogw_cs_pc_csvimport');
	
	var searchFlag=request.getParameter('searchFlag');
	var entitysearch=request.getParameter('entitysearch');
	var tranidsearch=request.getParameter('tranidsearch');	
	var effectivitybasedonsearch=request.getParameter('effectivitybasedonsearch');
	var startdatesearch=request.getParameter('startdatesearch');
	var enddatesearch=request.getParameter('enddatesearch');
		
	form.addFieldGroup('search', '検索条件');
	var entitysearchField=form.addField('entitysearch', 'select', '仕入先', 'vendor', 'search');
	var tranidsearchField=form.addField('tranidsearch', 'select', '購入契約書番号', '', 'search');
	tranidsearchField.addSelectOption('', '');
	 var tranidsearchListselect = new Array();
	 tranidsearchListselect.push(["type","anyof","PurchCon"]);
	 tranidsearchListselect.push("AND");
	 tranidsearchListselect.push(["mainline","is","F"]);
	 if(!isEmpty(entitysearch)){
		 tranidsearchListselect.push("AND");
		 tranidsearchListselect.push(["name","anyof",entitysearch]);
		}
	
	var tranidsearchList = getSearchResults("purchasecontract",null,tranidsearchListselect, 
			[
			   new nlobjSearchColumn("internalid",null,"GROUP"), 
			   new nlobjSearchColumn("tranid",null,"GROUP")
			]
			);
	if(!isEmpty(tranidsearchList)){
		 for(var ts=0;ts<tranidsearchList.length;ts++){
			 tranidsearchField.addSelectOption(tranidsearchList[ts].getValue("internalid",null,"GROUP"),tranidsearchList[ts].getValue("tranid",null,"GROUP"));
		 }
	}
	
	var effectivitybasedonField=form.addField('effectivitybasedonsearch', 'select', '次に基づく有効性', '', 'search');
	effectivitybasedonField.addSelectOption('', '');
	effectivitybasedonField.addSelectOption('RECEIPTDATE', '受領予定日	');
	effectivitybasedonField.addSelectOption('ORDERDATE', '注文日');
	
	var startdateField=form.addField('startdatesearch', 'date', '契約開始日', '', 'search');
	var enddateField=form.addField('enddatesearch', 'date', '契約終了日', '', 'search');
	
	if(!isEmpty(entitysearch)){
		entitysearchField.setDefaultValue(entitysearch);
	}
	
	if(!isEmpty(tranidsearch)){
		tranidsearchField.setDefaultValue(tranidsearch);
	}
		
	if(!isEmpty(effectivitybasedonsearch)){
		effectivitybasedonField.setDefaultValue(effectivitybasedonsearch);
	}
	
	if(!isEmpty(startdatesearch)){
		startdateField.setDefaultValue(startdatesearch);
	}
	
	if(!isEmpty(enddatesearch)){
		enddateField.setDefaultValue(enddatesearch);
	}
	
	if(searchFlag=='T'){
	tranidsearchField.setDisplayType('inline');	
	entitysearchField.setDisplayType('inline');
	effectivitybasedonField.setDisplayType('inline');	
	startdateField.setDisplayType('inline');	
	enddateField.setDisplayType('inline');
	var fileField=form.addField('custpage_importfile', 'file', 'CSVファイルのアップロード');
	fileField.setLayoutType('outsideabove', 'startcol');
	var selectLine=request.getParameter('selectLine');
	var selectLineArray=new Array();
	if(!isEmpty(selectLine)){
		selectLineArray=selectLine.split("***");
	}
	 var select = new Array();
	 select.push(["type","anyof","PurchCon"]);
	 select.push("AND");
	 select.push(["mainline","is","F"]);
	 select.push("AND");
	 select.push(["customform","anyof","248"]);
	 if(!isEmpty(entitysearch)){
			 select.push("AND");
			 select.push(["name","anyof",entitysearch]);
		}
		if(!isEmpty(tranidsearch)){
			 select.push("AND");
			 select.push(["internalid","is",tranidsearch]);
		}
		if(!isEmpty(effectivitybasedonsearch)){
			 select.push("AND");
			 select.push(["effectivitybasedon","anyof",effectivitybasedonsearch]);
		}
		if(!isEmpty(startdatesearch)){
			 select.push("AND");
			 select.push(["custbody_ogw_contract_start_date","on",startdatesearch]);   //契約開始日
		}
		if(!isEmpty(enddatesearch)){
			 select.push("AND");
			 select.push(["custbody_ogw_contract_end_date","on",enddatesearch]);       //契約終了日
		}
	var purchasecontractSearch = getSearchResults("purchasecontract",null,select, 
			[
			   new nlobjSearchColumn("tranid").setSort(true), 
			   new nlobjSearchColumn("entity"), 
			   new nlobjSearchColumn("currency"), 
			   new nlobjSearchColumn("custbody_ogw_contract_start_date"),  //契約開始日
			   new nlobjSearchColumn("custbody_ogw_contract_end_date"),   //契約終了日
			   new nlobjSearchColumn("item").setSort(false), 
			   new nlobjSearchColumn("name","taxItem",null), 
			   new nlobjSearchColumn("fromquantity","itemPricing",null).setSort(false), 
			   new nlobjSearchColumn("rateorlotprice","itemPricing",null), 
			   new nlobjSearchColumn("memo","itemPricing",null), 
			   new nlobjSearchColumn("effectivitybasedon")
			]
			);	 
	 var subList = form.addSubList('details', 'list', '購入契約書詳細: '+purchasecontractSearch.length+' 件');
	 subList.addMarkAllButtons();
	 subList.addField('checkbox', 'checkbox', '選択');
	 subList.addField('tranid', 'text', '購入契約書番号').setDisplayType('disabled');
	 subList.addField('entity', 'text', '仕入先').setDisplayType('disabled');
	 subList.addField('effectivitybasedon', 'text', '次に基づく有効性').setDisplayType('disabled');
	 subList.addField('currency', 'text', '通貨').setDisplayType('disabled');	
	 subList.addField('startdate', 'text', '契約開始日').setDisplayType('disabled');
	 subList.addField('enddate', 'text', '契約終了日').setDisplayType('disabled');
	 subList.addField('item', 'text', 'アイテム').setDisplayType('disabled');
	 subList.addField('taxitem', 'text', '税金コード').setDisplayType('disabled');	 
	 subList.addField('fromquantity', 'text', '数量から').setDisplayType('disabled');
	 subList.addField('rateorlotprice', 'text', '単価またはロット価格').setDisplayType('disabled');
	 subList.addField('memo', 'text', 'アイテム価格設定メモ').setDisplayType('disabled');
	 
	 
	 var xmlString = '購入契約書番号,仕入先,次に基づく有効性,通貨,契約開始日,契約終了日,アイテム,税金コード,数量から,単価またはロット価格,アイテム価格設定メモ\r\n';
	 if(!isEmpty(purchasecontractSearch)){
		 var lineCode=1;
		 for(var i=0;i<purchasecontractSearch.length;i++){
			 var tranid=purchasecontractSearch[i].getValue("tranid");
			 var entity=purchasecontractSearch[i].getText("entity");
			 var effectivitybasedon=purchasecontractSearch[i].getValue("effectivitybasedon");
			 var currency=purchasecontractSearch[i].getText("currency");
			// changed add by song 23030222 start
			 var startdate=purchasecontractSearch[i].getValue("custbody_ogw_contract_start_date");
			 var enddate=purchasecontractSearch[i].getValue("custbody_ogw_contract_end_date")
			 // changed add by song 23030222 end
			 var item=purchasecontractSearch[i].getText("item");
			 var taxitem=purchasecontractSearch[i].getValue("name","taxItem",null)
			 var fromquantity=purchasecontractSearch[i].getValue("fromquantity","itemPricing",null);
			 var rateorlotprice=purchasecontractSearch[i].getValue("rateorlotprice","itemPricing",null)
			 var memo=purchasecontractSearch[i].getValue("memo","itemPricing",null);
			 subList.setLineItemValue('tranid', lineCode,tranid);
			 subList.setLineItemValue('entity', lineCode,entity);
			 subList.setLineItemValue('effectivitybasedon', lineCode,effectivitybasedon);			 
			 subList.setLineItemValue('currency', lineCode,currency);
			 subList.setLineItemValue('startdate', lineCode,startdate);
			 subList.setLineItemValue('enddate', lineCode,enddate);
			 subList.setLineItemValue('item', lineCode,item);
			 subList.setLineItemValue('taxitem', lineCode,taxitem);
			 subList.setLineItemValue('fromquantity', lineCode,fromquantity);
			 subList.setLineItemValue('rateorlotprice', lineCode,rateorlotprice);
			 subList.setLineItemValue('memo', lineCode,memo);
			 var csvFlag=tranid+'|'+item+'|'+fromquantity;
			 if(selectLineArray.indexOf(csvFlag) > -1){
			 xmlString+=tranid+',"'+entity+'",'+effectivitybasedon+','+currency+','+startdate+','+enddate+',"'+item+'",'+taxitem+','+fromquantity+','+rateorlotprice+','+memo+'\r\n';
			 }
			 lineCode++;
		 } 
	 }
	form.addSubmitButton('CSV Import');
	form.addButton('csvdownload', 'CSVテンプレートのダウンロード', 'csvDownload();');
	form.addButton('backtosearch', '検索に戻る', 'backToSearch();');
	}else{
	tranidsearchField.setDisplayType('entry');
	entitysearchField.setDisplayType('entry');
	form.addButton('search', '検索', 'sepc();');
	}
	if(request.getParameter('downloadFlag')=='T'){
		var url=csvDown(xmlString);
		response.write(url);
	}else{
		response.writePage(form);
	}
	
	
}

function csvDown(xmlString){
	try{
	
		var xlsFile = nlapiCreateFile('購入契約書' + '_' + getFormatYmdHms() + '.csv', 'CSV', xmlString);
		
		xlsFile.setFolder(folderId);
		xlsFile.setName('購入契約書' + '_' + getFormatYmdHms() + '.csv');
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
 * システム日付と時間をフォーマットで取得
 */
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

//文字列置換
function replace(text)
{
if ( typeof(text)!= "string" )
   text = text.toString() ;

text = text.replace(/,/g, "_") ;

return text ;
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
function getScheduledScriptRunStatus(deploymentId) {

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