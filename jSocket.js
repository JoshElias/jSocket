/*
 *	JSOCKET MODULE
 */

var mutil = require("util");
var mevents = require("events");


var JSocket = function( socket, id ) {
	// Hook up Event Emitter Functionality
	mevents.EventEmitter.call(this);

	// Hook up raw socket
	this.socket = socket;
	this.socketID = id;
	this.socketListener( this.socket );

	// Set class properties
	this.moduleID = "";
	this.dataArray = [];
	this.dataString = "";
}

// Inherit from EventEmitter
mutil.inherits(JSocket, mevents.EventEmitter);

JSocket.packageRegEx = /<<<(.*?)>>>/g;


JSocket.prototype.socketListener = function( socket ) {
	var jsocket = this;
	socket.on("connect", function() {
		jsocket.emit("connect");
	});

	socket.on("data", function(data) {
		jsocket.collectData(data);
	});

	socket.on("end", function() {
		jsocket.emit("end");
	});
	
	socket.on("drain", function() {
		jsocket.emit("drain");
	});
	
	socket.on("error", function(err) {
		jsocket.emit("error", err);
	});
	
	socket.on("close", function(had_error) {
		jsocket.emit("close", had_error);
	});
};

JSocket.prototype.collectData = function( data ) {
	this.dataArray.push(data)
	var buffer = Buffer.concat(this.dataArray);
	this.dataString = buffer.toString();
	var dataMatches = this.dataString.match(JSocket.packageRegEx);
	
	if( dataMatches !== null && dataMatches.length > 0) {
		var i = 0;
		for( i; i < dataMatches.length; i++) {

			var parsedData = this.unpackageData( dataMatches[i] );

			// If the parsed data had some data then emit the data event,
			// else it's just a heartbeat
			if( typeof(parsedData.data) != "undefined" ) {
				this.emit("data", parsedData)
			} else {
				this.emit("heartbeat", parsedData);
			}

		}
		
		// Flush the jsocket in preparation for the next stream
		this.flushData();
	}		
}

JSocket.prototype.packageData = function( data ) {
	return "<<<"+JSON.stringify(data)+">>>";
}

JSocket.prototype.unpackageData = function( data ) {
	return JSON.parse( data.substring(3, data.length-3) );
}

JSocket.prototype.flushData = function() {
	this.dataArray = [];
	this.dataString = "";
}

JSocket.prototype.connect = function( options ) {
	this.socket.connect( options );
}

JSocket.prototype.write = function( data ) {
	this.socket.write( this.packageData(data) );
}

JSocket.prototype.destroy = function() {
	this.socket.destroy();
}


// MAIN EXPORTS
module.exports = JSocket;