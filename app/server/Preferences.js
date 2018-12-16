'use strict';

const app = require('electron').app;
const fs = require("fs");

const singleton = Symbol();
const sharedEnforcer = Symbol();
const DFLT_FILE = "/preferences.json";
module.exports.Preferences = class Preferences {
  constructor(enforcer) {
    if (enforcer !== sharedEnforcer) {
      throw "Cannot construct a singleton Preferences.";
    }
    this.preferences = {};
    this.autoSave = true;
  }
  
  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new Preferences(sharedEnforcer);
    }
    return this[singleton];
  }
  
  set(prefs, value) {
    if (typeof prefs === 'object') {
      Object.assign(this.preferences, prefs);
    }
    else if (typeof prefs === 'string' && arguments.length > 1) {
      if (typeof value === 'undefined') {
        delete this.preferences[prefs];
      }
      else {
        this.preferences[prefs] = value;
      }
    }
//    if (this.autoSave) {
//      this.save();
//    }
  }
  
  setDefault(prefs, value) {
    if (typeof prefs === 'object') {
      for (let p in prefs) {
        if (!this.preferences.hasOwnProperty(p)) {
          this.preferences[p] = prefs[p];
        }
      }
    }
    else if (typeof prefs === 'string' && arguments.length > 1) {
      if (typeof value === 'undefined') {
        delete this.preferences[prefs];
      }
      else {
        this.preferences[prefs] = value;
      }
    }
//    if (this.autoSave) {
//      this.save();
//    }
  }
  
  clear() {
    this.preferences = {};
  }
  
  save() {
    // require("electron-json-storage").set(PREFERENCES_KEY, PREFERENCES, function (error) {
    delete this.preferences.loadedPreferences;
    console.log(this.preferences.preferencesFile || (app.getPath("userData") + DFLT_FILE));
    fs.writeFile(this.preferences.preferencesFile || (app.getPath("userData") + DFLT_FILE), JSON.stringify(this.preferences), "utf8", (error) => {
      if (error) {
        console.log("Error writing preferences: ", error);
      }
      else {
        console.log("Preferences saved.");
      }
    });
  }
  
  load(path) {
    return new Promise((resolve, reject) => {
      let prefPath = path || this.preferences.preferencesFile || (app.getPath("userData") + DFLT_FILE);
      // let that = this;
      fs.exists(prefPath, (exists) => {
        if (exists) {
          fs.readFile(prefPath, "utf8", (err, data) => {
            if (err) {
              return reject(err);
            }
            if (data.length > 0) {
              data = data.replace(/^\uFEFF/, '');
              data = data.toString().trim();
              this.set(JSON.parse(data));
              console.log("Loaded preferences.");
            }
            resolve(this.preferences);
          });
        }
        else {
          resolve(this.preferences);
        }
      });
    });
  }
  /*
  load(path, callback) {
    let prefPath = path || this.preferences.preferencesFile || (app.getPath("userData") + DFLT_FILE);
    // let that = this;
    fs.exists(prefPath, (exists) => {
      if (exists) {
        fs.readFile(prefPath, "utf8", (err, data) => {
          if (err) {
            throw err;
          }
          if (data.length > 0) {
            data = data.replace(/^\uFEFF/, '');
            data = data.toString().trim();
            this.set(JSON.parse(data));
            console.log("Loaded preferences.");
          }
          if (typeof callback === 'function') {
            callback.apply(this);
          }
        });
      }
    });
  }
  */
};

