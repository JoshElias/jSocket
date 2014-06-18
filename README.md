jSocket
=======

Socket implemented with node's net module


	var jSocket = require("jSocket");



// SET UP THE SERVER

	var options = {
		port : 5000
	}

	var server = new jSocket.server(options, function(err, socket) {
		if( err ) {
			console.log("Error Creating jSocketServer");
			console.log(err);
			return;
		}
		
		socket.on("heartbeat", function( data ) {
		})

		socket.on("data", function( data ) {
		});

		socket.on("close", function(err) {
			if(err) console.log("Socket "+socket.socketID+" closed due to error");
			else console.log("Socket "+socket.socketID+" closed");
		});

		socket.on("end", function() {
			console.log("Socket "+socket.socketID+" ended");
		});

		socket.on("error", function() {
			console.log("Socket "+socket.socketID+" HAD AN ERROR");
		});
	});

	server.on("connection", function() {
		//console.log("Server connected");
	});

	server.on("close", function() {
		console.log("Server closed");
		server.emptySocketPool();
	}


// SET UP THE CLIENT

	var options = {
			moduleID : "client",
			port: 5000
	}

	var runClient = function( index ) {

	var jSocketClient = new jSocket.client( getOptions(index) );


	jSocketClient.on("connect", function() {
		console.log("Client connected");
		jSocketClient.write(data);
	});
