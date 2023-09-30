/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       2023/01/13     CPC_苑
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
var po_ogj_custForm = "243";

function suitelet(request, response){
	if (request.getMethod() == 'POST') {
		run(request, response);
		
	}else{
		if (!isEmpty(request.getParameter('custparam_logform'))) {
			logForm(request, response)
		}else{
			createForm(request, response);
		}
	}		 
}

function run(request, response){
	
	var ctx = nlapiGetContext();
	var theCount = parseInt(request.getLineItemCount('custpage_list'));
	var idList='';
    for (var m = 1; m < theCount + 1; m++) {
      if(request.getLineItemValue('custpage_list', 'check', m)=='T'){	
    	  var poId = request.getLineItemValue('custpage_list', 'internalid', m);//ID
    	  var to = request.getLineItemValue('custpage_list', 'to', m);//TO
    	  var cc = request.getLineItemValue('custpage_list', 'cc', m);//CC
    	  var subject = request.getLineItemValue('custpage_list', 'subject', m);//件名
    	  var content = request.getLineItemValue('custpage_list', 'content', m);//内容
    	  idList += poId+'***'+to+'***'+cc+'***'+subject+'***'+content+'&&';
      	}
      }
	var scheduleparams = new Array();	
	scheduleparams['custscript_ogw_idlist'] = idList;
	scheduleparams['custscript_ogw_atuo_ss'] = 'F';
	
	runBatch('customscript_ogw_ss_sendmail', 'customdeploy_ogw_ss_sendmail', scheduleparams);

	var parameter = new Array();
	parameter['custparam_logform'] = '1';	
	nlapiSetRedirectURL('suitelet', ctx.getScriptId(), ctx.getDeploymentId(),null, parameter);
}


//バッチ状態画面
function logForm(request, response) {

	var form = nlapiCreateForm('処理状態', false);
	// 実行情報
	form.addFieldGroup('custpage_run_info', '実行情報');
	var resetbtn = "window.location.href=window.location.href";
	form.addButton('resetbtn', '更新', resetbtn);
	// バッチ状態
	var batchStatus = getScheduledScriptRunStatus('customdeploy_ogw_ss_sendmail');

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
	
}


//画面作成
function createForm(request, response){
	
	var form = nlapiCreateForm('発注書一括送信画面', false);
	form.setScript('customscript_ogw_cs_sendmail');
	var  subsidiaryPar= request.getParameter('subsidiary');
	var  entityPar= request.getParameter('entity');
	var  startdatePar= request.getParameter('startdate');
	var  enddatePar= request.getParameter('enddate');
	var  sendmailedPar= request.getParameter('sendmailed');
	var selectFlg= request.getParameter('selectFlg');
	// フィールド作成
	form.addFieldGroup('select_group', '検索項目');
	var subsidiaryField =form.addField('custpage_subsidiary', 'select', '子会社', 'subsidiary', 'select_group');
	subsidiaryField.setMandatory(true);
	var startdateField =form.addField('custpage_startdate', 'date', '日付(開始日)', null, 'select_group');
	startdateField.setMandatory(true);
	var enddateField = form.addField('custpage_enddate', 'date', '日付(終了日)', null,'select_group');
	enddateField.setMandatory(true);
	var entityField = form.addField('custpage_entity', 'select', '仕入先', null,'select_group');
	entityField.addSelectOption('','');
	var sendmailedField = form.addField('custpage_sendmailed', 'checkbox', '発注書送信済み', null,'select_group');
	if(!isEmpty(subsidiaryPar)){
		subsidiaryField.setDefaultValue(subsidiaryPar);
		var vendorSearch = getSearchResults("vendor",null,
				[
				   ["subsidiary","anyof",subsidiaryPar], 
				   "AND", 
				   ["category","noneof","5"]
				], 
				[
				   new nlobjSearchColumn("internalid",null,"GROUP"), 
				   new nlobjSearchColumn("entityid",null,"GROUP").setSort(false), 				   
				   new nlobjSearchColumn("altname",null,"GROUP").setSort(false)
				]
				);
		if(!isEmpty(vendorSearch)){
			for(var i=0;i<vendorSearch.length;i++){
				var vendortxt='';
				var enId=vendorSearch[i].getValue("entityid",null,"GROUP");
				var enAltname=vendorSearch[i].getValue("altname",null,"GROUP");
				if(!isEmpty(enId)&&enId!='- None -'){
					vendortxt+=enId;
				}
                if(!isEmpty(enAltname)&&enAltname!='- None -'){
                	if(!isEmpty(vendortxt)){
                		vendortxt+=' ';
                	}
                	vendortxt+=enAltname;
				}
				entityField.addSelectOption(vendorSearch[i].getValue("internalid",null,"GROUP"),vendortxt);
			}
		}		
	}
	if(!isEmpty(startdatePar)){
		startdateField.setDefaultValue(startdatePar);
	}else{
		startdateField.setDefaultValue(nlapiDateToString(getSystemTime()));
	}
	if(!isEmpty(enddatePar)){
		enddateField.setDefaultValue(enddatePar);
	}else{
		enddateField.setDefaultValue(nlapiDateToString(getSystemTime()));
	}
	if(!isEmpty(entityPar)){
		entityField.setDefaultValue(entityPar);
	}
	if(!isEmpty(sendmailedPar)){
		sendmailedField.setDefaultValue(sendmailedPar);
	}
	if(selectFlg == 'T'){
		subsidiaryField.setDisplayType('inline');
		startdateField.setDisplayType('inline');
		enddateField.setDisplayType('inline');
		entityField.setDisplayType('inline');
		sendmailedField.setDisplayType('inline');
		form.addButton('btn_searchReturn', '検索戻す', 'searchReturn()');
		form.addSubmitButton('一括送信');
		
		if(sendmailedPar!='T'){
			sendmailedPar='F';
		}
		
		var poSearch = getSearchResults("purchaseorder",null,
				[
				   ["type","anyof","PurchOrd"], 
				   "AND", 
				   ["custbody_ogw_po_sendmail","is",sendmailedPar], 
				   "AND", 
				   ["trandate","within",startdatePar,enddatePar], 
				   "AND", 
				   ["subsidiary","anyof",subsidiaryPar],
				   "AND", 
				   ["status","noneof","PurchOrd:B","PurchOrd:C"],
				   "AND", 
				   ["customform","anyof",po_ogj_custForm],
			       "AND", 
			       ["taxline","is","F"], 
			       "AND", 
			       ["mainline","is","F"],
				], 
				[
				 	new nlobjSearchColumn("internalid").setSort(true), 
				 	new nlobjSearchColumn("line").setSort(false),
				 	new nlobjSearchColumn("tranid"),//発注書番号 
				 	new nlobjSearchColumn("transactionnumber"),//トランザクション番号
				 	new nlobjSearchColumn("trandate"),//日付
				 	new nlobjSearchColumn("entity"), //仕入先 
				 	new nlobjSearchColumn("custentity_ogw_entity_name","vendor",null),//TO(仕入先名)
				 	new nlobjSearchColumn("custbody_ogw_po_mail_template"), //発注書送信テンプレート
				 	new nlobjSearchColumn("custbody_ogw_po_sendmail"), //発注書送信済み
				 	new nlobjSearchColumn("custbody_ogw_to"), //TO
				 	new nlobjSearchColumn("custbody_ogw_cc"), //CC
				 	new nlobjSearchColumn("custbody_ogw_content"), //内容
				 	new nlobjSearchColumn("custbody_ogw_cancle_content"), //キャンセル内容
				 	new nlobjSearchColumn("custbody_ogw_change_content"), //変更内容
				 	new nlobjSearchColumn("custcol_ogw_po_pdf_temp"), //発注書PDFテンプレート	
				 	new nlobjSearchColumn("custcol_ogw_inquiries"), //問い合わせ先
				 	new nlobjSearchColumn("custbody_ogw_po_change"), //CHANGE
				 	new nlobjSearchColumn("custbody_ogw_cancle"), //CANCLE  
				 	new nlobjSearchColumn("custcol7"), //CUST. PO#
				 	new nlobjSearchColumn("item"), //item
				 	new nlobjSearchColumn("memo"), //説明
				 	new nlobjSearchColumn("custcol_eta"), //ETA
				 	new nlobjSearchColumn("custcol_eta"), //ETA
				]
				);
		var subList = form.addSubList('custpage_list', 'list', '合計:');
		subList.addMarkAllButtons()
		subList.addField('check', 'checkbox', '選択');
		subList.addField('internalid', 'text', '内部ID').setDisplayType('hidden');
		var linkField=subList.addField('linkurl', 'url', '表示');
		linkField.setLinkText('表示');
		subList.addField('docno', 'text', 'ドキュメント番号').setDisplayType('inline');	
		subList.addField('tranno', 'text', 'トランザクション番号').setDisplayType('inline');	
		subList.addField('date', 'text', '日付').setDisplayType('inline');	
		subList.addField('entity', 'text', '仕入先','vendor').setDisplayType('inline');	
		subList.addField('potemp', 'text', '発注書送信テンプレート','customrecord_ogw_po_mail_template').setDisplayType('inline');	
		subList.addField('posendmailed', 'checkbox', '発注書送信済み').setDisplayType('inline');	
		subList.addField('to', 'textarea', 'TO').setDisplayType('inline');	
		subList.addField('cc', 'textarea', 'CC').setDisplayType('inline');	
		subList.addField('subject', 'textarea', '件名').setDisplayType('inline');	
		subList.addField('content', 'textarea', '内容').setDisplayType('inline');
		if(!isEmpty(poSearch)){
			var count=1;
			var poIdArr = new Array();
			var poIdIndex = new Array();
			var poTitleArr = new Array();
			for(var i=0;i<poSearch.length;i++){
				var poId = poSearch[i].getValue("internalid");//発注書ID
				var poPdfTemp = defaultEmpty(poSearch[i].getValue('custcol_ogw_po_pdf_temp'));//発注書PDFテンプレート
				poIdIndex.push(poId);
				poTitleArr.push({
					poId:poId,
					poPdfTemp:poPdfTemp,
				});
			}
			
			for(var i=0;i<poSearch.length;i++){
				var poId = defaultEmpty(poSearch[i].getValue("internalid"));//発注書ID
				var itemNum= itemLength(poIdIndex,poId);
				if(itemNum > 1 ){
					var subText = "等";
				}else{
					var subText = "";
				}
				var titleFirstValue= getTitle(poTitleArr,poId);
	            if(poIdArr.indexOf(poId)< 0) { //SO ID
	            	var tranid = defaultEmpty(poSearch[i].getValue("tranid"));//発注書番号
					var transactionnumber = defaultEmpty(poSearch[i].getValue("transactionnumber"));//トランザクション番号
					var trandate = defaultEmpty(poSearch[i].getValue("trandate"));//日付
					var entity = defaultEmpty(poSearch[i].getText("entity"));//仕入先 
					var entityTo = defaultEmpty(poSearch[i].getValue("custentity_ogw_entity_name","vendor",null));//TO(仕入先名)
					var mailTemp = defaultEmpty(poSearch[i].getText('custbody_ogw_po_mail_template'));//発注書送信テンプレート
					var mailFlg = defaultEmpty(poSearch[i].getValue('custbody_ogw_po_sendmail'));//発注書送信済み
					var poTo = defaultEmpty(poSearch[i].getValue('custbody_ogw_to'));//TO
					var poCc = defaultEmpty(poSearch[i].getValue('custbody_ogw_cc'));//CC
					var poContent = defaultEmpty(poSearch[i].getValue('custbody_ogw_content'));//内容
					var poCancleContent = defaultEmpty(poSearch[i].getValue('custbody_ogw_cancle_content'));//キャンセル内容
					var poChangeContent = defaultEmpty(poSearch[i].getValue('custbody_ogw_change_content'));//変更内容
					var poPdfTemp = defaultEmpty(poSearch[i].getValue('custcol_ogw_po_pdf_temp'));//発注書PDFテンプレート
					var poInquiries = defaultEmpty(poSearch[i].getValue('custcol_ogw_inquiries'));//問い合わせ先
					var cancleFlg = defaultEmpty(poSearch[i].getValue('custbody_ogw_cancle'));//CANCLE
					var changeFlg = defaultEmpty(poSearch[i].getValue('custbody_ogw_po_change'));//CHANGE
					var custPo = defaultEmpty(poSearch[i].getValue('custcol7'));//custPo
					var itemName = defaultEmpty(poSearch[i].getText('item'));//item
					var memo = defaultEmpty(poSearch[i].getValue('memo'));//説明
					var etaValue = defaultEmpty(poSearch[i].getValue('custcol_eta'));//ETA
					var subName = "Ogawa Flavors and Fragrances(Singapore) Pte. Ltd.Purchasing Dep.";
					
					var mBodyMail = '';
					if(cancleFlg == 'T' && changeFlg == 'F'){
						mBodyMail = poCancleContent; //キャンセル内容
					}else if(changeFlg == 'T' && cancleFlg == 'F'){
						mBodyMail = poChangeContent; //変更内容
					}else if(changeFlg == 'T' && cancleFlg == 'T'){
						mBodyMail = poCancleContent; //キャンセル内容
					}else if(changeFlg == 'F' && cancleFlg == 'F'){
						mBodyMail = poContent; //内容
					}
					
					var inquiriesValue = '';
					if(!isEmpty(poInquiries)){
						inquiriesValue = poInquiries.replace(/。/g,'。'+'\n');
					}
					
					var lastMailText = "============================================================================="+'\n'+		
					   "OGAWA FLAVORS & FRAGRANCES (SINGAPORE) PTE. LTD."+'\n'+					
					   "生田祐嗣/Ikuta Yuji"+'\n'+
					   "Add:    51 Science Park Road, Science Park II,"+'\n'+
					   "        #04-23/24, The Aries, Singapore 117586"+'\n'+
					   "Tel:    (65) 6777 1277"+'\n'+
					   "Fax:    (65) 6777 2245"+'\n'+
					   "URL:    http:// www.ogawa.net"+'\n'+
					   "=============================================================================";
						
					var mBody = '';
					mBody = mBodyMail + '\n'+'\n'+ inquiriesValue+'\n'+'\n'+lastMailText;	
					var mSubject = titleFirstValue + custPo + "　" + entityTo +"　" + itemName + "　" + subText + "　" + memo + "　"  + etaValue + "　" +subName;
					
					var theLink = nlapiResolveURL('RECORD', 'purchaseorder',poSearch[i].getValue("internalid") ,'VIEW');
					subList.setLineItemValue('linkurl',count, theLink);
					subList.setLineItemValue('internalid',count, poId);
					subList.setLineItemValue('docno',count, tranid); //ドキュメント番号
					subList.setLineItemValue('tranno',count, transactionnumber); //トランザクション番号
					subList.setLineItemValue('date',count, trandate); //日付
					subList.setLineItemValue('entity',count, entity); //仕入先 
					subList.setLineItemValue('potemp',count, mailTemp); //発注書送信テンプレート
					subList.setLineItemValue('posendmailed',count, mailFlg); //発注書送信済み
					subList.setLineItemValue('to',count, poTo); //TO
					subList.setLineItemValue('cc',count, poCc); //CC
					subList.setLineItemValue('subject',count, mSubject); //件名
					subList.setLineItemValue('content',count, mBody); //内容
					count++;   
	            	poIdArr.push(poId);
	            } 
			}
		}		
	}else{
		form.addButton('btn_search', '検索', 'search()');
	}
	response.writePage(form);
}

function defaultEmpty(src){
	return src || '';
}



function itemLength(poIdIndex,poId){
	var num =0;
	for(var k=0;k<poIdIndex.length;k++){
		if(poIdIndex[k] == poId){
			num++;
		}	
	}
	return num;
}

function getTitle(poTitleArr,poId){
	var titleFirstValue = '';
	for(var k=0;k<poTitleArr.length;k++){
		if(poTitleArr[k].poId == poId){
			if(poTitleArr[k].poPdfTemp == '1'){
				titleFirstValue = "注文書："
			}
		}	
	}
	return titleFirstValue;
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