/**
 * Copyright (c) 2017 Platform 9 Systems, Inc.
 */

'use strict';

const Koa = require('koa');
const app = new Koa();
const co = require('co');
const route = require('koa-route');
const bodyParser = require('koa-bodyparser');
const log4js = require('log4js');
const log = log4js.getLogger('api');

const messages = [];
start();

function apiLogger(log) {
    return co.wrap(function *(ctx, next) {
        const start = new Date();
        try {
            log.debug('incoming request for', ctx.url);
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

function start() {
    app.use(apiLogger(log));
    app.use(bodyParser());
    app.use(route.post('/v1/messages', co.wrap(genPublishMessage)));
    app.use(route.get('/v1/messages', co.wrap(genPullMessage)));
    app.use(route.get('/v1/messageCount', co.wrap(genGetMessageCount)));
    app.listen(8889);
}

function * genPublishMessage(ctx) {
    log.info('body:', ctx.request.body);
    messages.push(ctx.request.body);
    ctx.status = 200;
}

function * genPullMessage(ctx) {
    if (!messages.length) {
        ctx.body = [];
        return;
    }
    ctx.body = [messages.shift()];
}

function *genGetMessageCount(ctx) {
    ctx.body = messages.length;
}

