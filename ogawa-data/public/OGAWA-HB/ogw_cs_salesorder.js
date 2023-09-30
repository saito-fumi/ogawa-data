/**
 * ��������Client
 * SO Client
 * Version    Date            Author           Remarks
 * 1.00       2023/02/08    
 *
 */

// SO-OGJ-�J�X�^���E�t�H�[��
var so_ogj_custForm = "239";

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @returns {Boolean} True to continue save, false to abort save
 */

function clientPageInit(type){
	if(type=='copy'){
		nlapiSetFieldValue('otherrefnum', '');
	}	
}

function clientSaveRecord(){
	try {
		var soCustform = nlapiGetFieldValue('customform');
		if (soCustform == so_ogj_custForm) {
			var isdropshipitemArr = new Array();
			var itemCount = nlapiGetLineItemCount('item');
			for (var i = 1; i < itemCount + 1; i++) {
				if (nlapiGetCurrentLineItemValue('item', 'itemtype') != 'EndGroup') {
					var itemId = nlapiGetLineItemValue('item', 'item', i);
					if (!isEmpty(itemId)) {
						
						// �����A�C�e��
						var isdropshipitem = nlapiLookupField('item', itemId,'isdropshipitem')
						isdropshipitemArr.push(isdropshipitem);
					}
				}
			}
			var itemflgArr = unique1(isdropshipitemArr);

			// only T or F itemflgArr.length=1 else itemflgArr.length > 1 need alert warning message
			if (itemflgArr.length > 1) {
				if (confirm("Note: including Drop Shipment Item and Non Drop shipment item")) {
				} else {
					return false;
				}
			}
			return true;
		}
	} catch (e) {
	}
}

/**
 * �d���f�[�^���폜����
 * 
 * @param array
 *            ���X�g
 * @returns ���X�g
 */
function unique1(arr){
	  var hash=[];
	  for (var i = 0; i < arr.length; i++) {
	     if(hash.indexOf(arr[i])==-1){
	      hash.push(arr[i]);
	     }
	  }
	  return hash;
}

/**
 * ��l�𔻒f
 * 
 * @param str
 *            �Ώ�
 * @returns ���f����
 */
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