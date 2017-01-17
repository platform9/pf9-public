/**
 * Copyright (c) 2016 Platform 9 Systems, Inc.
 */

'use strict';

const co = require('co');
const wrap = co.wrap;

exports.apiLogger = apiLogger;
exports.failRequest = failRequest;

function apiLogger(log) {
    return wrap(function *(ctx, next) {
        const start = new Date();
        try {
            yield next();
            const ms = new Date() - start;
            let errMsg = '';
            if (ctx.status >= 400 && ctx.message)
                errMsg = '- ' + ctx.message;
            log.info(`${ctx.method} ${ctx.url} ${ctx.status} - ${ms}ms ${errMsg}`);
        } catch(error) {
            ctx.status = ctx.status || 500;
            log.error(`${ctx.method} ${ctx.url} ${ctx.status} - ${error}`);
            log.error(error.stack);
        }
    });
}

function failRequest(ctx, status, message) {
    ctx.status = status;
    ctx.message = message;
    ctx.body = {
        error: {
            message: message,
            code: status
        }
    };
}
