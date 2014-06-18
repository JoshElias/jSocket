// INDEX FOR JSOCKET LIBRARY

var mJSocket = require("./jSocket");
var mJSocketClient = require("./jSocketClient");
var mJSocketServer = require("./jSocketServer");


// MAIN EXPORTS
module.exports = {
	socket : mJSocket,
	client : mJSocketClient,
	server : mJSocketServer
}