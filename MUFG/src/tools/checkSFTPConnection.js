/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType Suitelet
 */
 define(["N/ui/serverWidget", "N/log", "N/sftp", "N/file", "N/encode", "N/xml"], function (serverWidget, log, sftp, file, encode, xml) {
    function onRequest(context) {
        if (context.request.method === 'GET') {
            var targetStr = "AS01TE1180";
            var returnFile = downloadFile(targetStr);
            var form = serverWidget.createForm({ title: "TEST" })
            context.response.writePage({ pageObject: form });
            // get download file name
            //var result = checkXML(returnFile);
            //log.debug('END', result);
        } else {
            // method other than GET, do nothing here
        }
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
        log.debug('check path', path)
        var fileName;
        var prefix = "%BTMUGP01T99%BTMUTPF7T99%BOTK";
        //var subfix = "%POLLABLE%";
        var subfix = "%ACCEPTED%"
        var searchFile = prefix + targetStr + subfix;
        for (var i = 0; i < path.length; i++) {
            log.debug(searchFile, path[i].name.slice(0, 49))
            if (searchFile == path[i].name.slice(0, 49)) {
                fileName = path[i].name;
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
                returnFile.folder = 570;
                returnFile.save();
            } else {
                // remove file
               // connection.removeFile({ path: path[i].name });
            }
        }
        return returnFile;
    }
      function checkXML(fileObj){
          var parsedXML = xml.Parser.fromString({text: fileObj.getContents()});
          var elem = parsedXML.getElementsByTagName({
            tagName : 'Prtry'
          });
          log.debug('XML', elem[0].textContent.slice(0,2));
          return elem;
      }

    return {
        onRequest: onRequest
    };
});