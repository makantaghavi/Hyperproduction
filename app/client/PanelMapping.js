// var ContainerMapNode = require("hp/model/ContainerMapNode");
var OscDeviceModules = require("hp/model/OscDeviceModules");
var bb = require("hp/model/benb_utils");
var ipc = require('electron').ipcRenderer;
var MathUtil = require("hp/lib/ptlib/util/MathUtil");

var PanelMapping = function () {
  var that = this;
  var selectedNodes = new Set();
  var dragStart = false;
  //that.currentsource = undefined;
  this.id = null;
  this.activePortEditors = {};


  this.initPanel = function (container, componentState) {
    
    that.viewport = document.createElement('div');
    that.mappingContainer = document.createElement('div');

    that.setMappingId(componentState.id);
    that.viewport.panelMapping = that;
    // console.log("ComponentState", componentState);
    if (componentState.hasOwnProperty("defn") && componentState.defn.hasOwnProperty("fileRef")) {
      that.viewport.dataset.fileRef = componentState.defn.fileRef;
    }
//    that.mappingContainer.className = "hp-mapping-container";
    that.viewport.appendChild(that.mappingContainer);
    that.viewport.className = "hp-mapping-container";

    $(that.mappingContainer).droppable({
      accept: ".hp-node-list-item",
      activeClass: "_jsPlumb_target_hover",
      hoverClass: "_jsPlumb_target_hover",
      drop: function (event, ui) {

        var relativePosition = {
          left: (event.pageX - $(document).scrollLeft() - $(that.mappingContainer).offset().left)*1/that.zoomLevel,
          top : (event.pageY - $(document).scrollTop() - $(that.mappingContainer).offset().top)*1/that.zoomLevel
        };

        var pos = relativePosition;
        switch (ui.draggable.get()[0].dataset.ntype) {
          case "MAPNODE":
            //            console.log("SAW MAP NODE");
            that.addNode(pos.top, pos.left, ui.draggable.html());
            break;
//          case "OSCNODE":
//            //            console.log("SAW OSC NODE");
//            that.addOscNode(pos.top, pos.left, ui.draggable.html());
//            break;
          default:
            break;
        }
        ui.helper.hide();
      }
    });
    
    // Node Header Title Editing Support
    // There's going to be a "bug" here with the parenthetical names, as string the user edits is nodeName not _nodeName, so, if the user doesn't remove the parenthetical name, it will become part of the user name.
    // Fetching _nodeName would help, but that's not so easy over IPC.
    that.mappingContainer.addEventListener("dblclick", function (e) {
      if (e.target.classList.contains("hp-node-header") && e.shiftKey) {
        e.stopPropagation();
        e.target.dataset.oldName = e.target.textContent;
        e.target.contentEditable = true;
        var r = document.createRange();
        r.selectNodeContents(e.target);
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(r);
      }
      else if (e.target.classList.contains("hp-node") || e.target.classList.contains("hp-node-header")) {
        // var evt = new CustomEvent('node-ui', {container: that.mappingContainer.id, id: e.target.id, editMode: e.ctrlKey});
        // that.mappingContainer.dispatchEvent(evt);
        var targetId = (e.target.classList.contains("hp-node-header")) ? e.target.parentElement.id : e.target.id;
        if (e.ctrlKey || e.metaKey) {
          ipc.send('request-node-editor', {container: that.id, id: targetId});
        }
        else {
          ipc.send('request-node-ui', {container: that.id, id: targetId});
        }
      }
    }, false);
    
    
    
    that.mappingContainer.addEventListener('click', function (e) {
      var nn = e.target;
      if (nn === that.mappingContainer) {
        // If we're not clicking on a node, the marquee mouseup should be able to handle this case.
        return;
      }
      
      while (nn !== e.currentTarget && !nn.classList.contains("hp-node")) {
        nn = nn.parentElement;
      }

      if (dragStart) {
        dragStart = false;
        return;
      }
      
      if (nn.classList.contains("hp-node")) {
        
        if (e.shiftKey || e.ctrlKey) {
          // if (nn.classList.contains("selected")) {
          if (selectedNodes.has(nn)) {
            // that.graph.removeFromDragSelection(nn);
            nn.classList.remove("selected");
            selectedNodes.delete(nn);
          }
          else {
            // that.graph.addToDragSelection(nn);
            nn.classList.add("selected");
            selectedNodes.add(nn);
          }
        }
        else if (e.altKey) {
          nn.classList.toggle("muted");
          ipc.send('request-configure-node', {
            "container": that.id,
            "action": "mute-node",
            "id": nn.id,
            "muted": nn.classList.contains("muted")
          });
        }
        else {
          that.selectAll(false);
          // that.graph.addToDragSelection(nn);
          nn.classList.add("selected");
          selectedNodes.add(nn);
        }
      }
      else {
        that.selectAll(false);
      }
      dragStart = false;
    }, true);

    function changeNodeName(nodeUI, confirm) {
      if (confirm) {
        // Commit title change to node model
        ipc.send('request-configure-node', {
          "container": that.id,
          "action": "set-node-name",
          "id": nodeUI.parentElement.id,
          "value": nodeUI.textContent
        });
        nodeUI.dataset.nodename = nodeUI.textContent;
      }
      else {
        // Restore node title from model
        nodeUI.textContent = nodeUI.dataset.oldName;
      }
      nodeUI.contentEditable = false;
      delete nodeUI.dataset.oldName;
      // that.graph.revalidate(nodeUI.parentElement); // revalidate?
      that.graph.repaintEverything();
    }

    that.mappingContainer.addEventListener("keydown", function (e) {
      if (e.target.classList.contains("hp-node-header")) {
        if (e.keyCode == 0x0D) {
          changeNodeName(e.target, true);
        }
        else if (e.keyCode == 0x1B) {
          changeNodeName(e.target, false);
        }
      }
    }, false);

    that.mappingContainer.addEventListener("mousedown", function (e) {
      if (document.activeElement.classList.contains("hp-node-header") && e.target !== document.activeElement) {
        changeNodeName(document.activeElement, true);
      }
      document.activeElement.blur();
    }, false);

    var marquee = document.createElement("div");
    marquee.className = "marquee";
    that.mappingContainer.appendChild(marquee);
    marquee.style.display = "none";
    
    function dragMarquee(e) {
      // if (typeof dragStart !== "object") return;
      var ex = (e.clientX + this.parentElement.scrollLeft - this.parentElement.offsetLeft) / that.zoomLevel;
      var ey = (e.clientY + this.parentElement.scrollTop - this.parentElement.offsetTop) / that.zoomLevel;
      marquee.style.left = Math.min(ex, dragStart.x) + "px";
      marquee.style.top = Math.min(ey, dragStart.y) + "px";
      marquee.style.width = Math.abs(ex - dragStart.x) + "px";
      marquee.style.height = Math.abs(ey - dragStart.y) + "px";
      marquee.style.display = "block";
    }
    
    function endMarquee(e) {
      if (typeof dragStart === "object") {
        if (!e.shiftKey) {
          that.selectAll(false);
        }
        var allNodes = that.mappingContainer.querySelectorAll(".hp-node");
        var marqueeRect = marquee.getBoundingClientRect();
        Array.prototype.forEach.call(allNodes, function (node) {
          if (rectContains(marqueeRect, node.getBoundingClientRect())) {
            node.classList.add("selected");
            selectedNodes.add(node);
          }
        });
        dragStart = false;
      }
      that.mappingContainer.removeEventListener("mousemove", dragMarquee);
      that.mappingContainer.removeEventListener("mouseup", endMarquee);
      marquee.style.display = "none";
    }
    
    function dragPan(e) {
      that.mappingContainer.parentElement.scrollLeft -= e.movementX;
      that.mappingContainer.parentElement.scrollTop -= e.movementY;
    }
    
    function endPan(e) {
      that.mappingContainer.removeEventListener("mousemove", dragPan);
      that.mappingContainer.removeEventListener("mouseup", endPan);
      that.mappingContainer.removeEventListener("mouseout", endPan);
      that.mappingContainer.parentElement.classList.remove("panning");
    }
    
    // that.mappingContainer.addEventListener(dragMarquee, false);
    
    that.mappingContainer.addEventListener("mousedown", function (e) {
      if (e.target === that.mappingContainer) {
        // We only care about this when the mouse goes down not on a node or other element
        dragStart = {x: (e.clientX + this.parentElement.scrollLeft - this.parentElement.offsetLeft) / that.zoomLevel, y: (e.clientY + this.parentElement.scrollTop - this.parentElement.offsetTop) / that.zoomLevel};
        if (e.ctrlKey || e.button === 1) {
          that.mappingContainer.addEventListener("mouseup", endPan);
          that.mappingContainer.addEventListener("mouseout", endPan);
          that.mappingContainer.addEventListener("mousemove", dragPan);
          that.mappingContainer.parentElement.classList.add("panning");
        }
        else {
          that.mappingContainer.addEventListener("mouseup", endMarquee);
          that.mappingContainer.addEventListener("mousemove", dragMarquee);
        }
        e.preventDefault();
      }
    });
      
    container.getElement()[0].appendChild(that.viewport);
    container.panel = that;

    that.graph = initJSPlumb(that.mappingContainer, that.activePortEditors);

    var graph = that.graph;

    var userRemovedConnection = false;

    graph.bind('beforeDrop', function (info) {
      //that.removeConnection(null,c.targetId);
      that.addConnection(info.sourceId, info.targetId);
      return false;
    });
    var currentsource = undefined;

    graph.bind('endpointClick', function (endpt, e) {
      if (e.altKey){
        if(e.shiftKey){
          if (endpt.isSource){
            if (currentsource===undefined || currentsource.cssClass == null){
              currentsource = endpt; 
              currentsource.cssClass = 'current-source'; 
            }
            if (true){
              if (currentsource.elementId != endpt.elementId){
                currentsource.cssClass = undefined;
                try{currentsource.setPaintStyle({strokeStyle:"#47b13e"});}
                catch(err){
                  currentsource = endpt;
                }
                currentsource = endpt;
                currentsource.cssClass = 'current-source';
              }
            }
            if (currentsource.cssClass == 'current-source'){
              if (currentsource.paintStyle !=({strokeStyle:'#FF0000', fillStyle:"#FF0000"})){
                currentsource.setPaintStyle({strokeStyle:'#FF0000', fillStyle:"#FF0000"});
              }
            }
            
          }
          if (endpt.isTarget){
            that.addConnection(currentsource.elementId, endpt.elementId);
          }
        }
      }
    });
    graph.bind('beforeDetach', function(info) {
      userRemovedConnection = true;
      return true;
    });

    graph.bind('connectionDetached', function(info){
      if (!info.connection.pending && userRemovedConnection) {
        that.removeConnection(info.sourceId, info.targetId);
        userRemovedConnection=false;
      }
      return true;
    }); 

    graph.bind('connectionMoved', function(info){
      that.removeConnection(info.originalSourceId, info.originalTargetId);
      //graph.detach(graph.getEndpoint(info.originalTargetId).connections[0]);
      that.addConnection(info.newSourceId,info.newTargetId);
      return true;
    }); 

    if (container.isHidden) {
      graph.setSuspendDrawing(true);
    }
    else {
      graph.setSuspendDrawing(false, true);
    }

    container.on("hide", function (e) {
      // VERIFY: call()ing due to what maybe a bug in jsPlumb
      graph.setSuspendDrawing.call(graph, true);
    });

    container.on("show", function (e) {
      graph.recalculateOffsets(that.mappingContainer);
//      graph.setSuspendDrawing(false, true);
      // VERIFY: bind()ing callback due to what maybe a bug in jsPlumb
      window.setTimeout(graph.setSuspendDrawing.bind(graph), 1, false, true);
    });

    container.on("destroy", this.destroy);

    container.on("resize", function (e) {
      graph.recalculateOffsets(that.mappingContainer);
      graph.setSuspendDrawing(false, true);
    });
    
    this.zoomLevel = 1.0;
    that.viewport.addEventListener("mousewheel", function (e) {
      if (e.ctrlKey || e.metaKey) {
        that.zoomLevel = MathUtil.clip(that.zoomLevel - e.deltaY / 1000.0, 0.25, 2);
        that.mappingContainer.style.transform = "scale(" + that.zoomLevel + ")";
        var vBounds = that.viewport.getBoundingClientRect();
        var mBounds = that.mappingContainer.getBoundingClientRect();
        // var x = ((e.clientX - vBounds.left) / (vBounds.right - vBounds.left)) * (mBounds.right - mBounds.left) + mBounds.left;
        // var y = ((e.clientY - vBounds.top) / (vBounds.bottom - vBounds.top)) * (mBounds.bottom - mBounds.top) + mBounds.top;
        var x = ((vBounds.right - vBounds.left) * 0.5 + vBounds.left + that.mappingContainer.offsetLeft) / (mBounds.right - mBounds.left);
        var y = ((vBounds.bottom - vBounds.top) * 0.5 + vBounds.top + that.mappingContainer.offsetTop) / (mBounds.bottom - mBounds.top);
        that.mappingContainer.style.transformOrigin = (x * 100) + "% " + (y * 100) + "%";
        that.mappingContainer.style.transformOrigin = "0 0";
        that.graph.setZoom(that.zoomLevel);
        e.preventDefault();
        e.stopPropagation();
      }
    });
    
    
    function showPortEditors(e) {
      document.body.classList.remove("hidePortEditors");
      scrollInteractionTimer = null;
    }
    var scrollInteractionTimer = null;
    var restorePortEditors = true;
    that.viewport.addEventListener("scroll", function (e) {
      if (!scrollInteractionTimer) {
        restorePortEditors = !document.body.classList.contains("hidePortEditors");
      }
      if (restorePortEditors) {
        window.clearTimeout(scrollInteractionTimer);
        document.body.classList.add("hidePortEditors");
        scrollInteractionTimer = window.setTimeout(showPortEditors, 300);
      }
    });
    
    document.addEventListener("keyup", function (e) {
      if (String.fromCharCode(e.keyCode) === "0" && (e.ctrlKey || e.metaKey)) {
        that.zoomLevel = 1.0;
        that.mappingContainer.style.transform = "scale(" + that.zoomLevel + ")";
        that.graph.setZoom(that.zoomLevel);
      }
    });

    ipc.on('mapping-changed', this.modelListeners);

  };

  this.modelListeners = function (evt, refcon) {
      if (refcon.container === that.id) {
        // console.log("ID Checks out!");
        switch (refcon.action) {
          case 'add-node':
            that._addNode(refcon);
            break;
          case 'remove-node':
            that._removeNode(refcon.container, refcon.node);
            break;
          case 'move-node':
            break;
          case 'move':
            break;
          case 'add-connection':
            // console.log("adding connection to ui", refcon);
            that._addConnection(refcon.sourceId, refcon.targetId, refcon.connection);
            break;
          case 'remove-connection':
            that._removeConnection(refcon.connection, refcon.sourceId, refcon.targetId);
            break;
          case 'update-port-value':
            //console.log("updating port val");
            that._updatePortValue(refcon.id, refcon.value);
            break;
          case 'toggle-publish-port':
            that._updatePortPublished(refcon.id, refcon.published);
            break;
          case 'show-port-editor':
            that._updatePortEditorVisible(refcon.id, refcon.editor);
            break;
          case 'selected-nodes':
            var ids = refcon.selected;
            if (Array.isArray(ids)) {
              var el;
              that.selectAll(false);
              ids.forEach(function (id) {
                el = document.getElementById(id);
                if (el) {
                  el.classList.add("selected");
                  selectedNodes.add(el);
                }
              });
            }
            // that;
            break;
          default:
            break;
        }
      }
    };
  
  this.setMappingId = function (id) {
    that.id = id;
    that.mappingContainer.id = id+"-mappingContainer";
  };
  
  this.destroy = function (e) {
    // console.log("DESTROYING PANEL MAPPING - destory callback", that.activePortEditors);
    //Close and cancel all port editor updates before closing the panel
    for (var c in that.activePortEditors) {
      // console.log("Removing port editor ", c);
      //that.activePortEditors[c].element.removeChild(that.activePortEditors[c].element.children[0]);
      cancelPortValueUpdates(c);
      //delete this.activePortEditors[c];
    }

    ipc.removeListener('mapping-changed', that.modelListeners);

    that.graph.reset();
    selectedNodes.clear();
    selectedNodes = null;


    while (that.mappingContainer.lastChild) {
      that.mappingContainer.removeChild(that.mappingContainer.lastChild);
    }
    that.setMappingId(null);
    that.mappingContainer = null;
    console.log("everything is gone now....");
    return true;
    // LATER: We really should be removing all listeners for this PanelMapping on mappingContainer, document, ipc, et cetera.
  };

  this._addConnection = function (s, t, c) {
    this.graph.getEndpoint(t).setParameter("connection", c);
    this.graph.connect({
      uuids: [s, t]
    });
  };

  this._updatePortValue = function (id, value) {
    var el = document.getElementById(id).children[0];
    if (el.type && el.type === "checkbox") {
      el.checked = value;
    }
    else if (el.type && el.type === "color") {
      el.value = "#" + ("000000" + value.toString(16)).substr(6);
    }
    else {
      el.value = value;
    }
  };

  this._updatePortPublished = function(id, published) {
    var that = this;
    // this.graph.selectEndpoints().each(function(endpoint) {
    var endpoint = this.graph.getEndpoint(id);
    if (endpoint) {
      // console.log(that.id, id, endpoint.elementId, id === endpoint.elementId, published);
      if (id === endpoint.elementId) {
        if (published) {
          endpoint.setPaintStyle({
            fillStyle: "#1144DD"
          });
        } else {
          endpoint.setPaintStyle({
            fillStyle: "#47b13e"
          });
        }
      }
    // });
    }
  };
  
  this._updatePortEditorVisible = function (id, showEditor) {
    this.graph.selectEndpoints().each(function (endpoint) {
      if (id === endpoint.elementId) {
        if (showEditor) {
          _showPortEditor(endpoint);
          that.activePortEditors[endpoint.elementId] = endpoint;
        }
        else {
          // hide editor... this isn't going to happen, anyway
          // Well, I'm using this now as if it were a public API for the menu commands, so we do want to close things.
          ipc.send('request-mapping-change', {
            "action": "cancel-port-value-updates",
            "id": id
          });
          that.activePortEditors[id].element.removeChild(that.activePortEditors[id].element.children[0]);
          delete that.activePortEditors[id];
        }
      }
    });
  };

  this.addConnection = function (sourceId, targetId) {
    ipc.send('request-mapping-change', {
      "action": "add-connection",
      "container": that.id,
      "sourceId": sourceId,
      "targetId": targetId
    });
  };

  this.removeConnection = function (s, t) {
    var c = this.graph.getEndpoint(t).getParameter("connection");
    ipc.send('request-mapping-change', {
      "action": "remove-connection",
      "container": that.id,
      "connection": c,
      "sourceId": s,
      "targetId": t
    });
  };

  this._removeConnection = function (sourceId, targetId) {
    // var conns=this.graph.getEndpoint(targetId).connections
    // if (conns.length > 0) {
    //   this.graph.detach(conns[0]);
    // }
  };

  this.addNode = function (top, left, nodeName) {
    ipc.send('request-mapping-change', {
      "action": "add-node",
      "container": that.id,
      "nodeType": nodeName,
      "x": left,
      "y": top
    });
  };

  this.addOscNode = function (top, left, nodeName) {
    ipc.send('request-mapping-change', {
      "action": "add-osc-node",
      "container": that.id,
      "nodeType": nodeName,
      "x": left,
      "y": top
    });
  };

  this._addNode = function (refcon) {
    if (refcon.container === this.id) {
      var n = new MapNodeDiv(refcon.nodeSpec.id, refcon.nodeSpec.nodeName, refcon.nodeSpec.nodetype, refcon.nodeSpec.y, refcon.nodeSpec.x, this, refcon.nodeSpec.muted);
      bb.forEachObjKey(refcon.nodeSpec.inputs, function (portName, portData) {
        n.addInPort(portData.id, portName, portData.type, portData.continuous, portData.enum);
      });
      bb.forEachObjKey(refcon.nodeSpec.outputs, function (portName, portData) {
        n.addOutPort(portData.id, portName);
      });
      //console.log("INside addnode!");
      this.mappingContainer.appendChild(n.getElement());

      //set up interactions
      this.graph.draggable(n.getElement(), {
        containment: "parent",
        start: function (e, ui) {
          // dragStart = true;
          dragStart = {
            x: ui.position.left,
            y: ui.position.top
          };
          
          var nn = n.getElement();
          if (!selectedNodes.has(nn)) {
            if (!e.shiftKey && !e.ctrlKey) {
              that.selectAll(false);
            }
            nn.classList.add("selected");
            selectedNodes.add(nn);
          }
          
          // var bounds;
          selectedNodes.forEach(function (el) {
//            bounds = el.getBoundingClientRect();
//            el.dsx = bounds.left;
//            el.dsy = bounds.top;
//            el.dsx = el.offsetLeft;
//            el.dsy = el.offsetTop;
            el.dsx = Number.parseInt(el.style.left, 10) / that.zoomLevel;
            el.dsy = Number.parseInt(el.style.top, 10) / that.zoomLevel;
          });
          // These handle the case where the dragged element is not in the selection.
//          n.getElement().dsx = Number.parseInt(el.style.left, 10);
//          n.getElement().dsy = Number.parseInt(el.style.top, 10);
        },
        drag: function (e, ui) {
          if (dragStart && selectedNodes.size > 0) {
            that.moveNodesBy(ui.position.left - dragStart.x, ui.position.top - dragStart.y, n.getElement(), false);
          }
        },
        stop: function (e, ui) {
////          that.moveNode(ui.position.left, ui.position.top, n.getElement().id);
//          e.selection.forEach(function (selectedn) {
//            that.moveNode(selectedn[1].left, selectedn[1].top, selectedn[0].id);
//          });
////////
          if (selectedNodes.size > 0 && dragStart) {
            that.moveNodesBy(ui.position.left - dragStart.x, ui.position.top - dragStart.y, n.getElement(), true);
          }
          // else {
          // This is not an else branch, because it needs to handle the case where the dragged element is not a part of the selection.
          // If it is, so its position gets set on the backend twice. That's fine.
          //// All nodes moved are now part of the selection.
          //  that.moveNode(ui.position.left, ui.position.top, n.getElement().id);
          // }
          // dragStart = false; // this will get set to false by the "click" handler and deal with selection correctly.
          // Alternatively, we could probably prevent the click from being fired here.
        }
      });

      //add endpoints
      if (refcon.nodeSpec.nodetype !== "Comment") {
        n.addEndpoints(this.graph);
      }
    }
  };

  this.copy = function () {
    if (selectedNodes.size > 0) {
//      var ids = [];
//      selectedNodes.forEach(function (node) {
//        ids.push(node.id);
//      });

      ipc.send('request-mapping-change', {
        "action": "copy-nodes",
        "container": that.id,
//        "ids": ids
        "ids": that.getSelection()
      });
    }
  };
  
  this.paste = function () {
    ipc.send('request-mapping-change', {
      "action": "paste-nodes",
      "container": that.id
    });
  };
  
  this.nestCopied = function () {
    ipc.send('request-mapping-change', {
      "action": "nest-nodes",
      "container": that.id,
      "x": 0,
      "y": 0
    });
    // TODO: find the centroid of the copied nodes and pass that as the location to create the ContainerMapNode?
  };
  
  this.selectAll = function (selected) {
    if (typeof selected === 'undefined' || selected) {
      // that.graph.addToDragSelection(".hp-mode");
      Array.prototype.forEach.call(that.mappingContainer.querySelectorAll(".hp-node"), function (el) {
        el.classList.add("selected");
        selectedNodes.add(el);
      });
    }
    else {
      // that.graph.clearDragSelection();
      selectedNodes.forEach(function (selectedn) {
        selectedn.classList.remove("selected");
      });
      selectedNodes.clear();
    }
  };

  // We're doing custom grid snapping because of some of the drag handling and because
  // jQuery's draggable snapping isn't easy to adjust globally.
  function snapToGrid(x) {
    if (PanelMapping.snapUnit > 1) {
      return ~~Math.round(x / PanelMapping.snapUnit) * PanelMapping.snapUnit;
    }
    else {
      return x;
    }
  }
  
  this.getSelection = function () {
    var ids = [];
    selectedNodes.forEach(function (node) {
      ids.push(node.id);
    });
    return ids;
  };

  this.moveNodesBy = function (dx, dy, excluded, complete) {
    var dx = (dx || 0);
    var dy = (dy || 0);
    // var containerBounds = that.mappingContainer.getBoundingClientRect();
    selectedNodes.forEach(function (n) {
      if (n !== excluded) {
        n.style.transform = `translate(${dx}px, ${dy}px)`;
      }
      if (complete) {
        n.style.transform = "none";
        n.style.top = snapToGrid(n.dsy + dy) + "px";
        n.style.left = snapToGrid(n.dsx + dx) + "px";
        ipc.send('request-mapping-change', {
          "action": "move-node",
          "container": that.id,
          "x": snapToGrid(n.dsx + dx),
          "y": snapToGrid(n.dsy + dy),
          "id": n.id
        });
        delete n.dsx;
        delete n.dsy;
      }
      that.graph.repaint(n);
    });
    // that.graph.repaintEverything();
  };
  
  this.moveNode = function (x, y, id) {
    ipc.send('request-mapping-change', {
      "action": "move-node",
      "container": that.id,
      "x": snapToGrid(x),
      "y": snapToGrid(y),
      "id": id
    });
  };

  this.removeSelectedNodes = function () {
    selectedNodes.forEach(function (el) {
      that.removeNode(el.id);
    });
    selectedNodes.clear();
  };
  
  this.removeNode = function (id) {
    ipc.send('request-mapping-change', {
      "action": "remove-node",
      "container": that.id,
      "id": id
    });
  };

  this._removeNode = function (container, id) {
    var nodeUI = document.getElementById(id);
    if (nodeUI) {
      selectedNodes.delete(nodeUI);
      if (container == this.id) {
        // console.log("REMOVING", this.graph.getEndpoint(nodeUI))
        this.graph.remove(nodeUI);
      }
    }
  };

};


var MapNodeDiv = function (id, name, type, top, left, parent, muted) {
  //create node
  var n = document.createElement('div');
  n.id = id;
  n.className = 'hp-node';
  n.style.top = top + "px";
  n.style.left = left + "px";
  n.setAttribute("tabindex", 0);
  if (muted) {
    n.classList.add("muted");
  }

  this.inputs = [];
  this.outputs = [];

  //create header
  var nodeHeader = document.createElement('div');
  name = name || "";
  nodeHeader.appendChild(document.createTextNode(name));
  nodeHeader.className = 'hp-node-header';
  n.dataset.nodetype = type;
  nodeHeader.dataset.nodetype = type;
  nodeHeader.dataset.nodename = name;
  n.appendChild(nodeHeader);
  
  // TODO: Add an indication of node UI and variadicity and port types

  //create io
  var nodeIo = document.createElement('div');
  nodeIo.className = 'hp-node-io';
  n.appendChild(nodeIo);

  var nodeInputs = document.createElement('div');
  nodeInputs.className = 'hp-node-inputs';
  nodeIo.appendChild(nodeInputs);

  var nodeOutputs = document.createElement('div');
  nodeOutputs.className = 'hp-node-outputs';
  nodeIo.appendChild(nodeOutputs);


  this.addInPort = function (id, name, type, continuous, enumVals) {
    var port = _constructPortDiv(id, name, type, continuous, enumVals);
    nodeInputs.appendChild(port);
    this.inputs.push(port);
    return port;
  };

  this.addOutPort = function (id, name) {
    var port = _constructPortDiv(id, name);
    nodeOutputs.appendChild(port);
    this.outputs.push(port);
    return port;
  };
  
  this.addEndpoints = function (g) {
    g.setSuspendDrawing(true);
    for (var i = 0; i < this.inputs.length; i++) {
      var port = this.inputs[i];
      g.addEndpoint(port.id, {
        container: n,
        uuid: port.id,
        onMaxConnections: function(info,origEvent) {
          // console.log("MAX CONN",info);
          parent.graph.detach(info.endpoint.connections[0]);
          //parent.removeConnection(null,info.endpoint.elementId);
        },
        anchor: [-0.05, 0.55, -1, 0],
        paintStyle: {
          fillStyle: "#47b13e",
          radius: 7
        },
        isTarget: true,
      });
    }

    for (var i = 0; i < this.outputs.length; i++) {
      var port = this.outputs[i];
      g.addEndpoint(port.id, {
        container: n,
        isSource: true,
        uuid: port.id,
        anchor: [1.05, 0.55, 1, 0],
        maxConnections: -1,
        paintStyle: {
          strokeStyle: "#47b13e",
          fillStyle: "transparent",
          radius: 5,
          lineWidth: 2
        },
        connectorStyle: {
          //The paint style for connecting lines
          lineWidth: 2,
          strokeStyle: "#4da3e2",
          joinstyle: "square",
          outlineColor: "#555555",
          outlineWidth: 1
        },
        connectorHoverStyle: {
          lineWidth: 4,
          strokeStyle: "#216477",
          outlineWidth: 2,
          outlineColor: "white"
        },


      });
    }
    g.setSuspendDrawing(false, true);
  };

  this.getElement = function () {
    return n;
  };
};


var _constructPortDiv = function (id, name, type, continuous, enumVals) {
  var port = document.createElement('div');
  port.appendChild(document.createTextNode(name));
  port.className = 'hp-port';
  port.id = id;
  port.dataset.uuid = id;
  port.dataset.type = type;
  if (typeof continuous !== "undefined") {
    port.dataset.continuous = continuous;
  }
  if (typeof enumVals !== "undefined") {
    port.dataset.enum = enumVals;
  }
  return port;
};

var initJSPlumb = function (container,activePortEditors) {

  var connectorPaintStyle = {
    //The paint style for connecting lines
    lineWidth: 2,
    strokeStyle: "#61B7CF",
    joinstyle: "square",
    outlineColor: "#555555",
    outlineWidth: 1
  };

  var connectorHoverStyle = {
    lineWidth: 4,
    strokeStyle: "#216477",
    outlineWidth: 2,
    outlineColor: "white"
  };

  var instance = jsPlumb.getInstance({
    Connector: ["Bezier", {curviness: 100, stub: 10}],
    Container: container, //container.getElement().attr("id"),
    endpoint: "Dot",
    hoverPaintStyle: {
      fillStyle: "#216477",
      strokeStyle: "#216477"
    },
    dropOptions: {
      hoverClass: "hover",
      activeClass: "active"
    },
    DragOptions: {
      cursor: "pointer",
      zIndex: 2000
    },
    ConnectionOverlays: [
      ["Arrow", {
        location: 1,
        width: 15,
        height: 5
      }],
    ],
  });
  // var currentsource = undefined;

  instance.bind('endpointDblClick', function (endpt, e) {
    
    if (e.ctrlKey) {
      resetPortValueById(endpt.elementId);
      return;
    }
    else if (e.metaKey || e.altKey) {
      togglePublishPortById(endpt.elementId);
      return;
    }

    if (!endpt.element.children.length) {
      _showPortEditor(endpt, e);
      activePortEditors[endpt.elementId] = endpt;
    }
    else {
      endpt.element.removeChild(endpt.element.children[0]);
      cancelPortValueUpdates(endpt.elementId);
      delete activePortEditors[endpt.elementId];
    }
  });

  return instance;
};

//// Port editor
var _showPortEditor = function (endpt, e) {
  var dataset = endpt.element.dataset;
  var editor = document.createElement((dataset.enum) ? 'select' : 'input');
  editor.className = "hp-port-editor";
  editor.type = 'text';
  editor.min = 0;
  editor.max = 1;
  editor.step = 0.005;

  switch (dataset.type) {
    case "INT":
      editor.type = "number";
      editor.step = 1;
      editor.max = 9999;
      editor.min = -512;
      break;
    case "HEX":
      editor.step = 1;
      editor.min = 0x00;
      editor.max = 0xFFFFFF;
      break;
    case "FLOAT":
      /* fall through */
    case "NUM":
      editor.type = "number";
      editor.max = 9999;
      editor.min = -1;
      break;
    case "ZEROTOONE":
      editor.type = "number";
      editor.min = 0;
      editor.max = 1;
      break;
    case "BOOL":
      editor.type = "checkbox";
      break;
      // TODO: Add combobox for ENUM type
    case "COLOR":
      editor.type = "color";
      break;
    default:
      break;
  }
  
  if (!Number.isNaN(+dataset.min)) {
    editor.min = dataset.min;
  }
  if (!Number.isNaN(+dataset.max)) {
    editor.max = dataset.max;
  }
  
  if (dataset.enum) {
    var listName = endpt.element.textContent + "-enum";
    // var datalist = document.getElementById(listName);
    var datalist = false;
    if (!datalist) {
      // datalist = document.createElement("datalist");
      var opt;
      dataset.enum.split(',').forEach(function (el) {
        opt = document.createElement("option");
        opt.value = el;
        opt.textContent = el;
        // datalist.appendChild(opt);
        editor.appendChild(opt);
      });
      // datalist.id = listName;
      // document.body.appendChild(datalist);
    }
    // editor.setAttribute("list", listName);
    // editor.setAttribute("size", 40);
    editor.onchange = function () {setPortValueById(endpt.elementId, editor.value);};
  }
  // Apparently, there's a bug in Chromium that prevents datalists from appearing under certain circumstances.
  
  // TODO: Ctrl+Click on an editor to restore default value, currently only set to work on the port endPt itself
  // TODO: Pull out the onchange functions, so that they can be reused references.
  if (dataset.type === "INT") {
    editor.onwheel = function (e) {
      // Use typed editors... 
      var val = Number.parseInt(editor.value, 10);
      if (e.shiftKey) {
        val -= Math.sign(e.deltaY) * 10;
      }
      else {
        val -= Math.sign(e.deltaY);
      }
      
      editor.value = val;
      e.stopPropagation();
      e.preventDefault();
      setPortValueById(endpt.elementId, val);
      return false;
    };
    
    editor.onchange = function () {setPortValueById(endpt.elementId, (editor.type === "number") ? Number.parseInt(editor.value, 10) : editor.value);};
  }
  else if (dataset.type === "HEX") {
    editor.onwheel = function (e) {
      // Use typed editors... 
      var val = Number.parseInt(editor.value, 16);
      if (e.shiftKey) {
        val -= Math.sign(e.deltaY) * 10;
      }
      else {
        val -= Math.sign(e.deltaY);
      }
      
      editor.value = "0x" + val.toString(16);
      e.stopPropagation();
      e.preventDefault();
      setPortValueById(endpt.elementId, val);
      return false;
    };
    
    editor.onchange = function () {setPortValueById(endpt.elementId, (editor.type === "number") ? Number.parseInt(editor.value, 16) : editor.value);};
  }
  else if (editor.type === "number") {
    editor.onwheel = function (e) {
      // Use typed editors... 
      var val = Number.parseFloat(editor.value);
      if (e.ctrlKey) {
        val -= e.deltaY / 100000;
      }
      else if (e.shiftKey) {
        val -= e.deltaY / 1000;
      }
      else {
        val -= e.deltaY / 10000;
      }
      if (dataset.type === "ZEROTOONE") {
        editor.value = MathUtil.clip(val, 0, 1);
      }
      e.stopPropagation();
      e.preventDefault();
      setPortValueById(endpt.elementId, val);
      return false;
    };
    
    editor.onchange = function () {setPortValueById(endpt.elementId, (editor.type === "number") ? Number.parseFloat(editor.value) : editor.value);};
  }
  else if (editor.type === "color") {
    editor.onwheel = function (e) {
      // Use typed editors... 
      var val = Number.parseInt(editor.value, 16);
//      if (e.shiftKey) {
//        val -= Math.sign(e.deltaY) * 10;
//      }
//      else {
//        val -= Math.sign(e.deltaY);
//      }
      editor.value = "#" + ("000000" + val.toString(16)).substr(-6);
      e.stopPropagation();
      e.preventDefault();
      setPortValueById(endpt.elementId, val);
      return false;
    };
    
    editor.onchange = function () {setPortValueById(endpt.elementId, (editor.type === "color") ? Number.parseInt(editor.value, 16) : editor.value);};
  }
  
  if (editor.type === "checkbox") {
    editor.onchange = function (e) {
      setPortValueById(endpt.elementId, editor.checked);
    };
  }

  editor.addEventListener('keydown', function (e) {

    if (e.keyCode == 13) {
      // console.log("Submitted editor", editor.value);
      if (endpt.element.dataset.type === "INT") {
        setPortValueById(endpt.elementId, Number.parseInt(editor.value, 10));
      }
      else if (endpt.element.dataset.type === "HEX") {
        setPortValueById(endpt.elementId, Number.parseInt(editor.value, 16));
      }
      else if (editor.type === "number") {
        setPortValueById(endpt.elementId, Number.parseFloat(editor.value));
      }
      else {
        setPortValueById(endpt.elementId, editor.value);
      }
    }

    if (e.keyCode == 27) {
      endpt.element.removeChild(editor);
      cancelPortValueUpdates(endpt.elementId);
    }
  });

  editor.onfocus = function (e) {
    e.preventDefault();
    e.target.select();
    return false;
  };

  endpt.element.appendChild(editor);
  requestPortValueUpdates(endpt.elementId);
  editor.focus();
};

var requestPortValueUpdates = function (id) {
  ipc.send('request-mapping-change', {
    "action": "request-port-value-updates",
    "id": id
  });
};

var cancelPortValueUpdates = function (id) {
  ipc.send('request-mapping-change', {
    "action": "cancel-port-value-updates",
    "id": id
  });
};

var setPortValueById = function (id, value) {
  ipc.send('request-mapping-change', {
    "action": "set-port-value",
    "id": id,
    "value": value
  });
};

var resetPortValueById = function (id) {
  ipc.send('request-mapping-change', {
    "action": "reset-port-value",
    "id": id
  });
};

var togglePublishPortById = function (id, publish) {
  ipc.send('request-configure-node', {
    "action": "toggle-publish-port",
    "id": id,
    "publish": publish
  });
};

PanelMapping.initPanel = function (container, componentState) {
  var panel = new PanelMapping();
  panel.initPanel(container, componentState);
};

function rectContains(container, testContains) {
  return (testContains.left >= container.left && testContains.right < container.right && testContains.top >= container.top && testContains.bottom < container.bottom);
}

PanelMapping.snapUnit = 40;

module.exports = PanelMapping;
