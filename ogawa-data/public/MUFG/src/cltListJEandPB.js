define(["N/search", "N/file", "N/log", "N/record", "N/sftp", "N/currency", "N/format", "./commonFunction.js"],
    function (
        search,
        file,
        log,
        record,
        sftp,
	    currency,
        format,
        cmnFnc
    ) {
        /**
         * @NApiVersion 2.x
         */
        var exports = {};

        function sendMUFG(id, type) {
            // journal entry and paybills
            // triggerd when save button pushed
            // checked record only

            // 1. load the target record
            var targetRecord = record.load({id: id,type: type});
            //log.debug('target', targetRecord)
            // 2. check MUFG payment status
            var skipFlag = "";
            var payStatus = targetRecord.getValue({ fieldId: 'custbody_mufg_status' });
            if (payStatus === "1" || payStatus === "5") {
                skipFlag = false;
            } else {
                skipFlag = true;
            }
            // 3. Skip if payment is already processed or includes error
            if (skipFlag === true) {
                // do nothing
                log.debug('Target Skipped: '+id, 'Check payment status - ' + targetRecord.getText({ fieldId: 'custbody_mufg_status' }));
            } else { // 4. create object for XML file creation
                // 4.1. add date related tags
                var objSrcDate = editExeDate(targetRecord.getValue({fieldId: 'trandate'}));
                // 4.2. add record dependent tags (Depends on Transaction Type)
                if (type == "journalentry") {var objSrc = editRecordObjJE(targetRecord, objSrcDate);}
                if (type == "vendorpayment") {var objSrc = editRecordObjPB(targetRecord, objSrcDate);}                
                // 4.3. convert to MUFG - account specifier and payment method setting
                //log.debug("Debug - objSrc", objSrc)
                var tmpDbtrAcctId = objSrc.DbtrAcctId;
                var objSrcXML = cnvrtMUFGacct(objSrc);
                //log.debug("Debug - objSrcXML", objSrcXML)
                // 4.4. create XML file to sent
                if (["359", "336", "471", "748", "754"].indexOf(tmpDbtrAcctId) >= 0) {
                    // 359 - Current Deposit (SGD) - BTMU
                    // 336 - Current Deposit (USD) - BTMU
                    // 471 - Current Deposit (JPY) - BTMU
                    // 748 - Current Deposit (CNY) - BTMU
                    // 754 - Current Deposit (THB - BTMU
                    var objXML = cmnFnc.xmlAS01(objSrcXML);
                    var xmlFile = file.create({
                        name: "AS01" + objSrcXML.PmtId.slice(-6) + ".xml",
                        fileType: "XMLDOC",
                        contents: objXML
                    })
                    var uploadDir = "/AS01TE" + objSrcXML.PmtId.slice(-4) + "/";
                } else {
                    // 755 - BANK : Online (USD) - Muromachi MUFG Bank
                    // 756 - BANK : Online (JPY) - Muromachi MUFG Bank
                    // 759 - BANK : Online (EUR) - Muromachi MUFG Bank
                    var objXML = cmnFnc.xmlPMX3(objSrcXML);
                    var xmlFile = file.create({
                        name: "PMX3" + objSrcXML.PmtId.slice(-6) + ".xml",
                        fileType: "XMLDOC",
                        contents: objXML
                    })
                    var uploadDir = "/PMX3" + objSrcXML.PmtId.slice(-6) + "/";
                }

                // 5. Execute SFTP connection
                var errorFlag = sftpUpload(xmlFile, uploadDir);
                log.debug('SFTP execution:' + type, xmlFile.name + " - " + uploadDir)

                // for test purpose - save to filecubinet (/MUFG/test)
                xmlFile.folder = 430;
                var fileId = xmlFile.save();

                // 6. add log to csv
                var objCSV = file.load({ id: "SuiteScripts/MUFG/log/crtSentXMLs.csv" });
                objCSV.appendLine({ value: targetRecord.id + "," + targetRecord.type + "," + xmlFile.name });
                objCSV.save();

                // 7. Update record
                if (errorFlag === false) {
                    targetRecord.setValue({ fieldId: 'custbody_mufg_status', value: 2 }); // mufg status as processed
                    if (type == "journalentry") targetRecord.setValue({ fieldId: 'approved', value: true })
                    if (type == "vendorpayment") targetRecord.setValue({ fieldId: 'custbody_approved', value: true })                    
                } else { // if there is any error to catch
                    targetRecord.setValue({ fieldId: 'custbody_mufg_status', value: 1 }); // mufg status as error
                    if (type == "journalentry") targetRecord.setValue({ fieldId: 'approved', value: false })
                    if (type == "vendorpayment") targetRecord.setValue({ fieldId: 'custbody_approved', value: false })     
                    
                }
                targetRecord.save()
            }
        }
        // Common functions Start----------------------------------------------------------------------------------------------------------
        function editExeDate(trandate) {
            var returnObjDate = {};
            var exeDate = new Date(trandate);
          log.debug(trandate, exeDate)
            // XML tag - msgId
            returnObjDate.msgId = exeDate.getFullYear() + "" +
                (1 + exeDate.getMonth()) + "" +
                exeDate.getDate() + "" + exeDate.getHours() +
                "" + exeDate.getMinutes() + "" + exeDate.getSeconds();
            format_str = 'YYYY-MM-DDThh:mm:ss';
            format_str = format_str.replace(/YYYY/g, exeDate.getFullYear());
            format_str = format_str.replace(/MM/g, ('00' + (1 + exeDate.getMonth())).slice(-2));
            format_str = format_str.replace(/DD/g, ('00' + exeDate.getDate()).slice(-2));
            format_str = format_str.replace(/hh/g, ('00' + exeDate.getHours()).slice(-2));
            format_str = format_str.replace(/mm/g, ('00' + exeDate.getMinutes()).slice(-2));
            format_str = format_str.replace(/ss/g, ('00' + exeDate.getSeconds()).slice(-2));
            // XML tag - CreDtTm
            returnObjDate.CreDtTm = format_str;
            // XML tag - PmtInfId
            returnObjDate.PmtInfId = returnObjDate.msgId;
            format_str_2 = 'YYYY-MM-DD';
            format_str_2 = format_str_2.replace(/YYYY/g, exeDate.getFullYear());
            format_str_2 = format_str_2.replace(/MM/g, ('00' + (1 + exeDate.getMonth())).slice(-2));
            format_str_2 = format_str_2.replace(/DD/g, ('00' + exeDate.getDate()).slice(-2));
            // XML tag - exeDt
            returnObjDate.exeDt = format_str_2;
            return returnObjDate;
        }
        function editRecordObjJE(recordObj, inputObj) {
            // expect input of record.Record object from N/record module
            // Journal Entry specific part - retrieve account and amount
            var index = 0;
            var numLines = recordObj.getLineCount({ sublistId: 'line' });
            // XML tag - Amt
            for (var j = 0; j < numLines; j++) {
                var accountValue = recordObj.getSublistValue({ sublistId: 'line', fieldId: 'account', line: j });
                if (["359", "336", "471", "748", "754", "755", "756", "759"].indexOf(accountValue) >= 0) {
                    //log.debug(accountValue, ["359", "336", "471", "748", "754", "755", "756", "759"].indexOf(accountValue))
                    inputObj.DbtrAcctId = accountValue;
                    if (recordObj.getSublistValue({ sublistId: 'line', fieldId: 'credit', line: j }) == null) {
                        inputObj.Amount = recordObj.getSublistValue({ sublistId: 'line', fieldId: 'debit', line: j })
                    } else {
                        inputObj.Amount = recordObj.getSublistValue({ sublistId: 'line', fieldId: 'credit', line: j })
                    }
                    index = j;
                }
            };
            // XML tag - DbtrAcctId, PmtId, Ccy
            inputObj.PmtId = recordObj.getValue({ fieldId: 'tranid' }) || recordObj.getValue({ fieldId: 'transactionnumber' });
            inputObj.CcyHeader = recordObj.getText({ fieldId: 'currency' });
            inputObj.CcyHeader = recordObj.getText({ fieldId: 'currency' });

            // add beneficiary related tags
            // XML tag - Bic, cdtrNm, pstlAdrTwnNm, ctry, cdtrAcctId, chrgBr, bankName, bankBranchName, bankCtry
            var outputObj = getPaymentInfo(recordObj, inputObj);

            // XML tag - purpPrtry, dtlsInf, paymentMethod
            outputObj.purpPrtry = recordObj.getValue({ fieldId: 'custbody20' });
            outputObj.dtlsInf = recordObj.getValue({ fieldId: 'memo' });
            //log.debug('edit record', outputObj)
            return outputObj;
        }
        function editRecordObjPB(recordObj, inputObj) {
            // expect input of record.Record object from N/record module
            // Journal Entry specific part - retrieve account and amount
            // XML tag - DbtrAcctId, PmtId, Ccy
            inputObj.DbtrAcctId = recordObj.getValue({ fieldId: 'account' });
            inputObj.PmtId = recordObj.getValue({ fieldId: 'tranid' }) || recordObj.getValue({ fieldId: 'transactionnumber' });
            inputObj.CcyHeader = recordObj.getText({ fieldId: 'currency' });
            inputObj.Amount = recordObj.getText({ fieldId: 'total' });

            // add beneficiary related tags
            // XML tag - Bic, cdtrNm, pstlAdrTwnNm, ctry, cdtrAcctId, chrgBr, bankName, bankBranchName, bankCtry
            var outputObj = getPaymentInfo(recordObj, inputObj);

            outputObj.purpPrtry = recordObj.getValue({ fieldId: 'custbody20' });
            outputObj.dtlsInf = recordObj.getValue({ fieldId: 'memo' });
            //log.debug('edit record', outputObj)
            return outputObj;
        }
        function getPaymentInfo(obj, outObj) {
            var paymentInfor = obj.getValue({ fieldId: 'custbody_payment_info' });
            var searchPaymentInfo = search.create({
                type: 'customrecord_payment_info',
                columns: [search.createColumn({ name: "internalid", label: "internalid" }),
                search.createColumn({ name: "name", label: "name" }),
                search.createColumn({ name: "custrecord_company_name", label: "custrecord_company_name" }),
                search.createColumn({ name: "custrecord_company_address", label: "custrecord_company_address" }),
                search.createColumn({ name: "custrecord_company_country", label: "custrecord_company_country" }),
                search.createColumn({ name: "custrecord_bank_name", label: "custrecord_bank_name" }),
                search.createColumn({ name: "custrecord_bank_branch_name", label: "custrecord_bank_branch_name" }),
                search.createColumn({ name: "custrecord_bank_country", label: "custrecord_bank_country" }),
                search.createColumn({ name: "custrecord_bank_account", label: "custrecord_bank_account" }),
                search.createColumn({ name: "custrecord_bank_swift_bic", label: "custrecord_bank_swift_bic" }),
                search.createColumn({ name: "custrecord_bank_charge", label: "custrecord_bank_charge" }),
                search.createColumn({ name: "custrecord_currency", label: "custrecord_currency" }),
                search.createColumn({ name: "custrecord_payment_method", label: "custrecord_payment_method" }),
                search.createColumn({ name: "custrecord_exchange_method", label: "custrecord_exchange_method" }),
                search.createColumn({ name: "custrecord_email", label: "custrecord_email" }),
                ],
                filters: ["internalid", 'is', paymentInfor]
            });
            var resultSrchPyInf = searchPaymentInfo.run().each(function (result) {
                // callback function - limited loop number
                // XML tag - Bic, cdtrNm, pstlAdrTwnNm, ctry, cdtrAcctId, chrgBr, bankName, bankBranchName, bankCtry
                outObj.Bic = result.getValue({ name: "custrecord_bank_swift_bic" });
                outObj.cdtrNm = result.getValue({ name: "custrecord_company_name" });
                outObj.pstlAdrTwnNm = result.getValue({ name: "custrecord_company_address" });
                outObj.ctry = result.getText({ name: "custrecord_company_country" });
                outObj.cdtrAcctId = result.getValue({ name: "custrecord_bank_account" });
                outObj.chrgBr = result.getText({ name: "custrecord_bank_charge" });
                outObj.bankName = result.getValue({ name: "custrecord_bank_name" });
                outObj.bankBranchName = result.getValue({ name: "custrecord_bank_branch_name" });
                outObj.bankCtry = result.getValue({ name: "custrecord_bank_country" });
                outObj.Ccy = result.getText({ name: "custrecord_currency" });
                outObj.paymentMethod = result.getText({ name: "custrecord_payment_method" });
                outObj.ExechangeRate = result.getText({ name: "custrecord_exchange_method" });
                outObj.Email = result.getValue({ name: "custrecord_email" });
            });
            return outObj
        }
        function cnvrtMUFGacct(objSrc) {
            // convert NS accout to MUFG account specifier and payment method setting
            if (objSrc.paymentMethod === "GIRO"){
                objSrc.paymentMethod = "OTHR";
                objSrc.Giro = true;
            } else {
                objSrc.Giro = false;
                if (objSrc.paymentMethod ==="SALA"){
                  objSrc.Giro = true;
                }
            };
            if (objSrc.DbtrAcctId === "359") {objSrc.DbtrAcctId = "3655SGDCUA116493";}
            if (objSrc.DbtrAcctId === "336") {objSrc.DbtrAcctId = "3655USDCUA367880";}
            if (objSrc.DbtrAcctId === "471") {objSrc.DbtrAcctId = "3655JPYCUA369845";}
            if (objSrc.DbtrAcctId === "748") {objSrc.DbtrAcctId = "3655CNYCUA385528";}
            if (objSrc.DbtrAcctId === "754") {objSrc.DbtrAcctId = "3655THBCUA385510";}
            if (objSrc.DbtrAcctId === "759") {objSrc.DbtrAcctId = "0433846876090000";}
            if (objSrc.DbtrAcctId === "756") {objSrc.DbtrAcctId = "0430000872630000";}
            if (objSrc.DbtrAcctId === "755") {objSrc.DbtrAcctId = "0433846875810000";}
            if (objSrc.Ccy !== objSrc.CcyHeader){
              // exchange rate
              var tmpAmount = objSrc.Amount;
              var rate = currency.exchangeRate({source: objSrc.CcyHeader,target: objSrc.Ccy, date: new Date()});
              var calcAmount = tmpAmount * rate;
              objSrc.Amount = objSrc.Ccy == 'JPY' ? calcAmount.toFixed(0).replace(/\,/g, '') : calcAmount.toFixed(2);
            }
            return objSrc
        }
        function sftpUpload(fileObj, upDir) {
            var errflg = false;
            // sftp access parameters - test environment
            try {
                var strHostKey = "AAAAB3NzaC1yc2EAAAADAQABAAAAgQCLUQiBHNpNM88UdX3/qOFbBTNC5hG48l+XnY42Eog9GM4dKUX8QNdSWT5TLdirH/zZLJVdFfNKNOUxMHyoBa+ZFR59PwYCQ3e/FO3GIfDrBIgqCPA8pF1Q+/3aHuNpKoMijRe/eBQfhnH1ecBozXIfj+ZWw+JELr2g7H65mzliFQ==";
              // var strHostKey = "AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBNMq0yZVrG+mWyKDg3PBeIHDWrpE5G8RLcXuSvi1WmvSDo8ERjwr8RDqOEq0EkzQyUgY2FUZjhdqBqFsEc/Dk18=";
                var strUrl = "bsftp-btmu2.ms.gxs.com";
                var strUsername = "BTMUTPF7T99";
                var numPort = 22;

                // make connection
                var connection = sftp.createConnection({
                    url: strUrl,
                    keyId: 'custkey46',
                    hostKey: strHostKey,
                    username: strUsername,
                    port: numPort,
                    directory: '/BTMUTPF7T99/BTMUGP01T99/',
                });

                // upload XML file to SFTP sever
                connection.upload({
                    file: fileObj,
                    filename: fileObj.name,
                    directory: upDir,
                    replaceExisting: true,
                });
            } catch (e) {
                log.debug('SFTP Error:', e)
                errflg = true;
            }
            return errflg
        }
        // Common functions End   ----------------------------------------------------------------------------------------------------------
        exports.sendMUFG = sendMUFG;
        return exports;
    });


