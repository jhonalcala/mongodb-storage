'use strict';

var MongoClient   = require('mongodb').MongoClient,
	isPlainObject = require('lodash.isplainobject'),
	isArray = require('lodash.isarray'),
	async = require('async'),
	platform      = require('./platform'),
	db, collection;

let sendData = (data) => {
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
};

platform.on('data', function (data) {
	if(isPlainObject(data)){
		sendData(data);
	}
	else if(isArray(data)){
		async.each(data, function(datum){
			sendData(datum);
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
		}
		else {
			db = _db;
			platform.log('MongoDB Storage Initialized.');
			platform.notifyReady();
		}
	});
});