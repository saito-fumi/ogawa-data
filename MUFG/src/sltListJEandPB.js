/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType Suitelet
 */
define(["N/log", "N/ui/serverWidget", "N/record", "N/search", "N/url", "./cltListJEandPB.js", "N/redirect"], function (
  log,
  serverWidget,
  record,
  search,
  url,
  ctrlFun,
  redirect
) {
  function onRequest(context) {
    //log.debug(context.request.method) // GET method
    if (context.request.method === "GET") {
      var custFormObj = createCustomForm("Approve Journals and Pay Bills");
      context.response.writePage(custFormObj);
    } else {
      // check how many lines in the sublist
      var countLine = context.request.getLineCount({ group: "custpage_table" });
      //log.debug('count', countLine);
      // trace num of record to be editted
      var num = 0;
      var editInternalID;
      for (var i = 0; i < countLine; i++) {
        var editTran = context.request.getSublistValue({
          group: "custpage_table",
          name: "approve",
          line: i
        });
        //log.debug('editTran', editTran);
        if (editTran == "T") {
          var editInternalID = context.request.getSublistValue({
            group: "custpage_table",
            name: "internalid",
            line: i,
          })
          var editRecordType = context.request.getSublistValue({
            group: "custpage_table",
            name: "recordtype",
            line: i,
          })
          ctrlFun.sendMUFG(editInternalID, editRecordType);
        };
      }
      redirect.toSuitelet({
        scriptId: "customscript_cog_listpage",
        deploymentId: "customdeploy1",
        //isExternal: boolean,
        //parameters: Object
      })

    }
  }
  function getSearchResult() {
    // return
    var objSearch = search.create({
      type: "transaction",
      filters: [
        search.createFilter({
          name: "type",
          operator: search.Operator.ANYOF,
          values: ["Journal", "VendPymt"],
        }),
        search.createFilter({
          name: "custbody_mufg_target",
          operator: search.Operator.IS,
          values: true,
        }),
      ],
      columns: [ // add the fields to be displayed on list
        search.createColumn({ name: "tranid" }),
        search.createColumn({ name: "account" }),
        search.createColumn({ name: "trandate" }),
      ],
    });
    var searchResult = objSearch.run();
    var results = searchResult.getRange({
      start: 0, end: 1000
    });
    keys = ['tranid'];
    var uniqueIds = [];
    // delete duplicate checked by tranid
    var filtered = results.filter(function (element) {
      const isDuplicate = uniqueIds.indexOf(element.id);
      if (isDuplicate === -1) {
        uniqueIds.push(element.id);
        return true;
      }
      return false;
    });
    // 
    var returnObj = filtered.filter(function (element) {
      var rec = record.load({ id: element.id, type: element.recordType });
      if (element.recordType === "journalentry") {
        var approveStatus = rec.getValue({ fieldId: "approved" })
        //log.debug('JE', approveStatus)
      } else {
        var approveStatus = rec.getValue({ fieldId: "custbody_approved" })
        //log.debug('PB', approveStatus)
      }
      if (approveStatus == true) { // exclude approved record
        return false;
      } else {
        return true;
      }
    });

    return returnObj;
  }
  function createCustomForm(title) {
    var formObj = serverWidget.createForm({ title: title });
    var resultList = getSearchResult();
    // create columns
    formObj.addSubmitButton({});
    var sublist = formObj.addSublist({
      id: "custpage_table",
      label: "Record to be approved",
      type: serverWidget.SublistType.LIST,
    });
    sublist.addMarkAllButtons();
    //log.debug("searchResult", results)
    sublist.addField({
      id: "approve",
      type: serverWidget.FieldType.CHECKBOX,
      label: "approve"
    });
    sublist.addField({
      id: "internalid",
      type: serverWidget.FieldType.TEXT,
      label: "id"
    });
    sublist.addField({
      id: "recordtype",
      type: serverWidget.FieldType.TEXT,
      label: "Record Type"
    });
    sublist.addField({
      id: "internalidlink",
      type: serverWidget.FieldType.URL,
      label: "View"
    }).linkText = 'View';
    // additonal columns below -------------------------
    sublist.addField({
      id: "tranid",
      type: serverWidget.FieldType.TEXT,
      label: "Transaction number"
    });
    sublist.addField({
      id: "memo",
      type: serverWidget.FieldType.TEXT,
      label: "memo"
    });
    sublist.addField({
      id: "trandate",
      type: serverWidget.FieldType.TEXT,
      label: "date"
    });
    // additonal columns above -------------------------
    // add data to columns
    for (var i = 0; i < resultList.length; i++) {
      var tmpRecord = record.load({id:resultList[i].id, type: resultList[i].recordType});
      sublist.setSublistValue({
        id: "approve",
        line: i,
        value: "F"
      });
      sublist.setSublistValue({
        id: "internalid",
        line: i,
        value: resultList[i].id
      });
      sublist.setSublistValue({
        id: "recordtype",
        line: i,
        value: resultList[i].recordType
      });
      // create link
      var recUrl = url.resolveRecord({
        recordType: resultList[i].recordType,
        recordId: resultList[i].id,
        isEditMode: false
      })
      sublist.setSublistValue({
        id: "internalidlink",
        line: i,
        value: recUrl,
      })
      // additonal columns below -------------------------
      sublist.setSublistValue({
        id: "tranid",
        line: i,
        value: tmpRecord.getText({fieldId:"transactionnumber"})
      });
      sublist.setSublistValue({
        id: "memo",
        line: i,
        value: tmpRecord.getText({fieldId:"memo"}) || '-'
      });
      sublist.setSublistValue({
        id: "trandate",
        line: i,
        value: tmpRecord.getText({fieldId:"trandate"})
      });
      // additonal columns above -------------------------
    }
    return formObj;
  }
  return {
    onRequest: onRequest,
  };
});


