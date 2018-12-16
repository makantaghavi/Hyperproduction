var Type = require("hp/model/ports").Type;
var RunningState = require("hp/model/MapNode").RunningState;

exports.DataStreamAnalyzer = {
  nodetype: "DataStreamAnalyzer",
  descr: "Generates useful information about a data source.",
  path: __filename,
  deprecated: true,
  procfn: function(ports, state) {
    //Define inputs
    var dataSource = ports.dataInput.get();
    var scale = ports.scale.get();
    var windowSize = ports.windowSize.get();
    var minimumOutput = ports.minimumOutput.get();
    var maximumOutput = ports.maximumOutput.get();
    var normalize = ports.normalize.get();
    var clearState = ports.clearState.get();

    //l.debug("=====================");
    //l.debug(state);
    //l.debug(clearState);

    //Define persistent state object
    if (state.runningState === RunningState.INIT || clearState) {
      //l.debug("INIT STATE!!!=============");
      state.previousValues = [];
      state.normPreviousValues=[];
      state.inputMin= Infinity;
      state.inputMax= -Infinity;
      state.runningState = RunningState.RUNNING;
    }

    //l.debug("=====================");
    //l.debug(state);

    state.inputMin = ( dataSource < state.inputMin) ? dataSource : state.inputMin;
    state.inputMax = ( dataSource > state.inputMax) ? dataSource : state.inputMax;

    //Set up normalization
    var signalRange = state.inputMax-state.inputMin;
    var normalizedInput = (dataSource - state.inputMin) / signalRange;

    //Push new input into previousValues
    state.previousValues.unshift(dataSource);
    state.normPreviousValues.unshift(normalizedInput);

    //l.debug(state.previousValues);
    //l.debug(state.normPreviousValues);

    //l.debug("Signal Range: "+signalRange);

    //Remove data from queue while length is longer than windowSize
    while (state.previousValues.length > windowSize) {
      state.previousValues.pop();
      state.normPreviousValues.pop();
    }

    var outputData = (normalize) ? state.normPreviousValues : state.previousValues;
    if (outputData.length > 0){
      var summedOutputData = outputData.reduce( function(total, num) { return total + num;});
      var mean = summedOutputData/outputData.length;
      var variance = outputData.reduce( function(total, num) { return total + Math.pow((mean-num),2);} ) / outputData.length;
      //set output
      ports.scaledOutput.set(outputData[0]*scale);
      ports.dxOutput.set(Math.abs(outputData[0]-outputData[1]));
      ports.ixOutput.set(summedOutputData);
      ports.minimum.set(Math.min.apply(null, outputData));
      ports.maximum.set(Math.max.apply(null, outputData));
      ports.mean.set(mean);
      ports.variance.set(variance);
    }
    return state;
  },
  inputs: {
    dataInput: {type: Type.NUM, defaultValue: 0},
    scale: {type: Type.FLOAT, defaultValue: 1.0 },
    maximumOutput: {type: Type.NUM, defaultValue: Infinity},
    minimumOutput: {type: Type.NUM, defaultValue: -Infinity},
    normalize: {type: Type.BOOL, defaultValue:true},
    windowSize: {type: Type.INT, defaultValue: 64},
    clearState: {type: Type.BOOL, defaultValue:false},
  },
  outputs: {
    scaledOutput: {type: Type.NUM, defaultValue: 0},
    dxOutput: {type: Type.NUM, defaultValue: 0},
    ixOutput: {type: Type.NUM, defaultValue: 0},
    minimum: {type: Type.NUM, defaultValue: 0},
    maximum: {type: Type.NUM, defaultValue: 0},
    mean: {type: Type.NUM, defaultValue: 0},
    variance: {type: Type.NUM, defaultValue: 0},
  },
  continuous: true,

};