import util from 'util';
import os from 'os';
import _ from 'lodash';
import request from 'request';
import moment from 'moment';
import async from 'async';
import stream from 'stream';


function execTask(task, cb){
  let transac = this;
  function callbackExecTask(err, ...args){
    if(err){
      pushEvent.bind(transac, 'abort')("Runtime Error", err, () => cb(err, transac.id) );
    }else{
      pushEvent.bind(transac, 'commit')("Transac Completed", () => cb(null, transac.id, ...args) );
    }
  }
  try{
    task(transac, callbackExecTask);
  }catch(err){
    pushEvent.bind(transac, 'abort')("Runtime Exception", err, () => cb(err) );
  };
}

function execute(task, callback) {
  let transac = this
    , form = {
          label: transac.label
        , compound: transac.compound || false
        , locked: transac.locked || false
        , processId: transac.processId
        , user: transac.user
        , server: transac.server
    };

  if(transac.valueDate) form.valueDate = moment(transac.valueDate).format('DD/MM/YYYY');;

  // obsolete
  if(!callback) callback = err => { if(err) throw err } ;

  let requestOptions = {
    uri: this.serverUrl + '/transacs'
  , method: 'POST'
  , form: form
  , json: true
  };

  request(requestOptions, (err, response, body) => {
    if(err) return callback(new Error("Cannot connect to transacd\n" + err.message));
    switch(response.statusCode){
      case 418:
        switch (body.code) {
          case 'locked':
            return callback(new Error('Transaction ' + transac.label  + ' already exists and is locked'));
          default:
            return callback(new Error(body.toString()));
        }
      case 200:
        transac.id = body.id;
        return execTask.bind(transac)(task, callback);
      case 500: 
      default:
        let msg = 'Internal error, server responds code ' + response.statusCode;
        return callback(new Error(msg));
    }
  });
}

function publishEvent(event, callback) {
  let transac = this;
  let requestOptions = {
    uri: this.serverUrl + '/transacs/' + transac.id + '/events'
  , method: 'PUT'
  , json: true
  , form: { level: event.level } 
  };

  if(event.messages) requestOptions.form.messages = event.messages;
  if(event.label) requestOptions.form.label = event.label;

  request(requestOptions, (err, response, body) => {
    if(err) return callback(err);
    switch(response.statusCode){
      case 418:
        switch (body.code) {
          case 'notransac':
            return callback(new Error(`Transaction ${transac.id} doesn't exist`));
          case 'closed':
            return callback(new Error(`Transaction ${transac.label} is already closed`));
          default:
            return callback(body);
        }
      case 200:
        return callback(null, event);
      case 500: 
      default:
        let msg = 'Internal error, server responds code ' + response.statusCode;
        return callback(new Error(msg));
    }
  });
};

function pushEvent(level, ...args){
  let [label, messages, cb] = args
    , event = {level: level};

  if(args.length == 1){
    if(label instanceof Error){
      event.label = label.message;
      event.messages = [label.stack];
    }else{
      event.messages = _.isString(label) ? [label] : label;
    }
  }else if(args.length == 2){
    if(_.isFunction(messages)){
      cb = messages;
      if(label instanceof Error){
        event.label = label.message;
        event.messages = [label.stack];
      }else{
        event.messages = _.isString(label) ? [label] : label;
      }
    }else{
      event.label = label;
      if(messages instanceof Error){
        event.messages = [messages.message, messages.stack];
      }else{
        event.messages = _.isString(messages) ? [messages] : messages;
      }
    }
  }else if(args.length == 3){
    event.label = label;
    if(messages instanceof Error){
      event.messages = [messages.message, messages.stack];
    }else{
      event.messages = _.isString(label) ? [label] : label;
    }
  }

  if(event.label || event.messages)this.queue.push(event, cb);
}

class Transac extends stream.Writable{
  constructor(label, serverUrl, {valueDate, compound, locked} = {}){
    super();
    this.label = label;
    this.serverUrl = serverUrl;
    this.compound = compound;
    this.locked = locked;
    this.processId = process.pid;
    this.user = process.env.USER;
    this.server = os.hostname();
    if(valueDate){
      if(_.isString(valueDate)) this.valueDate = moment(valueDate, 'DD/MM/YYYY').toDate();
      else this.valueDate = moment(valueDate).startOf('day').toDate();
    }
    this.exec = execute;
    this.info = pushEvent.bind(this, 'info');
    this.warning = pushEvent.bind(this, 'warning');
    this.error = pushEvent.bind(this, 'error');
    this.queue = async.queue(publishEvent.bind(this), 1);
  }

  _write(chunk, encoding, cb){
    this.info(chunk.toString('utf8'), cb);
  }

}

export default function transac(serverUrl){
  return function (label, task, options, cb){
    if(_.isFunction(options)){
      cb = options;
      options = {};
    }
    if(!cb){
      let promise = new Promise((resolve, reject) => {
        let t = new Transac(label, serverUrl, options);
        t.exec(task, (err) => {
          if(err) return reject(err);
          resolve(t);
        });
      });
      return promise;
    }else{
      let t = new Transac(label, serverUrl, options);
      t.exec(task, cb);
      return t;
    }
  };
}

