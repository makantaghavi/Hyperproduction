function PanelNodeUI() {
  this.element = document.createElement("div");
  this.element.className = "panelUI";
}

PanelNodeUI.initPanel = function (container, componentState) {
  var uiDefn = componentState.defn;
  if (typeof uiDefn === 'string') {
    var component = require(uiDefn);
    if (component) {
      component = new component(componentState.id);
      component.initPanel(container, componentState);
    }
  }
  else {
    var panel = new PanelNodeUI();
    var element = panel.element;
    element.id = componentState.id + "-uiPanel";

    container.getElement()[0].appendChild(element);
  }
};

module.exports = PanelNodeUI;
