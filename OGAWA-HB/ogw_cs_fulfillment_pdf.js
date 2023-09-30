/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/ui/dialog', 'N/currentRecord', 'N/url', 'N/https'], function(dialog, currentRecord, url, https) {

	/**
     * Function to be executed after page is initialized.
     * 
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     * @since 2015.2
     */
    function pageInit(scriptContext) {

    }

    function pdfPrint() {
        var curRecord = currentRecord.get();
        var id = curRecord.id;
        var params = {};
        params.id = id;
        var scriptUrl = url.resolveScript({
            scriptId : 'customscript_ogw_sl_fulfillment_pdf',
            deploymentId : 'customdeploy_ogw_sl_fulfillment_pdf',
            params : params,
            returnExternalUrl : false,
        });
        window.open(scriptUrl);
    }

    return {
		pageInit : pageInit,
        pdfPrint : pdfPrint
    };
});