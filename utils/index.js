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
// If errHandlers is defined, we delegate the decision to retry to the
// handlers. If no handler returns true, we do not retry, and return
// immediately. A handler is a generic function that takes an error as input
// and returns a boolean.
exports.genRetry = function * genRetry(genFunc, args, options) {
    const delayMs = options.delayMs || 5000;
    const maxRetries = options.maxRetries || 1;
    const log = options.log || undefined;
    const errHandlers = options.errHandlers || undefined;

    let retries = 0;
    while (true) {
        try {
            return yield * genFunc.apply(null, args);
        } catch (err) {
            if (errHandlers) {
                let retry = false;
                for (let handler of errHandlers) {
                    try {
                        retry = retry || handler(err);
                    } catch (handlerErr) {
                        if (log) {
                            log.error(`Retrying \'${genFunc.name}\', `
                                + `error handler \'${handler.name}\' `
                                + `threw error: ${handlerErr.toString()}`);
                        }
                    }
                }
                if (!retry)
                    throw err;
            }
            retries++;
            if (retries > maxRetries)
                throw err;
            if (log)
                log.debug(`Retrying \'${genFunc.name}\'. `
                    + `Caught error: ${err.toString()}`);
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
