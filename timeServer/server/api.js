/**
 * Copyright (c) 2015 Platform 9 Systems, Inc.
 */

'use strict';

const uuid = require('uuid');
const Koa = require('koa');
const app = new Koa();
const apiUtils = require('./apiUtils');
const co = require('co');
const route = require('koa-route');
const bodyParser = require('koa-bodyparser');
const utils = require('./utils');
const rp = require('request-promise');
const reqAsGen = utils.wrapPromiseFunction(rp);
const hostname = require('os').hostname();

exports.start = function(config) {

    app.use(bodyParser());
    app.use(route.get('/currentTime', _wrap(genGetCurrentTime)));
    app.use(route.get('/health', _wrap(genHealth)));
    const port = config.port || 3000;
    console.log('listening on port', port);
    app.listen(port);
};

function _wrap(genFunc) {
    function * genWrap() {
        const koaCtx = arguments[0];
        try {
            return yield * genFunc.apply(this, arguments);
        } catch (err) {
            apiUtils.failRequest(koaCtx, 400, err.toString());
        }
    }

    return co.wrap(genWrap);
}


function * genGetCurrentTime(ctx) {
    const date = new Date();
    const time = date.toLocaleTimeString();
    ctx.body = {
        dateTime: time,
        hostName: hostname
    };
}

function *genHealth(ctx) {
    ctx.body = 'ok';
}
