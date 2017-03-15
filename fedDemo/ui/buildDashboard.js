'use strict';

(function start() {
    init();
    updateQueueLen();
}) ();

function init() {
    const values = [
        {
            time: 2,
            y: 1
        },
        {
            time: 3,
            y: 3
        },
        {
            time: 5,
            y: 2
        },
        {
            time: 6,
            y: 4
        },
        {
            time: 7,
            y: 5
        },
        {
            time: 8,
            y: 3
        },
        {
            time: 9,
            y: 4
        }
    ];
    const data = [{
        label: 'Length',
        values: values
    }];
    const chart = $('#queueLength .epoch').epoch(
        {
            type: 'time.line',
            axes: ['left','right','bottom'],
            data: data
        }
    );
}

function updateQueueLen() {
    const req = new XMLHttpRequest();
    req.responseType = 'json';
    //req.open('GET', 'https://mq.kube2go.io/v1/topics/requests/messageCount');
    req.open('GET', 'http://leb-ctos-devel.platform9.sys:8889/v1/topics/requests/messageCount');
    req.send();
    req.onload = function () {
        let msg;
        let succeeded = false;
        let color = 'whitesmoke';
        if (this.status !== 200) {
            msg = `Request failed with status ${req.status}`;
        } else if (!this.response) {
            msg = 'Request returned null response';
        } else {
            const resp = this.response;
            /*
            const hostName = resp.hostName;
            msg = `Response: ${resp.dateTime} -- from pod: ${hostName}`;
            const span = document.getElementById('time');
            span.innerText = resp.dateTime;
            succeeded = true;
            color = serverToColor[hostName];
            if (!color) {
                color = colors[colorIndex];
                colorIndex = (colorIndex + 1) % colors.length;
                serverToColor[hostName] = color;
            }
            */
        }
        updateServerStatus(succeeded);
        updateLog(msg, color);
        setTimeout(updateQueueLen, 1000);
    }
    req.onerror = req.ontimeout = req.onabort = function () {
        //updateLog('Request failed with network error', 'whitesmoke');
        //updateServerStatus(false);
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
