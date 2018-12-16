'use strict';

var MusicUtil = require("../util/MusicUtil");

var MIDI = Object.create(null);

MIDI.NUM_CHANNELS = 16;
MIDI.NUM_NOTES = 128;

MIDI.Status = Object.freeze({
    NOTE_OFF: 0x80,
    NOTE_ON: 0x90,
    POLY_PRESSURE: 0xA0,
    CONTROL_CHANGE: 0xB0,
    PROGRAM_CHANGE: 0xC0,
    CHANNEL_PRESSURE: 0xD0,
    AFTERTOUCH: 0xD0,
    PITCH_BEND: 0xE0,
    SYSTEM_EXCLUSIVE: 0xF0,
    MIDI_TIME_CODE: 0xF1,
    SONG_POSITION_POINTER: 0xF2,
    SONG_SELECT: 0xF3,
    TUNE_REQUEST: 0xF6,
    END_OF_EXCLUSIVE: 0xF7,
    SPECIAL_SYSTEM_EXCLUSIVE: 0xF7,
    TIMING_CLOCK: 0xF8,
    START: 0xFA,
    CONTINUE: 0xFB,
    STOP: 0xFC,
    ACTIVE_SENSING: 0xFE,
    META: 0xFF,
    SYSTEM_RESET: 0xFF
});

/**** Message ****/

// Perhaps MIDI messages could be a subclass of Uint8Array, so that they could be passed directly to the MIDI API.

MIDI.Message = function (bytes) {
    if (!Array.isArray(bytes) && !(bytes && bytes.buffer instanceof ArrayBuffer)) {
        throw new Error("Message must be constructed with a valid data array.");
    }
    this.data = bytes;
    this.length = bytes.length;
};

MIDI.Message.prototype.getLength = function () {
    return this.length;
};

MIDI.Message.prototype.getStatus = function () {
    return this.data[0];
};

MIDI.Message.prototype.setStatus = function (status) {
    this.data[0] = status;	
};

MIDI.Message.prototype.setMessage = function (bytes, length, offset) {
    if (!Array.isArray(bytes) || !(bytes && bytes.buffer instanceof ArrayBuffer)) {
        throw new Error("Message must be set with a valid data array.");
    }
    this.length = length || bytes.length;
    this.data = bytes.slice(offset || 0, offset + this.length);
};

MIDI.Message.prototype.toString = function () {
    return "[MIDI Message " + this.getStatus().toString(16) + "]";
};

MIDI.Message.prototype.clone = function () {
    return new MIDI.Message(this.data.slice(0));	
};

MIDI.Message.parse = function (bytes, status) {
    var resetPosition = bytes.position + 1;

    if (status >= 0x80 && status <= 0xEF) {
        return MIDI.ShortMessage.parse(bytes, status);
    }
    else if (status === MIDI.Status.META) {
        return MIDI.MetaMessage.parse(bytes, status);
    }
    else if (status === MIDI.Status.SYSTEM_EXCLUSIVE || status === MIDI.Status.END_OF_EXCLUSIVE) {
        var length = readVariableLengthInt(bytes);
        // var message = new MIDI.SysexMessage(bytes.subarray(bytes.position, bytes.position + length), length);
        var message = new MIDI.SysexMessage(bytes.slice(bytes.position, bytes.position + length), length);
        bytes.position += length;
        return message;
    }
    else {
        console.warn("Could not parse expected status byte " + status + ". Skipping.");
        bytes.position = resetPosition;
    }
    return null;
};

// LATER: This is such a mess. readVarInt() is duplicated in MidiFile... make it a member here? But it really is a file thing...
// MetaMessage and SysexMessage really are file things... or we do make a VarInt type....
function readVariableLengthInt(bytes) {
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

/**** ShortMessage ****/

MIDI.ShortMessage = function(command, channel, data1, data2) {
    if (arguments.length === 1 && (command && command.buffer instanceof ArrayBuffer)) {
        MIDI.Message.call(this, command);
    }
    else {
        // Add 1 for the status byte
        MIDI.Message.call(this, new Uint8Array(1 + getDataLength(command)));
        if (arguments.length === 1) {
            this.setStatus(command);
        }
        else if (arguments.length === 2) {
            this.setCommand(command);
            this.setChannel(channel);
        }
        else if (arguments.length === 3) {
            this.setCommand(command);
            this.setChannel(channel);
            this.setData1(data1);
        }
        else if (arguments.length === 4) {
            this.setCommand(command);
            this.setChannel(channel);
            this.setData(data1, data2);
        }
    }
};

function getDataLength(command) {
    // if ((command & 0xF0) != 0xF0) {
    if (command < 0xF0) {
        command &= 0xF0;
    }

    switch (command) {
        case MIDI.Status.NOTE_OFF:
        case MIDI.Status.NOTE_ON:
        case MIDI.Status.POLY_PRESSURE:
        case MIDI.Status.CONTROL_CHANGE:
        case MIDI.Status.PITCH_BEND:
        case MIDI.Status.SONG_POSITION_POINTER:
            return 2;
        case MIDI.Status.PROGRAM_CHANGE:
        case MIDI.Status.CHANNEL_PRESSURE:
        case MIDI.Status.SONG_SELECT:
            return 1;
        case MIDI.Status.TUNE_REQUEST:
        case MIDI.Status.END_OF_EXCLUSIVE:
        case MIDI.Status.TIMING_CLOCK:
        case MIDI.Status.START:
        case MIDI.Status.CONTINUE:
        case MIDI.Status.STOP:
        case MIDI.Status.ACTIVE_SENSING:
        case MIDI.Status.SYSTEM_RESET:
            return 0;
        default:
            throw new Error("Invalid message status: " + command.toString(16));
    }
}

MIDI.ShortMessage.prototype = Object.create(MIDI.Message.prototype);
MIDI.ShortMessage.prototype.constructor = MIDI.ShortMessage;
MIDI.ShortMessage.prototype.parent = MIDI.Message.prototype;

MIDI.ShortMessage.prototype.getCommand = function() {
    return MIDI.ShortMessage.getCommand(this.data);
};

MIDI.ShortMessage.prototype.getChannel = function() {
    return MIDI.ShortMessage.getChannel(this.data);
};

MIDI.ShortMessage.prototype.getData1 = function() {
    return MIDI.ShortMessage.getData1(this.data);
};

MIDI.ShortMessage.prototype.getData2 = function() {
    return MIDI.ShortMessage.getData2(this.data);
};

MIDI.ShortMessage.prototype.setCommand = function(command) {
    // PROGRAM_CHANGE and CHANNEL_PRESSURE only have one data byte and there's no good way of sending only so
    // many bytes from the array, so we'll "resize" the array here instead of making send() or the user worry
    // about it.
    // Uint8Array.length is also read-only, so we make a new one.
    // var msgLen = (command === MIDI.Status.PROGRAM_CHANGE || command === MIDI.Status.CHANNEL_PRESSURE) ? 2 : 3;
    var msgLen = 1 + getDataLength(command);
    if (msgLen !== this.data.length) {
        this.data = new Uint8Array(msgLen);
    }
    // this.data[0] = (this.data[0] & 0x0F) | ((command & 0x0F) << 4);
    // The constants use the upper nibble, so let's not shift things.
    this.data[0] = (this.data[0] & 0x0F) | (command & 0xF0);
};

MIDI.ShortMessage.prototype.setChannel = function(channel) {
    this.data[0] = (this.data[0] & 0xF0) | (channel & 0x0F);
};

MIDI.ShortMessage.prototype.setData = function(data1, data2) {
    if (typeof data1 !== 'undefined') {
        this.data[1] = data1;
    }
    if (typeof data2 !== 'undefined') {
        this.data[2] = data2;
    }
};

MIDI.ShortMessage.prototype.setData1 = function(data1) {
    this.data[1] = data1;
};

MIDI.ShortMessage.prototype.setData2 = function(data2) {
    this.data[2] = data2;
};

MIDI.ShortMessage.getCommand = function(data) {
    // return ((data[0] & 0xF0) >> 4);
    // The constants use the upper nibble, so let's not shift things.
    return (data[0] & 0xF0);
};

MIDI.ShortMessage.getChannel = function(data) {
    return (data[0] & 0x0F);
};

MIDI.ShortMessage.getData1 = function(data) {
    return (data[1]);
};

MIDI.ShortMessage.getData2 = function(data) {
    return (data[2]);
};

MIDI.ShortMessage.parse = function (bytes, status) {
    var command = status & 0xF0;
    var channel = status & 0x0F;
    switch (getDataLength(command)) {
        case 0:
            return new MIDI.ShortMessage(command, channel);
        case 1:
            return new MIDI.ShortMessage(command, channel, bytes[bytes.position++]);
        case 2:
            /* fall through */
        default:
            return new MIDI.ShortMessage(command, channel, bytes[bytes.position++], bytes[bytes.position++]);
    }
    return null;
};

/**** MetaMessage ****/

MIDI.MetaMessage = function (type, data, length) {
    // Don't call the superconstructor. Just make everything here:
    this.setMessage(type, data, length);
//		MIDI.Message.call(this, new Uint8Array(length + 2));
//		this.data[0] = MIDI.Status.META;
//		this.data[1] = type;
};

MIDI.MetaMessage.prototype = Object.create(MIDI.Message.prototype);
MIDI.MetaMessage.prototype.constructor = MIDI.MetaMessage;
MIDI.MetaMessage.prototype.parent = MIDI.Message.prototype;

MIDI.MetaMessage.prototype.getType = function () {
    return this.data[1];
};

MIDI.MetaMessage.prototype.setMessage = function (type, data, length, offset) {
    length = length || (data && data.length) || 0;
    if (length > 0 && !(Array.isArray(data) || (data && data.buffer instanceof ArrayBuffer) || (typeof data === 'string'))) {
        throw new Error("Message must be set with a valid data array.");
    }
    // Get the VarInt for length and use the length of the VarInt in computing the length of the Uint8Array
    var lengthLength = 0;
    var lengthValue = length;
    do {
        lengthValue = lengthValue >>> 7;
        lengthLength++;
    } while (lengthValue > 0);

    offset = offset || 0;
    this.length = 2 + lengthLength + length;
    this.data = new Uint8Array(this.length);
    this.data[0] = MIDI.Status.META;
    this.data[1] = type;
    var di = 1 + lengthLength;

    lengthValue = length;
    var buffer = lengthValue & 0x7F;

    while ((lengthValue >>= 7) > 0) {
        buffer <<= 8;
        buffer |= ((lengthValue & 0x7F) | 0x80);
    }

    while (true) {
        this.data[di++] = buffer & 0xFF;
        if (buffer & 0x80) {
            buffer >>>= 8;
        }
        else {
            break;
        }
    }

    if (typeof data === 'string') {
        for (var i = 0; i < length; i++) {
            this.data[di + i] = data.charCodeAt(i);
        }
    }
    else if (data) {
        for (var i = 0; i < length; i++) {
            this.data[di + i] = data[offset + i];
        }
    }
};

MIDI.MetaMessage.parse = function (bytes, status) {
    if (status === MIDI.Status.META) {
        var type = bytes[bytes.position++];
        var length = readVariableLengthInt(bytes);
        // var message = new MIDI.MetaMessage(type, bytes.subarray(bytes.position, bytes.position + length));
        var message = new MIDI.MetaMessage(type, bytes.slice(bytes.position, bytes.position + length));
        // console.log("Parsed meta message: " + type.toString(16) + " - " + length + ": " + Array.prototype.map.call(bytes.slice(bytes.position, bytes.position + length + 1), (x => String.fromCharCode(x))).join());
        bytes.position += length;
        return message;
    }
    return null;
};

MIDI.MetaMessage.Type = Object.freeze({
    SEQUENCE_NUMBER: 0x00,
    TEXT: 0x01,
    COPYRIGHT: 0x02,
    TRACK_NAME: 0x03,
    INSTRUMENT_NAME: 0x04,
    LYRICS: 0x05,
    MARKER: 0x06,
    CUE_POINT: 0x07,
    CHANNEL_PREFIX: 0x20,
    END_OF_TRACK: 0x2F,
    TEMPO: 0x51,
    SMPTE_OFFSET: 0x54,
    TIME_SIGNATURE: 0x58,
    KEY_SIGNATURE: 0x59,
    SEQUENCER_SPECIFIC: 0x7F
});

/**** SysexMessage ****/

MIDI.SysexMessage = function (data, length) {
    this.setMessage(data, length);
};

MIDI.SysexMessage.prototype = Object.create(MIDI.Message.prototype);
MIDI.SysexMessage.prototype.constructor = MIDI.SysexMessage;
MIDI.SysexMessage.prototype.parent = MIDI.Message.prototype;

MIDI.SysexMessage.prototype.setMessage = function (data, length, offset) {
    length = length || data.length || 0;
    if (length > 0 && !(Array.isArray(data) || (data && data.buffer instanceof ArrayBuffer) || (typeof data === 'string'))) {
        throw new Error("Message must be set with a valid data array.");
    }
    // Get the VarInt for length and use the length of the VarInt in computing the length of the Uint8Array
    var lengthLength = 0;
    var lengthValue = length;
    do {
        lengthValue = lengthValue >> 7;
        lengthLength++;
    } while (lengthValue > 0);

    offset = offset || 0;
    this.length = 1 + lengthLength + length;
    this.data = new Uint8Array(this.length);
    this.data[0] = MIDI.Status.SYSTEM_EXCLUSIVE;
    var di = 1 + lengthLength;

    lengthValue = length;
    var buffer = lengthValue & 0x7F;

    while ((lengthValue >>= 7) > 0) {
        buffer <<= 8;
        buffer |= ((lengthValue & 0x7F) | 0x80);
    }

    while (true) {
        this.data[di++] = buffer & 0xFF;
        if (buffer & 0x80) {
            buffer >>>= 8;
        }
        else {
            break;
        }
    }

    if (typeof data === 'string') {
        for (var i = 0; i < length; i++) {
            this.data[di + i] = data.charCodeAt(i);
        }
    }
    else if (data) {
        for (var i = 0; i < length; i++) {
            this.data[di + i] = data[offset + i];
        }
    }
};

/**** Static convenience methods ****/

MIDI.Message.getStatus = function(data) {
    return data[0];
};

MIDI.noteOn = function(channel, note, velocity) {
    if (typeof note === 'string') {
        note = MusicUtil.nameToNote(note);
    }
    return new MIDI.ShortMessage(MIDI.Status.NOTE_ON, channel, note, velocity || 100);
};

MIDI.noteOff = function(channel, note) {
    if (typeof note === 'string') {
        note = MusicUtil.nameToNote(note);
    }
    return new MIDI.ShortMessage(MIDI.Status.NOTE_OFF, channel, note, 0);
};

// Utilities from android-midi-lib
MIDI.ticksToMs = function (ticks, mpqn, resolution) {
    return ((ticks * mpqn) / resolution) / 1000;
};

MIDI.msToTicks = function (ms, mpqn, ppq) {
    return ((ms * 1000.0) * ppq) / mpqn;
};

MIDI.bpmToMpqn = function (bpm) {
    // return ~~(bpm * 60000000);
    return ~~(60000000 / bpm);
};

MIDI.mpqnToBpm = function (mpqn) {
    // return mpqn / 60000000.0;
    return 60000000.0 / mpqn;
};

module.exports = MIDI;