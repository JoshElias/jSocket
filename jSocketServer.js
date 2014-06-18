/*
 *	JSOCKET SERVER MODULE
 */ 

var mnet = require("net");
var mutil = require("util");
var mevents = require("events");
var mjSocket = require("./jSocket");

/*
options : {
	port: {string} Port to listen on
}
*/
var JSocketServer = function( options, callback ) {
	if( typeof(options) != "object" ) {
		callback("Invalid object passed for options");
		return;
	}
	if( typeof(options.port) != "number" ) {
		callback("Must specify a port number in options");
		return;
	}

	// Hook up Event Emitter Functionality
	mevents.EventEmitter.call(this);

	// Set up static class properties
	this.socketPool = new Array(JSocketServer.maxConnections);
	this.socketMap = {};


	this.initServer( options, callback );
};


// Inherit from EventEmitter
mutil.inherits(JSocketServer, mevents.EventEmitter);

// Set up static class properties
JSocketServer.maxConnections = 10000;
JSocketServer.pingInterval = 3000;




JSocketServer.prototype.initServer = function( options, callback ) {
	// Hook up raw tcp server
	var jSocketServer = this;
	var server = mnet.createServer( function( socket ) {
		jSocketServer.handleSocket( socket, callback );
	});

	server.listen(options.port, function() {
		console.log("Socket Server is bound");
	})

	this.serverListener( server );
	this.startClientHeartbeat();
}

JSocketServer.prototype.serverListener = function( server ) {
	var jSocketServer = this;
	server.on("listening", function() {
		jSocketServer.emit("listening");
	});

	server.on("connection", function() {
		jSocketServer.emit("connection");
	});

	server.on("close", function() {
		jSocketServer.emit("close");
	});

	server.on("error", function( err ) {
		jSocketServer.emit("error", err );
	});
}

JSocketServer.prototype.handleSocket = function( socket, callback ) {
	var jSocketServer = this;
	var jSocket = this.createSocket( socket );

	jSocket.on("data", function( data ) {
		jSocketServer.mapSocket(jSocket, data.moduleID);
	});

	jSocket.on("close", function(err) {
		jSocketServer.removeSocket(jSocket);
	});

	jSocket.on("error", function(err) {
		jSocketServer.removeSocket(jSocket);
	});

	// Callback with JSocket
	callback( undefined, jSocket );
}

JSocketServer.prototype.createSocket = function( socket ) {
	var jSocket;
	for( var i = 0; i < JSocketServer.maxConnections; i++ ) {
		if( typeof(this.socketPool[i]) == "undefined" ) {
			console.log("New Socket: ",i);
			jSocket = new mjSocket(socket, i);
			this.socketPool[i] = jSocket;
			break;
		}
	}
	return jSocket;
}

JSocketServer.prototype.mapSocket = function( jSocket, moduleID ) {
	if( typeof(this.socketMap[moduleID]) != "undefined" ) {
		if(this.socketMap[moduleID] != jSocket.socketID) {
			console.log("Inconsitent Socket Mapping");
		}
		return;	
	} 
		
	jSocket.moduleID = moduleID;
	this.socketMap[moduleID] = jSocket.socketID;
}

JSocketServer.prototype.getSocket = function( key ) {
	if( typeof(this.socketMap[key]) != "undefined") 
		return this.socketPool[this.socketMap[key]];

	return this.socketPool[key];
}

JSocketServer.prototype.removeSocket = function( jSocket ) {
	if( typeof(jSocket.moduleID) != "" ) {
		if( typeof(this.socketMap[jSocket.moduleID]) != "undefined") {
			 delete this.socketMap[jSocket.moduleID]
		}
	}
	
	delete this.socketPool[jSocket.socketID];
}

JSocketServer.prototype.emptySocketPool = function() {
	console.log("Emptying Socket Pool")
	for( var key in this.socketPool) {
		console.log("Destroying Socket: "+key);
		this.socketPool[key].destroy;
	}
}

JSocketServer.prototype.startClientHeartbeat = function() {
	var jSocketServer = this;
	setInterval( function() {
		for( var key in jSocketServer.socketPool ) {
			var client = jSocketServer.socketPool[key];
			client.write( {moduleID:"server"} );
		}
	}, JSocketServer.pingInterval);
}

// MAIN EXPORTS
module.exports = JSocketServer;