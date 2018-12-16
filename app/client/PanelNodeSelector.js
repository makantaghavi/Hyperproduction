var bb = require("hp/model/benb_utils");
var path = require("path");
var ComputeModules = require("hp/model/ComputeModules").getInstance();
// var fs = require('fs');

var PanelNodeSelector = function() {
  var that = this;

  this.initPanel = function(container, componentState) {
    var sidebar = document.createElement("div");
    sidebar.id = "sidebar";
    var searchBox = document.createElement("input");
    searchBox.setAttribute("type", "search");
    searchBox.setAttribute("id", "nodeFilter");
    searchBox.setAttribute("placeholder", "Filter Nodes Cmd+T");
    sidebar.appendChild(searchBox);
    
    that.nodeListContainer = document.createElement('div');
    that.nodeListContainer.id = "node-list-container-1";
    that.nodeListContainer.className = "hp-node-list-container";
    sidebar.appendChild(that.nodeListContainer);
    
    if (typeof container.getElement === 'function') {
      container.getElement()[0].appendChild(sidebar);
    }
    else {
      container.appendChild(sidebar);
    }
    
    var styleSheet = document.createElement("style");
    styleSheet.appendChild(document.createTextNode(""));
    document.head.appendChild(styleSheet);
    styleSheet = styleSheet.sheet;
    
    searchBox.addEventListener("input", function (e) {
      var filterRule = ".hp-node-list-container.filtered .hp-node-list-item[data-node-name*=\"" + searchBox.value.toLowerCase() + "\"] {display: block;}";
      if (searchBox.value === "") {
        that.nodeListContainer.classList.remove("filtered");
      }
      else {
        that.nodeListContainer.classList.add("filtered");
        if (styleSheet.rules.length > 0) {
          styleSheet.deleteRule(0);
        }
        styleSheet.insertRule(filterRule, 0);
      }
    });
    searchBox.addEventListener("keypress", function(e) {
      switch (e.keyCode) {
        case 0x1B:
          window.setTimeout(function () {
            searchBox.value = "";
          }, 10);
          break;
        case 0x0D:
          var filtered = document.querySelectorAll(".hp-node-list-container.filtered .hp-node-list-item[data-node-name*=\"" + searchBox.value.toLowerCase() + "\"]");
          if (true || filtered.length === 1) {
            // Add singular node to active mapping -> Changing to just add the first node
            var nodeHandle = filtered[0].dataset.nodeHandle;
            var evt = new CustomEvent("add-node-to-active", {detail: {
              'nodeName': nodeHandle
            }});
            document.dispatchEvent(evt);
          }
          break;
        default:
          break;
      }
    });
    searchBox.addEventListener("focus", searchBox.select);
    that.nodeListContainer.addEventListener("dblclick", function (e) {
      if (e.target.dataset && e.target.dataset.nodeHandle) {
        var nodeHandle = e.target.dataset.nodeHandle;
        var evt = new CustomEvent("add-node-to-active", {detail: {
          'nodeName': nodeHandle
        }});
        window.setTimeout(function () {document.dispatchEvent(evt);}, 10);
      }
    });
    document.addEventListener("keyup", function (e) {
      if (String.fromCharCode(e.keyCode) === "T" && (e.ctrlKey || e.metaKey)) {
        searchBox.focus();
      }
    });
    
    initNodeList();
    //initMappingList();
  };

  var initNodeList = function() {
    ComputeModules.on("maps-loaded", function() {
      while (that.nodeListContainer.lastChild) {
        that.nodeListContainer.removeChild(that.nodeListContainer.lastChild);
      }
      var cms = ComputeModules.getModules();
      bb.forEachObjKey(cms, function(nodeHandle, nodeDefn) {
        if (nodeDefn.deprecated) {
          // Don't display deprecated nodes in the list, but let them still exist for use in old patches.
          return;
        }
        var listItem = document.createElement('div');
        listItem.dataset.ntype="MAPNODE";
        listItem.className = "hp-node-list-item";
        listItem.dataset.nodeHandle = nodeHandle;
        listItem.dataset.nodeName = nodeHandle.toLowerCase();
        if (nodeDefn.descr) {
          listItem.setAttribute("title", nodeDefn.descr + ((nodeDefn.path) ? "\n" + path.basename(nodeDefn.path) : ""));
        }
        if (nodeDefn.generator) {
          listItem.classList.add("node-generator");
        }
        if (nodeDefn.variadicInput) {
          listItem.classList.add("node-variadic");
        }
        if (nodeDefn.inputs && Object.keys(nodeDefn.inputs).length) {
          listItem.classList.add("node-sink");
        }
        if (nodeDefn.outputs && Object.keys(nodeDefn.outputs).length) {
          listItem.classList.add("node-source");
        }
        listItem.appendChild(document.createTextNode(nodeHandle));
        $(listItem).draggable({
          revert: true,
          opacity: 0.7, 
          helper: "clone"
        });
        that.nodeListContainer.appendChild(listItem);
      });
    });
  };

  /*
  var initMappingList = function () {
    var dir = "../maps/";
    var data= {};
    fs.readdir(dir,function(err,files){
        if (err) {throw err;}
        var c=0;
        files.forEach(function(file){
            c++;
            fs.readFile(dir+file,'utf-8',function(err,json){
                if (err) {throw err;}
                data[file]=JSON.parse(json);
                if (0===--c) {
                  bb.forEachObjKey(data, function(nodeHandle, nodeDefn){
                    var listItem = document.createElement('div');
                    listItem.className = "hp-node-list-item";
                    listItem.dataset.ntype="MAPNODE";
                    listItem.appendChild(document.createTextNode(nodeHandle));
                    $(listItem).draggable({
                      revert: true,
                      opacity: 0.7, 
                      helper: "clone"
                    });
                    //console.log(listItem);
                    that.nodeListContainer.appendChild(listItem);
                  });
                }
            });
        });
    });
  };
  */
};

module.exports = PanelNodeSelector;