var bb = require("hp/model/benb_utils");
var OscDeviceModules = require("hp/model/OscDeviceModules");
var fs = require('fs');

var PanelDeviceSelector = function() {
  var that = this;

  this.initPanel = function(container, componentState) {
    that.nodeListContainer = document.createElement('div');
    that.nodeListContainer.id = "node-list-container-1";
    that.nodeListContainer.className = "hp-node-list-container";

    container.getElement()[0].appendChild(that.nodeListContainer);
    initNodeList();
    //initMappingList();
  }

  var initNodeList = function() {

    bb.forEachObjKey(OscDeviceModules, function(deviceName, callback){
      var listItem = document.createElement('div');
      listItem.dataset.ntype="OSCNODE";
      listItem.className = "hp-node-list-item";
      listItem.appendChild(document.createTextNode(deviceName));
      $(listItem).draggable({
        revert: true,
        opacity: 0.7, 
        helper: "clone"
      });
      that.nodeListContainer.appendChild(listItem);
    });

    // ComputeModules.events.on("maps-loaded", function(){
    //   var cms = ComputeModules.getModules();
    //   bb.forEachObjKey(cms, function(nodeHandle,nodeDefn) {
    //     var listItem = document.createElement('div');
    //     listItem.className = "hp-node-list-item";
    //     listItem.appendChild(document.createTextNode(nodeHandle));
    //     $(listItem).draggable({
    //       revert: true,
    //       opacity: 0.7, 
    //       helper: "clone"
    //     });
    //     that.nodeListContainer.appendChild(listItem);
    //   });
    // });
  // }

  // var initMappingList = function () {
  //   var dir = "../maps/"
  //   var data= {}
  //   fs.readdir(dir,function(err,files){
  //       if (err) throw err;
  //       var c=0;
  //       files.forEach(function(file){
  //           c++;
  //           fs.readFile(dir+file,'utf-8',function(err,json){
  //               if (err) throw err;
  //               data[file]=JSON.parse(json);
  //               if (0===--c) {
  //                 bb.forEachObjKey(data, function(nodeHandle, nodeDefn){
  //                   var listItem = document.createElement('div');
  //                   listItem.className = "hp-node-list-item";
  //                   listItem.appendChild(document.createTextNode(nodeHandle));
  //                   $(listItem).draggable({
  //                     revert: true,
  //                     opacity: 0.7, 
  //                     helper: "clone"
  //                   });
  //                   //console.log(listItem);
  //                   that.nodeListContainer.appendChild(listItem);
  //                 });
  //               }
  //           });
  //       });
  //   });
  }
}

module.exports = PanelDeviceSelector;