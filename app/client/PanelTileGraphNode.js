var ipc = require('electron').ipcRenderer;
var PanelMuxGraphNode = require("hp/client/PanelMuxGraphNode");

var PanelTileGraphNode = function () {

  this.initPanel = function (container, componentState) {
    var nodeGraphContainer = document.createElement('div');

    var that = this;
    // where the id of the graph node is created
    nodeGraphContainer.id = "hp-graph-" + componentState.id;
    nodeGraphContainer.className = "hp-graph-tile";

    if (typeof container.getElement === 'function') {
      container.getElement()[0].appendChild(nodeGraphContainer);
    } else {
      container.appendChild(nodeGraphContainer);
    }
    
    var graphs = {};
    
    this.hide = function () {
      for (var graph in graphs) {
        graphs[graph].hide();
      }
    };

    this.show = function () {
      for (var graph in graphs) {
        graphs[graph].show();
      }
    };

    this.modelListeners = function (evt, refcon) {
      var graph;
      if (refcon.id === componentState.id) {
        if (refcon.graph) {
          if (!graphs.hasOwnProperty(refcon.graph)) {
            graph = new PanelMuxGraphNode();
            graph.initPanel(nodeGraphContainer, {id: componentState.id + "-" + refcon.graph});
            graphs[refcon.graph] = graph;
            graph.element.dataset.graph = refcon.graph;
          }
          graph = graphs[refcon.graph];
          refcon.id = refcon.id + "-" + refcon.graph;
          graph.graphUpdate(refcon);
        }
        else {
          for (var graphName in refcon.data) {
            if (!graphs.hasOwnProperty(graphName)) {
              graph = new PanelMuxGraphNode();
              graph.initPanel(nodeGraphContainer, {id: componentState.id + "-" + graphName});
              graphs[graphName] = graph;
              graph.element.dataset.graph = graphName;
            }
            graph = graphs[graphName];
            refcon.data[graphName].id = refcon.id + "-" + graphName;
            graph.graphUpdate(refcon.data[graphName]);
          }
        }
      }
    };

    this.destroy = function (e) {
      that.hide(e);
      ipc.removeListener('graph-update', that.modelListeners);
      for (var graph in graphs) {
        graphs[graph].destroy();
      }
      while (nodeGraphContainer.lastChild) {
        nodeGraphContainer.removeChild(nodeGraphContainer.lastChild);
      }
      nodeGraphContainer.parentElement.removeChild(nodeGraphContainer);
      nodeGraphContainer = null;
      graphs = null;
    };    

    // Graph update listener
    ipc.on('graph-update', this.modelListeners);

    if (typeof container.on === 'function') {
      container.on("hide", that.hide);
      container.on("show", that.show);
      container.on("destroy", that.destroy);
      container.on("resize", function (e) {
        for (var graph in graphs) {
          graphs[graph].resizeCanvas(e);
        }
      });
    }


  };
};

module.exports = PanelTileGraphNode;