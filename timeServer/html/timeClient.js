'use strict';

(function start() {
    updateTime();
}) ();

const colors = [
    'cornsilk',
    'aquamarine',
    'lavender',
    'lavenderblush',
    'mistyrose'
];

const serverToColor = {

};

function setServerDownVisbility(visible) {
    const el = document.getElementById('serverDown');
    el.style.visibility = visible? 'visible':'hidden';
}
function updateTime() {
    const req = new XMLHttpRequest();
    req.responseType = 'json';
    req.open('GET', 'currentTime/');
    req.send();
    req.onload = function () {
        let msg;
        let serverDownVisible = true;
        let color = 'whitesmoke';
        if (this.status !== 200) {
            msg = `Request failed with status ${req.status}`;
        } else if (!this.response) {
            msg = 'Request returned null response';
        } else {
            const resp = this.response;
            const hostName = resp.hostName;
            msg = `Response: ${resp.dateTime} -- from pod: ${hostName}`;
            const span = document.getElementsByTagName('span')[0];
            span.innerText = resp.dateTime;
            serverDownVisible = false;
            color = serverToColor[hostName];
            if (!color) {
                color = colors.shift();
                if (!color)
                    color = 'whitesmoke';
                serverToColor[hostName] = color;
            }
        }
        setServerDownVisbility(serverDownVisible);
        updateLog(msg, color);
        setTimeout(updateTime, 1100);
    }
    req.onerror = function () {
        updateLog('Request failed with network error', 'whitesmoke');
        setServerDownVisbility(true);
        setTimeout(updateTime, 1100);
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
    ul.appendChild(line);
}
