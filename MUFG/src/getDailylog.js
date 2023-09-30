/** 
*@NApiVersion 2.x 
*@NScriptType ScheduledScript 
*/

define(['N/sftp', 'N/log', 'N/file', 'N/record', 'N/xml'], function (sftp, log, file, record, xml) {
    function getStatusReturn() {
        // load csv file of XMLs "crtSentXMLs.csv"
        var objCSV = file.load({ id: "SuiteScripts/MUFG/log/crtSentXMLs.csv" })
        var iterator = objCSV.lines.iterator();
        var formatData = dateFormat();

        // create newly saving csv (CSV header)
        var csvHeader;
        iterator.each(function (line) {
            csvHeader = line.value;
            return false;
        });
        var newObjCSV = file.create({
            name: "crtSentXMLs.csv",
            fileType: file.Type.CSV,
            contents: csvHeader + "\n",
            description: 'CSV file of summary of XMLs sent to MUFG. Updated on ' + formatData,
            encoding: file.Encoding.UTF8,
            folder: 430, // folder for SuiteScript/MUFG/log
        })

        // execute download and check file
        iterator.each(function (line) {
            var lineValue = line.value.split(',');
            // make SFTP connection
            var targetStr = lineValue[2].split('.')[0];
            if (targetStr !== 'filename') {
                log.debug('download', targetStr)
                var returnXML = downloadFile(targetStr);
                if (returnXML) {                    
                    var statusFlag = checkXML(returnXML);
                    // if status flag is true, revert approval of object transaction
                    if (statusFlag === true) {
                        // add to new csv file
                        newObjCSV.appendLine({ value: lineValue });
                        var objRecord = record.load({
                            type: lineValue[1],
                            id: lineValue[0],
                            isDynamic: true,
                        });
                        if (lineValue[1] === "journalentry") {
                            // revert approval - standart field
                            objRecord.setValue({
                                fieldId: 'approved',
                                value: false
                            })
                        } else {
                            // revert approval - custom field
                            objRecord.setValue({
                                fieldId: 'custbody_approved',
                                value: false
                            })
                        }
                        // set mufg as error
                        objRecord.setValue({
                            fieldId: 'custbody_mufg_status',
                            value: 3
                        })
                        objRecord.save();
                    }
                }
            }
            return true
        })
        file.delete({
            id: objCSV.id
        })
        newObjCSV.save();
        return false;
    }
    function dateFormat() {
        // return formatted data
        var exeDate = new Date();
        format_str = 'YYYY-MM-DD hh:mm:ss';
        format_str = format_str.replace(/YYYY/g, exeDate.getFullYear());
        format_str = format_str.replace(/MM/g, ('00' + (1 + exeDate.getMonth())).slice(-2));
        format_str = format_str.replace(/DD/g, ('00' + exeDate.getDate()).slice(-2));
        format_str = format_str.replace(/hh/g, ('00' + exeDate.getHours()).slice(-2));
        format_str = format_str.replace(/mm/g, ('00' + exeDate.getMinutes()).slice(-2));
        format_str = format_str.replace(/ss/g, ('00' + exeDate.getSeconds()).slice(-2));
        return format_str;
    }

    function downloadFile(targetStr) {
        // SFTP connection parameters
        var strHostKey = "AAAAB3NzaC1yc2EAAAADAQABAAAAgQCLUQiBHNpNM88UdX3/qOFbBTNC5hG48l+XnY42Eog9GM4dKUX8QNdSWT5TLdirH/zZLJVdFfNKNOUxMHyoBa+ZFR59PwYCQ3e/FO3GIfDrBIgqCPA8pF1Q+/3aHuNpKoMijRe/eBQfhnH1ecBozXIfj+ZWw+JELr2g7H65mzliFQ==";
      // var strHostKey = "AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBNMq0yZVrG+mWyKDg3PBeIHDWrpE5G8RLcXuSvi1WmvSDo8ERjwr8RDqOEq0EkzQyUgY2FUZjhdqBqFsEc/Dk18=";
        var strUrl = "bsftp.btmu2.ms.gxs.com";
        var strUsername = "BTMUTPF7T99";
        var numPort = 22;

        // make SFTP connection
        var connection = sftp.createConnection({
            url: strUrl,
            keyId: 'custkey46',
            hostKey: strHostKey,
            username: strUsername,
            port: numPort,
            directory: '/BTMUTPF7T99/BTMUGP01T99/',
        });

        // get filename to download
        var path = connection.list({ path: "" });
        var fileName;
        var prefix = "%BTMUGP01T99%BTMUTPF7T99%BOTK";
        var subfix = "%POLLABLE%";
        var searchFile = prefix + targetStr + subfix;
        for (var i = 0; i < path.length; i++) {
            //.debug(searchFile,path[i].name.slice(0,49))
            if (path[i].name.indexOf(searchFile) !== -1) {
                fileName = path[i].name;
            }
        }

        if (fileName) {            
            // download file
            var download = connection.download({
                filename: fileName
            });
            var base64EncodedString = encode.convert({
                string: download.getContents(),
                inputEncoding: encode.Encoding.BASE_64,
                outputEncoding: encode.Encoding.UTF_8
            })
    
            var returnFile = file.create({
                name: "BOTK" + targetStr + ".XML",
                fileType: "XMLDOC",
                contents: base64EncodedString
            });
            return returnFile;
        }

    }

    function checkXML(fileObj){
        var parsedXML = xml.Parser.fromString({text: fileObj.getContents()});
        var elem = parsedXML.getElementsByTagName({
          tagName : 'Prtry'
        });
        if (elem[0].textContent.slice(0,1) === "0"){
            // transaction successful
            return false;
        } else {
            return true;
        }
    }

    function execute() {
        var objStatusReturn = getStatusReturn();
        return false;
    }

    return {
        execute: execute
    }

});