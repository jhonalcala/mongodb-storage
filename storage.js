'use strict';

var inherits     = require('util').inherits,
	EventEmitter = require('events').EventEmitter;

function Storage() {
	if (!(this instanceof Storage)) {
		return new Storage();
	}

	EventEmitter.call(this);
	Storage.init.call(this);
}

inherits(Storage, EventEmitter);

Storage.init = function () {
	var self = this;

	process.on('message', function (m) {
		if (m.type === 'ready')
			self.emit('ready', m.data.options);
		else if (m.type === 'data')
			self.emit('data', m.data);
	});
};

Storage.prototype.sendLog = function(title, description) {
	process.send({
		type: 'log',
		data: {
			title: title,
			description: description
		}
	});
};

Storage.prototype.sendError = function(error) {
	process.send({
		type: 'error',
		data: {
			name: error.name,
			message: error.message,
			stack: error.stack
		}
	});
};

process.on('uncaughtException', function (error) {
	console.error('Uncaught Exception', error);
	process.send({
		type: 'error',
		data: {
			name: error.name,
			message: error.message,
			stack: error.stack
		}
	});
});

process.on('exit', function () {
	process.send({
		type: 'exit'
	});
});

process.on('SIGTERM', function () {
	process.send({
		type: 'terminate'
	});
});

module.exports = Storage;