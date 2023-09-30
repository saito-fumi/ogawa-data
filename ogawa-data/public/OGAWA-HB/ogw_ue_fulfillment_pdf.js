/**
 *fulfillment UserEvent
 * 
 * Version    Date            Author           Remarks
 * 1.00       2023/07/28     zdj
 *
 */

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/search'], function (search) {

	/**
	 * Function definition to be triggered before record is loaded.
	 * 
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {string} scriptContext.type - Trigger type
	 * @param {Form} scriptContext.form - Current form
	 * @Since 2015.2
	 */
	function beforeLoad(scriptContext) {
		var record = scriptContext.newRecord;
		var form = scriptContext.form;
		if (scriptContext.type == 'view') {
			var custFormId = lookupFields('itemfulfillment', record.id, 'customform').customform[0].value;

			if (custFormId == 229) {
				form.addButton({
					id: 'custpage_pdfPrint',
					label: 'Packing Slip PDF',
					functionName: 'pdfPrint()',
				});
				form.clientScriptModulePath = './ogw_cs_fulfillment_pdf.js';
			}
		}
	}

	function lookupFields(type, id, columns) {
		var fields = search.lookupFields({
			type: type,
			id: id,
			columns: columns
		});
		return fields;
	}

	return {
		beforeLoad: beforeLoad,
	};
});
