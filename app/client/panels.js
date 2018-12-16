var PanelMapping = require("hp/client/PanelMapping");
var PanelNodeSelector = require("hp/client/PanelNodeSelector");
var PanelDeviceSelector = require("hp/client/PanelDeviceSelector");
var PanelGraphNode = require("hp/client/PanelGraphNode");
var PanelNodeUI = require("hp/client/PanelNodeUI");
var PanelNodeEditor = require("hp/client/PanelNodeEditor");
var PanelConsole = require("hp/client/PanelConsole");

var ipc = require('electron').ipcRenderer;

var config = {
  settings: {
    reorderEnabled: true,
    showPopoutIcon: false
  },
  content: [{
    type: 'column',
    content: [{
      type: 'row',
      content: [{
        type: 'stack',
        id: "mappingArea",
        isClosable: false,
        content: [{
          type: 'component',
          componentName: 'mappingPanel',
          isClosable: false,
          title: "Root Mapping",
          id: "rootMappingPanel",
          componentState: {
            id: ipc.sendSync("request-root-id")
          }
        }]
      },
//      {
//        type: 'column',
//        width: 10,
//        content: [{
//          type: 'component',
//          componentName: 'nodeSelector',
//          id: 'nodeSelector',
//          isClosable: false,
//          title: "Nodes"
//        }]
//      }
    ]
    }, {
      type: 'row',
      id: "uiArea",
      height: 20,
      isClosable: false,
      content: [{
        type: 'component',
        componentName: 'consolePanel',
        title: "Console",
        isClosable: false
      }]
    }]
  }]
};

var workspace = document.createElement("div");
workspace.id = "workspace";
document.body.appendChild(workspace);
var myLayout = new GoldenLayout(config, workspace);
var myActiveMapping = null;
var myActiveTab = null;

window.addEventListener("resize", function () {
  myLayout.updateSize();
});

// TODO: There's no reason for this to be associated with Panels. Is there some higher-level UI controller? Is this it?
///Kill backspace behavior:
$(document).unbind('keydown').bind('keydown', function (event) {
  var doPrevent = false;
  if (event.keyCode === 8) {
    var d = event.srcElement || event.target;
    if ((d.tagName.toUpperCase() === 'INPUT' &&
        (
          d.type.toUpperCase() === 'TEXT' ||
          d.type.toUpperCase() === 'PASSWORD' ||
          d.type.toUpperCase() === 'FILE' ||
          d.type.toUpperCase() === 'EMAIL' ||
          d.type.toUpperCase() === 'SEARCH' ||
          d.type.toUpperCase() === 'DATE' ||
          d.type.toUpperCase() === 'NUMBER' )
      ) ||
      d.tagName.toUpperCase() === 'TEXTAREA') {
      doPrevent = d.readOnly || d.disabled;
    }
    else if (!d.isContentEditable) {
      doPrevent = true;
    }
  }

  if (doPrevent) {
    event.preventDefault();
  }
});

//Allows us to delete nodes
document.addEventListener('keydown', function (e) {
  if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA" && !document.activeElement.isContentEditable && !document.querySelector(".handsontable td.current") && myActiveMapping) {
    if ((e.keyCode === 8 || e.keyCode === 46)) {
      // if (myActiveMapping) {
        myActiveMapping.removeSelectedNodes();
      // }
    }
    ////////
    // The following is just a workaround for "common" keyboard shortcuts not being properly handled by
    // Atom/Electron when defined in menus.
    // I'm only adding the workarond for the shortcuts that don't work. The rest are still correctly
    // handled through menu registration in main.js. The menu handlers for these actions still reside
    // there, as well.
    // THIS SHOULD BE FIXED CORRECTLY, at some point, and this workaround removed.
    // I feel somewhat less bad about it, since the ui-events had to end up in panels.js, anyway.
    // VERIFY: This doesn't interfere with OS X handling of these shortcuts, which reportedly worked with
    // how they were defined in the menu template... meanwhile every other discussion online about this
    // problem suggestes that it doesn't work in OS X (without selectors), but does work everywhere else.
    // Oy!
    ////////
    else if (e.ctrlKey && !e.shiftKey && !e.altKey) {
      if (e.keyCode === 0x43) {
        myActiveMapping.copy();
        e.preventDefault();
        e.stopPropagation();
      }
      else if (e.keyCode === 0x56) {
        myActiveMapping.paste();
        e.preventDefault();
        e.stopPropagation();
      }
      else if (e.keyCode === 0x58) {
        myActiveMapping.copy();
        myActiveMapping.removeSelectedNodes();
        e.preventDefault();
        e.stopPropagation();
      }
      else if (e.keyCode === 0x41) {
        myActiveMapping.selectAll(true);
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }
  
});

/////////

// var rootId = ipc.sendSync("request-root-id");
// console.log(rootId);

/* If the IDs are regenerated on every load, is there any way to persist the panel layout and open sub-mappings? */
myLayout.registerComponent('mappingPanel', PanelMapping.initPanel);

var nodeSelector = new PanelNodeSelector();
// myLayout.registerComponent('nodeSelector', nodeSelector.initPanel);
nodeSelector.initPanel(document.body);

var deviceSelector = new PanelDeviceSelector();
myLayout.registerComponent('deviceSelector', deviceSelector.initPanel);

var consolePanel = new PanelConsole();
myLayout.registerComponent('consolePanel', consolePanel.initPanel);

var graphNode = new PanelGraphNode();
myLayout.registerComponent('graphPanel', graphNode.initPanel);

myLayout.registerComponent('nodeUIPanel', PanelNodeUI.initPanel);
myLayout.registerComponent('nodeEditorPanel', PanelNodeEditor.initPanel);

function setActives(contentItem) {
  if (contentItem && contentItem.isComponent) {
    if (contentItem.componentName === 'nodeSelector' || contentItem.componentName === 'deviceSelector') {
      return;
    }
    if (myActiveTab) {
      myActiveTab.tab.element[0].classList.remove("active-tab");
    }
    myActiveTab = contentItem;
    myActiveTab.tab.element[0].classList.add("active-tab");
    if (contentItem.componentName === 'mappingPanel') {
      var mappingContainer = contentItem.element[0].getElementsByClassName("hp-mapping-container")[0];
      if (myActiveMapping !== mappingContainer.panelMapping) {
        myActiveMapping = mappingContainer.panelMapping;
        ipc.send("ui-event", {action: "active-mapping-changed", container: myActiveMapping.id, path: mappingContainer.dataset.fileRef});
      }
    }
  }
}

myLayout.on('stackCreated', function (stack) {
  stack.on('activeContentItemChanged', setActives);
});

myLayout.on('componentCreated', function (component) {
  component.element[0].addEventListener('mousedown', function (e) {
    component.element[0].focus();
    return setActives(component);
  });
  // console.log(Object.getOwnPropertyNames(component.element[0].id));
});

myLayout.on('itemDestroyed', function(contentItem) {
  // TODO: destroy PanelMapping associated with contentItem
});

myLayout.on('initialised', function () {
  setActives(myLayout.root.getItemsById("rootMappingPanel")[0]);
});

//myLayout.root.getItemsById("rootMappingPanel")[0].on('resize', function (container) {
//  container.parent
//});

myLayout.init();

document.addEventListener('add-node-to-active', function (evt) {
  if (myActiveMapping) {
    var bounds = myActiveMapping.viewport.getBoundingClientRect();

    //console.log(myActiveMapping.zoomLevel);
    var relativePosition = {
      left: (((bounds.right - bounds.left)/2) - $(document).scrollLeft() - $(myActiveMapping.mappingContainer).offset().left)*1/myActiveMapping.zoomLevel,
      top : (((bounds.bottom - bounds.top)/2) - $(document).scrollTop() - $(myActiveMapping.mappingContainer).offset().top)*1/myActiveMapping.zoomLevel
    };
    //console.log(relativePosition);

    myActiveMapping.addNode(relativePosition.top, relativePosition.left, evt.detail.nodeName);
  }
});

ipc.on('ui-event', function (evt, refcon) {
  switch (refcon.action) {
    case "closeTab":
      // var area = myLayout.root.getItemsById("mappingArea")[0];
     // if (area) {
        // var tab = area.getActiveContentItem();
        var tab = myActiveTab;
        if (tab && tab.config.isClosable) {
          // tab.remove();
          tab.close();
        }
      // }
      break;
    case "selectAll":
      myActiveMapping.selectAll(true);
      break;
    case "selectNone":
      myActiveMapping.selectAll(false);
      break;
    case "cut":
      myActiveMapping.copy();
      myActiveMapping.removeSelectedNodes();
      break;
    case "copy":
      myActiveMapping.copy();
      break;
    case "duplicate":
      myActiveMapping.copy();
      myActiveMapping.paste();
      break;
    case "paste":
      myActiveMapping.paste();
      break;
    case "nest":
      myActiveMapping.copy();
      myActiveMapping.removeSelectedNodes();
      myActiveMapping.nestCopied();
      break;
    case "mappingLoading":
      myLayout.root.getItemsById("rootMappingPanel")[0].panelMapping.setMappingId(evt.mappingId);
      break;
    case "saveActiveMapping":
      ipc.send("write-node-file", {
        id: myActiveMapping.id,
        path: refcon.filePath,
        fileName: "",
        updateFileRef: refcon.updateFileRef
      });
      if (refcon.updateFileRef) {
        myActiveMapping.mappingContainer.parentElement.dataset.fileRef = refcon.filePath;
      }
      break;
    case "togglePortEditorVisibility":
      document.body.classList.toggle("hidePortEditors");
      break;
    case "togglePortEditorsSelected":
      var ids = myActiveMapping.getSelection();
      ids.forEach(function (id) {
        var nodeEl = document.getElementById(id);
        if (nodeEl) {
          var portDivs = nodeEl.querySelectorAll(".hp-port");
          for (var i = 0; i < portDivs.length; i++) {
            var port = portDivs[i];
            if (refcon.state === "open" && port.children.length < 1) {
              myActiveMapping._updatePortEditorVisible(port.id, true);
            }
            else if (refcon.state === "close" && port.children.length > 0) {
              myActiveMapping._updatePortEditorVisible(port.id, false);
            }
            else if (refcon.state === "input" && port.parentElement.className === "hp-node-inputs" && port.children.length < 1) {
              myActiveMapping._updatePortEditorVisible(port.id, true);
            }
//            else if (refcon.state === "unconnected" && port.dataset.connected && port.children.length < 1) {
//              myActiveMapping._updatePortEditorVisible(port.id, true);
//            }
          }
        }
      });
      break;
    case "closePortEditors":
      for (var c in myActiveMapping.activePortEditors) {
        ipc.send('request-mapping-change', {
          "action": "cancel-port-value-updates",
          "id": c
        });
        myActiveMapping.activePortEditors[c].element.removeChild(myActiveMapping.activePortEditors[c].element.children[0]);
        delete myActiveMapping.activePortEditors[c];
      }
      break;
    case "reset-port-values-selected":
      ipc.send('ui-event', {
        action: "reset-port-values-selected",
        filter: refcon.filter,
        nodes: myActiveMapping.getSelection()
      });
      break;
    case "setSnap":
      PanelMapping.snapUnit = (refcon.snapEnabled) ? refcon.snapUnit : 0;
      break;
    default:
      break;
  }
});

function raiseTab(contentItem) {
  var stack = contentItem.parent;
  while (!stack.isStack) {
    stack = stack.parent;
  }
  stack.setActiveContentItem(contentItem);
}

/* TODO: There are lots of fiddly things that need to be addressed:
    Change ui/editor/mapping tab titles when on change of nodeName
*/

var panelIdRegexp = /(?:-mapping|-editor|-ui)$/;
var panelIdTypes = ["-ui", "-mapping", "-editor"];
ipc.on('mapping-changed', function (evt, refcon) {
  switch (refcon.action) {
    case "remove-node":
      if (refcon.uiOnly) {
        break;
      }
      var panel = myLayout.root.getItemsById(refcon.node + "-editor")[0];
      if (panel) {
        panel.remove();
      }
      panel = myLayout.root.getItemsById(refcon.node + "-ui")[0];
      if (panel) {
        panel.remove();
      }
      panel = myLayout.root.getItemsById(refcon.node + "-mapping")[0];
      if (panel) {
        panel.remove();
      }
        // For some reason, the filter version doesn't work.
//        var panels = myLayout.root.getItemsByFilter(function (item) {
//                  console.log(item.type + " - " + item.id);
//          // return (item.id.startsWith(refcon.node) && item.id.test(panelIdRegexp));
//          return false;
//        });
//        panels.forEach(function (panel) {
//          panel.remove();
//        });
      break;
    default:
      break;
  }
});

// FIXME: This event is never getting called. Who knows why not?
ipc.on("configured-node", function (evt, refcon) {
  console.log("configured-node");
  switch (refcon.action) {
    case "set-node-name":
      var panel = myLayout.root.getItemsById(refcon.id + "-editor")[0];
      if (panel) {
        console.log(panel + "- " + refcon.nodeName);
        panel.setTitle(refcon.nodeName);
      }
      panel = myLayout.root.getItemsById(refcon.id + "-ui")[0];
      if (panel) {
        console.log(panel + "- " + refcon.nodeName);
        panel.setTitle(refcon.nodeName);
      }
      panel = myLayout.root.getItemsById(refcon.id + "-mapping")[0];
      if (panel) {
        panel.setTitle((refcon.nodeName ? refcon.nodeName + " " : "") + "Mapping");
      }
      break;
    default:
      break;
  }
});

ipc.on('node-ui', function (evt, refcon) {
  var area;
  var existing = myLayout.root.getItemsById(refcon.id + "-ui")[0];
  if (existing) {
    raiseTab(existing);
  }
  else {
    area = myLayout.root.getItemsById("uiArea")[0];
    if (!area) {
      area = myLayout.root.getItemsById("rootMappingPanel")[0];
      area.parent.addChild({
        type: 'row',
        id: "uiArea",
        height: 20,
        isClosable: false
      });
      area = myLayout.root.getItemsById("uiArea")[0];
    }
    area.addChild({
      type: 'component',
      componentName: 'nodeUIPanel',
      isClosable: true,
      title: refcon.nodeName,
      id: refcon.id + "-ui",
      componentState: {
        id: refcon.id,
        defn: refcon.defn,
        ports: refcon.ports
      }
    });
  }
});

ipc.on('node-editor', function (evt, refcon) {
  var area;
  var existing;
  if (refcon.nodeType === 'mapping') {
    existing = myLayout.root.getItemsById(refcon.id + "-mapping")[0];
    if (existing) {
      raiseTab(existing);
    }
    else {
      // area = myLayout.root.getItemsById("mappingArea")[0];
      area = myLayout.root.getItemsById("rootMappingPanel")[0].parent;
      area.addChild({
        type: 'component',
        componentName: 'mappingPanel',
        isClosable: true,
        title: (refcon.defn.nodeName ? refcon.defn.nodeName + " " : "") + "Mapping",
        id: refcon.id + "-mapping",
        componentState: {
          id: refcon.id,
          defn: refcon.defn
        }
      });
      // console.log("Requesting rebuild UI for " + refcon.id);
      ipc.send("request-mapping-change", {action: "rebuild-ui", container: refcon.id});
    }
  }
  else {
    existing = myLayout.root.getItemsById(refcon.id + "-editor")[0];
    if (existing) {
      raiseTab(existing);
    }
    else {
      area = myLayout.root.getItemsById("uiArea")[0];
      if (!area) {
        area = myLayout.root.getItemsById("rootMappingPanel")[0];
        // LATER: Open in correct tab area
        area.parent.parent.addChild({
          type: 'row',
          id: "uiArea",
          height: 20,
          isClosable: false
        });
        area = myLayout.root.getItemsById("uiArea")[0];
      }
      area.addChild({
        type: 'component',
        componentName: 'nodeEditorPanel',
        isClosable: true,
        title: (refcon.defn.nodeName ? refcon.defn.nodeName + " " : "") + refcon.defn.nodetype,
        id: refcon.id + "-editor",
        componentState: {
          id: refcon.id,
          defn: refcon.defn,
          procfn: refcon.procfn,
          initFn: refcon.initFn,
          tick: refcon.tick
        }
      });
    }
  }
});

function fileDragOver(e) {
  // TODO: Test for file compatability here, right?
  e.stopPropagation();
  e.preventDefault();
  if (e.dataTransfer.types[0] === "Files") {
    e.dataTransfer.dropEffect = (e.shiftKey) ? "copy" : ((e.ctrlKey || e.metaKey) ? "link" : "move");
  }
  else {
    e.dataTransfer.dropEffect = "none";
  }
}
workspace.addEventListener("dragenter", fileDragOver, false);
workspace.addEventListener("dragover", fileDragOver, false);

workspace.addEventListener("drop", function(e) {
  e.stopPropagation();
  e.preventDefault();
  var files = e.dataTransfer.files;
  if (files.length > 0) {
    // ipc.send("request-load", {action: (e.shiftKey) ? "import" : ((e.ctrlKey || e.metaKey) ? "open" : "nest"), file: files[0]});
    if (e.shiftKey) {
      ipc.send("request-load", {action: "import", file: files[0].path});
    }
    else if (e.ctrlKey || e.metaKey) {
      // TODO: Also add a way to bring in nodes defn files.
      ipc.send("request-load", {action: "nest", file: files[0].path, x: e.clientX, y: e.clientY, containerId: myActiveMapping.id});
    }
    else {
      ipc.send("request-load", {action: "open", file: files[0].path});
    }
  }
}, false);
