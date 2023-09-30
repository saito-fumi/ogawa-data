/**
 * @param {String}
 *            type Context Types: scheduled, ondemand, userinterface, aborted,
 *            skipped
 * @returns {Void}
 */
function scheduled(type) {
		var searchResults=getSearchResults('vendor',null,
				[
				], 
				[
				 
				   new nlobjSearchColumn("internalid",null,"GROUP").setSort(true)
				]
				);
					for(var i=0;i<searchResults.length;i++){
						
						governanceYield();
						
						try{
						var vendorid=searchResults[i].getValue("internalid",null,"GROUP")
						var vendorRecord=nlapiLoadRecord('vendor',vendorid);
						var form=vendorRecord.getFieldValue('customform');
						if(form=='57'){
						vendorRecord.setFieldValue('custentity_ogw_ogj_flag', 'T');
						nlapiSubmitRecord(vendorRecord, false, true); 
						}
						}catch(e){
							nlapiLogExecution('debug', 'errorid', vendorid)
						}
						
					}
}

/**
 * 
 * 
 * @param strSearchType
 * @param filters
 * @param columns
 * @returns {Array}
 */
function getSearchResults(type, id, filters, columns) {
    var search = nlapiCreateSearch(type, filters, columns);

    var searchResult = search.runSearch();
    var maxCount = 0;
    var results = [];
  if(!isEmpty(searchResult)){
    var resultInfo;
    try{
    do {
        resultInfo = searchResult.getResults(maxCount, maxCount + 1000);
        if (!isEmpty(resultInfo)) {
            resultInfo.forEach(function(row) {
                results.push(row);
            });
        }
        maxCount += 1000;
    } while (resultInfo.length == 1000);
    }catch(e){}
   }
    return results;
}
function isEmpty(obj) {
	if (obj === undefined || obj == null || obj === '') {
		return true;
	}
	if (obj.length && obj.length > 0) {
		return false;
	}
	if (obj.length === 0) {
		return true;
	}
	for ( var key in obj) {
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
	return true;
}
function governanceYield() {
	if (parseInt(nlapiGetContext().getRemainingUsage()) <= 300) {
		var state = nlapiYieldScript();
		if (state.status == 'FAILURE') {
			nlapiLogExecution('DEBUG', 'Failed to yield script.');
		} else if (state.status == 'RESUME') {
			nlapiLogExecution('DEBUG', 'Resuming script');
		}
	}
}
