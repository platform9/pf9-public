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

const messages = {};
const waiters = {};

start();

function ensureTopic(topic) {
    if (typeof(messages[topic]) === 'undefined')
        messages[topic] = [];
    if (typeof(waiters[topic]) === 'undefined')
        waiters[topic] = [];
}

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
            const nm = messages.requests? messages.requests.length : -1;
            const nw = waiters.requests? waiters.requests.length : -1;
            log.info(`${ctx.method} ${ctx.url} ${ctx.status} - ${ms}ms ${errMsg} - ${nm} msgs ${nw} waiters`);
        } catch(error) {
            ctx.status = ctx.status || 500;
            log.error(`${ctx.method} ${ctx.url} ${ctx.status} - ${error}`);
            log.error(error.stack);
        }
    });
}

function insertCorsHeaders(ctx, next) {
    return next().then(function () {
        ctx.response.set('Access-Control-Allow-Origin', '*');
    });
}

function start() {
    log.setLevel(LOG_LEVEL);
    app.use(apiLogger(log));
    app.use(bodyParser());
    app.use(insertCorsHeaders);
    app.use(route.post('/v1/topics/:topic/messages', co.wrap(genPublishMessage)));
    app.use(route.get('/v1/topics/:topic/messages', co.wrap(genPullMessage)));
    app.use(route.get('/v1/topics/:topic/messageCount', co.wrap(genGetMessageCount)));
    app.listen(LISTEN_PORT);
}

function * genPublishMessage(ctx, topic) {
    log.debug('body:', ctx.request.body);
    ensureTopic(topic);
    if (waiters[topic].length) {
        log.debug('dequeueing a waiter');
        const emitter = waiters[topic].shift();
        emitter.emit('msg', ctx.request.body);
    } else {
        messages[topic].push(ctx.request.body);
    }
    ctx.status = 200;
}

function * genWaitForMessage(topic) {
    const emitter = new EventEmitter();
    waiters[topic].push(emitter);
    const prom = utils.withTimeout(new Promise(promFn), TIMEOUT);
    try {
        return yield * utils.wrapPromiseError(prom);
    } catch (e) {
        // timeout
        const i = waiters[topic].indexOf(emitter);
        if (i < 0)
            log.warn('Unable to remove waiter after timeout');
        else {
            log.debug('Removing waiter after timeout', i);
            waiters[topic].splice(i, 1);
        }
        emitter.removeAllListeners();
        throw e;
    }

    function promFn(resolve, reject) {
        emitter.once('msg', body => resolve(body));
    }
}

function * genPullMessage(ctx, topic) {
    ensureTopic(topic);
    if (messages[topic].length) {
        ctx.body = messages[topic].shift();
    } else try {
        ctx.body = yield * genWaitForMessage(topic);
    } catch (e) {
        log.debug('genPullMessage error:', e.toString());
        ctx.status = 404;
    }
}

function *genGetMessageCount(ctx, topic) {
    ensureTopic(topic);
    ctx.body = messages[topic].length;
    //ctx.dontLog = true;
}

