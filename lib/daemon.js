'use strict';

var _ = require('lodash-node');
var logging = require('loggin');
var mongodb = require('mongodb');

var Context = /** @type Context */ require('./context');
var MongoClient = /** @type MongoClient */ mongodb.MongoClient;
var defaultLogger = logging.getLogger('mongodb').conf({
    logLevel: 'SILENT',
    enabled: []
});

/**
 * @class ConnectDaemon
 * @extends Context
 *
 * @param {String} connectUrl
 * @param {Object} [params]
 * @param {Number} [params.reconnectTimeout=0]
 * @param {Number} [params.reconnectRetries=0]
 * @param {Number} [params.beatTimeout=1000]
 * @param {Logger} [params.logger]
 * */
function ConnectDaemon(connectUrl, params) {

    /**
     * @public
     * @memberOf {ConnectDaemon}
     * @property
     * @type {Object}
     * */
    this.params = _.extend({
        reconnectTimeout: 0,
        reconnectRetries: 5,
        beatTimeout: 1000,
        logger: defaultLogger
    }, params);

    /**
     * @public
     * @memberOf {ConnectDaemon}
     * @property
     * @type {String}
     * */
    this.url = connectUrl;

    /**
     * @public
     * @memberOf {ConnectDaemon}
     * @property
     * @type {Array}
     * */
    this.onOk = [];

    /**
     * @public
     * @memberOf {ConnectDaemon}
     * @property
     * @type {Boolean}
     * */
    this.done = false;

    /**
     * @public
     * @memberOf {ConnectDaemon}
     * @property
     * @type {Array}
     * */
    this.args = [];

    Context.call(this, this, this.params.logger);
}

ConnectDaemon.prototype = Object.create(Context.prototype);

ConnectDaemon.prototype.constructor = ConnectDaemon;

/**
 * @public
 * @memberOf {ConnectDaemon}
 * @method
 *
 * @param {String} name
 *
 * @returns {Object}
 * */
ConnectDaemon.prototype.createContext = function (name) {
    return new Context(this, this.createLogger(name));
};

/**
 * @public
 * @memberOf {ConnectDaemon}
 * @method
 *
 * @param {String} contextName
 *
 * @returns {Object}
 * */
ConnectDaemon.prototype.createLogger = function (contextName) {
    return this.logger;
};

/**
 * @public
 * @memberOf {ConnectDaemon}
 * @method
 *
 * @param {Function} done
 * */
ConnectDaemon.prototype.connect = function (done) {
    MongoClient.connect(this.url, this.params, done.bind(this));
};

module.exports = ConnectDaemon;
