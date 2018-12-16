define(["plib/midi/Midi"], function(MIDI) {
	'use strict';

	var MSC = Object.create(null);

	MSC.MIN_DEVICE_ID = 0;
	MSC.MAX_DEVICE_ID = 111;
	MSC.MIN_GROUP_ID = 112;
	MSC.MAX_GROUP_ID = 126;
	MSC.ALL_CALL_DEVICE_ID = 127;

	var MESSAGE_LENGTH = 64;

	var DEVICE_ID_IDX = 2;
	var DEVICE_TYPE_IDX = 4;
	var COMMAND_IDX = 5;
	var DATA_START_IDX = 6;
	var DELIM_BYTE = 0x00;
	var DOT_BYTE = 0x2E;
	var DIGIT_OFFSET = 0x30;
	var STOP_BYTE = 0xF7;

	MSC.DeviceType = Object.freeze({
		LIGHTING: 0x01,
		MOVING_LIGHTS: 0x02,
		COLOR_CHANGERS: 0x03,
		STROBES: 0x04,
		LASERS: 0x05,
		CHASERS: 0x06,
		SOUND: 0x10,
		MUSIC: 0x11,
		CD_PLAYERS: 0x12,
		EPROM_PLAYBACK: 0x13,
		AUDIO_TAPE_MACHINES: 0x14,
		INTERCOMS: 0x15,
		AMPLIFIERS: 0x16,
		AUDIO_EFFECTS_DEVICES: 0x17,
		EQUALISERS: 0x18,
		MACHINERY: 0x20,
		RIGGING: 0x21,
		FLYS: 0x22,
		LIFTS: 0x23,
		TURNTABLES: 0x24,
		TRUSSES: 0x25,
		ROBOTS: 0x26,
		ANIMATION: 0x27,
		FLOATS: 0x28,
		BREAKAWAYS: 0x29,
		BARGES: 0x2A,
		VIDEO: 0x30,
		VIDEO_TAPE_MACHINES: 0x31,
		VIDEO_CASSETTE_MACHINES: 0x32,
		VIDEO_DISC_PLAYERS: 0x33,
		VIDEO_SWITCHERS: 0x34,
		VIDEO_EFFECTS: 0x35,
		VIDEO_CHARACTER_GENERATORS: 0x36,
		VIDEO_STILL_STORES: 0x37,
		VIDEO_MONITORS: 0x38,
		PROJECTION: 0x40,
		FILM_PROJECTORS: 0x41,
		SLIDE_PROJECTORS: 0x42,
		VIDEO_PROJECTORS: 0x43,
		DISSOLVERS: 0x44,
		SHUTTER_CONTROLS: 0x45,
		PROCESS_CONTROL: 0x50,
		HYDRAULIC_OIL: 0x51,
		H20: 0x52,
		CO2: 0x53,
		COMPRESSED_AIR: 0x54,
		NATURAL_GAS: 0x55,
		FOG: 0x56,
		SMOKE: 0x57,
		CRACKED_HAZE: 0x58,
		PYRO: 0x60,
		FIREWORKS: 0x61,
		EXPLOSIONS: 0x62,
		FLAME: 0x63,
		SMOKE_POTS: 0x64,
		ALL_TYPES: 0x7F
	});

	MSC.Command = Object.freeze({
		GO: 0x01,
		STOP: 0x02,
		RESUME: 0x03,
		TIMED_GO: 0x04,
		LOAD: 0x05,
		SET: 0x06,
		FIRE: 0x07,
		ALL_OFF: 0x08,
		RESTORE: 0x09,
		RESET: 0x0A,
		GO_OFF: 0x0B,
		GO_JAM_CLOCK: 0x10,
		STANDBY_NEXT: 0x11,
		STANDBY_PREV: 0x12,
		SEQUENCE_NEXT: 0x13,
		SEQUENCE_PREV: 0x14,
		START_CLOCK: 0x15,
		STOP_CLOCK: 0x16,
		ZERO_CLOCK: 0x17,
		SET_CLOCK: 0x18,
		MTC_CHASE_ON: 0x19,
		MTC_CHASE_OFF: 0x1A,
		OPEN_CUE_LIST: 0x1B,
		CLOSE_CUE_LIST: 0x1C,
		OPEN_CUE_PATH: 0x1D,
		CLOSE_CUE_PATH: 0x1E
	});

	/**
	 * @private
	 * @static Fills the necessary portion of the provided array with the MSC-style digits for the given value.
	 * 
	 * @param data Array in which to write digits
	 * @param offset Offset into the array at which to start writing digits
	 * @param value Value up to 99999 or 99999.999
	 * @return The next index into <code>data</code> after the written digits
	 */
	function writeDigits(data, offset, value) {
		var i = offset;
		var mustWrite = false;
		if (Number.isInteger(value)) {
			if (~~(value / 10000) > 0) {
				data[i++] = ~~(value / 10000) | DIGIT_OFFSET;
				value %= 10000;
				mustWrite = true;
			}
			if (mustWrite || ~~(value / 1000) > 0) {
				data[i++] = ~~(value / 1000) | DIGIT_OFFSET;
				value %= 1000;
				mustWrite = true;
			}
			if (mustWrite || ~~(value / 100) > 0) {
				data[i++] = ~~(value / 100) | DIGIT_OFFSET;
				value %= 100;
				mustWrite = true;
			}
			if (mustWrite || ~~(value / 10) > 0) {
				data[i++] = ~~(value / 10) | DIGIT_OFFSET;
				value %= 10;
			}
			data[i++] = value | DIGIT_OFFSET;
		}
		else if (!isNaN(value)) {
			var whole = Math.floor(value);
			var fract = Math.floor((value - whole) * 1000);
			if (~~(whole / 10000) > 0) {
				data[i++] = ~~(whole / 10000) | DIGIT_OFFSET;
				value %= 10000;
				mustWrite = true;
			}
			if (mustWrite || ~~(whole / 1000) > 0) {
				data[i++] = (whole / 1000) | DIGIT_OFFSET;
				value %= 1000;
				mustWrite = true;
			}
			if (mustWrite || ~~(whole / 100) > 0) {
				data[i++] = ~~(whole / 100) | DIGIT_OFFSET;
				value %= 100;
				mustWrite = true;
			}
			if (mustWrite || ~~(whole / 10) > 0) {
				data[i++] = ~~(whole / 10) | DIGIT_OFFSET;
				value %= 10;
			}
			data[i++] = (whole | DIGIT_OFFSET);

			if (fract > 0) {
				data[i++] = DOT_BYTE;
				data[i++] = ~~(fract / 100) | DIGIT_OFFSET;
				fract %= 100;
				if (fract > 0) {
					data[i++] = ~~(fract / 10) | DIGIT_OFFSET;
					fract %= 10;
					if (fract > 0) {
						data[i++] = ~~(fract | DIGIT_OFFSET);
					}
				}
			}
		}
		return i;
	}

	/**
	 * @private
	 * @static Fills the necessary portion of the provided array with the value converted to a 14-bit number (two 7-bit
	 *         bytes, LE).
	 * 
	 * @param data Array in which to write digits
	 * @param offset Offset into the array at which to start writing digits
	 * @param value Value up to 16,383
	 * @return The next index into <code>data</code> after the written digits
	 */
	function write14Bit(data, offset, value) {
		var i = offset;
		data[i++] = value & 0x7F;
		data[i++] = (value >> 7) & 0x7f;
		return i;
	}

	MSC.Output = function(midiOut) {
		if (midiOut) {
			this.receiver = midiOut;
		}
		else {
			window.navigator.requestMIDIAccess({
				sysex: true
			}).then(function(access) {
				var outs = access.outputs(); // LATER: It seems like this may change to a Map, per the spec.
				if (outs.length > 0) {
					this.receiver = outs[0];
				}
				else {
					throw new Error("No MIDI output ports are available.");
				}
			}, function(err) {
				throw new Error("Request for MIDI SysEx output port failed: " + err);
			});
		}
		this.data = new Uint8Array(MESSAGE_LENGTH);
		this.data[0] = MIDI.Status.SYSTEM_EXCLUSIVE;
		this.data[1] = 0x7F;
		this.setDeviceID(MSC.ALL_CALL_DEVICE_ID);
		this.setDeviceType(MSC.DeviceType.LIGHTING);
		this.data[DEVICE_ID_IDX + 1] = 0x02;
	};

	// VERIFY: When sending this.data to this.receiver.send(), should we only be sending the number of bytes in
	// question,
	// thereby (keeping i incremented on STOP_BYTE): this.receiver.send(this.data.subarray(0, i))

	MSC.Output.prototype = {
		deviceID: MSC.ALL_CALL_DEVICE_ID,
		deviceType: MSC.DeviceType.LIGHTING,
		setDeviceID: function(deviceID) {
			this.deviceID = deviceID;
			this.data[DEVICE_ID_IDX] = deviceID;
		},
		setDeviceType: function(deviceType) {
			this.deviceType = deviceType;
			this.data[DEVICE_TYPE_IDX] = deviceType;
		},
		go: function(cue, list) {
			this.data[COMMAND_IDX] = MSC.Command.GO;
			var i = DATA_START_IDX;
			if (typeof cue !== 'undefined') {
				i = writeDigits(this.data, i, cue);
				this.data[i++] = DELIM_BYTE;
				if (typeof list !== 'undefined') {
					i = writeDigits(this.data, i, list);
					this.data[i++] = DELIM_BYTE;
				}
			}
			this.data[i] = STOP_BYTE;
			this.receiver.send(this.data);
		},
		stop: function() {
			this.data[COMMAND_IDX] = MSC.Command.STOP;
			this.data[DATA_START_IDX] = STOP_BYTE;
			this.receiver.send(this.data);
		},
		resume: function() {
			this.data[COMMAND_IDX] = MSC.Command.RESUME;
			this.data[DATA_START_IDX] = STOP_BYTE;
			this.receiver.send(this.data);
		},
		fire: function(macro) {
			this.data[COMMAND_IDX] = MSC.Command.FIRE;
			this.data[DATA_START_IDX] = (macro & 0x7F);
			this.data[DATA_START_IDX + 1] = STOP_BYTE;
			this.receiver.send(this.data);
		},
		reset: function() {
			this.data[COMMAND_IDX] = MSC.Command.RESET;
			this.data[DATA_START_IDX] = STOP_BYTE;
			this.receiver.send(this.data);
		},
		set: function(control, value) {
			this.data[COMMAND_IDX] = MSC.Command.SET;
			var i = DATA_START_IDX;
			i = write14Bit(this.data, i, control);
			this.data[i++] = DELIM_BYTE;
			i = write14Bit(this.data, i, value);
			this.data[i++] = DELIM_BYTE;
			this.data[i] = STOP_BYTE;
			this.receiver.send(this.data);
		},
		sendCommand: function(command, data) {
			this.data[COMMAND_IDX] = command;
			var i = DATA_START_IDX;
			if (data && data.length > 0) {
				i = Math.min(MESSAGE_LENGTH - DATA_START_IDX - 3, data.length);
				this.data.set(data, DATA_START_IDX);
				i += DATA_START_IDX;
				this.data[i++] = DELIM_BYTE;
			}
			this.data[i] = STOP_BYTE;
			this.receiver.send(this.data);
		}
	};

	function sendMessage(midiOut, data, length) {
		midiOut.send(data.subarray(0, length));
	}

	return Object.freeze(MSC);

});
