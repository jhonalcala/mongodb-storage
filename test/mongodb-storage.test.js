/* global describe, it, before, after */
'use strict'

const _ID = new Date().getTime()

const amqp = require('amqplib')
const should = require('should')
const cp = require('child_process')
const MongoClient = require('mongodb').MongoClient

let _storage = null
let _channel = null
let _conn = null

let record = {
  _id: _ID,
  co2: '11%',
  temp: 23,
  quality: 11.25,
  random_data: 'abcdefg'
}

describe('MongoDB Storage', function () {
  this.slow(8000)

  before('init', () => {
    process.env.INPUT_PIPE = 'demo.pipe.storage'
    process.env.BROKER = 'amqp://guest:guest@127.0.0.1/'

    process.env.MONGODB_COLLECTION = 'data'
    process.env.MONGODB_CONN_STRING = 'mongodb://reekohdev:Reekoh2016@ds015398.mlab.com:15398/reekoh-mongo-test'

    amqp.connect(process.env.BROKER)
      .then((conn) => {
        _conn = conn
        return conn.createChannel()
      }).then((channel) => {
        _channel = channel
      }).catch((err) => {
        console.log(err)
      })
  })

  after('terminate child process', function () {
    _conn.close()
    setTimeout(() => {
      _storage.kill('SIGKILL')
    }, 4000)
  })

  describe('#spawn', function () {
    it('should spawn a child process', function () {
      should.ok(_storage = cp.fork(process.cwd()), 'Child process not spawned.')
    })
  })

  describe('#handShake', function () {
    it('should notify the parent process when ready within 5 seconds', function (done) {
      this.timeout(8000)

      _storage.on('message', (message) => {
        if (message.type === 'ready') {
          done()
        }
      })
    })
  })

  describe('#data', function () {
    it('should process and insert the data into the database', function (done) {
      this.timeout(8000)
      _channel.sendToQueue(process.env.INPUT_PIPE, new Buffer(JSON.stringify(record)))

      _storage.on('message', (msg) => {
        if (msg.type === 'processed') done()
      })
    })

    it('should have inserted the document on the database', function (done) {
      this.timeout(8000)

      MongoClient.connect(process.env.MONGODB_CONN_STRING, (error, db) => {
        should.ifError(error)

        let collection = db.collection(process.env.MONGODB_COLLECTION)

        collection.find({
          _id: _ID
        }).toArray((err, docs) => {
          should.ifError(err)
          should.equal(1, docs.length)

          let doc = docs[0]

          should.equal(record.co2, doc.co2, 'Data validation failed. Field: co2')
          should.equal(record.temp, doc.temp, 'Data validation failed. Field: temp')
          should.equal(record.quality, doc.quality, 'Data validation failed. Field: quality')
          should.equal(record.random_data, doc.random_data, 'Data validation failed. Field: random_data')

          db.close(true, done)
        })
      })
    })

  })
})
