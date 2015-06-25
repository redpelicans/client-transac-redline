'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.transac = transac;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

function execTask(task, cb) {
  var transac = this;
  function callbackExecTask(err) {
    var _arguments = arguments;

    if (err) {
      pushEvent.bind(transac, 'abort')('Runtime Error', err, function () {
        return cb(err);
      });
    } else {
      (function () {
        var args = Array.prototype.slice.call(_arguments);
        pushEvent.bind(transac, 'commit')('Transac Completed', null, function () {
          return cb.apply(null, args);
        });
      })();
    }
  }
  try {
    task(transac, callbackExecTask);
  } catch (err) {
    pushEvent.bind(transac, 'abort')('Runtime Exception', err, function () {
      return cb(err);
    });
  };
}

function execute(task, callback) {
  var transac = this,
      form = {
    name: transac.name,
    nested: transac.nested || false,
    locked: transac.locked || false,
    processId: transac.processId,
    user: transac.user,
    server: transac.server
  };

  if (transac.valueDate) form.valueDate = transac.valueDate;

  if (!callback) callback = function (err) {
    if (err) throw err;
  };

  var requestOptions = {
    uri: this.serverUrl + '/transacs',
    method: 'POST',
    form: form,
    json: true
  };

  (0, _request2['default'])(requestOptions, function (err, response, body) {
    if (err) return callback(new Error('Cannot connect to transacd\n' + err.message));
    switch (response.statusCode) {
      case 418:
        switch (body.code) {
          case 'locked':
            return callback(new Error('Transaction ' + transac.name + ' already exists and is locked'));
          default:
            return callback(new Error(body.toString()));
        }
      case 200:
        transac.id = body.id;
        return execTask.bind(transac)(task, callback);
      case 500:
      default:
        var msg = 'Internal error, server responds code ' + response.statusCode;
        return callback(new Error(msg));
    }
  });
}

function publishEvent(event, callback) {
  var transac = this;
  var requestOptions = {
    uri: this.serverUrl + '/transacs/' + transac.id + '/events',
    method: 'PUT',
    json: true,
    form: {
      type: event.type,
      label: event.label || '',
      message: event.message || ''
    }
  };

  (0, _request2['default'])(requestOptions, function (err, response, body) {
    if (err) return callback(err);
    switch (response.statusCode) {
      case 418:
        switch (body.code) {
          case 'notransac':
            return callback(new Error('Transaction ' + transac.id + ' doesn\'t exist'));
          case 'closed':
            return callback(new Error('Transaction ' + transac.name + ' is already closed'));
          default:
            return callback(body);
        }
      case 200:
        return callback(null, event);
      case 500:
      default:
        var msg = 'Internal error, server responds code ' + response.statusCode;
        return callback(new Error(msg));
    }
  });
};

function pushEvent(type, label, message, cb) {
  if (message instanceof Error) {
    message = message.message + '\n\n' + message.stack;
  }
  this.queue.push({ type: type, label: label, message: message }, cb);
}

var Transac = function Transac(name, serverUrl) {
  var _ref = arguments[2] === undefined ? {} : arguments[2];

  var valueDate = _ref.valueDate;
  var nested = _ref.nested;
  var locked = _ref.locked;

  _classCallCheck(this, Transac);

  this.name = name;
  this.serverUrl = serverUrl;
  this.nested = nested;
  this.locked = locked;
  this.processId = process.pid;
  this.user = process.env.USER;
  this.server = _os2['default'].hostname();
  if (valueDate) {
    if (_lodash2['default'].isString(valueDate)) this.valueDate = (0, _moment2['default'])(valueDate).format('DD/MM/YYYY');else this.valueDate = (0, _moment2['default'])(valueDate).startOf('day');
  }
  this.exec = execute;
  this.info = pushEvent.bind(this, 'info');
  this.warning = pushEvent.bind(this, 'warning');
  this.error = pushEvent.bind(this, 'error');
  this.queue = _async2['default'].queue(publishEvent.bind(this), 1);
};

function transac(serverUrl) {
  return function (name, task, options, cb) {
    if (_lodash2['default'].isFunction(options)) {
      cb = options;
      options = {};
    }
    var t = new Transac(name, serverUrl, options);
    t.exec(task, cb);
    return t;
  };
}

