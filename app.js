'use strict'

const reekoh = require('reekoh')
const plugin = new reekoh.plugins.Storage()

const async = require('async')
const MongoClient = require('mongodb').MongoClient
const isPlainObject = require('lodash.isplainobject')

let _db = null

let sendData = (data, callback) => {
  let collection = _db.collection(plugin.config.collection)

  collection.insertOne(data, (err, result) => {
    if (!err) {
      plugin.log(JSON.stringify({
        title: 'Record inserted in MongoDB',
        data: Object.assign(data, { _id: result.insertedId })
      }))
    }

    plugin.emit('processed')
    callback(err)
  })
}

plugin.on('data', (data) => {
  if (isPlainObject(data)) {
    sendData(data, (err) => {
      if (err) plugin.logException(err)
    })
  } else if (Array.isArray(data)) {
    async.each(data, (datum, done) => {
      sendData(datum, done)
    }, (err) => {
      if (err) return plugin.logException(err)
    })
  } else {
    plugin.logException(new Error(`Invalid data received. Data must be a valid Array/JSON Object or a collection of objects. Data: ${data}`))
  }
})

plugin.once('ready', () => {
  MongoClient.connect(plugin.config.connstring, (error, db) => {
    if (error) {
      console.error('Error connecting to MongoDB.', error)
      plugin.logException(error)

      setTimeout(() => {
        process.exit(1)
      })
    } else {
      _db = db
      plugin.log('MongoDB Storage Initialized.')
      plugin.emit('init')
    }
  })
})

module.exports = plugin
