/*
 *	JSOCKET MODULE
 */

var mnet = require("net");
var mutil = require("util");
var mevents = require("events");

/*
JSocket is wrapper for a raw net socket in node.js. It's responsible for aggregating 
all the data streamed to it into a complete data object that can be acted on.
It packages your messages between "<<<" and ">>>" which helps it determine when your message begins and ends.
This is so when this class emits a "data" event, you know it's the full message from the sender and not a piece.

socket: {object} This is the raw net socket we are wrapping, if omitted we'll create one ourselves.
id: {string} This is the id we wish to assign to this socket
*/
var JSocket = function( socket, id ) {

	// Hook up Event Emitter Functionality
	mevents.EventEmitter.call(this);

	// Check for passed socket
	if( typeof(socket) == "undefined" ) {
		socket = new mnet.Socket({
			allowHalfOpen: true,
			readable: true,
			writable: true
		});
	}

	// Hook up raw socket
	this.socket = socket;
	this.socketID = id;
	this.socketListener( this.socket );

	// Set class properties
	this.moduleID = "";
	this.dataArray = [];
	this.dataString = "";
}

// Inherit from EventEmitter to be able to emit messages
mutil.inherits(JSocket, mevents.EventEmitter);

// This regex we use to find full messages in the stringified data array we collect from the raw net socket
JSocket.packageRegEx = /<<<(.*?)>>>/g;

// Listens to the raw net socket's events, acts on it and emits it's own event for 
// the user to act on as well
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

// Everytime we get a data event from the raw net socket we call this function.
// We push the data buffer to our dataArray and stringify what we have collected so far.
// We regex that string to see if we have any completed messages. For every completed message
// we parse it into a JSON object and emit our own data event with that object.
// We then flush the data array and string so we can start collecting data again for the next messages.
JSocket.prototype.collectData = function( data ) {
	this.dataArray.push(data)
	var buffer = Buffer.concat(this.dataArray);
	this.dataString = buffer.toString();
	var dataMatches = this.dataString.match(JSocket.packageRegEx);
	
	if( dataMatches !== null && dataMatches.length > 0) {
		var i = 0;
		for( i; i < dataMatches.length; i++) {
			var parsedData = this.unpackageData( dataMatches[i] );
			this.emit("data", parsedData);
		}
		
		// Flush the jsocket in preparation for the next stream
		this.flushData();
	}		
}

// This is where we set the delimiters for our data.
JSocket.prototype.packageData = function( data ) {
	return "<<<"+JSON.stringify(data)+">>>";
}

// Unpackage the data by shaving off the first and last 3 characters. 
// These will be the "<<<" and ">>>"
JSocket.prototype.unpackageData = function( data ) {
	return JSON.parse( data.substring(3, data.length-3) );
}

// Clean the data we use to collect the messages from the raw net socket
JSocket.prototype.flushData = function() {
	this.dataArray = [];
	this.dataString = "";
}

// Expose certain functionality of our underlying raw net socket

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