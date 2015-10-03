'use strict';

var platform    = require('./platform'),
	MongoClient = require('mongodb').MongoClient,
	isJSON      = require('is-json'),
	db, collection;

/*
 * Listen for the data event.
 */
platform.on('data', function (data) {
	if (isJSON(data, true)) {
		var _collection = db.collection(collection);

		_collection.insertOne(data, function (error, result) {
			if (error) {
				console.error('Failed to save record in MongoDB.', error);
				platform.handleException(error);
			}
			else
				platform.log('Record Successfully saved to MongoDB.', result.toString());
		});
	}
	else {
		console.error('Invalid Data', data);
		platform.log('Invalid Data', data);
	}
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
			platform.log('Connected to MongoDB.');
			platform.notifyReady(); // Need to notify parent process that initialization of this plugin is done.
		}
	});
});