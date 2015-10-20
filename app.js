'use strict';

var platform = require('./platform'),
	db, collection;

/*
 * Listen for the data event.
 */
platform.on('data', function (data) {
	var isJSON = require('is-json');

	if (isJSON(data, true)) {
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
 * Listen for the ready event.
 */
platform.once('ready', function (options) {
	var MongoClient = require('mongodb').MongoClient;

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