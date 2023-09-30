/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       2023/02/10     CPC_�v
 *
 */
var invoicePDF = '438';
/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */

var invoice_ogj_custform = "240"

function suitelet(request, response){
	try{
		nlapiLogExecution('DEBUG', 'start', 'start');
		var invoiceId = request.getParameter('invoiceid'); //������ID
		var invoiceRecord=nlapiLoadRecord('invoice', invoiceId);//������
		var custForm = invoiceRecord.getFieldValue("customform");//�������J�X�^���E�t�H�[��
        var headerInvoiceDate = invoiceRecord.getFieldValue("custbody21");//�������J�X�^���E�t�H�[��
		if(custForm == invoice_ogj_custform){ //OGJ
			var operatorName = "Ogawa Flavors" +" "+ "&amp;" +" "+"Fragrances (Singapore)Pte. Ltd."; //���s���Ǝ҂̎���
            // 2023.09.29 F.Saito add start ***
            var location = "51 Science Park Road";
            var address = "Science Park II, #04-24, The Aries, Singapore 117586";
            // 2023.09.29 F.Saito add end   ***
			var invoiceCustId = invoiceRecord.getFieldValue("entity") //�ڋqID
			var invoiceCustname=nlapiLookupField('customer', invoiceCustId, 'altname');  //�ڋq���O
			if(!isEmpty(invoiceCustname)){
				var custName = invoiceCustname.indexOf("&");
				if(custName < 0 ){
					var newCustName = invoiceCustname;
				}else{
					var newCustName1 = getCaption(invoiceCustname,0);
					var newCustName2 = getCaption(invoiceCustname,1);
					var newCustName = newCustName1 + "&amp;" + newCustName2;
				}
			}	
          
			var invCreatedfrom = invoiceRecord.getFieldValue('createdfrom');//�쐬��
			var newVendorName = '';
			var VendorNameArr = new Array();
			var poVendorArr = new Array();
			if(!isEmpty(invCreatedfrom)){
				var soRecord = nlapiLoadRecord('salesorder', invCreatedfrom);
				var soCount = soRecord.getLineItemCount('item');
				for (var i = 1; i < soCount + 1; i++) {
					var poVendor = soRecord.getLineItemValue('item','povendor', i);
					poVendorArr.push(poVendor);
				}
				poVendorArr=unique(poVendorArr);
				var vendorSearch = getSearchResults("vendor",null,
						[
						   ["internalid","anyof",poVendorArr]
						], 
						[
						   new nlobjSearchColumn("entityid"),
						   new nlobjSearchColumn("altname"),
						]
						);
				if(!isEmpty(vendorSearch)){
					for(var k = 0 ; k < vendorSearch.length; k++){
						var vendorEntityid = vendorSearch[k].getValue("entityid");
						var vendorAltname = vendorSearch[k].getValue("altname");
						var custName = vendorEntityid + " " + vendorAltname;
						if(!isEmpty(custName)){
							var vendorName = custName.indexOf("&");
							if(vendorName < 0 ){
								newVendorName = custName;
							}else{
								var newCustName1 = getCaption(custName,0);
								var newCustName2 = getCaption(custName,1);
								newVendorName = newCustName1 + "&amp;" + newCustName2;
							}
							VendorNameArr.push(newVendorName);
						}
					}
				}	
			}
          
          
			var currency = invoiceRecord.getFieldText("currency") //�ʉ�
			var itemList = invoiceRecord.getLineItemCount('item');//�A�C�e������
			var invoiceItem = new Array();	
			var amountJpyTotal = 0;//���z(�œ�)���vJpy
			var taxamountJpyTotal = 0;//�Ŋz���vJpy
			var amountJpyTotal_eight = 0; //���z���v   8% Jpy
			var taxamountJpyTotal_eight = 0;//�Ŋz���v 8% Jpy
			var amountJpyTotal_ten = 0;//���z���v   10% Jpy
			var taxamountJpyTota1_ten = 0;//�Ŋz 10% Jpy
			var grossamtArr = 0; //���z(�œ�)���v
			var taxamountArr = 0;//�Ŋz���v
			var amountArr_eight = 0;//���z���v  8%
			var taxamountArr_eight = 0;//�Ŋz���v  8%
			var amountArr_ten = 0;//���z���v  10%
			var taxamountArr_ten = 0;//�Ŋz���v  10%
			var amountzero = ".00";
			if(itemList != 0) {
				for(var s = 1; s <= itemList; s++){
                    // 2023.09.29 F.Saito mod start ***
//					var itemName = invoiceRecord.getLineItemText('item', 'item', s);//�A�C�e��
					var itemName = invoiceRecord.getLineItemText('item', 'item', s).split("_")[0]||"";//�A�C�e��
                    // 2023.09.29 F.Saito mod end   ***
					var itemNum = defaultEmpty(invoiceRecord.getLineItemValue('item', 'custcol_number', s));//NUMBER
					var taxrate1 = defaultEmpty(invoiceRecord.getLineItemValue('item','taxrate1',s));//�ŗ� 
					var olddescription = defaultEmpty(invoiceRecord.getLineItemValue('item','description',s));//����
						var descriptionName = olddescription.indexOf("&");
						if(descriptionName < 0 ){
							var description = olddescription;
						}else {
							var newCustName1 = getCaption(olddescription,0);
							var newCustName2 = getCaption(olddescription,1);
							var description = newCustName1 + "&amp;" + newCustName2;
						}
					
					var custcol7 = defaultEmpty(invoiceRecord.getLineItemValue('item','custcol7',s));//CUST. PO#  
					var etaValue = defaultEmpty(invoiceRecord.getLineItemValue('item','custcol_eta',s));//ETA
					var custcol1 = defaultEmpty(invoiceRecord.getLineItemValue('item','custcol1',s));//PACKING DETAILS
					var oldQuantity =defaultEmpty(parseFloat(invoiceRecord.getLineItemValue('item','quantity',s)));//����
					var custcol4 = defaultEmpty(invoiceRecord.getLineItemValue('item','units_display',s));//�P��  
					var taxcode_display = defaultEmpty(invoiceRecord.getLineItemValue('item','taxcode_display',s));//�ŋ��R�[�h
					var custcol_etd = defaultEmpty(invoiceRecord.getLineItemValue('item','custcol_etd',s));//etd
					var grossamt = defaultEmpty(parseFloat(invoiceRecord.getLineItemValue('item','grossamt',s)));//���z
					var rate = defaultEmpty(parseFloat(invoiceRecord.getLineItemValue('item','rate',s)));//�P��
					var amount = defaultEmpty(parseFloat(invoiceRecord.getLineItemValue('item', 'amount', s)));//���z
					var tax1amt = defaultEmpty(parseFloat(invoiceRecord.getLineItemValue('item', 'tax1amt', s)));//�Ŋz
					if(currency == 'JPY'){
						if(!isEmpty(oldQuantity)){
							var quantityJpy = oldQuantity;//formatNumber(oldQuantity);//����Jpy      
						}else{
							var quantityJpy = '';     
						}  
						if(!isEmpty(rate)){
							var rateJpy = formatNumber(rate); //�P��JPY 
						}else{
							var rateJpy = '';    
						}
						if(!isEmpty(amount)){
							var amountJpy = formatNumber(amount);//���zJpy
						}else{
							var amountJpy = '';    
						}     
                      
                      
						if(!isEmpty(grossamt)){ //���z(�œ�)���vJpy
							amountJpyTotal += parseFloat(grossamt);
							var amountTotalJpy = formatNumber(amountJpyTotal);
						}
					
						if(!isEmpty(tax1amt)){ //�Ŋz���vJpy
							taxamountJpyTotal += parseFloat(tax1amt)
							var taxamountTotalJpy = formatNumber(taxamountJpyTotal);
						}
						
						if(taxrate1 == '8.0%'){
							
							if(!isEmpty(grossamt)){ //8%���z(�œ�)���vJpy
								amountJpyTotal_eight += parseFloat(grossamt);
								var amountTotalEightJpy = formatNumber(amountJpyTotal_eight);
							}	
						
							if(!isEmpty(tax1amt)){ //8%�Ŋz���vJpy
								taxamountJpyTotal_eight += parseFloat(tax1amt);
								var taxamountTotalEightJpy = formatNumber(taxamountJpyTotal_eight);
							} 
						}else if(taxrate1 == '10.0%'){
							
							if(!isEmpty(grossamt)){ //10%���z���vJpy
								amountJpyTotal_ten += parseFloat(grossamt);
								var amountTotalTenJpy = formatNumber(amountJpyTotal_ten);
							}   
						
							if(!isEmpty(tax1amt)){ //10%�Ŋz���vJpy
								taxamountJpyTota1_ten += parseFloat(tax1amt);
								var taxamountTotalTenJpy = formatNumber(taxamountJpyTota1_ten);
							}	
						}
					
					}else{
						if(!isEmpty(oldQuantity)){
							var quantity = oldQuantity;//formatNum(oldQuantity);//���� 
						}else{
							var quantity = '';
						}
						
						if(!isEmpty(amount)){
							var amountCurr = formatNum(amount);//���z
						}else{
							var amountCurr = '';
						}
                      
						if(!isEmpty(rate)){
							var rateCurr = formatNum(rate); //�P��
						}else{
							var rateCurr = '';
						}
                      
						if(!isEmpty(grossamt)){	  //���z(�œ�)���v
							grossamtArr += parseFloat(grossamt);
							var amountTotal = formatNum(grossamtArr);
						}
													
						 if(!isEmpty(tax1amt)){	 //�Ŋz���v
							 taxamountArr += parseFloat(tax1amt);
							 var taxamountTotal = formatNum(taxamountArr);
						 }
						 
						 if(taxrate1 == '8.0%'){
							 if(!isEmpty(grossamt)){  //8%���z(�œ�)���v
								amountArr_eight += parseFloat(grossamt);
								var amountTotal_eight = formatNum(amountArr_eight);
							 } 
								 
							 if(!isEmpty(tax1amt)){  //8%�Ŋz���v
								taxamountArr_eight += parseFloat(tax1amt);
								var taxamountTotal_eight = formatNum(taxamountArr_eight);
							 }
						 }else if(taxrate1 == '10.0%'){
							 if(!isEmpty(grossamt)){	//10%���z(�œ�)���v
								 amountArr_ten += parseFloat(grossamt);
								 var amountTotal_ten = formatNum(amountArr_ten);
							 }
							 if(!isEmpty(tax1amt)){   //10%�Ŋz���v
								 taxamountArr_ten += parseFloat(tax1amt);
								 var taxamountTotal_ten = formatNum(taxamountArr_ten);
							 }
						 }
					}
					 invoiceItem.push({
						 itemName:itemName,//�A�C�e��
						 itemNum:itemNum,//NUMBER
						 description:description,//����
						 custcol7:custcol7, //CUST. PO#
						 custcol1:custcol1,//PACKING DETAILS
						 quantity:quantity,//����
						 quantityJpy:quantityJpy,//����Jpy
						 custcol4:custcol4,//�P��
						 taxcode_display:taxcode_display,//�ŋ��R�[�h
						 custcol_etd:custcol_etd,//etd
						 rate:rate,//�P��
						 amount:amount,//���z  
						 rateJpy:rateJpy,//�P��Jpy
						 amountJpy:amountJpy,//���zJpy
						 amountCurr:amountCurr,
						 rateCurr:rateCurr,
						 etaValue:etaValue,//ETA
					 });		 
				}
			}
			
			var str = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">'+ //���{��PDF
			'<pdf>'+
			'<head>'+
			'<link name="NotoSans" type="font" subtype="truetype" src="${nsfont.NotoSans_Regular}" src-bold="${nsfont.NotoSans_Bold}" src-italic="${nsfont.NotoSans_Italic}" src-bolditalic="${nsfont.NotoSans_BoldItalic}" bytes="2" />'+
			'<#if .locale == "zh_CN">'+
			'<link name="NotoSansCJKsc" type="font" subtype="opentype" src="${nsfont.NotoSansCJKsc_Regular}" src-bold="${nsfont.NotoSansCJKsc_Bold}" bytes="2" />'+
			'<#elseif .locale == "zh_TW">'+
			'<link name="NotoSansCJKtc" type="font" subtype="opentype" src="${nsfont.NotoSansCJKtc_Regular}" src-bold="${nsfont.NotoSansCJKtc_Bold}" bytes="2" />'+
			'<#elseif .locale == "en">'+
			'<link name="NotoSansCJKjp" type="font" subtype="opentype" src="${nsfont.NotoSansCJKjp_Regular}" src-bold="${nsfont.NotoSansCJKjp_Bold}" bytes="2" />'+
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
			str += '<td>';
			str += '<table>';
			str += '<tr>';
			str += '<td style="padding: 0px 0px 0px 40px;">���s���Ǝ�:</td>';
			str += '</tr>';
			str += '<tr>';
			str += '<td style="padding: 0px 0px 0px 40px;" align="right">'+operatorName+'</td>';
			str += '</tr>'; // 2023.09.29 F.Saito add start ***
			str += '<tr>';
			str += '<td style="padding: 5px 0px 0px 40px;">�Z���F<br/>'+location+'</td>';
			str += '</tr>';
			str += '<tr>';
			str += '<td style="padding: 0px 0px 0px 40px;">'+address+'</td>';
			str += '</tr>'; // 2023.09.29 F.Saito add end   ***
			str += '<tr>';
			str += '<td style="padding: 5px 0px 0px 40px;">�o�^�ԍ��FT5700150113971</td>';
			str += '</tr>';
			str += '</table>';
			str += '</td>';
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
			str += 'font-family: heiseimin, NotoSansCJKjp, sans-serif;';
			// str += 'font-family: NotoSans, NotoSansCJKjp, sans-serif;';
			str += '<#elseif .locale == "ja_JP">';
			str += 'font-family: heiseimin, NotoSansCJKjp, sans-serif;';
			// str += 'font-family: NotoSans, NotoSansCJKjp, sans-serif;';
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
			str += 'td.totalboxmid {width:11%;border-bottom:1px;}';
			str += 'td.totalboxbot {width:11%;border-right:1px;}';
			str += 'td.totalboxsts {width:11%;border-right:1px;border-bottom:1px;}';
			str += 'span.title {font-size: 20pt;}';
			str += 'span.number {font-size: 10pt;}';
			str += 'span.itemname {font-weight: bold;line-height: 150%;}';
			str += 'th.titlebox {border-left: 1px;border-bottom:1px;}';
			str += 'td.titleboxbot {border-left: 1px;border-bottom: 1px;vertical-align:middle;}';
			str += '</style>';
			str += '</head>';
			
			str += '<body header="nlheader" header-height="10%" footer="nlfooter" footer-height="20pt" padding="0.5in 0.5in 0.5in 0.5in" size="Letter">';
			
			str += '<table style="width: 100%;border:0.6px;border-top-style: dashed;border-right-style: none;  border-bottom-style: none;  border-left-style: none;"><tr><td> &nbsp;</td></tr></table>';
			str += '<table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tr>';
			str += '<td align="right"><span class="title" aling="center">������</span></td>';
			str += '<td align="right">�������ԍ�&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="number">${record.tranid}</span>';
			str += '<br/>�����&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="number">${record.custbody21}</span>';
			str += '<br/>����&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="number">${record.duedate}</span></td>';
			str += '</tr></table>';
			
			str += '<table style="width: 100%;border:0.6px;border-top-style: dashed;border-right-style: none;  border-bottom-style: none;  border-left-style: none;">';
			str += '<tr style="border-bottom:0.6px;border-bottom-style: dashed;">';
			str += '<td class="addressheader" colspan="6" style="border-right:1px;border-right-style: solid;"><b>�ڋq</b><br /><b>'+newCustName+'</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>�䒆</b><br />&nbsp;</td>';
			str += '<td class="addressheader" colspan="5"><b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;�z���}�[�N:<br />${record.shipaddress}<br /></b>&nbsp;&nbsp;&nbsp;</td>';
			str += '</tr>';
			str += '<tr>';
			str += '<td class="addressheader" colspan="6" style="border-right:1px;border-right-style: solid;"><b>�[���ꏊ</b><br /><b>${record.custbody_cons_add}</b><br />'; 
			str += '<table cellpadding="0" cellspacing="0">';	
			str += '<tr>';
			str += '<td  class="addressheader"><b>�d����</b></td>';
			str += '</tr>'; 
			for(var j =0;j<VendorNameArr.length;j++){
				str += '<tr>'; 
				str += '<td  class="addressheader"><b>'+VendorNameArr[j]+'</b></td>';
				str += '</tr>';
			}
			str += '</table>';
			str += '</td>';
			str += '<td class="addressheader" colspan="5"><b>�x������:&nbsp;&nbsp;&nbsp;&nbsp;${record.terms}</b><br /><br /><b>�����s:&nbsp;&nbsp;&nbsp;&nbsp;�O�HUFJ��s&nbsp;&nbsp;&nbsp;&nbsp;�����x�X</b><br /><br /><b>����:&nbsp;&nbsp;&nbsp;&nbsp;0087263</b><br /><br /><b>�ʉ�:&nbsp;&nbsp;&nbsp;&nbsp;${record.currency}</b><br /></td>';
			str += '</tr>';
			str += '</table>';
			str += '<table style="width: 100%;border:0.6px;border-top-style: none;border-right-style: none;  border-bottom-style: none;  border-left-style: none;"><tr><td> &nbsp;</td></tr></table>';
			str += '<table style="width: 100%;border:0.6px;border-top-style: dashed;border-right-style: none;  border-bottom-style: none;  border-left-style: none;"><tr><td> &nbsp;</td></tr></table>';
			
			str += '<table class="itemtable" style="width: 100%;border-bottom:none;" border="1" cellpadding="0" cellspacing="0">';
			str += '<thead>';
			str += '<tr>';
			str += '<th align="left" colspan="2" style="border-bottom:1px;" >&nbsp;&nbsp;No</th>';
			str += '<th align="left" colspan="4" class="titlebox" >&nbsp;&nbsp;�[����</th>';
			str += '<th align="left" colspan="4" class="titlebox" >&nbsp;&nbsp;�i��</th>';
			str += '<th align="left" colspan="6" class="titlebox" >&nbsp;&nbsp;�i��</th>';
			str += '<th align="left" colspan="4" class="titlebox" >&nbsp;&nbsp;Cust. PO#</th>';
			str += '<th align="left" colspan="4" class="titlebox" >&nbsp;&nbsp;���~����</th>';
			str += '<th align="right" colspan="3" class="titlebox">����&nbsp;&nbsp;</th>';  
			str += '<th align="left" colspan="2" class="titlebox" >&nbsp;&nbsp;�P��</th>';
			str += '<th align="right" colspan="3" class="titlebox" >�P��&nbsp;&nbsp;</th>';
			str += '<th align="left" colspan="4" class="titlebox" >&nbsp;&nbsp;�ŃR�[�h</th>';
			str += '<th align="right" colspan="4" class="titlebox" >���z�i�Ŕ�)&nbsp;&nbsp;</th>';
			str += '</tr>';
			str += '</thead>'; 
			for(var j =0;j<invoiceItem.length;j++){
				str += '<tr>';
				str += '<td align="left" colspan="2" style="border-bottom: 1px;vertical-align:middle" >&nbsp;&nbsp;'+invoiceItem[j].itemNum+'&nbsp;</td>'; //Num
				str += '<td align="left" colspan="4" class="titleboxbot">&nbsp;&nbsp;'+headerInvoiceDate+'</td>'; //ETA
				str += '<td align="left" colspan="4" class="titleboxbot">&nbsp;&nbsp;'+invoiceItem[j].itemName+'</td>'; //�i��
				str += '<td align="left" colspan="6" class="titleboxbot">&nbsp;&nbsp;'+invoiceItem[j].description+'</td>'; //�i��
				str += '<td align="left" colspan="4" class="titleboxbot">&nbsp;&nbsp;'+invoiceItem[j].custcol7+'</td>'; //Cust. PO#
				str += '<td align="left" colspan="4" class="titleboxbot">&nbsp;&nbsp;'+invoiceItem[j].custcol1+'</td>'; //���~����

				if(currency == 'JPY'){ //����
					str += '<td align="right" colspan="3" class="titleboxbot">'+invoiceItem[j].quantityJpy+'&nbsp;&nbsp;</td>';
				}else{
					str += '<td align="right" colspan="3" class="titleboxbot">'+invoiceItem[j].quantity+'&nbsp;&nbsp;</td>';
				}
				str += '<td align="left" colspan="2" class="titleboxbot">&nbsp;&nbsp;'+invoiceItem[j].custcol4+'</td>'; //�P��
				if(currency == 'JPY'){   //�P��
					str += '<td align="right" colspan="3" class="titleboxbot">'+invoiceItem[j].rateJpy+'&nbsp;&nbsp;</td>';
				}else{
					str += '<td align="right" colspan="3" class="titleboxbot">'+invoiceItem[j].rateCurr+'&nbsp;&nbsp;</td>';
				}
				
				str += '<td align="left" colspan="4" class="titleboxbot">&nbsp;&nbsp;'+invoiceItem[j].taxcode_display+'</td>'; //�ŃR�[�h
				
				if(currency == 'JPY'){  //���z�i�Ŕ�)
					str += '<td align="right" colspan="4" class="titleboxbot">'+invoiceItem[j].amountJpy+'&nbsp;&nbsp;</td>';
				}else{
					str += '<td align="right" colspan="4" class="titleboxbot">'+invoiceItem[j].amountCurr+'&nbsp;&nbsp;</td>';
				}
				str += '</tr>';
			}
			str += '</table>';
			
			
			str += '<table style="width: 100%;" cellpadding="0" cellspacing="0">';
			str += '<tr >';
			str += '<td style="width:59%;">&nbsp;</td>';
			str += '<td style="border:1px;border-top:none;border-right:none;border-bottom:none; width:11%">&nbsp;&nbsp;���v�i�ō�):</td>';
			if(currency == 'JPY'){
				if(!isEmpty(amountTotalJpy)){
					str += '<td style="width:11%" align="right">'+amountTotalJpy+'</td>';
				}else{
					str += '<td style="width:11%" align="right">&nbsp;</td>';
				}
			}else{
				if(!isEmpty(amountTotal)){
					str += '<td style="width:11%" align="right">'+amountTotal+'</td>';
				}else{
					str += '<td style="width:11%" align="right">&nbsp;</td>';
				}
			}
			str += '<td style="width:11%">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;�����:</td>';
			
			if(currency == 'JPY'){
				if(!isEmpty(taxamountTotalJpy)){
					str += '<td class="totalboxbot" align="right">'+taxamountTotalJpy+'</td>';
				}else{
					str += '<td class="totalboxbot" align="right">&nbsp;</td>';
				}
			}else{
				if(!isEmpty(taxamountTotal)){
					str += '<td class="totalboxbot" align="right">'+taxamountTotal+'</td>';
				}else{
					str += '<td class="totalboxbot" align="right">&nbsp;</td>';
				}
			}
			str += '</tr>';
		
			str += '<tr >';
			str += '<td style="width:59%;">&nbsp;</td>';
			str += '<td style="border:1px;border-top:none;border-right:none;border-bottom:none; width:11%">&nbsp;&nbsp;8%�Ώ�:</td>';
			if(currency == 'JPY'){
				if(!isEmpty(amountTotalEightJpy)){
					str += '<td style="width:11%;" align="right">'+amountTotalEightJpy+'</td>';
				}else{
					str += '<td style="width:11%;" align="right">&nbsp;</td>';
				}
			}else{
				if(!isEmpty(amountTotal_eight)){
					str += '<td style="width:11%;" align="right">'+amountTotal_eight+'</td>';
				}else{
					str += '<td style="width:11%;" align="right">&nbsp;</td>';
				}
			}
			
			str += '<td style="width:11%">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;�����:</td>';
			if(currency == 'JPY'){
				if(!isEmpty(taxamountTotalEightJpy)){
					str += '<td class="totalboxbot" align="right">'+taxamountTotalEightJpy+'</td>';
				}else{
					str += '<td class="totalboxbot" align="right">&nbsp;</td>';
				}
			}else{
				if(!isEmpty(taxamountTotal_eight)){
					str += '<td class="totalboxbot" align="right">'+taxamountTotal_eight+'</td>';
				}else{
					str += '<td class="totalboxbot" align="right">&nbsp;</td>';
				}
			}
			str += '</tr>';
			
			str += '<tr >';
			str += '<td style="width:59%;">&nbsp;</td>';
			str += '<td style="border-bottom:1px;border-left:1px; width:11%">&nbsp;&nbsp;10%�Ώ�:</td>';
			if(currency == 'JPY'){
				if(!isEmpty(amountTotalTenJpy)){
					str += '<td class="totalboxmid" align="right">'+amountTotalTenJpy+'</td>';
				}else{
					str += '<td class="totalboxmid" align="right">&nbsp;</td>';
				}
			}else{
				if(!isEmpty(amountTotal_ten)){
					str += '<td class="totalboxmid" align="right">'+amountTotal_ten+'</td>';
				}else{
					str += '<td class="totalboxmid" align="right">&nbsp;</td>';
				}
			}
			
			str += '<td style="width:11%;border-bottom:1px;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;�����:</td>';
			if(currency == 'JPY'){
				if(!isEmpty(taxamountTotalTenJpy)){
					str += '<td class="totalboxsts" align="right">'+taxamountTotalTenJpy+'</td>';
				}else{
					str += '<td class="totalboxsts" align="right">&nbsp;</td>';
				}
			}else{
				if(!isEmpty(taxamountTotal_ten)){
					str += '<td class="totalboxsts" align="right">'+taxamountTotal_ten+'</td>';
				}else{
					str += '<td class="totalboxsts" align="right">&nbsp;</td>';
				}
			}
			str += '</tr>';		
			str += '</table>';		
			str+='</body>';
			str += '</pdf>';
			
			nlapiLogExecution('DEBUG', 'end', 'end');
			var record = nlapiLoadRecord('invoice', invoiceId);
			var renderer = nlapiCreateTemplateRenderer();
			renderer.setTemplate(str);
			renderer.addRecord('record', record);
			var xml = renderer.renderToString();
			var xlsFile = nlapiXMLToPDF(xml);
			// PDF�t�@�C������ݒ肷��
			xlsFile.setName('PDF' + '_' + getFormatYmdHms() + '.pdf');
			xlsFile.setFolder(invoicePDF);
			xlsFile.setIsOnline(true);
		
			var fileID = nlapiSubmitFile(xlsFile);
			var fl = nlapiLoadFile(fileID);
		
			var url= 'https://3701295.app.netsuite.com/'+fl.getURL();
			nlapiSetRedirectURL('EXTERNAL', url, null, null, null);			
		}
	}
	catch(e){
		nlapiLogExecution('debug', '�G���[', e.message);
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


/**
 * �V�X�e�����Ԃ̎擾���\�b�h
 */
function getSystemTime() {

	// �V�X�e������
	var now = new Date();
	var offSet = now.getTimezoneOffset();
	var offsetHours = 9 + (offSet / 60);
	now.setHours(now.getHours() + offsetHours);

	return now;
}

/**
 * �V�X�e�����t�Ǝ��Ԃ��t�H�[�}�b�g�Ŏ擾
 */
 function getFormatYmdHms() {

    // �V�X�e������
    var now = getSystemTime();

    var str = now.getFullYear().toString();
    str += (now.getMonth() + 1).toString();
    str += now.getDate() + "_";
    str += now.getHours();
    str += now.getMinutes();
    str += now.getMilliseconds();

    return str;
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

function getCaption(obj,state) {
	var index=obj.lastIndexOf("\&");
	if(state==0){
	obj=obj.substring(0,index);
	}else {
	obj=obj.substring(index+1,obj.length);
	}
	return obj;
}

function formatNum(num) {
    var numStr = num.toString().split('.'); 
    var numInt = numStr[0];
    var numDec = numStr.length > 1 ? '.'+numStr[1] : '.' ; 
    while (3 - numDec.length)  numDec += '0';  
    var resultInt = ''; 
    while (numInt.length > 3) {     
        resultInt = ','+numInt.slice(-3)+resultInt;  
        numInt = numInt.slice(0, -3); 
    }
    return numInt + resultInt + numDec;
}

function formatNumber(num) {
    var numStr = num.toString().split('.'); 
    var numInt = numStr[0];
    var resultInt = ''; 
    while (numInt.length > 3) {     
        resultInt = ','+numInt.slice(-3)+resultInt;  
        numInt = numInt.slice(0, -3); 
    }
    return numInt + resultInt ;
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