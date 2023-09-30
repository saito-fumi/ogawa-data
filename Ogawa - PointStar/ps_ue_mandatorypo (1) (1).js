function userEventBeforeLoad_man_col(type, form, request){
	if((type == 'create' || type == 'edit') && nlapiGetFieldValue('customform') == 188){
		var nIndex = nlapiGetCurrentLineItemIndex('item');
		var subObj = nlapiGetLineItemField('item', 'createpo', nIndex);
		subObj.setMandatory(true);
	}
}
