'use strict';

var async         = require('async'),
	isArray       = require('lodash.isarray'),
	platform      = require('./platform'),
	MongoClient   = require('mongodb').MongoClient,
	isPlainObject = require('lodash.isplainobject'),
	db, collection;

let sendData = function (data, callback) {
	let _collection = db.collection(collection);

	_collection.insertOne(data, function (insertError, result) {
		if (!insertError) {
			platform.log(JSON.stringify({
				title: 'Record inserted in MongoDB',
				data: Object.assign(data, {
					_id: result.insertedId
				})
			}));
		}

		callback(insertError);
	});
};

platform.on('data', function (data) {
	if (isPlainObject(data)) {
		sendData(data, (error) => {
			if (error) platform.handleException(error);
		});
	}
	else if (isArray(data)) {
		async.each(data, (datum, done) => {
			sendData(datum, done);
		}, (error) => {
			if (error) platform.handleException(error);
		});
	}
	else
		platform.handleException(new Error(`Invalid data received. Data must be a valid Array/JSON Object or a collection of objects. Data: ${data}`));
});

/*
 * Event to listen to in order to gracefully release all resources bound to this service.
 */
platform.on('close', function () {
	var domain = require('domain');
	var d = domain.create();

	d.once('error', function (error) {
		console.error(error);
		platform.handleException(error);
		platform.notifyClose();
		d.exit();
	});

	d.run(function () {
		db.close(true, function () {
			platform.notifyClose();
			d.exit();
		});
	});
});

/*
 * Listen for the ready event.
 */
platform.once('ready', function (options) {
	collection = options.collection;

	MongoClient.connect(options.connstring, function (error, _db) {
		if (error) {
			console.error('Error connecting to MongoDB.', error);
			platform.handleException(error);

			setTimeout(() => {
				process.exit(1);
			});
		}
		else {
			db = _db;
			platform.log('MongoDB Storage Initialized.');
			platform.notifyReady();
		}
	});
});