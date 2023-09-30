function injectPrint_beforeLoad(type, form) {//onload
    if (type == 'view') {
        var record = nlapiGetRecordType();
        // form.addButton('custpage_print_button', 'Print', "alert('go')");
        form.addButton('custpage_print_button', 'Print', "window.open('" +
            nlapiResolveURL('SUITELET', 53, 1) + '&inv_id=' + nlapiGetRecordId()
            + "')");

    }
}