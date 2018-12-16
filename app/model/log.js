var winston = require('winston');

var logger = new (winston.Logger)({
  transports: [ 
//    new (winston.transports.Console)({ 
//      level: "debug",
//      timestamp: true, 
//      prettyPrint: true,
//      colorize: true,
//      silent: false,
//    }),
    new winston.transports.File({ 
      filename: __dirname + '/debug.log', 
      json: false 
    })
  ],
//exceptionHandlers: [
    /* PT: 07-26-2015 - This is what was absorbing the unexplained "undefined" exceptions,
     * so I'm commenting it out. I still don't know what's causing the exceptions, but
     * whatever it is, this formatting of its output didn't provide any useful information.
     */ 
//   new (winston.transports.Console)({ 
//      formatter: function(options) {
//        options = options.meta;
//        var date = options.date;
//        var time = date.substring(date.indexOf(":")-2,date.indexOf(":")+6);
//        var description = "\n\nException raised at time " + time + "\n\n";
//        console.log(options.stack);
//        if (typeof options.stack !== 'undefined' && options.stack.hasOwnProperty("length")) {
//          for (var i = 0; i < options.stack.length; i++) {
//            description += options.stack[i] + "\n";
//          }
//        }
//        else {
//          description += options.stack + "\n";
//        }
//        return description;
//      },
//    colorize: true 
//  }),
  // TODO: Register ipc handler here so that log messages are forward to the panel logger. 
  // new winston.transports.File({ filename: __dirname + '/exceptions.log', json: false, prettyPrint: true, colorize:true  })
//],
  exitOnError: false
});

module.exports = logger;
