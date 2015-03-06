'use strict';

var _ = require('lodash-node');
var f = require('util').format;

/**
 * @class Context
 * @param {ConnectDaemon} daemon
 * @param {Object} logger
 * */
function Context(daemon, logger) {

    /**
     * @public
     * @memberOf {Context}
     * @property
     * @type {ConnectDaemon}
     * */
    this.daemon = daemon;

    /**
     * @public
     * @memberOf {Context}
     * @property
     * @type {Object}
     * */
    this.logger = logger;
}

Context.prototype.constructor = Context;

/**
 * @public
 * @memberOf {ConnectDaemon}
 * @method
 *
 * @param {Function} didConnect
 * */
Context.prototype.getConnect = function (didConnect) {
    var retries;
    var logger = this.logger;
    var daemon = this.daemon;

    //  already connected
    if (daemon.done) {
        logger.debug('Score! Already connected, reuse connection');
        didConnect.apply(this, daemon.args);
        return;
    }

    //  add connect listener
    daemon.onOk.push(didConnect);

    //  intermediate state, pending (connecting in progress)
    if (daemon.onOk.length > 1) {
        logger.debug('Connecting in progress, schedule listener');
        return;
    }

    retries = 0;

    logger.debug(f('Try to connect to database %j', daemon.url));

    daemon.connect(function onConnect(connectErr, db) {
        var params = daemon.params;

        if (connectErr) {
            // Connection failed, try to reconnect
            if (retries < params.reconnectRetries) {
                retries += 1;
                logger.warn(connectErr);
                logger.debug(f('Reconnect in %dms (retry %d/%d)',
                    params.reconnectTimeout, retries, params.reconnectRetries));

                setTimeout(function () {
                    daemon.connect(onConnect);
                }, params.reconnectTimeout);
                return;
            }

            // All the retries failed
            logger.error('Failed to connect to database', connectErr);
            // Save state
            daemon.done = false;
            daemon.args = [connectErr, db];
            // call all listeners
            emitConnectDone(daemon);
            return;
        }

        function beat() {
            db.stats(function (statsErr) {
                if (!statsErr) {
                    setTimeout(beat, params.beatTimeout).unref();
                    return;
                }

                // Any stats error as connection issue
                daemon.logger.error(statsErr);
                daemon.done = false;
                // Close connection
                db.close(function (closeErr) {
                    if (closeErr) {
                        daemon.logger.error(closeErr);
                    } else {
                        daemon.logger.debug('The connection was successfully closed');
                    }
                });
                daemon.args = [];
            });
        }

        // Connected!
        daemon.args = [connectErr, db];
        daemon.done = true;
        logger.debug('Successfully connected to database');
        // Call all listeners
        emitConnectDone(daemon);
        // Run heart beat
        beat();
    });
};

function emitConnectDone(daemon) {
    var funcs = daemon.onOk;
    daemon.onOk = [];
    _.forEach(funcs, function (done) {
        done.apply(daemon, daemon.args);
    }, this);
}

module.exports = Context;
