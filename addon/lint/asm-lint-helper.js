;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require=(function(e,t,n,r){function i(r){if(!n[r]){if(!t[r]){if(e)return e(r);throw new Error("Cannot find module '"+r+"'")}var s=n[r]={exports:{}};t[r][0](function(e){var n=t[r][1][e];return i(n?n:e)},s,s.exports)}return n[r].exports}for(var s=0;s<r.length;s++)i(r[s]);return i})(typeof require!=="undefined"&&require,{1:[function(require,module,exports){
// UTILITY
var util = require('util');
var Buffer = require("buffer").Buffer;
var pSlice = Array.prototype.slice;

function objectKeys(object) {
  if (Object.keys) return Object.keys(object);
  var result = [];
  for (var name in object) {
    if (Object.prototype.hasOwnProperty.call(object, name)) {
      result.push(name);
    }
  }
  return result;
}

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.message = options.message;
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
};
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (value === undefined) {
    return '' + value;
  }
  if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (typeof value === 'function' || value instanceof RegExp) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (typeof s == 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

assert.AssertionError.prototype.toString = function() {
  if (this.message) {
    return [this.name + ':', this.message].join(' ');
  } else {
    return [
      this.name + ':',
      truncate(JSON.stringify(this.actual, replacer), 128),
      this.operator,
      truncate(JSON.stringify(this.expected, replacer), 128)
    ].join(' ');
  }
};

// assert.AssertionError instanceof Error

assert.AssertionError.__proto__ = Error.prototype;

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!!!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (Buffer.isBuffer(actual) && Buffer.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (typeof actual != 'object' && typeof expected != 'object') {
    return actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (expected instanceof RegExp) {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail('Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail('Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

},{"util":2,"buffer":3}],2:[function(require,module,exports){
var events = require('events');

exports.isArray = isArray;
exports.isDate = function(obj){return Object.prototype.toString.call(obj) === '[object Date]'};
exports.isRegExp = function(obj){return Object.prototype.toString.call(obj) === '[object RegExp]'};


exports.print = function () {};
exports.puts = function () {};
exports.debug = function() {};

exports.inspect = function(obj, showHidden, depth, colors) {
  var seen = [];

  var stylize = function(str, styleType) {
    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
    var styles =
        { 'bold' : [1, 22],
          'italic' : [3, 23],
          'underline' : [4, 24],
          'inverse' : [7, 27],
          'white' : [37, 39],
          'grey' : [90, 39],
          'black' : [30, 39],
          'blue' : [34, 39],
          'cyan' : [36, 39],
          'green' : [32, 39],
          'magenta' : [35, 39],
          'red' : [31, 39],
          'yellow' : [33, 39] };

    var style =
        { 'special': 'cyan',
          'number': 'blue',
          'boolean': 'yellow',
          'undefined': 'grey',
          'null': 'bold',
          'string': 'green',
          'date': 'magenta',
          // "name": intentionally not styling
          'regexp': 'red' }[styleType];

    if (style) {
      return '\033[' + styles[style][0] + 'm' + str +
             '\033[' + styles[style][1] + 'm';
    } else {
      return str;
    }
  };
  if (! colors) {
    stylize = function(str, styleType) { return str; };
  }

  function format(value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (value && typeof value.inspect === 'function' &&
        // Filter out the util module, it's inspect function is special
        value !== exports &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      return value.inspect(recurseTimes);
    }

    // Primitive types cannot have properties
    switch (typeof value) {
      case 'undefined':
        return stylize('undefined', 'undefined');

      case 'string':
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                 .replace(/'/g, "\\'")
                                                 .replace(/\\"/g, '"') + '\'';
        return stylize(simple, 'string');

      case 'number':
        return stylize('' + value, 'number');

      case 'boolean':
        return stylize('' + value, 'boolean');
    }
    // For some reason typeof null is "object", so special case here.
    if (value === null) {
      return stylize('null', 'null');
    }

    // Look up the keys of the object.
    var visible_keys = Object_keys(value);
    var keys = showHidden ? Object_getOwnPropertyNames(value) : visible_keys;

    // Functions without properties can be shortcutted.
    if (typeof value === 'function' && keys.length === 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        var name = value.name ? ': ' + value.name : '';
        return stylize('[Function' + name + ']', 'special');
      }
    }

    // Dates without properties can be shortcutted
    if (isDate(value) && keys.length === 0) {
      return stylize(value.toUTCString(), 'date');
    }

    var base, type, braces;
    // Determine the object type
    if (isArray(value)) {
      type = 'Array';
      braces = ['[', ']'];
    } else {
      type = 'Object';
      braces = ['{', '}'];
    }

    // Make functions say that they are functions
    if (typeof value === 'function') {
      var n = value.name ? ': ' + value.name : '';
      base = (isRegExp(value)) ? ' ' + value : ' [Function' + n + ']';
    } else {
      base = '';
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + value.toUTCString();
    }

    if (keys.length === 0) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        return stylize('[Object]', 'special');
      }
    }

    seen.push(value);

    var output = keys.map(function(key) {
      var name, str;
      if (value.__lookupGetter__) {
        if (value.__lookupGetter__(key)) {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Getter/Setter]', 'special');
          } else {
            str = stylize('[Getter]', 'special');
          }
        } else {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Setter]', 'special');
          }
        }
      }
      if (visible_keys.indexOf(key) < 0) {
        name = '[' + key + ']';
      }
      if (!str) {
        if (seen.indexOf(value[key]) < 0) {
          if (recurseTimes === null) {
            str = format(value[key]);
          } else {
            str = format(value[key], recurseTimes - 1);
          }
          if (str.indexOf('\n') > -1) {
            if (isArray(value)) {
              str = str.split('\n').map(function(line) {
                return '  ' + line;
              }).join('\n').substr(2);
            } else {
              str = '\n' + str.split('\n').map(function(line) {
                return '   ' + line;
              }).join('\n');
            }
          }
        } else {
          str = stylize('[Circular]', 'special');
        }
      }
      if (typeof name === 'undefined') {
        if (type === 'Array' && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify('' + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = stylize(name, 'name');
        } else {
          name = name.replace(/'/g, "\\'")
                     .replace(/\\"/g, '"')
                     .replace(/(^"|"$)/g, "'");
          name = stylize(name, 'string');
        }
      }

      return name + ': ' + str;
    });

    seen.pop();

    var numLinesEst = 0;
    var length = output.reduce(function(prev, cur) {
      numLinesEst++;
      if (cur.indexOf('\n') >= 0) numLinesEst++;
      return prev + cur.length + 1;
    }, 0);

    if (length > 50) {
      output = braces[0] +
               (base === '' ? '' : base + '\n ') +
               ' ' +
               output.join(',\n  ') +
               ' ' +
               braces[1];

    } else {
      output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
    }

    return output;
  }
  return format(obj, (typeof depth === 'undefined' ? 2 : depth));
};


function isArray(ar) {
  return ar instanceof Array ||
         Array.isArray(ar) ||
         (ar && ar !== Object.prototype && isArray(ar.__proto__));
}


function isRegExp(re) {
  return re instanceof RegExp ||
    (typeof re === 'object' && Object.prototype.toString.call(re) === '[object RegExp]');
}


function isDate(d) {
  if (d instanceof Date) return true;
  if (typeof d !== 'object') return false;
  var properties = Date.prototype && Object_getOwnPropertyNames(Date.prototype);
  var proto = d.__proto__ && Object_getOwnPropertyNames(d.__proto__);
  return JSON.stringify(proto) === JSON.stringify(properties);
}

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

exports.log = function (msg) {};

exports.pump = null;

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key);
    return res;
};

var Object_getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {
    var res = [];
    for (var key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) res.push(key);
    }
    return res;
};

var Object_create = Object.create || function (prototype, properties) {
    // from es5-shim
    var object;
    if (prototype === null) {
        object = { '__proto__' : null };
    }
    else {
        if (typeof prototype !== 'object') {
            throw new TypeError(
                'typeof prototype[' + (typeof prototype) + '] != \'object\''
            );
        }
        var Type = function () {};
        Type.prototype = prototype;
        object = new Type();
        object.__proto__ = prototype;
    }
    if (typeof properties !== 'undefined' && Object.defineProperties) {
        Object.defineProperties(object, properties);
    }
    return object;
};

exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object_create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (typeof f !== 'string') {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(exports.inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j': return JSON.stringify(args[i++]);
      default:
        return x;
    }
  });
  for(var x = args[i]; i < len; x = args[++i]){
    if (x === null || typeof x !== 'object') {
      str += ' ' + x;
    } else {
      str += ' ' + exports.inspect(x);
    }
  }
  return str;
};

},{"events":4}],5:[function(require,module,exports){
exports.readIEEE754 = function(buffer, offset, isBE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isBE ? 0 : (nBytes - 1),
      d = isBE ? 1 : -1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.writeIEEE754 = function(buffer, value, offset, isBE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isBE ? (nBytes - 1) : 0,
      d = isBE ? -1 : 1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],6:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],4:[function(require,module,exports){
(function(process){if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;
function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (x === xs[i]) return i;
    }
    return -1;
}

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

})(require("__browserify_process"))
},{"__browserify_process":6}],"buffer-browserify":[function(require,module,exports){
module.exports=require('q9TxCC');
},{}],"q9TxCC":[function(require,module,exports){
function SlowBuffer (size) {
    this.length = size;
};

var assert = require('assert');

exports.INSPECT_MAX_BYTES = 50;


function toHex(n) {
  if (n < 16) return '0' + n.toString(16);
  return n.toString(16);
}

function utf8ToBytes(str) {
  var byteArray = [];
  for (var i = 0; i < str.length; i++)
    if (str.charCodeAt(i) <= 0x7F)
      byteArray.push(str.charCodeAt(i));
    else {
      var h = encodeURIComponent(str.charAt(i)).substr(1).split('%');
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16));
    }

  return byteArray;
}

function asciiToBytes(str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++ )
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push( str.charCodeAt(i) & 0xFF );

  return byteArray;
}

function base64ToBytes(str) {
  return require("base64-js").toByteArray(str);
}

SlowBuffer.byteLength = function (str, encoding) {
  switch (encoding || "utf8") {
    case 'hex':
      return str.length / 2;

    case 'utf8':
    case 'utf-8':
      return utf8ToBytes(str).length;

    case 'ascii':
    case 'binary':
      return str.length;

    case 'base64':
      return base64ToBytes(str).length;

    default:
      throw new Error('Unknown encoding');
  }
};

function blitBuffer(src, dst, offset, length) {
  var pos, i = 0;
  while (i < length) {
    if ((i+offset >= dst.length) || (i >= src.length))
      break;

    dst[i + offset] = src[i];
    i++;
  }
  return i;
}

SlowBuffer.prototype.utf8Write = function (string, offset, length) {
  var bytes, pos;
  return SlowBuffer._charsWritten =  blitBuffer(utf8ToBytes(string), this, offset, length);
};

SlowBuffer.prototype.asciiWrite = function (string, offset, length) {
  var bytes, pos;
  return SlowBuffer._charsWritten =  blitBuffer(asciiToBytes(string), this, offset, length);
};

SlowBuffer.prototype.binaryWrite = SlowBuffer.prototype.asciiWrite;

SlowBuffer.prototype.base64Write = function (string, offset, length) {
  var bytes, pos;
  return SlowBuffer._charsWritten = blitBuffer(base64ToBytes(string), this, offset, length);
};

SlowBuffer.prototype.base64Slice = function (start, end) {
  var bytes = Array.prototype.slice.apply(this, arguments)
  return require("base64-js").fromByteArray(bytes);
}

function decodeUtf8Char(str) {
  try {
    return decodeURIComponent(str);
  } catch (err) {
    return String.fromCharCode(0xFFFD); // UTF 8 invalid char
  }
}

SlowBuffer.prototype.utf8Slice = function () {
  var bytes = Array.prototype.slice.apply(this, arguments);
  var res = "";
  var tmp = "";
  var i = 0;
  while (i < bytes.length) {
    if (bytes[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(bytes[i]);
      tmp = "";
    } else
      tmp += "%" + bytes[i].toString(16);

    i++;
  }

  return res + decodeUtf8Char(tmp);
}

SlowBuffer.prototype.asciiSlice = function () {
  var bytes = Array.prototype.slice.apply(this, arguments);
  var ret = "";
  for (var i = 0; i < bytes.length; i++)
    ret += String.fromCharCode(bytes[i]);
  return ret;
}

SlowBuffer.prototype.binarySlice = SlowBuffer.prototype.asciiSlice;

SlowBuffer.prototype.inspect = function() {
  var out = [],
      len = this.length;
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i]);
    if (i == exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...';
      break;
    }
  }
  return '<SlowBuffer ' + out.join(' ') + '>';
};


SlowBuffer.prototype.hexSlice = function(start, end) {
  var len = this.length;

  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;

  var out = '';
  for (var i = start; i < end; i++) {
    out += toHex(this[i]);
  }
  return out;
};


SlowBuffer.prototype.toString = function(encoding, start, end) {
  encoding = String(encoding || 'utf8').toLowerCase();
  start = +start || 0;
  if (typeof end == 'undefined') end = this.length;

  // Fastpath empty strings
  if (+end == start) {
    return '';
  }

  switch (encoding) {
    case 'hex':
      return this.hexSlice(start, end);

    case 'utf8':
    case 'utf-8':
      return this.utf8Slice(start, end);

    case 'ascii':
      return this.asciiSlice(start, end);

    case 'binary':
      return this.binarySlice(start, end);

    case 'base64':
      return this.base64Slice(start, end);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Slice(start, end);

    default:
      throw new Error('Unknown encoding');
  }
};


SlowBuffer.prototype.hexWrite = function(string, offset, length) {
  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }

  // must be an even number of digits
  var strLen = string.length;
  if (strLen % 2) {
    throw new Error('Invalid hex string');
  }
  if (length > strLen / 2) {
    length = strLen / 2;
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16);
    if (isNaN(byte)) throw new Error('Invalid hex string');
    this[offset + i] = byte;
  }
  SlowBuffer._charsWritten = i * 2;
  return i;
};


SlowBuffer.prototype.write = function(string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length;
      length = undefined;
    }
  } else {  // legacy
    var swap = encoding;
    encoding = offset;
    offset = length;
    length = swap;
  }

  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase();

  switch (encoding) {
    case 'hex':
      return this.hexWrite(string, offset, length);

    case 'utf8':
    case 'utf-8':
      return this.utf8Write(string, offset, length);

    case 'ascii':
      return this.asciiWrite(string, offset, length);

    case 'binary':
      return this.binaryWrite(string, offset, length);

    case 'base64':
      return this.base64Write(string, offset, length);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Write(string, offset, length);

    default:
      throw new Error('Unknown encoding');
  }
};


// slice(start, end)
SlowBuffer.prototype.slice = function(start, end) {
  if (end === undefined) end = this.length;

  if (end > this.length) {
    throw new Error('oob');
  }
  if (start > end) {
    throw new Error('oob');
  }

  return new Buffer(this, end - start, +start);
};

SlowBuffer.prototype.copy = function(target, targetstart, sourcestart, sourceend) {
  var temp = [];
  for (var i=sourcestart; i<sourceend; i++) {
    assert.ok(typeof this[i] !== 'undefined', "copying undefined buffer bytes!");
    temp.push(this[i]);
  }

  for (var i=targetstart; i<targetstart+temp.length; i++) {
    target[i] = temp[i-targetstart];
  }
};

SlowBuffer.prototype.fill = function(value, start, end) {
  if (end > this.length) {
    throw new Error('oob');
  }
  if (start > end) {
    throw new Error('oob');
  }

  for (var i = start; i < end; i++) {
    this[i] = value;
  }
}

function coerce(length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length);
  return length < 0 ? 0 : length;
}


// Buffer

function Buffer(subject, encoding, offset) {
  if (!(this instanceof Buffer)) {
    return new Buffer(subject, encoding, offset);
  }

  var type;

  // Are we slicing?
  if (typeof offset === 'number') {
    this.length = coerce(encoding);
    this.parent = subject;
    this.offset = offset;
  } else {
    // Find the length
    switch (type = typeof subject) {
      case 'number':
        this.length = coerce(subject);
        break;

      case 'string':
        this.length = Buffer.byteLength(subject, encoding);
        break;

      case 'object': // Assume object is an array
        this.length = coerce(subject.length);
        break;

      default:
        throw new Error('First argument needs to be a number, ' +
                        'array or string.');
    }

    if (this.length > Buffer.poolSize) {
      // Big buffer, just alloc one.
      this.parent = new SlowBuffer(this.length);
      this.offset = 0;

    } else {
      // Small buffer.
      if (!pool || pool.length - pool.used < this.length) allocPool();
      this.parent = pool;
      this.offset = pool.used;
      pool.used += this.length;
    }

    // Treat array-ish objects as a byte array.
    if (isArrayIsh(subject)) {
      for (var i = 0; i < this.length; i++) {
        if (subject instanceof Buffer) {
          this.parent[i + this.offset] = subject.readUInt8(i);
        }
        else {
          this.parent[i + this.offset] = subject[i];
        }
      }
    } else if (type == 'string') {
      // We are a string
      this.length = this.write(subject, 0, encoding);
    }
  }

}

function isArrayIsh(subject) {
  return Array.isArray(subject) || Buffer.isBuffer(subject) ||
         subject && typeof subject === 'object' &&
         typeof subject.length === 'number';
}

exports.SlowBuffer = SlowBuffer;
exports.Buffer = Buffer;

Buffer.poolSize = 8 * 1024;
var pool;

function allocPool() {
  pool = new SlowBuffer(Buffer.poolSize);
  pool.used = 0;
}


// Static methods
Buffer.isBuffer = function isBuffer(b) {
  return b instanceof Buffer || b instanceof SlowBuffer;
};

Buffer.concat = function (list, totalLength) {
  if (!Array.isArray(list)) {
    throw new Error("Usage: Buffer.concat(list, [totalLength])\n \
      list should be an Array.");
  }

  if (list.length === 0) {
    return new Buffer(0);
  } else if (list.length === 1) {
    return list[0];
  }

  if (typeof totalLength !== 'number') {
    totalLength = 0;
    for (var i = 0; i < list.length; i++) {
      var buf = list[i];
      totalLength += buf.length;
    }
  }

  var buffer = new Buffer(totalLength);
  var pos = 0;
  for (var i = 0; i < list.length; i++) {
    var buf = list[i];
    buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer;
};

// Inspect
Buffer.prototype.inspect = function inspect() {
  var out = [],
      len = this.length;

  for (var i = 0; i < len; i++) {
    out[i] = toHex(this.parent[i + this.offset]);
    if (i == exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...';
      break;
    }
  }

  return '<Buffer ' + out.join(' ') + '>';
};


Buffer.prototype.get = function get(i) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this.parent[this.offset + i];
};


Buffer.prototype.set = function set(i, v) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this.parent[this.offset + i] = v;
};


// write(string, offset = 0, length = buffer.length-offset, encoding = 'utf8')
Buffer.prototype.write = function(string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length;
      length = undefined;
    }
  } else {  // legacy
    var swap = encoding;
    encoding = offset;
    offset = length;
    length = swap;
  }

  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase();

  var ret;
  switch (encoding) {
    case 'hex':
      ret = this.parent.hexWrite(string, this.offset + offset, length);
      break;

    case 'utf8':
    case 'utf-8':
      ret = this.parent.utf8Write(string, this.offset + offset, length);
      break;

    case 'ascii':
      ret = this.parent.asciiWrite(string, this.offset + offset, length);
      break;

    case 'binary':
      ret = this.parent.binaryWrite(string, this.offset + offset, length);
      break;

    case 'base64':
      // Warning: maxLength not taken into account in base64Write
      ret = this.parent.base64Write(string, this.offset + offset, length);
      break;

    case 'ucs2':
    case 'ucs-2':
      ret = this.parent.ucs2Write(string, this.offset + offset, length);
      break;

    default:
      throw new Error('Unknown encoding');
  }

  Buffer._charsWritten = SlowBuffer._charsWritten;

  return ret;
};


// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function(encoding, start, end) {
  encoding = String(encoding || 'utf8').toLowerCase();

  if (typeof start == 'undefined' || start < 0) {
    start = 0;
  } else if (start > this.length) {
    start = this.length;
  }

  if (typeof end == 'undefined' || end > this.length) {
    end = this.length;
  } else if (end < 0) {
    end = 0;
  }

  start = start + this.offset;
  end = end + this.offset;

  switch (encoding) {
    case 'hex':
      return this.parent.hexSlice(start, end);

    case 'utf8':
    case 'utf-8':
      return this.parent.utf8Slice(start, end);

    case 'ascii':
      return this.parent.asciiSlice(start, end);

    case 'binary':
      return this.parent.binarySlice(start, end);

    case 'base64':
      return this.parent.base64Slice(start, end);

    case 'ucs2':
    case 'ucs-2':
      return this.parent.ucs2Slice(start, end);

    default:
      throw new Error('Unknown encoding');
  }
};


// byteLength
Buffer.byteLength = SlowBuffer.byteLength;


// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill(value, start, end) {
  value || (value = 0);
  start || (start = 0);
  end || (end = this.length);

  if (typeof value === 'string') {
    value = value.charCodeAt(0);
  }
  if (!(typeof value === 'number') || isNaN(value)) {
    throw new Error('value is not a number');
  }

  if (end < start) throw new Error('end < start');

  // Fill 0 bytes; we're done
  if (end === start) return 0;
  if (this.length == 0) return 0;

  if (start < 0 || start >= this.length) {
    throw new Error('start out of bounds');
  }

  if (end < 0 || end > this.length) {
    throw new Error('end out of bounds');
  }

  return this.parent.fill(value,
                          start + this.offset,
                          end + this.offset);
};


// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function(target, target_start, start, end) {
  var source = this;
  start || (start = 0);
  end || (end = this.length);
  target_start || (target_start = 0);

  if (end < start) throw new Error('sourceEnd < sourceStart');

  // Copy 0 bytes; we're done
  if (end === start) return 0;
  if (target.length == 0 || source.length == 0) return 0;

  if (target_start < 0 || target_start >= target.length) {
    throw new Error('targetStart out of bounds');
  }

  if (start < 0 || start >= source.length) {
    throw new Error('sourceStart out of bounds');
  }

  if (end < 0 || end > source.length) {
    throw new Error('sourceEnd out of bounds');
  }

  // Are we oob?
  if (end > this.length) {
    end = this.length;
  }

  if (target.length - target_start < end - start) {
    end = target.length - target_start + start;
  }

  return this.parent.copy(target.parent,
                          target_start + target.offset,
                          start + this.offset,
                          end + this.offset);
};


// slice(start, end)
Buffer.prototype.slice = function(start, end) {
  if (end === undefined) end = this.length;
  if (end > this.length) throw new Error('oob');
  if (start > end) throw new Error('oob');

  return new Buffer(this.parent, end - start, +start + this.offset);
};


// Legacy methods for backwards compatibility.

Buffer.prototype.utf8Slice = function(start, end) {
  return this.toString('utf8', start, end);
};

Buffer.prototype.binarySlice = function(start, end) {
  return this.toString('binary', start, end);
};

Buffer.prototype.asciiSlice = function(start, end) {
  return this.toString('ascii', start, end);
};

Buffer.prototype.utf8Write = function(string, offset) {
  return this.write(string, offset, 'utf8');
};

Buffer.prototype.binaryWrite = function(string, offset) {
  return this.write(string, offset, 'binary');
};

Buffer.prototype.asciiWrite = function(string, offset) {
  return this.write(string, offset, 'ascii');
};

Buffer.prototype.readUInt8 = function(offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return;

  return buffer.parent[buffer.offset + offset];
};

function readUInt16(buffer, offset, isBigEndian, noAssert) {
  var val = 0;


  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return 0;

  if (isBigEndian) {
    val = buffer.parent[buffer.offset + offset] << 8;
    if (offset + 1 < buffer.length) {
      val |= buffer.parent[buffer.offset + offset + 1];
    }
  } else {
    val = buffer.parent[buffer.offset + offset];
    if (offset + 1 < buffer.length) {
      val |= buffer.parent[buffer.offset + offset + 1] << 8;
    }
  }

  return val;
}

Buffer.prototype.readUInt16LE = function(offset, noAssert) {
  return readUInt16(this, offset, false, noAssert);
};

Buffer.prototype.readUInt16BE = function(offset, noAssert) {
  return readUInt16(this, offset, true, noAssert);
};

function readUInt32(buffer, offset, isBigEndian, noAssert) {
  var val = 0;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return 0;

  if (isBigEndian) {
    if (offset + 1 < buffer.length)
      val = buffer.parent[buffer.offset + offset + 1] << 16;
    if (offset + 2 < buffer.length)
      val |= buffer.parent[buffer.offset + offset + 2] << 8;
    if (offset + 3 < buffer.length)
      val |= buffer.parent[buffer.offset + offset + 3];
    val = val + (buffer.parent[buffer.offset + offset] << 24 >>> 0);
  } else {
    if (offset + 2 < buffer.length)
      val = buffer.parent[buffer.offset + offset + 2] << 16;
    if (offset + 1 < buffer.length)
      val |= buffer.parent[buffer.offset + offset + 1] << 8;
    val |= buffer.parent[buffer.offset + offset];
    if (offset + 3 < buffer.length)
      val = val + (buffer.parent[buffer.offset + offset + 3] << 24 >>> 0);
  }

  return val;
}

Buffer.prototype.readUInt32LE = function(offset, noAssert) {
  return readUInt32(this, offset, false, noAssert);
};

Buffer.prototype.readUInt32BE = function(offset, noAssert) {
  return readUInt32(this, offset, true, noAssert);
};


/*
 * Signed integer types, yay team! A reminder on how two's complement actually
 * works. The first bit is the signed bit, i.e. tells us whether or not the
 * number should be positive or negative. If the two's complement value is
 * positive, then we're done, as it's equivalent to the unsigned representation.
 *
 * Now if the number is positive, you're pretty much done, you can just leverage
 * the unsigned translations and return those. Unfortunately, negative numbers
 * aren't quite that straightforward.
 *
 * At first glance, one might be inclined to use the traditional formula to
 * translate binary numbers between the positive and negative values in two's
 * complement. (Though it doesn't quite work for the most negative value)
 * Mainly:
 *  - invert all the bits
 *  - add one to the result
 *
 * Of course, this doesn't quite work in Javascript. Take for example the value
 * of -128. This could be represented in 16 bits (big-endian) as 0xff80. But of
 * course, Javascript will do the following:
 *
 * > ~0xff80
 * -65409
 *
 * Whoh there, Javascript, that's not quite right. But wait, according to
 * Javascript that's perfectly correct. When Javascript ends up seeing the
 * constant 0xff80, it has no notion that it is actually a signed number. It
 * assumes that we've input the unsigned value 0xff80. Thus, when it does the
 * binary negation, it casts it into a signed value, (positive 0xff80). Then
 * when you perform binary negation on that, it turns it into a negative number.
 *
 * Instead, we're going to have to use the following general formula, that works
 * in a rather Javascript friendly way. I'm glad we don't support this kind of
 * weird numbering scheme in the kernel.
 *
 * (BIT-MAX - (unsigned)val + 1) * -1
 *
 * The astute observer, may think that this doesn't make sense for 8-bit numbers
 * (really it isn't necessary for them). However, when you get 16-bit numbers,
 * you do. Let's go back to our prior example and see how this will look:
 *
 * (0xffff - 0xff80 + 1) * -1
 * (0x007f + 1) * -1
 * (0x0080) * -1
 */
Buffer.prototype.readInt8 = function(offset, noAssert) {
  var buffer = this;
  var neg;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return;

  neg = buffer.parent[buffer.offset + offset] & 0x80;
  if (!neg) {
    return (buffer.parent[buffer.offset + offset]);
  }

  return ((0xff - buffer.parent[buffer.offset + offset] + 1) * -1);
};

function readInt16(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt16(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x8000;
  if (!neg) {
    return val;
  }

  return (0xffff - val + 1) * -1;
}

Buffer.prototype.readInt16LE = function(offset, noAssert) {
  return readInt16(this, offset, false, noAssert);
};

Buffer.prototype.readInt16BE = function(offset, noAssert) {
  return readInt16(this, offset, true, noAssert);
};

function readInt32(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt32(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x80000000;
  if (!neg) {
    return (val);
  }

  return (0xffffffff - val + 1) * -1;
}

Buffer.prototype.readInt32LE = function(offset, noAssert) {
  return readInt32(this, offset, false, noAssert);
};

Buffer.prototype.readInt32BE = function(offset, noAssert) {
  return readInt32(this, offset, true, noAssert);
};

function readFloat(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return require('./buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,
      23, 4);
}

Buffer.prototype.readFloatLE = function(offset, noAssert) {
  return readFloat(this, offset, false, noAssert);
};

Buffer.prototype.readFloatBE = function(offset, noAssert) {
  return readFloat(this, offset, true, noAssert);
};

function readDouble(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 7 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return require('./buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.readDoubleLE = function(offset, noAssert) {
  return readDouble(this, offset, false, noAssert);
};

Buffer.prototype.readDoubleBE = function(offset, noAssert) {
  return readDouble(this, offset, true, noAssert);
};


/*
 * We have to make sure that the value is a valid integer. This means that it is
 * non-negative. It has no fractional component and that it does not exceed the
 * maximum allowed value.
 *
 *      value           The number to check for validity
 *
 *      max             The maximum value
 */
function verifuint(value, max) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value >= 0,
      'specified a negative value for writing an unsigned value');

  assert.ok(value <= max, 'value is larger than maximum value for type');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

Buffer.prototype.writeUInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xff);
  }

  if (offset < buffer.length) {
    buffer.parent[buffer.offset + offset] = value;
  }
};

function writeUInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffff);
  }

  for (var i = 0; i < Math.min(buffer.length - offset, 2); i++) {
    buffer.parent[buffer.offset + offset + i] =
        (value & (0xff << (8 * (isBigEndian ? 1 - i : i)))) >>>
            (isBigEndian ? 1 - i : i) * 8;
  }

}

Buffer.prototype.writeUInt16LE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt16BE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, true, noAssert);
};

function writeUInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffffffff);
  }

  for (var i = 0; i < Math.min(buffer.length - offset, 4); i++) {
    buffer.parent[buffer.offset + offset + i] =
        (value >>> (isBigEndian ? 3 - i : i) * 8) & 0xff;
  }
}

Buffer.prototype.writeUInt32LE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt32BE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, true, noAssert);
};


/*
 * We now move onto our friends in the signed number category. Unlike unsigned
 * numbers, we're going to have to worry a bit more about how we put values into
 * arrays. Since we are only worrying about signed 32-bit values, we're in
 * slightly better shape. Unfortunately, we really can't do our favorite binary
 * & in this system. It really seems to do the wrong thing. For example:
 *
 * > -32 & 0xff
 * 224
 *
 * What's happening above is really: 0xe0 & 0xff = 0xe0. However, the results of
 * this aren't treated as a signed number. Ultimately a bad thing.
 *
 * What we're going to want to do is basically create the unsigned equivalent of
 * our representation and pass that off to the wuint* functions. To do that
 * we're going to do the following:
 *
 *  - if the value is positive
 *      we can pass it directly off to the equivalent wuint
 *  - if the value is negative
 *      we do the following computation:
 *         mb + val + 1, where
 *         mb   is the maximum unsigned value in that byte size
 *         val  is the Javascript negative integer
 *
 *
 * As a concrete value, take -128. In signed 16 bits this would be 0xff80. If
 * you do out the computations:
 *
 * 0xffff - 128 + 1
 * 0xffff - 127
 * 0xff80
 *
 * You can then encode this value as the signed version. This is really rather
 * hacky, but it should work and get the job done which is our goal here.
 */

/*
 * A series of checks to make sure we actually have a signed 32-bit number
 */
function verifsint(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

function verifIEEE754(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');
}

Buffer.prototype.writeInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7f, -0x80);
  }

  if (value >= 0) {
    buffer.writeUInt8(value, offset, noAssert);
  } else {
    buffer.writeUInt8(0xff + value + 1, offset, noAssert);
  }
};

function writeInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fff, -0x8000);
  }

  if (value >= 0) {
    writeUInt16(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt16(buffer, 0xffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt16LE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt16BE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, true, noAssert);
};

function writeInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fffffff, -0x80000000);
  }

  if (value >= 0) {
    writeUInt32(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt32(buffer, 0xffffffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt32LE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt32BE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, true, noAssert);
};

function writeFloat(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38);
  }

  require('./buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,
      23, 4);
}

Buffer.prototype.writeFloatLE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, false, noAssert);
};

Buffer.prototype.writeFloatBE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, true, noAssert);
};

function writeDouble(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 7 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308);
  }

  require('./buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.writeDoubleLE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, false, noAssert);
};

Buffer.prototype.writeDoubleBE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, true, noAssert);
};

SlowBuffer.prototype.readUInt8 = Buffer.prototype.readUInt8;
SlowBuffer.prototype.readUInt16LE = Buffer.prototype.readUInt16LE;
SlowBuffer.prototype.readUInt16BE = Buffer.prototype.readUInt16BE;
SlowBuffer.prototype.readUInt32LE = Buffer.prototype.readUInt32LE;
SlowBuffer.prototype.readUInt32BE = Buffer.prototype.readUInt32BE;
SlowBuffer.prototype.readInt8 = Buffer.prototype.readInt8;
SlowBuffer.prototype.readInt16LE = Buffer.prototype.readInt16LE;
SlowBuffer.prototype.readInt16BE = Buffer.prototype.readInt16BE;
SlowBuffer.prototype.readInt32LE = Buffer.prototype.readInt32LE;
SlowBuffer.prototype.readInt32BE = Buffer.prototype.readInt32BE;
SlowBuffer.prototype.readFloatLE = Buffer.prototype.readFloatLE;
SlowBuffer.prototype.readFloatBE = Buffer.prototype.readFloatBE;
SlowBuffer.prototype.readDoubleLE = Buffer.prototype.readDoubleLE;
SlowBuffer.prototype.readDoubleBE = Buffer.prototype.readDoubleBE;
SlowBuffer.prototype.writeUInt8 = Buffer.prototype.writeUInt8;
SlowBuffer.prototype.writeUInt16LE = Buffer.prototype.writeUInt16LE;
SlowBuffer.prototype.writeUInt16BE = Buffer.prototype.writeUInt16BE;
SlowBuffer.prototype.writeUInt32LE = Buffer.prototype.writeUInt32LE;
SlowBuffer.prototype.writeUInt32BE = Buffer.prototype.writeUInt32BE;
SlowBuffer.prototype.writeInt8 = Buffer.prototype.writeInt8;
SlowBuffer.prototype.writeInt16LE = Buffer.prototype.writeInt16LE;
SlowBuffer.prototype.writeInt16BE = Buffer.prototype.writeInt16BE;
SlowBuffer.prototype.writeInt32LE = Buffer.prototype.writeInt32LE;
SlowBuffer.prototype.writeInt32BE = Buffer.prototype.writeInt32BE;
SlowBuffer.prototype.writeFloatLE = Buffer.prototype.writeFloatLE;
SlowBuffer.prototype.writeFloatBE = Buffer.prototype.writeFloatBE;
SlowBuffer.prototype.writeDoubleLE = Buffer.prototype.writeDoubleLE;
SlowBuffer.prototype.writeDoubleBE = Buffer.prototype.writeDoubleBE;

},{"assert":1,"./buffer_ieee754":5,"base64-js":7}],7:[function(require,module,exports){
(function (exports) {
	'use strict';

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	function b64ToByteArray(b64) {
		var i, j, l, tmp, placeHolders, arr;
	
		if (b64.length % 4 > 0) {
			throw 'Invalid string. Length must be a multiple of 4';
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		placeHolders = b64.indexOf('=');
		placeHolders = placeHolders > 0 ? b64.length - placeHolders : 0;

		// base64 is 4/3 + up to two characters of the original data
		arr = [];//new Uint8Array(b64.length * 3 / 4 - placeHolders);

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length;

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (lookup.indexOf(b64[i]) << 18) | (lookup.indexOf(b64[i + 1]) << 12) | (lookup.indexOf(b64[i + 2]) << 6) | lookup.indexOf(b64[i + 3]);
			arr.push((tmp & 0xFF0000) >> 16);
			arr.push((tmp & 0xFF00) >> 8);
			arr.push(tmp & 0xFF);
		}

		if (placeHolders === 2) {
			tmp = (lookup.indexOf(b64[i]) << 2) | (lookup.indexOf(b64[i + 1]) >> 4);
			arr.push(tmp & 0xFF);
		} else if (placeHolders === 1) {
			tmp = (lookup.indexOf(b64[i]) << 10) | (lookup.indexOf(b64[i + 1]) << 4) | (lookup.indexOf(b64[i + 2]) >> 2);
			arr.push((tmp >> 8) & 0xFF);
			arr.push(tmp & 0xFF);
		}

		return arr;
	}

	function uint8ToBase64(uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length;

		function tripletToBase64 (num) {
			return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
		};

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
			output += tripletToBase64(temp);
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1];
				output += lookup[temp >> 2];
				output += lookup[(temp << 4) & 0x3F];
				output += '==';
				break;
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
				output += lookup[temp >> 10];
				output += lookup[(temp >> 4) & 0x3F];
				output += lookup[(temp << 2) & 0x3F];
				output += '=';
				break;
		}

		return output;
	}

	module.exports.toByteArray = b64ToByteArray;
	module.exports.fromByteArray = uint8ToBase64;
}());

},{}],8:[function(require,module,exports){
exports.readIEEE754 = function(buffer, offset, isBE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isBE ? 0 : (nBytes - 1),
      d = isBE ? 1 : -1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.writeIEEE754 = function(buffer, value, offset, isBE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isBE ? (nBytes - 1) : 0,
      d = isBE ? -1 : 1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],3:[function(require,module,exports){
function SlowBuffer (size) {
    this.length = size;
};

var assert = require('assert');

exports.INSPECT_MAX_BYTES = 50;


function toHex(n) {
  if (n < 16) return '0' + n.toString(16);
  return n.toString(16);
}

function utf8ToBytes(str) {
  var byteArray = [];
  for (var i = 0; i < str.length; i++)
    if (str.charCodeAt(i) <= 0x7F)
      byteArray.push(str.charCodeAt(i));
    else {
      var h = encodeURIComponent(str.charAt(i)).substr(1).split('%');
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16));
    }

  return byteArray;
}

function asciiToBytes(str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++ )
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push( str.charCodeAt(i) & 0xFF );

  return byteArray;
}

function base64ToBytes(str) {
  return require("base64-js").toByteArray(str);
}

SlowBuffer.byteLength = function (str, encoding) {
  switch (encoding || "utf8") {
    case 'hex':
      return str.length / 2;

    case 'utf8':
    case 'utf-8':
      return utf8ToBytes(str).length;

    case 'ascii':
      return str.length;

    case 'base64':
      return base64ToBytes(str).length;

    default:
      throw new Error('Unknown encoding');
  }
};

function blitBuffer(src, dst, offset, length) {
  var pos, i = 0;
  while (i < length) {
    if ((i+offset >= dst.length) || (i >= src.length))
      break;

    dst[i + offset] = src[i];
    i++;
  }
  return i;
}

SlowBuffer.prototype.utf8Write = function (string, offset, length) {
  var bytes, pos;
  return SlowBuffer._charsWritten =  blitBuffer(utf8ToBytes(string), this, offset, length);
};

SlowBuffer.prototype.asciiWrite = function (string, offset, length) {
  var bytes, pos;
  return SlowBuffer._charsWritten =  blitBuffer(asciiToBytes(string), this, offset, length);
};

SlowBuffer.prototype.base64Write = function (string, offset, length) {
  var bytes, pos;
  return SlowBuffer._charsWritten = blitBuffer(base64ToBytes(string), this, offset, length);
};

SlowBuffer.prototype.base64Slice = function (start, end) {
  var bytes = Array.prototype.slice.apply(this, arguments)
  return require("base64-js").fromByteArray(bytes);
}

function decodeUtf8Char(str) {
  try {
    return decodeURIComponent(str);
  } catch (err) {
    return String.fromCharCode(0xFFFD); // UTF 8 invalid char
  }
}

SlowBuffer.prototype.utf8Slice = function () {
  var bytes = Array.prototype.slice.apply(this, arguments);
  var res = "";
  var tmp = "";
  var i = 0;
  while (i < bytes.length) {
    if (bytes[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(bytes[i]);
      tmp = "";
    } else
      tmp += "%" + bytes[i].toString(16);

    i++;
  }

  return res + decodeUtf8Char(tmp);
}

SlowBuffer.prototype.asciiSlice = function () {
  var bytes = Array.prototype.slice.apply(this, arguments);
  var ret = "";
  for (var i = 0; i < bytes.length; i++)
    ret += String.fromCharCode(bytes[i]);
  return ret;
}

SlowBuffer.prototype.inspect = function() {
  var out = [],
      len = this.length;
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i]);
    if (i == exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...';
      break;
    }
  }
  return '<SlowBuffer ' + out.join(' ') + '>';
};


SlowBuffer.prototype.hexSlice = function(start, end) {
  var len = this.length;

  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;

  var out = '';
  for (var i = start; i < end; i++) {
    out += toHex(this[i]);
  }
  return out;
};


SlowBuffer.prototype.toString = function(encoding, start, end) {
  encoding = String(encoding || 'utf8').toLowerCase();
  start = +start || 0;
  if (typeof end == 'undefined') end = this.length;

  // Fastpath empty strings
  if (+end == start) {
    return '';
  }

  switch (encoding) {
    case 'hex':
      return this.hexSlice(start, end);

    case 'utf8':
    case 'utf-8':
      return this.utf8Slice(start, end);

    case 'ascii':
      return this.asciiSlice(start, end);

    case 'binary':
      return this.binarySlice(start, end);

    case 'base64':
      return this.base64Slice(start, end);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Slice(start, end);

    default:
      throw new Error('Unknown encoding');
  }
};


SlowBuffer.prototype.hexWrite = function(string, offset, length) {
  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }

  // must be an even number of digits
  var strLen = string.length;
  if (strLen % 2) {
    throw new Error('Invalid hex string');
  }
  if (length > strLen / 2) {
    length = strLen / 2;
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16);
    if (isNaN(byte)) throw new Error('Invalid hex string');
    this[offset + i] = byte;
  }
  SlowBuffer._charsWritten = i * 2;
  return i;
};


SlowBuffer.prototype.write = function(string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length;
      length = undefined;
    }
  } else {  // legacy
    var swap = encoding;
    encoding = offset;
    offset = length;
    length = swap;
  }

  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase();

  switch (encoding) {
    case 'hex':
      return this.hexWrite(string, offset, length);

    case 'utf8':
    case 'utf-8':
      return this.utf8Write(string, offset, length);

    case 'ascii':
      return this.asciiWrite(string, offset, length);

    case 'binary':
      return this.binaryWrite(string, offset, length);

    case 'base64':
      return this.base64Write(string, offset, length);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Write(string, offset, length);

    default:
      throw new Error('Unknown encoding');
  }
};


// slice(start, end)
SlowBuffer.prototype.slice = function(start, end) {
  if (end === undefined) end = this.length;

  if (end > this.length) {
    throw new Error('oob');
  }
  if (start > end) {
    throw new Error('oob');
  }

  return new Buffer(this, end - start, +start);
};

SlowBuffer.prototype.copy = function(target, targetstart, sourcestart, sourceend) {
  var temp = [];
  for (var i=sourcestart; i<sourceend; i++) {
    assert.ok(typeof this[i] !== 'undefined', "copying undefined buffer bytes!");
    temp.push(this[i]);
  }

  for (var i=targetstart; i<targetstart+temp.length; i++) {
    target[i] = temp[i-targetstart];
  }
};

function coerce(length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length);
  return length < 0 ? 0 : length;
}


// Buffer

function Buffer(subject, encoding, offset) {
  if (!(this instanceof Buffer)) {
    return new Buffer(subject, encoding, offset);
  }

  var type;

  // Are we slicing?
  if (typeof offset === 'number') {
    this.length = coerce(encoding);
    this.parent = subject;
    this.offset = offset;
  } else {
    // Find the length
    switch (type = typeof subject) {
      case 'number':
        this.length = coerce(subject);
        break;

      case 'string':
        this.length = Buffer.byteLength(subject, encoding);
        break;

      case 'object': // Assume object is an array
        this.length = coerce(subject.length);
        break;

      default:
        throw new Error('First argument needs to be a number, ' +
                        'array or string.');
    }

    if (this.length > Buffer.poolSize) {
      // Big buffer, just alloc one.
      this.parent = new SlowBuffer(this.length);
      this.offset = 0;

    } else {
      // Small buffer.
      if (!pool || pool.length - pool.used < this.length) allocPool();
      this.parent = pool;
      this.offset = pool.used;
      pool.used += this.length;
    }

    // Treat array-ish objects as a byte array.
    if (isArrayIsh(subject)) {
      for (var i = 0; i < this.length; i++) {
        this.parent[i + this.offset] = subject[i];
      }
    } else if (type == 'string') {
      // We are a string
      this.length = this.write(subject, 0, encoding);
    }
  }

}

function isArrayIsh(subject) {
  return Array.isArray(subject) || Buffer.isBuffer(subject) ||
         subject && typeof subject === 'object' &&
         typeof subject.length === 'number';
}

exports.SlowBuffer = SlowBuffer;
exports.Buffer = Buffer;

Buffer.poolSize = 8 * 1024;
var pool;

function allocPool() {
  pool = new SlowBuffer(Buffer.poolSize);
  pool.used = 0;
}


// Static methods
Buffer.isBuffer = function isBuffer(b) {
  return b instanceof Buffer || b instanceof SlowBuffer;
};

Buffer.concat = function (list, totalLength) {
  if (!Array.isArray(list)) {
    throw new Error("Usage: Buffer.concat(list, [totalLength])\n \
      list should be an Array.");
  }

  if (list.length === 0) {
    return new Buffer(0);
  } else if (list.length === 1) {
    return list[0];
  }

  if (typeof totalLength !== 'number') {
    totalLength = 0;
    for (var i = 0; i < list.length; i++) {
      var buf = list[i];
      totalLength += buf.length;
    }
  }

  var buffer = new Buffer(totalLength);
  var pos = 0;
  for (var i = 0; i < list.length; i++) {
    var buf = list[i];
    buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer;
};

// Inspect
Buffer.prototype.inspect = function inspect() {
  var out = [],
      len = this.length;

  for (var i = 0; i < len; i++) {
    out[i] = toHex(this.parent[i + this.offset]);
    if (i == exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...';
      break;
    }
  }

  return '<Buffer ' + out.join(' ') + '>';
};


Buffer.prototype.get = function get(i) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this.parent[this.offset + i];
};


Buffer.prototype.set = function set(i, v) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this.parent[this.offset + i] = v;
};


// write(string, offset = 0, length = buffer.length-offset, encoding = 'utf8')
Buffer.prototype.write = function(string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length;
      length = undefined;
    }
  } else {  // legacy
    var swap = encoding;
    encoding = offset;
    offset = length;
    length = swap;
  }

  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase();

  var ret;
  switch (encoding) {
    case 'hex':
      ret = this.parent.hexWrite(string, this.offset + offset, length);
      break;

    case 'utf8':
    case 'utf-8':
      ret = this.parent.utf8Write(string, this.offset + offset, length);
      break;

    case 'ascii':
      ret = this.parent.asciiWrite(string, this.offset + offset, length);
      break;

    case 'binary':
      ret = this.parent.binaryWrite(string, this.offset + offset, length);
      break;

    case 'base64':
      // Warning: maxLength not taken into account in base64Write
      ret = this.parent.base64Write(string, this.offset + offset, length);
      break;

    case 'ucs2':
    case 'ucs-2':
      ret = this.parent.ucs2Write(string, this.offset + offset, length);
      break;

    default:
      throw new Error('Unknown encoding');
  }

  Buffer._charsWritten = SlowBuffer._charsWritten;

  return ret;
};


// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function(encoding, start, end) {
  encoding = String(encoding || 'utf8').toLowerCase();

  if (typeof start == 'undefined' || start < 0) {
    start = 0;
  } else if (start > this.length) {
    start = this.length;
  }

  if (typeof end == 'undefined' || end > this.length) {
    end = this.length;
  } else if (end < 0) {
    end = 0;
  }

  start = start + this.offset;
  end = end + this.offset;

  switch (encoding) {
    case 'hex':
      return this.parent.hexSlice(start, end);

    case 'utf8':
    case 'utf-8':
      return this.parent.utf8Slice(start, end);

    case 'ascii':
      return this.parent.asciiSlice(start, end);

    case 'binary':
      return this.parent.binarySlice(start, end);

    case 'base64':
      return this.parent.base64Slice(start, end);

    case 'ucs2':
    case 'ucs-2':
      return this.parent.ucs2Slice(start, end);

    default:
      throw new Error('Unknown encoding');
  }
};


// byteLength
Buffer.byteLength = SlowBuffer.byteLength;


// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill(value, start, end) {
  value || (value = 0);
  start || (start = 0);
  end || (end = this.length);

  if (typeof value === 'string') {
    value = value.charCodeAt(0);
  }
  if (!(typeof value === 'number') || isNaN(value)) {
    throw new Error('value is not a number');
  }

  if (end < start) throw new Error('end < start');

  // Fill 0 bytes; we're done
  if (end === start) return 0;
  if (this.length == 0) return 0;

  if (start < 0 || start >= this.length) {
    throw new Error('start out of bounds');
  }

  if (end < 0 || end > this.length) {
    throw new Error('end out of bounds');
  }

  return this.parent.fill(value,
                          start + this.offset,
                          end + this.offset);
};


// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function(target, target_start, start, end) {
  var source = this;
  start || (start = 0);
  end || (end = this.length);
  target_start || (target_start = 0);

  if (end < start) throw new Error('sourceEnd < sourceStart');

  // Copy 0 bytes; we're done
  if (end === start) return 0;
  if (target.length == 0 || source.length == 0) return 0;

  if (target_start < 0 || target_start >= target.length) {
    throw new Error('targetStart out of bounds');
  }

  if (start < 0 || start >= source.length) {
    throw new Error('sourceStart out of bounds');
  }

  if (end < 0 || end > source.length) {
    throw new Error('sourceEnd out of bounds');
  }

  // Are we oob?
  if (end > this.length) {
    end = this.length;
  }

  if (target.length - target_start < end - start) {
    end = target.length - target_start + start;
  }

  return this.parent.copy(target.parent,
                          target_start + target.offset,
                          start + this.offset,
                          end + this.offset);
};


// slice(start, end)
Buffer.prototype.slice = function(start, end) {
  if (end === undefined) end = this.length;
  if (end > this.length) throw new Error('oob');
  if (start > end) throw new Error('oob');

  return new Buffer(this.parent, end - start, +start + this.offset);
};


// Legacy methods for backwards compatibility.

Buffer.prototype.utf8Slice = function(start, end) {
  return this.toString('utf8', start, end);
};

Buffer.prototype.binarySlice = function(start, end) {
  return this.toString('binary', start, end);
};

Buffer.prototype.asciiSlice = function(start, end) {
  return this.toString('ascii', start, end);
};

Buffer.prototype.utf8Write = function(string, offset) {
  return this.write(string, offset, 'utf8');
};

Buffer.prototype.binaryWrite = function(string, offset) {
  return this.write(string, offset, 'binary');
};

Buffer.prototype.asciiWrite = function(string, offset) {
  return this.write(string, offset, 'ascii');
};

Buffer.prototype.readUInt8 = function(offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  return buffer.parent[buffer.offset + offset];
};

function readUInt16(buffer, offset, isBigEndian, noAssert) {
  var val = 0;


  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (isBigEndian) {
    val = buffer.parent[buffer.offset + offset] << 8;
    val |= buffer.parent[buffer.offset + offset + 1];
  } else {
    val = buffer.parent[buffer.offset + offset];
    val |= buffer.parent[buffer.offset + offset + 1] << 8;
  }

  return val;
}

Buffer.prototype.readUInt16LE = function(offset, noAssert) {
  return readUInt16(this, offset, false, noAssert);
};

Buffer.prototype.readUInt16BE = function(offset, noAssert) {
  return readUInt16(this, offset, true, noAssert);
};

function readUInt32(buffer, offset, isBigEndian, noAssert) {
  var val = 0;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (isBigEndian) {
    val = buffer.parent[buffer.offset + offset + 1] << 16;
    val |= buffer.parent[buffer.offset + offset + 2] << 8;
    val |= buffer.parent[buffer.offset + offset + 3];
    val = val + (buffer.parent[buffer.offset + offset] << 24 >>> 0);
  } else {
    val = buffer.parent[buffer.offset + offset + 2] << 16;
    val |= buffer.parent[buffer.offset + offset + 1] << 8;
    val |= buffer.parent[buffer.offset + offset];
    val = val + (buffer.parent[buffer.offset + offset + 3] << 24 >>> 0);
  }

  return val;
}

Buffer.prototype.readUInt32LE = function(offset, noAssert) {
  return readUInt32(this, offset, false, noAssert);
};

Buffer.prototype.readUInt32BE = function(offset, noAssert) {
  return readUInt32(this, offset, true, noAssert);
};


/*
 * Signed integer types, yay team! A reminder on how two's complement actually
 * works. The first bit is the signed bit, i.e. tells us whether or not the
 * number should be positive or negative. If the two's complement value is
 * positive, then we're done, as it's equivalent to the unsigned representation.
 *
 * Now if the number is positive, you're pretty much done, you can just leverage
 * the unsigned translations and return those. Unfortunately, negative numbers
 * aren't quite that straightforward.
 *
 * At first glance, one might be inclined to use the traditional formula to
 * translate binary numbers between the positive and negative values in two's
 * complement. (Though it doesn't quite work for the most negative value)
 * Mainly:
 *  - invert all the bits
 *  - add one to the result
 *
 * Of course, this doesn't quite work in Javascript. Take for example the value
 * of -128. This could be represented in 16 bits (big-endian) as 0xff80. But of
 * course, Javascript will do the following:
 *
 * > ~0xff80
 * -65409
 *
 * Whoh there, Javascript, that's not quite right. But wait, according to
 * Javascript that's perfectly correct. When Javascript ends up seeing the
 * constant 0xff80, it has no notion that it is actually a signed number. It
 * assumes that we've input the unsigned value 0xff80. Thus, when it does the
 * binary negation, it casts it into a signed value, (positive 0xff80). Then
 * when you perform binary negation on that, it turns it into a negative number.
 *
 * Instead, we're going to have to use the following general formula, that works
 * in a rather Javascript friendly way. I'm glad we don't support this kind of
 * weird numbering scheme in the kernel.
 *
 * (BIT-MAX - (unsigned)val + 1) * -1
 *
 * The astute observer, may think that this doesn't make sense for 8-bit numbers
 * (really it isn't necessary for them). However, when you get 16-bit numbers,
 * you do. Let's go back to our prior example and see how this will look:
 *
 * (0xffff - 0xff80 + 1) * -1
 * (0x007f + 1) * -1
 * (0x0080) * -1
 */
Buffer.prototype.readInt8 = function(offset, noAssert) {
  var buffer = this;
  var neg;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  neg = buffer.parent[buffer.offset + offset] & 0x80;
  if (!neg) {
    return (buffer.parent[buffer.offset + offset]);
  }

  return ((0xff - buffer.parent[buffer.offset + offset] + 1) * -1);
};

function readInt16(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt16(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x8000;
  if (!neg) {
    return val;
  }

  return (0xffff - val + 1) * -1;
}

Buffer.prototype.readInt16LE = function(offset, noAssert) {
  return readInt16(this, offset, false, noAssert);
};

Buffer.prototype.readInt16BE = function(offset, noAssert) {
  return readInt16(this, offset, true, noAssert);
};

function readInt32(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt32(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x80000000;
  if (!neg) {
    return (val);
  }

  return (0xffffffff - val + 1) * -1;
}

Buffer.prototype.readInt32LE = function(offset, noAssert) {
  return readInt32(this, offset, false, noAssert);
};

Buffer.prototype.readInt32BE = function(offset, noAssert) {
  return readInt32(this, offset, true, noAssert);
};

function readFloat(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return require('./buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,
      23, 4);
}

Buffer.prototype.readFloatLE = function(offset, noAssert) {
  return readFloat(this, offset, false, noAssert);
};

Buffer.prototype.readFloatBE = function(offset, noAssert) {
  return readFloat(this, offset, true, noAssert);
};

function readDouble(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 7 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return require('./buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.readDoubleLE = function(offset, noAssert) {
  return readDouble(this, offset, false, noAssert);
};

Buffer.prototype.readDoubleBE = function(offset, noAssert) {
  return readDouble(this, offset, true, noAssert);
};


/*
 * We have to make sure that the value is a valid integer. This means that it is
 * non-negative. It has no fractional component and that it does not exceed the
 * maximum allowed value.
 *
 *      value           The number to check for validity
 *
 *      max             The maximum value
 */
function verifuint(value, max) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value >= 0,
      'specified a negative value for writing an unsigned value');

  assert.ok(value <= max, 'value is larger than maximum value for type');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

Buffer.prototype.writeUInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xff);
  }

  buffer.parent[buffer.offset + offset] = value;
};

function writeUInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffff);
  }

  if (isBigEndian) {
    buffer.parent[buffer.offset + offset] = (value & 0xff00) >>> 8;
    buffer.parent[buffer.offset + offset + 1] = value & 0x00ff;
  } else {
    buffer.parent[buffer.offset + offset + 1] = (value & 0xff00) >>> 8;
    buffer.parent[buffer.offset + offset] = value & 0x00ff;
  }
}

Buffer.prototype.writeUInt16LE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt16BE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, true, noAssert);
};

function writeUInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffffffff);
  }

  if (isBigEndian) {
    buffer.parent[buffer.offset + offset] = (value >>> 24) & 0xff;
    buffer.parent[buffer.offset + offset + 1] = (value >>> 16) & 0xff;
    buffer.parent[buffer.offset + offset + 2] = (value >>> 8) & 0xff;
    buffer.parent[buffer.offset + offset + 3] = value & 0xff;
  } else {
    buffer.parent[buffer.offset + offset + 3] = (value >>> 24) & 0xff;
    buffer.parent[buffer.offset + offset + 2] = (value >>> 16) & 0xff;
    buffer.parent[buffer.offset + offset + 1] = (value >>> 8) & 0xff;
    buffer.parent[buffer.offset + offset] = value & 0xff;
  }
}

Buffer.prototype.writeUInt32LE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt32BE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, true, noAssert);
};


/*
 * We now move onto our friends in the signed number category. Unlike unsigned
 * numbers, we're going to have to worry a bit more about how we put values into
 * arrays. Since we are only worrying about signed 32-bit values, we're in
 * slightly better shape. Unfortunately, we really can't do our favorite binary
 * & in this system. It really seems to do the wrong thing. For example:
 *
 * > -32 & 0xff
 * 224
 *
 * What's happening above is really: 0xe0 & 0xff = 0xe0. However, the results of
 * this aren't treated as a signed number. Ultimately a bad thing.
 *
 * What we're going to want to do is basically create the unsigned equivalent of
 * our representation and pass that off to the wuint* functions. To do that
 * we're going to do the following:
 *
 *  - if the value is positive
 *      we can pass it directly off to the equivalent wuint
 *  - if the value is negative
 *      we do the following computation:
 *         mb + val + 1, where
 *         mb   is the maximum unsigned value in that byte size
 *         val  is the Javascript negative integer
 *
 *
 * As a concrete value, take -128. In signed 16 bits this would be 0xff80. If
 * you do out the computations:
 *
 * 0xffff - 128 + 1
 * 0xffff - 127
 * 0xff80
 *
 * You can then encode this value as the signed version. This is really rather
 * hacky, but it should work and get the job done which is our goal here.
 */

/*
 * A series of checks to make sure we actually have a signed 32-bit number
 */
function verifsint(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

function verifIEEE754(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');
}

Buffer.prototype.writeInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7f, -0x80);
  }

  if (value >= 0) {
    buffer.writeUInt8(value, offset, noAssert);
  } else {
    buffer.writeUInt8(0xff + value + 1, offset, noAssert);
  }
};

function writeInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fff, -0x8000);
  }

  if (value >= 0) {
    writeUInt16(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt16(buffer, 0xffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt16LE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt16BE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, true, noAssert);
};

function writeInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fffffff, -0x80000000);
  }

  if (value >= 0) {
    writeUInt32(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt32(buffer, 0xffffffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt32LE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt32BE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, true, noAssert);
};

function writeFloat(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38);
  }

  require('./buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,
      23, 4);
}

Buffer.prototype.writeFloatLE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, false, noAssert);
};

Buffer.prototype.writeFloatBE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, true, noAssert);
};

function writeDouble(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 7 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308);
  }

  require('./buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.writeDoubleLE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, false, noAssert);
};

Buffer.prototype.writeDoubleBE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, true, noAssert);
};

SlowBuffer.prototype.readUInt8 = Buffer.prototype.readUInt8;
SlowBuffer.prototype.readUInt16LE = Buffer.prototype.readUInt16LE;
SlowBuffer.prototype.readUInt16BE = Buffer.prototype.readUInt16BE;
SlowBuffer.prototype.readUInt32LE = Buffer.prototype.readUInt32LE;
SlowBuffer.prototype.readUInt32BE = Buffer.prototype.readUInt32BE;
SlowBuffer.prototype.readInt8 = Buffer.prototype.readInt8;
SlowBuffer.prototype.readInt16LE = Buffer.prototype.readInt16LE;
SlowBuffer.prototype.readInt16BE = Buffer.prototype.readInt16BE;
SlowBuffer.prototype.readInt32LE = Buffer.prototype.readInt32LE;
SlowBuffer.prototype.readInt32BE = Buffer.prototype.readInt32BE;
SlowBuffer.prototype.readFloatLE = Buffer.prototype.readFloatLE;
SlowBuffer.prototype.readFloatBE = Buffer.prototype.readFloatBE;
SlowBuffer.prototype.readDoubleLE = Buffer.prototype.readDoubleLE;
SlowBuffer.prototype.readDoubleBE = Buffer.prototype.readDoubleBE;
SlowBuffer.prototype.writeUInt8 = Buffer.prototype.writeUInt8;
SlowBuffer.prototype.writeUInt16LE = Buffer.prototype.writeUInt16LE;
SlowBuffer.prototype.writeUInt16BE = Buffer.prototype.writeUInt16BE;
SlowBuffer.prototype.writeUInt32LE = Buffer.prototype.writeUInt32LE;
SlowBuffer.prototype.writeUInt32BE = Buffer.prototype.writeUInt32BE;
SlowBuffer.prototype.writeInt8 = Buffer.prototype.writeInt8;
SlowBuffer.prototype.writeInt16LE = Buffer.prototype.writeInt16LE;
SlowBuffer.prototype.writeInt16BE = Buffer.prototype.writeInt16BE;
SlowBuffer.prototype.writeInt32LE = Buffer.prototype.writeInt32LE;
SlowBuffer.prototype.writeInt32BE = Buffer.prototype.writeInt32BE;
SlowBuffer.prototype.writeFloatLE = Buffer.prototype.writeFloatLE;
SlowBuffer.prototype.writeFloatBE = Buffer.prototype.writeFloatBE;
SlowBuffer.prototype.writeDoubleLE = Buffer.prototype.writeDoubleLE;
SlowBuffer.prototype.writeDoubleBE = Buffer.prototype.writeDoubleBE;

},{"assert":1,"./buffer_ieee754":8,"base64-js":9}],9:[function(require,module,exports){
(function (exports) {
	'use strict';

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	function b64ToByteArray(b64) {
		var i, j, l, tmp, placeHolders, arr;
	
		if (b64.length % 4 > 0) {
			throw 'Invalid string. Length must be a multiple of 4';
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		placeHolders = b64.indexOf('=');
		placeHolders = placeHolders > 0 ? b64.length - placeHolders : 0;

		// base64 is 4/3 + up to two characters of the original data
		arr = [];//new Uint8Array(b64.length * 3 / 4 - placeHolders);

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length;

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (lookup.indexOf(b64[i]) << 18) | (lookup.indexOf(b64[i + 1]) << 12) | (lookup.indexOf(b64[i + 2]) << 6) | lookup.indexOf(b64[i + 3]);
			arr.push((tmp & 0xFF0000) >> 16);
			arr.push((tmp & 0xFF00) >> 8);
			arr.push(tmp & 0xFF);
		}

		if (placeHolders === 2) {
			tmp = (lookup.indexOf(b64[i]) << 2) | (lookup.indexOf(b64[i + 1]) >> 4);
			arr.push(tmp & 0xFF);
		} else if (placeHolders === 1) {
			tmp = (lookup.indexOf(b64[i]) << 10) | (lookup.indexOf(b64[i + 1]) << 4) | (lookup.indexOf(b64[i + 2]) >> 2);
			arr.push((tmp >> 8) & 0xFF);
			arr.push(tmp & 0xFF);
		}

		return arr;
	}

	function uint8ToBase64(uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length;

		function tripletToBase64 (num) {
			return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
		};

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
			output += tripletToBase64(temp);
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1];
				output += lookup[temp >> 2];
				output += lookup[(temp << 4) & 0x3F];
				output += '==';
				break;
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
				output += lookup[temp >> 10];
				output += lookup[(temp >> 4) & 0x3F];
				output += lookup[(temp << 2) & 0x3F];
				output += '=';
				break;
		}

		return output;
	}

	module.exports.toByteArray = b64ToByteArray;
	module.exports.fromByteArray = uint8ToBase64;
}());

},{}]},{},[])
;;module.exports=require("buffer-browserify")

},{}],2:[function(require,module,exports){
// Compile this file to asm-lint-helper.js using browserify <http://browserify.org/> after `npm install asm.js` <https://github.com/dherman/asm.js/>
asm = require("asm.js"); // When compiled this will be within a function, so we can't use 'var' here

},{"asm.js":3}],3:[function(require,module,exports){
module.exports = {
    validate: require('./validate'),
    ValidationError: require('./fail').ValidationError,
    types: require('./types')
};
},{"./fail":5,"./types":8,"./validate":9}],4:[function(require,module,exports){
var dict = require('dict');

function Env(v) {
    if (!(this instanceof Env))
        return new Env(v);
    this._v = v;
    this._dict = dict();
}

Env.prototype.lookup = function lookup(x) {
    return this._dict.get(x) || null;
};

Env.prototype.bind = function bind(x, t, loc) {
    if (x === 'arguments' || x === 'eval')
        this._v.fail("illegal binding: '" + x + "'", loc);
    if (this._dict.has(x))
        this._v.fail("duplicate binding for " + x, loc);
    this._dict.set(x, t);
};

module.exports = Env;

},{"dict":17}],5:[function(require,module,exports){
var match = require('pattern-match');

function ValidationError(message, stack) {
    Error.call(this, message);
    this.stack = stack;
}

ValidationError.prototype = Object.create(Error.prototype);

function spaces(n) {
    var result = "";
    for (var i = 0; i < n; i++)
        result += " ";
    return result;
}

ValidationError.prototype.context = function() {
    if (!this.src || !this.loc)
        return null;

    var lines = this.src.split(/\r|\n|\r\n/);
    var start = this.loc.start;
    var line = lines[start.line - 1];
    return line + "\n" + spaces(start.column) + "^";
};

ValidationError.prototype.toString = function() {
    return this.context() + "\n\n" + Error.prototype.toString.call(this);
};

function fail(message, src, loc) {
    message = message + locToString(loc);
    // FIXME: V8-specific; make this stack-trace logic more robust
    var stack = (new Error).stack
                           .replace(/[^n]*\n/, "ValidationError: " + message + "\n")
                           .replace(/\n[^\n]*\n/, "\n");
    var e = new ValidationError(message, stack);
    e.src = src;
    e.loc = loc;
    throw e;
}

// (Loc) -> str
function locToString(loc) {
    return match(loc, function(when) {
        when({
            start: { line: match.var('sl'), column: match.var('sc') },
            end: { line: match.var('el'), column: match.var('ec') }
        }, function(vars) {
            return " at " + vars.sl + ":" + vars.sc + "-" + vars.el + ":" + vars.ec;
        });

        when(match.any, function() {
            return "";
        });
    });
}

fail.locToString = locToString;

fail.ValidationError = ValidationError;

module.exports = fail;

},{"pattern-match":19}],6:[function(require,module,exports){
(function(){var ty = require('./types');

function Report(globals, exports) {
    this._globals = globals;
    this._exports = exports;
}

Report.prototype.getFunction = function(f) {
    var global = this._globals.lookup(f);
    if (!global || !(global.type instanceof ty.Arrow))
        return null;
    return global.type;
};

Report.prototype.isSingleExport = function() {
    return this._exports.type === 'single';
};

// ( this.isSingleExport => () -> string)
// (!this.isSingleExport => (string) -> string)
Report.prototype.getExport = function(f) {
    return this._exports.type === 'single'
         ? this._exports.export.name
         : this._exports.exports.lookup(f).name;
};

module.exports = Report;

})()
},{"./types":8}],7:[function(require,module,exports){
var dict = require('dict');
var ty = require('./types');

exports.ROOT_NAMES = ['stdlib', 'foreign', 'heap'];

exports.HEAP_VIEW_TYPES = dict({
    'Int8Array':    ty.View(1, ty.Intish),
    'Uint8Array':   ty.View(1, ty.Intish),
    'Int16Array':   ty.View(2, ty.Intish),
    'Uint16Array':  ty.View(2, ty.Intish),
    'Int32Array':   ty.View(4, ty.Intish),
    'Uint32Array':  ty.View(4, ty.Intish),
    'Float32Array': ty.View(4, ty.Doublish),
    'Float64Array': ty.View(8, ty.Doublish)
});

var DoublishToDouble = ty.Arrow([ty.Doublish], ty.Double);

exports.STDLIB_TYPES = dict({
    'Infinity': ty.Double,
    'NaN':      ty.Double
});

exports.STDLIB_MATH_TYPES = dict({
    'acos':    DoublishToDouble,
    'asin':    DoublishToDouble,
    'atan':    DoublishToDouble,
    'cos':     DoublishToDouble,
    'sin':     DoublishToDouble,
    'tan':     DoublishToDouble,
    'ceil':    DoublishToDouble,
    'floor':   DoublishToDouble,
    'exp':     DoublishToDouble,
    'log':     DoublishToDouble,
    'sqrt':    DoublishToDouble,
    'abs':     ty.Overloaded([
                   ty.Arrow([ty.Signed], ty.Unsigned),
                   DoublishToDouble
               ]),
    'atan2':   ty.Arrow([ty.Doublish, ty.Doublish], ty.Double),
    'pow':     ty.Arrow([ty.Doublish, ty.Doublish], ty.Double),
    'imul':    ty.Arrow([ty.Int, ty.Int], ty.Signed),
    'E':       ty.Double,
    'LN10':    ty.Double,
    'LN2':     ty.Double,
    'LOG2E':   ty.Double,
    'LOG10E':  ty.Double,
    'PI':      ty.Double,
    'SQRT1_2': ty.Double,
    'SQRT2':   ty.Double
});

var SignedBitwise = ty.Arrow([ty.Intish, ty.Intish], ty.Signed);

var RelOp = ty.Overloaded([
    ty.Arrow([ty.Signed, ty.Signed], ty.Int),
    ty.Arrow([ty.Unsigned, ty.Unsigned], ty.Int),
    ty.Arrow([ty.Double, ty.Double], ty.Int)
]);

exports.BINOPS = dict({
    '+':   ty.Arrow([ty.Double, ty.Double], ty.Double),
    '-':   ty.Arrow([ty.Doublish, ty.Doublish], ty.Double),
    '*':   ty.Arrow([ty.Doublish, ty.Doublish], ty.Double),
    '/':   ty.Overloaded([
        ty.Arrow([ty.Signed, ty.Signed], ty.Intish),
        ty.Arrow([ty.Unsigned, ty.Unsigned], ty.Intish),
        ty.Arrow([ty.Doublish, ty.Doublish], ty.Double)
    ]),
    '%':   ty.Overloaded([
        ty.Arrow([ty.Signed, ty.Signed], ty.Intish),
        ty.Arrow([ty.Unsigned, ty.Unsigned], ty.Intish),
        ty.Arrow([ty.Doublish, ty.Doublish], ty.Double)
    ]),
    '|':   SignedBitwise,
    '&':   SignedBitwise,
    '^':   SignedBitwise,
    '<<':  SignedBitwise,
    '>>':  SignedBitwise,
    '>>>': ty.Arrow([ty.Intish, ty.Intish], ty.Unsigned),
    '<':   RelOp,
    '<=':  RelOp,
    '>':   RelOp,
    '>=':  RelOp,
    '==':  RelOp,
    '!=':  RelOp
});

exports.UNOPS = dict({
    '+': ty.Overloaded([
        ty.Arrow([ty.Signed], ty.Double),
        ty.Arrow([ty.Unsigned], ty.Double),
        ty.Arrow([ty.Doublish], ty.Double)
    ]),
    '-': ty.Overloaded([
        ty.Arrow([ty.Int], ty.Intish),
        ty.Arrow([ty.Doublish], ty.Double)
    ]),
    '~': ty.Arrow([ty.Intish], ty.Signed),
    '!': ty.Arrow([ty.Int], ty.Int)
});

},{"./types":8,"dict":17}],8:[function(require,module,exports){
function Type() {}

// =============================================================================
// Value Types
// =============================================================================

function ValueType(name, supertypes) {
    this._name = name;
    this._supertypes = supertypes;
};

ValueType.prototype = Object.create(Type.prototype);

ValueType.prototype.equals = function equals(other) {
    return this === other;
};

ValueType.prototype.subtype = function subtype(other) {
    return this.equals(other) ||
           (this._supertypes && this._supertypes.some(function(sup) {
               return sup.subtype(other);
           }));
};

ValueType.prototype.toString = function toString() {
    return this._name;
}

var Extern = new ValueType("extern", null);

var Intish = new ValueType("intish", null);

var Doublish = new ValueType("doublish", null);

var Unknown = new ValueType("unknown", [Intish, Doublish]);

var Int = new ValueType("int", [Intish]);

var Double = new ValueType("double", [Extern, Doublish]);

var Signed = new ValueType("signed", [Extern, Int]);

var Unsigned = new ValueType("unsigned", [Extern, Int]);

var Fixnum = new ValueType("fixnum", [Signed, Unsigned]);

var Void = new ValueType("void", null);

// =============================================================================
// Global Types
// =============================================================================

// ([ValueType], ValueType) -> Arrow
function Arrow(params, result) {
    if (!(this instanceof Arrow))
        return new Arrow(params, result);
    this.params = params;
    this.result = result;
}

Arrow.prototype = Object.create(Type.prototype);

Arrow.prototype.equals = function equals(other) {
    return other instanceof Arrow &&
           this.params.length === other.params.length &&
           this.params.every(function(p, i) { return p.equals(other.params[i]) }) &&
           this.result.equals(other.result);
};

Arrow.prototype.toString = function toString() {
    return "(" + this.params.join(", ") + ") -> " + this.result;
};

// ([Arrow]) -> Overloaded
function Overloaded(alts) {
    if (!(this instanceof Overloaded))
        return new Overloaded(alts);
    this.alts = alts;
}

Overloaded.prototype = Object.create(Type.prototype);

Overloaded.prototype.toString = function toString() {
    return this.alts.join(" ^ ");
};

// (1|2|4|8, ValueType) -> View
function View(bytes, elementType) {
    if (!(this instanceof View))
        return new View(bytes, elementType);
    this.bytes = bytes;
    this.elementType = elementType;
}

View.prototype.toString = function toString() {
    return "View<" + this.bytes + ", " + this.elementType + ">";
};

// (Arrow, integer) -> Table
function Table(type, length) {
    if (!(this instanceof Table))
        return new Table(type, length);
    this.type = type;
    this.length = length;
}

Table.prototype = Object.create(Type.prototype);

Table.prototype.toString = function toString() {
    return "(" + this.type + ")[" + this.length + "]";
};

var Function = Object.create(Type.prototype);

var Module = Object.create(Type.prototype);

var ModuleParameter = Object.create(Type.prototype);

Function.toString = function() {
    return "Function";
};

exports.ValueType = ValueType;

exports.Extern = Extern;
exports.Intish = Intish;
exports.Doublish = Doublish;
exports.Unknown = Unknown;
exports.Int = Int;
exports.Double = Double;
exports.Signed = Signed;
exports.Unsigned = Unsigned;
exports.Fixnum = Fixnum;
exports.Void = Void;

exports.Arrow = Arrow;
exports.Overloaded = Overloaded;
exports.View = View;
exports.Table = Table;
exports.Function = Function;
exports.Module = Module;
exports.ModuleParameter = ModuleParameter;

},{}],9:[function(require,module,exports){
(function(){var esprima = require('esprima');
var dict = require('dict');
var match = require('pattern-match');
var array = require('array-extended');
var env = require('./env');
var ty = require('./types');
var fail = require('./fail');
var tables = require('./tables');
var Report = require('./report');

// -----------------------------------------------------------------------------
// utilities
// -----------------------------------------------------------------------------

var log = Math.log;

var LOG2 = log(2);

// (number) -> number
function log2(x) {
    return log(x) / LOG2;
}

// (number) -> boolean
function powerOf2(x) {
    return (x & (x - 1)) === 0;
}

// (Statement) -> boolean
function nonEmpty(s) {
    return s.type !== 'EmptyStatement';
}

// ([AST], [{ name: string, type: string }]) -> { string: AST, ... }
function split(nodes, filters) {
    var result = {};
    var nNodes = nodes.length, nFilters = filters.length;
    var iNode = 0;
    for (var iFilter = 0; iFilter < nFilters; iFilter++) {
        var filter = filters[iFilter];
        var next = [];
        while (iNode < nNodes && nodes[iNode].type === filter.type) {
            next.push(nodes[iNode]);
            iNode++;
        }
        result[filter.name] = next;
    }
    return result;
}

// (string) -> boolean
function hasDot(s) {
    return s.indexOf(".") !== -1;
}

// (string) -> boolean
function dotless(s) {
    return !hasDot(s);
}

// (Expression, Expression) -> [Expression]
function flattenAdditive(left, right) {
    var result = [];

    // Since .pop is faster than .shift we'll pop tasks from the end.
    var todo = [right, left];
    while (todo.length > 0) {
        match(todo.pop(), function(when) {
            when({
                type: 'BinaryExpression',
                operator: match.some('+', '-'),
                left: match.var('left'),
                right: match.var('right')
            }, function(vars) {
                todo.push(vars.right, vars.left);
            });

            when(match.var('operand'), function(vars) {
                result.push(vars.operand);
            });
        });
    }

    return result;
}

// -----------------------------------------------------------------------------
// main methods
// -----------------------------------------------------------------------------

function Validator() {
    this._roots = {
        stdlib: null,
        foreign: null,
        heap: null
    };
    this._globals = env(this);
    this._locals = null;
    this._src = null;
    this._result = null;
}

var Vp = Validator.prototype;

// (AST, string[, Function]) -> any
// Delegates to pattern-match library, converting MatchErrors to validation errors.
Vp.match = function(node, desc, body) {
    if (body) {
        try {
            return match(node, body, this);
        } catch (e) {
            if (e instanceof match.MatchError)
                this.fail("invalid " + desc);
            else
                throw e;
        }
    }

    var delayed = match(node);
    var self = this;

    return {
        when: function(pattern, template) {
            try {
                return delayed.when(pattern, template, self);
            } catch (e) {
                if (e instanceof match.MatchError) {
                    var loc = e && e.actual ? e.actual.loc : null;
                    self.fail("invalid " + desc + fail.locToString(loc), loc);
                } else {
                    throw e;
                }
            }
        }
    };
};

// (string) -> Report
Vp.validate = function validate(src) {
    this._src = src;
    var module = esprima.parse("(" + src + ")", { raw: true, loc: true }).body[0].expression;
    var vars = this.match(module, "asm.js module declaration").when({
        type: 'FunctionExpression',
        id: match.var('id', { type: 'Identifier' }),
        params: match.var('params', { length: match.range(0, 4) }),
        body: { loc: match.var('loc'), body: match.var('body') }
    });
    return this.module(vars.params, vars.body.filter(nonEmpty), vars.loc);
};

// (string, Loc) -/->
Vp.fail = function fail_(msg, loc) {
    fail(msg, this._src, loc);
};

// ([Statement], Loc) -> {
//     imports: [VariableDeclaration],
//     functions: [FunctionDeclaration],
//     tables: [VariableDeclaration],
//     exports: Expression
// }
Vp.splitModule = function splitModule(body, loc) {
    var sections = split(body, [
        { name: 'directive', type: 'ExpressionStatement' },
        { name: 'globals', type: 'VariableDeclaration' },
        { name: 'functions', type: 'FunctionDeclaration' },
        { name: 'tables', type: 'VariableDeclaration' },
        { name: 'exports', type: 'ReturnStatement' }
    ]);
    if (sections.directive.length !== 1)
        this.fail("expected single \"use asm\" directive, got " + sections.directive.length + " ExpressionStatement nodes", loc);
    this.match(sections.directive, "\"use asm\" directive").when([{
        type: 'ExpressionStatement',
        expression: { type: 'Literal', value: "use asm" }
    }]);
    if (sections.exports.length !== 1)
        this.fail("expected single exports declaration, got " + sections.exports.length + " ReturnStatement nodes", loc);
    return {
        globals: sections.globals,
        functions: sections.functions,
        tables: sections.tables,
        exports: sections.exports[0].argument
    };
};

// (Identifier, Statement) -> Type
Vp.paramType = function paramType(id, stmt) {
    return this.match(stmt, "parameter annotation").when({
        type: 'ExpressionStatement',
        expression: {
            type: 'AssignmentExpression',
            left: { type: 'Identifier', name: id.name },
            right: match.var('right')
        }
    }, function(vars) {
        return this.match(vars.right, "parameter annotation type", function(when) {
            when({
                type: 'UnaryExpression',
                operator: '+',
                argument: { type: 'Identifier', name: id.name }
            }, function() {
                return ty.Double;
            });

            when({
                type: 'BinaryExpression',
                operator: '|',
                left: { type: 'Identifier', name: id.name },
                right: { type: 'Literal', value: 0 }
            }, function() {
                return ty.Int;
            });
        });
    });
};

// (Statement) -> Type
Vp.returnType = function returnType(stmt) {
    if (stmt.type !== 'ReturnStatement')
        return ty.Void;

    return this.match(stmt.argument, "return type annotation", function(when) {
        when(null, function() {
            return ty.Void;
        });

        when({
            type: 'UnaryExpression',
            operator: '+'
        }, function() {
            return ty.Double;
        });

        when({
            type: 'BinaryExpression',
            operator: '|',
            right: { type: 'Literal', value: 0 }
        }, function() {
            return ty.Signed;
        });

        when({
            type: 'Literal',
            value: match.number,
            raw: hasDot
        }, function() {
            return ty.Double;
        });

        when({
            type: 'Literal',
            value: match.all(match.number,
                             match.range(-0x80000000, 0x100000000)),
            raw: dotless
        }, function() {
            return ty.Signed;
        });
    });
};

// (FunctionDeclaration) -> Type
Vp.functionType = function functionType(funDecl) {
    var params = funDecl.params;
    var n = params.length;
    var body = funDecl.body.body.filter(nonEmpty);
    if (body.length < n)
        this.fail("not enough annotations for parameters to " + funDecl.id.name, funDecl.body.loc);
    var paramTypes = array.zip(params, body.slice(0, n)).map(function(pair) {
        return this.paramType(pair[0], pair[1]);
    }, this);
    var returnType = body.length > 0 ? this.returnType(body[body.length - 1]) : ty.Void;
    return ty.Arrow(paramTypes, returnType);
};

// (string, Loc) -> Type
Vp.lookup = function lookup(x, loc) {
    if (this._locals) {
        var t = this._locals.lookup(x);
        if (t)
            return t;
    }

    var mt = this._globals.lookup(x);
    if (!mt)
        this.fail("unbound variable " + x, loc);

    return mt.type;
};

// (string, Loc) -> ValueType
Vp.lookupValueType = function lookupValueType(x, loc) {
    var t = this.lookup(x, loc);
    if (!(t instanceof ty.ValueType))
        this.fail("expected value type, got " + t, loc);
    return t;
};

// (string, Expression, Loc) -> { mutable: boolean, type: Type }
Vp.global = function global(x, rhs, loc) {
    if (!rhs)
        this.fail("global variable missing initializer expression", loc);

    return this.match(rhs, "global declaration", function(when) {
        when({
            type: 'Literal',
            value: match.var('f', match.number),
            raw: match.var('src', hasDot)
        }, function(vars) {
            return { mutable: true, type: ty.Double };
        }, this);

        when({
            type: 'Literal',
            value: match.var('n', match.all(match.integer,
                                            match.range(-0x80000000, 0x100000000))),
            raw: match.var('src')
        }, function(vars) {
            return { mutable: true, type: ty.Int };
        }, this);

        when({
            type: 'MemberExpression',
            object: {
                type: 'MemberExpression',
                object: {
                    type: 'Identifier',
                    name: this._roots.stdlib
                },
                property: {
                    type: 'Identifier',
                    name: 'Math'
                }
            },
            property: {
                type: 'Identifier',
                name: match.var('x')
            }
        }, function(vars) {
            if (!tables.STDLIB_MATH_TYPES.has(vars.x))
                this.fail("unknown library: Math." + vars.x, init.loc);
            return { mutable: false, type: tables.STDLIB_MATH_TYPES.get(vars.x) };
        }, this);

        when({
            type: 'MemberExpression',
            object: {
                type: 'Identifier',
                name: this._roots.stdlib
            },
            property: match.var('x')
        }, function(vars) {
            if (!tables.STDLIB_TYPES.has(vars.x))
                this.fail("unknown library: " + vars.x, init.loc);
            return { mutable: false, type: tables.STDLIB_TYPES.get(vars.x) };
        }, this);

        when({
            type: 'MemberExpression',
            object: {
                type: 'Identifier',
                name: this._roots.foreign
            },
            property: match.var('x')
        }, function(vars) {
            return { mutable: false, type: ty.Function };
        }, this);

        when({
            type: 'BinaryExpression',
            operator: '|',
            left: {
                type: 'MemberExpression',
                object: {
                    type: 'Identifier',
                    name: this._roots.foreign
                },
                property: match.var('x')
            },
            right: {
                type: 'Literal',
                value: 0
            }
        }, function(vars) {
            return { mutable: false, type: ty.Int };
        }, this);

        when({
            type: 'UnaryExpression',
            operator: '+',
            argument: {
                type: 'MemberExpression',
                object: {
                    type: 'Identifier',
                    name: this._roots.foreign
                },
                property: match.var('x')
            }
        }, function(vars) {
            return { mutable: false, type: ty.Double };
        }, this);

        when({
            type: 'NewExpression',
            callee: {
                type: 'MemberExpression',
                object: {
                    type: 'Identifier',
                    name: this._roots.stdlib
                },
                property: {
                    type: 'Identifier',
                    name: match.var('view'),
                    loc: match.var('loc')
                }
            },
            arguments: match.var('args', [{ type: 'Identifier', name: this._roots.heap }])
        }, function(vars) {
            if (vars.args.length !== 1)
                this.fail("heap view constructor expects 1 argument, got " + vars.args.length, vars.args[1].loc);
            if (!tables.HEAP_VIEW_TYPES.has(vars.view))
                this.fail("unknown typed array type: " + vars.view, vars.loc);
            return { mutable: false, type: tables.HEAP_VIEW_TYPES.get(vars.view) };
        }, this);
    }, this);
};

// (string, Expression, Loc) -> Table
Vp.table = function table(x, rhs, loc) {
    this.match(rhs, "function table").when({
        type: 'ArrayExpression',
        elements: match.var('elements')
    }, function(vars) {
        var fs = elements.map(function(element) {
            return this.match(element, "function table entry").when(match.var('f', { type: 'Identifier' }),
                                                                    function(vars) { return vars.f; },
                                                                    this);
        }, this);

        if (fs.length === 0)
            this.fail("empty function table", loc);
        if (!powerOf2(fs.length))
            this.fail("function table length must be a power of 2, got " + fs.length, loc);

        var fts = fs.map(function(f) {
            var ft = this.lookup(f.name, f.loc);
            if (!(ft instanceof ty.Arrow))
                this.fail("non-function " + f.name + " in function table", f.loc);
            return ft;
        }, this);

        var ft = fts[0];

        for (var i = 1, n = fts.length; i < n; i++) {
            if (!ft.equals(fts[i]))
                this.fail("unexpected function type " + fs[i].name + " : " + fts[i] + " in function table", fs[i].loc);
        }

        return new ty.Table(ft, fs.length);
    });
};

// (string, Expression) -> Type
Vp.local = function local(x, rhs) {
    return this.match(rhs, "declaration of local " + x, function(when) {
        when({
            type: 'Literal',
            value: match.number,
            raw: hasDot
        }, function(vars) {
            return ty.Double;
        }, this);

        when({
            type: 'Literal',
            value: match.all(match.integer, match.range(-0x80000000, 0x100000000))
        }, function(vars) {
            return ty.Int;
        }, this);
    });
};

// (FunctionDeclaration) -> void
Vp.function = function function_(decl) {
    var f = decl.id.name;
    var ft = this._globals.lookup(f).type;
    var params = decl.params.map(function(id) { return id.name; });
    var paramTypes = ft.params;
    var resultType = ft.result;
    var body = decl.body.body.filter(nonEmpty);

    try {
        this._locals = env(this);
        this._result = resultType;

        // Bind the parameters.
        params.forEach(function(x, i) {
            this._locals.bind(x, paramTypes[i]);
        }, this);

        // Bind the locals.
        var i = params.length, n = body.length;
        while (i < n && body[i].type === 'VariableDeclaration') {
            body[i].declarations.forEach(function(dtor) {
                var x = dtor.id.name;
                this._locals.bind(x, this.local(x, dtor.init));
            }, this);
            i++;
        }

        // Check the body.
        this.statements(body.slice(i));
    } finally {
        this._locals = null;
        this._result = null;
    }
};

// (Expression) -> { type: 'single', export: { name: string, type: Arrow } }
//               | { type: 'multiple', exports: dict<{ name: string, type: Arrow }> }
Vp.exports = function exports(expr) {
    return this.match(expr, "exports declaration", function(when) {
        when({
            type: 'Identifier',
            name: match.var('f'),
            loc: match.var('loc')
        }, function(vars) {
            var t = this.lookup(vars.f, vars.loc);
            if (!(t instanceof ty.Arrow))
                this.fail("expected exported function, got definition of type " + t, vars.loc);
            return { type: 'single', export: { name: vars.f, type: t } };
        }, this);

        when({
            type: 'ObjectExpression',
            properties: match.var('props')
        }, function(vars) {
            var table = dict();

            var self = this;

            function add(internal, external, loc) {
                var t = self.lookup(internal, loc);
                if (!(t instanceof ty.Arrow))
                    self.fail("expected exported function, got definition of type " + t, loc);
                table.set(external, {
                    name: internal,
                    type: t
                });
            }

            vars.props.forEach(function(prop) {
                return this.match(prop, "export declaration", function(when) {
                    when({
                        key: {
                            type: 'Literal',
                            value: match.var('external', match.string)
                        },
                        value: {
                            type: 'Identifier',
                            name: match.var('internal'),
                            loc: match.var('loc')
                        },
                        kind: 'init'
                    }, function(vars) {
                        add(vars.internal, vars.external, vars.loc);
                    }, this);

                    when({
                        key: {
                            type: 'Identifier',
                            name: match.var('external')
                        },
                        value: {
                            type: 'Identifier',
                            name: match.var('internal'),
                            loc: match.var('loc')
                        },
                        kind: 'init'
                    }, function(vars) {
                        add(vars.internal, vars.external, vars.loc);
                    }, this);
                });
            }, this);

            return { type: 'multiple', exports: table };
        }, this);
    });
};

// ([Identifier], [Statement], Loc) -> Report
Vp.module = function module(params, body, loc) {
    var sections = this.splitModule(body, loc);

    // Bind module parameters.
    params.forEach(function(id, i) {
        this._roots[tables.ROOT_NAMES[i]] = id.name;
        this._globals.bind(id.name, { mutable: false, type: ty.ModuleParameter }, id.loc);
    }, this);

    // Bind and check globals.
    sections.globals.forEach(function(varDecl) {
        varDecl.declarations.forEach(function(decl) {
            var x = decl.id.name;
            var mt = this.global(x, decl.init, decl.loc);
            this._globals.bind(x, mt, decl.id.loc);
        }, this);
    }, this);

    // Bind function types.
    sections.functions.forEach(function(funDecl) {
        var id = funDecl.id, f = id.name;
        var t = this.functionType(funDecl);
        this._globals.bind(f, { mutable: false, type: t }, id.loc);
    }, this);

    // Bind and check function tables.
    sections.tables.forEach(function(varDecl) {
        varDecl.declarations.forEach(function(decl) {
            var x = decl.id.name;
            var t = this.table(x, decl.init, decl.loc);
            this._globals.bind(x, { mutable: false, type: t }, decl.id.loc);
        }, this);
    }, this);

    // Check functions.
    sections.functions.forEach(this.function, this);

    // Check exports.
    var exports = this.exports(sections.exports);

    return new Report(this._globals, exports);
};

// -----------------------------------------------------------------------------
// statements
// -----------------------------------------------------------------------------

// ([Statement]) -> void
Vp.statements = function statements(ss) {
    ss.forEach(this.statement, this);
};

// (Statement) -> void
Vp.statement = function statement(s) {
    switch (s.type) {
      case 'BlockStatement':
        return this.statements(s.body);

      case 'ExpressionStatement':
        return (s.expression.type === 'CallExpression')
             ? this.call(s.expression, ty.Void)
             : this.expression(s.expression);

      case 'IfStatement':
        return this.ifStatement(s.test, s.consequent, s.alternate);

      case 'ReturnStatement':
        return this.returnStatement(s.argument, s.loc);

      case 'WhileStatement':
        return this.whileStatement(s.test, s.body);

      case 'DoWhileStatement':
        return this.doWhileStatement(s.body, s.test);

      case 'ForStatement':
        return this.forStatement(s.init, s.test, s.update, s.body, s.loc);

      case 'BreakStatement':
      case 'ContinueStatement':
        return;

      case 'LabeledStatement':
        return this.statement(s.body);

      case 'SwitchStatement':
        return this.switchStatement(s.discriminant, s.cases);

      default:
        this.fail("illegal " + s.type + " node", s.loc);
    }
};

// (Type, Type, string, Loc) -> void
Vp.checkSubtype = function checkSubtype(actual, expected, msg, loc) {
    if (!(actual instanceof ty.ValueType) || !actual.subtype(expected))
        this.fail("expected " + expected + " in " + msg + ", got " + actual, loc);
};

Vp.checkSameType = function checkSameType(actual, expected, msg, loc) {
    if (!(actual instanceof ty.ValueType) || !actual.equals(expected))
        this.fail("expected " + expected + " in " + msg + ", got " + actual, loc);
};

// ([Type], Type, string, [Loc], Loc) -> Type
Vp.checkArguments = function checkArguments(ts, expected, msg, locs, loc) {
    if (expected instanceof ty.Arrow) {
        ts.forEach(function(t, i) {
            this.checkSubtype(t, expected.params[i], "argument", locs[i]);
        }, this);
        return expected.result;
    } else if (expected instanceof ty.Overloaded) {
        var t;
        expected.alts.some(function(alt) {
            var ss = alt.params;
            if (ss.length === ts.length && ss.every(function(s, i) { return ts[i].subtype(s) })) {
                t = alt.result;
                return true;
            }
        }, this);
        if (!t)
            this.fail(msg + ": argument types do not match any overloading", loc);
        return t;
    } else {
        this.fail("expected function type, got " + expected, loc);
    }
};

// (Expression, Statement, Statement | null) -> void
Vp.ifStatement = function ifStatement(test, cons, alt) {
    this.checkSubtype(this.expression(test), types.boolish, "if test", test.loc);
    this.statement(cons);
    if (alt)
        this.statement(alt);
};

// (Expression | null, Loc) -> void
Vp.returnStatement = function returnStatement(arg, loc) {
    this.checkSubtype(this.optExpression(arg) || ty.Void, this._result, "return argument", loc);
};

// (Expression, Statement) -> void
Vp.whileStatement = function whileStatement(test, body, labels) {
    this.checkSubtype(this.expression(test), ty.Int, "while loop condition", test.loc);
    this.statement(body);
};

// (Statement, Expression) -> void
Vp.doWhileStatement = function doWhileStatement(body, test) {
    this.statement(body);
    this.checkSubtype(this.expression(test), ty.Int, "do-while loop condition", test.loc);
};

// (VariableDeclaration | Expression | null, Expression | null, Expression | null, Statement, Loc) -> void
Vp.forStatement = function forStatement(init, test, update, body, loc) {
    if (init.type === 'VariableDeclaration')
        this.fail("illegal variable declaration in for-head", init.loc);
    this.optExpression(init);
    this.checkSubtype(this.optExpression(test) || ty.Int, ty.Int, "for loop condition", loc);
    this.optExpression(update);
    this.statement(body);
};

// (Expression, [SwitchCase], labels) -> void
Vp.switchStatement = function switchStatement(disc, cases) {
    var s = this.expression(disc);
    cases.forEach(function(c) {
        this.case(c, s);
    }, this);
};

// (SwitchCase, Type) -> void
Vp.case = function case_(c, s) {
    if (c.test)
        this.checkSubtype(this.literal(c.test), s, "case clause expression", c.test.loc);
    this.statements(c.consequent);
};

// -----------------------------------------------------------------------------
// expressions
// -----------------------------------------------------------------------------

// (Expression | null) -> ValueType | null
Vp.optExpression = function optExpression(expr) {
    return expr ? this.expression(expr) : null;
};

// (Expression) -> ValueType
Vp.expression = function expression(e) {
    return this.match(e, "expression", function(when) {
        when({ type: 'Literal', raw: hasDot }, function() {
            return ty.Double;
        });

        when({ type: 'Literal', value: match.range(-0x80000000, 0xffffffff) }, function() {
            return ty.Fixnum;
        });

        when({ type: 'Identifier' }, function() {
            return this.lookupValueType(e.name, e.loc);
        }, this);

        when({
            type: 'AssignmentExpression',
            left: match.var('left', { type: match.some('Identifier', 'MemberExpression') }),
            right: match.var('right')
        }, function(vars) {
            var s = this.expression(vars.left);
            var t = this.expression(vars.right);
            this.checkSubtype(t, s, "assignment", e.loc);
            return t;
        }, this);

        when({
            type: 'MemberExpression',
            object: { type: 'Identifier', name: match.var('x'), loc: match.var('loc') },
            property: { type: 'Literal', value: match.range(0, 0x100000000), raw: dotless }
        }, function(vars) {
            var t = this.lookup(vars.x, vars.loc);
            if (!(t instanceof ty.View))
                this.fail("expected view type, got " + t);
            return t.elementType;
        }, this);

        when({
            type: 'MemberExpression',
            object: { type: 'Identifier', name: match.var('x'), loc: match.var('loc') },
            property: {
                type: 'BinaryExpression',
                operator: '>>',
                left: match.var('e'),
                right: match.var('n', {
                    type: 'Literal',
                    value: match.var('shift', match.number),
                    raw: dotless
                })
            },
            computed: true
        }, function(vars) {
            var t = this.lookup(vars.x, vars.loc);
            if (!(t instanceof ty.View))
                this.fail("expected view type, got " + t, vars.loc);
            this.checkSubtype(this.expression(vars.e), ty.Intish, "heap address" , vars.e.loc);
            var expectedShift = log2(t.bytes);
            if (vars.shift !== expectedShift)
                this.fail("expected shift of " + expectedShift + " bits for view type " + t + ", got " + vars.shift, vars.n.loc);
            return t.elementType;
        }, this);

        when({
            type: 'MemberExpression',
            object: { type: 'Identifier', name: match.var('x'), loc: match.var('loc') },
            property: match.var('e'),
            computed: true
        }, function(vars) {
            var t = this.lookup(vars.x, vars.loc);
            if (!(t instanceof ty.View))
                this.fail("expected view type, got " + t, vars.loc);
            if (t.bytes !== 1)
                this.fail("expected view type with element size 1, got " + t, vars.loc);
            if (t.elementType !== ty.Intish)
                this.fail("expected view type with intish elements, got " + t, vars.loc);
            this.checkSubtype(this.expression(vars.e), ty.Int, "heap address", vars.e.loc);
            return t.Intish;
        }, this);

        when({
            type: 'ConditionalExpression',
            test: match.var('test'),
            consequent: match.var('cons'),
            alternate: match.var('alt')
        }, function(vars) {
            this.checkSubtype(this.expression(vars.test), ty.Int, "conditional test", vars.test.loc);
            var t1 = this.expression(vars.cons);
            var t2 = this.expression(vars.alt);
            if (t1 !== t2)
                this.fail("type mismatch between conditional branches", e.loc);
            if (t1 !== ty.Int && t1 !== ty.Double)
                this.fail("expected int or double in conditional branch, got " + t1, vars.cons.loc);
            return t1;
        }, this);

        when({
            type: 'SequenceExpression',
            expressions: match.var('es')
        }, function(vars) {
            var last = vars.es.pop();
            vars.es.forEach(function(e) {
                if (e.type === 'CallExpression')
                    this.call(e, ty.Void);
                else
                    this.expression(e);
            }, this);
            return this.expression(last);
        }, this);

        when({
            type: 'UnaryExpression',
            operator: '~',
            argument: {
                type: 'UnaryExpression',
                operator: '~',
                argument: match.var('e')
            }
        }, function(vars) {
            this.checkSubtype(this.expression(vars.e), ty.Double, "double->signed coercion", e.loc);
            return ty.Signed;
        }, this);

        when({
            type: 'UnaryExpression',
            operator: '+',
            argument: match.var('e', { type: 'CallExpression' })
        }, function(vars) {
            this.call(vars.e, ty.Double);
            return ty.Double;
        }, this);

        when({
            type: 'UnaryExpression',
            operator: match.var('op'),
            argument: match.var('arg')
        }, function(vars) {
            var t = tables.UNOPS.get(vars.op);
            if (!t)
                this.fail("unknown unary operator " + vars.op, e.loc);
            return this.checkArguments([this.expression(vars.arg)], t, "unary expression", [vars.op.loc], e.loc);
        }, this);

        when({
            type: 'BinaryExpression',
            operator: '|',
            left: match.var('e', { type: 'CallExpression' }),
            right: { type: 'Literal', value: 0, raw: dotless }
        }, function(vars) {
            this.call(vars.e, ty.Signed);
            return ty.Signed;
        }, this);

        when({
            type: 'BinaryExpression',
            operator: match.some('+', '-'),
            left: match.var('left'),
            right: match.var('right')
        }, function(vars) {
            var operands = flattenAdditive(vars.left, vars.right);
            var n = operands.length;
            var t = this.expression(operands[0]);
            if (t.subtype(ty.Double)) {
                for (var i = 1; i < n; i++) {
                    var operand = operands[i];
                    this.checkSubtype(this.expression(operand), ty.Double, "additive operand", operand.loc);
                }
                return ty.Double;
            } else if (t.subtype(ty.Int)) {
                if (n > 0x100000)
                    this.fail("too many additive operations without coercion: " + n + " > maximum 2^20", e.loc);
                for (var i = 1; i < n; i++) {
                    var operand = operands[i];
                    this.checkSubtype(this.expression(operand), ty.Int, "additive operand", operand.loc);
                }
                return ty.Intish;
            }
            this.fail("expected type int or double, got " + t, operands[0].loc);
        }, this);

        when({
            type: 'BinaryExpression',
            operator: match.var('op'),
            left: match.var('left'),
            right: match.var('right')
        }, function(vars) {
            var t = tables.BINOPS.get(vars.op);
            if (!t)
                this.fail("unknown binary operator " + vars.op, e.loc);
            return this.checkArguments([this.expression(vars.left), this.expression(vars.right)],
                                       t, "operator " + vars.op,
                                       [vars.left.loc, vars.right.loc],
                                       e.loc);
        }, this);
    });
};

// -----------------------------------------------------------------------------
// call expressions
// -----------------------------------------------------------------------------

// (CallExpression, ValueType) -> void
Vp.call = function call(e, t) {
    return this.match(e, "function call", function(when) {
        when({
            type: 'CallExpression',
            callee: { type: 'Identifier', name: match.var('f'), loc: match.var('loc') },
            arguments: match.var('args')
        }, function(vars) {
            var formalReturnType = this.checkArguments(vars.args.map(this.expression, this),
                                                       this.lookup(vars.f, vars.loc),
                                                       "function call",
                                                       vars.args.map(function(arg) { return arg.loc; }),
                                                       e.loc);
            this.checkSameType(formalReturnType, t, "function call", e.loc);
        }, this);

        when({
            type: 'CallExpression',
            callee: {
                type: 'MemberExpression',
                object: { type: 'Identifier', name: match.var('f'), loc: match.var('loc') },
                property: {
                    type: 'BinaryExpression',
                    operator: '&',
                    left: match.var('index'),
                    right: {
                        type: 'Literal',
                        value: match.var('n', match.number),
                        raw: dotless,
                        loc: match.var('nloc')
                    }
                },
                computed: true
            },
            arguments: match.var('args')
        }, function(vars) {
            var t = this.lookup(vars.f, vars.loc);
            if (!(t instanceof ty.Table))
                this.fail("expected function table, got " + vars.f, vars.loc);
            this.checkSubtype(this.expression(vars.index), ty.Intish, "function pointer", vars.index.loc);
            if (t.length !== vars.n + 1)
                this.fail("function table mask should be " + (t.length - 1) + ", got " + vars.n, vars.nloc);
            var formalReturnType = this.checkArguments(vars.args.map(this.expression, this),
                                                       t.type, "function pointer call",
                                                       vars.args.map(function(arg) { return arg.loc; }),
                                                       e.loc);
            this.checkSameType(formalReturnType, t, "function call", e.loc);
        }, this);
    });
};

// -----------------------------------------------------------------------------
// front end
// -----------------------------------------------------------------------------

// (string) -> Report
module.exports = function validate(src) {
    return (new Validator).validate(src);
};

})()
},{"./env":4,"./fail":5,"./report":6,"./tables":7,"./types":8,"array-extended":10,"dict":17,"esprima":18,"pattern-match":19}],10:[function(require,module,exports){
(function () {
    "use strict";

    var arraySlice = Array.prototype.slice;

    function argsToArray(args, slice) {
        slice = slice || 0;
        return arraySlice.call(args, slice);
    }

    function defineArray(extended, is) {

        var isString = is.isString,
            isArray = Array.isArray || is.isArray,
            isDate = is.isDate,
            floor = Math.floor,
            abs = Math.abs,
            mathMax = Math.max,
            mathMin = Math.min,
            arrayProto = Array.prototype,
            arrayIndexOf = arrayProto.indexOf,
            arrayForEach = arrayProto.forEach,
            arrayMap = arrayProto.map,
            arrayReduce = arrayProto.reduce,
            arrayReduceRight = arrayProto.reduceRight,
            arrayFilter = arrayProto.filter,
            arrayEvery = arrayProto.every,
            arraySome = arrayProto.some;


        function cross(num, cros) {
            return reduceRight(cros, function (a, b) {
                if (!isArray(b)) {
                    b = [b];
                }
                b.unshift(num);
                a.unshift(b);
                return a;
            }, []);
        }

        function permute(num, cross, length) {
            var ret = [];
            for (var i = 0; i < cross.length; i++) {
                ret.push([num].concat(rotate(cross, i)).slice(0, length));
            }
            return ret;
        }


        function intersection(a, b) {
            var ret = [], aOne;
            if (a && b && a.length && b.length) {
                for (var i = 0, l = a.length; i < l; i++) {
                    aOne = a[i];
                    if (indexOf(b, aOne) !== -1) {
                        ret.push(aOne);
                    }
                }
            }
            return ret;
        }


        var _sort = (function () {

            var isAll = function (arr, test) {
                return every(arr, test);
            };

            var defaultCmp = function (a, b) {
                return a - b;
            };

            var dateSort = function (a, b) {
                return a.getTime() - b.getTime();
            };

            return function _sort(arr, property) {
                var ret = [];
                if (isArray(arr)) {
                    ret = arr.slice();
                    if (property) {
                        if (typeof property === "function") {
                            ret.sort(property);
                        } else {
                            ret.sort(function (a, b) {
                                var aProp = a[property], bProp = b[property];
                                if (isString(aProp) && isString(bProp)) {
                                    return aProp > bProp ? 1 : aProp < bProp ? -1 : 0;
                                } else if (isDate(aProp) && isDate(bProp)) {
                                    return aProp.getTime() - bProp.getTime();
                                } else {
                                    return aProp - bProp;
                                }
                            });
                        }
                    } else {
                        if (isAll(ret, isString)) {
                            ret.sort();
                        } else if (isAll(ret, isDate)) {
                            ret.sort(dateSort);
                        } else {
                            ret.sort(defaultCmp);
                        }
                    }
                }
                return ret;
            };

        })();

        function indexOf(arr, searchElement, from) {
            if (arr && arrayIndexOf && arrayIndexOf === arr.indexOf) {
                return arr.indexOf(searchElement, from);
            }
            if (!isArray(arr)) {
                throw new TypeError();
            }
            var t = Object(arr);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = 0;
            if (arguments.length > 2) {
                n = Number(arguments[2]);
                if (n !== n) { // shortcut for verifying if it's NaN
                    n = 0;
                } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
                    n = (n > 0 || -1) * floor(abs(n));
                }
            }
            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : mathMax(len - abs(n), 0);
            for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        }

        function lastIndexOf(arr, searchElement, from) {
            if (!isArray(arr)) {
                throw new TypeError();
            }

            var t = Object(arr);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }

            var n = len;
            if (arguments.length > 2) {
                n = Number(arguments[2]);
                if (n !== n) {
                    n = 0;
                } else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0)) {
                    n = (n > 0 || -1) * floor(abs(n));
                }
            }

            var k = n >= 0 ? mathMin(n, len - 1) : len - abs(n);

            for (; k >= 0; k--) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        }

        function filter(arr, iterator, scope) {
            if (arr && arrayFilter && arrayFilter === arr.filter) {
                return arr.filter(iterator, scope);
            }
            if (!isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }

            var t = Object(arr);
            var len = t.length >>> 0;
            var res = [];
            for (var i = 0; i < len; i++) {
                if (i in t) {
                    var val = t[i]; // in case fun mutates this
                    if (iterator.call(scope, val, i, t)) {
                        res.push(val);
                    }
                }
            }
            return res;
        }

        function forEach(arr, iterator, scope) {
            if (!isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }
            if (arr && arrayForEach && arrayForEach === arr.forEach) {
                arr.forEach(iterator, scope);
                return arr;
            }
            for (var i = 0, len = arr.length; i < len; ++i) {
                iterator.call(scope || arr, arr[i], i, arr);
            }

            return arr;
        }

        function every(arr, iterator, scope) {
            if (arr && arrayEvery && arrayEvery === arr.every) {
                return arr.every(iterator, scope);
            }
            if (!isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }
            var t = Object(arr);
            var len = t.length >>> 0;
            for (var i = 0; i < len; i++) {
                if (i in t && !iterator.call(scope, t[i], i, t)) {
                    return false;
                }
            }
            return true;
        }

        function some(arr, iterator, scope) {
            if (arr && arraySome && arraySome === arr.some) {
                return arr.some(iterator, scope);
            }
            if (!isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }
            var t = Object(arr);
            var len = t.length >>> 0;
            for (var i = 0; i < len; i++) {
                if (i in t && iterator.call(scope, t[i], i, t)) {
                    return true;
                }
            }
            return false;
        }

        function map(arr, iterator, scope) {
            if (arr && arrayMap && arrayMap === arr.map) {
                return arr.map(iterator, scope);
            }
            if (!isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }

            var t = Object(arr);
            var len = t.length >>> 0;
            var res = [];
            for (var i = 0; i < len; i++) {
                if (i in t) {
                    res.push(iterator.call(scope, t[i], i, t));
                }
            }
            return res;
        }

        function reduce(arr, accumulator, curr) {
            var initial = arguments.length > 2;
            if (arr && arrayReduce && arrayReduce === arr.reduce) {
                return initial ? arr.reduce(accumulator, curr) : arr.reduce(accumulator);
            }
            if (!isArray(arr) || typeof accumulator !== "function") {
                throw new TypeError();
            }
            var i = 0, l = arr.length >> 0;
            if (arguments.length < 3) {
                if (l === 0) {
                    throw new TypeError("Array length is 0 and no second argument");
                }
                curr = arr[0];
                i = 1; // start accumulating at the second element
            } else {
                curr = arguments[2];
            }
            while (i < l) {
                if (i in arr) {
                    curr = accumulator.call(undefined, curr, arr[i], i, arr);
                }
                ++i;
            }
            return curr;
        }

        function reduceRight(arr, accumulator, curr) {
            var initial = arguments.length > 2;
            if (arr && arrayReduceRight && arrayReduceRight === arr.reduceRight) {
                return initial ? arr.reduceRight(accumulator, curr) : arr.reduceRight(accumulator);
            }
            if (!isArray(arr) || typeof accumulator !== "function") {
                throw new TypeError();
            }

            var t = Object(arr);
            var len = t.length >>> 0;

            // no value to return if no initial value, empty array
            if (len === 0 && arguments.length === 2) {
                throw new TypeError();
            }

            var k = len - 1;
            if (arguments.length >= 3) {
                curr = arguments[2];
            } else {
                do {
                    if (k in arr) {
                        curr = arr[k--];
                        break;
                    }
                }
                while (true);
            }
            while (k >= 0) {
                if (k in t) {
                    curr = accumulator.call(undefined, curr, t[k], k, t);
                }
                k--;
            }
            return curr;
        }


        function toArray(o) {
            var ret = [];
            if (o !== null) {
                var args = argsToArray(arguments);
                if (args.length === 1) {
                    if (isArray(o)) {
                        ret = o;
                    } else if (is.isHash(o)) {
                        for (var i in o) {
                            if (o.hasOwnProperty(i)) {
                                ret.push([i, o[i]]);
                            }
                        }
                    } else {
                        ret.push(o);
                    }
                } else {
                    forEach(args, function (a) {
                        ret = ret.concat(toArray(a));
                    });
                }
            }
            return ret;
        }

        function sum(array) {
            array = array || [];
            if (array.length) {
                return reduce(array, function (a, b) {
                    return a + b;
                });
            } else {
                return 0;
            }
        }

        function avg(arr) {
            arr = arr || [];
            if (arr.length) {
                var total = sum(arr);
                if (is.isNumber(total)) {
                    return  total / arr.length;
                } else {
                    throw new Error("Cannot average an array of non numbers.");
                }
            } else {
                return 0;
            }
        }

        function sort(arr, cmp) {
            return _sort(arr, cmp);
        }

        function min(arr, cmp) {
            return _sort(arr, cmp)[0];
        }

        function max(arr, cmp) {
            return _sort(arr, cmp)[arr.length - 1];
        }

        function difference(arr1) {
            var ret = arr1, args = flatten(argsToArray(arguments, 1));
            if (isArray(arr1)) {
                ret = filter(arr1, function (a) {
                    return indexOf(args, a) === -1;
                });
            }
            return ret;
        }

        function removeDuplicates(arr) {
            var ret = [];
            if (isArray(arr)) {
                for (var i = 0, l = arr.length; i < l; i++) {
                    var item = arr[i];
                    if (indexOf(ret, item) === -1) {
                        ret.push(item);
                    }
                }
            }
            return ret;
        }


        function unique(arr) {
            return removeDuplicates(arr);
        }


        function rotate(arr, numberOfTimes) {
            var ret = arr.slice();
            if (typeof numberOfTimes !== "number") {
                numberOfTimes = 1;
            }
            if (numberOfTimes && isArray(arr)) {
                if (numberOfTimes > 0) {
                    ret.push(ret.shift());
                    numberOfTimes--;
                } else {
                    ret.unshift(ret.pop());
                    numberOfTimes++;
                }
                return rotate(ret, numberOfTimes);
            } else {
                return ret;
            }
        }

        function permutations(arr, length) {
            var ret = [];
            if (isArray(arr)) {
                var copy = arr.slice(0);
                if (typeof length !== "number") {
                    length = arr.length;
                }
                if (!length) {
                    ret = [
                        []
                    ];
                } else if (length <= arr.length) {
                    ret = reduce(arr, function (a, b, i) {
                        var ret;
                        if (length > 1) {
                            ret = permute(b, rotate(copy, i).slice(1), length);
                        } else {
                            ret = [
                                [b]
                            ];
                        }
                        return a.concat(ret);
                    }, []);
                }
            }
            return ret;
        }

        function zip() {
            var ret = [];
            var arrs = argsToArray(arguments);
            if (arrs.length > 1) {
                var arr1 = arrs.shift();
                if (isArray(arr1)) {
                    ret = reduce(arr1, function (a, b, i) {
                        var curr = [b];
                        for (var j = 0; j < arrs.length; j++) {
                            var currArr = arrs[j];
                            if (isArray(currArr) && !is.isUndefined(currArr[i])) {
                                curr.push(currArr[i]);
                            } else {
                                curr.push(null);
                            }
                        }
                        a.push(curr);
                        return a;
                    }, []);
                }
            }
            return ret;
        }

        function transpose(arr) {
            var ret = [];
            if (isArray(arr) && arr.length) {
                var last;
                forEach(arr, function (a) {
                    if (isArray(a) && (!last || a.length === last.length)) {
                        forEach(a, function (b, i) {
                            if (!ret[i]) {
                                ret[i] = [];
                            }
                            ret[i].push(b);
                        });
                        last = a;
                    }
                });
            }
            return ret;
        }

        function valuesAt(arr, indexes) {
            var ret = [];
            indexes = argsToArray(arguments);
            arr = indexes.shift();
            if (isArray(arr) && indexes.length) {
                for (var i = 0, l = indexes.length; i < l; i++) {
                    ret.push(arr[indexes[i]] || null);
                }
            }
            return ret;
        }

        function union() {
            var ret = [];
            var arrs = argsToArray(arguments);
            if (arrs.length > 1) {
                for (var i = 0, l = arrs.length; i < l; i++) {
                    ret = ret.concat(arrs[i]);
                }
                ret = removeDuplicates(ret);
            }
            return ret;
        }

        function intersect() {
            var collect = [], sets;
            var args = argsToArray(arguments);
            if (args.length > 1) {
                //assume we are intersections all the lists in the array
                sets = args;
            } else {
                sets = args[0];
            }
            if (isArray(sets)) {
                var collect = sets.shift();
                for (var i = 0, l = sets.length; i < l; i++) {
                    collect = intersection(collect, sets[i]);
                }
            }
            return removeDuplicates(collect);
        }

        function powerSet(arr) {
            var ret = [];
            if (isArray(arr) && arr.length) {
                ret = reduce(arr, function (a, b) {
                    var ret = map(a, function (c) {
                        return c.concat(b);
                    });
                    return a.concat(ret);
                }, [
                    []
                ]);
            }
            return ret;
        }

        function cartesian(a, b) {
            var ret = [];
            if (isArray(a) && isArray(b) && a.length && b.length) {
                ret = cross(a[0], b).concat(cartesian(a.slice(1), b));
            }
            return ret;
        }

        function compact(arr) {
            var ret = [];
            if (isArray(arr) && arr.length) {
                ret = filter(arr, function (item) {
                    return !is.isUndefinedOrNull(item);
                });
            }
            return ret;
        }

        function multiply(arr, times) {
            times = is.isNumber(times) ? times : 1;
            if (!times) {
                //make sure times is greater than zero if it is zero then dont multiply it
                times = 1;
            }
            arr = toArray(arr || []);
            var ret = [], i = 0;
            while (++i <= times) {
                ret = ret.concat(arr);
            }
            return ret;
        }

        function flatten(arr) {
            var set;
            var args = argsToArray(arguments);
            if (args.length > 1) {
                //assume we are intersections all the lists in the array
                set = args;
            } else {
                set = toArray(arr);
            }
            return reduce(set, function (a, b) {
                return a.concat(b);
            }, []);
        }

        function pluck(arr, prop) {
            prop = prop.split(".");
            var result = arr.slice(0);
            forEach(prop, function (prop) {
                var exec = prop.match(/(\w+)\(\)$/);
                result = map(result, function (item) {
                    return exec ? item[exec[1]]() : item[prop];
                });
            });
            return result;
        }

        function invoke(arr, func, args) {
            args = argsToArray(arguments, 2);
            return map(arr, function (item) {
                var exec = isString(func) ? item[func] : func;
                return exec.apply(item, args);
            });
        }


        var array = {
            toArray: toArray,
            sum: sum,
            avg: avg,
            sort: sort,
            min: min,
            max: max,
            difference: difference,
            removeDuplicates: removeDuplicates,
            unique: unique,
            rotate: rotate,
            permutations: permutations,
            zip: zip,
            transpose: transpose,
            valuesAt: valuesAt,
            union: union,
            intersect: intersect,
            powerSet: powerSet,
            cartesian: cartesian,
            compact: compact,
            multiply: multiply,
            flatten: flatten,
            pluck: pluck,
            invoke: invoke,
            forEach: forEach,
            map: map,
            filter: filter,
            reduce: reduce,
            reduceRight: reduceRight,
            some: some,
            every: every,
            indexOf: indexOf,
            lastIndexOf: lastIndexOf
        };

        return extended.define(isArray, array).expose(array);
    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineArray(require("extended"), require("is-extended"));
        }
    } else if ("function" === typeof define) {
        define(["require"], function (require) {
            return defineArray(require("extended"), require("is-extended"));
        });
    } else {
        this.arrayExtended = defineArray(this.extended, this.isExtended);
    }

}).call(this);







},{"extended":11,"is-extended":16}],11:[function(require,module,exports){
(function(){(function () {
    "use strict";
    /*global extender is, dateExtended*/

    function defineExtended(extender) {


        var merge = (function merger() {
            function _merge(target, source) {
                var name, s;
                for (name in source) {
                    if (source.hasOwnProperty(name)) {
                        s = source[name];
                        if (!(name in target) || (target[name] !== s)) {
                            target[name] = s;
                        }
                    }
                }
                return target;
            }

            return function merge(obj) {
                if (!obj) {
                    obj = {};
                }
                for (var i = 1, l = arguments.length; i < l; i++) {
                    _merge(obj, arguments[i]);
                }
                return obj; // Object
            };
        }());

        function getExtended() {

            var loaded = {};


            //getInitial instance;
            var extended = extender.define();
            extended.expose({
                register: function register(alias, extendWith) {
                    if (!extendWith) {
                        extendWith = alias;
                        alias = null;
                    }
                    var type = typeof extendWith;
                    if (alias) {
                        extended[alias] = extendWith;
                    } else if (extendWith && type === "function") {
                        extended.extend(extendWith);
                    } else if (type === "object") {
                        extended.expose(extendWith);
                    } else {
                        throw new TypeError("extended.register must be called with an extender function");
                    }
                    return extended;
                },

                define: function () {
                    return extender.define.apply(extender, arguments);
                }
            });

            return extended;
        }

        function extended() {
            return getExtended();
        }

        extended.define = function define() {
            return extender.define.apply(extender, arguments);
        };

        return extended;
    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineExtended(require("extender"));

        }
    } else if ("function" === typeof define && define.amd) {
        define(["extender"], function (extender) {
            return defineExtended(extender);
        });
    } else {
        this.extended = defineExtended(this.extender);
    }

}).call(this);







})()
},{"extender":13}],12:[function(require,module,exports){
(function () {
    /*jshint strict:false*/


    /**
     *
     * @projectName extender
     * @github http://github.com/doug-martin/extender
     * @header
     * [![build status](https://secure.travis-ci.org/doug-martin/extender.png)](http://travis-ci.org/doug-martin/extender)
     * # Extender
     *
     * `extender` is a library that helps in making chainable APIs, by creating a function that accepts different values and returns an object decorated with functions based on the type.
     *
     * ## Why Is Extender Different?
     *
     * Extender is different than normal chaining because is does more than return `this`. It decorates your values in a type safe manner.
     *
     * For example if you return an array from a string based method then the returned value will be decorated with array methods and not the string methods. This allow you as the developer to focus on your API and not worrying about how to properly build and connect your API.
     *
     *
     * ## Installation
     *
     * ```
     * npm install extender
     * ```
     *
     * Or [download the source](https://raw.github.com/doug-martin/extender/master/extender.js) ([minified](https://raw.github.com/doug-martin/extender/master/extender-min.js))
     *
     * **Note** `extender` depends on [`declare.js`](http://doug-martin.github.com/declare.js/).
     *
     * ### Requirejs
     *
     * To use with requirejs place the `extend` source in the root scripts directory
     *
     * ```javascript
     *
     * define(["extender"], function(extender){
     * });
     *
     * ```
     *
     *
     * ## Usage
     *
     * **`extender.define(tester, decorations)`**
     *
     * To create your own extender call the `extender.define` function.
     *
     * This function accepts an optional tester which is used to determine a value should be decorated with the specified `decorations`
     *
     * ```javascript
     * function isString(obj) {
     *     return !isUndefinedOrNull(obj) && (typeof obj === "string" || obj instanceof String);
     * }
     *
     *
     * var myExtender = extender.define(isString, {
     *		multiply: function (str, times) {
     *			var ret = str;
     *			for (var i = 1; i < times; i++) {
     *				ret += str;
     *			}
     *			return ret;
     *		},
     *		toArray: function (str, delim) {
     *			delim = delim || "";
     *			return str.split(delim);
     *		}
     *	});
     *
     * myExtender("hello").multiply(2).value(); //hellohello
     *
     * ```
     *
     * If you do not specify a tester function and just pass in an object of `functions` then all values passed in will be decorated with methods.
     *
     * ```javascript
     *
     * function isUndefined(obj) {
     *     var undef;
     *     return obj === undef;
     * }
     *
     * function isUndefinedOrNull(obj) {
     *	var undef;
     *     return obj === undef || obj === null;
     * }
     *
     * function isArray(obj) {
     *     return Object.prototype.toString.call(obj) === "[object Array]";
     * }
     *
     * function isBoolean(obj) {
     *     var undef, type = typeof obj;
     *     return !isUndefinedOrNull(obj) && type === "boolean" || type === "Boolean";
     * }
     *
     * function isString(obj) {
     *     return !isUndefinedOrNull(obj) && (typeof obj === "string" || obj instanceof String);
     * }
     *
     * var myExtender = extender.define({
     *	isUndefined : isUndefined,
     *	isUndefinedOrNull : isUndefinedOrNull,
     *	isArray : isArray,
     *	isBoolean : isBoolean,
     *	isString : isString
     * });
     *
     * ```
     *
     * To use
     *
     * ```
     * var undef;
     * myExtender("hello").isUndefined().value(); //false
     * myExtender(undef).isUndefined().value(); //true
     * ```
     *
     * You can also chain extenders so that they accept multiple types and decorates accordingly.
     *
     * ```javascript
     * myExtender
     *     .define(isArray, {
     *		pluck: function (arr, m) {
     *			var ret = [];
     *			for (var i = 0, l = arr.length; i < l; i++) {
     *				ret.push(arr[i][m]);
     *			}
     *			return ret;
     *		}
     *	})
     *     .define(isBoolean, {
     *		invert: function (val) {
     *			return !val;
     *		}
     *	});
     *
     * myExtender([{a: "a"},{a: "b"},{a: "c"}]).pluck("a").value(); //["a", "b", "c"]
     * myExtender("I love javascript!").toArray(/\s+/).pluck("0"); //["I", "l", "j"]
     *
     * ```
     *
     * Notice that we reuse the same extender as defined above.
     *
     * **Return Values**
     *
     * When creating an extender if you return a value from one of the decoration functions then that value will also be decorated. If you do not return any values then the extender will be returned.
     *
     * **Default decoration methods**
     *
     * By default every value passed into an extender is decorated with the following methods.
     *
     * * `value` : The value this extender represents.
     * * `eq(otherValue)` : Tests strict equality of the currently represented value to the `otherValue`
     * * `neq(oterValue)` : Tests strict inequality of the currently represented value.
     * * `print` : logs the current value to the console.
     *
     * **Extender initialization**
     *
     * When creating an extender you can also specify a constructor which will be invoked with the current value.
     *
     * ```javascript
     * myExtender.define(isString, {
     *	constructor : function(val){
     *     //set our value to the string trimmed
     *		this._value = val.trimRight().trimLeft();
     *	}
     * });
     * ```
     *
     * **`noWrap`**
     *
     * `extender` also allows you to specify methods that should not have the value wrapped providing a cleaner exit function other than `value()`.
     *
     * For example suppose you have an API that allows you to build a validator, rather than forcing the user to invoke the `value` method you could add a method called `validator` which makes more syntactic sense.
     *
     * ```
     *
     * var myValidator = extender.define({
     *     //chainable validation methods
     *     //...
     *     //end chainable validation methods
     *
     *     noWrap : {
     *         validator : function(){
     *             //return your validator
     *         }
     *     }
     * });
     *
     * myValidator().isNotNull().isEmailAddress().validator(); //now you dont need to call .value()
     *
     *
     * ```
     * **`extender.extend(extendr)`**
     *
     * You may also compose extenders through the use of `extender.extend(extender)`, which will return an entirely new extender that is the composition of extenders.
     *
     * Suppose you have the following two extenders.
     *
     * ```javascript
     * var myExtender = extender
     *        .define({
     *            isFunction: is.function,
     *            isNumber: is.number,
     *            isString: is.string,
     *            isDate: is.date,
     *            isArray: is.array,
     *            isBoolean: is.boolean,
     *            isUndefined: is.undefined,
     *            isDefined: is.defined,
     *            isUndefinedOrNull: is.undefinedOrNull,
     *            isNull: is.null,
     *            isArguments: is.arguments,
     *            isInstanceOf: is.instanceOf,
     *            isRegExp: is.regExp
     *        });
     * var myExtender2 = extender.define(is.array, {
     *     pluck: function (arr, m) {
     *         var ret = [];
     *         for (var i = 0, l = arr.length; i < l; i++) {
     *             ret.push(arr[i][m]);
     *         }
     *         return ret;
     *     },
     *
     *     noWrap: {
     *         pluckPlain: function (arr, m) {
     *             var ret = [];
     *             for (var i = 0, l = arr.length; i < l; i++) {
     *                 ret.push(arr[i][m]);
     *             }
     *             return ret;
     *         }
     *     }
     * });
     *
     *
     * ```
     *
     * And you do not want to alter either of them but instead what to create a third that is the union of the two.
     *
     *
     * ```javascript
     * var composed = extender.extend(myExtender).extend(myExtender2);
     * ```
     * So now you can use the new extender with the joined functionality if `myExtender` and `myExtender2`.
     *
     * ```javascript
     * var extended = composed([
     *      {a: "a"},
     *      {a: "b"},
     *      {a: "c"}
     * ]);
     * extended.isArray().value(); //true
     * extended.pluck("a").value(); // ["a", "b", "c"]);
     *
     * ```
     *
     * **Note** `myExtender` and `myExtender2` will **NOT** be altered.
     *
     * **`extender.expose(methods)`**
     *
     * The `expose` method allows you to add methods to your extender that are not wrapped or automatically chained by exposing them on the extender directly.
     *
     * ```
     * var isMethods = {
     *      isFunction: is.function,
     *      isNumber: is.number,
     *      isString: is.string,
     *      isDate: is.date,
     *      isArray: is.array,
     *      isBoolean: is.boolean,
     *      isUndefined: is.undefined,
     *      isDefined: is.defined,
     *      isUndefinedOrNull: is.undefinedOrNull,
     *      isNull: is.null,
     *      isArguments: is.arguments,
     *      isInstanceOf: is.instanceOf,
     *      isRegExp: is.regExp
     * };
     *
     * var myExtender = extender.define(isMethods).expose(isMethods);
     *
     * myExtender.isArray([]); //true
     * myExtender([]).isArray([]).value(); //true
     *
     * ```
     *
     *
     * **Using `instanceof`**
     *
     * When using extenders you can test if a value is an `instanceof` of an extender by using the instanceof operator.
     *
     * ```javascript
     * var str = myExtender("hello");
     *
     * str instanceof myExtender; //true
     * ```
     *
     * ## Examples
     *
     * To see more examples click [here](https://github.com/doug-martin/extender/tree/master/examples)
     */
    function defineExtender(declare) {


        var slice = Array.prototype.slice, undef;

        function indexOf(arr, item) {
            if (arr && arr.length) {
                for (var i = 0, l = arr.length; i < l; i++) {
                    if (arr[i] === item) {
                        return i;
                    }
                }
            }
            return -1;
        }

        function isArray(obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        }

        var merge = (function merger() {
            function _merge(target, source, exclude) {
                var name, s;
                for (name in source) {
                    if (source.hasOwnProperty(name) && indexOf(exclude, name) === -1) {
                        s = source[name];
                        if (!(name in target) || (target[name] !== s)) {
                            target[name] = s;
                        }
                    }
                }
                return target;
            }

            return function merge(obj) {
                if (!obj) {
                    obj = {};
                }
                var l = arguments.length;
                var exclude = arguments[arguments.length - 1];
                if (isArray(exclude)) {
                    l--;
                } else {
                    exclude = [];
                }
                for (var i = 1; i < l; i++) {
                    _merge(obj, arguments[i], exclude);
                }
                return obj; // Object
            };
        }());


        function extender(supers) {
            supers = supers || [];
            var Base = declare({
                instance: {
                    constructor: function (value) {
                        this._value = value;
                    },

                    value: function () {
                        return this._value;
                    },

                    eq: function eq(val) {
                        return this["__extender__"](this._value === val);
                    },

                    neq: function neq(other) {
                        return this["__extender__"](this._value !== other);
                    },
                    print: function () {
                        console.log(this._value);
                        return this;
                    }
                }
            }), defined = [];

            function addMethod(proto, name, func) {
                if ("function" !== typeof func) {
                    throw new TypeError("when extending type you must provide a function");
                }
                var extendedMethod;
                if (name === "constructor") {
                    extendedMethod = function () {
                        this._super(arguments);
                        func.apply(this, arguments);
                    };
                } else {
                    extendedMethod = function extendedMethod() {
                        var args = slice.call(arguments);
                        args.unshift(this._value);
                        var ret = func.apply(this, args);
                        return ret !== undef ? this["__extender__"](ret) : this;
                    };
                }
                proto[name] = extendedMethod;
            }

            function addNoWrapMethod(proto, name, func) {
                if ("function" !== typeof func) {
                    throw new TypeError("when extending type you must provide a function");
                }
                var extendedMethod;
                if (name === "constructor") {
                    extendedMethod = function () {
                        this._super(arguments);
                        func.apply(this, arguments);
                    };
                } else {
                    extendedMethod = function extendedMethod() {
                        var args = slice.call(arguments);
                        args.unshift(this._value);
                        return func.apply(this, args);
                    };
                }
                proto[name] = extendedMethod;
            }

            function decorateProto(proto, decoration, nowrap) {
                for (var i in decoration) {
                    if (decoration.hasOwnProperty(i)) {
                        if (i !== "getters" && i !== "setters") {
                            if (i === "noWrap") {
                                decorateProto(proto, decoration[i], true);
                            } else if (nowrap) {
                                addNoWrapMethod(proto, i, decoration[i]);
                            } else {
                                addMethod(proto, i, decoration[i]);
                            }
                        } else {
                            proto[i] = decoration[i];
                        }
                    }
                }
            }

            function _extender(obj) {
                var ret = obj, i, l;
                if (!(obj instanceof Base)) {
                    var OurBase = Base;
                    for (i = 0, l = defined.length; i < l; i++) {
                        var definer = defined[i];
                        if (definer[0](obj)) {
                            OurBase = OurBase.extend({instance: definer[1]});
                        }
                    }
                    ret = new OurBase(obj);
                    ret["__extender__"] = _extender;
                }
                return ret;
            }

            function always() {
                return true;
            }

            function define(tester, decorate) {
                if (arguments.length) {
                    if (typeof tester === "object") {
                        decorate = tester;
                        tester = always;
                    }
                    decorate = decorate || {};
                    var proto = {};
                    decorateProto(proto, decorate);
                    //handle browsers like which skip over the constructor while looping
                    if (!proto.hasOwnProperty("constructor")) {
                        if (decorate.hasOwnProperty("constructor")) {
                            addMethod(proto, "constructor", decorate.constructor);
                        } else {
                            proto.constructor = function () {
                                this._super(arguments);
                            };
                        }
                    }
                    defined.push([tester, proto]);
                }
                return _extender;
            }

            function extend(supr) {
                if (supr && supr.hasOwnProperty("__defined__")) {
                    _extender["__defined__"] = defined = defined.concat(supr["__defined__"]);
                }
                merge(_extender, supr, ["define", "extend", "expose", "__defined__"]);
                return _extender;
            }

            _extender.define = define;
            _extender.extend = extend;
            _extender.expose = function expose() {
                var methods;
                for (var i = 0, l = arguments.length; i < l; i++) {
                    methods = arguments[i];
                    if (typeof methods === "object") {
                        merge(_extender, methods, ["define", "extend", "expose", "__defined__"]);
                    }
                }
                return _extender;
            };
            _extender["__defined__"] = defined;


            return _extender;
        }

        return {
            define: function () {
                return extender().define.apply(extender, arguments);
            },

            extend: function (supr) {
                return extender().define().extend(supr);
            }
        };

    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineExtender(require("declare.js"));

        }
    } else if ("function" === typeof define && define.amd) {
        define(["declare"], function (declare) {
            return defineExtender(declare);
        });
    } else {
        this.extender = defineExtender(this.declare);
    }

}).call(this);
},{"declare.js":15}],13:[function(require,module,exports){
module.exports = require("./extender.js");
},{"./extender.js":12}],14:[function(require,module,exports){
(function () {

    /**
     * @projectName declare
     * @github http://github.com/doug-martin/declare.js
     * @header
     *
     * Declare is a library designed to allow writing object oriented code the same way in both the browser and node.js.
     *
     * ##Installation
     *
     * `npm install declare.js`
     *
     * Or [download the source](https://raw.github.com/doug-martin/declare.js/master/declare.js) ([minified](https://raw.github.com/doug-martin/declare.js/master/declare-min.js))
     *
     * ###Requirejs
     *
     * To use with requirejs place the `declare` source in the root scripts directory
     *
     * ```
     *
     * define(["declare"], function(declare){
     *      return declare({
     *          instance : {
     *              hello : function(){
     *                  return "world";
     *              }
     *          }
     *      });
     * });
     *
     * ```
     *
     *
     * ##Usage
     *
     * declare.js provides
     *
     * Class methods
     *
     * * `as(module | object, name)` : exports the object to module or the object with the name
     * * `mixin(mixin)` : mixes in an object but does not inherit directly from the object. **Note** this does not return a new class but changes the original class.
     * * `extend(proto)` : extend a class with the given properties. A shortcut to `declare(Super, {})`;
     *
     * Instance methods
     *
     * * `_super(arguments)`: calls the super of the current method, you can pass in either the argments object or an array with arguments you want passed to super
     * * `_getSuper()`: returns a this methods direct super.
     * * `_static` : use to reference class properties and methods.
     * * `get(prop)` : gets a property invoking the getter if it exists otherwise it just returns the named property on the object.
     * * `set(prop, val)` : sets a property invoking the setter if it exists otherwise it just sets the named property on the object.
     *
     *
     * ###Declaring a new Class
     *
     * Creating a new class with declare is easy!
     *
     * ```
     *
     * var Mammal = declare({
     *      //define your instance methods and properties
     *      instance : {
     *
     *          //will be called whenever a new instance is created
     *          constructor: function(options) {
     *              options = options || {};
     *              this._super(arguments);
     *              this._type = options.type || "mammal";
     *          },
     *
     *          speak : function() {
     *              return  "A mammal of type " + this._type + " sounds like";
     *          },
     *
     *          //Define your getters
     *          getters : {
     *
     *              //can be accessed by using the get method. (mammal.get("type"))
     *              type : function() {
     *                  return this._type;
     *              }
     *          },
     *
     *           //Define your setters
     *          setters : {
     *
     *                //can be accessed by using the set method. (mammal.set("type", "mammalType"))
     *              type : function(t) {
     *                  this._type = t;
     *              }
     *          }
     *      },
     *
     *      //Define your static methods
     *      static : {
     *
     *          //Mammal.soundOff(); //"Im a mammal!!"
     *          soundOff : function() {
     *              return "Im a mammal!!";
     *          }
     *      }
     * });
     *
     *
     * ```
     *
     * You can use Mammal just like you would any other class.
     *
     * ```
     * Mammal.soundOff("Im a mammal!!");
     *
     * var myMammal = new Mammal({type : "mymammal"});
     * myMammal.speak(); // "A mammal of type mymammal sounds like"
     * myMammal.get("type"); //"mymammal"
     * myMammal.set("type", "mammal");
     * myMammal.get("type"); //"mammal"
     *
     *
     * ```
     *
     * ###Extending a class
     *
     * If you want to just extend a single class use the .extend method.
     *
     * ```
     *
     * var Wolf = Mammal.extend({
     *
     *   //define your instance method
     *   instance: {
     *
     *        //You can override super constructors just be sure to call `_super`
     *       constructor: function(options) {
     *          options = options || {};
     *          this._super(arguments); //call our super constructor.
     *          this._sound = "growl";
     *          this._color = options.color || "grey";
     *      },
     *
     *      //override Mammals `speak` method by appending our own data to it.
     *      speak : function() {
     *          return this._super(arguments) + " a " + this._sound;
     *      },
     *
     *      //add new getters for sound and color
     *      getters : {
     *
     *           //new Wolf().get("type")
     *           //notice color is read only as we did not define a setter
     *          color : function() {
     *              return this._color;
     *          },
     *
     *          //new Wolf().get("sound")
     *          sound : function() {
     *              return this._sound;
     *          }
     *      },
     *
     *      setters : {
     *
     *          //new Wolf().set("sound", "howl")
     *          sound : function(s) {
     *              this._sound = s;
     *          }
     *      }
     *
     *  },
     *
     *  static : {
     *
     *      //You can override super static methods also! And you can still use _super
     *      soundOff : function() {
     *          //You can even call super in your statics!!!
     *          //should return "I'm a mammal!! that growls"
     *          return this._super(arguments) + " that growls";
     *      }
     *  }
     * });
     *
     * Wolf.soundOff(); //Im a mammal!! that growls
     *
     * var myWolf = new Wolf();
     * myWolf instanceof Mammal //true
     * myWolf instanceof Wolf //true
     *
     * ```
     *
     * You can also extend a class by using the declare method and just pass in the super class.
     *
     * ```
     * //Typical hierarchical inheritance
     * // Mammal->Wolf->Dog
     * var Dog = declare(Wolf, {
     *    instance: {
     *        constructor: function(options) {
     *            options = options || {};
     *            this._super(arguments);
     *            //override Wolfs initialization of sound to woof.
     *            this._sound = "woof";
     *
     *        },
     *
     *        speak : function() {
     *            //Should return "A mammal of type mammal sounds like a growl thats domesticated"
     *            return this._super(arguments) + " thats domesticated";
     *        }
     *    },
     *
     *    static : {
     *        soundOff : function() {
     *            //should return "I'm a mammal!! that growls but now barks"
     *            return this._super(arguments) + " but now barks";
     *        }
     *    }
     * });
     *
     * Dog.soundOff(); //Im a mammal!! that growls but now barks
     *
     * var myDog = new Dog();
     * myDog instanceof Mammal //true
     * myDog instanceof Wolf //true
     * myDog instanceof Dog //true
     *
     *
     * //Notice you still get the extend method.
     *
     * // Mammal->Wolf->Dog->Breed
     * var Breed = Dog.extend({
     *    instance: {
     *
     *        //initialize outside of constructor
     *        _pitch : "high",
     *
     *        constructor: function(options) {
     *            options = options || {};
     *            this._super(arguments);
     *            this.breed = options.breed || "lab";
     *        },
     *
     *        speak : function() {
     *            //Should return "A mammal of type mammal sounds like a
     *            //growl thats domesticated with a high pitch!"
     *            return this._super(arguments) + " with a " + this._pitch + " pitch!";
     *        },
     *
     *        getters : {
     *            pitch : function() {
     *                return this._pitch;
     *            }
     *        }
     *    },
     *
     *    static : {
     *        soundOff : function() {
     *            //should return "I'M A MAMMAL!! THAT GROWLS BUT NOW BARKS!"
     *            return this._super(arguments).toUpperCase() + "!";
     *        }
     *    }
     * });
     *
     *
     * Breed.soundOff()//"IM A MAMMAL!! THAT GROWLS BUT NOW BARKS!"
     *
     * var myBreed = new Breed({color : "gold", type : "lab"}),
     * myBreed instanceof Dog //true
     * myBreed instanceof Wolf //true
     * myBreed instanceof Mammal //true
     * myBreed.speak() //"A mammal of type lab sounds like a woof thats domesticated with a high pitch!"
     * myBreed.get("type") //"lab"
     * myBreed.get("color") //"gold"
     * myBreed.get("sound")" //"woof"
     * ```
     *
     * ###Multiple Inheritance / Mixins
     *
     * declare also allows the use of multiple super classes.
     * This is useful if you have generic classes that provide functionality but shouldnt be used on their own.
     *
     * Lets declare a mixin that allows us to watch for property changes.
     *
     * ```
     * //Notice that we set up the functions outside of declare because we can reuse them
     *
     * function _set(prop, val) {
     *     //get the old value
     *     var oldVal = this.get(prop);
     *     //call super to actually set the property
     *     var ret = this._super(arguments);
     *     //call our handlers
     *     this.__callHandlers(prop, oldVal, val);
     *     return ret;
     * }
     *
     * function _callHandlers(prop, oldVal, newVal) {
     *    //get our handlers for the property
     *     var handlers = this.__watchers[prop], l;
     *     //if the handlers exist and their length does not equal 0 then we call loop through them
     *     if (handlers && (l = handlers.length) !== 0) {
     *         for (var i = 0; i < l; i++) {
     *             //call the handler
     *             handlers[i].call(null, prop, oldVal, newVal);
     *         }
     *     }
     * }
     *
     *
     * //the watch function
     * function _watch(prop, handler) {
     *     if ("function" !== typeof handler) {
     *         //if its not a function then its an invalid handler
     *         throw new TypeError("Invalid handler.");
     *     }
     *     if (!this.__watchers[prop]) {
     *         //create the watchers if it doesnt exist
     *         this.__watchers[prop] = [handler];
     *     } else {
     *         //otherwise just add it to the handlers array
     *         this.__watchers[prop].push(handler);
     *     }
     * }
     *
     * function _unwatch(prop, handler) {
     *     if ("function" !== typeof handler) {
     *         throw new TypeError("Invalid handler.");
     *     }
     *     var handlers = this.__watchers[prop], index;
     *     if (handlers && (index = handlers.indexOf(handler)) !== -1) {
     *        //remove the handler if it is found
     *         handlers.splice(index, 1);
     *     }
     * }
     *
     * declare({
     *     instance:{
     *         constructor:function () {
     *             this._super(arguments);
     *             //set up our watchers
     *             this.__watchers = {};
     *         },
     *
     *         //override the default set function so we can watch values
     *         "set":_set,
     *         //set up our callhandlers function
     *         __callHandlers:_callHandlers,
     *         //add the watch function
     *         watch:_watch,
     *         //add the unwatch function
     *         unwatch:_unwatch
     *     },
     *
     *     "static":{
     *
     *         init:function () {
     *             this._super(arguments);
     *             this.__watchers = {};
     *         },
     *         //override the default set function so we can watch values
     *         "set":_set,
     *         //set our callHandlers function
     *         __callHandlers:_callHandlers,
     *         //add the watch
     *         watch:_watch,
     *         //add the unwatch function
     *         unwatch:_unwatch
     *     }
     * })
     *
     * ```
     *
     * Now lets use the mixin
     *
     * ```
     * var WatchDog = declare([Dog, WatchMixin]);
     *
     * var watchDog = new WatchDog();
     * //create our handler
     * function watch(id, oldVal, newVal) {
     *     console.log("watchdog's %s was %s, now %s", id, oldVal, newVal);
     * }
     *
     * //watch for property changes
     * watchDog.watch("type", watch);
     * watchDog.watch("color", watch);
     * watchDog.watch("sound", watch);
     *
     * //now set the properties each handler will be called
     * watchDog.set("type", "newDog");
     * watchDog.set("color", "newColor");
     * watchDog.set("sound", "newSound");
     *
     *
     * //unwatch the property changes
     * watchDog.unwatch("type", watch);
     * watchDog.unwatch("color", watch);
     * watchDog.unwatch("sound", watch);
     *
     * //no handlers will be called this time
     * watchDog.set("type", "newDog");
     * watchDog.set("color", "newColor");
     * watchDog.set("sound", "newSound");
     *
     *
     * ```
     *
     * ###Accessing static methods and properties witin an instance.
     *
     * To access static properties on an instance use the `_static` property which is a reference to your constructor.
     *
     * For example if your in your constructor and you want to have configurable default values.
     *
     * ```
     * consturctor : function constructor(opts){
     *     this.opts = opts || {};
     *     this._type = opts.type || this._static.DEFAULT_TYPE;
     * }
     * ```
     *
     *
     *
     * ###Creating a new instance of within an instance.
     *
     * Often times you want to create a new instance of an object within an instance. If your subclassed however you cannot return a new instance of the parent class as it will not be the right sub class. `declare` provides a way around this by setting the `_static` property on each isntance of the class.
     *
     * Lets add a reproduce method `Mammal`
     *
     * ```
     * reproduce : function(options){
     *     return new this._static(options);
     * }
     * ```
     *
     * Now in each subclass you can call reproduce and get the proper type.
     *
     * ```
     * var myDog = new Dog();
     * var myDogsChild = myDog.reproduce();
     *
     * myDogsChild instanceof Dog; //true
     * ```
     *
     * ###Using the `as`
     *
     * `declare` also provides an `as` method which allows you to add your class to an object or if your using node.js you can pass in `module` and the class will be exported as the module.
     *
     * ```
     * var animals = {};
     *
     * Mammal.as(animals, "Dog");
     * Wolf.as(animals, "Wolf");
     * Dog.as(animals, "Dog");
     * Breed.as(animals, "Breed");
     *
     * var myDog = new animals.Dog();
     *
     * ```
     *
     * Or in node
     *
     * ```
     * Mammal.as(exports, "Dog");
     * Wolf.as(exports, "Wolf");
     * Dog.as(exports, "Dog");
     * Breed.as(exports, "Breed");
     *
     * ```
     *
     * To export a class as the `module` in node
     *
     * ```
     * Mammal.as(module);
     * ```
     *
     *
     */
    function createDeclared() {
        var arraySlice = Array.prototype.slice, classCounter = 0, Base, forceNew = new Function();

        var SUPER_REGEXP = /(super)/g;

        function argsToArray(args, slice) {
            slice = slice || 0;
            return arraySlice.call(args, slice);
        }

        function isArray(obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        }

        function isObject(obj) {
            var undef;
            return obj !== null && obj !== undef && typeof obj === "object";
        }

        function isHash(obj) {
            var ret = isObject(obj);
            return ret && obj.constructor === Object;
        }

        var isArguments = function _isArguments(object) {
            return Object.prototype.toString.call(object) === '[object Arguments]';
        };

        if (!isArguments(arguments)) {
            isArguments = function _isArguments(obj) {
                return !!(obj && obj.hasOwnProperty("callee"));
            };
        }

        function indexOf(arr, item) {
            if (arr && arr.length) {
                for (var i = 0, l = arr.length; i < l; i++) {
                    if (arr[i] === item) {
                        return i;
                    }
                }
            }
            return -1;
        }

        function merge(target, source, exclude) {
            var name, s;
            for (name in source) {
                if (source.hasOwnProperty(name) && indexOf(exclude, name) === -1) {
                    s = source[name];
                    if (!(name in target) || (target[name] !== s)) {
                        target[name] = s;
                    }
                }
            }
            return target;
        }

        function callSuper(args, a) {
            var meta = this.__meta,
                supers = meta.supers,
                l = supers.length, superMeta = meta.superMeta, pos = superMeta.pos;
            if (l > pos) {
                args = !args ? [] : (!isArguments(args) && !isArray(args)) ? [args] : args;
                var name = superMeta.name, f = superMeta.f, m;
                do {
                    m = supers[pos][name];
                    if ("function" === typeof m && (m = m._f || m) !== f) {
                        superMeta.pos = 1 + pos;
                        return m.apply(this, args);
                    }
                } while (l > ++pos);
            }

            return null;
        }

        function getSuper() {
            var meta = this.__meta,
                supers = meta.supers,
                l = supers.length, superMeta = meta.superMeta, pos = superMeta.pos;
            if (l > pos) {
                var name = superMeta.name, f = superMeta.f, m;
                do {
                    m = supers[pos][name];
                    if ("function" === typeof m && (m = m._f || m) !== f) {
                        superMeta.pos = 1 + pos;
                        return m.bind(this);
                    }
                } while (l > ++pos);
            }
            return null;
        }

        function getter(name) {
            var getters = this.__getters__;
            if (getters.hasOwnProperty(name)) {
                return getters[name].apply(this);
            } else {
                return this[name];
            }
        }

        function setter(name, val) {
            var setters = this.__setters__;
            if (isHash(name)) {
                for (var i in name) {
                    var prop = name[i];
                    if (setters.hasOwnProperty(i)) {
                        setters[name].call(this, prop);
                    } else {
                        this[i] = prop;
                    }
                }
            } else {
                if (setters.hasOwnProperty(name)) {
                    return setters[name].apply(this, argsToArray(arguments, 1));
                } else {
                    return this[name] = val;
                }
            }
        }


        function defaultFunction() {
            var meta = this.__meta || {},
                supers = meta.supers,
                l = supers.length, superMeta = meta.superMeta, pos = superMeta.pos;
            if (l > pos) {
                var name = superMeta.name, f = superMeta.f, m;
                do {
                    m = supers[pos][name];
                    if ("function" === typeof m && (m = m._f || m) !== f) {
                        superMeta.pos = 1 + pos;
                        return m.apply(this, arguments);
                    }
                } while (l > ++pos);
            }
            return null;
        }


        function functionWrapper(f, name) {
            if (f.toString().match(SUPER_REGEXP)) {
                var wrapper = function wrapper() {
                    var ret, meta = this.__meta || {};
                    var orig = meta.superMeta;
                    meta.superMeta = {f: f, pos: 0, name: name};
                    switch (arguments.length) {
                    case 0:
                        ret = f.call(this);
                        break;
                    case 1:
                        ret = f.call(this, arguments[0]);
                        break;
                    case 2:
                        ret = f.call(this, arguments[0], arguments[1]);
                        break;

                    case 3:
                        ret = f.call(this, arguments[0], arguments[1], arguments[2]);
                        break;
                    default:
                        ret = f.apply(this, arguments);
                    }
                    meta.superMeta = orig;
                    return ret;
                };
                wrapper._f = f;
                return wrapper;
            } else {
                f._f = f;
                return f;
            }
        }

        function defineMixinProps(child, proto) {

            var operations = proto.setters || {}, __setters = child.__setters__, __getters = child.__getters__;
            for (var i in operations) {
                if (!__setters.hasOwnProperty(i)) {  //make sure that the setter isnt already there
                    __setters[i] = operations[i];
                }
            }
            operations = proto.getters || {};
            for (i in operations) {
                if (!__getters.hasOwnProperty(i)) {  //make sure that the setter isnt already there
                    __getters[i] = operations[i];
                }
            }
            for (var j in proto) {
                if (j !== "getters" && j !== "setters") {
                    var p = proto[j];
                    if ("function" === typeof p) {
                        if (!child.hasOwnProperty(j)) {
                            child[j] = functionWrapper(defaultFunction, j);
                        }
                    } else {
                        child[j] = p;
                    }
                }
            }
        }

        function mixin() {
            var args = argsToArray(arguments), l = args.length;
            var child = this.prototype;
            var childMeta = child.__meta, thisMeta = this.__meta, bases = child.__meta.bases, staticBases = bases.slice(),
                staticSupers = thisMeta.supers || [], supers = childMeta.supers || [];
            for (var i = 0; i < l; i++) {
                var m = args[i], mProto = m.prototype;
                var protoMeta = mProto.__meta, meta = m.__meta;
                !protoMeta && (protoMeta = (mProto.__meta = {proto: mProto || {}}));
                !meta && (meta = (m.__meta = {proto: m.__proto__ || {}}));
                defineMixinProps(child, protoMeta.proto || {});
                defineMixinProps(this, meta.proto || {});
                //copy the bases for static,

                mixinSupers(m.prototype, supers, bases);
                mixinSupers(m, staticSupers, staticBases);
            }
            return this;
        }

        function mixinSupers(sup, arr, bases) {
            var meta = sup.__meta;
            !meta && (meta = (sup.__meta = {}));
            var unique = sup.__meta.unique;
            !unique && (meta.unique = "declare" + ++classCounter);
            //check it we already have this super mixed into our prototype chain
            //if true then we have already looped their supers!
            if (indexOf(bases, unique) === -1) {
                //add their id to our bases
                bases.push(unique);
                var supers = sup.__meta.supers || [], i = supers.length - 1 || 0;
                while (i >= 0) {
                    mixinSupers(supers[i--], arr, bases);
                }
                arr.unshift(sup);
            }
        }

        function defineProps(child, proto) {
            var operations = proto.setters,
                __setters = child.__setters__,
                __getters = child.__getters__;
            if (operations) {
                for (var i in operations) {
                    __setters[i] = operations[i];
                }
            }
            operations = proto.getters || {};
            if (operations) {
                for (i in operations) {
                    __getters[i] = operations[i];
                }
            }
            for (i in proto) {
                if (i != "getters" && i != "setters") {
                    var f = proto[i];
                    if ("function" === typeof f) {
                        var meta = f.__meta || {};
                        if (!meta.isConstructor) {
                            child[i] = functionWrapper(f, i);
                        } else {
                            child[i] = f;
                        }
                    } else {
                        child[i] = f;
                    }
                }
            }

        }

        function _export(obj, name) {
            if (obj && name) {
                obj[name] = this;
            } else {
                obj.exports = obj = this;
            }
            return this;
        }

        function extend(proto) {
            return declare(this, proto);
        }

        function getNew(ctor) {
            // create object with correct prototype using a do-nothing
            // constructor
            forceNew.prototype = ctor.prototype;
            var t = new forceNew();
            forceNew.prototype = null;	// clean up
            return t;
        }


        function __declare(child, sup, proto) {
            var childProto = {}, supers = [];
            var unique = "declare" + ++classCounter, bases = [], staticBases = [];
            var instanceSupers = [], staticSupers = [];
            var meta = {
                supers: instanceSupers,
                unique: unique,
                bases: bases,
                superMeta: {
                    f: null,
                    pos: 0,
                    name: null
                }
            };
            var childMeta = {
                supers: staticSupers,
                unique: unique,
                bases: staticBases,
                isConstructor: true,
                superMeta: {
                    f: null,
                    pos: 0,
                    name: null
                }
            };

            if (isHash(sup) && !proto) {
                proto = sup;
                sup = Base;
            }

            if ("function" === typeof sup || isArray(sup)) {
                supers = isArray(sup) ? sup : [sup];
                sup = supers.shift();
                child.__meta = childMeta;
                childProto = getNew(sup);
                childProto.__meta = meta;
                childProto.__getters__ = merge({}, childProto.__getters__ || {});
                childProto.__setters__ = merge({}, childProto.__setters__ || {});
                child.__getters__ = merge({}, child.__getters__ || {});
                child.__setters__ = merge({}, child.__setters__ || {});
                mixinSupers(sup.prototype, instanceSupers, bases);
                mixinSupers(sup, staticSupers, staticBases);
            } else {
                child.__meta = childMeta;
                childProto.__meta = meta;
                childProto.__getters__ = childProto.__getters__ || {};
                childProto.__setters__ = childProto.__setters__ || {};
                child.__getters__ = child.__getters__ || {};
                child.__setters__ = child.__setters__ || {};
            }
            child.prototype = childProto;
            if (proto) {
                var instance = meta.proto = proto.instance || {};
                var stat = childMeta.proto = proto.static || {};
                stat.init = stat.init || defaultFunction;
                defineProps(childProto, instance);
                defineProps(child, stat);
                if (!instance.hasOwnProperty("constructor")) {
                    childProto.constructor = instance.constructor = functionWrapper(defaultFunction, "constructor");
                } else {
                    childProto.constructor = functionWrapper(instance.constructor, "constructor");
                }
            } else {
                meta.proto = {};
                childMeta.proto = {};
                child.init = functionWrapper(defaultFunction, "init");
                childProto.constructor = functionWrapper(defaultFunction, "constructor");
            }
            if (supers.length) {
                mixin.apply(child, supers);
            }
            if (sup) {
                //do this so we mixin our super methods directly but do not ov
                merge(child, merge(merge({}, sup), child));
            }
            childProto._super = child._super = callSuper;
            childProto._getSuper = child._getSuper = getSuper;
            childProto._static = child;
        }

        function declare(sup, proto) {
            function declared() {
                switch (arguments.length) {
                case 0:
                    this.constructor.call(this);
                    break;
                case 1:
                    this.constructor.call(this, arguments[0]);
                    break;
                case 2:
                    this.constructor.call(this, arguments[0], arguments[1]);
                    break;
                case 3:
                    this.constructor.call(this, arguments[0], arguments[1], arguments[2]);
                    break;
                default:
                    this.constructor.apply(this, arguments);
                }
            }

            __declare(declared, sup, proto);
            return declared.init() || declared;
        }

        function singleton(sup, proto) {
            var retInstance;

            function declaredSingleton() {
                if (!retInstance) {
                    this.constructor.apply(this, arguments);
                    retInstance = this;
                }
                return retInstance;
            }

            __declare(declaredSingleton, sup, proto);
            return  declaredSingleton.init() || declaredSingleton;
        }

        Base = declare({
            instance: {
                "get": getter,
                "set": setter
            },

            "static": {
                "get": getter,
                "set": setter,
                mixin: mixin,
                extend: extend,
                as: _export
            }
        });

        declare.singleton = singleton;
        return declare;
    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = createDeclared();
        }
    } else if ("function" === typeof define && define.amd) {
        define(createDeclared);
    } else {
        this.declare = createDeclared();
    }
}());




},{}],15:[function(require,module,exports){
module.exports = require("./declare.js");
},{"./declare.js":14}],16:[function(require,module,exports){
(function(Buffer){(function () {
    "use strict";

    function defineIsa(extended) {

        var pSlice = Array.prototype.slice;

        var hasOwn = Object.prototype.hasOwnProperty;
        var toStr = Object.prototype.toString;

        function argsToArray(args, slice) {
            var i = -1, j = 0, l = args.length, ret = [];
            slice = slice || 0;
            i += slice;
            while (++i < l) {
                ret[j++] = args[i];
            }
            return ret;
        }

        function keys(obj) {
            var ret = [];
            for (var i in obj) {
                if (hasOwn.call(obj, i)) {
                    ret.push(i);
                }
            }
            return ret;
        }

        //taken from node js assert.js
        //https://github.com/joyent/node/blob/master/lib/assert.js
        function deepEqual(actual, expected) {
            // 7.1. All identical values are equivalent, as determined by ===.
            if (actual === expected) {
                return true;

            } else if (typeof Buffer !== "undefined" && Buffer.isBuffer(actual) && Buffer.isBuffer(expected)) {
                if (actual.length !== expected.length) {
                    return false;
                }
                for (var i = 0; i < actual.length; i++) {
                    if (actual[i] !== expected[i]) {
                        return false;
                    }
                }
                return true;

                // 7.2. If the expected value is a Date object, the actual value is
                // equivalent if it is also a Date object that refers to the same time.
            } else if (isDate(actual) && isDate(expected)) {
                return actual.getTime() === expected.getTime();

                // 7.3 If the expected value is a RegExp object, the actual value is
                // equivalent if it is also a RegExp object with the same source and
                // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
            } else if (isRegExp(actual) && isRegExp(expected)) {
                return actual.source === expected.source &&
                    actual.global === expected.global &&
                    actual.multiline === expected.multiline &&
                    actual.lastIndex === expected.lastIndex &&
                    actual.ignoreCase === expected.ignoreCase;

                // 7.4. Other pairs that do not both pass typeof value == 'object',
                // equivalence is determined by ==.
            } else if (isString(actual) && isString(expected) && actual !== expected) {
                return false;
            } else if (typeof actual !== 'object' && typeof expected !== 'object') {
                return actual === expected;

                // 7.5 For all other Object pairs, including Array objects, equivalence is
                // determined by having the same number of owned properties (as verified
                // with Object.prototype.hasOwnProperty.call), the same set of keys
                // (although not necessarily the same order), equivalent values for every
                // corresponding key, and an identical 'prototype' property. Note: this
                // accounts for both named and indexed properties on Arrays.
            } else {
                return objEquiv(actual, expected);
            }
        }


        function objEquiv(a, b) {
            var key;
            if (isUndefinedOrNull(a) || isUndefinedOrNull(b)) {
                return false;
            }
            // an identical 'prototype' property.
            if (a.prototype !== b.prototype) {
                return false;
            }
            //~~~I've managed to break Object.keys through screwy arguments passing.
            //   Converting to array solves the problem.
            if (isArguments(a)) {
                if (!isArguments(b)) {
                    return false;
                }
                a = pSlice.call(a);
                b = pSlice.call(b);
                return deepEqual(a, b);
            }
            try {
                var ka = keys(a),
                    kb = keys(b),
                    i;
                // having the same number of owned properties (keys incorporates
                // hasOwnProperty)
                if (ka.length !== kb.length) {
                    return false;
                }
                //the same set of keys (although not necessarily the same order),
                ka.sort();
                kb.sort();
                //~~~cheap key test
                for (i = ka.length - 1; i >= 0; i--) {
                    if (ka[i] !== kb[i]) {
                        return false;
                    }
                }
                //equivalent values for every corresponding key, and
                //~~~possibly expensive deep test
                for (i = ka.length - 1; i >= 0; i--) {
                    key = ka[i];
                    if (!deepEqual(a[key], b[key])) {
                        return false;
                    }
                }
            } catch (e) {//happens when one is a string literal and the other isn't
                return false;
            }
            return true;
        }


        var isFunction = function (obj) {
            return toStr.call(obj) === '[object Function]';
        };

        //ie hack
        if ("undefined" !== typeof window && !isFunction(window.alert)) {
            (function (alert) {
                isFunction = function (obj) {
                    return toStr.call(obj) === '[object Function]' || obj === alert;
                };
            }(window.alert));
        }

        function isObject(obj) {
            var undef;
            return obj !== null && typeof obj === "object";
        }

        function isHash(obj) {
            var ret = isObject(obj);
            return ret && obj.constructor === Object && !obj.nodeType && !obj.setInterval;
        }

        function isEmpty(object) {
            if (isArguments(object)) {
                return object.length === 0;
            } else if (isObject(object)) {
                return keys(object).length === 0;
            } else if (isString(object) || isArray(object)) {
                return object.length === 0;
            }
            return true;
        }

        function isBoolean(obj) {
            return obj === true || obj === false || toStr.call(obj) === "[object Boolean]";
        }

        function isUndefined(obj) {
            return typeof obj === 'undefined';
        }

        function isDefined(obj) {
            return !isUndefined(obj);
        }

        function isUndefinedOrNull(obj) {
            return isUndefined(obj) || isNull(obj);
        }

        function isNull(obj) {
            return obj === null;
        }


        var isArguments = function _isArguments(object) {
            return toStr.call(object) === '[object Arguments]';
        };

        if (!isArguments(arguments)) {
            isArguments = function _isArguments(obj) {
                return !!(obj && hasOwn.call(obj, "callee"));
            };
        }


        function isInstanceOf(obj, clazz) {
            if (isFunction(clazz)) {
                return obj instanceof clazz;
            } else {
                return false;
            }
        }

        function isRegExp(obj) {
            return toStr.call(obj) === '[object RegExp]';
        }

        var isArray = Array.isArray || function isArray(obj) {
            return toStr.call(obj) === "[object Array]";
        };

        function isDate(obj) {
            return toStr.call(obj) === '[object Date]';
        }

        function isString(obj) {
            return toStr.call(obj) === '[object String]';
        }

        function isNumber(obj) {
            return toStr.call(obj) === '[object Number]';
        }

        function isTrue(obj) {
            return obj === true;
        }

        function isFalse(obj) {
            return obj === false;
        }

        function isNotNull(obj) {
            return !isNull(obj);
        }

        function isEq(obj, obj2) {
            /*jshint eqeqeq:false*/
            return obj == obj2;
        }

        function isNeq(obj, obj2) {
            /*jshint eqeqeq:false*/
            return obj != obj2;
        }

        function isSeq(obj, obj2) {
            return obj === obj2;
        }

        function isSneq(obj, obj2) {
            return obj !== obj2;
        }

        function isIn(obj, arr) {
            if ((isArray(arr) && Array.prototype.indexOf) || isString(arr)) {
                return arr.indexOf(obj) > -1;
            } else if (isArray(arr)) {
                for (var i = 0, l = arr.length; i < l; i++) {
                    if (isEq(obj, arr[i])) {
                        return true;
                    }
                }
            }
            return false;
        }

        function isNotIn(obj, arr) {
            return !isIn(obj, arr);
        }

        function isLt(obj, obj2) {
            return obj < obj2;
        }

        function isLte(obj, obj2) {
            return obj <= obj2;
        }

        function isGt(obj, obj2) {
            return obj > obj2;
        }

        function isGte(obj, obj2) {
            return obj >= obj2;
        }

        function isLike(obj, reg) {
            if (isString(reg)) {
                return ("" + obj).match(reg) !== null;
            } else if (isRegExp(reg)) {
                return reg.test(obj);
            }
            return false;
        }

        function isNotLike(obj, reg) {
            return !isLike(obj, reg);
        }

        function contains(arr, obj) {
            return isIn(obj, arr);
        }

        function notContains(arr, obj) {
            return !isIn(obj, arr);
        }

        function containsAt(arr, obj, index) {
            if (isArray(arr) && arr.length > index) {
                return isEq(arr[index], obj);
            }
            return false;
        }

        function notContainsAt(arr, obj, index) {
            if (isArray(arr)) {
                return !isEq(arr[index], obj);
            }
            return false;
        }

        function has(obj, prop) {
            return hasOwn.call(obj, prop);
        }

        function notHas(obj, prop) {
            return !has(obj, prop);
        }

        function length(obj, l) {
            if (has(obj, "length")) {
                return obj.length === l;
            }
            return false;
        }

        function notLength(obj, l) {
            if (has(obj, "length")) {
                return obj.length !== l;
            }
            return false;
        }

        var isa = {
            isFunction: isFunction,
            isObject: isObject,
            isEmpty: isEmpty,
            isHash: isHash,
            isNumber: isNumber,
            isString: isString,
            isDate: isDate,
            isArray: isArray,
            isBoolean: isBoolean,
            isUndefined: isUndefined,
            isDefined: isDefined,
            isUndefinedOrNull: isUndefinedOrNull,
            isNull: isNull,
            isArguments: isArguments,
            instanceOf: isInstanceOf,
            isRegExp: isRegExp,
            deepEqual: deepEqual,
            isTrue: isTrue,
            isFalse: isFalse,
            isNotNull: isNotNull,
            isEq: isEq,
            isNeq: isNeq,
            isSeq: isSeq,
            isSneq: isSneq,
            isIn: isIn,
            isNotIn: isNotIn,
            isLt: isLt,
            isLte: isLte,
            isGt: isGt,
            isGte: isGte,
            isLike: isLike,
            isNotLike: isNotLike,
            contains: contains,
            notContains: notContains,
            has: has,
            notHas: notHas,
            isLength: length,
            isNotLength: notLength,
            containsAt: containsAt,
            notContainsAt: notContainsAt
        };

        var tester = {
            constructor: function () {
                this._testers = [];
            },

            noWrap: {
                tester: function () {
                    var testers = this._testers;
                    return function tester(value) {
                        var isa = false;
                        for (var i = 0, l = testers.length; i < l && !isa; i++) {
                            isa = testers[i](value);
                        }
                        return isa;
                    };
                }
            }
        };

        var switcher = {
            constructor: function () {
                this._cases = [];
                this.__default = null;
            },

            def: function (val, fn) {
                this.__default = fn;
            },

            noWrap: {
                switcher: function () {
                    var testers = this._cases, __default = this.__default;
                    return function tester() {
                        var handled = false, args = argsToArray(arguments), caseRet;
                        for (var i = 0, l = testers.length; i < l && !handled; i++) {
                            caseRet = testers[i](args);
                            if (caseRet.length > 1) {
                                if (caseRet[1] || caseRet[0]) {
                                    return caseRet[1];
                                }
                            }
                        }
                        if (!handled && __default) {
                            return  __default.apply(this, args);
                        }
                    };
                }
            }
        };

        function addToTester(func) {
            tester[func] = function isaTester() {
                this._testers.push(isa[func]);
            };
        }

        function addToSwitcher(func) {
            switcher[func] = function isaTester() {
                var args = argsToArray(arguments, 1), isFunc = isa[func], handler, doBreak = true;
                if (args.length <= isFunc.length - 1) {
                    throw new TypeError("A handler must be defined when calling using switch");
                } else {
                    handler = args.pop();
                    if (isBoolean(handler)) {
                        doBreak = handler;
                        handler = args.pop();
                    }
                }
                if (!isFunction(handler)) {
                    throw new TypeError("handler must be defined");
                }
                this._cases.push(function (testArgs) {
                    if (isFunc.apply(isa, testArgs.concat(args))) {
                        return [doBreak, handler.apply(this, testArgs)];
                    }
                    return [false];
                });
            };
        }

        for (var i in isa) {
            if (hasOwn.call(isa, i)) {
                addToSwitcher(i);
                addToTester(i);
            }
        }

        var is = extended.define(isa).expose(isa);
        is.tester = extended.define(tester);
        is.switcher = extended.define(switcher);
        return is;

    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineIsa(require("extended"));

        }
    } else if ("function" === typeof define && define.amd) {
        define(["extended"], function (extended) {
            return defineIsa(extended);
        });
    } else {
        this.isExtended = defineIsa(this.extended);
    }

}).call(this);


})(require("__browserify_Buffer").Buffer)
},{"__browserify_Buffer":1,"extended":11}],17:[function(require,module,exports){
"use strict";

var hasOwnProperty = Object.prototype.hasOwnProperty;
var MANGLE_STRING = "~";

function mangle(key) {
    return MANGLE_STRING + key;
}

function unmangle(key) {
    return key.substring(MANGLE_STRING.length);
}

function methods(obj, methodHash) {
    for (var methodName in methodHash) {
        Object.defineProperty(obj, methodName, {
            value: methodHash[methodName],
            configurable: true,
            writable: true
        });
    }
}

function assertString(key) {
    if (typeof key !== "string") {
        throw new TypeError("key must be a string.");
    }
}

module.exports = function (initializer) {
    var store = Object.create(null);
    var size = 0;

    var dict = {};
    methods(dict, {
        get: function (key, defaultValue) {
            assertString(key);
            var mangled = mangle(key);
            return mangled in store ? store[mangled] : defaultValue;
        },
        set: function (key, value) {
            assertString(key);

            var mangled = mangle(key);
            if (!(mangled in store)) {
                ++size;
            }

            return store[mangled] = value;
        },
        has: function (key) {
            assertString(key);
            return mangle(key) in store;
        },
        delete: function (key) {
            assertString(key);

            var mangled = mangle(key);
            if (mangled in store) {
                --size;
                delete store[mangled];
                return true;
            }

            return false;
        },
        clear: function () {
            store = Object.create(null);
            size = 0;
        },
        forEach: function (callback, thisArg) {
            if (typeof callback !== "function") {
                throw new TypeError("`callback` must be a function");
            }

            for (var mangledKey in store) {
                if (hasOwnProperty.call(store, mangledKey)) {
                    var key = unmangle(mangledKey);
                    var value = store[mangledKey];

                    callback.call(thisArg, value, key, dict);
                }
            }
        }
    });

    Object.defineProperty(dict, "size", {
        get: function () {
            return size;
        },
        configurable: true
    });

    if (typeof initializer === "object" && initializer !== null) {
        Object.keys(initializer).forEach(function (key) {
            dict.set(key, initializer[key]);
        });
    }

    return dict;
};

},{}],18:[function(require,module,exports){
(function(){/*
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Kris Kowal <kris.kowal@cixar.com>
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*jslint bitwise:true plusplus:true */
/*global esprima:true, define:true, exports:true, window: true,
throwError: true, createLiteral: true, generateStatement: true,
parseAssignmentExpression: true, parseBlock: true, parseExpression: true,
parseFunctionDeclaration: true, parseFunctionExpression: true,
parseFunctionSourceElements: true, parseVariableIdentifier: true,
parseLeftHandSideExpression: true,
parseStatement: true, parseSourceElement: true */

(function (root, factory) {
    'use strict';

    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
    // Rhino, and plain browser loading.
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory((root.esprima = {}));
    }
}(this, function (exports) {
    'use strict';

    var Token,
        TokenName,
        Syntax,
        PropertyKind,
        Messages,
        Regex,
        source,
        strict,
        index,
        lineNumber,
        lineStart,
        length,
        buffer,
        state,
        extra;

    Token = {
        BooleanLiteral: 1,
        EOF: 2,
        Identifier: 3,
        Keyword: 4,
        NullLiteral: 5,
        NumericLiteral: 6,
        Punctuator: 7,
        StringLiteral: 8
    };

    TokenName = {};
    TokenName[Token.BooleanLiteral] = 'Boolean';
    TokenName[Token.EOF] = '<end>';
    TokenName[Token.Identifier] = 'Identifier';
    TokenName[Token.Keyword] = 'Keyword';
    TokenName[Token.NullLiteral] = 'Null';
    TokenName[Token.NumericLiteral] = 'Numeric';
    TokenName[Token.Punctuator] = 'Punctuator';
    TokenName[Token.StringLiteral] = 'String';

    Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        ArrayExpression: 'ArrayExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DoWhileStatement: 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        Program: 'Program',
        Property: 'Property',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SwitchStatement: 'SwitchStatement',
        SwitchCase: 'SwitchCase',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement'
    };

    PropertyKind = {
        Data: 1,
        Get: 2,
        Set: 4
    };

    // Error messages should be identical to V8.
    Messages = {
        UnexpectedToken:  'Unexpected token %0',
        UnexpectedNumber:  'Unexpected number',
        UnexpectedString:  'Unexpected string',
        UnexpectedIdentifier:  'Unexpected identifier',
        UnexpectedReserved:  'Unexpected reserved word',
        UnexpectedEOS:  'Unexpected end of input',
        NewlineAfterThrow:  'Illegal newline after throw',
        InvalidRegExp: 'Invalid regular expression',
        UnterminatedRegExp:  'Invalid regular expression: missing /',
        InvalidLHSInAssignment:  'Invalid left-hand side in assignment',
        InvalidLHSInForIn:  'Invalid left-hand side in for-in',
        MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
        NoCatchOrFinally:  'Missing catch or finally after try',
        UnknownLabel: 'Undefined label \'%0\'',
        Redeclaration: '%0 \'%1\' has already been declared',
        IllegalContinue: 'Illegal continue statement',
        IllegalBreak: 'Illegal break statement',
        IllegalReturn: 'Illegal return statement',
        StrictModeWith:  'Strict mode code may not include a with statement',
        StrictCatchVariable:  'Catch variable may not be eval or arguments in strict mode',
        StrictVarName:  'Variable name may not be eval or arguments in strict mode',
        StrictParamName:  'Parameter name eval or arguments is not allowed in strict mode',
        StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
        StrictFunctionName:  'Function name may not be eval or arguments in strict mode',
        StrictOctalLiteral:  'Octal literals are not allowed in strict mode.',
        StrictDelete:  'Delete of an unqualified identifier in strict mode.',
        StrictDuplicateProperty:  'Duplicate data property in object literal not allowed in strict mode',
        AccessorDataProperty:  'Object literal may not have data and accessor property with the same name',
        AccessorGetSet:  'Object literal may not have multiple get/set accessors with the same name',
        StrictLHSAssignment:  'Assignment to eval or arguments is not allowed in strict mode',
        StrictLHSPostfix:  'Postfix increment/decrement may not have eval or arguments operand in strict mode',
        StrictLHSPrefix:  'Prefix increment/decrement may not have eval or arguments operand in strict mode',
        StrictReservedWord:  'Use of future reserved word in strict mode'
    };

    // See also tools/generate-unicode-regex.py.
    Regex = {
        NonAsciiIdentifierStart: new RegExp('[\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]'),
        NonAsciiIdentifierPart: new RegExp('[\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0300-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u0483-\u0487\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u05d0-\u05ea\u05f0-\u05f2\u0610-\u061a\u0620-\u0669\u066e-\u06d3\u06d5-\u06dc\u06df-\u06e8\u06ea-\u06fc\u06ff\u0710-\u074a\u074d-\u07b1\u07c0-\u07f5\u07fa\u0800-\u082d\u0840-\u085b\u08a0\u08a2-\u08ac\u08e4-\u08fe\u0900-\u0963\u0966-\u096f\u0971-\u0977\u0979-\u097f\u0981-\u0983\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bc-\u09c4\u09c7\u09c8\u09cb-\u09ce\u09d7\u09dc\u09dd\u09df-\u09e3\u09e6-\u09f1\u0a01-\u0a03\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a59-\u0a5c\u0a5e\u0a66-\u0a75\u0a81-\u0a83\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abc-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ad0\u0ae0-\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3c-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5c\u0b5d\u0b5f-\u0b63\u0b66-\u0b6f\u0b71\u0b82\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd0\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c58\u0c59\u0c60-\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbc-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0cde\u0ce0-\u0ce3\u0ce6-\u0cef\u0cf1\u0cf2\u0d02\u0d03\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d-\u0d44\u0d46-\u0d48\u0d4a-\u0d4e\u0d57\u0d60-\u0d63\u0d66-\u0d6f\u0d7a-\u0d7f\u0d82\u0d83\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e01-\u0e3a\u0e40-\u0e4e\u0e50-\u0e59\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb9\u0ebb-\u0ebd\u0ec0-\u0ec4\u0ec6\u0ec8-\u0ecd\u0ed0-\u0ed9\u0edc-\u0edf\u0f00\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e-\u0f47\u0f49-\u0f6c\u0f71-\u0f84\u0f86-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1049\u1050-\u109d\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u135d-\u135f\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176c\u176e-\u1770\u1772\u1773\u1780-\u17d3\u17d7\u17dc\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1820-\u1877\u1880-\u18aa\u18b0-\u18f5\u1900-\u191c\u1920-\u192b\u1930-\u193b\u1946-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u19d0-\u19d9\u1a00-\u1a1b\u1a20-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1aa7\u1b00-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1bf3\u1c00-\u1c37\u1c40-\u1c49\u1c4d-\u1c7d\u1cd0-\u1cd2\u1cd4-\u1cf6\u1d00-\u1de6\u1dfc-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u200c\u200d\u203f\u2040\u2054\u2071\u207f\u2090-\u209c\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d7f-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2de0-\u2dff\u2e2f\u3005-\u3007\u3021-\u302f\u3031-\u3035\u3038-\u303c\u3041-\u3096\u3099\u309a\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua62b\ua640-\ua66f\ua674-\ua67d\ua67f-\ua697\ua69f-\ua6f1\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua827\ua840-\ua873\ua880-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f7\ua8fb\ua900-\ua92d\ua930-\ua953\ua960-\ua97c\ua980-\ua9c0\ua9cf-\ua9d9\uaa00-\uaa36\uaa40-\uaa4d\uaa50-\uaa59\uaa60-\uaa76\uaa7a\uaa7b\uaa80-\uaac2\uaadb-\uaadd\uaae0-\uaaef\uaaf2-\uaaf6\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabea\uabec\uabed\uabf0-\uabf9\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\ufe70-\ufe74\ufe76-\ufefc\uff10-\uff19\uff21-\uff3a\uff3f\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]')
    };

    // Ensure the condition is true, otherwise throw an error.
    // This is only to have a better contract semantic, i.e. another safety net
    // to catch a logic error. The condition shall be fulfilled in normal case.
    // Do NOT use this to enforce a certain condition on any user input.

    function assert(condition, message) {
        if (!condition) {
            throw new Error('ASSERT: ' + message);
        }
    }

    function sliceSource(from, to) {
        return source.slice(from, to);
    }

    if (typeof 'esprima'[0] === 'undefined') {
        sliceSource = function sliceArraySource(from, to) {
            return source.slice(from, to).join('');
        };
    }

    function isDecimalDigit(ch) {
        return '0123456789'.indexOf(ch) >= 0;
    }

    function isHexDigit(ch) {
        return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
    }

    function isOctalDigit(ch) {
        return '01234567'.indexOf(ch) >= 0;
    }


    // 7.2 White Space

    function isWhiteSpace(ch) {
        return (ch === ' ') || (ch === '\u0009') || (ch === '\u000B') ||
            (ch === '\u000C') || (ch === '\u00A0') ||
            (ch.charCodeAt(0) >= 0x1680 &&
             '\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\uFEFF'.indexOf(ch) >= 0);
    }

    // 7.3 Line Terminators

    function isLineTerminator(ch) {
        return (ch === '\n' || ch === '\r' || ch === '\u2028' || ch === '\u2029');
    }

    // 7.6 Identifier Names and Identifiers

    function isIdentifierStart(ch) {
        return (ch === '$') || (ch === '_') || (ch === '\\') ||
            (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') ||
            ((ch.charCodeAt(0) >= 0x80) && Regex.NonAsciiIdentifierStart.test(ch));
    }

    function isIdentifierPart(ch) {
        return (ch === '$') || (ch === '_') || (ch === '\\') ||
            (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') ||
            ((ch >= '0') && (ch <= '9')) ||
            ((ch.charCodeAt(0) >= 0x80) && Regex.NonAsciiIdentifierPart.test(ch));
    }

    // 7.6.1.2 Future Reserved Words

    function isFutureReservedWord(id) {
        switch (id) {

        // Future reserved words.
        case 'class':
        case 'enum':
        case 'export':
        case 'extends':
        case 'import':
        case 'super':
            return true;
        }

        return false;
    }

    function isStrictModeReservedWord(id) {
        switch (id) {

        // Strict Mode reserved words.
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'yield':
        case 'let':
            return true;
        }

        return false;
    }

    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }

    // 7.6.1.1 Keywords

    function isKeyword(id) {
        var keyword = false;
        switch (id.length) {
        case 2:
            keyword = (id === 'if') || (id === 'in') || (id === 'do');
            break;
        case 3:
            keyword = (id === 'var') || (id === 'for') || (id === 'new') || (id === 'try');
            break;
        case 4:
            keyword = (id === 'this') || (id === 'else') || (id === 'case') || (id === 'void') || (id === 'with');
            break;
        case 5:
            keyword = (id === 'while') || (id === 'break') || (id === 'catch') || (id === 'throw');
            break;
        case 6:
            keyword = (id === 'return') || (id === 'typeof') || (id === 'delete') || (id === 'switch');
            break;
        case 7:
            keyword = (id === 'default') || (id === 'finally');
            break;
        case 8:
            keyword = (id === 'function') || (id === 'continue') || (id === 'debugger');
            break;
        case 10:
            keyword = (id === 'instanceof');
            break;
        }

        if (keyword) {
            return true;
        }

        switch (id) {
        // Future reserved words.
        // 'const' is specialized as Keyword in V8.
        case 'const':
            return true;

        // For compatiblity to SpiderMonkey and ES.next
        case 'yield':
        case 'let':
            return true;
        }

        if (strict && isStrictModeReservedWord(id)) {
            return true;
        }

        return isFutureReservedWord(id);
    }

    // 7.4 Comments

    function skipComment() {
        var ch, blockComment, lineComment;

        blockComment = false;
        lineComment = false;

        while (index < length) {
            ch = source[index];

            if (lineComment) {
                ch = source[index++];
                if (isLineTerminator(ch)) {
                    lineComment = false;
                    if (ch === '\r' && source[index] === '\n') {
                        ++index;
                    }
                    ++lineNumber;
                    lineStart = index;
                }
            } else if (blockComment) {
                if (isLineTerminator(ch)) {
                    if (ch === '\r' && source[index + 1] === '\n') {
                        ++index;
                    }
                    ++lineNumber;
                    ++index;
                    lineStart = index;
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                } else {
                    ch = source[index++];
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                    if (ch === '*') {
                        ch = source[index];
                        if (ch === '/') {
                            ++index;
                            blockComment = false;
                        }
                    }
                }
            } else if (ch === '/') {
                ch = source[index + 1];
                if (ch === '/') {
                    index += 2;
                    lineComment = true;
                } else if (ch === '*') {
                    index += 2;
                    blockComment = true;
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                } else {
                    break;
                }
            } else if (isWhiteSpace(ch)) {
                ++index;
            } else if (isLineTerminator(ch)) {
                ++index;
                if (ch ===  '\r' && source[index] === '\n') {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
            } else {
                break;
            }
        }
    }

    function scanHexEscape(prefix) {
        var i, len, ch, code = 0;

        len = (prefix === 'u') ? 4 : 2;
        for (i = 0; i < len; ++i) {
            if (index < length && isHexDigit(source[index])) {
                ch = source[index++];
                code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
            } else {
                return '';
            }
        }
        return String.fromCharCode(code);
    }

    function scanIdentifier() {
        var ch, start, id, restore;

        ch = source[index];
        if (!isIdentifierStart(ch)) {
            return;
        }

        start = index;
        if (ch === '\\') {
            ++index;
            if (source[index] !== 'u') {
                return;
            }
            ++index;
            restore = index;
            ch = scanHexEscape('u');
            if (ch) {
                if (ch === '\\' || !isIdentifierStart(ch)) {
                    return;
                }
                id = ch;
            } else {
                index = restore;
                id = 'u';
            }
        } else {
            id = source[index++];
        }

        while (index < length) {
            ch = source[index];
            if (!isIdentifierPart(ch)) {
                break;
            }
            if (ch === '\\') {
                ++index;
                if (source[index] !== 'u') {
                    return;
                }
                ++index;
                restore = index;
                ch = scanHexEscape('u');
                if (ch) {
                    if (ch === '\\' || !isIdentifierPart(ch)) {
                        return;
                    }
                    id += ch;
                } else {
                    index = restore;
                    id += 'u';
                }
            } else {
                id += source[index++];
            }
        }

        // There is no keyword or literal with only one character.
        // Thus, it must be an identifier.
        if (id.length === 1) {
            return {
                type: Token.Identifier,
                value: id,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (isKeyword(id)) {
            return {
                type: Token.Keyword,
                value: id,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        // 7.8.1 Null Literals

        if (id === 'null') {
            return {
                type: Token.NullLiteral,
                value: id,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        // 7.8.2 Boolean Literals

        if (id === 'true' || id === 'false') {
            return {
                type: Token.BooleanLiteral,
                value: id,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        return {
            type: Token.Identifier,
            value: id,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    // 7.7 Punctuators

    function scanPunctuator() {
        var start = index,
            ch1 = source[index],
            ch2,
            ch3,
            ch4;

        // Check for most common single-character punctuators.

        if (ch1 === ';' || ch1 === '{' || ch1 === '}') {
            ++index;
            return {
                type: Token.Punctuator,
                value: ch1,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === ',' || ch1 === '(' || ch1 === ')') {
            ++index;
            return {
                type: Token.Punctuator,
                value: ch1,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        // Dot (.) can also start a floating-point number, hence the need
        // to check the next character.

        ch2 = source[index + 1];
        if (ch1 === '.' && !isDecimalDigit(ch2)) {
            return {
                type: Token.Punctuator,
                value: source[index++],
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        // Peek more characters.

        ch3 = source[index + 2];
        ch4 = source[index + 3];

        // 4-character punctuator: >>>=

        if (ch1 === '>' && ch2 === '>' && ch3 === '>') {
            if (ch4 === '=') {
                index += 4;
                return {
                    type: Token.Punctuator,
                    value: '>>>=',
                    lineNumber: lineNumber,
                    lineStart: lineStart,
                    range: [start, index]
                };
            }
        }

        // 3-character punctuators: === !== >>> <<= >>=

        if (ch1 === '=' && ch2 === '=' && ch3 === '=') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '===',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === '!' && ch2 === '=' && ch3 === '=') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '!==',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === '>' && ch2 === '>' && ch3 === '>') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '>>>',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === '<' && ch2 === '<' && ch3 === '=') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '<<=',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === '>' && ch2 === '>' && ch3 === '=') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '>>=',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        // 2-character punctuators: <= >= == != ++ -- << >> && ||
        // += -= *= %= &= |= ^= /=

        if (ch2 === '=') {
            if ('<>=!+-*%&|^/'.indexOf(ch1) >= 0) {
                index += 2;
                return {
                    type: Token.Punctuator,
                    value: ch1 + ch2,
                    lineNumber: lineNumber,
                    lineStart: lineStart,
                    range: [start, index]
                };
            }
        }

        if (ch1 === ch2 && ('+-<>&|'.indexOf(ch1) >= 0)) {
            if ('+-<>&|'.indexOf(ch2) >= 0) {
                index += 2;
                return {
                    type: Token.Punctuator,
                    value: ch1 + ch2,
                    lineNumber: lineNumber,
                    lineStart: lineStart,
                    range: [start, index]
                };
            }
        }

        // The remaining 1-character punctuators.

        if ('[]<>+-*%&|^!~?:=/'.indexOf(ch1) >= 0) {
            return {
                type: Token.Punctuator,
                value: source[index++],
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }
    }

    // 7.8.3 Numeric Literals

    function scanNumericLiteral() {
        var number, start, ch;

        ch = source[index];
        assert(isDecimalDigit(ch) || (ch === '.'),
            'Numeric literal must start with a decimal digit or a decimal point');

        start = index;
        number = '';
        if (ch !== '.') {
            number = source[index++];
            ch = source[index];

            // Hex number starts with '0x'.
            // Octal number starts with '0'.
            if (number === '0') {
                if (ch === 'x' || ch === 'X') {
                    number += source[index++];
                    while (index < length) {
                        ch = source[index];
                        if (!isHexDigit(ch)) {
                            break;
                        }
                        number += source[index++];
                    }

                    if (number.length <= 2) {
                        // only 0x
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }

                    if (index < length) {
                        ch = source[index];
                        if (isIdentifierStart(ch)) {
                            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                        }
                    }
                    return {
                        type: Token.NumericLiteral,
                        value: parseInt(number, 16),
                        lineNumber: lineNumber,
                        lineStart: lineStart,
                        range: [start, index]
                    };
                } else if (isOctalDigit(ch)) {
                    number += source[index++];
                    while (index < length) {
                        ch = source[index];
                        if (!isOctalDigit(ch)) {
                            break;
                        }
                        number += source[index++];
                    }

                    if (index < length) {
                        ch = source[index];
                        if (isIdentifierStart(ch) || isDecimalDigit(ch)) {
                            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                        }
                    }
                    return {
                        type: Token.NumericLiteral,
                        value: parseInt(number, 8),
                        octal: true,
                        lineNumber: lineNumber,
                        lineStart: lineStart,
                        range: [start, index]
                    };
                }

                // decimal number starts with '0' such as '09' is illegal.
                if (isDecimalDigit(ch)) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
            }

            while (index < length) {
                ch = source[index];
                if (!isDecimalDigit(ch)) {
                    break;
                }
                number += source[index++];
            }
        }

        if (ch === '.') {
            number += source[index++];
            while (index < length) {
                ch = source[index];
                if (!isDecimalDigit(ch)) {
                    break;
                }
                number += source[index++];
            }
        }

        if (ch === 'e' || ch === 'E') {
            number += source[index++];

            ch = source[index];
            if (ch === '+' || ch === '-') {
                number += source[index++];
            }

            ch = source[index];
            if (isDecimalDigit(ch)) {
                number += source[index++];
                while (index < length) {
                    ch = source[index];
                    if (!isDecimalDigit(ch)) {
                        break;
                    }
                    number += source[index++];
                }
            } else {
                ch = 'character ' + ch;
                if (index >= length) {
                    ch = '<end>';
                }
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
        }

        if (index < length) {
            ch = source[index];
            if (isIdentifierStart(ch)) {
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
        }

        return {
            type: Token.NumericLiteral,
            value: parseFloat(number),
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    // 7.8.4 String Literals

    function scanStringLiteral() {
        var str = '', quote, start, ch, code, unescaped, restore, octal = false;

        quote = source[index];
        assert((quote === '\'' || quote === '"'),
            'String literal must starts with a quote');

        start = index;
        ++index;

        while (index < length) {
            ch = source[index++];

            if (ch === quote) {
                quote = '';
                break;
            } else if (ch === '\\') {
                ch = source[index++];
                if (!isLineTerminator(ch)) {
                    switch (ch) {
                    case 'n':
                        str += '\n';
                        break;
                    case 'r':
                        str += '\r';
                        break;
                    case 't':
                        str += '\t';
                        break;
                    case 'u':
                    case 'x':
                        restore = index;
                        unescaped = scanHexEscape(ch);
                        if (unescaped) {
                            str += unescaped;
                        } else {
                            index = restore;
                            str += ch;
                        }
                        break;
                    case 'b':
                        str += '\b';
                        break;
                    case 'f':
                        str += '\f';
                        break;
                    case 'v':
                        str += '\x0B';
                        break;

                    default:
                        if (isOctalDigit(ch)) {
                            code = '01234567'.indexOf(ch);

                            // \0 is not octal escape sequence
                            if (code !== 0) {
                                octal = true;
                            }

                            if (index < length && isOctalDigit(source[index])) {
                                octal = true;
                                code = code * 8 + '01234567'.indexOf(source[index++]);

                                // 3 digits are only allowed when string starts
                                // with 0, 1, 2, 3
                                if ('0123'.indexOf(ch) >= 0 &&
                                        index < length &&
                                        isOctalDigit(source[index])) {
                                    code = code * 8 + '01234567'.indexOf(source[index++]);
                                }
                            }
                            str += String.fromCharCode(code);
                        } else {
                            str += ch;
                        }
                        break;
                    }
                } else {
                    ++lineNumber;
                    if (ch ===  '\r' && source[index] === '\n') {
                        ++index;
                    }
                }
            } else if (isLineTerminator(ch)) {
                break;
            } else {
                str += ch;
            }
        }

        if (quote !== '') {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return {
            type: Token.StringLiteral,
            value: str,
            octal: octal,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    function scanRegExp() {
        var str, ch, start, pattern, flags, value, classMarker = false, restore, terminated = false;

        buffer = null;
        skipComment();

        start = index;
        ch = source[index];
        assert(ch === '/', 'Regular expression literal must start with a slash');
        str = source[index++];

        while (index < length) {
            ch = source[index++];
            str += ch;
            if (ch === '\\') {
                ch = source[index++];
                // ECMA-262 7.8.5
                if (isLineTerminator(ch)) {
                    throwError({}, Messages.UnterminatedRegExp);
                }
                str += ch;
            } else if (classMarker) {
                if (ch === ']') {
                    classMarker = false;
                }
            } else {
                if (ch === '/') {
                    terminated = true;
                    break;
                } else if (ch === '[') {
                    classMarker = true;
                } else if (isLineTerminator(ch)) {
                    throwError({}, Messages.UnterminatedRegExp);
                }
            }
        }

        if (!terminated) {
            throwError({}, Messages.UnterminatedRegExp);
        }

        // Exclude leading and trailing slash.
        pattern = str.substr(1, str.length - 2);

        flags = '';
        while (index < length) {
            ch = source[index];
            if (!isIdentifierPart(ch)) {
                break;
            }

            ++index;
            if (ch === '\\' && index < length) {
                ch = source[index];
                if (ch === 'u') {
                    ++index;
                    restore = index;
                    ch = scanHexEscape('u');
                    if (ch) {
                        flags += ch;
                        str += '\\u';
                        for (; restore < index; ++restore) {
                            str += source[restore];
                        }
                    } else {
                        index = restore;
                        flags += 'u';
                        str += '\\u';
                    }
                } else {
                    str += '\\';
                }
            } else {
                flags += ch;
                str += ch;
            }
        }

        try {
            value = new RegExp(pattern, flags);
        } catch (e) {
            throwError({}, Messages.InvalidRegExp);
        }

        return {
            literal: str,
            value: value,
            range: [start, index]
        };
    }

    function isIdentifierName(token) {
        return token.type === Token.Identifier ||
            token.type === Token.Keyword ||
            token.type === Token.BooleanLiteral ||
            token.type === Token.NullLiteral;
    }

    function advance() {
        var ch, token;

        skipComment();

        if (index >= length) {
            return {
                type: Token.EOF,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [index, index]
            };
        }

        token = scanPunctuator();
        if (typeof token !== 'undefined') {
            return token;
        }

        ch = source[index];

        if (ch === '\'' || ch === '"') {
            return scanStringLiteral();
        }

        if (ch === '.' || isDecimalDigit(ch)) {
            return scanNumericLiteral();
        }

        token = scanIdentifier();
        if (typeof token !== 'undefined') {
            return token;
        }

        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
    }

    function lex() {
        var token;

        if (buffer) {
            index = buffer.range[1];
            lineNumber = buffer.lineNumber;
            lineStart = buffer.lineStart;
            token = buffer;
            buffer = null;
            return token;
        }

        buffer = null;
        return advance();
    }

    function lookahead() {
        var pos, line, start;

        if (buffer !== null) {
            return buffer;
        }

        pos = index;
        line = lineNumber;
        start = lineStart;
        buffer = advance();
        index = pos;
        lineNumber = line;
        lineStart = start;

        return buffer;
    }

    // Return true if there is a line terminator before the next token.

    function peekLineTerminator() {
        var pos, line, start, found;

        pos = index;
        line = lineNumber;
        start = lineStart;
        skipComment();
        found = lineNumber !== line;
        index = pos;
        lineNumber = line;
        lineStart = start;

        return found;
    }

    // Throw an exception

    function throwError(token, messageFormat) {
        var error,
            args = Array.prototype.slice.call(arguments, 2),
            msg = messageFormat.replace(
                /%(\d)/g,
                function (whole, index) {
                    return args[index] || '';
                }
            );

        if (typeof token.lineNumber === 'number') {
            error = new Error('Line ' + token.lineNumber + ': ' + msg);
            error.index = token.range[0];
            error.lineNumber = token.lineNumber;
            error.column = token.range[0] - lineStart + 1;
        } else {
            error = new Error('Line ' + lineNumber + ': ' + msg);
            error.index = index;
            error.lineNumber = lineNumber;
            error.column = index - lineStart + 1;
        }

        throw error;
    }

    function throwErrorTolerant() {
        try {
            throwError.apply(null, arguments);
        } catch (e) {
            if (extra.errors) {
                extra.errors.push(e);
            } else {
                throw e;
            }
        }
    }


    // Throw an exception because of the token.

    function throwUnexpected(token) {
        if (token.type === Token.EOF) {
            throwError(token, Messages.UnexpectedEOS);
        }

        if (token.type === Token.NumericLiteral) {
            throwError(token, Messages.UnexpectedNumber);
        }

        if (token.type === Token.StringLiteral) {
            throwError(token, Messages.UnexpectedString);
        }

        if (token.type === Token.Identifier) {
            throwError(token, Messages.UnexpectedIdentifier);
        }

        if (token.type === Token.Keyword) {
            if (isFutureReservedWord(token.value)) {
                throwError(token, Messages.UnexpectedReserved);
            } else if (strict && isStrictModeReservedWord(token.value)) {
                throwErrorTolerant(token, Messages.StrictReservedWord);
                return;
            }
            throwError(token, Messages.UnexpectedToken, token.value);
        }

        // BooleanLiteral, NullLiteral, or Punctuator.
        throwError(token, Messages.UnexpectedToken, token.value);
    }

    // Expect the next token to match the specified punctuator.
    // If not, an exception will be thrown.

    function expect(value) {
        var token = lex();
        if (token.type !== Token.Punctuator || token.value !== value) {
            throwUnexpected(token);
        }
    }

    // Expect the next token to match the specified keyword.
    // If not, an exception will be thrown.

    function expectKeyword(keyword) {
        var token = lex();
        if (token.type !== Token.Keyword || token.value !== keyword) {
            throwUnexpected(token);
        }
    }

    // Return true if the next token matches the specified punctuator.

    function match(value) {
        var token = lookahead();
        return token.type === Token.Punctuator && token.value === value;
    }

    // Return true if the next token matches the specified keyword

    function matchKeyword(keyword) {
        var token = lookahead();
        return token.type === Token.Keyword && token.value === keyword;
    }

    // Return true if the next token is an assignment operator

    function matchAssign() {
        var token = lookahead(),
            op = token.value;

        if (token.type !== Token.Punctuator) {
            return false;
        }
        return op === '=' ||
            op === '*=' ||
            op === '/=' ||
            op === '%=' ||
            op === '+=' ||
            op === '-=' ||
            op === '<<=' ||
            op === '>>=' ||
            op === '>>>=' ||
            op === '&=' ||
            op === '^=' ||
            op === '|=';
    }

    function consumeSemicolon() {
        var token, line;

        // Catch the very common case first.
        if (source[index] === ';') {
            lex();
            return;
        }

        line = lineNumber;
        skipComment();
        if (lineNumber !== line) {
            return;
        }

        if (match(';')) {
            lex();
            return;
        }

        token = lookahead();
        if (token.type !== Token.EOF && !match('}')) {
            throwUnexpected(token);
        }
    }

    // Return true if provided expression is LeftHandSideExpression

    function isLeftHandSide(expr) {
        return expr.type === Syntax.Identifier || expr.type === Syntax.MemberExpression;
    }

    // 11.1.4 Array Initialiser

    function parseArrayInitialiser() {
        var elements = [];

        expect('[');

        while (!match(']')) {
            if (match(',')) {
                lex();
                elements.push(null);
            } else {
                elements.push(parseAssignmentExpression());

                if (!match(']')) {
                    expect(',');
                }
            }
        }

        expect(']');

        return {
            type: Syntax.ArrayExpression,
            elements: elements
        };
    }

    // 11.1.5 Object Initialiser

    function parsePropertyFunction(param, first) {
        var previousStrict, body;

        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (first && strict && isRestrictedWord(param[0].name)) {
            throwErrorTolerant(first, Messages.StrictParamName);
        }
        strict = previousStrict;

        return {
            type: Syntax.FunctionExpression,
            id: null,
            params: param,
            defaults: [],
            body: body,
            rest: null,
            generator: false,
            expression: false
        };
    }

    function parseObjectPropertyKey() {
        var token = lex();

        // Note: This function is called only from parseObjectProperty(), where
        // EOF and Punctuator tokens are already filtered out.

        if (token.type === Token.StringLiteral || token.type === Token.NumericLiteral) {
            if (strict && token.octal) {
                throwErrorTolerant(token, Messages.StrictOctalLiteral);
            }
            return createLiteral(token);
        }

        return {
            type: Syntax.Identifier,
            name: token.value
        };
    }

    function parseObjectProperty() {
        var token, key, id, param;

        token = lookahead();

        if (token.type === Token.Identifier) {

            id = parseObjectPropertyKey();

            // Property Assignment: Getter and Setter.

            if (token.value === 'get' && !match(':')) {
                key = parseObjectPropertyKey();
                expect('(');
                expect(')');
                return {
                    type: Syntax.Property,
                    key: key,
                    value: parsePropertyFunction([]),
                    kind: 'get'
                };
            } else if (token.value === 'set' && !match(':')) {
                key = parseObjectPropertyKey();
                expect('(');
                token = lookahead();
                if (token.type !== Token.Identifier) {
                    expect(')');
                    throwErrorTolerant(token, Messages.UnexpectedToken, token.value);
                    return {
                        type: Syntax.Property,
                        key: key,
                        value: parsePropertyFunction([]),
                        kind: 'set'
                    };
                } else {
                    param = [ parseVariableIdentifier() ];
                    expect(')');
                    return {
                        type: Syntax.Property,
                        key: key,
                        value: parsePropertyFunction(param, token),
                        kind: 'set'
                    };
                }
            } else {
                expect(':');
                return {
                    type: Syntax.Property,
                    key: id,
                    value: parseAssignmentExpression(),
                    kind: 'init'
                };
            }
        } else if (token.type === Token.EOF || token.type === Token.Punctuator) {
            throwUnexpected(token);
        } else {
            key = parseObjectPropertyKey();
            expect(':');
            return {
                type: Syntax.Property,
                key: key,
                value: parseAssignmentExpression(),
                kind: 'init'
            };
        }
    }

    function parseObjectInitialiser() {
        var properties = [], property, name, kind, map = {}, toString = String;

        expect('{');

        while (!match('}')) {
            property = parseObjectProperty();

            if (property.key.type === Syntax.Identifier) {
                name = property.key.name;
            } else {
                name = toString(property.key.value);
            }
            kind = (property.kind === 'init') ? PropertyKind.Data : (property.kind === 'get') ? PropertyKind.Get : PropertyKind.Set;
            if (Object.prototype.hasOwnProperty.call(map, name)) {
                if (map[name] === PropertyKind.Data) {
                    if (strict && kind === PropertyKind.Data) {
                        throwErrorTolerant({}, Messages.StrictDuplicateProperty);
                    } else if (kind !== PropertyKind.Data) {
                        throwErrorTolerant({}, Messages.AccessorDataProperty);
                    }
                } else {
                    if (kind === PropertyKind.Data) {
                        throwErrorTolerant({}, Messages.AccessorDataProperty);
                    } else if (map[name] & kind) {
                        throwErrorTolerant({}, Messages.AccessorGetSet);
                    }
                }
                map[name] |= kind;
            } else {
                map[name] = kind;
            }

            properties.push(property);

            if (!match('}')) {
                expect(',');
            }
        }

        expect('}');

        return {
            type: Syntax.ObjectExpression,
            properties: properties
        };
    }

    // 11.1.6 The Grouping Operator

    function parseGroupExpression() {
        var expr;

        expect('(');

        expr = parseExpression();

        expect(')');

        return expr;
    }


    // 11.1 Primary Expressions

    function parsePrimaryExpression() {
        var token = lookahead(),
            type = token.type;

        if (type === Token.Identifier) {
            return {
                type: Syntax.Identifier,
                name: lex().value
            };
        }

        if (type === Token.StringLiteral || type === Token.NumericLiteral) {
            if (strict && token.octal) {
                throwErrorTolerant(token, Messages.StrictOctalLiteral);
            }
            return createLiteral(lex());
        }

        if (type === Token.Keyword) {
            if (matchKeyword('this')) {
                lex();
                return {
                    type: Syntax.ThisExpression
                };
            }

            if (matchKeyword('function')) {
                return parseFunctionExpression();
            }
        }

        if (type === Token.BooleanLiteral) {
            lex();
            token.value = (token.value === 'true');
            return createLiteral(token);
        }

        if (type === Token.NullLiteral) {
            lex();
            token.value = null;
            return createLiteral(token);
        }

        if (match('[')) {
            return parseArrayInitialiser();
        }

        if (match('{')) {
            return parseObjectInitialiser();
        }

        if (match('(')) {
            return parseGroupExpression();
        }

        if (match('/') || match('/=')) {
            return createLiteral(scanRegExp());
        }

        return throwUnexpected(lex());
    }

    // 11.2 Left-Hand-Side Expressions

    function parseArguments() {
        var args = [];

        expect('(');

        if (!match(')')) {
            while (index < length) {
                args.push(parseAssignmentExpression());
                if (match(')')) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        return args;
    }

    function parseNonComputedProperty() {
        var token = lex();

        if (!isIdentifierName(token)) {
            throwUnexpected(token);
        }

        return {
            type: Syntax.Identifier,
            name: token.value
        };
    }

    function parseNonComputedMember() {
        expect('.');

        return parseNonComputedProperty();
    }

    function parseComputedMember() {
        var expr;

        expect('[');

        expr = parseExpression();

        expect(']');

        return expr;
    }

    function parseNewExpression() {
        var expr;

        expectKeyword('new');

        expr = {
            type: Syntax.NewExpression,
            callee: parseLeftHandSideExpression(),
            'arguments': []
        };

        if (match('(')) {
            expr['arguments'] = parseArguments();
        }

        return expr;
    }

    function parseLeftHandSideExpressionAllowCall() {
        var expr;

        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();

        while (match('.') || match('[') || match('(')) {
            if (match('(')) {
                expr = {
                    type: Syntax.CallExpression,
                    callee: expr,
                    'arguments': parseArguments()
                };
            } else if (match('[')) {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: true,
                    object: expr,
                    property: parseComputedMember()
                };
            } else {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: false,
                    object: expr,
                    property: parseNonComputedMember()
                };
            }
        }

        return expr;
    }


    function parseLeftHandSideExpression() {
        var expr;

        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();

        while (match('.') || match('[')) {
            if (match('[')) {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: true,
                    object: expr,
                    property: parseComputedMember()
                };
            } else {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: false,
                    object: expr,
                    property: parseNonComputedMember()
                };
            }
        }

        return expr;
    }

    // 11.3 Postfix Expressions

    function parsePostfixExpression() {
        var expr = parseLeftHandSideExpressionAllowCall(), token;

        token = lookahead();
        if (token.type !== Token.Punctuator) {
            return expr;
        }

        if ((match('++') || match('--')) && !peekLineTerminator()) {
            // 11.3.1, 11.3.2
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                throwErrorTolerant({}, Messages.StrictLHSPostfix);
            }
            if (!isLeftHandSide(expr)) {
                throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
            }

            expr = {
                type: Syntax.UpdateExpression,
                operator: lex().value,
                argument: expr,
                prefix: false
            };
        }

        return expr;
    }

    // 11.4 Unary Operators

    function parseUnaryExpression() {
        var token, expr;

        token = lookahead();
        if (token.type !== Token.Punctuator && token.type !== Token.Keyword) {
            return parsePostfixExpression();
        }

        if (match('++') || match('--')) {
            token = lex();
            expr = parseUnaryExpression();
            // 11.4.4, 11.4.5
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                throwErrorTolerant({}, Messages.StrictLHSPrefix);
            }

            if (!isLeftHandSide(expr)) {
                throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
            }

            expr = {
                type: Syntax.UpdateExpression,
                operator: token.value,
                argument: expr,
                prefix: true
            };
            return expr;
        }

        if (match('+') || match('-') || match('~') || match('!')) {
            expr = {
                type: Syntax.UnaryExpression,
                operator: lex().value,
                argument: parseUnaryExpression(),
                prefix: true
            };
            return expr;
        }

        if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
            expr = {
                type: Syntax.UnaryExpression,
                operator: lex().value,
                argument: parseUnaryExpression(),
                prefix: true
            };
            if (strict && expr.operator === 'delete' && expr.argument.type === Syntax.Identifier) {
                throwErrorTolerant({}, Messages.StrictDelete);
            }
            return expr;
        }

        return parsePostfixExpression();
    }

    // 11.5 Multiplicative Operators

    function parseMultiplicativeExpression() {
        var expr = parseUnaryExpression();

        while (match('*') || match('/') || match('%')) {
            expr = {
                type: Syntax.BinaryExpression,
                operator: lex().value,
                left: expr,
                right: parseUnaryExpression()
            };
        }

        return expr;
    }

    // 11.6 Additive Operators

    function parseAdditiveExpression() {
        var expr = parseMultiplicativeExpression();

        while (match('+') || match('-')) {
            expr = {
                type: Syntax.BinaryExpression,
                operator: lex().value,
                left: expr,
                right: parseMultiplicativeExpression()
            };
        }

        return expr;
    }

    // 11.7 Bitwise Shift Operators

    function parseShiftExpression() {
        var expr = parseAdditiveExpression();

        while (match('<<') || match('>>') || match('>>>')) {
            expr = {
                type: Syntax.BinaryExpression,
                operator: lex().value,
                left: expr,
                right: parseAdditiveExpression()
            };
        }

        return expr;
    }
    // 11.8 Relational Operators

    function parseRelationalExpression() {
        var expr, previousAllowIn;

        previousAllowIn = state.allowIn;
        state.allowIn = true;

        expr = parseShiftExpression();

        while (match('<') || match('>') || match('<=') || match('>=') || (previousAllowIn && matchKeyword('in')) || matchKeyword('instanceof')) {
            expr = {
                type: Syntax.BinaryExpression,
                operator: lex().value,
                left: expr,
                right: parseShiftExpression()
            };
        }

        state.allowIn = previousAllowIn;
        return expr;
    }

    // 11.9 Equality Operators

    function parseEqualityExpression() {
        var expr = parseRelationalExpression();

        while (match('==') || match('!=') || match('===') || match('!==')) {
            expr = {
                type: Syntax.BinaryExpression,
                operator: lex().value,
                left: expr,
                right: parseRelationalExpression()
            };
        }

        return expr;
    }

    // 11.10 Binary Bitwise Operators

    function parseBitwiseANDExpression() {
        var expr = parseEqualityExpression();

        while (match('&')) {
            lex();
            expr = {
                type: Syntax.BinaryExpression,
                operator: '&',
                left: expr,
                right: parseEqualityExpression()
            };
        }

        return expr;
    }

    function parseBitwiseXORExpression() {
        var expr = parseBitwiseANDExpression();

        while (match('^')) {
            lex();
            expr = {
                type: Syntax.BinaryExpression,
                operator: '^',
                left: expr,
                right: parseBitwiseANDExpression()
            };
        }

        return expr;
    }

    function parseBitwiseORExpression() {
        var expr = parseBitwiseXORExpression();

        while (match('|')) {
            lex();
            expr = {
                type: Syntax.BinaryExpression,
                operator: '|',
                left: expr,
                right: parseBitwiseXORExpression()
            };
        }

        return expr;
    }

    // 11.11 Binary Logical Operators

    function parseLogicalANDExpression() {
        var expr = parseBitwiseORExpression();

        while (match('&&')) {
            lex();
            expr = {
                type: Syntax.LogicalExpression,
                operator: '&&',
                left: expr,
                right: parseBitwiseORExpression()
            };
        }

        return expr;
    }

    function parseLogicalORExpression() {
        var expr = parseLogicalANDExpression();

        while (match('||')) {
            lex();
            expr = {
                type: Syntax.LogicalExpression,
                operator: '||',
                left: expr,
                right: parseLogicalANDExpression()
            };
        }

        return expr;
    }

    // 11.12 Conditional Operator

    function parseConditionalExpression() {
        var expr, previousAllowIn, consequent;

        expr = parseLogicalORExpression();

        if (match('?')) {
            lex();
            previousAllowIn = state.allowIn;
            state.allowIn = true;
            consequent = parseAssignmentExpression();
            state.allowIn = previousAllowIn;
            expect(':');

            expr = {
                type: Syntax.ConditionalExpression,
                test: expr,
                consequent: consequent,
                alternate: parseAssignmentExpression()
            };
        }

        return expr;
    }

    // 11.13 Assignment Operators

    function parseAssignmentExpression() {
        var token, expr;

        token = lookahead();
        expr = parseConditionalExpression();

        if (matchAssign()) {
            // LeftHandSideExpression
            if (!isLeftHandSide(expr)) {
                throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
            }

            // 11.13.1
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                throwErrorTolerant(token, Messages.StrictLHSAssignment);
            }

            expr = {
                type: Syntax.AssignmentExpression,
                operator: lex().value,
                left: expr,
                right: parseAssignmentExpression()
            };
        }

        return expr;
    }

    // 11.14 Comma Operator

    function parseExpression() {
        var expr = parseAssignmentExpression();

        if (match(',')) {
            expr = {
                type: Syntax.SequenceExpression,
                expressions: [ expr ]
            };

            while (index < length) {
                if (!match(',')) {
                    break;
                }
                lex();
                expr.expressions.push(parseAssignmentExpression());
            }

        }
        return expr;
    }

    // 12.1 Block

    function parseStatementList() {
        var list = [],
            statement;

        while (index < length) {
            if (match('}')) {
                break;
            }
            statement = parseSourceElement();
            if (typeof statement === 'undefined') {
                break;
            }
            list.push(statement);
        }

        return list;
    }

    function parseBlock() {
        var block;

        expect('{');

        block = parseStatementList();

        expect('}');

        return {
            type: Syntax.BlockStatement,
            body: block
        };
    }

    // 12.2 Variable Statement

    function parseVariableIdentifier() {
        var token = lex();

        if (token.type !== Token.Identifier) {
            throwUnexpected(token);
        }

        return {
            type: Syntax.Identifier,
            name: token.value
        };
    }

    function parseVariableDeclaration(kind) {
        var id = parseVariableIdentifier(),
            init = null;

        // 12.2.1
        if (strict && isRestrictedWord(id.name)) {
            throwErrorTolerant({}, Messages.StrictVarName);
        }

        if (kind === 'const') {
            expect('=');
            init = parseAssignmentExpression();
        } else if (match('=')) {
            lex();
            init = parseAssignmentExpression();
        }

        return {
            type: Syntax.VariableDeclarator,
            id: id,
            init: init
        };
    }

    function parseVariableDeclarationList(kind) {
        var list = [];

        do {
            list.push(parseVariableDeclaration(kind));
            if (!match(',')) {
                break;
            }
            lex();
        } while (index < length);

        return list;
    }

    function parseVariableStatement() {
        var declarations;

        expectKeyword('var');

        declarations = parseVariableDeclarationList();

        consumeSemicolon();

        return {
            type: Syntax.VariableDeclaration,
            declarations: declarations,
            kind: 'var'
        };
    }

    // kind may be `const` or `let`
    // Both are experimental and not in the specification yet.
    // see http://wiki.ecmascript.org/doku.php?id=harmony:const
    // and http://wiki.ecmascript.org/doku.php?id=harmony:let
    function parseConstLetDeclaration(kind) {
        var declarations;

        expectKeyword(kind);

        declarations = parseVariableDeclarationList(kind);

        consumeSemicolon();

        return {
            type: Syntax.VariableDeclaration,
            declarations: declarations,
            kind: kind
        };
    }

    // 12.3 Empty Statement

    function parseEmptyStatement() {
        expect(';');

        return {
            type: Syntax.EmptyStatement
        };
    }

    // 12.4 Expression Statement

    function parseExpressionStatement() {
        var expr = parseExpression();

        consumeSemicolon();

        return {
            type: Syntax.ExpressionStatement,
            expression: expr
        };
    }

    // 12.5 If statement

    function parseIfStatement() {
        var test, consequent, alternate;

        expectKeyword('if');

        expect('(');

        test = parseExpression();

        expect(')');

        consequent = parseStatement();

        if (matchKeyword('else')) {
            lex();
            alternate = parseStatement();
        } else {
            alternate = null;
        }

        return {
            type: Syntax.IfStatement,
            test: test,
            consequent: consequent,
            alternate: alternate
        };
    }

    // 12.6 Iteration Statements

    function parseDoWhileStatement() {
        var body, test, oldInIteration;

        expectKeyword('do');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        if (match(';')) {
            lex();
        }

        return {
            type: Syntax.DoWhileStatement,
            body: body,
            test: test
        };
    }

    function parseWhileStatement() {
        var test, body, oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        return {
            type: Syntax.WhileStatement,
            test: test,
            body: body
        };
    }

    function parseForVariableDeclaration() {
        var token = lex();

        return {
            type: Syntax.VariableDeclaration,
            declarations: parseVariableDeclarationList(),
            kind: token.value
        };
    }

    function parseForStatement() {
        var init, test, update, left, right, body, oldInIteration;

        init = test = update = null;

        expectKeyword('for');

        expect('(');

        if (match(';')) {
            lex();
        } else {
            if (matchKeyword('var') || matchKeyword('let')) {
                state.allowIn = false;
                init = parseForVariableDeclaration();
                state.allowIn = true;

                if (init.declarations.length === 1 && matchKeyword('in')) {
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                }
            } else {
                state.allowIn = false;
                init = parseExpression();
                state.allowIn = true;

                if (matchKeyword('in')) {
                    // LeftHandSideExpression
                    if (!isLeftHandSide(init)) {
                        throwErrorTolerant({}, Messages.InvalidLHSInForIn);
                    }

                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                }
            }

            if (typeof left === 'undefined') {
                expect(';');
            }
        }

        if (typeof left === 'undefined') {

            if (!match(';')) {
                test = parseExpression();
            }
            expect(';');

            if (!match(')')) {
                update = parseExpression();
            }
        }

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        if (typeof left === 'undefined') {
            return {
                type: Syntax.ForStatement,
                init: init,
                test: test,
                update: update,
                body: body
            };
        }

        return {
            type: Syntax.ForInStatement,
            left: left,
            right: right,
            body: body,
            each: false
        };
    }

    // 12.7 The continue statement

    function parseContinueStatement() {
        var token, label = null;

        expectKeyword('continue');

        // Optimize the most common form: 'continue;'.
        if (source[index] === ';') {
            lex();

            if (!state.inIteration) {
                throwError({}, Messages.IllegalContinue);
            }

            return {
                type: Syntax.ContinueStatement,
                label: null
            };
        }

        if (peekLineTerminator()) {
            if (!state.inIteration) {
                throwError({}, Messages.IllegalContinue);
            }

            return {
                type: Syntax.ContinueStatement,
                label: null
            };
        }

        token = lookahead();
        if (token.type === Token.Identifier) {
            label = parseVariableIdentifier();

            if (!Object.prototype.hasOwnProperty.call(state.labelSet, label.name)) {
                throwError({}, Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !state.inIteration) {
            throwError({}, Messages.IllegalContinue);
        }

        return {
            type: Syntax.ContinueStatement,
            label: label
        };
    }

    // 12.8 The break statement

    function parseBreakStatement() {
        var token, label = null;

        expectKeyword('break');

        // Optimize the most common form: 'break;'.
        if (source[index] === ';') {
            lex();

            if (!(state.inIteration || state.inSwitch)) {
                throwError({}, Messages.IllegalBreak);
            }

            return {
                type: Syntax.BreakStatement,
                label: null
            };
        }

        if (peekLineTerminator()) {
            if (!(state.inIteration || state.inSwitch)) {
                throwError({}, Messages.IllegalBreak);
            }

            return {
                type: Syntax.BreakStatement,
                label: null
            };
        }

        token = lookahead();
        if (token.type === Token.Identifier) {
            label = parseVariableIdentifier();

            if (!Object.prototype.hasOwnProperty.call(state.labelSet, label.name)) {
                throwError({}, Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !(state.inIteration || state.inSwitch)) {
            throwError({}, Messages.IllegalBreak);
        }

        return {
            type: Syntax.BreakStatement,
            label: label
        };
    }

    // 12.9 The return statement

    function parseReturnStatement() {
        var token, argument = null;

        expectKeyword('return');

        if (!state.inFunctionBody) {
            throwErrorTolerant({}, Messages.IllegalReturn);
        }

        // 'return' followed by a space and an identifier is very common.
        if (source[index] === ' ') {
            if (isIdentifierStart(source[index + 1])) {
                argument = parseExpression();
                consumeSemicolon();
                return {
                    type: Syntax.ReturnStatement,
                    argument: argument
                };
            }
        }

        if (peekLineTerminator()) {
            return {
                type: Syntax.ReturnStatement,
                argument: null
            };
        }

        if (!match(';')) {
            token = lookahead();
            if (!match('}') && token.type !== Token.EOF) {
                argument = parseExpression();
            }
        }

        consumeSemicolon();

        return {
            type: Syntax.ReturnStatement,
            argument: argument
        };
    }

    // 12.10 The with statement

    function parseWithStatement() {
        var object, body;

        if (strict) {
            throwErrorTolerant({}, Messages.StrictModeWith);
        }

        expectKeyword('with');

        expect('(');

        object = parseExpression();

        expect(')');

        body = parseStatement();

        return {
            type: Syntax.WithStatement,
            object: object,
            body: body
        };
    }

    // 12.10 The swith statement

    function parseSwitchCase() {
        var test,
            consequent = [],
            statement;

        if (matchKeyword('default')) {
            lex();
            test = null;
        } else {
            expectKeyword('case');
            test = parseExpression();
        }
        expect(':');

        while (index < length) {
            if (match('}') || matchKeyword('default') || matchKeyword('case')) {
                break;
            }
            statement = parseStatement();
            if (typeof statement === 'undefined') {
                break;
            }
            consequent.push(statement);
        }

        return {
            type: Syntax.SwitchCase,
            test: test,
            consequent: consequent
        };
    }

    function parseSwitchStatement() {
        var discriminant, cases, clause, oldInSwitch, defaultFound;

        expectKeyword('switch');

        expect('(');

        discriminant = parseExpression();

        expect(')');

        expect('{');

        cases = [];

        if (match('}')) {
            lex();
            return {
                type: Syntax.SwitchStatement,
                discriminant: discriminant,
                cases: cases
            };
        }

        oldInSwitch = state.inSwitch;
        state.inSwitch = true;
        defaultFound = false;

        while (index < length) {
            if (match('}')) {
                break;
            }
            clause = parseSwitchCase();
            if (clause.test === null) {
                if (defaultFound) {
                    throwError({}, Messages.MultipleDefaultsInSwitch);
                }
                defaultFound = true;
            }
            cases.push(clause);
        }

        state.inSwitch = oldInSwitch;

        expect('}');

        return {
            type: Syntax.SwitchStatement,
            discriminant: discriminant,
            cases: cases
        };
    }

    // 12.13 The throw statement

    function parseThrowStatement() {
        var argument;

        expectKeyword('throw');

        if (peekLineTerminator()) {
            throwError({}, Messages.NewlineAfterThrow);
        }

        argument = parseExpression();

        consumeSemicolon();

        return {
            type: Syntax.ThrowStatement,
            argument: argument
        };
    }

    // 12.14 The try statement

    function parseCatchClause() {
        var param;

        expectKeyword('catch');

        expect('(');
        if (match(')')) {
            throwUnexpected(lookahead());
        }

        param = parseVariableIdentifier();
        // 12.14.1
        if (strict && isRestrictedWord(param.name)) {
            throwErrorTolerant({}, Messages.StrictCatchVariable);
        }

        expect(')');

        return {
            type: Syntax.CatchClause,
            param: param,
            body: parseBlock()
        };
    }

    function parseTryStatement() {
        var block, handlers = [], finalizer = null;

        expectKeyword('try');

        block = parseBlock();

        if (matchKeyword('catch')) {
            handlers.push(parseCatchClause());
        }

        if (matchKeyword('finally')) {
            lex();
            finalizer = parseBlock();
        }

        if (handlers.length === 0 && !finalizer) {
            throwError({}, Messages.NoCatchOrFinally);
        }

        return {
            type: Syntax.TryStatement,
            block: block,
            guardedHandlers: [],
            handlers: handlers,
            finalizer: finalizer
        };
    }

    // 12.15 The debugger statement

    function parseDebuggerStatement() {
        expectKeyword('debugger');

        consumeSemicolon();

        return {
            type: Syntax.DebuggerStatement
        };
    }

    // 12 Statements

    function parseStatement() {
        var token = lookahead(),
            expr,
            labeledBody;

        if (token.type === Token.EOF) {
            throwUnexpected(token);
        }

        if (token.type === Token.Punctuator) {
            switch (token.value) {
            case ';':
                return parseEmptyStatement();
            case '{':
                return parseBlock();
            case '(':
                return parseExpressionStatement();
            default:
                break;
            }
        }

        if (token.type === Token.Keyword) {
            switch (token.value) {
            case 'break':
                return parseBreakStatement();
            case 'continue':
                return parseContinueStatement();
            case 'debugger':
                return parseDebuggerStatement();
            case 'do':
                return parseDoWhileStatement();
            case 'for':
                return parseForStatement();
            case 'function':
                return parseFunctionDeclaration();
            case 'if':
                return parseIfStatement();
            case 'return':
                return parseReturnStatement();
            case 'switch':
                return parseSwitchStatement();
            case 'throw':
                return parseThrowStatement();
            case 'try':
                return parseTryStatement();
            case 'var':
                return parseVariableStatement();
            case 'while':
                return parseWhileStatement();
            case 'with':
                return parseWithStatement();
            default:
                break;
            }
        }

        expr = parseExpression();

        // 12.12 Labelled Statements
        if ((expr.type === Syntax.Identifier) && match(':')) {
            lex();

            if (Object.prototype.hasOwnProperty.call(state.labelSet, expr.name)) {
                throwError({}, Messages.Redeclaration, 'Label', expr.name);
            }

            state.labelSet[expr.name] = true;
            labeledBody = parseStatement();
            delete state.labelSet[expr.name];

            return {
                type: Syntax.LabeledStatement,
                label: expr,
                body: labeledBody
            };
        }

        consumeSemicolon();

        return {
            type: Syntax.ExpressionStatement,
            expression: expr
        };
    }

    // 13 Function Definition

    function parseFunctionSourceElements() {
        var sourceElement, sourceElements = [], token, directive, firstRestricted,
            oldLabelSet, oldInIteration, oldInSwitch, oldInFunctionBody;

        expect('{');

        while (index < length) {
            token = lookahead();
            if (token.type !== Token.StringLiteral) {
                break;
            }

            sourceElement = parseSourceElement();
            sourceElements.push(sourceElement);
            if (sourceElement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = sliceSource(token.range[0] + 1, token.range[1] - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        oldLabelSet = state.labelSet;
        oldInIteration = state.inIteration;
        oldInSwitch = state.inSwitch;
        oldInFunctionBody = state.inFunctionBody;

        state.labelSet = {};
        state.inIteration = false;
        state.inSwitch = false;
        state.inFunctionBody = true;

        while (index < length) {
            if (match('}')) {
                break;
            }
            sourceElement = parseSourceElement();
            if (typeof sourceElement === 'undefined') {
                break;
            }
            sourceElements.push(sourceElement);
        }

        expect('}');

        state.labelSet = oldLabelSet;
        state.inIteration = oldInIteration;
        state.inSwitch = oldInSwitch;
        state.inFunctionBody = oldInFunctionBody;

        return {
            type: Syntax.BlockStatement,
            body: sourceElements
        };
    }

    function parseFunctionDeclaration() {
        var id, param, params = [], body, token, stricted, firstRestricted, message, previousStrict, paramSet;

        expectKeyword('function');
        token = lookahead();
        id = parseVariableIdentifier();
        if (strict) {
            if (isRestrictedWord(token.value)) {
                throwErrorTolerant(token, Messages.StrictFunctionName);
            }
        } else {
            if (isRestrictedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictFunctionName;
            } else if (isStrictModeReservedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictReservedWord;
            }
        }

        expect('(');

        if (!match(')')) {
            paramSet = {};
            while (index < length) {
                token = lookahead();
                param = parseVariableIdentifier();
                if (strict) {
                    if (isRestrictedWord(token.value)) {
                        stricted = token;
                        message = Messages.StrictParamName;
                    }
                    if (Object.prototype.hasOwnProperty.call(paramSet, token.value)) {
                        stricted = token;
                        message = Messages.StrictParamDupe;
                    }
                } else if (!firstRestricted) {
                    if (isRestrictedWord(token.value)) {
                        firstRestricted = token;
                        message = Messages.StrictParamName;
                    } else if (isStrictModeReservedWord(token.value)) {
                        firstRestricted = token;
                        message = Messages.StrictReservedWord;
                    } else if (Object.prototype.hasOwnProperty.call(paramSet, token.value)) {
                        firstRestricted = token;
                        message = Messages.StrictParamDupe;
                    }
                }
                params.push(param);
                paramSet[param.name] = true;
                if (match(')')) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwError(firstRestricted, message);
        }
        if (strict && stricted) {
            throwErrorTolerant(stricted, message);
        }
        strict = previousStrict;

        return {
            type: Syntax.FunctionDeclaration,
            id: id,
            params: params,
            defaults: [],
            body: body,
            rest: null,
            generator: false,
            expression: false
        };
    }

    function parseFunctionExpression() {
        var token, id = null, stricted, firstRestricted, message, param, params = [], body, previousStrict, paramSet;

        expectKeyword('function');

        if (!match('(')) {
            token = lookahead();
            id = parseVariableIdentifier();
            if (strict) {
                if (isRestrictedWord(token.value)) {
                    throwErrorTolerant(token, Messages.StrictFunctionName);
                }
            } else {
                if (isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        expect('(');

        if (!match(')')) {
            paramSet = {};
            while (index < length) {
                token = lookahead();
                param = parseVariableIdentifier();
                if (strict) {
                    if (isRestrictedWord(token.value)) {
                        stricted = token;
                        message = Messages.StrictParamName;
                    }
                    if (Object.prototype.hasOwnProperty.call(paramSet, token.value)) {
                        stricted = token;
                        message = Messages.StrictParamDupe;
                    }
                } else if (!firstRestricted) {
                    if (isRestrictedWord(token.value)) {
                        firstRestricted = token;
                        message = Messages.StrictParamName;
                    } else if (isStrictModeReservedWord(token.value)) {
                        firstRestricted = token;
                        message = Messages.StrictReservedWord;
                    } else if (Object.prototype.hasOwnProperty.call(paramSet, token.value)) {
                        firstRestricted = token;
                        message = Messages.StrictParamDupe;
                    }
                }
                params.push(param);
                paramSet[param.name] = true;
                if (match(')')) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwError(firstRestricted, message);
        }
        if (strict && stricted) {
            throwErrorTolerant(stricted, message);
        }
        strict = previousStrict;

        return {
            type: Syntax.FunctionExpression,
            id: id,
            params: params,
            defaults: [],
            body: body,
            rest: null,
            generator: false,
            expression: false
        };
    }

    // 14 Program

    function parseSourceElement() {
        var token = lookahead();

        if (token.type === Token.Keyword) {
            switch (token.value) {
            case 'const':
            case 'let':
                return parseConstLetDeclaration(token.value);
            case 'function':
                return parseFunctionDeclaration();
            default:
                return parseStatement();
            }
        }

        if (token.type !== Token.EOF) {
            return parseStatement();
        }
    }

    function parseSourceElements() {
        var sourceElement, sourceElements = [], token, directive, firstRestricted;

        while (index < length) {
            token = lookahead();
            if (token.type !== Token.StringLiteral) {
                break;
            }

            sourceElement = parseSourceElement();
            sourceElements.push(sourceElement);
            if (sourceElement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = sliceSource(token.range[0] + 1, token.range[1] - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        while (index < length) {
            sourceElement = parseSourceElement();
            if (typeof sourceElement === 'undefined') {
                break;
            }
            sourceElements.push(sourceElement);
        }
        return sourceElements;
    }

    function parseProgram() {
        var program;
        strict = false;
        program = {
            type: Syntax.Program,
            body: parseSourceElements()
        };
        return program;
    }

    // The following functions are needed only when the option to preserve
    // the comments is active.

    function addComment(type, value, start, end, loc) {
        assert(typeof start === 'number', 'Comment must have valid position');

        // Because the way the actual token is scanned, often the comments
        // (if any) are skipped twice during the lexical analysis.
        // Thus, we need to skip adding a comment if the comment array already
        // handled it.
        if (extra.comments.length > 0) {
            if (extra.comments[extra.comments.length - 1].range[1] > start) {
                return;
            }
        }

        extra.comments.push({
            type: type,
            value: value,
            range: [start, end],
            loc: loc
        });
    }

    function scanComment() {
        var comment, ch, loc, start, blockComment, lineComment;

        comment = '';
        blockComment = false;
        lineComment = false;

        while (index < length) {
            ch = source[index];

            if (lineComment) {
                ch = source[index++];
                if (isLineTerminator(ch)) {
                    loc.end = {
                        line: lineNumber,
                        column: index - lineStart - 1
                    };
                    lineComment = false;
                    addComment('Line', comment, start, index - 1, loc);
                    if (ch === '\r' && source[index] === '\n') {
                        ++index;
                    }
                    ++lineNumber;
                    lineStart = index;
                    comment = '';
                } else if (index >= length) {
                    lineComment = false;
                    comment += ch;
                    loc.end = {
                        line: lineNumber,
                        column: length - lineStart
                    };
                    addComment('Line', comment, start, length, loc);
                } else {
                    comment += ch;
                }
            } else if (blockComment) {
                if (isLineTerminator(ch)) {
                    if (ch === '\r' && source[index + 1] === '\n') {
                        ++index;
                        comment += '\r\n';
                    } else {
                        comment += ch;
                    }
                    ++lineNumber;
                    ++index;
                    lineStart = index;
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                } else {
                    ch = source[index++];
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                    comment += ch;
                    if (ch === '*') {
                        ch = source[index];
                        if (ch === '/') {
                            comment = comment.substr(0, comment.length - 1);
                            blockComment = false;
                            ++index;
                            loc.end = {
                                line: lineNumber,
                                column: index - lineStart
                            };
                            addComment('Block', comment, start, index, loc);
                            comment = '';
                        }
                    }
                }
            } else if (ch === '/') {
                ch = source[index + 1];
                if (ch === '/') {
                    loc = {
                        start: {
                            line: lineNumber,
                            column: index - lineStart
                        }
                    };
                    start = index;
                    index += 2;
                    lineComment = true;
                    if (index >= length) {
                        loc.end = {
                            line: lineNumber,
                            column: index - lineStart
                        };
                        lineComment = false;
                        addComment('Line', comment, start, index, loc);
                    }
                } else if (ch === '*') {
                    start = index;
                    index += 2;
                    blockComment = true;
                    loc = {
                        start: {
                            line: lineNumber,
                            column: index - lineStart - 2
                        }
                    };
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                } else {
                    break;
                }
            } else if (isWhiteSpace(ch)) {
                ++index;
            } else if (isLineTerminator(ch)) {
                ++index;
                if (ch ===  '\r' && source[index] === '\n') {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
            } else {
                break;
            }
        }
    }

    function filterCommentLocation() {
        var i, entry, comment, comments = [];

        for (i = 0; i < extra.comments.length; ++i) {
            entry = extra.comments[i];
            comment = {
                type: entry.type,
                value: entry.value
            };
            if (extra.range) {
                comment.range = entry.range;
            }
            if (extra.loc) {
                comment.loc = entry.loc;
            }
            comments.push(comment);
        }

        extra.comments = comments;
    }

    function collectToken() {
        var start, loc, token, range, value;

        skipComment();
        start = index;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        token = extra.advance();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        if (token.type !== Token.EOF) {
            range = [token.range[0], token.range[1]];
            value = sliceSource(token.range[0], token.range[1]);
            extra.tokens.push({
                type: TokenName[token.type],
                value: value,
                range: range,
                loc: loc
            });
        }

        return token;
    }

    function collectRegex() {
        var pos, loc, regex, token;

        skipComment();

        pos = index;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        regex = extra.scanRegExp();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        // Pop the previous token, which is likely '/' or '/='
        if (extra.tokens.length > 0) {
            token = extra.tokens[extra.tokens.length - 1];
            if (token.range[0] === pos && token.type === 'Punctuator') {
                if (token.value === '/' || token.value === '/=') {
                    extra.tokens.pop();
                }
            }
        }

        extra.tokens.push({
            type: 'RegularExpression',
            value: regex.literal,
            range: [pos, index],
            loc: loc
        });

        return regex;
    }

    function filterTokenLocation() {
        var i, entry, token, tokens = [];

        for (i = 0; i < extra.tokens.length; ++i) {
            entry = extra.tokens[i];
            token = {
                type: entry.type,
                value: entry.value
            };
            if (extra.range) {
                token.range = entry.range;
            }
            if (extra.loc) {
                token.loc = entry.loc;
            }
            tokens.push(token);
        }

        extra.tokens = tokens;
    }

    function createLiteral(token) {
        return {
            type: Syntax.Literal,
            value: token.value
        };
    }

    function createRawLiteral(token) {
        return {
            type: Syntax.Literal,
            value: token.value,
            raw: sliceSource(token.range[0], token.range[1])
        };
    }

    function createLocationMarker() {
        var marker = {};

        marker.range = [index, index];
        marker.loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            },
            end: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        marker.end = function () {
            this.range[1] = index;
            this.loc.end.line = lineNumber;
            this.loc.end.column = index - lineStart;
        };

        marker.applyGroup = function (node) {
            if (extra.range) {
                node.groupRange = [this.range[0], this.range[1]];
            }
            if (extra.loc) {
                node.groupLoc = {
                    start: {
                        line: this.loc.start.line,
                        column: this.loc.start.column
                    },
                    end: {
                        line: this.loc.end.line,
                        column: this.loc.end.column
                    }
                };
            }
        };

        marker.apply = function (node) {
            if (extra.range) {
                node.range = [this.range[0], this.range[1]];
            }
            if (extra.loc) {
                node.loc = {
                    start: {
                        line: this.loc.start.line,
                        column: this.loc.start.column
                    },
                    end: {
                        line: this.loc.end.line,
                        column: this.loc.end.column
                    }
                };
            }
        };

        return marker;
    }

    function trackGroupExpression() {
        var marker, expr;

        skipComment();
        marker = createLocationMarker();
        expect('(');

        expr = parseExpression();

        expect(')');

        marker.end();
        marker.applyGroup(expr);

        return expr;
    }

    function trackLeftHandSideExpression() {
        var marker, expr;

        skipComment();
        marker = createLocationMarker();

        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();

        while (match('.') || match('[')) {
            if (match('[')) {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: true,
                    object: expr,
                    property: parseComputedMember()
                };
                marker.end();
                marker.apply(expr);
            } else {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: false,
                    object: expr,
                    property: parseNonComputedMember()
                };
                marker.end();
                marker.apply(expr);
            }
        }

        return expr;
    }

    function trackLeftHandSideExpressionAllowCall() {
        var marker, expr;

        skipComment();
        marker = createLocationMarker();

        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();

        while (match('.') || match('[') || match('(')) {
            if (match('(')) {
                expr = {
                    type: Syntax.CallExpression,
                    callee: expr,
                    'arguments': parseArguments()
                };
                marker.end();
                marker.apply(expr);
            } else if (match('[')) {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: true,
                    object: expr,
                    property: parseComputedMember()
                };
                marker.end();
                marker.apply(expr);
            } else {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: false,
                    object: expr,
                    property: parseNonComputedMember()
                };
                marker.end();
                marker.apply(expr);
            }
        }

        return expr;
    }

    function filterGroup(node) {
        var n, i, entry;

        n = (Object.prototype.toString.apply(node) === '[object Array]') ? [] : {};
        for (i in node) {
            if (node.hasOwnProperty(i) && i !== 'groupRange' && i !== 'groupLoc') {
                entry = node[i];
                if (entry === null || typeof entry !== 'object' || entry instanceof RegExp) {
                    n[i] = entry;
                } else {
                    n[i] = filterGroup(entry);
                }
            }
        }
        return n;
    }

    function wrapTrackingFunction(range, loc) {

        return function (parseFunction) {

            function isBinary(node) {
                return node.type === Syntax.LogicalExpression ||
                    node.type === Syntax.BinaryExpression;
            }

            function visit(node) {
                var start, end;

                if (isBinary(node.left)) {
                    visit(node.left);
                }
                if (isBinary(node.right)) {
                    visit(node.right);
                }

                if (range) {
                    if (node.left.groupRange || node.right.groupRange) {
                        start = node.left.groupRange ? node.left.groupRange[0] : node.left.range[0];
                        end = node.right.groupRange ? node.right.groupRange[1] : node.right.range[1];
                        node.range = [start, end];
                    } else if (typeof node.range === 'undefined') {
                        start = node.left.range[0];
                        end = node.right.range[1];
                        node.range = [start, end];
                    }
                }
                if (loc) {
                    if (node.left.groupLoc || node.right.groupLoc) {
                        start = node.left.groupLoc ? node.left.groupLoc.start : node.left.loc.start;
                        end = node.right.groupLoc ? node.right.groupLoc.end : node.right.loc.end;
                        node.loc = {
                            start: start,
                            end: end
                        };
                    } else if (typeof node.loc === 'undefined') {
                        node.loc = {
                            start: node.left.loc.start,
                            end: node.right.loc.end
                        };
                    }
                }
            }

            return function () {
                var marker, node;

                skipComment();

                marker = createLocationMarker();
                node = parseFunction.apply(null, arguments);
                marker.end();

                if (range && typeof node.range === 'undefined') {
                    marker.apply(node);
                }

                if (loc && typeof node.loc === 'undefined') {
                    marker.apply(node);
                }

                if (isBinary(node)) {
                    visit(node);
                }

                return node;
            };
        };
    }

    function patch() {

        var wrapTracking;

        if (extra.comments) {
            extra.skipComment = skipComment;
            skipComment = scanComment;
        }

        if (extra.raw) {
            extra.createLiteral = createLiteral;
            createLiteral = createRawLiteral;
        }

        if (extra.range || extra.loc) {

            extra.parseGroupExpression = parseGroupExpression;
            extra.parseLeftHandSideExpression = parseLeftHandSideExpression;
            extra.parseLeftHandSideExpressionAllowCall = parseLeftHandSideExpressionAllowCall;
            parseGroupExpression = trackGroupExpression;
            parseLeftHandSideExpression = trackLeftHandSideExpression;
            parseLeftHandSideExpressionAllowCall = trackLeftHandSideExpressionAllowCall;

            wrapTracking = wrapTrackingFunction(extra.range, extra.loc);

            extra.parseAdditiveExpression = parseAdditiveExpression;
            extra.parseAssignmentExpression = parseAssignmentExpression;
            extra.parseBitwiseANDExpression = parseBitwiseANDExpression;
            extra.parseBitwiseORExpression = parseBitwiseORExpression;
            extra.parseBitwiseXORExpression = parseBitwiseXORExpression;
            extra.parseBlock = parseBlock;
            extra.parseFunctionSourceElements = parseFunctionSourceElements;
            extra.parseCatchClause = parseCatchClause;
            extra.parseComputedMember = parseComputedMember;
            extra.parseConditionalExpression = parseConditionalExpression;
            extra.parseConstLetDeclaration = parseConstLetDeclaration;
            extra.parseEqualityExpression = parseEqualityExpression;
            extra.parseExpression = parseExpression;
            extra.parseForVariableDeclaration = parseForVariableDeclaration;
            extra.parseFunctionDeclaration = parseFunctionDeclaration;
            extra.parseFunctionExpression = parseFunctionExpression;
            extra.parseLogicalANDExpression = parseLogicalANDExpression;
            extra.parseLogicalORExpression = parseLogicalORExpression;
            extra.parseMultiplicativeExpression = parseMultiplicativeExpression;
            extra.parseNewExpression = parseNewExpression;
            extra.parseNonComputedProperty = parseNonComputedProperty;
            extra.parseObjectProperty = parseObjectProperty;
            extra.parseObjectPropertyKey = parseObjectPropertyKey;
            extra.parsePostfixExpression = parsePostfixExpression;
            extra.parsePrimaryExpression = parsePrimaryExpression;
            extra.parseProgram = parseProgram;
            extra.parsePropertyFunction = parsePropertyFunction;
            extra.parseRelationalExpression = parseRelationalExpression;
            extra.parseStatement = parseStatement;
            extra.parseShiftExpression = parseShiftExpression;
            extra.parseSwitchCase = parseSwitchCase;
            extra.parseUnaryExpression = parseUnaryExpression;
            extra.parseVariableDeclaration = parseVariableDeclaration;
            extra.parseVariableIdentifier = parseVariableIdentifier;

            parseAdditiveExpression = wrapTracking(extra.parseAdditiveExpression);
            parseAssignmentExpression = wrapTracking(extra.parseAssignmentExpression);
            parseBitwiseANDExpression = wrapTracking(extra.parseBitwiseANDExpression);
            parseBitwiseORExpression = wrapTracking(extra.parseBitwiseORExpression);
            parseBitwiseXORExpression = wrapTracking(extra.parseBitwiseXORExpression);
            parseBlock = wrapTracking(extra.parseBlock);
            parseFunctionSourceElements = wrapTracking(extra.parseFunctionSourceElements);
            parseCatchClause = wrapTracking(extra.parseCatchClause);
            parseComputedMember = wrapTracking(extra.parseComputedMember);
            parseConditionalExpression = wrapTracking(extra.parseConditionalExpression);
            parseConstLetDeclaration = wrapTracking(extra.parseConstLetDeclaration);
            parseEqualityExpression = wrapTracking(extra.parseEqualityExpression);
            parseExpression = wrapTracking(extra.parseExpression);
            parseForVariableDeclaration = wrapTracking(extra.parseForVariableDeclaration);
            parseFunctionDeclaration = wrapTracking(extra.parseFunctionDeclaration);
            parseFunctionExpression = wrapTracking(extra.parseFunctionExpression);
            parseLeftHandSideExpression = wrapTracking(parseLeftHandSideExpression);
            parseLogicalANDExpression = wrapTracking(extra.parseLogicalANDExpression);
            parseLogicalORExpression = wrapTracking(extra.parseLogicalORExpression);
            parseMultiplicativeExpression = wrapTracking(extra.parseMultiplicativeExpression);
            parseNewExpression = wrapTracking(extra.parseNewExpression);
            parseNonComputedProperty = wrapTracking(extra.parseNonComputedProperty);
            parseObjectProperty = wrapTracking(extra.parseObjectProperty);
            parseObjectPropertyKey = wrapTracking(extra.parseObjectPropertyKey);
            parsePostfixExpression = wrapTracking(extra.parsePostfixExpression);
            parsePrimaryExpression = wrapTracking(extra.parsePrimaryExpression);
            parseProgram = wrapTracking(extra.parseProgram);
            parsePropertyFunction = wrapTracking(extra.parsePropertyFunction);
            parseRelationalExpression = wrapTracking(extra.parseRelationalExpression);
            parseStatement = wrapTracking(extra.parseStatement);
            parseShiftExpression = wrapTracking(extra.parseShiftExpression);
            parseSwitchCase = wrapTracking(extra.parseSwitchCase);
            parseUnaryExpression = wrapTracking(extra.parseUnaryExpression);
            parseVariableDeclaration = wrapTracking(extra.parseVariableDeclaration);
            parseVariableIdentifier = wrapTracking(extra.parseVariableIdentifier);
        }

        if (typeof extra.tokens !== 'undefined') {
            extra.advance = advance;
            extra.scanRegExp = scanRegExp;

            advance = collectToken;
            scanRegExp = collectRegex;
        }
    }

    function unpatch() {
        if (typeof extra.skipComment === 'function') {
            skipComment = extra.skipComment;
        }

        if (extra.raw) {
            createLiteral = extra.createLiteral;
        }

        if (extra.range || extra.loc) {
            parseAdditiveExpression = extra.parseAdditiveExpression;
            parseAssignmentExpression = extra.parseAssignmentExpression;
            parseBitwiseANDExpression = extra.parseBitwiseANDExpression;
            parseBitwiseORExpression = extra.parseBitwiseORExpression;
            parseBitwiseXORExpression = extra.parseBitwiseXORExpression;
            parseBlock = extra.parseBlock;
            parseFunctionSourceElements = extra.parseFunctionSourceElements;
            parseCatchClause = extra.parseCatchClause;
            parseComputedMember = extra.parseComputedMember;
            parseConditionalExpression = extra.parseConditionalExpression;
            parseConstLetDeclaration = extra.parseConstLetDeclaration;
            parseEqualityExpression = extra.parseEqualityExpression;
            parseExpression = extra.parseExpression;
            parseForVariableDeclaration = extra.parseForVariableDeclaration;
            parseFunctionDeclaration = extra.parseFunctionDeclaration;
            parseFunctionExpression = extra.parseFunctionExpression;
            parseGroupExpression = extra.parseGroupExpression;
            parseLeftHandSideExpression = extra.parseLeftHandSideExpression;
            parseLeftHandSideExpressionAllowCall = extra.parseLeftHandSideExpressionAllowCall;
            parseLogicalANDExpression = extra.parseLogicalANDExpression;
            parseLogicalORExpression = extra.parseLogicalORExpression;
            parseMultiplicativeExpression = extra.parseMultiplicativeExpression;
            parseNewExpression = extra.parseNewExpression;
            parseNonComputedProperty = extra.parseNonComputedProperty;
            parseObjectProperty = extra.parseObjectProperty;
            parseObjectPropertyKey = extra.parseObjectPropertyKey;
            parsePrimaryExpression = extra.parsePrimaryExpression;
            parsePostfixExpression = extra.parsePostfixExpression;
            parseProgram = extra.parseProgram;
            parsePropertyFunction = extra.parsePropertyFunction;
            parseRelationalExpression = extra.parseRelationalExpression;
            parseStatement = extra.parseStatement;
            parseShiftExpression = extra.parseShiftExpression;
            parseSwitchCase = extra.parseSwitchCase;
            parseUnaryExpression = extra.parseUnaryExpression;
            parseVariableDeclaration = extra.parseVariableDeclaration;
            parseVariableIdentifier = extra.parseVariableIdentifier;
        }

        if (typeof extra.scanRegExp === 'function') {
            advance = extra.advance;
            scanRegExp = extra.scanRegExp;
        }
    }

    function stringToArray(str) {
        var length = str.length,
            result = [],
            i;
        for (i = 0; i < length; ++i) {
            result[i] = str.charAt(i);
        }
        return result;
    }

    function parse(code, options) {
        var program, toString;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        length = source.length;
        buffer = null;
        state = {
            allowIn: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false
        };

        extra = {};
        if (typeof options !== 'undefined') {
            extra.range = (typeof options.range === 'boolean') && options.range;
            extra.loc = (typeof options.loc === 'boolean') && options.loc;
            extra.raw = (typeof options.raw === 'boolean') && options.raw;
            if (typeof options.tokens === 'boolean' && options.tokens) {
                extra.tokens = [];
            }
            if (typeof options.comment === 'boolean' && options.comment) {
                extra.comments = [];
            }
            if (typeof options.tolerant === 'boolean' && options.tolerant) {
                extra.errors = [];
            }
        }

        if (length > 0) {
            if (typeof source[0] === 'undefined') {
                // Try first to convert to a string. This is good as fast path
                // for old IE which understands string indexing for string
                // literals only and not for string object.
                if (code instanceof String) {
                    source = code.valueOf();
                }

                // Force accessing the characters via an array.
                if (typeof source[0] === 'undefined') {
                    source = stringToArray(code);
                }
            }
        }

        patch();
        try {
            program = parseProgram();
            if (typeof extra.comments !== 'undefined') {
                filterCommentLocation();
                program.comments = extra.comments;
            }
            if (typeof extra.tokens !== 'undefined') {
                filterTokenLocation();
                program.tokens = extra.tokens;
            }
            if (typeof extra.errors !== 'undefined') {
                program.errors = extra.errors;
            }
            if (extra.range || extra.loc) {
                program.body = filterGroup(program.body);
            }
        } catch (e) {
            throw e;
        } finally {
            unpatch();
            extra = {};
        }

        return program;
    }

    // Sync with package.json.
    exports.version = '1.0.4';

    exports.parse = parse;

    // Deep copy.
    exports.Syntax = (function () {
        var name, types = {};

        if (typeof Object.create === 'function') {
            types = Object.create(null);
        }

        for (name in Syntax) {
            if (Syntax.hasOwnProperty(name)) {
                types[name] = Syntax[name];
            }
        }

        if (typeof Object.freeze === 'function') {
            Object.freeze(types);
        }

        return types;
    }());

}));
/* vim: set sw=4 ts=4 et tw=80 : */

})()
},{}],19:[function(require,module,exports){
(function(global){function match(actual, body, thisArg) {
    // If body is not provided, then do a single-case ("irrefutable") match.
    if (typeof body === 'undefined') {
        return {
            // Now that we have the single case, do the match.
            when: function(pattern, template, thisArg) {
                return matchCases(actual, [{
                    pattern: pattern,
                    template: template,
                    thisArg: thisArg
                }]);
            }
        }
    }

    // If body is provided, call it to obtain the array of cases.
    var cases = [];

    if (typeof thisArg === 'undefined')
        thisArg = global;

    body.call(thisArg, function(pattern, template, thisArg) {
        cases.push({
            pattern: pattern,
            template: template,
            thisArg: thisArg
        });
    });

    // Now that we have all the cases, do the match.
    return matchCases(actual, cases);
}

function matchCases(actual, cases) {
    for (var i = 0, n = cases.length; i < n; i++) {
        var c = cases[i];
        try {
            var matches = {};
            matchPattern(c.pattern, actual, matches);
            return c.template
                 ? c.template.call(typeof c.thisArg === 'undefined' ? global : c.thisArg, matches)
                 : matches;
        } catch (e) {
            if (e instanceof MatchError)
                continue;
            throw e;
        }
    }
    throw new MatchError(cases, actual, "no more cases");
}

function MatchError(expected, actual, message) {
    Error.call(this, message);
    if (!('stack' in this))
        this.stack = (new Error).stack;
    this.expected = expected;
    this.actual = actual;
}

MatchError.prototype = Object.create(Error.prototype);
    
function matchPattern(pattern, actual, matches) {
    if (pattern instanceof Pattern) {
        pattern.match(actual, matches);
    } else if (Array.isArray(pattern)) {
        matchArray(pattern, actual, matches);
    } else if (typeof pattern === 'object') {
        if (!pattern)
            matchNull(actual);
        else if (pattern instanceof RegExp)
            matchRegExp(pattern, actual);
        else
            matchObject(pattern, actual, matches);
    } else if (typeof pattern === 'string') {
        matchString(pattern, actual);
    } else if (typeof pattern === 'number') {
        if (pattern !== pattern)
            matchNaN(actual);
        else
            matchNumber(pattern, actual);
    } else if (typeof pattern === 'boolean') {
        matchBoolean(pattern, actual);
    } else if (typeof pattern === 'function') {
        matchPredicate(pattern, actual);
    } else if (typeof pattern === 'undefined') {
        matchUndefined(actual);
    }
}

function matchNull(actual, matches) {
    if (actual !== null)
        throw new MatchError(null, actual, "not null");
}

function matchArray(arr, actual, matches) {
    if (typeof actual !== 'object')
        throw new MatchError(arr, actual, "not an object");
    if (!actual)
        throw new MatchError(arr, actual, "null");
    var n = arr.length;
    for (var i = 0; i < n; i++) {
        if (!(i in actual))
            throw new MatchError(arr, actual, "no element at index " + i);
        matchPattern(arr[i], actual[i], matches);
    }
}

var hasOwn = {}.hasOwnProperty;

function matchObject(obj, actual, matches) {
    if (typeof actual !== 'object')
        throw new MatchError(obj, actual, "not an object");
    if (!actual)
        throw new MatchError(obj, actual, "null");
    for (var key in obj) {
        if (!hasOwn.call(obj, key))
            continue;
        if (!(key in actual))
            throw new MatchError(obj, actual, "no property " + key);
        matchPattern(obj[key], actual[key], matches);
    }
}

function matchString(str, actual) {
    if (typeof actual !== 'string')
        throw new MatchError(str, actual, "not a string");
    if (actual !== str)
        throw new MatchError(str, actual, "wrong string value");
}

function matchRegExp(re, actual) {
    if (typeof actual !== 'string')
        throw new MatchError(re, actual, "not a string");
    if (!re.test(actual))
        throw new MatchError(re, actual, "regexp pattern match failed");
}

function matchNumber(num, actual) {
    if (typeof actual !== 'number')
        throw new MatchError(num, actual, "not a number");
    if (actual !== num)
        throw new MatchError(num, actual, "wrong number value");
}

function matchNaN(actual) {
    if (typeof actual !== 'number' || actual === actual)
        throw new MatchError(NaN, actual, "not NaN");
}

function matchPredicate(pred, actual) {
    if (!pred(actual))
        throw new MatchError(pred, actual, "predicate failed");
}

function matchBoolean(bool, actual) {
    if (typeof actual !== 'boolean')
        throw new MatchError(bool, actual, "not a boolean");
    if (actual !== bool)
        throw new MatchError(bool, actual, "wrong boolean value");
}

function matchUndefined(actual) {
    if (typeof actual !== 'undefined')
        throw new MatchError(undefined, actual, "not undefined");
}

function Pattern() {
}

function Var(name, pattern) {
    this._name = name;
    this._pattern = typeof pattern === 'undefined' ? Any : pattern;
}

Var.prototype = Object.create(Pattern.prototype);

Var.prototype.match = function Var_match(actual, matches) {
    matchPattern(this._pattern, actual, matches);
    matches[this._name] = actual;
};

var Any = Object.create(Pattern.prototype);

Any.match = function Any_match(actual) { };

match.var = function(name, pattern) {
    return new Var(name, pattern);
};

match.any = Any;

match.object = function(x) {
    return typeof x === 'object' && x;
}

match.array = Array.isArray;

match.primitive = function(x) {
    return x === null || typeof x !== 'object';
};

match.number = function(x) {
    return typeof x === 'number';
};

match.range = function(start, end) {
    return function(x) {
        return typeof x === 'number' &&
               x >= start &&
               x < end;
    };
};

var floor = Math.floor, abs = Math.abs;

function sign(x) {
    return x < 0 ? -1 : 1;
}

// Implements ECMA-262 ToInteger (ES5 9.4, Draft ES6 9.1.4)
function toInteger(x) {
    return (x !== x)
         ? 0
         : (x === 0 || x === -Infinity || x === Infinity)
         ? x
         : sign(x) * floor(abs(x));
}

match.negative = function(x) {
    return typeof x === 'number' && x < 0;
};

match.positive = function(x) {
    return typeof x === 'number' && x > 0;
};

match.nonnegative = function(x) {
    return typeof x === 'number' && x >= 0;
};

match.minusZero = function(x) {
    return x === 0 && 1/x === -Infinity;
};

match.plusZero = function(x) {
    return x === 0 && 1/x === Infinity;
};

match.finite = function(x) {
    return typeof x === 'number' && isFinite(x);
};

match.infinite = function(x) {
    return typeof x === 'number' && (x === Infinity || x === -Infinity);
};

match.integer = function(x) {
    return typeof x === 'number' && x === toInteger(x);
};

match.int32 = function(x) {
    return typeof x === 'number' && x === (x|0);
};

match.uint32 = function(x) {
    return typeof x === 'number' && x === (x>>>0);
};

match.string = function(x) {
    return typeof x === 'string';
};

match.boolean = function(x) {
    return typeof x === 'boolean';
};

match.null = function(x) {
    return x === null;
};

match.undefined = function(x) {
    return typeof x === 'undefined';
};

match.function = function(x) {
    return typeof x === 'function';
};

function All(patterns) {
    this.patterns = patterns;
}

All.prototype = Object.create(Pattern.prototype);

All.prototype.match = function(actual, matches) {
    // Try all patterns in a temporary scratch sub-match object.
    var temp = {};
    for (var i = 0, n = this.patterns.length; i < n; i++) {
        matchPattern(this.patterns[i], actual, temp);
    }

    // On success, commit all the sub-matches to the real sub-match object.
    for (var key in temp) {
        if (!hasOwn.call(temp, key))
            continue;
        matches[key] = temp[key];
    }
};

match.all = function() {
    return new All(arguments);
};

function Some(patterns) {
    this.patterns = patterns;
}

Some.prototype = Object.create(Pattern.prototype);

Some.prototype.match = function(actual, matches) {
    // Try each pattern in its own temporary scratch sub-match object.
    var temp;
    for (var i = 0, n = this.patterns.length; i < n; i++) {
        temp = {};
        try {
            matchPattern(this.patterns[i], actual, temp);

            // On success, commit the successful sub-matches to the real sub-match object.
            for (var key in temp) {
                if (!hasOwn.call(temp, key))
                    continue;
                matches[key] = temp[key];
            }

            return;
        } catch (e) {
            if (!(e instanceof MatchError))
                throw e;
        }
    }

    throw new MatchError("no alternates matched", actual, this);
};

match.some = function() {
    return new Some(arguments);
};

match.MatchError = MatchError;

match.pattern = Pattern.prototype;

module.exports = match;

})(self)
},{}]},{},[2])
;