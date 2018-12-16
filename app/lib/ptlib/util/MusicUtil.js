/**
 * Provides constants and static convenience methods relating to musical values.
 * 
 * @author Peter Torpey
 * @version 2.0, May 2014
 */

'use strict';

var LOG2 = Math.log(2);

var mu = {
    A_FREQ: 440,
    A_MIDI: 69,
    NOTE_NAMES: ["C ", "C#", "D ", "D#", "E ", "F ", "F#", "G", "G#", "A ", "A#", "B"],
    SCALES: Object.freeze({
        "CHROMATIC": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        "DIATONIC_MAJOR": [0, 2, 4, 5, 7, 9, 11],
        "DIATONIC_NATURAL_MINOR": [0, 2, 3, 5, 7, 8, 10],
        "DIATONIC_HARMONIC_MINOR": [0, 2, 3, 5, 7, 8, 11],
        "DIATONIC_MELODIC_ASCENDING_MINOR": [0, 2, 3, 5, 7, 9, 11],
        "DIATONIC_MELODIC_DESCENDING_MINOR": [0, 2, 3, 5, 7, 8, 10],
        "HEXATONIC_WHOLE_TONE": [0, 2, 4, 6, 8, 10],
        "PENTATONIC_MAJOR": [0, 2, 4, 7, 9],
        "PENTATONIC_MINOR": [0, 3, 5, 7, 10],
        "OCTATONIC": [0, 2, 3, 5, 6, 8, 9, 11]
    }),
    CHORDS: Object.freeze({
        "MAJOR_TRIAD": [0, 4, 7],
        "MINOR_TRIAD": [0, 3, 7],
        "MAJOR_SIX": [0, 4, 7, 9],
        "MINOR_SIX": [0, 3, 7, 9],
        "MINOR_FLAT_SIX": [0, 3, 7, 8],
        "MAJOR_SEVEN": [0, 4, 7, 11],
        "MINOR_SEVEN": [0, 3, 7, 10],
        "PENTATONIC_MAJOR": [0, 2, 4, 7, 9],
        "PENTATONIC_MINOR": [0, 3, 5, 7, 10]
    }),
    PROGRESSIONS: Object.freeze({
        "POP": [],
        "CANON": [],
        "BLUES": [],
        "JAZZ": [],
        "RAGTIME": []
    }),
    TENSION_SORTED_INTERVALS: [0, 5, 7, 4, 8, 3, 9, 6, 2, 10, 1, 11]
};

mu.transpose = function (intervals, offset) {
    if (Array.isArray(intervals)) {
        return intervals.map(function (i) {return i + offset;});
    }
    else {
        return intervals + offset;
    }
};

// LATER: Change to not use spaces to separate note name and octave?
mu.noteToName = function(note) {
    return mu.NOTE_NAMES[note % 12] + " " + (~~(note / 12));
};

mu.nameToNote = function(name) {
    var parts = name.split(" ");
    var octave = parseInt(parts[1], 10);
    var noteIndex = 0;
    for (; noteIndex < mu.NOTE_NAMES.length; noteIndex++) {
        if (mu.NOTE_NAMES[noteIndex] === parts[0]) {
            break;
        }
    }

    return noteIndex + 12 * octave;
};

mu.nameToFreq = function(name) {
    return mu.noteToFreq(mu.nameToNote(name));
};

mu.freqToNote = function(freq) {
    return (Math.round(12 * Math.log(freq / mu.A_FREQ) / LOG2) >>> 0) + mu.A_MIDI;
};

mu.freqsToNotes = function (freqs) {
    if (Array.isArray(freqs)) {
        return freqs.map(mu.freqToNote);
    }
    else {
        return mu.freqToNote(freqs);
    }
};

mu.freqToPitchClass = function (freq) {
    return 9 + (Math.round(12 * Math.log(freq / mu.A_FREQ) / LOG2) >>> 0);
};

mu.freqsToPitchClasses = function (freqs) {
    if (Array.isArray(freqs)) {
        return freqs.map(mu.freqToPitchClass);
    }
    else {
        return mu.freqToPitchClass(freqs);
    }
};

mu.noteToPitchClass = function (note) {
    return note % 12;
};

mu.noteToFreq = function(note) {
    return mu.A_FREQ * Math.pow(2, ((note - mu.A_MIDI) / 12));
};

mu.notesToFreqs = function(notes) {
    if (Array.isArray(notes)) {
        return notes.map(mu.noteToFreq);
    }
    else {
        return mu.noteToFreq(notes);
    }
};

/**
 * @param note Optional.
 */
mu.freqToRatio = function(freq, note) {
    note = note || mu.freqToNote(freq);
    return 12 * Math.log(freq / mu.noteToFreq(note)) / LOG2;
};

/**
 * @param note Optional.
 */
mu.freqToCents = function(freq, note) {
    return ~~Math.round(100 * mu.freqToRatio(freq, note));
};

mu.freqToName = function(freq) {
    // double noteFrac = 12 * Math.log(freq / A_FREQ) / Math.log(2) + A_MIDI;
    // int note = (int)Math.round(noteFrac);
    // int cents = (int)Math.round((noteFrac - note) * 100);
    var note = mu.freqToNote(freq);
    var cents = mu.freqToCents(freq, note);
    return mu.noteToName(note) + ((cents >= 0) ? " +" : " ") + cents;
};

module.exports = Object.freeze(mu);
