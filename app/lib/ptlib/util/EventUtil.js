var captureElement = null;

function mouseCaptureHandler(e) {
	if (captureElement) {
		captureElement.dispatchEvent(new e.constructor(e.type, e));
		e.stopImmediatePropagation();
	}
}

function mouseReleaseHandler(e) {
	if (captureElement) {
		captureElement.dispatchEvent(new e.constructor(e.type, e));
		document.removeEventListener('mousemove', mouseCaptureHandler, false);
		document.removeEventListener('mouseup', mouseReleaseHandler, false);
	}
}

var EventUtil = {
	// VERIFY: Events have timeStamps? Or should we just use Date.now()?
	// No, most events don't seem to have timestamps.
	throttle: function(handler, interval, context) {
		if (typeof handler !== 'function') {
			throw new TypeError("throttle() requires handler to be callable.");
		}
		var lastEventTime = 0;
		var args = Array.prototype.slice.call(arguments, 3);
		var timer = null;
		return function(e) {
			var now = Date.now();
			if (now - lastEventTime > interval) {
				handler.apply(context || this, [e].concat(args));
				lastEventTime = now;
				window.clearTimeout(timer);
				timer = window.setTimeout(function () {
					timer = null;
					handler.apply(context || this, [e].concat(args));
				}, interval);
			}
		};
	},
	debounce: function(handler, delay, context) {
		if (typeof handler !== 'function') {
			throw new TypeError("debounce() requires handler to be callable.");
		}
		var timer = null;
		var args = Array.prototype.slice.call(arguments, 3);
		return function(e) {
			window.clearTimeout(timer);
			// if (!timer) {
			timer = window.setTimeout(function() {
				timer = null;
				handler.apply(context || this, [e].concat(args));
			}, delay);
			// }
		};
	},
	setCapture: function(element) {
		if (element.setCapture) {
			element.setCapture(true);
		}
		else {
			captureElement = element;
			document.addEventListener('mousemove', mouseCaptureHandler, false);
			document.addEventListener('mouseup', mouseReleaseHandler, false);
		}
	},
	releaseCapture: function() {
		captureElement = null;
		if (document.releaseCapture) {
			document.releaseCapture();
		}
		else {
			document.removeEventListener('mousemove', mouseCaptureHandler, false);
			document.removeEventListener('mouseup', mouseReleaseHandler, false);
		}
	}
};

module.exports = EventUtil;