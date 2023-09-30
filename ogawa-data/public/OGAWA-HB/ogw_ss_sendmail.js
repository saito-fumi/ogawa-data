/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       2023/01/13     CPC_苑
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */

var pdfFolder='439';
var po_ogj_custForm = "243";
function scheduled(type) {
	var auto = nlapiGetContext().getSetting('SCRIPT','custscript_ogw_atuo_ss');
	var userId = nlapiGetContext().getSetting('SCRIPT','custscript_ogw_userid');
	if(auto=='T'){
//		var purchaseorderSearch = getSearchResults("purchaseorder",null,
//				[
//				   ["type","anyof","PurchOrd"], 
//				   "AND", 
//				   ["trandate","on","today"], 
//				   "AND", 
//				   ["custbody_ogw_po_sendmail","is","F"], 
//				   "AND", 
//				   ["vendorline.custentity_ogw_po_mail_template","noneof","@NONE@"]
//				], 
//				[
//				   new nlobjSearchColumn("internalid",null,"GROUP").setSort(false)
//				]
//				);
//		for(var i=0;i<purchaseorderSearch.length;i++){
//			governanceYield();
//			var poId=purchaseorderSearch[i].getValue("internalid",null,"GROUP");
//			 poSendMail(poId,userId);
//		}
		
	}else if(auto=='F'){
		var idlist = nlapiGetContext().getSetting('SCRIPT','custscript_ogw_idlist');
		var idlistArray=idlist.split('&&');
		for(var i=0;i<idlistArray.length;i++){
			governanceYield();
			if(isEmpty(idlistArray[i])) {
                  continue;
            }
		try{
			var poMailLine = idlistArray[i].split('***');
			var poId = poMailLine[0];//POID
			var mToAddress = poMailLine[1];//TO
			var mCC = poMailLine[2];//CC
			var subject = poMailLine[3];//件名 
			var content = poMailLine[4];//内容
			if(!isEmpty(poId)){
				 poSendMail(poId,mToAddress,mCC,subject,content,userId);
			}
		}catch(e){
			nlapiLogExecution('debug', 'Mail Text Error', e.message);
		}
		}
	}
}

function poSendMail(poId,mToAddress,mCC,subject,content,userId){
	nlapiLogExecution("debug", "poSendMail");
	governanceYield();
	var complexUrl = '';
	var fileArr = new Array();
	var poRecord=nlapiLoadRecord('purchaseorder', poId);
	var fieldList = getpoPdf(poId);
	for(var k = 0;k<fieldList.length;k++){
		var file = nlapiLoadFile(fieldList[k]);
		fileArr.push(file);
		var url= 'https://3701295.app.netsuite.com//'+file.getURL();
		complexUrl+=url;
		complexUrl+='|||';
	}
	var mSubject = transfer(subject);
	var tempcontent = transfer(content);
	try{
		mToAddress=mToAddress.split(';');
		if(!isEmpty(mCC)){
			mCC=mCC.split(';');
		}
		var records = new Object();
		records['transaction'] = poId;
		nlapiSendEmail(userId,mToAddress,mSubject,tempcontent,mCC, null, records, fileArr);
		nlapiSubmitField('purchaseorder',poId, 'custbody_ogw_po_sendmail', 'T', false);
	    flag ='T';
	}catch(e){
		flag=e.message;
		nlapiSendEmail(userId,mToAddress,mSubject,flag,mCC, null, records, fileArr);
	}
}


function getpoPdf(poId) {
	var poRecord=nlapiLoadRecord('purchaseorder', poId);
	var custForm = poRecord.getFieldValue('customform');
	if(custForm == po_ogj_custForm){
		var tranid = poRecord.getFieldValue('tranid');//発注書番号
		var trandate = poRecord.getFieldValue('trandate');//日付
		if(!isEmpty(trandate)){
			var trandateJp = getOgawaDate(trandate);
		}
		var entityId = poRecord.getFieldValue('entity');//仕入先
		var entityRecord = nlapiLookupField('entity', entityId, ['entityid','custentity_ogw_entity_name']);
		var vendorId = entityRecord.entityid;
		var vendorName = entityRecord.custentity_ogw_entity_name;
		var entityTo = '';	
		if(!isEmpty(vendorName)){	
			entityTo = specialString(vendorName);
		}
		var subsidiaryId = poRecord.getFieldValue('subsidiary');//子会社
		var subsidiarySearch= nlapiSearchRecord("subsidiary",null,
				[
				   ["internalid","anyof",subsidiaryId]
				], 
				[
				   new nlobjSearchColumn("legalname"), //正式名称
				   new nlobjSearchColumn("address1","address",null), //住所1
				   new nlobjSearchColumn("address2","address",null), //住所2
				   new nlobjSearchColumn("city","address",null),//住所3
				   new nlobjSearchColumn("zip","address",null), //ZIP
				]
				);
		var address1= defaultEmpty(isEmpty(subsidiarySearch) ? '' :  transfer(subsidiarySearch[0].getValue("address1","address",null)));//住所1
		var address2= defaultEmpty(isEmpty(subsidiarySearch) ? '' :  transfer(subsidiarySearch[0].getValue("address2","address",null)));//住所1
		var address3= defaultEmpty(isEmpty(subsidiarySearch) ? '' :  transfer(subsidiarySearch[0].getValue("city","address",null)));//住所1
		var zip= defaultEmpty(isEmpty(subsidiarySearch) ? '' :  transfer(subsidiarySearch[0].getValue("zip","address",null)));//住所1
		var legaValue= defaultEmpty(isEmpty(subsidiarySearch) ? '' :  transfer(subsidiarySearch[0].getValue("legalname")));//住所1
		var country='';
		if(!isEmpty(subsidiaryId)){
			if(subsidiaryId == '1'){
				country = 'SG';
			}else if(subsidiaryId == '2'){
				country = '中国';
			}else if(subsidiaryId == '3'){
				country = 'Thailand';
			}else if(subsidiaryId == '4'){
				country = 'Singapore';
			}
		}
		var billaddress = poRecord.getFieldValue('billaddress');//
		var custbody_cons_add = poRecord.getFieldValue('custbody_cons_add');//
		var terms  = poRecord.getFieldText('terms');//
		var custbody_me_incoterms = poRecord.getFieldValue('custbody_me_incoterms');//
		var itemList = poRecord.getLineItemCount('item');//アイテム明細部
		var poTempJParr = new Array();
		var poTempEngarr = new Array();
		var polanuagArr = new Array();
		var filePoArr = new Array();
		var filePoArr1 = new Array();
		var inquiriesArr = new Array();
		var cancleFlag=poRecord.getFieldValue('custbody_ogw_cancle');
		var changeFlag=poRecord.getFieldValue('custbody_ogw_po_change');	 
		var message = poRecord.getFieldValue('message');//仕入先メッセージ	
		var messageValuespe = '';
		var messageValue = '';
		if(!isEmpty(message)){
			messageValuespe = meaning(message);
			if(!isEmpty(messageValuespe)){
				messageValue = specialString(messageValuespe);
			}
		}
		var custbody2 = poRecord.getFieldValue('custbody2');//SHIPPING MARK
		var custbody2Value = '';
		if(!isEmpty(custbody2)){
			custbody2Value = meaning(custbody2);
		}
		if(itemList != 0) {
			 for(var s = 1; s <= itemList; s++){
				 var item = poRecord.getLineItemText('item', 'item', s);//アイテム
				 var itemNum = defaultEmpty(poRecord.getLineItemValue('item', 'custcol_number', s));//NUM
				 var pdfTemp = poRecord.getLineItemValue('item', 'custcol_ogw_po_pdf_temp', s);//発注書PDFテンプレート
				 var itmeLine = defaultEmpty(poRecord.getLineItemValue('item', 'line', s));//行
				 var custcol7 = defaultEmpty(poRecord.getLineItemValue('item', 'custcol7', s));
				 var custcol_etd = defaultEmpty(poRecord.getLineItemValue('item', 'custcol_etd', s));
				 var custcol_eta = defaultEmpty(poRecord.getLineItemValue('item', 'custcol_eta', s));
				 if(!isEmpty(custcol_eta)){
					 var etaJp = getOgawaDate(custcol_eta);
				 }else{
					 var etaJp = '';
				 }
				 var custcol1 = defaultEmpty(poRecord.getLineItemValue('item', 'custcol1', s));
				 var quantity = defaultEmpty(parseFloat(poRecord.getLineItemValue('item', 'quantity', s)));
				 var units_display = defaultEmpty(poRecord.getLineItemValue('item', 'units_display', s));
				 var ogw_inquiries = defaultEmpty(poRecord.getLineItemValue('item', 'custcol_ogw_inquiries', s));
				 var inquiriesValue = '';
				 if(!isEmpty(ogw_inquiries)){
					 if(pdfTemp == '1'){
						 inquiriesValue = ogw_inquiries.replace(/。/g,'。<br/>');
						 inquiriesArr.push(inquiriesValue);
					 }
				 }
				 var descriptionText = defaultEmpty(poRecord.getLineItemValue('item','description',s));//説明
				 var description='';
				 if(!isEmpty(descriptionText)){
					  description = specialString(descriptionText);
				 }
				 var rate = defaultEmpty(parseFloat(poRecord.getLineItemValue('item','rate',s)));//単価
				 if(!isEmpty(rate)){
					 var rateFormat = rate.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');	
				 }else{
					 var rateFormat = '';
				 }
				 
				 var amount = defaultEmpty(parseFloat(poRecord.getLineItemValue('item','amount',s)));//金額  
				 if(!isEmpty(amount)){
					 var invAmountFormat = amount.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');	
				 }else{
					 var invAmountFormat = '';
				 }
				 if(pdfTemp == '1'){ //日本語
					 polanuagArr.push("1");
					 poTempJParr.push({
						 item:item,
						 pdfTemp:pdfTemp,
						 itmeLine:itmeLine,
						 itemNum:itemNum,
						 custcol_etd:custcol_etd,
						 custcol1:custcol1,
						 quantity:quantity,
						 units_display:units_display,
						 custcol7:custcol7,
						 custcol_eta:custcol_eta,
						 etaJp:etaJp,
						 description:description,
					 });
				 }else if(pdfTemp == '2' || isEmpty(pdfTemp)){ //英語
					 polanuagArr.push("2");
					 poTempEngarr.push({
						 item:item,
						 pdfTemp:pdfTemp,
						 itmeLine:itmeLine,
						 itemNum:itemNum,
						 custcol_etd:custcol_etd,
						 custcol1:custcol1,
						 quantity:quantity,
						 units_display:units_display,
						 rate:rate,
						 rateFormat:rateFormat,
						 invAmountFormat:invAmountFormat,
						 custcol7:custcol7,
						 custcol_eta:custcol_eta,
					 });
				 }
				 
			 }
		}
			var newPolanuagArrEng = unique1(polanuagArr);
			var indexEng=newPolanuagArrEng.indexOf("2");
			if(indexEng >= 0 ){
				var str = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">'+ //英語PDF
				'<pdf>'+
				'<head>'+
				'<link name="NotoSans" type="font" subtype="truetype" src="${nsfont.NotoSans_Regular}" src-bold="${nsfont.NotoSans_Bold}" src-italic="${nsfont.NotoSans_Italic}" src-bolditalic="${nsfont.NotoSans_BoldItalic}" bytes="2" />'+
				'<#if .locale == "zh_CN">'+
				'<link name="NotoSansCJKsc" type="font" subtype="opentype" src="${nsfont.NotoSansCJKsc_Regular}" src-bold="${nsfont.NotoSansCJKsc_Bold}" bytes="2" />'+
				'<#elseif .locale == "zh_TW">'+
				'<link name="NotoSansCJKtc" type="font" subtype="opentype" src="${nsfont.NotoSansCJKtc_Regular}" src-bold="${nsfont.NotoSansCJKtc_Bold}" bytes="2" />'+
				'javascript:NLMultiButton_doAction(\'multibutton_pdfsubmit\', \'submitas\');return false;	<#elseif .locale == "ja_JP">'+
				'<link name="NotoSansCJKjp" type="font" subtype="opentype" src="${nsfont.NotoSansCJKjp_Regular}" src-bold="${nsfont.NotoSansCJKjp_Bold}" bytes="2" />'+
				'<#elseif .locale == "ko_KR">'+
				'<link name="NotoSansCJKkr" type="font" subtype="opentype" src="${nsfont.NotoSansCJKkr_Regular}" src-bold="${nsfont.NotoSansCJKkr_Bold}" bytes="2" />'+
				'<#elseif .locale == "th_TH">'+
				'<link name="NotoSansThai" type="font" subtype="opentype" src="${nsfont.NotoSansThai_Regular}" src-bold="${nsfont.NotoSansThai_Bold}" bytes="2" />'+
				'</#if>';
				str += '<macrolist>';
				str += '<macro id="nlheader">';
				str += '<table class="header" style="width: 100%;"><tr>';
				str += '<td rowspan="3" style="padding: 10px 0px 0px 0px;">';
				str += '<div><#if companyInformation.logoUrl?length != 0><img src="${companyInformation.logoUrl}" style="position: absolute; top: -50px; margin: 0px; width: 100%; height: 100%; float: left;" /></#if></div>';
				str += '</td>';
				if(cancleFlag=='T' && changeFlag == 'F'){					
					str +='<td align="center" style="vertical-align:middle;border:4px solid red;font-size:40px;"><b style="color:red;">Cancel</b></td>';
				}else if(changeFlag=='T' && cancleFlag == 'F'){
					str +='<td align="center" style="vertical-align:middle;border:4px solid red;font-size:40px;"><b style="color:red;">Change Order</b></td>';
				}else if(cancleFlag == 'T' && changeFlag == 'T'){
					str +='<td align="center" style="vertical-align:middle;border:4px solid red;font-size:40px;"><b style="color:red;">Cancel</b></td>';
				}
				str += '<td align="right" style="padding: 10px 0px 0px 40px;"><span class="nameandaddress">'+legaValue+'</span><br /><span class="nameandaddress">'+address1+'<br />'+address2+'<br />'+address3+" "+zip+'<br />'+country+'</span><br /><span class="nameandaddress">GST register no: 201230468G</span></td>';
				str += '</tr></table>';
				str += ' </macro>';
				str += '<macro id="nlfooter">';
				str += '<table class="footer" style="width: 100%;"><tr>';
				str += '<td>&nbsp;</td>';
				str += '<!--<td align="right"><pagenumber/> of <totalpages/></td>-->';
				str += '</tr></table>';
				str += '</macro>';
				str += '</macrolist>';
				str += '<style type="text/css">* {';
				str += '<#if .locale == "zh_CN">';
				str += 'font-family: NotoSans, NotoSansCJKsc, sans-serif;';
				str += '<#elseif .locale == "zh_TW">';
				str += 'font-family: NotoSans, NotoSansCJKtc, sans-serif;';
				str += '<#elseif .locale == "ja_JP">';
				str += 'font-family: NotoSans, NotoSansCJKjp, sans-serif;';
				str += '<#elseif .locale == "ko_KR">';
				str += 'font-family: NotoSans, NotoSansCJKkr, sans-serif;';
				str += '<#elseif .locale == "th_TH">';
				str += 'font-family: NotoSans, NotoSansThai, sans-serif;';
				str += '<#else>';
				str += 'font-family: NotoSans, sans-serif;';
				str += '</#if>';
				str += '}';
				str += 'table {font-size: 9pt;table-layout: fixed;}';
				str += 'th {font-weight: bold;font-size: 8pt;vertical-align: middle;padding: 5px 6px 3px; color: #333333;}';
				str += 'td {padding: 4px 6px;}';
				str += 'td p { align:left }';
				str += 'b {font-weight: bold;color: #333333;}';
				str += 'table.header td {padding: 0;font-size: 10pt;}';
				str += 'table.footer td {padding: 0;font-size: 8pt;}';
				str += 'table.itemtable th {padding-bottom: 5px;padding-top: 5px;font-size: 8pt;}';
				str += 'table.itemtable td {padding-bottom: 12px;padding-top: 12px;font-size: 7pt;}';
				str += 'table.body td {padding-top: 2px;}';
				str += 'table.total {padding: 0;font-size: 10pt;}';
				str += 'tr.totalrow {background-color: #e3e3e3;line-height: 200%;}';
				str += 'td.totalboxtop {font-size: 12pt;background-color: #e3e3e3;}';
				str += 'td.addressheader {font-size: 8pt;padding-top: 6px;padding-bottom: 2px;}';
				str += 'td.address {padding-top: 0;}';
				str += 'td.totalboxmid {font-size: 28pt;padding-top: 20px;background-color: #e3e3e3;}';
				str += 'td.totalboxbot {background-color: #e3e3e3;font-weight: bold;}';
				str += 'span.title {font-size: 20pt;}';
				str += 'span.number {font-size: 10pt;}';
				str += 'span.itemname {font-weight: bold;line-height: 150%;}';
				str += 'td.titleboxbot {border-left: 1px;border-bottom:1px;height:15px;line-height:15px;}'; //change by song add 23030329
				str += '</style>';
				str += '</head>';
				str += '<body header="nlheader" header-height="12%" footer="nlfooter" footer-height="20pt" padding="0.5in 0.5in 0.5in 0.5in" size="Letter">';
				str += '<table style="width: 100%;border:0.6px;border-top-style: dashed;border-right-style: none;  border-bottom-style: none;  border-left-style: none;"><tr><td> &nbsp;</td></tr></table>';
				str += '<table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tr>';
				str += '<td align="right"><span class="title" aling="right">Purchase Order</span></td>';
				str += '<td align="right">Purchase Order Number&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="number">${record.tranid}</span>';
				str += '<br />Order Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="number">${record.trandate}</span></td>';
				str += '</tr></table>';	
				str += '<table style="width: 100%;border:0.6px;border-top-style: dashed;border-right-style: none;  border-bottom-style: none;  border-left-style: none;">';
				str += '<tr style="border-bottom:0.6px;border-bottom-style: dashed;">';
				str += '<td class="addressheader" colspan="6" style="border-right:1px;border-right-style: solid;"><b>vendor</b><br/><br/><b>'+entityTo+'</b><br />&nbsp;</td>';
				str += '<td class="addressheader" colspan="5">&nbsp;</td>';
				str += '</tr>';
				str += '<tr>';
				str += '<td class="addressheader" colspan="6" style="border-right:1px;border-right-style: solid;"><b>Consignee</b><br/><br/><b>${record.custbody_cons_add}</b></td>';
				str += '<td class="addressheader" colspan="5"><b>Payment:&nbsp;&nbsp;&nbsp;&nbsp;${record.terms}</b><br /><br /><b>Incoterm:&nbsp;&nbsp;&nbsp;&nbsp;${record.custbody_me_incoterms}</b><br /><br /><b>Currency:&nbsp;&nbsp;&nbsp;&nbsp;${subsidiary.currency}</b><br /><br /><b>Issued by:&nbsp;&nbsp;&nbsp;&nbsp;${record.employee}</b><br /></td>';
				str += '</tr>';
				str += '</table>';
				str += '<table style="width: 100%;border:0.6px;border-top-style: none;border-right-style: none;  border-bottom-style: none;  border-left-style: none;"><tr><td> &nbsp;</td></tr></table>';
				str += '<table style="width: 100%;border:0.6px;border-top-style: dashed;border-right-style: none;  border-bottom-style: none;  border-left-style: none;"><tr><td> &nbsp;</td></tr></table>';
				str += '<table class="itemtable" style="width: 100%;border-bottom:none;" border="1" cellpadding="0" cellspacing="0">';
				str += '<thead>';
				str += '<tr>';
				str += '<th align="left" colspan="2" style="border-bottom:1px;height:15px;line-height:15px;">&nbsp;&nbsp;No</th>'; //change by song add 23030329
				str += '<th align="left" colspan="5" style="border-left: 1px;border-bottom:1px;" >&nbsp;&nbsp;Description</th>';
				str += '<th align="left" colspan="4" style="border-left: 1px;border-bottom:1px;" >&nbsp;&nbsp;Cust. PO#</th>';
				str += '<th align="left" colspan="3" style="border-left: 1px;border-bottom:1px;" >&nbsp;&nbsp;ETD</th>';
				str += '<th align="left" colspan="3" style="border-left: 1px;border-bottom:1px;" >&nbsp;&nbsp;ETA</th>';
				str += '<th align="left" colspan="6" style="border-left: 1px;border-bottom:1px;" >&nbsp;&nbsp;Packing Details</th>';
				str += '<th align="left" colspan="3" style="border-left: 1px;border-bottom:1px;">&nbsp;&nbsp;Quantity</th>';
				str += '<th align="left" colspan="4" style="border-left: 1px;border-bottom:1px;" >&nbsp;&nbsp;Unit Type</th>';//change by song add 23030329
				str += '<th align="left" colspan="4" style="border-left: 1px;border-bottom:1px;" >&nbsp;&nbsp;Unit Price</th>';
				str += '<th align="left" colspan="4" style="border-left: 1px;border-bottom:1px;" >&nbsp;&nbsp;Amount</th>';
				str += '</tr>';
				str += '</thead>';  
				for(var j =0;j<poTempEngarr.length;j++){
					str += '<tr>';
					str += '<td align="left" colspan="2" style="border-bottom: 1px;height:15px;line-height:15px;">&nbsp;&nbsp;'+poTempEngarr[j].itemNum+'</td>';//change by song add 23030329
					str += '<td align="left" colspan="5" class="titleboxbot">&nbsp;&nbsp;'+poTempEngarr[j].item+'</td>';
					str += '<td align="left" colspan="4" class="titleboxbot">&nbsp;&nbsp;'+poTempEngarr[j].custcol7+'</td>';
					str += '<td align="left" colspan="3" class="titleboxbot">&nbsp;&nbsp;'+poTempEngarr[j].custcol_etd+'</td>';
					str += '<td align="left" colspan="3" class="titleboxbot">&nbsp;&nbsp;'+poTempEngarr[j].custcol_eta+'</td>';
					str += '<td align="left" colspan="6" class="titleboxbot">&nbsp;&nbsp;'+poTempEngarr[j].custcol1+'</td>';
					str += '<td align="right" colspan="3" class="titleboxbot">'+poTempEngarr[j].quantity+'&nbsp;&nbsp;</td>';
					str += '<td align="left" colspan="4" class="titleboxbot">&nbsp;&nbsp;'+poTempEngarr[j].units_display+'</td>';
					str += '<td align="right" colspan="4" class="titleboxbot">'+poTempEngarr[j].rateFormat+'&nbsp;&nbsp;</td>';
					str += '<td align="right" colspan="4" class="titleboxbot">'+poTempEngarr[j].invAmountFormat+'&nbsp;&nbsp;</td>';	
					str += '</tr>';
				}
				str += '</table>';
				str += '<table style="width: 100%;">';
				str += '<tr>';
				str += '<td colspan ="26">&nbsp;</td>';
				str += '<td align="right" style="border-left: 1px;border-right:1px;border-bottom:1px;" cellpadding="0" cellspacing="0" colspan ="4">Total</td>';
				str += '<td align="right" style="border-right:1px;border-bottom:1px;" cellpadding="0" cellspacing="0" colspan ="8">${record.total}</td>';
				str += '</tr>';
				str += '</table>';	
				str += '<table style="width: 100%;">';
				str += '<tr>';
				str += '<td>&nbsp;</td>';
				str += '</tr>';
				str += '</table>';	
				str += '<table style="width: 100%;">';
				str += '<tr>';
				str += '<td style="width:15%;" aling="left">Shipping Mark:</td>';
				str += '</tr>';
				str += '<tr>';
				str += '<td style="width:85%;" aling="left">'+custbody2Value+'</td>';
				str += '</tr>';
				str += '<tr>';
				str += '<td>&nbsp;</td>';
				str += '</tr>';
				str += '</table>';
				str += '</body>';
				str += '</pdf>';
				var renderer = nlapiCreateTemplateRenderer();
				renderer.setTemplate(str);
				var record=nlapiLoadRecord('purchaseorder', poId);
				renderer.addRecord('record', record);
				var xml = renderer.renderToString();
				var xlsFile = nlapiXMLToPDF(xml);	
				// PDF
				xlsFile.setName('PDF' + '_' + getFormatYmdHms()+ '_' +RondomStr() +'.pdf');
				xlsFile.setFolder(pdfFolder);
				xlsFile.setIsOnline(true);
				var fileID = nlapiSubmitFile(xlsFile);
				filePoArr.push(fileID);
			}
		
			var newInquiriesArr = unique1(inquiriesArr);
			var newPolanuagArr = unique1(polanuagArr);
			var index=newPolanuagArr.indexOf("1");
			if(index >= 0 ){
				nlapiLogExecution('DEBUG', 'JP', 'JP');	
				var str = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">'+ //日本語PDF
				'<pdf>'+
				'<head>'+
				'<link name="NotoSans" type="font" subtype="truetype" src="${nsfont.NotoSans_Regular}" src-bold="${nsfont.NotoSans_Bold}" src-italic="${nsfont.NotoSans_Italic}" src-bolditalic="${nsfont.NotoSans_BoldItalic}" bytes="2" />'+
				'<#if .locale == "zh_CN">'+  //
				'<link name="NotoSansCJKsc" type="font" subtype="opentype" src="${nsfont.NotoSansCJKsc_Regular}" src-bold="${nsfont.NotoSansCJKsc_Bold}" bytes="2" />'+
				'<#elseif .locale == "zh_TW">'+
				'<link name="NotoSansCJKtc" type="font" subtype="opentype" src="${nsfont.NotoSansCJKtc_Regular}" src-bold="${nsfont.NotoSansCJKtc_Bold}" bytes="2" />'+
				'<#elseif .locale == "en">'+
				'<link name="NotoSansCJKjp" type="font" subtype="opentype" src="${nsfont.NotoSansCJKjp_Regular}" src-bold="${nsfont.NotoSansCJKjp_Bold}" bytes="2" />'+
				'<#elseif .locale == "ja_JP">'+
				'<link name="NotoSansCJKjp" type="font" subtype="opentype" src="${nsfont.NotoSansCJKjp_Regular}" src-bold="${nsfont.NotoSansCJKjp_Bold}" bytes="2" />'+
				'<#elseif .locale == "ko_KR">'+
				'<link name="NotoSansCJKkr" type="font" subtype="opentype" src="${nsfont.NotoSansCJKkr_Regular}" src-bold="${nsfont.NotoSansCJKkr_Bold}" bytes="2" />'+
				'<#elseif .locale == "th_TH">'+
				'<link name="NotoSansThai" type="font" subtype="opentype" src="${nsfont.NotoSansThai_Regular}" src-bold="${nsfont.NotoSansThai_Bold}" bytes="2" />'+
				
				'</#if>';	
				str += '<macrolist>';
				str += '<macro id="nlheader">';
				str += '<table class="header" style="width: 100%;"><tr>';
				str += '<td rowspan="3" style="padding: 10px 0px 0px 0px;">';
				str += '<div><#if companyInformation.logoUrl?length != 0><img src="${companyInformation.logoUrl}" style="position: absolute; top: -50px; margin: 0px; width: 100%; height: 100%; float: left;" /></#if></div>';
				str += '</td>';
				if(cancleFlag=='T' && changeFlag == 'F'){					
					str +='<td align="center" style="vertical-align:middle;border:4px solid red;font-size:40px;"><b style="color:red;">キャンセル</b></td>';
				}else if(changeFlag=='T' && cancleFlag == 'F'){
					str +='<td align="center" style="vertical-align:middle;border:4px solid red;font-size:40px;"><b style="color:red;">変更</b></td>';
				}else if(cancleFlag == 'T' && changeFlag == 'T'){
					str +='<td align="center" style="vertical-align:middle;border:4px solid red;font-size:40px;"><b style="color:red;">キャンセル</b></td>';
				}
				str += '<td align="right" style="padding: 10px 0px 0px 40px;"><span class="nameandaddress">'+legaValue+'</span><br /><span class="nameandaddress">'+address1+'<br />'+address2+'<br />'+address3+" "+zip+'<br />'+country+'</span><br /><span class="nameandaddress">GST register no: 201230468G</span></td>';
				str += '</tr></table>';
				str += ' </macro>';
				str += '<macro id="nlfooter">';
				str += '<table class="footer" style="width: 100%;"><tr>';
				str += '<td>&nbsp;</td>';
				str += '<!--<td align="right"><pagenumber/> of <totalpages/></td>-->';
				str += '</tr></table>';
				str += '</macro>';
				str += '</macrolist>';
				str += '<style type="text/css">* {';
				str += '<#if .locale == "zh_CN">';
				str += 'font-family: NotoSans, NotoSansCJKsc, sans-serif;';
				str += '<#elseif .locale == "zh_TW">';
				str += 'font-family: NotoSans, NotoSansCJKtc, sans-serif;';
				str += '<#elseif .locale == "en">';
				str += 'font-family: NotoSans, NotoSansCJKjp, sans-serif;';
				str += '<#elseif .locale == "ja_JP">';
				str += 'font-family: NotoSans, NotoSansCJKjp, sans-serif;';
				str += '<#elseif .locale == "ko_KR">';
				str += 'font-family: NotoSans, NotoSansCJKkr, sans-serif;';
				str += '<#elseif .locale == "th_TH">';
				str += 'font-family: NotoSans, NotoSansThai, sans-serif;';
				str += '<#else>';
				str += 'font-family: NotoSans, sans-serif;';
				str += '</#if>';
				str += '}';
				str += 'table {font-size: 9pt;table-layout: fixed;}';
				str += 'th {font-weight: bold;font-size: 8pt;vertical-align: middle;padding: 5px 6px 3px; color: #333333;}';
				str += 'td {padding: 4px 6px;}';
				str += 'td p { align:left }';
				str += 'b {font-weight: bold;color: #333333;}';
				str += 'table.header td {padding: 0;font-size: 10pt;}';
				str += 'table.footer td {padding: 0;font-size: 8pt;}';
				str += 'table.itemtable th {padding-bottom: 5px;padding-top: 5px;font-size: 8pt;}';
				str += 'table.itemtable td {padding-bottom: 12px;padding-top: 12px;font-size: 7pt;}';
				str += 'table.body td {padding-top: 2px;}';
				str += 'table.total {padding: 0;font-size: 10pt;}';
				str += 'tr.totalrow {background-color: #e3e3e3;line-height: 200%;}';
				str += 'td.totalboxtop {font-size: 12pt;background-color: #e3e3e3;}';
				str += 'td.addressheader {font-size: 8pt;padding-top: 6px;padding-bottom: 2px;}';
				str += 'td.address {padding-top: 0;}';
				str += 'td.totalboxmid {font-size: 28pt;padding-top: 20px;background-color: #e3e3e3;}';
				str += 'td.totalboxbot {background-color: #e3e3e3;font-weight: bold;}';
				str += 'span.title {font-size: 20pt;}';
				str += 'span.number {font-size: 10pt;}';
				str += 'span.itemname {font-weight: bold;line-height: 150%;}';
				str += 'td.titleboxbot {border-left: 1px;border-bottom:1px;height:15px;line-height:15px;}'; //vertical-align:middle;
				str += '</style>';
				str += '</head>';
				str += '<body header="nlheader" header-height="12%" footer="nlfooter" footer-height="20pt" padding="0.5in 0.5in 0.5in 0.5in" size="Letter">';
				str += '<table style="width: 100%;border:0.6px;border-top-style: dashed;border-right-style: none;  border-bottom-style: none;  border-left-style: none;"><tr><td> &nbsp;</td></tr></table>';
				str += '<table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tr>';
				str += '<td align="right"><span class="title" aling="right">発注書</span></td>';
				str += '<td align="right">PO番号&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="number">${record.tranid}</span>';
				str += '<br />発注日&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="number">'+trandateJp+'</span></td>';
				str += '</tr></table>';		
				str += '<table style="width: 100%;border:0.6px;border-top-style: dashed;border-right-style: none;  border-bottom-style: none;  border-left-style: none;">';
				str += '<tr style="border-bottom:0.6px;border-bottom-style: dashed;">';
				str += '<td class="addressheader" colspan="4"><b>仕入先&nbsp;&nbsp;'+vendorId+'</b><br/><br/><b>'+entityTo+'</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>御中</b><br />&nbsp;</td>';
				str += '<td colspan="6" style="border-left:1px;border-left-style: solid;margin-left:-7px;">&nbsp;</td>'
				str += '</tr>';
				str += '<tr>'; 
				str += '<td class="addressheader" colspan="4"><b>納入場所</b>';
				str += '<table>';		
				str += '<tr>'; 
				str += '<td style="margin-left:-6px;"><b>${record.custbody_cons_add}</b></td>';
				str += '</tr>';
				str += '</table>';
				str += '</td>';
				str += '<td colspan="6" style="border-left:1px;border-left-style: solid;margin-left:-7px;" class="addressheader"><b>&nbsp;&nbsp;&nbsp;問い合わせ先</b>';
				str += '<table>';	
				for(var j =0;j<newInquiriesArr.length;j++){
					str += '<tr>'; 
					str += '<td  style="width:100%;font-size: 8pt;font-weight: bold">'+newInquiriesArr[j]+'</td>';
					str += '</tr>';
				}	
				str += '</table>';
				str += '</td>';
				str += '</tr>';
				str += '</table>';
				str += '<table style="width: 100%;border:0.6px;border-top-style: none;border-right-style: none;  border-bottom-style: none;  border-left-style: none;"><tr><td> &nbsp;</td></tr></table>';
				str += '<table style="width: 100%;border:0.6px;border-top-style: dashed;border-right-style: none;  border-bottom-style: none;  border-left-style: none;"><tr><td> &nbsp;</td></tr></table>';			
				str += '<table class="itemtable" style="width: 100%;border-bottom:none;table-layout: fixed;" border="1" cellpadding="0" cellspacing="0">';
				str += '<thead>';
				str += '<tr>';
				str += '<th align="left" colspan="3" style="border-bottom:1px;" >&nbsp;&nbsp;No</th>';//change by song add 23030329
				str += '<th align="left" colspan="5" style="border-left: 1px;border-bottom:1px;" >&nbsp;&nbsp;発注品名</th>';
				str += '<th align="left" colspan="4" style="border-left: 1px;border-bottom:1px;" >&nbsp;&nbsp;Cust. PO#</th>';
				str += '<th align="left" colspan="3" style="border-left: 1px;border-bottom:1px;" >&nbsp;&nbsp;品番</th>';
				str += '<th align="left" colspan="3" style="border-left: 1px;border-bottom:1px;" >&nbsp;&nbsp;納期</th>';
				str += '<th align="left" colspan="6" style="border-left: 1px;border-bottom:1px;" >&nbsp;&nbsp;入目×個数</th>';
				str += '<th align="left" colspan="3" style="border-left: 1px;border-bottom:1px;">&nbsp;&nbsp;数量</th>';
				str += '<th align="left" colspan="3" style="border-left: 1px;border-bottom:1px;" >&nbsp;&nbsp;単位</th>';
				str += '</tr>';
				str += '</thead>';  
				for(var j =0;j<poTempJParr.length;j++){
					str += '<tr>';
					str += '<td align="left" colspan="3" style="border-bottom: 1px;height:15px;line-height:15px;">&nbsp;&nbsp;'+poTempJParr[j].itemNum+'</td>';//change by song add 23030329
					str += '<td align="left" colspan="5" class="titleboxbot" >&nbsp;&nbsp;'+poTempJParr[j].description+'</td>';
					str += '<td align="left" colspan="4" class="titleboxbot" >&nbsp;&nbsp;'+poTempJParr[j].custcol7+'</td>';
					str += '<td align="left" colspan="3" class="titleboxbot">&nbsp;&nbsp;'+poTempJParr[j].item+'</td>';
					str += '<td align="left" colspan="3" class="titleboxbot">&nbsp;&nbsp;'+poTempJParr[j].etaJp+'</td>';
					str += '<td align="left" colspan="6" class="titleboxbot" >&nbsp;&nbsp;'+poTempJParr[j].custcol1+'</td>';
					str += '<td align="right" colspan="3" class="titleboxbot" >'+poTempJParr[j].quantity+'&nbsp;&nbsp;</td>';
					str += '<td align="left" colspan="3" class="titleboxbot" >&nbsp;&nbsp;'+poTempJParr[j].units_display+'</td>';
					str += '</tr>';
				}
				str += '</table>';
				str += '<table style="width: 100%;">';
				str += '<tr>';
				str += '<td>&nbsp;</td>';
				str += '</tr>';
				str += '</table>';	
				str += '<table style="width: 100%;">';
				str += '<tr>';
				str += '<td style="width:10%;" aling="left">備考:</td>';
				str += '</tr>';
				str += '<tr>';
				str += '<td style="width:90%;" aling="left">'+messageValue+'</td>';
				str += '</tr>';
				str += '<tr>';
				str += '<td>&nbsp;</td>';
				str += '</tr>';
				str += '</table>';
				str += '<table style="width: 100%;">';
				str += '<tr>';
				str += '<td  aling="left" style="width: 49%;border-left:1px;border-right:1px;margin-right:3px;border-top:1px;" colspan="4">(返信欄)</td>';
				str += '<td style="width: 49%">&nbsp;</td>';
				str += '</tr>';
				
				str += '<tr>';
				str += '<td align="left" style="border-left:1px;"><input type="checkbox" name="checkbox1" value="1"/></td>';
				str += '<td align="left" colspan="3" style="margin-left:-55px;border-right:1px;margin-right:3px;">指定納期に全量納品可能</td>';
				str += '<td style="width: 49%">&nbsp;</td>';
				str += '</tr>';
				
				str += '<tr>';
				str += '<td align="left" style="border-left:1px;"></td>'
				str += '<td align="left" colspan="3" style="margin-left:-55px;border-right:1px;margin-right:3px;"></td>';
				str += '<td style="width: 49%">&nbsp;</td>';
				str += '</tr>';
				
				str += '<tr>';
				str += '<td align="left" style="border-left:1px;"><input type="checkbox" name="checkbox2" value="2"/></td>';
				str += '<td align="left" colspan="3" style="margin-left:-55px;border-right:1px;margin-right:3px;">在庫あり、手配中 納期確定後に再連絡</td>';
				str += '<td style="width: 49%">&nbsp;</td>';
				str += '</tr>';		
				
				str += '<tr>';
				str += '<td align="left" style="border-left:1px;"></td>'
				str += '<td align="left" colspan="3" style="margin-left:-55px;border-right:1px;margin-right:3px;"></td>';
				str += '<td style="width: 49%">&nbsp;</td>';
				str += '</tr>';
				
				str += '<tr>';
				str += '<td align="left" style="border-left:1px;"><input type="checkbox" name="checkbox3" value="3"/></td>';
				str += '<td aling="left" colspan="3" style="margin-left:-55px;border-right:1px;margin-right:3px;">在庫なし、納期未定（約__週間後、約__か月後見込み）</td>';
				str += '<td style="width: 49%">&nbsp;</td>';
				str += '</tr>';		
				
				str += '<tr>';
				str += '<td align="left" style="border-left:1px;"></td>'
				str += '<td align="left" colspan="3" style="margin-left:-55px;border-right:1px;margin-right:3px;"></td>';
				str += '<td style="width: 49%">&nbsp;</td>';
				str += '</tr>';
				
				str += '<tr>';
				str += '<td align="left" style="border-left:1px;"></td>';
				str += '<td aling="left" colspan="3" style="margin-left:-55px;border-right:1px;margin-right:3px;"></td>';
				str += '<td style="width: 49%">&nbsp;</td>';
				str += '</tr>';
				
				str += '<tr>';
				str += '<td align="left" style="border-left:1px;"><input type="checkbox" name="checkbox4" value="4"/></td>';
				str += '<td align="left" colspan="3" style="margin-left:-55px;margin-right:3px;border-right:1px;">納期変更（&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ⇒&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;に変更）</td>';
				str += '<td style="width: 49%">&nbsp;</td>';
				str += '</tr>';		
				
				str += '<tr>';
				str += '<td align="left" style="border-left:1px;"></td>'
				str += '<td align="left" colspan="3" style="margin-left:-55px;border-right:1px;margin-right:3px;"></td>';
				str += '<td style="width: 49%">&nbsp;</td>';
				str += '</tr>';
				
				str += '<tr>';
				str += '<td align="left" style="border-left:1px;"><input type="checkbox" name="checkbox5" value="5"/></td>';
				str += '<td align="left" colspan="3" style="margin-left:-55px;margin-right:3px;border-right:1px;">数量変更（&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; k&nbsp;g⇒&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;k&nbsp;gに変更）</td>';
				str += '<td style="width: 49%">&nbsp;</td>';
				str += '</tr>';			
				
				str += '<tr>';
				str += '<td align="left" style="border-left:1px;"></td>'
				str += '<td align="left" colspan="3" style="margin-left:-55px;border-right:1px;margin-right:3px;"></td>';
				str += '<td style="width: 49%">&nbsp;</td>';
				str += '</tr>';
				
				str += '<tr>';
				str += '<td align="left" style="border-left:1px;"></td>';
				str += '<td align="left" colspan="3" style="margin-left:-55px;border-right:1px;margin-right:3px;"></td>';
				str += '<td style="width: 49%">&nbsp;</td>';
				str += '</tr>';			
				str += '<tr>';
				str += '<td align="left" style="border-left:1px;border-bottom:1px;"></td>';
				str += '<td align="left" colspan="3" style="margin-left:-55px;border-right:1px;border-bottom:1px;margin-right:3px;"></td>';
				str += '<td style="width: 49%">&nbsp;</td>';
				str += '</tr>';			
				str += '<tr>';
				str += '<td align="left" colspan="4">受信確認のため返信をお願いします</td>';
				str += '<td style="width: 49%">&nbsp;</td>';
				str += '</tr>';
				str += '</table>';	
				str += '</body>';
				str += '</pdf>';			
				var renderer = nlapiCreateTemplateRenderer();
				renderer.setTemplate(str);
				var record=nlapiLoadRecord('purchaseorder', poId);
				renderer.addRecord('record', record);
				var xml = renderer.renderToString();
				var xlsFile = nlapiXMLToPDF(xml);	
				xlsFile.setName('PDF' + '_' + getFormatYmdHms()+ '_' +RondomStr() +'.pdf');
				xlsFile.setFolder(pdfFolder);
				xlsFile.setIsOnline(true);
				var fileID = nlapiSubmitFile(xlsFile);
				filePoArr1.push(fileID);	
			}
		for(var i in filePoArr1){
			filePoArr.push(filePoArr1[i])
		}
		return filePoArr;
	}
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

function defaultEmpty(src){
	return src || '';
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

function getOgawaDate(str){	
	 var etaJp = nlapiStringToDate(str);
	 var etaJp_year = etaJp.getFullYear();
	 var etaJp_month = etaJp.getMonth()+1;
	 var etaJp_day = etaJp.getDate();
	 date = (etaJp_year + '/' + etaJp_month + '/' + etaJp_day).toString();
	 return date;
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

function transfer(text){
	if ( typeof(text)!= "string" )
   text = text.toString() ;

text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

return text ;
}

function meaning (str){
	var meaningString = str.replace(/\n/g,'<br/>');
	return  meaningString;
}