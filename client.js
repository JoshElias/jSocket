var mjSocketClient = require("./jSocketClient");


var createString = function( length ) {
	var string = "";
	for( var i = 0; i < length; i++ ) {
		string+="|";
	}
	return string;
}

var getSampleData = function( index ) {
	return {
		moduleID : getClientID(index),
		data : {
			foo : "bar",
			smith : "johnson",
			blob : createString(1000000)
		}
	}
}

var getClientID = function( index) {
	return "client"+index;
}

var getOptions = function( index ) {
	return {
		moduleID : getClientID(index),
		port: 5000
	}
}

var runClient = function( index ) {

	var jSocketClient = new mjSocketClient( getOptions(index) );


	jSocketClient.on("connect", function() {
		console.log("Client connect Event");
		setInterval(function() {
			var data = getSampleData(index);
			console.log("Sending data to server");
			jSocketClient.write(data);
		}, 1000);
	});
}

var runClients = function() {

	var numOfClients = 10000;
	var clientIndex = 0;
	var task = setInterval( function() {
		runClient(clientIndex);
		clientIndex++;
		if(clientIndex == numOfClients)
			clearTimeout(task);
	}, 10);
}();




