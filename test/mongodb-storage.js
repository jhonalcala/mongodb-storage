'use strict';

var cp          = require('child_process'),
	should      = require('should'),
	MongoClient = require('mongodb').MongoClient,
	randomId    = require('node-uuid').v4(),
	connString  = 'mongodb://localhost:27017/test',
	collection  = 'test',
	storage;

describe('MongoDB Storage', function () {
	this.slow(5000);

	after('terminate child process', function () {
		storage.kill('SIGKILL');
	});

	describe('#spawn', function () {
		it('should spawn a child process', function () {
			should.ok(storage = cp.fork(process.cwd()), 'Child process not spawned.');
		});
	});

	describe('#handShake', function () {
		it('should notify the parent process when ready within 5 seconds', function (done) {
			this.timeout(5000);

			storage.on('message', function (message) {
				if (message.type === 'ready')
					done();
			});

			storage.send({
				type: 'ready',
				data: {
					options: {
						connstring: connString,
						collection: collection
					}
				}
			}, function (error) {
				should.ifError(error);
			});
		});
	});

	describe('#data', function () {
		it('should process and insert the data into the database', function (done) {
			storage.send({
				type: 'data',
				data: {
					rand: randomId
				}
			}, done);
		});

		it('should have inserted the document on the database', function (done) {
			MongoClient.connect(connString, function (error, db) {
				should.ifError(error);

				var _collection = db.collection(collection);

				_collection.find({
					rand: randomId
				}).toArray(function (err, docs) {
					should.ifError(error);
					should.equal(1, docs.length);

					console.log('Found the following records');
					console.log(docs);

					db.close(true, done);
				});
			});
		});
	});
});