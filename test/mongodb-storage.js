'use strict';

const CONN_STRING = 'mongodb://localhost:27017/test',
	  COLLECTION = 'test';

var cp          = require('child_process'),
	should      = require('should'),
	MongoClient = require('mongodb').MongoClient,
	randomId    = require('node-uuid').v4(),
	mongoStorage;

describe('MongoDB Storage', function () {
	this.slow(8000);

	after('terminate child process', function () {
		mongoStorage.kill('SIGKILL');
	});

	describe('#spawn', function () {
		it('should spawn a child process', function () {
			should.ok(mongoStorage = cp.fork(process.cwd()), 'Child process not spawned.');
		});
	});

	describe('#handShake', function () {
		it('should notify the parent process when ready within 5 seconds', function (done) {
			this.timeout(8000);

			mongoStorage.on('message', function (message) {
				if (message.type === 'ready')
					done();
			});

			mongoStorage.send({
				type: 'ready',
				data: {
					options: {
						connstring: CONN_STRING,
						collection: COLLECTION
					}
				}
			}, function (error) {
				should.ifError(error);
			});
		});
	});

	describe('#data', function () {
		it('should process and insert the data into the database', function (done) {
			mongoStorage.send({
				type: 'data',
				data: {
					rand: randomId
				}
			}, done);
		});

		it('should have inserted the document on the database', function (done) {
			MongoClient.connect(CONN_STRING, function (error, db) {
				should.ifError(error);

				var _collection = db.collection(COLLECTION);

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