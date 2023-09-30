/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@NAmdConfig  ./../ss2.config.json
 */
define(['N/file', 'N/runtime', 'ps/templating', './invoice.data'],
    function (file, runtime, templating, data) {
        function onRequest(context) {
            try {
                log.debug('Context', context);
                log.audit({ title: 'Remaining limit', details: runtime.getCurrentScript().getRemainingUsage() })
                var invoiceId = context.request.parameters['inv_id'];
              log.audit('invoiceid',invoiceId);
             //   var fileId = context.request.parameters['file_id'];
             var fileId = 1598;
                log.debug(fileId);
                var pdfData = data.getInvoice(invoiceId);
               
                log.debug('PDF Data', pdfData);
                context.response.renderPdf({
                    xmlString:
                        templating.render(
                            file.load({ id: ((!fileId)?1598:fileId) }).getContents(),
                            pdfData
                        )
                });
                //context.response.write(file.load({ id: 342 }).getContents());
                log.audit({ title: 'Remaining limit', details: runtime.getCurrentScript().getRemainingUsage() })
            } catch (ex) {
                log.error({ title: 'Error occurred', details: ex });
                context.response.write(ex);
            }
        }
        return {
            onRequest: onRequest
        };
    });