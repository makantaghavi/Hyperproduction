var ipc = require('electron').ipcRenderer;
var DefaultValue = require("hp/model/ports").DefaultValue; 

function PanelNodeEditor(id) {
  var that = this;
  this.nodeId = id;
  this.element = document.createElement("div");
  this.element.className = "panelEditor";
  
  var el = document.createElement("label");
  el.setAttribute("for", id + "-nodetype");
  el.textContent = "Node Type";
  this.element.appendChild(el);
  this.nodeType = document.createElement("input");
  this.nodeType.setAttribute("type", "text");
  this.nodeType.id = id + "-nodetype";
  this.element.appendChild(this.nodeType);
  
  // TODO: Pressing [Delete] with a port selected in either <select> should remove that port.
  
  
  // TODO: Handle other port options, such as type and default value
  el = document.createElement("div");
  el.className = "editorPorts";
  var portel = document.createElement("div");
  this.inPorts = document.createElement("select");
  this.inPorts.setAttribute("size", 6);
  portel.appendChild(this.inPorts);
  var portname = document.createElement("input");
  portname.setAttribute("type", "text");
  portname.setAttribute("autofocus", "autofocus");
  portname.addEventListener("change", function (e) {
    var v = e.target.value.replace(/\//g,"_").replace(/\./g,"_").replace(/:/g,"p");
//    var firstChar = v.charAt(0);
//    if( firstChar <='9' && firstChar >='0') {
//          v = "a"+v;
//    }
    if (v) {
      // TODO: Make sure a port with this name doesn't already exist.
      var opt = document.createElement("option");
      opt.textContent = v;
      that.inPorts.appendChild(opt);
      e.target.value = "";
      updateModel();
    }
  });
  portel.appendChild(portname);
  var portrem = document.createElement("button");
  portrem.textContent = "–";
  portrem.addEventListener("click", function (e) {
    var children = that.inPorts.childNodes;
    for (var i = 0; i < children.length; i++) {
      if (children[i].selected) {
        that.inPorts.removeChild(children[i]);
        updateModel();
        break;
      }
    }
  });
  portel.appendChild(portrem);
  el.appendChild(portel);
  
  portel = document.createElement("div");
  this.outPorts = document.createElement("select");
  this.outPorts.setAttribute("size", 6);
  portel.appendChild(this.outPorts);
  portname = document.createElement("input");
  portname.setAttribute("type", "text");
  portname.addEventListener("change", function (e) {
    var v = e.target.value.replace(/\//g,"_").replace(/\./g,"_").replace(/:/g,"p");
//    var firstChar = v.charAt(0);
//    if( firstChar <='9' && firstChar >='0') {
//          v = "a"+v;
//    }
    if (v) {
      // TODO: Make sure a port with this name doesn't already exist.
      var opt = document.createElement("option");
      opt.textContent = v;
      that.outPorts.appendChild(opt);
      e.target.value = "";
      updateModel();
    }
  });
  portel.appendChild(portname);
  portrem = document.createElement("button");
  portrem.textContent = "–";
  portrem.addEventListener("click", function (e) {
    var children = that.outPorts.childNodes;
    for (var i = 0; i < children.length; i++) {
      if (children[i].selected) {
        that.outPorts.removeChild(children[i]);
        updateModel();
        break;
      }
    }
  });
  portel.appendChild(portrem);
  el.appendChild(portel);
  this.element.appendChild(el);
  
  el = document.createElement("label");
  el.setAttribute("for", id + "-procfn");
  el.textContent = "Processing Function";
  this.procfnArea = document.createElement("textarea");
  this.procfnArea.id = id + "-procfn";
  this.procfnArea.dataset.nodeProperty = "procfn";
  this.procfnArea.addEventListener('change', updateModel);
  this.element.appendChild(el);
  this.element.appendChild(this.procfnArea);
  
  el = document.createElement("label");
  el.setAttribute("for", id + "-tick");
  el.textContent = "Tick Function";
  this.tickArea = document.createElement("textarea");
  this.tickArea.id = id + "-tick";
  this.tickArea.dataset.nodeProperty = "tick";
  this.tickArea.addEventListener('change', updateModel);
  this.element.appendChild(el);
  this.element.appendChild(this.tickArea);
  
  el = document.createElement("label");
  el.setAttribute("for", id + "-initFn");
  el.textContent = "Init Function";
  this.initFnArea = document.createElement("textarea");
  this.initFnArea.id = id + "-initFn";
  this.initFnArea.dataset.nodeProperty = "initFn";
  this.initFnArea.addEventListener('change', updateModel);
  this.element.appendChild(el);
  this.element.appendChild(this.initFnArea);
  
  el = document.createElement("label");
  el.setAttribute("for", id + "-uiDefn");
  el.textContent = "UI Definition";
  this.uiDefnArea = document.createElement("textarea");
  this.uiDefnArea.id = id + "-uiDefn";
  this.uiDefnArea.dataset.nodeProperty = "uiDefn";
  this.uiDefnArea.addEventListener('change', updateModel);
  this.element.appendChild(el);
  this.element.appendChild(this.uiDefnArea);
  
  el = document.createElement("button");
  el.textContent = "Export Node Definition";
  el.addEventListener('click', function (e) {
    var name = that.nodeType.value.replace(/[^a-zA-Z0-9_-]/g, "");
    var str = buildDefnString();
    ipc.send('write-file', {
      path: "/../nodes/",
      fileName: name + ".js",
      data: "var Type = require(\"hp/model/ports\").Type;\nvar RunningState = require(\"hp/model/MapNode\").RunningState;\nmodule.exports." + name + " = " + str + "();"
    });
  });
  
  this.element.appendChild(el);
  
  function buildDefnString() {
    // This can't just be JSON serialized or passed as an object due to the procfn.
    var defn = "(function () {return {nodetype:\"" + that.nodeType.value + ((that.nodeType.value === that.origNodeType && !that.origNodeType.endsWith("-custom")) ? "-custom" : "") + "\",inputs:{";
    var pl = that.inPorts.children;
    for (var i = 0; i < pl.length; i++) {
      var type = (typeof pl[i].dataset.type !== "undefined" && pl[i].dataset.type !== "undefined") ? pl[i].dataset.type : "ANY";
      var dflt = (typeof pl[i].dataset.defaultValue !== "undefined" && pl[i].dataset.defaultValue !== "undefined") ? pl[i].dataset.defaultValue : DefaultValue[type];
      var fixed = (typeof pl[i].dataset.fixed !== "undefined" && pl[i].dataset.fixed !== "undefined") ? pl[i].dataset.fixed : "false";
      var continuous = (typeof pl[i].dataset.continuous !== "undefined" && pl[i].dataset.continuous !== "undefined") ? pl[i].dataset.continuous : "true";
      defn += pl[i].textContent + `:{type: "${type}", defaultValue: ${JSON.stringify(dflt)}, fixed: ${fixed}, continuous: ${continuous}`;
      if (typeof pl[i].dataset.enum !== "undefined" && pl[i].dataset.enum !== "undefined") {
        defn += `, enum: ${pl[i].dataset.enum}`;
      }
      if (typeof pl[i].dataset.published !== "undefined" && pl[i].dataset.published) {
        defn += ", published: true";
      }
      defn += "},";
    }
    defn += "},outputs:{";
    pl = that.outPorts.children;
    for (var i = 0; i < pl.length; i++) {
      var type = (typeof pl[i].dataset.type !== "undefined" && pl[i].dataset.type !== "undefined") ? pl[i].dataset.type : "ANY";
      var dflt = (typeof pl[i].dataset.defaultValue !== "undefined" && pl[i].dataset.defaultValue !== "undefined") ? pl[i].dataset.defaultValue : DefaultValue[type];
      var fixed = (typeof pl[i].dataset.fixed !== "undefined" && pl[i].dataset.fixed !== "undefined") ? pl[i].dataset.fixed : "false";
      defn += pl[i].textContent + `:{type: "${type}", defaultValue: ${JSON.stringify(dflt)}, fixed: ${fixed}},`;
    }
    defn += "},procfn:" + that.procfnArea.value + ",";
    if (that.tickArea.value) {
      defn += "tick:" + that.tickArea.value + ",";
    }
    if (that.initFnArea.value) {
      defn += "initFn:" + that.initFnArea.value + ",";
    }
    if (that.uiDefnArea.value) {
      defn += "uiDefn:" + that.uiDefnArea.value;
    }
    defn += "};})";
    return defn;
  }
  
  function updateModel(e) {
    //console.log("Updating model with modified defn");
    ipc.send('request-configure-node', {
      action: 'set-node-defn',
      id: that.nodeId,
      defn: buildDefnString()
    });
  }
}

function removeChildren(element) {
  while (element.lastChild) {
    element.removeChild(element.lastChild);
  }
}

function createPortUI(element, ports) {
  removeChildren(element);
  var port;
  for (var pn in ports) {
//    if (!ports[pn].fixed) {
      port = document.createElement("option");
      port.textContent = pn;
      port.hidden = (ports[pn].fixed);
      port.dataset.type = (ports[pn].type);
      port.dataset.fixed = (ports[pn].fixed);
      port.dataset.enum = (ports[pn].enum);
      port.dataset.published = (ports[pn].published);
      port.dataset.defaultValue = (ports[pn].defaultValue);
      if (ports[pn].continuous) {
        port.dataset.continuous = (ports[pn].continuous);
      }
      element.appendChild(port);
//    }
  }
}

PanelNodeEditor.prototype.setNodeDefn = function (nodeDefn, procfn, tick, initFn) {
  this.nodeDefn = nodeDefn;
  this.nodeType.value = nodeDefn.nodetype;
  this.origNodeType = nodeDefn.nodetype;
  
  createPortUI(this.inPorts, nodeDefn.inputs);
  createPortUI(this.outPorts, nodeDefn.outputs);
    
  this.procfnArea.textContent = (procfn !== 'undefined') ? procfn : "";
  this.initFnArea.textContent = (initFn !== 'undefined') ? initFn : "";
  this.tickArea.textContent = (tick !== 'undefined') ? tick : "";
  this.uiDefnArea.textContent = nodeDefn.uiDefn ? JSON.stringify(nodeDefn.uiDefn) : "";
};

PanelNodeEditor.initPanel = function (container, componentState) {
  var panel = new PanelNodeEditor(componentState.id);
  var element = panel.element;
  element.id = componentState.id + "-editorPanel";
 //  element.textContent = JSON.stringify(componentState);
  // console.log(JSON.stringify(componentState.defn));
  
  panel.setNodeDefn(componentState.defn, componentState.procfn, componentState.tick, componentState.initFn);
  
  container.getElement()[0].appendChild(element);
};

module.exports = PanelNodeEditor;
