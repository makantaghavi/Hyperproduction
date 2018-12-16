var floatSign = function(f) {
    if (f >= 0.0) {
        return 1;
    }
    return -1;
};

var SlidingAverage = function(windowSize, onOverflow) {
    this.windowSize = windowSize;
    this.data = new CBuffer(windowSize);
    this.sum = 0;
    this.onOverflow = onOverflow;
    this.data.overflow = function(val) {
        this.sum -= val;
        if (this.onOverflow) {
            onOverflow(val);
        }
    };
};

SlidingAverage.prototype.push = function(val) {
    this.sum += val;
    this.data.push(val);
    return this.sum / this.data.size;
};

SlidingAverage.prototype.getAvg = function() {
    return this.sum / this.data.size;
};

var OscillationAnalyzer = function(threshold) {
    // frontWindow spills over into tailWindow
    this.lastVal = null;

    // +-1
    this.direction = null;
    this.currentAmp = 0;
    this.reverseAmp = 0;
    this.threshold = threshold || .01;
    this.upperThreshold = .8;
};

OscillationAnalyzer.prototype.push = function(val) {
    if (this.lastVal == null) {
        this.lastVal = val;
        return [false, 0];
    }
    var diff = val - this.lastVal;
    var dir = floatSign(diff);
    var amp = Math.abs(diff);
    if (amp > this.upperThreshold) {
        // too big of a change! wrap-around?
        // reset state
        this.lastVal = val;
        this.direction = null;
        return [false, 0];
    }
    if (this.direction == null) {
        // only set direction if above threshold
        if (amp >= this.threshold) {
            this.direction = dir;
            this.currentAmp = amp;
        }
        return [false, 0];
    }
    var changeDir = false;
    var reverseAmp = 0;
    if (dir == this.direction) {
        if (amp >= this.currentAmp) {
            this.currentAmp = amp;
            // extending current direction
        } else {
            if (this.currentAmp - amp > this.threshold) {
                // reversing direction
                changeDir = true;
                reverseAmp = (this.currentAmp - amp) - this.threshold;
            }
        }
    } else {
        // opposite direction
        if (this.currentAmp + amp > this.threshold) {
            changeDir = true;
            reverseAmp = this.currentAmp + amp - this.threshold;
        }
    }

    var output = [changeDir, this.direction * this.currentAmp];
    if (changeDir) {
        this.direction = -this.direction;
        this.lastVal = val;
        this.currentAmp = reverseAmp;
    }

    return output;
};

var VecOscillationAnalyzer = function(nDimensions, alpha, threshold) {
    this.nDimensions = nDimensions;
    this.weightedAvgFreqs = [];
    this.weightedAvgAmps = [];
    this.oscAnalyzers = [];
    this.lastTimeDiff = null;
    this.lastDirChanges = [];
    for (var i = 0; i < nDimensions; i++) {
        this.oscAnalyzers.push(new OscillationAnalyzer(threshold));
        this.lastDirChanges.push(null);
        this.weightedAvgFreqs.push(0);
        this.weightedAvgAmps.push(0);
    }
    this.alpha = alpha;
    this.setThreshold = function(threshold) {
        for (var i = 0; i < nDimensions; i++) {
            this.oscAnalyzers[i].threshold = threshold;
        }
    }
    this.setAlpha = function(alpha) {
        for (var i = 0; i < nDimensions; i++) {
            this.oscAnalyzers[i].alpha = alpha;
        }
    }
};

var floatMax = function(a, b) {
    if (a >= b) {
        return a;
    }
    return b;
}

var arrFloatMax = function(arr) {
    var max = arr[0];
    for (var i = 1; i < arr.length; i++) {
        max = Math.max(max, arr[i]);
    }
    return max;
}

VecOscillationAnalyzer.prototype.pushVector = function(vec) {
    var now = Date.now();
    var tmpWeightedAvgFreqs = this.weightedAvgFreqs.slice();
    var tmpWeightedAvgAmps = this.weightedAvgAmps.slice();
    for (var i = 0; i < this.nDimensions; i++) {
        var result = this.oscAnalyzers[i].push(vec[i]);
        if (result[0]) {
            // this dimension changed direction, update stored weighted freqs
            if (this.lastDirChanges[i] == null) {
                this.lastDirChanges[i] = now;
            } else {
                var timeDiff = now - this.lastDirChanges[i];
                if (timeDiff <= 0) {
                    // time did not change or skipped backwards
                    continue;
                }
                this.lastDirChanges[i] = now;
                tmpWeightedAvgFreqs[i] = (1 - this.alpha)*this.weightedAvgFreqs[i] + this.alpha*(1000./timeDiff);
                this.weightedAvgFreqs[i] = tmpWeightedAvgFreqs[i];
                tmpWeightedAvgAmps[i] = (1 - this.alpha)*this.weightedAvgAmps[i] + this.alpha*(Math.abs(result[1]));
                this.weightedAvgAmps[i] = tmpWeightedAvgAmps[i];
                this.lastTimeDiff = timeDiff;
            }
        } else {
            if (this.lastDirChanges[i] != null) {
                // decay on no direction changes
                var timeDiff = now - this.lastDirChanges[i];
                if (timeDiff > 1.5*this.lastTimeDiff) {
                    // dynamic alpha according to time of silence, max out at
                    // 4 * length of last cycle
                    var alpha = Math.min(1., (parseFloat(timeDiff) / (this.lastTimeDiff * 6)));
                    tmpWeightedAvgFreqs[i] = (1 - alpha)*this.weightedAvgFreqs[i] + alpha*(1000./timeDiff);
                    tmpWeightedAvgAmps[i] = (1 - alpha)*this.weightedAvgAmps[i] + alpha*(Math.abs(result[1]));
                }
            }
        }
    }
    return [arrFloatMax(tmpWeightedAvgFreqs)/2, arrFloatMax(tmpWeightedAvgAmps)];
};

exports.OscillationAnalyzer = OscillationAnalyzer;
exports.VecOscillationAnalyzer = VecOscillationAnalyzer;
