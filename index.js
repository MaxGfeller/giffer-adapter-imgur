var request = require('request')
var EventEmitter = require('events').EventEmitter
var inherits = require('inherits')

inherits(Adapter, EventEmitter)

function Adapter (config) {
  if (!config.apiKey) throw new Error('API key is needed to access imgur data')

  this.apiKey = config.apiKey
  this.section = config.section || 'hot'
  this.sort = config.sort || 'viral'
  this.window = config.window || 'day'
  this.maxPages = config.maxPages || 10
  this.minScore = config.minScore || null
  this.includeNSFW = config.includeNSFW || true
  this.currentPage = 0

  this.stopped = true
}

Adapter.prototype.start = function () {
  this.stopped = false
  this.emit('start')

  fetchPage.call(this, 0)
}

Adapter.prototype.stop = function () {
  this.emit('stop')
}

module.exports = Adapter

function fetchPage (pageNumber) {
  var url = 'https://api.imgur.com/3/gallery/'
    + this.section + '/'
    + this.sort + '/'
    + this.currentPage + '.json'

  request({
    method: 'GET',
    url: url,
    headers: {
      Authorization: 'Client-ID ' + this.apiKey
    }
  }, function (err, response, body) {
    try {
      var data = JSON.parse(body).data

      data.map(function (item) {
        if (this.minScore && parseInt(item.score) < parseInt(this.minScore)) return
        if (this.includeNSFW === false && item.nsfw === true) return

        this.emit('gif', item.link, { origin: 'https://www.imgur.com/' + item.id })
      }, this)
    } catch (e) {
      console.error('could not fetch data from imgur: ' + e.message)
    }
  }.bind(this))
}
