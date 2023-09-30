function main(request, response) {
	try {
		var method = request.getMethod();
		if (method == 'GET') {

		} else if (method == 'POST') {

		} else {
			throw 'Wrong request method';
		}
	} catch (ex) {
		response.write('Error : ' + ex);
	}
}