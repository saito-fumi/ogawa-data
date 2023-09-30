
function main(request, response) {
	try {
		var method = request.getMethod();
		var form;
		if (method == 'GET') {
			form = getForm();
		} else if (method == 'POST') {

		} else {
			throw 'Wrong request method';
		}
		response.writePage(form);
	} catch (ex) {
		response.write('Error : ' + ex);
	}
}
function getForm(){
	var form = nlapiCreateForm('Sales Report', false);
	form.setScript('customscript_ps_sales_report_cl');
	form.addField('custpage_cust_cat', 'select', 'Customer Category');
	form.addField('custpage_class', 'select', 'Class','class');
	form.addField('custpage_sales_rep', 'select', 'Sales Representative','employee');
	form.addField('custpage_customer', 'select', 'Customer','customer');	
	
	form.addButton('custpage_search', 'Search', 'search()');
	
	
	return form;
}