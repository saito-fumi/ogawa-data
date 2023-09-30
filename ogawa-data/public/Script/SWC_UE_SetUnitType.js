/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search','N/record'],
    /**
 * @param{search} search
 */
    (search,record) => {
        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            // var rec = scriptContext.oldRecord;
            // var lineCount = rec.getLineCount({sublistId: 'recmachcustrecord_swc_body_invoice'});
            // var itemArr = [];
            // for (var i = 0;i < lineCount;i++){
            //     var item = rec.getSublistValue({sublistId: 'recmachcustrecord_swc_body_invoice', fieldId: 'custrecord_swcii_item', line: i});
            //     itemArr.push(item);
            // }
            // var itemJson = searchUnitTypeByItem(itemArr);
            // if (!itemJson)  return;
            // log.debug('itemJson',JSON.stringify(itemJson));
            // for (var i = 0;i < lineCount;i++){
            //     var it = rec.getSublistValue({sublistId: 'recmachcustrecord_swc_body_invoice', fieldId: 'custrecord_swcii_item', line: i});
            //     rec.setSublistValue({sublistId: 'recmachcustrecord_swc_body_invoice', fieldId: 'custrecord_swcii_unit', line: i,value: itemJson[it]})
            // }
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            var newRecord = scriptContext.newRecord;
            var id = newRecord.getValue({fieldId:'id'});
            log.debug('id',id);
            var rec = record.load({type:'customrecord_swc_body_invoice',id : id});
            var lineCount = newRecord.getLineCount({sublistId: 'recmachcustrecord_swc_body_invoice'});
            log.debug('lineCount',lineCount);
            var itemArr = [];
            for (var i = 0;i < lineCount;i++){
                var item = newRecord.getSublistValue({sublistId: 'recmachcustrecord_swc_body_invoice', fieldId: 'custrecord_swcii_item', line: i});
                itemArr.push(item);
            }
            log.debug('itemArr',itemArr);
            var itemJson = searchUnitTypeByItem(itemArr);
            if (!itemJson)  return;
            log.debug('itemJson',JSON.stringify(itemJson));
            for (var i = 0;i < lineCount;i++){
                var it = newRecord.getSublistValue({sublistId: 'recmachcustrecord_swc_body_invoice', fieldId: 'custrecord_swcii_item', line: i});
                log.debug('it',it);
                rec.setSublistValue({sublistId: 'recmachcustrecord_swc_body_invoice', fieldId: 'custrecord_swcii_unit', line: i,value: itemJson[it]});
                log.debug('111',itemJson[it]);
            }
            rec.save();
        }

        function searchUnitTypeByItem(itemArr) {
            if (!itemArr || itemArr.length == 0)    return;
            var json = {};
            var itemSearchObj = search.create({
                type: "item",
                filters:
                    [
                        ["internalid","anyof",itemArr]
                    ],
                columns:
                    [
                        search.createColumn({name: "internalid", label: "内部标识"}),
                        search.createColumn({name: "custitem3", label: "Unit Type"})
                    ]
            });
            var searchResultCount = itemSearchObj.runPaged().count;
            log.debug("itemSearchObj result count",searchResultCount);
            if (searchResultCount == 0) return;
            itemSearchObj.run().each(function(result){
                var id = result.getValue({name: "internalid", label: "内部标识"});
                var unitType  = result.getText({name: "custitem3", label: "Unit Type"});
                if (!json.hasOwnProperty(id)){
                    json[id] = unitType;
                }
                return true;
            });
            return json;
        }

        return {beforeSubmit,afterSubmit}

    });
