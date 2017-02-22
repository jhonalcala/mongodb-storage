'use strict'

const reekoh = require('reekoh')
const _plugin = new reekoh.plugins.Storage()

const async = require('async')
const MongoClient = require('mongodb').MongoClient
const isPlainObject = require('lodash.isplainobject')

let _db = null

let sendData = (data, callback) => {
  let collection = _db.collection(_plugin.config.collection)

  collection.insertOne(data, (err, result) => {
    if (!err) {
      _plugin.log(JSON.stringify({
        title: 'Record inserted in MongoDB',
        data: Object.assign(data, { _id: result.insertedId })
      }))
    }

    process.send({ type: 'processed' })
    callback(err)
  })
}

_plugin.on('data', (data) => {
  if (isPlainObject(data)) {
    sendData(data, (err) => {
      if (err) _plugin.logException(err)
    })
  } else if (Array.isArray(data)) {
    async.each(data, (datum, done) => {
      sendData(datum, done)
    }, (err) => {
      if (err) return _plugin.logException(err)
    })
  } else {
    _plugin.logException(new Error(`Invalid data received. Data must be a valid Array/JSON Object or a collection of objects. Data: ${data}`))
  }
})

_plugin.once('ready', () => {
  MongoClient.connect(_plugin.config.connstring, (error, db) => {
    if (error) {
      console.error('Error connecting to MongoDB.', error)
      _plugin.logException(error)

      setTimeout(() => {
        process.exit(1)
      })
    } else {
      _db = db
      _plugin.log('MongoDB Storage Initialized.')
      process.send({ type: 'ready' })
    }
  })
})
