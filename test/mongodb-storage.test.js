/* global describe, it, before, after */
'use strict'

const amqp = require('amqplib')
const should = require('should')
const MongoClient = require('mongodb').MongoClient

const _ID = new Date().getTime()
const INPUT_PIPE = 'demo.pipe.storage'
const BROKER = 'amqp://guest:guest@127.0.0.1/'

let _app = null
let _conn = null
let _channel = null

let conf = {
  collection: 'data',
  connstring: 'mongodb://reekohdev:Reekoh2016@ds015398.mlab.com:15398/reekoh-mongo-test'
}

let record = {
  _id: _ID,
  co2: '11%',
  temp: 23,
  quality: 11.25,
  randomData: 'abcdefg'
}

describe('MongoDB Storage', function () {

  before('init', () => {
    process.env.BROKER = BROKER
    process.env.INPUT_PIPE = INPUT_PIPE
    process.env.CONFIG = JSON.stringify(conf)
    
    amqp.connect(BROKER).then((conn) => {
      _conn = conn
      return conn.createChannel()
    }).then((channel) => {
      _channel = channel
    }).catch((err) => {
      console.log(err)
    })
  })

  after('terminate', function () {
    _conn.close()
  })

  describe('#start', function () {
    it('should start the app', function (done) {
      this.timeout(10000)
      _app = require('../app')
      _app.once('init', done)
    })
  })

  describe('#data', function () {
    it('should process and insert the data into the database', function (done) {
      this.timeout(8000)
      _channel.sendToQueue(INPUT_PIPE, new Buffer(JSON.stringify(record)))
      _app.on('processed', done)
    })

    it('should have inserted the document on the database', function (done) {
      this.timeout(10000)

      MongoClient.connect(conf.connstring, (error, db) => {
        should.ifError(error)

        let collection = db.collection(conf.collection)

        collection.find({
          _id: _ID
        }).toArray((err, docs) => {
          should.ifError(err)
          should.equal(1, docs.length)

          let doc = docs[0]

          should.equal(record.co2, doc.co2, 'Data validation failed. Field: co2')
          should.equal(record.temp, doc.temp, 'Data validation failed. Field: temp')
          should.equal(record.quality, doc.quality, 'Data validation failed. Field: quality')
          should.equal(record.randomData, doc.randomData, 'Data validation failed. Field: randomData')

          db.close(true, done)
        })
      })
    })
  })
})
