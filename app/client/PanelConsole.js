var ipc = require('electron').ipcRenderer;

var MAX_MESSAGES = 30;

// TODO: Reimplement console hijacking with Proxy objects on both consoles.
// TODO: Print objects without following circular references (custome stringify).

var CONSOLE = {};
CONSOLE.log = window.console.log;
CONSOLE.warn = window.console.warn;
CONSOLE.error = window.console.error;
CONSOLE.info = window.console.info;

var PanelConsole = function () {

  var consolePanel = document.createElement('ul');
  consolePanel.className = "hp-console";
  
  this.initPanel = function (container, componentState) {
    
//    var consolePanel = document.createElement('ul');
//    consolePanel.className = "hp-console";

    container.getElement()[0].appendChild(consolePanel);

    ipc.on('console-log', function (evt, refcon) {
      logMessage(refcon.data, refcon.type);
    });
  };
  
  // Right now, this doesn't provide an origin or stack trace. Throwing on every call to get this would be very slow.
  // Thus, this is a useful tool for debugging patches, but to debug HP itself, a real console is stil useful.
  
  var formatLogItem = function (string, item) {
    if (!string || string.length === 0) {
      return (typeof item === "string") ? item : JSON.stringify(item);
    }
    else {
      return string + ", " + (typeof item === "string") ? item : JSON.stringify(item);
    }
  };
  
  function logMessage(msg, className) {
    if (this.consolePanel) {
      var msgEl = document.createElement("li");
      if (typeof msg === "undefined") {
        msg = "undefined";
      }
      msgEl.textContent = (typeof msg === 'string') ? msg : JSON.stringify(msg, stringifySingleLevel);
      // msgEl.textContent = msg;
      msgEl.className = className;
      consolePanel.appendChild(msgEl);
      if (consolePanel.children.length > MAX_MESSAGES) {
        consolePanel.removeChild(consolePanel.firstChild);
      }
      msgEl.scrollIntoView(false);
    }
  }
  
  window.console.log = function () {
    logMessage(Array.prototype.reduce.call(arguments, formatLogItem, ""), "log");
    CONSOLE.log.apply(this, arguments);
  };
  
  window.console.warn = function () {
    logMessage(arguments, "warn");
    CONSOLE.warn.apply(this, arguments);
  };
  
  window.console.error = function () {
    logMessage(arguments, "error");
    CONSOLE.error.apply(this, arguments);
  };
  
  window.console.info = function () {
    logMessage(arguments, "info");
    CONSOLE.info.apply(this, arguments);
  };
  
  this.destroy = function () {
    while (this.consolePanel.lastChild) {
      this.consolePanel.removeChild(this.consolePanel.lastChild);
    }
    this.consolePanel = null;
    // LATER: Unregister listeners
    // Restore console methods?
    window.console.log = CONSOLE.log;
    window.console.warn = CONSOLE.warn;
    window.console.error = CONSOLE.error;
    window.console.info = CONSOLE.info;
  };
};

function stringifySingleLevel(key, value) {
  if (value === null) {
    return "null";
  }
  if (typeof value === "undefined") {
    return "undefined";
  }
  if (value.hasOwnProperty("id")) {
    return value.id;
  }
  else {
    return value.toString();
  }
}

module.exports = PanelConsole;