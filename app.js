var mnet = require("net");
var mutil = require("util");
var mjSocketServer = require("./jSocketServer")

var options = {
	port : 5000
}
console.log("Server Started: ", new Date().getTime());
var server = new mjSocketServer(options, function(err, socket) {
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
		console.log("Object received");
	});

	socket.on("error", function() {
		console.log("Socket "+socket.socketID+" HAD AN ERROR");
	});


});

server.on("connection", function() {
	//console.log("Server connected");
	/*
	setInterval( function() {
		console.log("Client status: "+(server.getSocket("client") ? true : false));
	}, 5000);
`*/
});

server.on("close", function() {
	console.log("Server closed");
	server.emptySocketPool();
})
