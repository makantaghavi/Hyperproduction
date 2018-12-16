var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var Chokidar = require('chokidar');

// exports.LowPassFilter 
// exports.Constant
// exports.Ignore
// exports.ADHSR

module.exports = (function () {
  var instance;

  function ComputeModules() {
    var that = this;
    var modules;
    EventEmitter.call(this);

    function initNodeList() {

      // console.log(process.cwd());
      var dir = __dirname + "/../nodes/";
      fs.readdir(dir, function (err, files) {
        if (err) {
          throw err;
        }
        var c = 0;
        files.filter(function (file) {
          return file.substr(-3) === '.js';
        }).forEach(function (file) {
          try {
            c++;
            //console.log("Checking node: ", file);
            var m = require(dir + file);
            for (var n in m) {
              // console.log("FOUND NODE: ", n);
              modules[n] = m[n];
            }
            that.emit('nodes-loaded');
          }
          catch (e) {
            console.warn(`Error parsing node definitions: ${dir}${file}`, e);
          }
        });
      });
    }

    function initMappingList() {
      //console.log(process.cwd());
      var dir = __dirname + "/../maps/";
      var data = {};
      fs.readdir(dir, function (err, files) {
        if (err) {
          throw err;
        }
        var c = 0;
        files.filter(function (file) {
          return file.substr(-4) === '.hpm';
        }).forEach(function (file) {
          c++;
          fs.readFile(dir + file, 'utf-8', function (err, json) {
            if (err) {
              throw err;
            }
            data[file] = JSON.parse(json);
            data[file].fileRef = file;
            if (0 === --c) {
              //console.log(data);
              for (var nodeHandle in data) {
                modules[nodeHandle] = data[nodeHandle];
              }
              that.emit('maps-loaded');
              console.log("Mappings loaded CM: " + Object.keys(modules).length);
            }
          });
        });
      });
    }
    
    this.reload = function () {
      modules = {};
      initNodeList();
      initMappingList();
      console.log("Reloading nodes and mappings: " + Object.keys(modules).length);
      that.emit('mapnodes-loading');
    };
    
//    var watcher = Chokidar.watch(__dirname + "/../nodes", {ignoreInitial: true, persistent: true});
//    watcher.on("add", that.reload);
//    watcher.on("change", that.reload);
//    watcher.on("unlink", that.reload);
    // var watcher = fs.watch(__dirname + "/../nodes", )
 
    this.getModules = function () {
      return modules;
    };

    this.reload();
  }

  ComputeModules.prototype = Object.create(EventEmitter.prototype);
  ComputeModules.prototype.constructor = ComputeModules;

  return {
    getInstance: function () {
      if (!instance) {
        instance = new ComputeModules();
      }
      return instance;
    }
  };
})();

