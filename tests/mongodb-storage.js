'use strict';

var cp          = require('child_process'),
	assert      = require('assert'),
	MongoClient = require('mongodb').MongoClient,
	randomId    = require('node-uuid').v4(),
	connString  = 'mongodb://127.0.0.1:27017',
	collection  = 'test',
	storage;

describe('MongoDB Storage', function () {
	describe('#spawn', function () {
		it('should spawn a child process', function () {
			assert.ok(storage = cp.fork(process.cwd()), 'Child process not spawned.');
		});
	});

	describe('#handShake', function () {
		it('should notify the parent process when ready within 5 seconds', function () {
			var initTimeout;

			storage.on('ready', function () {
				clearTimeout(initTimeout);
			});

			initTimeout = setTimeout(function () {
				assert.ok(false, 'Plugin init timeout.');
			}, 5000);

			storage.send({
				type: 'ready',
				data: {
					options: {
						connstring: connString,
						collection: collection
					}
				}
			}, function (error) {
				assert.ifError(error);
			});
		});
	});

	describe('#data', function () {
		it('should process the data', function () {
			storage.send({
				type: 'data',
				data: {
					rand: randomId
				}
			}, function (error) {
				assert.ifError(error);
			});
		});

		it('should have inserted the document on the database', function () {
			MongoClient.connect(connString, function (error, db) {
				assert.ifError(error);

				var _collection = db.collection(collection);

				_collection.find({
					rand: randomId
				}).toArray(function (err, docs) {
					assert.ifError(error);
					assert.equal(1, docs.length);
					console.log('Found the following records');
					console.dir(docs);
					db.close(true);
				});
			});
		});
	});
});