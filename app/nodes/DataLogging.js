var Type = require("hp/model/ports").Type;
var bb = require("hp/model/benb_utils.js");
var Direction = require("hp/model/ports").Direction;
var RunningState = require("hp/model/MapNode").RunningState;
var winston = require('winston');
var MathUtil = require("hp/lib/ptlib/util/MathUtil");
var l = require("../model/log.js");
var LineReader = require('line-by-line');
var fs = require('fs');
var bs = require('binary-search');
require('hp/model/utils');

var MemoryBackedFilePlaybackStream = function(path) {
  //Read in lines to data
  var data = fs.readFileSync(path, {encoding: 'utf8'}).trim().split(/\r?\n/).map(function(line) {
    try {
      return JSON.parse(line);
    } catch (e) {
      console.log("Couldn't parse log", line, e);
      throw e;
    }
  });

  //Set zero time and rewrite timestamps to be ms since file start.
  var initialTime = new Date(data[0].timestamp).getTime();
  //console.log("INITAL TIME", initialTime);
  for (var i =0 ; i<data.length ; i++) {
    data[i].timestamp = new Date(data[i].timestamp).getTime() - initialTime;
    //if (i < 20) l.debug(data[i]);
  }

  //Takes time in ms relative to start of file data.
  this.seekTo = function(timestamp) {

    // BROKEN BINARY SEARCH! FIX LATER...
    // var idx = bs(data, timestamp, function(a, b) { return a.timestamp-b.timestamp; });
    // //we don't care if result was found or not, take the nearest neighbor
    // idx = idx < 0 ? ~idx : idx;

    for (var idx = 0; idx < data.length ; idx++) {
      if (data[idx].timestamp >= timestamp) {
        break;
      }
    }

    //return an iterator that lets us scan forward
    return {
      next : function() {
        var out = data[idx];
        idx++;
        return { value: out, done: (idx>=data.length) } ;
      }
    };

  };

}

exports.Playback = {
  nodetype: "Playback",
  descr: "Play back JSON per line log files.",
  path: __filename,
  initFn: function (ports,state,name,emt) {
    if (ports.filename.get()) {
      state.pb = new MemoryBackedFilePlaybackStream(ports.filename.get());
    }
  },
  procfn: function (ports,state, id, triggerPort){
    switch(triggerPort.name) {
      case "filename":
        state.pb = new MemoryBackedFilePlaybackStream(triggerPort.get());
        console.log("Loaded recorded log '" + triggerPort.get() + "'.");
        break;
      case "play":
        if (triggerPort.get()) {
          state.out = null;
          state.iterator = state.pb.seekTo(parseFloat(ports.currentTime.get()));
        }
        break;
      default:
        break;
    }
  },
  tick: function (ports, state, id, tickData) {

    var getCurrentTime = function() {
      //always make sure we have a float
      return parseFloat(ports.currentTime.get());
    };

    if (!ports.play.get()) {
      return;
    }

    if (state.out) {
      //If we are already running, update current time.

      ports.currentTime.set(getCurrentTime()+(tickData.currentTick-tickData.prevTick));
    } else {
      //If we have just clicked play, get the first data to output.
      state.out = state.iterator.next();
    }

    //console.log("--TICK PB", state.out.done, state.out.value.timestamp, getCurrentTime());
    while (!state.out.done && state.out.value.timestamp <= getCurrentTime()) {
      ports.data.set(state.out.value);
      state.out = state.iterator.next();
      ports.done.set(state.out.done);
    }

    if (state.out.done && ports.loop.get()) {
      ports.currentTime.set(0);
      state.iterator = state.pb.seekTo(getCurrentTime());
      state.out=null;
    }
  },
  inputs : {
    //filename : {type: Type.STRING, defaultValue:"/Users/benb/Projects/20150319_FensadenseRehearsals/Logs/fd_rec_05_final.log"},
    filename : {type: Type.STRING, defaultValue:""},
    play: {type: Type.BOOL, defaultValue:false},
    externalClock: {type: Type.STRING, defaultValue:""},
    chaseExternalClock: {type: Type.BOOL, defaulValue:false},
    currentTime: {type: Type.INT, defaultValue:0},
    loop: {type: Type.BOOL, defaulValue:false},
  },
  outputs : {
    data: {type: Type.ANY, defaultValue:{}},
    done: {type: Type.BOOL, defaultValue:false}
  }
}

exports.DataFileLogger = {
  nodetype: "DataFileLogger",
  descr: "This will log the value which is sent to it",
  path: __filename,
  initFn: function (ports, state, name, emt) {
    var id = bb.uuid();
    winston.loggers.add(id, {
      file: {
        filename: ports.filename.get(),
        level: 'debug'
      },
      console: {
        level: 'log',
        colorize: true,
        label: id
      }
    });
    state.l = winston.loggers.get(id);
  },
  procfn: function (ports, state, id, triggerPort) {
    //console.log("Logger value changed");
    //console.log(ports);
    //console.log(id, ports.logInput.get());
    //mainWindow.webContents.send("update " + id, ports.i1.get());
    //Allow throughput
    //console.log(ports.logInput.get());

    // Changed filename
    if (triggerPort.name == "filename") {
      if (state.l != undefined) {
          state.l.close();
      }
      var newid = bb.uuid();
      winston.loggers.add(newid, {
        file: {
          filename: triggerPort.get(),
          level: 'debug'
        },
        console: {
          level: 'log',
          colorize: true,
          label: newid
        }
      });
      state.l = winston.loggers.get(newid);
      state.filename = ports.filename.get();
    }

    if (ports.trigger.get() == true) {
      state.l.debug(ports.logInput.get());
      ports.passthruOutput.set(ports.logInput.get());
    }
  },
  inputs: {
    filename: {
      type: Type.STRING,
      defaultValue: "hpdata-" + Date.now() + ".log"
    },
    trigger: {
      type: Type.BOOL,
      defaultValue: false
    },
    logInput: {
      type: Type.ANY,
      defaultValue: 0
    }
  },
  outputs: {
    passthruOutput: {
      type: Type.ANY,
      defaultValue: 0
    }
  },
  destroy: function (ports, state) {
    state.l.close();
  }
};

function closeReader(ports, state) {
  if (state.reader) {
    //state.reader.off("line", state.readLine); // not sure if this is needed for other reading modes
    state.reader.close();
    state.reader = null;
  }
}

function initReader(ports, state) {
  var path = ports.filePath.get();
  if (path) {
    state.reader = new LineReader(path, {
      skipEmptyLines: true
    });
    state.reader.on("line", state.readLine);
  }
  return state.reader;
}


function scanLogFile(ports, state) {
  ports.begin_time.set(1000);
  var step_size = 1000/30; // approximate ms per frame
  var pos = 0;
  var num_records = 0;
  var current_time, next_step_time;
  var path = ports.filePath.get();
  state.index = [];
  state.data = {};

  if (path) {
    console.log("Attempting to load " + path);
    state.reader = new LineReader(path);
    state.reader.on('error', function (err) {
      // 'err' contains error object
    });

    state.reader.on('line', function (line) {
      var record = JSON.parse(line);
      var timestamp = new Date(record.timestamp).getTime();
      var address = record.address;
      state.addresses = new Set();
      state.addresses.add(address);
      if (ports.num_records.get() == 0) {
        next_step_time = timestamp + step_size;
        state.index.push(pos);
      }
      current_time = timestamp;
      if (current_time >= next_step_time) {
        state.index.push(pos);
        next_step_time = current_time + step_size;
      }
      pos += line.length + 1;
      ports.num_records.set(num_records++);

      if (state.data[timestamp]) {
        state.data[timestamp].push(record);
      } else {
        state.data[timestamp] = [record];
      }

    });

    state.reader.on('end', function () {
      ports.num_chunks.set(state.index.length);
      state.fd = fs.openSync(ports.filePath.get(), 'r');
      state.stats = fs.fstatSync(state.fd);
      ports.filesize.set(state.stats.size);
      state.buffer = new Buffer(ports.filesize.get());
      state.addresses.forEach(function(address) {console.log(address);});
      state.timestamps = Object.keys(state.data);
      state.timestamps.sort();
      ports.begin_time.set(state.timestamps.first());
      ports.end_time.set(state.timestamps.last());

      //console.log(state.data);
      console.log("File loaded.");

    });
  }
};

function pack(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function cleanArray(actual){
  var newArray = new Array();
  for(var i = 0; i<actual.length; i++){
      if (actual[i]){
        newArray.push(actual[i]);
    }
  }
  return newArray;
}

exports.LogOSCDataPlayerRandomAccess = {
  nodetype: "LogOSCDataPlayerRandomAccess",
  descr: "Plays back a file of data recorded by DataFileLogger with buffering and random access",
  path: __filename,
  inputs: {
    play: {type: Type.BOOL, defaultValue: false},
    filePath: {type: Type.STRING, defaultValue: "/Users/dnunez/Downloads/10.log"},
    seekPos: {type: Type.FLOAT, defaultValue: 0},
  },
  outputs: {
    begin_time: {type: Type.INT, defaultValue: 0},
    end_time: {type: Type.INT, defaultValue: 0},
    //osc: {type: Type.OBJECT, defaultValue: {}},
    oscArr: {type: Type.OBJECT, defaultValue: {}},

    time: {type: Type.FLOAT, defaultValue: 0},
    cursor: {type: Type.INT, defaultValue: 0},
    record_num: {type: Type.INT, defaultValue: 0},
    filesize: {type: Type.INT, defaultValue:0},
    num_chunks: {type: Type.INT, defaultValue: 0},
    num_records: {type: Type.INT, defaultValue: 0},
  },
  initFn: function (ports, state) {
    scanLogFile(ports,state);
  },
  destroy: function (ports, state) {
    ports.play.set(false);
    closeReader(ports, state);
  },
  procfn: function (ports, state, name, triggerPort) {
    if (ports.filePath === triggerPort) {
      ports.play.set(false);
      closeReader(ports, state);
      scanLogFile(ports, state);
    }
  },
  tick: function (ports, state, id, tickData) {
    if (ports.play.get()) {

      // TODO: state.data should be an array and use .slice to more efficiently pull chunks
      //       this would require filling the array w/ empty elements for gaps in timeline
      // TODO: What happens when the cursor loops and chunk returned contains end and beginning
      //       of data?
      // TODO: check types on ports, etc
      var oscArr = [];
      var begin_time = Number(ports.begin_time.get());
      var end_time = Number(ports.end_time.get());
      var cursor = Number(ports.cursor.get());
      var adj_cursor = cursor + begin_time;
      for (i = 0; i < 1000/30; i++) {
        if (adj_cursor == end_time) {
          adj_cursor=begin_time;
          cursor = 0;
          console.log("Cursor Reset");
        }
        if (state.data[adj_cursor]) {
          oscArr = oscArr.concat(state.data[adj_cursor]);
        }
        // TODO: use this to set playback speed, etc
        adj_cursor += 1;
      }
      ports.cursor.set(adj_cursor-begin_time);
      //console.log(oscArr);
      ports.oscArr.set(oscArr);

      // TODO: Reinstate "read from disk" for large files
      // ports.cursor.set(ports.cursor.get() + 1);
      // if (ports.cursor.get() == ports.num_chunks.get()) {
      //   ports.cursor.set(0);
      // }
      // ports.record_num.set(state.index[ports.cursor.get()]);
      // var chunkSize = state.index[ports.cursor.get()+1] - state.index[ports.cursor.get()];
      // fs.read(state.fd, state.buffer, state.index[ports.cursor.get()], chunkSize, state.index[ports.cursor.get()],
      //   function (err, bytes, buff) {
      //     if (err) return done(err);
      //     var buffRead = buff.slice(state.index[ports.cursor.get()], state.index[ports.cursor.get()]+chunkSize);
      //     var j = pack(buffRead).split('\n');
      //     j = cleanArray(j);
      //     ports.oscArr.set(j);
      //   }
      // );
    }
  }
};


exports.LogOSCDataPlayer = {
  nodetype: "LogOSCDataPlayer",
  descr: "Plays back a file of data recorded by DataFileLogger",
  path: __filename,
  inputs: {
    play: {type: Type.BOOL, default: false},
    startTime: {type: Type.FLOAT, default: 0},
    filePath: {type: Type.STRING, default: ""}
  },
  outputs: {
    osc: {type: Type.OBJECT, default: {}},
    time: {type: Type.FLOAT, default: 0}
  },
  initFn: function (ports, state) {
    // TODO: open a buffered file, if filePath is set. The buffering should support random access, but with potentially long linear searches, since we don't want to keep large log files in a structure in memory.
    state.lastTime = 0;
    state.curTime = 0;

    state.readLine = function (line) {
      state.lastValue = JSON.parse(line);
      state.lastValue.time = Date.parse(state.lastValue.timestamp) / 1000;
      if (!state.fileStartTime) {
        state.fileStartTime = state.lastValue.time;
      }
      state.lastValue.time -= state.fileStartTime;
      if (state.lastValue.time >= state.lastTime) {
        state.reader.pause();
      }
      else {
        // Set output ports to emit current value
        ports.osc.set(state.lastValue); // The logged object is a superset of the OSC message.
        // We want to emit each message individually, in the OSC case. This will be bursty, but roughly equivalent to the original OSC input.
        // In the mux case, the values can be aggregated in the emitted mux.
      }
    };

    initReader(ports, state);
  },
  destroy: function (ports, state) {
    ports.play.set(false);
    closeReader(ports, state);
  },
  procfn: function (ports, state, name, triggerPort) {
    // if filePath and filePath, close any open file and open a buffered reader for the new file
    if (ports.filePath === triggerPort) {
      closeReader(ports, state);
      initReader(ports, state);
    }
    else if (ports.play === triggerPort) {
      if (ports.play.get()) {
        state.starting = true;
      }
      else {
        state.reader.pause();
      }
    }
  },
  tick: function (ports, state, id, tickData) {
    if (state.starting) {
      state.starting = false;
      state.zeroTime = tickData.seconds;
    }
    // if play,
    if (ports.play.get()) {
      // create an object of all k/v pairs since last tick relative to start time
      var osc = {};

      var curTime = tickData.seconds - state.zeroTime + ports.startTime.get();

      if (curTime > state.lastTime) {
        state.reader.resume();
      }

//      while (Date.parse(data[i].timestamp) / 1000 <= curTime) {
//        osc[data[i].name] = osc[i].value;
//        // entry is next
//      }
//
//      ports.osc.set(osc);

      // store last tick time (in time port)
      state.lastTime = curTime;
      ports.time.set(curTime);
    }
    // NB: having time as a port, means that we can sync playback and even use this to play animation sequences
    // output is in the form of an OSCMessage... could also just be a mux, but then would require patches to handle the data differently
    //    Consider adding an osc player
  }
};

exports.ConsoleLogger = {
  nodetype: "ConsoleLogger",
  descr: "This will log the value which is sent to it",
  path: __filename,
  procfn: function (ports, state, id) {
    // console.log("Logger value changed");
    //console.log(ports);
    console.log(id, ports.logInput.get());
    //mainWindow.webContents.send("update " + id, ports.i1.get());
    //Allow throughput
    ports.passthruOutput.set(ports.logInput.get());
  },
  inputs: {
    logInput: {
      type: Type.ANY,
      defaultValue: 0,
      continuous: true
    }
  },
  outputs: {
    passthruOutput: {
      type: Type.ANY,
      defaultValue: 0
    }
  }
};
