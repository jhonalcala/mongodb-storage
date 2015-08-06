'use strict';

var platform    = require('./platform'),
	mongoClient = require('mongodb').MongoClient,
	isJSON      = require('is-json'),
	db, collection;

/*
 * Listen for the ready event.
 */
platform.on('ready', function (options) {
	collection = options.collection;

	mongoClient.connect(options.connstring, function (error, _db) {
		if (error) {
			console.error('Error connecting to MongoDB', error);
			platform.handleException(error);
		}
		else {
			platform.log('Connected to MongoDB', db.databaseName);
			db = _db;
		}
	});
});

/*
 * Listen for the data event.
 */
platform.on('data', function (data) {
	if (isJSON(data, true)) {
		var _collection = db.collection(collection);

		_collection.insertOne(data, function (error, result) {
			if (error) {
				console.error('Failed to save record in MongoDB', error);
				platform.handleException(error);
			}
			else
				platform.log('Record Successfully saved to MongoDB', result);
		});
	}
	else {
		console.error('Invalid Data', data);
		platform.log('Invalid Data', data); //send data as log not error
	}
});