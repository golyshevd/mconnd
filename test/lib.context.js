/*eslint max-nested-callbacks: 0*/
'use strict';

var _ = require('lodash-node');
var assert = require('assert');
var logging = require('loggin');

describe('lib/context', function () {
    var Daemon = require('../lib/daemon');
    var Context = require('../lib/context');

    function getFakeCc(url, opts, connectFn) {
        var daemon = new Daemon(url, _.extend({}, opts, {
            logger: logging.getLogger('test').conf({
                enabled: []
            })
        }));
        daemon.connect = connectFn.bind(daemon);
        return new Context(daemon, daemon.logger);
    }

    function getFakeDbNormal() {
        return {
            stats: function (done) {
                setTimeout(function () {
                    done(null, {});
                }, 0);
            },
            close: function (done) {
                setTimeout(function () {
                    done();
                }, 0);
            }
        };
    }

    it('Should give connect to database', function (done) {
        var cc = getFakeCc('/foo', {}, function (onConnect) {
            var self = this;
            setTimeout(function () {
                onConnect.call(self, null, getFakeDbNormal());
            }, 0);
        });

        cc.getConnect(function (err) {
            assert.ok(!err);
            done();
        });
    });

    it('Should connect once', function (done) {
        var fakeDb;
        var cc = getFakeCc('/foo', {}, function (onConnect) {
            var self = this;
            setTimeout(function () {
                onConnect.call(self, null, getFakeDbNormal());
            }, 0);
        });

        cc.getConnect(function (connectErr1, db1) {
            assert.ok(!connectErr1);
            assert.ok(db1);
            fakeDb = db1;

            cc.getConnect(function (connectErr2, db2) {
                assert.ok(!connectErr2);
                assert.ok(db2);

                assert.strictEqual(db2, fakeDb);
                done();
            });
        });
    });

    it('Should call all listeners after connection', function (done) {
        var cc = getFakeCc('/foo', {}, function (onConnect) {
            var self = this;
            setTimeout(function () {
                onConnect.call(self, null, getFakeDbNormal());
            }, 50);
        });

        var spy = [];

        cc.getConnect(function (err, db) {
            assert.ok(!err);
            assert.ok(db);
            spy.push(1);
        });

        cc.getConnect(function (err, db) {
            assert.ok(!err);
            assert.ok(db);
            spy.push(2);
        });

        cc.getConnect(function (err, db) {
            assert.ok(!err);
            assert.ok(db);

            spy.push(3);

            assert.deepEqual(spy, [1, 2, 3]);
            done();
        });
    });

    it('Should re-create connection if heart-beat failed', function (done) {
        var connects = 0;
        var fakeDb;
        var cc = getFakeCc('/foo', {
            beatTimeout: 0
        }, function (onConnect) {
            var self = this;
            var i = 0;
            connects += 1;
            setTimeout(function () {
                onConnect.call(self, null, {
                    stats: function (cb) {
                        setTimeout(function () {
                            if (i < 3) {
                                i += 1;
                                cb(null, {});
                                return;
                            }
                            cb(new Error());
                        }, 0);
                    },
                    close: function (cb) {
                        setTimeout(function () {
                            cb();
                        }, 0);
                    }
                });
            }, 0);
        });

        cc.getConnect(function (connectErr1, db1) {
            assert.ok(!connectErr1);
            assert.ok(db1);
            assert.strictEqual(connects, 1);
            fakeDb = db1;
            setTimeout(function () {
                cc.getConnect(function (connectErr2, db2) {
                    assert.ok(!connectErr2);
                    assert.ok(db2);
                    assert.notStrictEqual(db2, fakeDb);
                    assert.strictEqual(connects, 2);
                    done();
                });
            }, 20);
        });
    });

    it('Should try reconnect if cc failed', function (done) {
        var i = 0;
        var cc = getFakeCc('/foo', {reconnectRetries: 5}, function (cb) {
            var self = this;
            setTimeout(function () {
                if (i < 3) {
                    i += 1;
                    cb.call(self, new Error());
                    return;
                }
                cb.call(self, null, getFakeDbNormal());
            }, 50);
        });

        cc.getConnect(function (err, db) {
            assert.ok(!err);
            assert.ok(db);
            assert.strictEqual(i, 3);
            done();
        });
    });

    it('Should return error if reconnect count exceeded', function (done) {
        var i = 0;
        var cc = getFakeCc('/foo', {reconnectRetries: 5}, function (onConnect) {
            var self = this;
            setTimeout(function () {
                i += 1;
                if (i <= 6) {
                    onConnect.call(self, new Error());
                    return;
                }
                onConnect.call(self, null, getFakeDbNormal());
            }, 0);
        });

        cc.getConnect(function (connectErr1, db1) {
            assert.ok(connectErr1);
            assert.ok(!db1);
            assert.strictEqual(i, 6);
            cc.getConnect(function (connectErr2, db2) {
                assert.ok(!connectErr2);
                assert.ok(db2);
                done();
            });
        });
    });

    it('Should log the issues with closing connection', function (done) {
        var cc = getFakeCc('/foo', {
            beatTimeout: 0,
            reconnectRetries: Infinity
        }, function (onConnect) {
            var self = this;
            setTimeout(function () {
                onConnect.call(self, null, {
                    stats: function (cb) {
                        setTimeout(function () {
                            cb(new Error());
                        }, 0);
                    },
                    close: function (cb) {
                        setTimeout(function () {
                            cb(new Error());
                        }, 0);
                    }
                });
            }, 50);
        });

        cc.getConnect(function () {
            var spy = 0;
            cc.daemon.logger.error = function () {
                spy += 1;
            };
            setTimeout(function () {
                cc.getConnect(function () {
                    assert.ok(spy);
                    done();
                });
            }, 50);
        });
    });
});
