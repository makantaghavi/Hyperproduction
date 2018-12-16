var ipc = require('electron').ipcRenderer;
// var hott = require('handsontable/dist/handsontable.full.js');
// I'm moving HOT out of node_modules to lib. It was being installed from git via npm, not the npm registry.
// This started causing install issues on Windows. Plus, we're using 0.25.0. Current is 0.29.0 and
// there's a commercial version which requires a license, which has features I believe we are currently using.
var hott = require('hp/lib/handsontable/dist/handsontable.full.js');

// TODO: Somehow pass back the port types with published-port-list to use typed editors and renderers.
var EDITORS = {
  STRING: "text",
  BOOL: "checkbox",
  COLOR: "color",
  ENUM: "select"
};

var RENDERERS = {
  STRING: "text",
  BOOL: "checkbox",
  COLOR: "color",
  INT: "numeric",
  NUM: "numeric",
  FLOAT: "numeric",
  ZEROTOONE: "numeric"
};

function colorRenderer(instance, td, row, col, prop, value, cellProperties) {
  var val = +value;
  var str = "#" + ("000000" + val.toString(16)).substr(-6);
  td.innerText = str;
  td.style.backgroundColor = str;
  td.style.color = ((val & 0xFF0000 < 0x800000 && val & 0xFF00 < 0x8000 && val & 0xFF < 0x80) ? "#FFF" : "#000");
}

var PanelPublishedPorts = function() {
    this.initPanel = function(container, componentState) {
        var nodeGraphContainer = document.createElement('div');
        nodeGraphContainer.className = "panelEditor presetTable";

        var reloadButton = document.createElement('button');
        var t = document.createTextNode("Refresh");
        reloadButton.appendChild(t);
        reloadButton.id = "btnReload";
        reloadButton.addEventListener("click", function() {
            ipc.send('request-published-port-list', {
                "action": "request-published-port-list"
            });
        });
        nodeGraphContainer.appendChild(reloadButton);


        var sendValues = document.createElement('input');
        sendValues.type = 'checkbox';
        sendValues.id = 'sendValues'; // need unique Ids!
        sendValues.value = 'Send';
        sendValues.style.marginLeft = "2em";
        nodeGraphContainer.appendChild(sendValues);

        var label = document.createElement("label");
        label.textContent = "Arm Presets";
        label.setAttribute("for", "sendValues");
        nodeGraphContainer.appendChild(label);


        var presetTable = document.createElement('div');
        var presetContainer = document.createElement("div");
        presetContainer.className = "presetContainer";
        // newContent.style.marginTop = "1em";
        presetTable.id = "myGraph" + componentState.id;
        presetContainer.appendChild(presetTable);
        nodeGraphContainer.appendChild(presetContainer);
        container.getElement()[0].appendChild(nodeGraphContainer);
      
        var hot = null;
      
        container.on("resize", function (e) {
          if (hot) {
            hot.updateSettings({
              width: presetContainer.offsetWidth,
              height: presetContainer.offsetHeight
            });
          }
        });
      
      
        var publishedPortList = {};
        var data = [
            ["Label", null, null]
        ];
      
        function publishedPortComparator(a, b) {
          if (a[0] === "") {
            return -1;
          }
          else if (a && b && a[0] && b[0]) {
            return a[0].toLowerCase().localeCompare(b[0].toLowerCase());
          }
          return 0;
        }

        ipc.on('published-port-list', function(evt, refcon) {
            console.log("Refreshing Published Port List");
            publishedPortList = refcon.publishedPortList;
            // console.log(publishedPortList);
            var currentPorts = data.map(function(value, index) {
                return value[0];
            });


            for (var o in refcon.publishedPortList) {
                if ($.inArray(refcon.publishedPortList[o], currentPorts) == -1) {
                    data.push([refcon.publishedPortList[o]]);
                }
            }
          
            // data.sort(publishedPortComparator);
            hot.render();
        });

        ipc.on('send-preset', function(evt, refcon) {
            sendPortValues(refcon.preset);
        });

        ipc.on('set-preset-data', function(evt, refcon) {
          if (typeof refcon.data === "string") {
            data = JSON.parse(refcon.data);
          }
          else {
            data = refcon.data;
          }
          // console.log("send-preset-data", hot);
            if (hot) {
                hot.updateSettings({
                    data: data
                });
                hot.render();
            } else {
                initHot();
            }
        });

        $(container).ready(function() {
            setTimeout(function() {
                ipc.send('request-preset-data', {});
            }, 500); // TODO: this hack prevents a race condition re: messages
        });

        // window.Handsontable.cellLookup.renderer.color = colorRenderer;
      
        function initHot() {
            hot = new window.Handsontable(presetTable, {
                data: data,
                minSpareRows: 0,
                minCols: 2,
                rowHeaders: false,
                fixedRowsTop: 1,
                fixedColumnsLeft: 1,
                manualColumnResize: true,
                manualColumnMove: true,
                multiSelect: false,
                fillHandle: false,
                allowInsertRow: false,
                colHeaders: function(i) {
                    if (i === 0) {
                        return '';
                    } else {
                        return i;
                    }
                },
                // columns: [{type: "text", readOnly: true}],
                cells: function (row, col, prop) {
                  var cellProperties = {};
                  var row;
                  if (col === 0) {
                    cellProperties.readOnly = true;
                    cellProperties.editor = false;
                  }
//                  else if (col === 1) {
//                    cellProperties.editor = false;
//                    cellProperties.width = 0;
//                  }
                  else {
//                    value = this.getData()[row][1];
//                    cellProperties.editor = EDITORS[value] || "text";
//                    cellProperties.renderer = RENDERERS[value] || "text";
                    // row = this.getData()[row];
                    row = data[row];
                    if (row[col] === "true" || row[col] === "false") {
                      cellProperties.editor = "checkbox";
                      cellProperties.renderer = "checkbox";
                    }
                    else if (row[0] && row[0].toLowerCase().indexOf("rgb") > -1) {
                      // cellProperties.editor = ColorEditor;
                      cellProperties.renderer = colorRenderer;
                    }
                  }
                  return cellProperties;
                },
              // FIXME: Sorting by the first column puts the Label row (with the blank first cell) last, no matter the sort order.
              // This needs to be first, but I can't seem to set the first cell
                /*
                columnSorting: {
                  column: 0,
                  sortOrder: true
                },
                */
                afterOnCellMouseDown: function(event, coords, td) {
                    if (event.which == 1 && coords.row == -1 && coords.col > 0) {
                        sendPortValues(coords.col);
                    }
                },
                afterRender: function(isForced) {
                    if (isForced) {
                        ipc.send('preset-data-changed', {
                            value: JSON.stringify(data)
                        });
                    }
                },
                contextMenu: {
                    callback: function(key, options) {
                        if (key === 'snapshot') {
                            setTimeout(function() {
                                // timeout is used to make sure the menu collapsed before alert is shown
                              // console.log(options);
                              if (options.start.row === 0) {
                                // console.log(1, options.start.col, hot.countRows() - 1, options.end.col);
                                getPortValuesRange(1, options.start.col, hot.countRows() - 1, options.end.col);
                              }
                              else {
                                getPortValuesRange(options.start.row, options.start.col, options.end.row, options.end.col);
                              }
                            }, 100);
                        }
                        // else if (key === 'remove_col')
                    },
                    items: {
                        // 'row_above': {},
                        // 'row_below': {},
                        // 'hsep1': "---------",
                        'col_left': {},
                        'col_right': {},
                        'hsep2': "---------",
                        'remove_row': {},
                        'remove_col': {},
                        'hsep3': "---------",
                        'undo': {},
                        'redo': {},
                        // 'make_read_only': {},
                        'hsep4': "---------",
                        "snapshot": {
                            name: 'Snapshot Value'
                        }
                    }
                }
            });
          
          /*
          window.Handsontable.hooks.add('beforeOnCellMouseDown', function (e, coords, element) {
            if (coords.row < 0) {
              e.stopPropagation();
            }
          }, hot);
          */

            //this.hot.render();
            ipc.send('request-published-port-list', {
                "action": "request-published-port-list"
            });

        }

        function getPortValuesRange(startRow, startCol, endRow, endCol) {
            for (var row = startRow; row <= endRow; row++) {
                for (var col = startCol; col <= endCol; col++) {
                    getPortValues(row, col);
                }
            }
            hot.render();
        }

        function getPortValues(row, col) {
            var port = data[row];
            if (port[0]) {
                for (var o in publishedPortList) {
                    if (publishedPortList[o] == port[0]) {
                        var value = ipc.sendSync('request-published-port-list', {
                            action: 'sync-get-port-value-by-id',
                            portId: o,
                        });
                        data[row][col] = value;
                        break;
                    }
                }
            }
        }

        function sendPortValues(col) {
            if (document.getElementById("sendValues").checked) {
                console.info("Sending Preset: " + col);
                data.forEach(function(port) {
                    if (port[0] && port[col] !== null && typeof port[col] !== "undefined" && port[col] !== "") {
                        // console.log("Setting " + port[0] + " to " + port[col] + " (" + typeof port[col]);
                        ipc.send('request-mapping-change', {
                            "action": "set-port-value-by-path",
                            "path": port[0],
                            "value": port[col],
                        });

                    }
                });
            }
        }
    };

};

// var ColorEditor = hott.editors.TextEditor.prototype.extend();



module.exports = PanelPublishedPorts;


// ipc.send('request-mapping-change', {
//   "action": "set-port-value-by-path",
//   "path": path,
//   "value": value
// });
