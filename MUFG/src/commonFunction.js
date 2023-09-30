/**
 * common functions
 * @NApiVersion 2.X
 */

 define(['N/log','N/xml'], function(log, xml){
    function xmlAS01(objSrc){
      log.debug('debug', objSrc)
        xml = '<?xml version="1.0" encoding="utf-8"?>';
 		    xml += '<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">';
 		    xml += '<CstmrCdtTrfInitn>';
 		    xml += '<GrpHdr>';
		    xml += '<MsgId>'+ objSrc.msgId +'</MsgId>';
        xml += '<CreDtTm>'+objSrc.CreDtTm+'</CreDtTm>';
        xml += '<NbOfTxs>1</NbOfTxs>';
        xml += '<InitgPty/>';
        xml += '</GrpHdr>';
        xml += '<PmtInf>';
        xml += '<PmtInfId>'+objSrc.PmtInfId+'</PmtInfId>';
        xml += '<PmtMtd>TRF</PmtMtd>';
        xml += '<ReqdExctnDt>'+objSrc.exeDt+'</ReqdExctnDt>';
        xml += '<Dbtr/>';
        xml += '<DbtrAcct>';
        xml += '<Id>';
        xml += '<Othr>';
        xml += '<Id>'+ objSrc.DbtrAcctId +'</Id>';
        xml += '</Othr>';
        xml += '</Id>';
        xml += '</DbtrAcct>';
        xml += '<DbtrAgt><FinInstnId></FinInstnId></DbtrAgt>';
        if (objSrc.paymentMethod === "BT"){
            // Not set ChrgBr if payment is BT
        } else {
            xml += '<ChrgBr>'+ objSrc.chrgBr +'</ChrgBr>';
        }
        xml += '<CdtTrfTxInf>';
        xml += '<PmtId>';
        xml += '<EndToEndId>'+ objSrc.PmtId +'</EndToEndId>';
        xml += '</PmtId>';
        xml += '<PmtTpInf>';
        xml += '<SvcLvl>';
        xml += '<Cd>NURG</Cd>';
        xml += '</SvcLvl>';
        xml += '<CtgyPurp>';
        xml += '<Cd>' + objSrc.paymentMethod + '</Cd>'
        xml += '</CtgyPurp>';
        xml += '</PmtTpInf>';
        xml += '<Amt>';
        xml += '<InstdAmt Ccy="' + objSrc.Ccy + '">' + objSrc.Amount.replace(/\,/, '') + '</InstdAmt>';
        xml += '</Amt>';
        xml += '<CdtrAgt>';
        xml += '<FinInstnId>';
        if (objSrc.Giro === true){xml += '<BIC>'+ objSrc.Bic +'</BIC>';} else {
            if (objSrc.Bic == null || objSrc.Bic == ''){
              //xml += '<BIC></BIC>'
            } else {
              xml += '<BIC>'+ objSrc.Bic +'</BIC>'
            };
            xml += '<Nm>'+objSrc.bankName+'</Nm>'
        }
        xml += '</FinInstnId>';
        xml += '</CdtrAgt>';
        xml += '<Cdtr>';
        xml += '<Nm>'+ objSrc.cdtrNm +'</Nm>';
        if (objSrc.Giro === false){
            xml += '<PstlAdr>';
            if (objSrc.paymentMethod === "BT"){
              xml += '<Ctry>SG</Ctry>';
            };
            if (objSrc.paymentMethod === "DT") {
              xml += '<TwnNm>'+ objSrc.pstlAdrTwnNm +'</TwnNm>';
              xml += '<Ctry>SG</Ctry>';
            }
            if (objSrc.paymentMethod === "FR") {
              xml += '<TwnNm>'+ objSrc.pstlAdrTwnNm +'</TwnNm>';
              xml += '<Ctry>'+ objSrc.ctry +'</Ctry>';
            }
            xml += '</PstlAdr>';
        }
        xml += '</Cdtr>';
        xml += '<CdtrAcct>';
        xml += '<Id>';
        xml += '<Othr>';
        xml += '<Id>'+ objSrc.cdtrAcctId +'</Id>';
        xml += '</Othr>';
        xml += '</Id>';
        xml += '</CdtrAcct>';
        if (objSrc.dtlsInf != undefined){
            xml += '<RgltryRptg>';
            xml += '<Dtls>';
            if(objSrc.paymentMethod === "FR"){
              xml += '<Inf>NNK NI '+ objSrc.dtlsInf +'</Inf>';
            } else {
              xml += '<Inf>'+ objSrc.dtlsInf +'</Inf>';
            }
            xml += '</Dtls>';
            xml += '</RgltryRptg>';
        }
        xml += '</CdtTrfTxInf>';
        xml += '</PmtInf>';
        xml += '</CstmrCdtTrfInitn>';
        xml += '</Document>';
        return xml
    }

    function xmlPMX3(objSrc){
        // create XML payment file format by PMX3
      log.debug('check', objSrc.paymentMethod)
        xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>';
 		    xml += '<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">';
 		    xml += '<CstmrCdtTrfInitn>';
 		    xml += '<GrpHdr>';
		    xml += '<MsgId>'+objSrc.msgId+'</MsgId>';
        xml += '<CreDtTm>'+objSrc.CreDtTm+'</CreDtTm>';
        xml += '<NbOfTxs>1</NbOfTxs>';
        xml += '<InitgPty></InitgPty>';
        xml += '</GrpHdr>';
        xml += '<PmtInf>';
        xml += '<PmtInfId>'+objSrc.PmtInfId+'</PmtInfId>';
        xml += '<PmtMtd>TRF</PmtMtd>';
        xml += '<ReqdExctnDt>'+objSrc.exeDt+'</ReqdExctnDt>';
        xml += '<Dbtr></Dbtr>';
        xml += '<DbtrAcct>';
        xml += '<Id>';
        xml += '<Othr>';
        xml += '<Id>'+ objSrc.DbtrAcctId +'</Id>';
        xml += '</Othr>';
        xml += '</Id>';
        xml += '<Ccy>'+ objSrc.CcyHeader + '</Ccy>';
        xml += '</DbtrAcct>';
        xml += '<DbtrAgt>';
        xml += '<FinInstnId></FinInstnId>';
        xml += '</DbtrAgt>';
        xml += '<CdtTrfTxInf>';
        xml += '<PmtId>';
        xml += '<InstrId>'+ '' + objSrc.PmtId +'</InstrId>';
        xml += '<EndToEndId>'+ '' + objSrc.PmtId +'</EndToEndId>';
        xml += '</PmtId>';
        xml += '<Amt>';
        xml += '<InstdAmt Ccy="' + objSrc.Ccy + '">' + objSrc.Amount.replace(/\,/g, '') + '</InstdAmt>';
        xml += '</Amt>';
        if (objSrc.Ccy !== objSrc.CcyHeader){
          if (objSrc.ExechangeRate !== undefined){
            xml += '<XchgRateInf><RateTp>'+objSrc.ExechangeRate+'</RateTp></XchgRateInf>'
          }
        }
        xml += ''
        xml += '<ChrgBr>'+ objSrc.chrgBr +'</ChrgBr>';
        xml += '<CdtrAgt>';
        xml += '<FinInstnId>';
        if (objSrc.Bic == null || objSrc.Bic == ''){
          //xml += '<BIC></BIC>'
        } else {xml += '<BIC>'+ objSrc.Bic +'</BIC>'};
        xml += '</FinInstnId>';
        xml += '</CdtrAgt>';
        xml += '<Cdtr>';
        xml += '<Nm>'+ objSrc.cdtrNm +'</Nm>';
        xml += '<PstlAdr>';
        xml += '<TwnNm>'+ objSrc.pstlAdrTwnNm +'</TwnNm>';
        xml += '<Ctry>'+ objSrc.ctry +'</Ctry>';
        xml += '</PstlAdr>';
        xml += '</Cdtr>';
        xml += '<CdtrAcct>';
        xml += '<Id>';
        xml += '<Othr>';
        xml += '<Id>'+ objSrc.cdtrAcctId +'</Id>';
        xml += '</Othr>';
        xml += '</Id>';
        xml += '</CdtrAcct>';
        xml += '<InstrForDbtrAgt>INTERNATIONAL</InstrForDbtrAgt>';
        xml += '<Purp>';
        xml += '<Prtry>'+ objSrc.purpPrtry +'</Prtry>';
        xml += '</Purp>';
        xml += '<RgltryRptg>';
        xml += '<Dtls>';
        xml += '<Inf>NNK NI '+ objSrc.dtlsInf +'</Inf>';
        xml += '</Dtls>';
        xml += '</RgltryRptg>';
        if (objSrc.Email != undefined){
          xml += '<RltdRmtInf><RmtLctnElctrncAdr>'+objSrc.Email+'</RmtLctnElctrncAdr></RltdRmtInf>';
        };
        xml += '</CdtTrfTxInf>';
        xml += '</PmtInf>';
        xml += '</CstmrCdtTrfInitn>';
        xml += '</Document>';
        return xml
    }

    return {
        xmlAS01: xmlAS01,
        xmlPMX3: xmlPMX3,
    }

});