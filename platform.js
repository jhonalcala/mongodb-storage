'use strict';

var inherits     = require('util').inherits,
	EventEmitter = require('events').EventEmitter;

function Platform() {
	if (!(this instanceof Platform)) {
		return new Platform();
	}

	var self = this;
	var _notifyExit = function () {
		process.send({
			type: 'exit'
		});
	};

	process.on('uncaughtException', function (error) {
		console.error('Uncaught Exception', error);
		self.handleException(error);
	});

	process.on('exit', function () {
		_notifyExit();
	});

	process.on('SIGTERM', function () {
		_notifyExit();
	});

	EventEmitter.call(this);
	Platform.init.call(this);
}

inherits(Platform, EventEmitter);

Platform.init = function () {
	var self = this;

	process.on('message', function (m) {
		if (m.type === 'ready')
			self.emit('ready', m.data.options);
		else if (m.type === 'data')
			self.emit('data', m.data);
	});
};

Platform.prototype.log = function (title, description) {
	process.send({
		type: 'log',
		data: {
			title: title,
			description: description
		}
	});
};

Platform.prototype.handleException = function (error) {
	console.error(error);

	process.send({
		type: 'error',
		data: {
			name: error.name,
			message: error.message,
			stack: error.stack
		}
	});
};

module.exports = new Platform();