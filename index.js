'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

exports['default'] = transac;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

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

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

function execTask(task, cb) {
  var transac = this;
  function callbackExecTask(err) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    if (err) {
      pushEvent.bind(transac, 'abort')('Runtime Error', err, function () {
        return cb(err, transac.id);
      });
    } else {
      pushEvent.bind(transac, 'commit')('Transac Completed', function () {
        return cb.apply(undefined, [null, transac.id].concat(args));
      });
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
    label: transac.label,
    compound: transac.compound || false,
    locked: transac.locked || false,
    processId: transac.processId,
    user: transac.user,
    server: transac.server
  };

  if (transac.valueDate) form.valueDate = (0, _moment2['default'])(transac.valueDate).format('DD/MM/YYYY');;

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
            return callback(new Error('Transaction ' + transac.label + ' already exists and is locked'));
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
    form: { level: event.level }
  };

  if (event.messages) requestOptions.form.messages = event.messages;
  if (event.label) requestOptions.form.label = event.label;

  (0, _request2['default'])(requestOptions, function (err, response, body) {
    if (err) return callback(err);
    switch (response.statusCode) {
      case 418:
        switch (body.code) {
          case 'notransac':
            return callback(new Error('Transaction ' + transac.id + ' doesn\'t exist'));
          case 'closed':
            return callback(new Error('Transaction ' + transac.label + ' is already closed'));
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

function pushEvent(level) {
  for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    args[_key2 - 1] = arguments[_key2];
  }

  var label = args[0];
  var messages = args[1];
  var cb = args[2];
  var event = { level: level };

  if (args.length == 1) {
    if (label instanceof Error) {
      event.label = label.message;
      event.messages = [label.stack];
    } else {
      event.messages = _lodash2['default'].isString(label) ? [label] : label;
    }
  } else if (args.length == 2) {
    if (_lodash2['default'].isFunction(messages)) {
      cb = messages;
      if (label instanceof Error) {
        event.label = label.message;
        event.messages = [label.stack];
      } else {
        event.messages = _lodash2['default'].isString(label) ? [label] : label;
      }
    } else {
      event.label = label;
      if (messages instanceof Error) {
        event.messages = [messages.message, messages.stack];
      } else {
        event.messages = _lodash2['default'].isString(messages) ? [messages] : messages;
      }
    }
  } else if (args.length == 3) {
    event.label = label;
    if (messages instanceof Error) {
      event.messages = [messages.message, messages.stack];
    } else {
      event.messages = _lodash2['default'].isString(label) ? [label] : label;
    }
  }

  if (event.label || event.messages) this.queue.push(event, cb);
}

var Transac = (function (_stream$Writable) {
  function Transac(label, serverUrl) {
    var _ref = arguments[2] === undefined ? {} : arguments[2];

    var valueDate = _ref.valueDate;
    var compound = _ref.compound;
    var locked = _ref.locked;

    _classCallCheck(this, Transac);

    _get(Object.getPrototypeOf(Transac.prototype), 'constructor', this).call(this);
    this.label = label;
    this.serverUrl = serverUrl;
    this.compound = compound;
    this.locked = locked;
    this.processId = process.pid;
    this.user = process.env.USER;
    this.server = _os2['default'].hostname();
    if (valueDate) {
      if (_lodash2['default'].isString(valueDate)) this.valueDate = (0, _moment2['default'])(valueDate, 'DD/MM/YYYY').toDate();else this.valueDate = (0, _moment2['default'])(valueDate).startOf('day').toDate();
    }
    this.exec = execute;
    this.info = pushEvent.bind(this, 'info');
    this.warning = pushEvent.bind(this, 'warning');
    this.error = pushEvent.bind(this, 'error');
    this.queue = _async2['default'].queue(publishEvent.bind(this), 1);
  }

  _inherits(Transac, _stream$Writable);

  _createClass(Transac, [{
    key: '_write',
    value: function _write(chunk, encoding, cb) {
      this.info(chunk.toString('utf8'), cb);
    }
  }]);

  return Transac;
})(_stream2['default'].Writable);

function transac(serverUrl) {
  return function (label, task, options, cb) {
    if (_lodash2['default'].isFunction(options)) {
      cb = options;
      options = {};
    }
    if (!cb) {
      var promise = new Promise(function (resolve, reject) {
        var t = new Transac(label, serverUrl, options);
        t.exec(task, function (err) {
          if (err) return reject(err);
          resolve(t);
        });
      });
      return promise;
    } else {
      var t = new Transac(label, serverUrl, options);
      t.exec(task, cb);
      return t;
    }
  };
}

module.exports = exports['default'];

