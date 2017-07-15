const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const EventEmitter = require('events');
const topics = {};

app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.post('/topics/:topicName', function (req, res) {
    console.log('topic:', req.params.topicName);
    console.log('body:', req.body);
    if (typeof req.body !== 'object' || !req.body.msg)
        return res.status(400).send('malformed request body')
    const msg = req.body.msg;
    console.log('msg:', msg);
    const topic = req.params.topicName;
    const info = ensureTopicExists(topic);
    info.msgs.push(msg);
    info.ev.emit('msg');
    res.send(`queued msg, new queue length: ${info.msgs.length}\n`);
})

app.get('/topics/:topicName', function (req, res) {
    const topic = req.params.topicName;
    const info = ensureTopicExists(topic);
    if (checkMessageAndRespond())
        return;
    info.ev.on('msg', onMsg);

    function checkMessageAndRespond() {
        if (info.msgs.length) {
            const msg = info.msgs.shift();
            console.log(`responding with msg: ${msg}`);
            res.send(msg);
            return true;
        }
        return false;
    }
    function onMsg() {
        if (checkMessageAndRespond())
            info.ev.removeListener('msg', onMsg);
    }
});

function ensureTopicExists(topic) {
    let info = topics[topic];
    if (!info)
        info = topics[topic] = {
            msgs: [],
            ev: new EventEmitter()
        };
    return info;
}

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

