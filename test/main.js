'use strict';

var cp          = require('child_process'),
	path        = require('path'),
	uuid        = require('node-uuid'),
	assert      = require('assert'),
	MongoClient = require('mongodb').MongoClient,
	connString  = 'mongodb://mongostorageplugintest:mongostorageplugintest@ds049888.mongolab.com:49888/mongostorageplugintest',
	collection  = 'mongotest';

var randomId = uuid.v4();
var endpoint = cp.fork(path.join(process.cwd(), 'app.js'));

endpoint.send({
	type: 'ready',
	data: {
		options: {
			connstring: connString,
			collection: collection
		}
	}
});

endpoint.on('message', function (m) {
	if (m.type === 'ready') {
		endpoint.send({
			type: 'data',
			data: {
				randomData: randomId
			}
		});

		setTimeout(function () {
			MongoClient.connect(connString, function (err, db) {
				assert.equal(null, err);
				console.log('Connected correctly to server');

				var _collection = db.collection(collection);

				// Find some documents
				_collection.find({
					randomData: randomId
				}).toArray(function (err, docs) {
					assert.equal(err, null);
					assert.equal(1, docs.length);
					console.log('Found the following records');
					console.dir(docs);
					db.close();
				});
			});
		}, 5000);
	}
});