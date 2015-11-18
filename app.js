'use strict';

var MongoClient   = require('mongodb').MongoClient,
	isPlainObject = require('lodash.isplainobject'),
	platform      = require('./platform'),
	db, collection;

/*
 * Listen for the data event.
 */
platform.on('data', function (data) {
	if (isPlainObject(data)) {
		var _collection = db.collection(collection);

		_collection.insertOne(data, function (error) {
			if (error) {
				console.error('Failed to save record in MongoDB.', error);
				platform.handleException(error);
			}
			else {
				platform.log(JSON.stringify({
					title: 'Record inserted in MongoDB',
					data: data
				}));
			}
		});
	}
	else {
		console.error('Invalid Data', data);
		platform.handleException(new Error('Invalid data received ' + data));
	}
});

/*
 * Event to listen to in order to gracefully release all resources bound to this service.
 */
platform.on('close', function () {
	var domain = require('domain');
	var d = domain.create();

	d.on('error', function (error) {
		console.error(error);
		platform.handleException(error);
		platform.notifyClose();
	});

	d.run(function () {
		db.close(true, function () {
			platform.notifyClose();
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
		}
		else {
			db = _db;
			platform.log('MongoDB Storage Initialized.');
			platform.notifyReady();
		}
	});
});