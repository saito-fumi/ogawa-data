/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/render', 'N/file', 'N/search', 'N/runtime', 'N/format', 'N/config', 'N/record', 'N/url', 'N/xml'], function (render, file, search, runtime, format, config, record, url, xml) {

    /**
     * Definition of the Suitelet script trigger point.
     * 
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {

        // get Internal ID
        var recordId = context.request.parameters.id;

        // get template
        var reportFile = file.load({
            id: 'Templates/PDF Templates/Packing Slip PDF.ftl'
        });

        var reportTemplate = reportFile.getContents();

        var pdfMainTemplete = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
        pdfMainTemplete = pdfMainTemplete + '<pdfset>';

        var renderer = render.create();
        renderer.templateContent = reportTemplate;

        // output Obj
        var pdfDic = getPdfData(recordId);

        // get columns
        var columns = pdfDic.columns;
        // get output data
        var searchResults = pdfDic.searchResults;

        // get head data
        var headerDic = getHeaderData(searchResults, columns);

        // get detail data
        var detailDic = getDetailData(searchResults, columns);
        log.debug('detailDic', detailDic);

        var footerTotalList = detailDic.footerTotalList;
        delete detailDic['footerTotalList'];

        var footerDic = getFooterData(searchResults, columns, footerTotalList);

        // set pdf data
        for (var detailId in detailDic) {

            // head
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "headerInfo",
                data: headerDic
            });

            // detail
            var pageResultDic = {};
            pageResultDic['detail'] = detailDic[detailId];
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "dataInfo",
                data: pageResultDic
            });

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "footerInfo",
                data: footerDic
            });

            pdfTemplete = renderer.renderAsString();
            pdfMainTemplete = pdfMainTemplete + pdfTemplete;
        }

        pdfMainTemplete = pdfMainTemplete + '</pdfset>';

        var pdfFile = render.xmlToPdf({
            xmlString: pdfMainTemplete
        });

        var fileSystemTimee = getStrJapanDateTime2();

        pdfFile.name = 'Packing Slip_' + fileSystemTimee + '.pdf';

        // output PDF
        context.response.writeFile(pdfFile, true);
    }

    /**
     * get output data
     * 
     * @param recordId ID
     * @returns
     */
    function getPdfData(recordId) {
        var resultDic = {};
        var type = "itemfulfillment";
        var filters = [["type", "anyof", "ItemShip"], "AND", ["internalid", "anyof", recordId], "AND", ["voided", "is", "F"], "AND", ["taxline", "is", "F"], "AND", ["cogs", "is", "F"]];

        var columns = [search.createColumn({
            name: "trandate",
            join: "createdFrom",
            label: "order date"
        }),
        search.createColumn({
            name: "tranid",
            join: "createdFrom",
            label: "document number"
        }),
        search.createColumn({ name: "trandate", label: "ship date" }),
        search.createColumn({
            name: "itemid",
            join: "item",
            label: "item code"
        }),
        search.createColumn({
            name: "displayname",
            join: "item",
            label: "name"
        }),
        search.createColumn({
            name: "quantity",
            join: "appliedToTransaction",
            label: "order quantity"
        }),
        search.createColumn({ name: "unit", label: "unit" }),
        search.createColumn({
            name: "inventorynumber",
            join: "inventoryDetail",
            label: "lot number"
        }),
        search.createColumn({
            name: "quantity",
            join: "inventoryDetail",
            label: "inventoryDetail quantity"
        }),
        search.createColumn({ name: "formulatext", label: "Back Ordered" }),
        search.createColumn({ name: "quantity", label: "quantity" }),
        search.createColumn({ name: "createdfrom", label: "create from" }),
        search.createColumn({
            name: "country",
            join: "customer",
            label: "country"
        }), search.createColumn({
            name: "shipaddress1",
            join: "customer",
            label: "addr1"
        }), search.createColumn({
            name: "shipaddress2",
            join: "customer",
            label: "addr2"
        }),];
        resultDic.columns = columns;
        var searchResults = createSearch(type, filters, columns);

        searchResults.forEach(function (v) {
            log.debug('search data', v);
        });
        resultDic.searchResults = searchResults;
        return resultDic;
    }

    /**
     * Header data
     * 
     * @param searchResults
     * @param columns
     * @returns
     */
    function getHeaderData(searchResults, columns) {

        var headData = {};

        var subsidiary = record.load({
            type: "subsidiary",
            id: 3,
            isDynamic: true
        });

        var companyName = subsidiary.getValue({
            fieldId: 'name'
        });
        headData.companyName = companyName;

        var mainaddressKey = subsidiary.getValue({
            fieldId: 'mainaddress_key'
        });

        var address = record.load({
            type: "address",
            id: mainaddressKey,
            isDynamic: true
        });

        var attentionTemp = address.getValue({
            fieldId: 'attention'
        });
        var attention = xml.escape({
            xmlText: attentionTemp
        });
        headData.attention = attention;

        var addr1Temp = address.getValue({
            fieldId: 'addr1'
        });
        var addr1 = xml.escape({
            xmlText: addr1Temp
        });
        headData.addr1 = addr1;

        var addr2 = address.getValue({
            fieldId: 'addr2'
        });
        headData.addr2 = addr2;

        var zip = address.getValue({
            fieldId: 'zip'
        });
        headData.zip = zip;

        var createFrom = searchResults[0].getValue(columns[11]);
        if (!isEmpty(createFrom)) {
            var orderDate = searchResults[0].getValue(columns[0]);
            headData.orderDate = formatPdfDate1(orderDate);

            var orderNumber = searchResults[0].getValue(columns[1]);
            headData.orderNumber = orderNumber;
        }

        var shipDate = searchResults[0].getValue(columns[2]);
        headData.shipDate = formatPdfDate1(shipDate);

        var custAddr1 = searchResults[0].getValue(columns[12]);
        headData.custAddr1 = custAddr1;

        var custAddr2  = searchResults[0].getValue(columns[13]);
        headData.custAddr2 = custAddr2;

        var country = searchResults[0].getValue(columns[11]);
        headData.country = country;

        return headData;
    }

    /**
     * detail
     * 
     * @param searchResults
     * @param columns
     * @param recordId
     * @returns
     */
    function getDetailData(searchResults, columns) {
        var detailDataSumObj = {};

        var detailDataArray = [];

        var footerTotalList = [];

        var shipQtySum = 0;

        for (var i = 0; i < searchResults.length; i++) {
            var tempResult = searchResults[i];
            var detailDataObj = {};

            detailDataObj.item = tempResult.getValue(columns[3]);

            detailDataObj.displayname = tempResult.getValue(columns[4]);

            detailDataObj.orderQuantity = tempResult.getValue(columns[5]);

            detailDataObj.unit = tempResult.getValue(columns[6]);

            detailDataObj.lotNumber = tempResult.getText(columns[7]);

            detailDataObj.stockQty = tempResult.getValue(columns[8]);

            //detailDataObj.backOrdered = tempResult.getValue(columns[9]);

            detailDataObj.shipQuantity = tempResult.getValue(columns[9]);
            log.debug('ship qty', detailDataObj.shipQuantity);

            detailDataArray.push(detailDataObj);
        }
        footerTotalList.push(shipQtySum);

        detailDataSumObj.footerTotalList = footerTotalList;

        var pageSize = 3;
        var pageTotalNum = getPageNumber(detailDataArray.length, pageSize);
        for (var j = 1; j <= pageTotalNum; j++) {
            var pageDetailDataList = pagination(j, pageSize, detailDataArray);
            detailDataSumObj['A000' + j] = pageDetailDataList;
        }

        return detailDataSumObj;
    }

    function getFooterData() {
        var footerData = {};

        footerData.bankName = 'Bank Name: Kasikorn Bank';
        footerData.branchName = 'Branch Name: Bangkhunthien';

        return footerData;
    }

    function createSearch(searchType, searchFilters, searchColumns) {

        var resultList = [];
        var resultIndex = 0;
        var resultStep = 1000;

        var objSearch = search.create({
            type: searchType,
            filters: searchFilters,
            columns: searchColumns
        });
        var objResultSet = objSearch.run();

        do {
            var results = objResultSet.getRange({
                start: resultIndex,
                end: resultIndex + resultStep
            });

            if (results.length > 0) {
                resultList = resultList.concat(results);
                resultIndex = resultIndex + resultStep;
            }
        } while (results.length == 1000);

        return resultList;
    }

    function getJapanDate() {

        var now = new Date();

        var offSet = now.getTimezoneOffset();

        var offsetHours = 9 + (offSet / 60);

        now.setHours(now.getHours() + offsetHours);

        return now;
    }

    function getPageNumber(dataLen, pageSize) {
        return Math.ceil(dataLen / pageSize);
    }

    function pagination(pageNo, pageSize, array) {
        var offset = (pageNo - 1) * pageSize;
        return (offset + pageSize >= array.length) ? array.slice(offset, array.length) : array.slice(offset, offset + pageSize);
    }

    function npad(v) {
        if (v >= 10) {
            return v;
        } else {
            return '0' + v;
        }
    }

    function getStrJapanDateTime2() {

        var now = getJapanDate();

        var year = now.getFullYear();
        var month = npad(now.getMonth() + 1);
        var day = npad(now.getDate());
        var hours = npad(now.getHours());
        var minutes = npad(now.getMinutes());
        var seconds = npad(now.getSeconds());

        return '' + year + month + day + hours + minutes + seconds;
    }

    function isEmpty(obj) {
        if (obj === undefined || obj == null || obj === '' || obj == '- None -') {
            return true;
        }
        if (obj.length && obj.length > 0) {
            return false;
        }
        if (obj.length === 0) {
            return true;
        }
        for (var key in obj) {
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
        if (util.isDate(obj)) {
            return false;
        }
        return true;
    }

    function lookupFields(type, id, columns) {
        var fields = search.lookupFields({
            type: type,
            id: id,
            columns: columns
        });
        return fields;
    }

    function formatPdfDate1(strDate) {

        var fdate = format.parse({
            type : format.Type.DATE,
            value : strDate
        });

        var year = fdate.getFullYear();
        var month = npad(fdate.getMonth() + 1);
        var day = npad(fdate.getDate());

        return year + '/' + month + '/' + day;
    }

    return {
        onRequest: onRequest
    };

});

