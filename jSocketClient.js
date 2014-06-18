/*
 *	JSOCKET CLIENT MODULE
 */ 

var mnet = require("net");
var mutil = require("util");
var mevents = require("events");
var mjSocket = require("./jSocket");



/*
options : {
	moduleID: {string} ID of the module this client represents
	port: {string} port we are trying to connect to
}
*/
var JSocketClient = function( options ) {
	if( typeof(options) != "object" ) {
		callback("Invalid object passed for options");
		return;
	}
	if( typeof(options.moduleID) != "string" ) {
		callback("Must specify a moduleID for this client");
		return;
	}
	if( typeof(options.port) != "number" ) {
		callback("Must specify a port number in options");
		return;
	}

	// Hook up Event Emitter Functionality
	mevents.EventEmitter.call(this);

	// Set propeties
	this.moduleID = options.moduleID;
	this.targetPort = options.port;

	this.connectSocket();
};

// Inherit from EventEmitter
mutil.inherits(JSocketClient, mevents.EventEmitter);


// Every JSocketClient has a socket it uses to transfer data to the server
JSocketClient.prototype.connectSocket = function() {

	var socket = new mnet.Socket({
		allowHalfOpen: true,
		readable: true,
		writable: true
	});

	var jSocket = new mjSocket( socket );
	this.socket = jSocket;
	jSocket.connect( this.targetPort );

	this.socketListener( jSocket );
}

// Listens to all the events emitted by the socket and responds accordingly
JSocketClient.prototype.socketListener = function( jSocket ) {
	var JSocketClient = this;

	jSocket.on("connect", function() {
		JSocketClient.emit("connect");
	});

	jSocket.on("data", function(data) {
		JSocketClient.onData(jSocket, data);
	});

	jSocket.on("end", function() {
		JSocketClient.emit("end");
	});
	
	jSocket.on("drain", function() {
		JSocketClient.emit("drain");
	});
	
	jSocket.on("error", function(err) {
		JSocketClient.attemptReconnect();
		JSocketClient.emit("error", err);
	});
	
	jSocket.on("close", function(had_error) {
		JSocketClient.emit("close", had_error);
	});

}

// When data is reading to be read from the JSocket, we determine if 
// it has data that needs to be worked with or if it's just a heartbeat
JSocketClient.prototype.onData = function( jSocket, data ) {
	if( typeof(data.data) != "undefined" ) {
		this.emit("data", data)
	} else {
		JSocketClient.echoHeartbeat( jSocket );
		this.emit("heartbeat", data);
	}
}

// When we receive an echo from the server we respond with our moduleID 
// to let it know that we are still connected
JSocketClient.prototype.echoHeartbeat = function( jSocket ) {
	var echo = { moduleID: this.moduleID };
	jSocket.write( echo );
}

// If our underlying socket is closed due to an error, we attempt
// to reconnect it once after waiting 1 second
JSocketClient.prototype.attemptReconnect = function() {
	var attempts = 0;
	setTimeout( function() {
		this.socket.close();
		this.socket.connect(this.targetPort);
	}, 1000);
}

// Expose certain functionality of our underlying socket

JSocketClient.prototype.write = function( data ) {
	this.socket.write( data );
}

JSocketClient.prototype.destroy = function() {
	this.socket.destroy();
}


// MODULE EXPORTS
module.exports = JSocketClient;