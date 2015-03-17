mconnd [![Build Status](https://travis-ci.org/golyshevd/mconnd.svg)](https://travis-ci.org/golyshevd/mconnd)
=========

Mongo connection daemonizer

Usage:
---------

```bash
$ npm i mconnd
```

```js
var ConnectDaemon = require('mconnd');
var daemon = new ConnectDaemon('<connect-url>', {
    reconnectTimeout: 0, // optional, default=0
    reconnectRetries: 5, // optional, default=5
    beatTimeout: 1000, // optional, default=1000
    logger: myLogger // optional, silent logger by default,
    // + mongodb connection options
});
```

Use daemon directly

```js
daemon.getConnect(function (err, db) {
    // stuff with db
});
```

Or use contexts to get context logs

```js
daemon.createLogger = function (contextName) {
    return <your context bound logger>
};
app.use(function (req, res, next) {
    var context = daemon.createContext(req.id);
    context.getConnect(function (err, db) {
        // stuff with db
    });
});
```

---------
LICENSE [MIT](LICENSE)
