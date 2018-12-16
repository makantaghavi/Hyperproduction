var ipc = require('ipc');

var PanelWidgetSlider = function() {

  this.initPanel = function(container, componentState) {
    var nodeGraphContainer = document.createElement('div');
    nodeGraphContainer.id = "hp-widget-" + componentState.id;
    nodeGraphContainer.className = "hp-widget-container";

    var newContent = document.createElement('div');
    newContent.id = "hp-widget-slider-" + componentState.id;
    nodeGraphContainer.appendChild(newContent);
    container.getElement()[0].appendChild(nodeGraphContainer);

    setTimeout(function() {
      $("#" + "hp-widget-slider-" + componentState.id).slider({
        min: 0,
        max: 1,
        step: 0.01,
        slide: function( event, ui ) { 
          ipc.send("widget-slider-slide", {
            id: componentState.id,
            value: ui.value
          });
        }
      })
    }, 500); // timeout seems necessary to give the layout time to render div.

    ipc.on('widget-slider-set-value', function (refcon) {
      if (refcon.id === componentState.id) {
        $("#" + "hp-widget-slider-" + componentState.id).slider('value',refcon.value);
      }
    });
  };
};

module.exports = PanelWidgetSlider;



