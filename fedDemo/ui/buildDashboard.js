'use strict';

let chart;
let gauge;
let commitInterval = 0;
const stats = {};
const MQ_SERVER = 'https://mq.kube2go.io';
const BUILD_RATE_SAMPLING_INTERVAL = 1000;
const BUILD_RATE_SAMPLES = 20;
const BUILD_RATE_RATIO = 60000 / BUILD_RATE_SAMPLING_INTERVAL / BUILD_RATE_SAMPLES; // 3
const buildRateSamples = [];
let buildRateSum = 0;
let lastSample;
let commitTimer;

(function start() {
    init();
    updateQueueLen();
    pollStat('success');
    pollStat('failure');
    updateBuildRate();
}) ();

function updateBuildRate() {
    const curSample = stats['success'] || 0;
    if (lastSample === undefined) {
        lastSample = curSample;
        setTimeout(updateBuildRate, BUILD_RATE_SAMPLING_INTERVAL);
        return;
    }
    const curDelta = curSample - lastSample;
    lastSample = curSample;
    if (buildRateSamples.length >= BUILD_RATE_SAMPLES) {
        buildRateSum -= buildRateSamples.shift();
    }
    buildRateSum += curDelta;
    buildRateSamples.push(curDelta);
    const buildsPerMinute = buildRateSum * BUILD_RATE_RATIO;
    gauge.push(buildsPerMinute);
    setTimeout(updateBuildRate, BUILD_RATE_SAMPLING_INTERVAL);
}

function init() {
    const values = [];
    const data = [{
        label: 'QueueLength',
        values: values
    }];
    const range = [0,20];
    chart = $('#queueLength .epoch').epoch(
        {
            type: 'time.line',
            range: {
                left: range,
                right: range
            },
            axes: ['left','right','bottom'],
            data: data
        }
    );
    const inputBox = document.getElementById('commitsPerMin');
    const submitBtn = document.getElementById('submit');
    inputBox.oninput = function () {
        let val = parseInt(inputBox.value);
        if (val > 60)
            inputBox.value = 60;
        if (val < 0)
            inputBox.value = 0;
        submitBtn.disabled = false;
    };
    submitBtn.onclick = function () {
        const val = parseInt(inputBox.value);
        commitInterval = val? 1000 * 60 / val : 0;
        submitBtn.disabled = true;
        commit();
    };
    gauge = $('#gauge .epoch').epoch(
        {
            type: 'time.gauge',
            value: 0,
            domain: [0, 60],
            format: v => v.toFixed(1)
        }
    );
}

function cancelTimer() {
    if (commitTimer !== undefined)
        clearTimeout(commitTimer);
    commitTimer = undefined;
}

function commit() {
    cancelTimer();
    if (!commitInterval) {
        return;
    }
    let interval = commitInterval;
    const req = new XMLHttpRequest();
    req.responseType = 'json';
    req.open('POST', `${MQ_SERVER}/v1/topics/requests/messages`);
    //req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    const body = {gitRef: 'unknown', id: 'someId'};
    req.send();
    //req.send(JSON.stringify(body));

    req.onerror = req.ontimeout = req.onabort = function (err) {
        cancelTimer();
        commitTimer = setTimeout(commit, interval);
    };
    req.onload = function () {
        if (this.status !== 200) {
            console.error(`commit request failed with status ${req.status}`);
        } else {
            console.log('commit request succeeded');
        }
        cancelTimer();
        commitTimer = setTimeout(commit, interval);
    };
}

function pollStat(statName) {
    const req = new XMLHttpRequest();
    req.responseType = 'json';
    req.open('GET', `${MQ_SERVER}/v1/topics/${statName}/messages`);
    req.send();
    req.onload = function () {
        let interval = 1000;
        if (this.status !== 200) {
            const msg = `obtaining stat ${statName} failed with status ${req.status}`;
            console.warn(msg);
        } else {
            if (typeof(stats[statName]) === 'undefined')
                stats[statName] = 0;
            ++stats[statName];
            const el = document.getElementById(statName);
            if (el)
                el.innerText = stats[statName];
            interval = 0;
        }
        setTimeout(() => pollStat(statName), interval);
    };
    req.onerror = req.ontimeout = req.onabort = function () {
        const msg = `obtaining stat ${statName} failed early`;
        console.warn(msg);
        setTimeout(() => pollStat(statName), 1000);
    }
}


function updateQueueLen() {
    const req = new XMLHttpRequest();
    req.responseType = 'json';
    req.open('GET', `${MQ_SERVER}/v1/topics/requests/messageCount`);
    req.send();
    req.onload = function () {
        if (this.status !== 200) {
            const msg = `Request failed with status ${req.status}`;
            console.warn(msg);
        } else {
            const qlen = Number(this.response);
            const currentTime = parseInt(new Date().getTime() / 1000);
            chart.push([{
                    time: currentTime,
                    y: qlen
            }]);
            document.getElementById('qLen').innerText = qlen;
        }
        setTimeout(updateQueueLen, 1000);
    };
    req.onerror = req.ontimeout = req.onabort = function () {
        setTimeout(updateQueueLen, 1000);
    }
}
