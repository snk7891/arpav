var Download = require('download'),
    xml2js = require('xml2js'),
    fs = require("fs");

var $URL = "http://www.arpa.veneto.it/previsioni/it/xml/bollettino_utenti.xml";
var $TARGET_DIR = "forecasts";

function get(done) {
  var filename = "f_" + new Date().getTime() + ".xml";
  
  new Download({mode: '644'})
    .get($URL)
    .dest($TARGET_DIR)
    .rename(filename)
    .run(function(err, files) {
      
      if(err) {
        done(err, null);
        return;
      } // if
      
      console.log("Download completed");
      var parser = new xml2js.Parser({
        mergeAttrs: true,
        explicitArray: false
      });
      fs.readFile(__dirname + '/' + $TARGET_DIR + '/' + filename, function(err2, data) {
        if(err2) {
          done(err2, null);
          return;
        } // if
        
        parser.parseString(data, function (err3, result) {
          if(err3) {
            done(err3, null);
            return;
          } // if
          
          done(null, result);
        });
      });
      
    });
} // get
 
module.exports = {
  get: get
};
