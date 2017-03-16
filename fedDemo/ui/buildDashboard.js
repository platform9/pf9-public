'use strict';

let chart;
let commitInterval = -1;
const stats = {};
const MQ_SERVER = 'https://mq.kube2go.io';

(function start() {
    init();
    commit();
    updateQueueLen();
    pollStat('success');
    pollStat('failure');
}) ();

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
            inputBox.value = val = 60;
        submitBtn.disabled = false;
    };
    submitBtn.onclick = function () {
        commitInterval = 1000 * 60 / parseInt(inputBox.value);
        submitBtn.disabled = true;
    }
}

function commit() {
    if (commitInterval < 0) {
        setTimeout(commit, 2000);
        return
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
        setTimeout(commit, interval);
    };
    req.onload = function () {
        let msg;
        if (this.status !== 200) {
            console.error(`commit request failed with status ${req.status}`);
        } else {
            console.log('commit request succeeded');
        }
        setTimeout(commit, interval);
    };
}

function pollStat(statName) {
    const req = new XMLHttpRequest();
    req.responseType = 'json';
    req.open('GET', `${MQ_SERVER}/v1/topics/${statName}/messages`);
    req.send();
    let interval = 1000;
    req.onload = function () {
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

function setServerDown(down) {
    let el = document.getElementById('serverDown');
    el.style.display = down? 'inline':'none';
    el = document.getElementById('serverUp');
    el.style.display = down? 'none':'inline';
    if (down) {
        const span = document.getElementById('time');
        span.innerText = '(Unknown)'
    }

}

let colorIndex = 0;
let failureCount = 0;
const MAX_FAILURES = 2;

function updateServerStatus(succeeded) {
    if (succeeded) {
        failureCount = 0;
        setServerDown(false);
    } else if (failureCount < MAX_FAILURES) {
        ++failureCount;
    } else {
        setServerDown(true);
    }
}

function updateLog(msg, color) {
    const uls = document.getElementsByTagName('ul');
    const ul = uls[0];
    const line = document.createElement('li');
    line.innerText = msg;
    if (ul.childNodes.length >= 9) {
        ul.removeChild(ul.childNodes[0]);
    }
    line.style.background = color;
    line.style.width = '500px';
    ul.appendChild(line);
}
