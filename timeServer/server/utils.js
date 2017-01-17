/**
 * Copyright (c) 2015 Platform 9 Systems, Inc.
 */

'use strict';

exports.sleep = sleep;

function sleep(delay) {
    return new Promise((resolve) => setTimeout(resolve, delay));
};

// Wraps a promise so that it rejects if not resolved within specified timeout
exports.withTimeout = function withTimeout(promise, timeout) {
    return new Promise(prom);

    function prom(resolve, reject) {
        let timer = setTimeout(onTimeout, timeout);
        promise.then(onSuccess).catch(onError);

        function onTimeout() {
            if (timer !== undefined) {
                timer = undefined;
                reject(new Error('timeout'));
            }
        }

        function onSuccess() {
            if (timer !== undefined) {
                clearTimeout(timer);
                timer = undefined;
                resolve.apply(this, arguments);
            }
        }

        function onError() {
            if (timer !== undefined) {
                clearTimeout(timer);
                timer = undefined;
                reject.apply(this, arguments);
            }
        }
    }
}

// Wraps a promise such that if the promise rejects, an exception with a
// nice stack trace is thrown.
// Example: retval = wrapPromiseError(promiseReturningFunction());
exports.wrapPromiseError = function * wrapPromiseError(prom) {
    try {
        return yield prom;
    } catch (err) {
	Error.captureStackTrace(err);
	throw err;
    }
};

// Given a promise-returning function, returns a generator function that
// yields the promise's value if successful, or raises an exception with a
// nice-looking stack trace if failed.
exports.wrapPromiseFunction = function wrapPromiseFunction(fn) {
    return function * wrappedPromiseFunction() {
        return yield * exports.wrapPromiseError(fn.apply(this, arguments));
    }
};

// Given a generator function, a list of arguments to that function, and an
// options object, will call the generator function with arguments. If the
// generator function throws an error, will wait delayMs and call it again, up
// to maxTries times, before re-throwing the error.
exports.genRetry = function * genRetry(genFunc, args, options) {
    const delayMs = options.delayMs || 5000;
    const maxTries = options.maxTries || 6;
    const log = options.log || undefined;

    let numTries = 0;
    while (true) {
        try {
            return yield * genFunc.apply(null, args);
        } catch (err) {
            numTries++;
            if (numTries >= maxTries)
                throw err;
            if (log)
                log.debug(`genRetry will retry after ${delayMs}ms. Caught error: ${err.toString()}`);
            yield sleep(delayMs);
        }
    }
}

// Given an object and an array of property names, will remove any object
// property whose name is found in the array.
exports.deletePrivateFields = function deletePrivateFields(object, privateFields) {
    for (let field of privateFields) {
        delete object[field];
    }
}
