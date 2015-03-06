/*eslint max-nested-callbacks: 0*/
'use strict';

var assert = require('assert');

describe('lib/daemon', function () {
    var Daemon = require('../lib/daemon');
    var Context = require('../lib/context');

    it('Should have method connect', function () {
        var connect = new Daemon('foo', {});
        assert.strictEqual(typeof connect.connect, 'function');
    });

    describe('connect.createContext', function () {
        it('Should have createContext method', function () {
            var connect = new Daemon('foo', {});
            assert.strictEqual(typeof connect.createContext, 'function');
        });

        it('Should return contextual connect', function () {
            var connect = new Daemon('foo', {});
            var spy = [];
            var context;

            connect.createLogger = function () {
                spy.push('logger-created');
                return this.logger;
            };
            context = connect.createContext('bar');
            assert.ok(context instanceof Context);
            assert.deepEqual(spy, ['logger-created']);
        });
    });

    describe('connect.createLogger()', function () {
        it('Should return root logger bu default', function () {
            var connect = new Daemon('foo', {});
            var logger = connect.createLogger('bar');
            assert.strictEqual(connect.logger, logger);
        });
    });
});
