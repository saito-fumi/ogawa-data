/**
 * quote.data.js
 * @NApiVersion 2.x
 */
 define(['N/record', 'N/format', 'N/xml', 'N/search'],
 function (record, format, xml, search) {
     function getInvoice(invoiceId) {
         var invoice = record.load({
             type: 'invoice',
             id: invoiceId
         });
         var customer = record.load({
             type: 'customer',
             id: invoice.getValue('entity')
         });
         var count = invoice.getLineCount('item');
         var items = [];
         for (var i = 0; i < count; i++) {
             items.push({
                 serial: invoice.getSublistValue({
                     sublistId: 'item',
                     fieldId: 'custcol_number',
                     line: i
                 }),
                 /*item: invoice.getSublistText({
                     sublistId: 'item',
                     fieldId: 'item',
                     line: i
                 }),*/
                 //added 29 April 2019
                 //changes to get only displayname of the item
                 item: search.lookupFields({
                     type: search.Type.ITEM,
                     id: invoice.getSublistValue({
                             sublistId: 'item',
                             fieldId: 'item',
                             line: i
                         }),
                     columns:'displayname'
                 })['displayname'],
                 custcol_ogb_cust_po: invoice.getSublistValue({
                     sublistId: 'item',
                     fieldId: 'custcol7',
                     line: i
                 }),
                 quantity: invoice.getSublistValue({
                     sublistId: 'item',
                     fieldId: 'quantity',
                     line: i
                 }),
                 unit: invoice.getSublistValue({
                     sublistId: 'item',
                     fieldId: 'custcol4',
                     line: i
                 }),
                 rate: amountify(invoice.getSublistValue({
                     sublistId: 'item',
                     fieldId: 'rate',
                     line: i
                 })),
                 amount: amountify(invoice.getSublistValue({
                     sublistId: 'item',
                     fieldId: 'amount',
                     line: i
                 }))
             });
         }
         return {
             customerCode: customer.getValue('entityid')?customer.getValue('entityid'):"",
             trandate: format.format({
                 value: invoice.getText('trandate'),
                 type: format.Type.DATE
             }),
             tranid: invoice.getText('tranid'),
             customerName: customer.getValue('altname'),
             otherrefnum: invoice.getValue('otherrefnum'),
             billaddress: distribute(invoice.getValue('billaddress')),
             terms: invoice.getText('terms'),
             duedate: invoice.getValue('duedate')?format.format({
                 value:  invoice.getValue('duedate'),
                 type: format.Type.DATE 
             }):"",
             branch: invoice.getValue('custbody26'),
             salesrep: invoice.getText('salesrep'),
             total: amountify(invoice.getValue('total')),
             subtotal: amountify(invoice.getValue('subtotal')),
             taxtotal: amountify(invoice.getValue('taxtotal')),
             taxrate:
                 invoice.getSublistText({
                     sublistId: 'item',
                     fieldId: 'taxrate1',
                     line: 0,
                 }),
             amountInWords: amountToEnglish(+invoice.getValue('total'), ' '),
             message: distribute(
                 xml.escape({
                     xmlText: invoice.getValue('message')
                 })
             ),                
             vatregnum: customer.getValue('vatregnumber'),
             item: items
         }
     }
     function amountify(value) {
         return value && (+value || 0).toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,") || '0.00';
     }
     function distribute(value) {
         return (value || '').replace(/[\n]/g, '<br />').replace("&","&");
     }
     function amountToEnglish(amount) {
         var amountString = amountify(amount);
         var amounts = amountString.split('.');
         if (amounts.length == 2) {
             //return numberToEnglish(amounts[0]) + ' point ' + numberToEnglish(amounts[1]) + ' Baht';
             if(parseInt(amounts[1],10)>0) {
               return numberToEnglish(amounts[0]) + 'point' + numberToEnglish(amounts[1]) + ' Only';
             }else{
               return numberToEnglish(amounts[0]) + ' Only';
             }
         }
         else if (amounts.length == 1)
             return numberToEnglish(amount) + ' Only'
         else {
             throw "Invalid amount " + amount
         }

     }
     /* million'th amount is not working
      * numberToEnglish('1234567') "Twelve Lakhs Thirty Four Thousand Five Hundred and Sixty Seven"
      */
     /*
     function numberToEnglish(amount, custom_join_character) {
         var words = new Array();
         words[0] = '';
         words[1] = 'One';
         words[2] = 'Two';
         words[3] = 'Three';
         words[4] = 'Four';
         words[5] = 'Five';
         words[6] = 'Six';
         words[7] = 'Seven';
         words[8] = 'Eight';
         words[9] = 'Nine';
         words[10] = 'Ten';
         words[11] = 'Eleven';
         words[12] = 'Twelve';
         words[13] = 'Thirteen';
         words[14] = 'Fourteen';
         words[15] = 'Fifteen';
         words[16] = 'Sixteen';
         words[17] = 'Seventeen';
         words[18] = 'Eighteen';
         words[19] = 'Nineteen';
         words[20] = 'Twenty';
         words[30] = 'Thirty';
         words[40] = 'Forty';
         words[50] = 'Fifty';
         words[60] = 'Sixty';
         words[70] = 'Seventy';
         words[80] = 'Eighty';
         words[90] = 'Ninety';
         amount = amount.toString();
         var atemp = amount.split(".");
         var number = atemp[0].split(",").join("");
         var n_length = number.length;
         var words_string = "";
         if (n_length <= 9) {
             var n_array = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0);
             var received_n_array = new Array();
             for (var i = 0; i < n_length; i++) {
                 received_n_array[i] = number.substr(i, 1);
             }
             for (var i = 9 - n_length, j = 0; i < 9; i++ , j++) {
                 n_array[i] = received_n_array[j];
             }
             for (var i = 0, j = 1; i < 9; i++ , j++) {
                 if (i == 0 || i == 2 || i == 4 || i == 7) {
                     if (n_array[i] == 1) {
                         n_array[j] = 10 + parseInt(n_array[j]);
                         n_array[i] = 0;
                     }
                 }
             }
             value = "";
             for (var i = 0; i < 9; i++) {
                 if (i == 0 || i == 2 || i == 4 || i == 7) {
                     value = n_array[i] * 10;
                 } else {
                     value = n_array[i];
                 }
                 if (value != 0) {
                     words_string += words[value] + " ";
                 }
                 if ((i == 1 && value != 0) || (i == 0 && value != 0 && n_array[i + 1] == 0)) {
                     words_string += "Crores ";
                 }
                 if ((i == 3 && value != 0) || (i == 2 && value != 0 && n_array[i + 1] == 0)) {
                     words_string += "Lakhs ";
                 }
                 if ((i == 5 && value != 0) || (i == 4 && value != 0 && n_array[i + 1] == 0)) {
                     words_string += "Thousand ";
                 }
                 if (i == 6 && value != 0 && (n_array[i + 1] != 0 && n_array[i + 2] != 0)) {
                     words_string += "Hundred and ";
                 } else if (i == 6 && value != 0) {
                     words_string += "Hundred ";
                 }
             }
             words_string = words_string.split("  ").join(" ");
         }
         return words_string;
     }*/
     //https://ourcodeworld.com/articles/read/353/how-to-convert-numbers-to-words-number-spelling-in-javascript
     function numberToEnglish(n, custom_join_character) {

         var strN = n.toString(),
             units, tens, scales, start, end, chunks, chunksLen, chunk, ints, i, word, words;

         var and = custom_join_character || '';

         /* Is number zero? */
         if (parseInt(strN) === 0) {
             return 'zero';
         }

         strN = strN.replace(/,/g, '').replace(/\./g, '');

         /* Array of units as words */
         units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

         /* Array of tens as words */
         tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

         /* Array of scales as words */
         scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion', 'Quadrillion', 'Quintillion', 'Sextillion', 'Septillion', 'Octillion', 'Nonillion', 'Decillion', 'Undecillion', 'Duodecillion', 'Tredecillion', 'Quatttuor-decillion', 'Quindecillion', 'Sexdecillion', 'Septen-decillion', 'Octodecillion', 'Novemdecillion', 'Vigintillion', 'Centillion'];

         /* Split user arguemnt into 3 digit chunks from right to left */
         start = strN.length;
         chunks = [];
         while (start > 0) {
             end = start;
             chunks.push(strN.slice((start = Math.max(0, start - 3)), end));
         }

         /* Check if function has enough scale words to be able to stringify the user argument */
         chunksLen = chunks.length;
         if (chunksLen > scales.length) {
             return '';
         }

         /* Stringify each integer in each chunk */
         words = [];
         for (i = 0; i < chunksLen; i++) {

             chunk = parseInt(chunks[i]);

             if (chunk) {

                 /* Split chunk into array of individual integers */
                 ints = chunks[i].split('').reverse().map(parseFloat);

                 /* If tens integer is 1, i.e. 10, then add 10 to units integer */
                 if (ints[1] === 1) {
                     ints[0] += 10;
                 }

                 /* Add scale word if chunk is not zero and array item exists */
                 if ((word = scales[i])) {
                     words.push(word);
                 }

                 /* Add unit word if array item exists */
                 if ((word = units[ints[0]])) {
                     words.push(word);
                 }

                 /* Add tens word if array item exists */
                 if ((word = tens[ints[1]])) {
                     words.push(word);
                 }

                 /* Add 'and' string after units or tens integer if: */
                 if (ints[0] || ints[1]) {

                     /* Chunk has a hundreds integer or chunk is the first of multiple chunks */
                     if (ints[2] || !i && chunksLen) {
                         words.push(and);
                     }

                 }

                 /* Add hundreds word if array item exists */
                 if ((word = units[ints[2]])) {
                     words.push(word + ' Hundred');
                 }

             }

         }

         words = words.filter(function (el) {
           return el != '';
         });

         return words.reverse().join(' ');
     }
     return {
         getInvoice: getInvoice
     }
 })