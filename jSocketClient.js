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

// Set static properties
//JSocketClient.maxReconnects = 5;



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

JSocketClient.prototype.socketListener = function( jSocket ) {
	var JSocketClient = this;

	jSocket.on("connect", function() {
		JSocketClient.emit("connect");
	});

	jSocket.on("heartbeat", function() {
		console.log("Client received heartbeat")
		JSocketClient.echoHeartbeat( jSocket );
	});

	jSocket.on("data", function(data) {
		JSocketClient.emit("data");
	});

	jSocket.on("end", function() {
		JSocketClient.emit("end");
	});
	
	jSocket.on("drain", function() {
		JSocketClient.emit("drain");
	});
	
	jSocket.on("error", function(err) {
		console.log("Socket closed due to error: ", err);
		JSocketClient.attemptReconnect();
		JSocketClient.emit("error", err);
	});
	
	jSocket.on("close", function(had_error) {
		JSocketClient.emit("close", had_error);
	});

}

JSocketClient.prototype.write = function( data ) {
	this.socket.write( data );
}

JSocketClient.prototype.echoHeartbeat = function( jSocket ) {
	var echo = { moduleID: this.moduleID };
	jSocket.write( echo );
}

JSocketClient.prototype.attemptReconnect = function() {
	console.log("Attemping Reconnect...");
	var attempts = 0;
	setTimeout( function() {
		this.socket.close();
		this.socket.connect(this.targetPort);
	}, 1000);
}

JSocketClient.prototype.destroy = function() {
	this.socket.destroy();
}


// MODULE EXPORTS
module.exports = JSocketClient;