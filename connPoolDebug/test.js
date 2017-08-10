'use strict';

const co = require('co');
const rp = require('request-promise');
const httpsAgent = new (require('https').Agent)({keepAlive: true});

function *genReq(uri) {
    const opts = {
        uri: uri,
        agent: httpsAgent,
        resolveWithFullResponse: true,
        json: true
    };
    try {
        const ret = yield rp(opts);
        //console.log(opts.uri, ':', JSON.stringify(ret));
        console.log(opts.uri, ':', ret.statusCode);
    } catch (e) {
        console.log(opts.uri, ' err:', e.toString());
    }
}

co(genRun).then(() => console.log('done')).catch(err => console.error(err));

function * genRun() {
    let count = 10;
    while (count --) {
        yield * genReq('https://fedtime-tls.platform9.horse/currentTime/');
        //yield * genReq('https://fedtime-tls.platform9.horse/');
        yield sleep(500);
        yield * genReq('https://fedtime5-tls.platform9.horse/time/currentTime/');
        yield sleep(500);
    }
}

function sleep(delay) {
    return new Promise((resolve) => setTimeout(resolve, delay));
};
