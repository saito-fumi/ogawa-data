/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search'],

    function(search) {

        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        function postSourcing(scriptContext) {
            alert('111');
            var rec = scriptContext.currentRecord;
            var sublist = scriptContext.sublistId;
            var field = scriptContext.fieldId;
            if (sublist == 'recmachcustrecord_swc_body_invoice' && field == 'custrecord_swcii_item'){
                var itemId = rec.getCurrentSublistValue({sublistId: sublist,fieldId: field});
                var unit = search.lookupFields({
                    type: search.Type.ITEM,
                    id: itemId,
                    columns: 'custitem3'
                });
                if (!unit)  return;
                unit = unit['custitem3'][0]['text'];
                log.debug('unit',unit);
                rec.setCurrentSublistValue({
                    sublistId: sublist,
                    fieldId: 'custrecord_swcii_unit',
                    value: unit
                });
            }
        }

        return {
            postSourcing: postSourcing
        };

    });
