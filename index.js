var url = require('url');
var Joi = require('joi');
var path = require('path');
var Handler = require('./lib/handler').Handler;
var utils = require('precis-utils');
var defaults = utils.defaults;

var getLatest = function(req, reply){
    return reply(this.handler.records);
};

var getTransaction = function(req, reply){
  var id = req.params.id;
  var matches = this.handler.records.filter((record)=>{
    return record._id.toString() === id;
  });
  if(matches.length){
    return reply(matches[0]);
  }
  this.store.asArray({_id: id}, function(err, result){
    if(err){
      return reply(err);
    }
    var matches = result[result.root];
    if(Array.isArray(matches) && matches.length){
      return reply(matches[0]);
    }
    return reply(false);
  });
};

var getStats = function(req, reply){
  try{
    return reply(this.handler.buckets.map(function(bucket){
      return {
        _id: bucket.key,
        key: bucket.key,
        time: bucket.time,
        stats: {
          count: bucket.stats.count,
          error: bucket.stats.error
        }
      };
    }));
  }catch(e){
    console.error(e);
  }
};

var routes = function(){
  return [
    {
      method: 'GET',
      path: '/api/v1/error/transactions',
      config:{
        description: 'Returns the latest error transactions',
        tags: ['api'],
        handler: getLatest.bind(this)
      },
    },
    {
      method: 'GET',
      path: '/api/v1/error/stats',
      config:{
        description: 'Returns gathered statistics for last 15 minutes',
        tags: ['api'],
        handler: getStats.bind(this)
      },
    },
    {
      method: 'GET',
      path: '/api/v1/error/transaction/{id}',
      config:{
        description: 'Returns the specific error transactions',
        tags: ['api'],
        validate: {
          params: {
            id: Joi.string().required(),
          },
        },
        handler: getTransaction.bind(this)
      },
    },
  ];
};

var registerUi = function(){
  return [
    {
      pages: [
        {
          route: '/error/overview',
          title: 'Error Transactions',
          name: 'ErrorTransactions',
          section: 'System',
          filename: path.resolve(__dirname, 'ui/error.jsx'),
        },
        {
          route: '/error/inspect/:id',
          name: 'InspectErrorTransaction',
          filename: path.resolve(__dirname, 'ui/inspect.jsx'),
        },
      ]
    },
    {
      components: [
        {
          name: 'ErrorTransactionsDashboard',
          filename: path.resolve(__dirname, 'ui/dashboard.jsx'),
        },
        {
          name: 'ErrorTransactionsComponents',
          filename: path.resolve(__dirname, 'ui/components.jsx'),
        },
      ],
    },
    {
      stores: [
        {
          name: 'ErrorTransactions',
          socketEvent: {
            event: 'error::update',
            prefetch: '/api/v1/error/transactions',
          }
        },
        {
          name: 'ErrorTransactionStats',
          socketEvent: {
            event: 'error::stats::update',
            prefetch: '/api/v1/error/stats',
          }
        },
      ]
    },
  ];
};

var Plugin = function(options){
};

Plugin.prototype.init = function(options){
  var logger = options.logger;
  var sockets = this.sockets = options.sockets;
  var store = this.store = options.stores.get(options.errorTransactionStoreName||'error_transactions');
  var config = this.config = defaults({display: {}}, options);
  this.handler = new Handler(defaults({
    logger: logger,
    sockets: sockets,
    event: 'error::update',
    statsEvent: 'error::stats::update',
    store: store,
  }, config));
};

Plugin.prototype.register = function(options){
  var register = options.register;
  register({
    proxy: options.proxy,
    ui: registerUi.call(this),
    server: routes.call(this)
  });
};

Plugin.prototype.push = function(record){
  if(this.uiOnly){
    return;
  }
  if(!this.handler){
    return setImmediate(function(){
      this.push(record);
    }.bind(this));
  }
  this.handler.push(record);
};

module.exports = Plugin;
