'use strict';

var platform   = require('./platform'),
	mongodb    = require('mongodb').MongoClient,
	isJSON     = require('is-json'),
	collection = '';

/*
 * Listen for the ready event.
 */
platform.on('ready', function (options) {
	collection = options.collection;

	mongodb.connect(options.connstring, function (error, db) {
		if (error) {
			console.error('Error connecting to MongoDB', error);
			platform.handleException(error);
		}
		else
			platform.log('Connected to MongoDB', db.databaseName);

	});
});

/*
 * Listen for the data event.
 */
platform.on('data', function (data) {
	if (isJSON(data, true)) {
		var coll = mongodb.collection(collection);

		coll.insertOne(data, function (error, result) {
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