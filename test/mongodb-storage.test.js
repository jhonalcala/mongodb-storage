'use strict';

const CONN_STRING = 'mongodb://reekoh:reekoh@ds053194.mongolab.com:53194/rkhdemo',
	  COLLECTION  = 'data',
	  _ID         = new Date().getTime();

var cp          = require('child_process'),
	should      = require('should'),
	MongoClient = require('mongodb').MongoClient,
	mongoStorage;

var record = {
	_id: _ID,
	co2: '11%',
	temp: 23,
	quality: 11.25,
	random_data: 'abcdefg'
};

describe('MongoDB Storage', function () {
	this.slow(8000);

	after('terminate child process', function () {
		mongoStorage.send({
			type: 'close'
		});

		setTimeout(function () {
			mongoStorage.kill('SIGKILL');
		}, 4000);
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
				data: record
			}, done);
		});

		it('should have inserted the document on the database', function (done) {
			this.timeout(8000);

			MongoClient.connect(CONN_STRING, function (error, db) {
				should.ifError(error);

				var _collection = db.collection(COLLECTION);

				_collection.find({
					_id: _ID
				}).toArray(function (err, docs) {
					should.ifError(err);
					should.equal(1, docs.length);

					var doc = docs[0];

					should.equal(record.co2, doc.co2, 'Data validation failed. Field: co2');
					should.equal(record.temp, doc.temp, 'Data validation failed. Field: temp');
					should.equal(record.quality, doc.quality, 'Data validation failed. Field: quality');
					should.equal(record.random_data, doc.random_data, 'Data validation failed. Field: random_data');

					db.close(true, done);
				});
			});
		});
	});
});