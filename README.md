transac-cli
======================

Node.js client for [transacd](https://github.com/redpelicans/transacd.git)


### Usage

```javascript 
npm install --save transac

var transac = require('transac');

function run(transac, cb){
  loadingData(function(err, data){
    if(err)return cb(err);
    transac.info('Loading Data', data.length + ' data loaded');
    cb();
  });
}

transac.exec('Building Indicators Data', 'http://localhost:3002', run, {locked: false});
```

### transac.exec(transacName, serverUrl, fct, [options, callback])

* transacName {String} Transaction's label within the web interface
* serverUrl {String} Connexion string to the transac server
* fct {Function} Code to be run by transaction.   
  * transac {Transac} instance
  * callback {Function} to end transaction processing. If it returns an error, or an exception is raised, transaction will be aborted else commited.
* options:
  * valueDate {Date} value date of the transaction: we may load today data computed yesterday
  * locked {Boolean} if locked a transaction can only be run once per value date, if we try to rerun client will throw an execption
  * nested {Boolean} A nested transaction can run many time in a value date, just on transaction will appear with the web client
* cb {Function} callback function called when fct will ended. 

### Transac instance methods

#### (info | warning | error)(label, message)

* label {String} message's label
* message {String} message's content (converted as html by web client)


#### (commit | abort)(label, message)

transparently used by transac to end a transaction depending on fct.callback.err value.




