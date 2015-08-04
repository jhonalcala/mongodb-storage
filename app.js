'use strict';

/*
 * Initialize storage.
 */
var Storage = require('./storage'),
	storage = new Storage(),
	mongodb = require('mongodb').MongoClient,
	collection = '';

/*
 * Listen for the ready event.
 */
storage.on('ready', function (options) {
	/*
	 * Connect to the database based on the options provided. See config.json
	 *
	 * Sample Parameters:
	 *
	 * URL = options.url
	 * Table/Collection = options.table or options.collection
	 *
	 * Note: Option Names are based on what you specify on the config.json.
	 */
	collection = options.collection;

	mongodb.connect(options.url, function(error, db) {
		if (error) {
			console.log('Error connecting to Mongo Database', error);
			storage.sendError(error);
		}
		else
			storage.sendLog('Connected to Mongo Database', db.databaseName);

	});
});

/*
 * Listen for the data event.
 */
storage.on('data', function (data) {

	// TODO: Send data to the database. Use the already initialized connection variable above.

	if (data && typeof data === 'object'){

		var coll = mongodb.collection(collection);

		coll.insertOne(data, function (error, result) {
			if (error) {
				console.log('Failed to save record in Mongo Database', error);
				storage.sendError(error);
			}
			else
				storage.sendLog('Record Successfully saved to Mongo Database', result);
		});
	} else {
		var err = { msg: 'Failed to save record in Mongo Database',
					data: data};
		console.log('Failed to save record in Mongo Database', err);
		storage.sendLog(err); //send data as log not error
	}

});