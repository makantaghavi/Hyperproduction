#!/usr/bin/env node
var fs = require('fs');
var prefix = process.argv[2]
var files = []

for (var hand in {"right" : true, "left": true}) {
    for (var datatype in {"emg": true, "accel": true}) {
        files.push(prefix + "-" + hand + "-" + datatype + ".log");
    }
}

var data_arr = files.map(function(filename) {
    return fs.readFileSync(filename).toString().split('\n');
});

var json_logs = [].concat.apply([], data_arr.map(function(lines) {
    return lines.filter(function (str) {
        return str != "";
    }).map(function (str) {
        try {
            obj = JSON.parse(str);
            return obj;
        } catch(err) {
            console.log("JSON Parse error " + err);
            console.log(str);
        }
        return {}
    });
}));
console.log('sorting');
json_logs.sort(function (a, b) {
    tsA = Date.parse(a.timestamp);
    tsB = Date.parse(b.timestamp);
    if (tsA < tsB) {
        return -1;
    }
    if (tsA > tsB) {
        return 1;
    }
    return 0;
});

console.log('checking');

lastTs = null;
for (var i in json_logs) {
    ts = Date.parse(json_logs[i].timestamp);
    if (lastTs == null) {
        lastTs = ts;
        continue;
    }
    if (ts < lastTs) {
        console.log(json_logs[i]);
        console.log('not sorted');
        return;
    }
    lastTs = ts;
}

console.log('stringify');

var outputStr = json_logs.map(function(obj) {
    return JSON.stringify(obj);
}).join('\n');

fs.writeFileSync(prefix + '-myo.log', outputStr);




//var final_data = [];
//var head = [data_arr[
