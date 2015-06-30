transac client API
==================

[![Build Status](https://travis-ci.org/redpelicans/transac.svg?branch=transac2)](https://travis-ci.org/redpelicans/transac)
[![Dependency Status](https://david-dm.org/redpelicans/transac/transac2.svg)](https://david-dm.org/redpelicans/transac/transac2)
[![Coverage Status](https://coveralls.io/repos/redpelicans/transac/badge.svg?branch=transac2)](https://coveralls.io/r/redpelicans/transac?branch=transac2)


Node.js client for [transacd](https://github.com/redpelicans/transacd.git) server


### Usage

```javascript 
npm install --save transac

import transac from 'transac';

function run(transac, cb){
  loadingData(function(err, data){
    if(err)return cb(err);
    transac.info('Loading Data', data.length + ' data loaded');
    cb();
  });
}

transac.exec('http://localhost:3002')('Building Indicators Data', run, {locked: false});
```
### transac(url)
* serverUrl {String} Connexion string to the transac server
* return a transac server, doesn't check `url` yet

### transacServer.exec(transacName, fct, [options], [callback])

* transacName {String} Transaction's label
* fct {Function} Code to be run by transaction, takes to parameters: 
  * transac {Transac} instance. A Transac's instance is a WritableStream see bellow.
  * callback {Function} to end transaction processing. If it returns an error, or an exception is raised, transaction will be aborted else commited.
* options:
  * valueDate {Date} value date of the transaction: we may load today data computed yesterday
  * locked {Boolean} if locked a transaction can only be run once per value date, if we try to rerun client will throw an execption
  * compound {Boolean} A compound transaction can run many time in a value date, just one transaction will appear within the web client
* callback optionnal {Function} callback function called when fct will ended. 
* returns a promise when no `callback` are given

### Transac instance methods

#### (info | warning | error)(label, messages)

* label {String} event's label
* messages {String} messages 

Could be called as:

* (message), (Error), (messages) => messages will be created associated to `transac` object
* (label, message), (label, Error), (label, messages) => an event will be created associated to messages


#### (commit | abort)(label, message)

transparently used by transac to end a transaction depending on fct.callback.err value.


### Pipe streams to Transac's instance

You can write:


```
function run(transac, cb){
  process.stdin.setEncoding('utf8');
  process.stdin.pipe(transac);
  transac.on('finish', () => cb());
}

transac(url)(name, run, err => {
  if(err) throw err
  process.exit();
});
```

This code will transform standard input lines to transac's messages (see samples/cli.js for runnable example).
