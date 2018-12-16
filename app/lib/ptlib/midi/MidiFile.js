define(["./Midi"], function (MIDI) {
	'use strict';

	var DFLT_RESOLUTION = 480;
	var HEADER_SIZE = 14;
	var FILE_MAGIC_NUMBER = "MThd";
	var TRACK_MAGIC_NUMBER = "MTrk";
	
	/**
	 * Compares a string "magic number" with the specified bytes in a buffer.
	 * @author Peter Torpey
	 * @private
	 * @param {string}                string     the magic number as a string
	 * @param {Array|TypedArray} buffer     array of bytes
	 * @param {number}                [offset=0] offset into buffer at which to start comparing
	 */
	function compareMagic(string, buffer, offset) {
		offset = offset || 0;
		for (var i = 0; i < string.length; i++) {
			if (buffer[i + offset] !== string.charCodeAt(i)) {
				return false;
			}
		}
		return true;
	}
	
	function MidiFile(resolutionOrBytes) {
		this.resolution = DFLT_RESOLUTION;
		this.format = 1;
		this.tracks = [];
		this.trackCount = 0;
//		if (typeof resolutionOrBytes === 'string') {
//			resolutionOrBytes = b64toBytes(resolutionOrBytes);
//			
//		}
		
		if (typeof resolutionOrBytes === 'number') {
			this.resolution = resolutionOrBytes;
		}
		else if (Array.isArray(resolutionOrBytes) || resolutionOrBytes.buffer && resolutionOrBytes.buffer instanceof ArrayBuffer) {
			var buffer = new Uint8Array(resolutionOrBytes);
			// VERIFY: Parse MIDI File data
			var header = new DataView(buffer.buffer, 0, HEADER_SIZE);
			if (!compareMagic(FILE_MAGIC_NUMBER, buffer)) {
				throw new Error("File identifier is not MThd.");
			}
			this.format = header.getUint16(8);
			this.trackCount = header.getUint16(10);
			this.resolution = header.getUint16(12);
			var offset = HEADER_SIZE;
			var subBuffer;
			for (var i = 0; i < this.trackCount; i++) {
				// This now relies on Track() setting .position on the subarray..........
				console.log("Track at " + offset);
				subBuffer = buffer.subarray(offset);
				// console.log(Array.prototype.map.call(subBuffer.subarray(0, 24), x => x.toString(16) + " ").join(" "));
				this.tracks.push(new Track(subBuffer));
				console.log("  length: " + subBuffer.position);
				console.log("  events: " + this.tracks[this.tracks.length - 1].events.length);
				offset += subBuffer.position;
			}
		}
	}
	
	MidiFile.DFLT_RESOLUTION = 480;
	MidiFile.DFLT_METER = 24;
	MidiFile.DFLT_DIVISION = 8;

	MidiFile.prototype.setFormat = function (type) {
		if (type < 0) {
			this.format = 0;
		}
		else if (type > 2) {
			this.format = 1;
		}
		else if (type === 0 && this.tracks.length > 1) {
			this.format = 1;
		}
		else {
			this.format = type;
		}
	};
	
	MidiFile.prototype.getTrackCount = function () {
		return this.tracks.length;
	};
	
	MidiFile.prototype.setResolution = function (res) {
		if (res >= 0) {
			this.resolution = ~~res;
		}
	};
	
	MidiFile.prototype.getLengthInTicks = function () {
		var length = 0;
		var l;
		// for (var track of this.tracks) {
		for (var i = 0; i < this.tracks.length; i++) {
			// l = track.getLengthInTicks();
			l = this.tracks[i].getLengthInTicks();
			if (l > length) {
				length = l;
			}
		}
		return length;
	};
	
	MidiFile.prototype.addTrack = function (track, position) {
		if (arguments.length < 2) {
			this.tracks.push(track);
		}
		else {
			if (position > this.tracks.length) {
				position = this.tracks.length;
			}
			else if (position < 0) {
				position = 0;
			}
			this.tracks.splice(position, 0, track);
		}
		this.format = (this.tracks.length > 1) ? 1 : 0;
	};
	
	MidiFile.prototype.removeTrack = function (position) {
		if (position < 0 || position >= this.tracks.length - 1) {
			return;
		}
		this.tracks.splice(position, 1);
		this.format = (this.tracks.length > 1) ? 1 : 0;
	};
	
	MidiFile.prototype.writeBuffer = function () {
		// VERIFY: Write MIDI data
		var trackBytes = new Array(this.tracks.length);
		var tracksSize = 0;
		for (var i = 0; i < this.tracks.length; i++) {
			trackBytes[i] = this.tracks[i].getBytes();
			tracksSize += trackBytes[i].length;
		}
		var bytes = new Uint8Array(HEADER_SIZE + tracksSize);
		var buf = new DataView(bytes.buffer);
		var offset = 0;
		for (var i = 0; i < FILE_MAGIC_NUMBER.length; i++) {
			buf.setUint8(offset++, FILE_MAGIC_NUMBER.charCodeAt(i));
		}
		buf.setUint32(offset, 0x06); offset += 4;
		buf.setUint16(offset, this.format); offset += 2;
		buf.setUint16(offset, this.tracks.length); offset += 2;
		buf.setUint16(offset, this.resolution); offset += 2;
		
		var tb;
		while (trackBytes.length > 0) {
			console.log("Writing " + trackBytes.length);
			tb = trackBytes.shift();
			// bytes.set(tb, offset);
			for (var j = 0; j < tb.length; j++) {
				bytes[offset + j] = tb[j];
			}
			offset += tb.length;
		}
//		for (var tb of trackBytes) {
//			bytes.set(tb, offset);
//			offset += tb.length;
//		}
		
		return bytes;
	};
	
	MidiFile.concat = function (startFile, endFile) {
		var combined = new MidiFile(startFile.resolution);
		var nTracks = Math.min(startFile.getTrackCount(), endFile.getTrackCount());
		for (var i = 0; i < nTracks; i++) {
			combined.addTrack(Track.concat(startFile.tracks[i], endFile.tracks[i], startFile.getLengthInTicks()));
		}
	};
	
	// LATER: Optionally bind a track to a channel and then have all events added to that track be added with the correct channel.
	// But if all of the messages added to events take the channel, do we overwrite it? Is there a default channel in message constructors?
	
	function Track(buffer) {
		this.size = 0;
		this.sizeNeedsRecalculating = false;
		this.closed = false;
		// this.endOfTrackDelta = 0;
		
		this.events = [];
		
		// If we're passed a buffer of the correct type, populate the track.
		if (Array.isArray(buffer) || (buffer && buffer.buffer instanceof ArrayBuffer)) {
			if (typeof buffer.position !== 'number') {
				buffer.position = 0;
			}
			var startPosition = buffer.position;
			if (compareMagic(TRACK_MAGIC_NUMBER, buffer, buffer.position)) {
				buffer.position += TRACK_MAGIC_NUMBER.length;
				var length = 0;
				var tick = 0;
				var lastStatus = 0;
				var message;
				for (var i = 0; i < 4; i++) {
					length = (length << 8) + buffer[buffer.position++];
				}
				console.log("Final track length: " + length);
				// for (var i = 0; i < length; i++) {
				length += TRACK_MAGIC_NUMBER.length + 4;
				while ((buffer.position - startPosition) < length) {
					tick += readVariableLengthInt(buffer);
					// Check for running status
					if (buffer[buffer.position] > 0x7F) {
						lastStatus = buffer[buffer.position++];
					}
					// console.log("Parsing track " + buffer.position + " - " + lastStatus.toString(16));
					message = MIDI.Message.parse(buffer, lastStatus);
					if (message && !(lastStatus === MIDI.Status.META && message.getType() === MIDI.MetaMessage.Type.END_OF_TRACK)) {
						// Message.parse returns null if it finds something unexpected (bad status byte).
						this.events.push(new MidiEvent(message, tick));
					}
				}
				buffer.position = length; // Why this isn't the case at this point, I have no clue. It's sometimes +2, possible the status and the VarInt that were read?
			}
			else {
				console.warn("Track buffer did not start with valid MTrk.");
			}
			this.sizeNeedsRecalculating = true;
		}
	}

	Track.prototype.size = function () {
		if (this.sizeNeedsRecalculating) {
			recalculateSize(this);
		}
		return this.size;
	};
	
	Track.prototype.getLengthInTicks = function () {
		if (this.events.length === 0) {
			return 0;
		}
		return this.events[this.events.length - 1].tick;
	};
	
	Track.prototype.insertNote = function (channel, pitch, velocity, tick, duration) {
		this.insertEvent(new MidiEvent(MIDI.noteOn(channel, pitch, velocity), tick));
		this.insertEvent(new MidiEvent(MIDI.noteOff(channel, pitch), tick + duration));
	};
	
//	function eventTimeComparator(a, b) {
//		return a.tick - b.tick;
//	}
	
	Track.prototype.insertEvent = function (midiEvent) {
		if (!midiEvent) {
			return;
		}
		if (this.closed) {
			throw new Error("Cannot add an event to a closed track.");
		}
		
		// var prev, next;
		var i = 0;
//		for (; i < this.events.length; i++) {
//			if (midiEvent.tick > this.events[i].tick) {
//				break;
//			}
//		}
		// I'm not sure how this is really different from the non-working for loop above.
		// This assumes the messages are inserted in a meaningful order. An other library
		// used a table to sort temporally coincident events.
		while (i < this.events.length && midiEvent.tick >= this.events[i].tick) {
			i++;
		}

		if (i < 0) {
			i = 0;
		}
		if (i > this.events.length) {
			i = this.events.length;
		}
		
		this.events.splice(i, 0, midiEvent);
		this.sizeNeedsRecalculating = true;
		
//		if (i < this.events.length - 1) {
//			next = this.events[i + 1];
//		}
//		if (i > 0) {
//			prev = this.events[i - 1];
//		}
//		
//		if (prev) {
//			midiEvent.setDelta(midiEvent.tick - this.events[i - 1].tick);
//		}
//		else {
//			midiEvent.setDelta(midiEvent.tick);
//		}
//		
//		if (next) {
//			next = this.events[i + 1];
//			next.setDelta(next.tick - midiEvent.tick);
//		}
		
		// this.size += midiEvent.size;
		
		if (midiEvent.message instanceof MIDI.MetaMessage && midiEvent.message.getType() === MIDI.MetaMessage.Type.END_OF_TRACK) {
			// if (next) {
			if (i < this.events.length - 1) {
				throw new Error("Attempting to insert EndOfTrack before an existing event. Use closeTrack() when finished inserting events.");
			}
			this.closed = true;
		}
	};
	
	Track.prototype.removeEvent = function (midiEvent) {
		var found = false;
		var i = 0;
		for (; i < this.events.length; i++) {
			if (this.events[i] === midiEvent) {
				found = true;
				break;
			}
		}
		if (found) {
//			if (i < this.events.length - 1) {
//				if (i > 0 && this.events.length > 2) {
//					this.events[i + 1].setDelta(this.events[i + 1].tick - this.events[i - 1].tick);
//				}
//				else {
//					this.events[i + 1].setDelta(this.events[i + 1].tick);
//				}
//			}
			this.events.splice(i, 1);
		}
		return found;
	};
	
	Track.prototype.closeTrack = function () {
		if (!this.closed) {
			var lastTick = 0;
			if (this.events.length > 0) {
				lastTick = this.events[this.events.length - 1].tick;
			}
			// this.insertEvent(new EndOfTrack(lastTick + this.endOfTrackDelta, 0));
			// this.insertEvent(new EndOfTrack(lastTick, 0));
			// this.insertEvent(new MidiEvent(new MIDI.MetaMessage(MIDI.MetaMessage.Type.END_OF_TRACK, null, 0), lastTick));
			this.events.push(new MidiEvent(new MIDI.MetaMessage(MIDI.MetaMessage.Type.END_OF_TRACK, null, 0), lastTick));
			this.closed = true;
			this.sizeNeedsRecalculating = true;
		}
	};
	
	Track.prototype.toString = function () {
		return "[Track (" + this.events.length + ")]";
	};
	
	function recalculateSize(track) {
		track.size = 0;
		var cur;
		var last;
		var lastTick = 0; // track.events[0].tick;
		for (var i = 0; i < track.events.length; i++) {
			cur = track.events[i];
			track.size += cur.message.getLength() + getVariableLengthIntSize(cur.tick - lastTick);
			if (!cur.requiresStatusByte(last)) {
				track.size--;
			}
			lastTick = cur.tick;
			last = cur;
		}
		console.log("Track calc: " + track.size + " events: " + track.events.length);
		track.sizeNeedsRecalculating = false;
	}
	
	Track.prototype.getBytes = function () {
		if (!this.closed) {
			this.closeTrack();
		}
		if (this.sizeNeedsRecalculating) {
			recalculateSize(this);
		}
		
		// The 4 is the Uint32 size of the track payload
		var bytes = new Uint8Array(TRACK_MAGIC_NUMBER.length + 4 + this.size);
		this.write(bytes);
		return bytes;
	};
	
	Track.prototype.write = function (bytes, offset) {
		seek(bytes, offset);
		
		if (!this.closed) {
			this.closeTrack();
		}
		if (this.sizeNeedsRecalculating) {
			recalculateSize(this);
		}
		
		for (var i = 0; i < TRACK_MAGIC_NUMBER.length; i++) {
			bytes[bytes.position++] = TRACK_MAGIC_NUMBER.charCodeAt(i);
		}

		bytes[bytes.position++] = this.size >>> (24 & 0xFF);
		bytes[bytes.position++] = this.size >>> (16 & 0xFF);
		bytes[bytes.position++] = this.size >>> (8 & 0xFF);
		bytes[bytes.position++] = this.size & 0xFF;

		var lastEvent = null;
		var lastTick = this.events[0].tick;
		var evt;
		// for (var evt of this.events) {
		for (var i = 0; i < this.events.length; i++) {
			evt = this.events[i];
			writeVariableLengthInt(evt.tick - lastTick, bytes);
			evt.write(evt.requiresStatusByte(lastEvent), bytes);
			lastEvent = evt;
			lastTick = lastEvent.tick;
		}
		
		return bytes.position;
	};

	Track.prototype.append = function (track) {
		var concatted = Track.concat(this, track, this.getLengthInTicks());
		this.events = concatted.events;
		this.sizeNeedsRecalculating = true;
		this.closed = concatted.closed;
	};
	
	Track.concat = function (track1, track2, offset) {
		var combined = new Track();
		offset = (typeof offset === 'number') ? offset : track1.getLengthInTicks();
		var event;
		// for (var event of track1.events) {
		for (var i = 0; i < track1.events.length; i++) {
			event = track1.events[i];
			// if (event.getStatus() !== MIDI.Status.END_OF_TRACK) {
			if (!(event.message instanceof MIDI.MetaMessage && event.message.getType() === MIDI.MetaMessage.Type.END_OF_TRACK)) {
				combined.events.push(event.clone());
			}
		}
		// for (var event of track2.events) {
		for (var i = 0; i < track2.events.length; i++) {
			event = track2.events[i].clone();
			event.tick += offset;
			combined.insertEvent(event);
		}
		combined.sizeNeedsRecalculating = true;
		return combined;
	};
	
	Track.loop = function (track, loopCount) {
		var looped = new Track();
		var tick = 0;
		var loopDuration = track.getLengthInTicks();
		var event;
		for (; loopCount > 0; loopCount--) {
			// for (var event of track.events) {
			for (var i = 0; i < track.events.length; i++) {
				event = track.events[i];
				// if (event.getStatus() !== MIDI.Status.END_OF_TRACK) {
				if (!(event.message instanceof MIDI.MetaMessage && event.message.getType() === MIDI.MetaMessage.Type.END_OF_TRACK)) {
					event = event.clone();
					event.tick += tick;
					looped.events.push(event);
				}
			}
			tick += loopDuration;
		}
		looped.sizeNeedsRecalculating = true;
		return looped;
	};
	
	function getVariableLengthIntSize(intValue) {
		var varLength = 0;
		do {
			intValue = intValue >>> 7;
			varLength++;
		} while (intValue > 0);
		return varLength;
	}
	
	function writeVariableLengthInt(intValue, bytes, offset) {
		seek(bytes, offset);
		var buffer = intValue & 0x7F;

		while ((intValue >>>= 7)) {
			buffer <<= 8;
			buffer |= ((intValue & 0x7F) | 0x80);
		}

		while (true) {
			bytes[bytes.position++] = buffer & 0xFF;
			if (buffer & 0x80) {
				buffer >>>= 8;
			}
			else {
				break;
			}
		}
		
		return bytes.position;
	}
	
	function readVariableLengthInt(bytes, offset) {
		seek(bytes, offset);
		// VERIFY: parse a varInt... without a stream, how do we return the value and the offset?
		var result = 0;
		var b;
//		while (true) {
//			b = bytes[bytes.position++];
//			if (b & 0x80) {
//				result += (b & 0x7f);
//				result <<= 7;
//			}
//			else {
//				/* b is the last byte */
//				return result + b;
//			}
//		}
		result = bytes[bytes.position++];
		if (result & 0x80) {
			result &= 0x7F;
			do {
				b = bytes[bytes.position++];
				result = (result << 7) + (b & 0x7F);
			} while (b & 0x80);
		}
		return result;
	}
	
	function MidiEvent(message, tick) {
		if (!(message instanceof MIDI.Message)) {
			throw new Error("A MIDI Event must contain a valid MIDI Message.");
		}
		this.tick = tick || 0;
		this.message = message;
	}
	
	MidiEvent.prototype.getEventSize = function () {
		return this.message.getSize(); // + delta
	};
	
	MidiEvent.prototype.requiresStatusByte = function (prevEvent) {
		if (!prevEvent) {
			return true;
		}
		if (this.message instanceof MIDI.MetaMessage) {
			return true;
		}
		if (this.message.getStatus() === prevEvent.message.getStatus()) {
			return false;
		}
		return true;
	};
	
	MidiEvent.prototype.write = function (writeStatus, bytes, offset) {
		seek(bytes, offset);
		// VERIFY: write event
		var data = this.message.data;
		for (var i = ((writeStatus) ? 0 : 1); i < data.length; i++) {
			bytes[bytes.position++] = data[i];
		}
		return bytes.position;
	};
	
	MidiEvent.prototype.toString = function () {
		return this.message.toString() + "(" + this.tick + ")";
	};
	
	MidiEvent.prototype.clone = function () {
		return new MidiEvent(this.message.clone(), this.tick);
	};
	
	MidiEvent.createTempoEvent = function(bpm, tick) {
		bpm = bpm || 120;
		tick = tick || 0;
		return new MidiEvent(new MIDI.MetaMessage(MIDI.MetaMessage.Type.TEMPO, intToBytes(MIDI.bpmToMpqn(bpm), 3), 3), tick);
	};
	
	MidiEvent.createTimeSignatureEvent = function (numerator, denominator, meter, division, tick) {
		meter = meter || MidiFile.DFLT_METER;
		division = division || MidiFile.DFLT_DIVISION;
		tick = tick || 0;
		var bytes = new Array(4);
		bytes[0] = ~~numerator;
		bytes[1] = log2(denominator);
		bytes[2] = meter & 0xFF;
		bytes[3] = division & 0xFF;
		return new MidiEvent(new MIDI.MetaMessage(MIDI.MetaMessage.Type.TIME_SIGNATURE, bytes, 4), tick);
	};
	
	function intToBytes(intValue, length) {
		var bytes;
		if (typeof length === 'number' && length > 0) {
			bytes = new Array(length);
			var i = length - 1;
			do {
				bytes[i] = intValue & 0xFF;
				intValue >>>= 8;
				i--;
			} while (intValue > 0 && i >= 0);
		}
		else {
			bytes = [];
			do {
				bytes.unshift(intValue & 0xFF);
				intValue >>>= 8;
			} while (intValue > 0);
		}
		return bytes;
	}
	
	function log2(den) {
		switch(den) {
			case 2:
				return 1;
			case 4:
				return 2;
			case 8:
				return 3;
			case 16:
				return 4;
			case 32:
				return 5;
		}
		return 0;
	}
		
	function seek(bytes, offset) {
		if (typeof offset === 'number') {
			bytes.position = offset;
		}
		else {
			bytes.position = bytes.position || 0;
		}
	}
	
	MidiFile.Track = Track;
	MidiFile.Event = MidiEvent;
	return MidiFile;
});