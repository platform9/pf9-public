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
const utils = require('utils');
const EventEmitter = require('events');
const TIMEOUT = process.env.TIMEOUT || 10000;
const LISTEN_PORT = process.env.LISTEN_PORT || 8889;
const LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';

const messages = [];
const waiters = [];

start();

function apiLogger(log) {
    return co.wrap(function *(ctx, next) {
        const start = new Date();
        try {
            yield next();
            if (ctx.dontLog)
                return;
            const ms = new Date() - start;
            let errMsg = '';
            if (ctx.status >= 400 && ctx.message)
                errMsg = '- ' + ctx.message;
            const nm = messages.length;
            const nw = waiters.length;
            log.info(`${ctx.method} ${ctx.url} ${ctx.status} - ${ms}ms ${errMsg} - ${nm} msgs ${nw} waiters`);
        } catch(error) {
            ctx.status = ctx.status || 500;
            log.error(`${ctx.method} ${ctx.url} ${ctx.status} - ${error}`);
            log.error(error.stack);
        }
    });
}

function start() {
    log.setLevel(LOG_LEVEL);
    app.use(apiLogger(log));
    app.use(bodyParser());
    app.use(route.post('/v1/messages', co.wrap(genPublishMessage)));
    app.use(route.get('/v1/messages', co.wrap(genPullMessage)));
    app.use(route.get('/v1/messageCount', co.wrap(genGetMessageCount)));
    app.listen(LISTEN_PORT);
}

function * genPublishMessage(ctx) {
    log.info('body:', ctx.request.body);
    if (waiters.length) {
        log.info('dequeueing a waiter');
        const emitter = waiters.shift();
        emitter.emit('msg', ctx.request.body);
    } else {
        messages.push(ctx.request.body);
    }
    ctx.status = 200;
}

function * genWaitForMessage() {
    const emitter = new EventEmitter();
    waiters.push(emitter);
    const prom = utils.withTimeout(new Promise(promFn), TIMEOUT);
    try {
        return yield * utils.wrapPromiseError(prom);
    } catch (e) {
        // timeout
        const i = waiters.indexOf(emitter);
        if (i < 0)
            log.warn('Unable to remove waiter after timeout');
        else {
            log.debug('Removing waiter after timeout', i);
            waiters.splice(i, 1);
        }
        emitter.removeAllListeners();
        throw e;
    }

    function promFn(resolve, reject) {
        emitter.once('msg', body => resolve(body));
    }
}

function * genPullMessage(ctx) {
    if (messages.length) {
        ctx.body = messages.shift();
    } else try {
        ctx.body = yield * genWaitForMessage();
    } catch (e) {
        log.debug('genPullMessage error:', e.toString());
        ctx.status = 404;
    }
}

function *genGetMessageCount(ctx) {
    ctx.body = messages.length;
    ctx.dontLog = true;
}

