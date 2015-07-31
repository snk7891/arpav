var $CONFIG = {
  serverPort : 8999,
  staticContentPath : "static",
  meteogrammaPadova: 10,
  bollettinoid: "MV"
};

// External modules
var express = require('express');
var app = express();
var fs = require("fs");
var moment = require("moment");
moment.locale('it');

var forecasts = require("./forecasts");

console.log("Server starting");

var app = express();
app.use(express.static(__dirname + '/' + $CONFIG.staticContentPath));

function buildPrevisione(fcasts, pdata) {
  if(fcasts && fcasts.previsioni && fcasts.previsioni.meteogrammi && fcasts.previsioni.meteogrammi.meteogramma) {
    var index = -1, mgramma = fcasts.previsioni.meteogrammi.meteogramma;
    for(var i = 0; i < mgramma.length; i++)
      if(mgramma[i].zoneid == $CONFIG.meteogrammaPadova)
        index = i;
    
    if(index < 0)
      return null;
      
    var indexData = -1, prev = mgramma[index].scadenza;
    for(i = 0; i < prev.length; i++)
      if(prev[i].data.trim() == pdata)
        indexData = i;
        
    if(indexData < 0)
      return null;
        
    var ref = prev[indexData].previsione;
    var toRet = {};
    for(i = 0; i < ref.length; i++) {
      if(ref[i].title == "Simbolo")
        toRet.simbolo = ref[i].value;
      if(ref[i].title == "Cielo")
        toRet.cielo = ref[i].value;
      if(ref[i].title == "Temperatura")
        toRet.temperatura = ref[i].value;
      if(ref[i].title == "Precipitazioni")
        toRet.precipitazioni = ref[i].value;
      if(ref[i].title == "Probabilita' precipitazione")
        toRet.probabilita = ref[i].value;
      if(ref[i].title == "Attendibilita'")
        toRet.attendibilita = ref[i].value;
    } // for
    toRet.data = pdata;
    
    return toRet;
    
  } else
    return null;
} // buildPrevisione

function buildBollettino(fcasts, pdata) {
  if(fcasts && fcasts.previsioni && fcasts.previsioni.bollettini && fcasts.previsioni.bollettini.bollettino) {
    
    var index = -1, bollettino = fcasts.previsioni.bollettini.bollettino;
    for(var i = 0; i < bollettino.length; i++)
      if(bollettino[i].bollettinoid == $CONFIG.bollettinoid)
        index = i;
        
    if(index < 0)
      return null;
      
    return bollettino[index].evoluzionegenerale;
  } // if
}

function buildHTML(fcasts, done) {
  
  fs.readFile($CONFIG.staticContentPath + "/template.html", {"encoding": "utf8"}, function(err, data) {
    
    if(err) {
      done(err);
      return;
    } // if
    
    var dataRef = moment().format("D MMMM");
    
    var input = buildPrevisione(fcasts, dataRef + " " + (moment().hours() < 12 ? "mattina" : "pomeriggio"));
    
    var output = data;
    for(var i in input)
      output = output.replace("%" + i, input[i]);
      
    var bollettino = buildBollettino(fcasts, dataRef);
    output = output.replace("%previsione", bollettino);
      
    fs.writeFile($CONFIG.staticContentPath + "/index.html", output, function(err, data) {
      done(err, data);
    });
  });
  
  
} // buildHTML

app.get("/update", function(req, res) {
  
  forecasts.get(function(err, fcasts) {
  
    if(err) {
      console.log("Error: " + err);
      res.sendStatus(500);
      return;
    } // if
    
    buildHTML(fcasts, function(err2) {
      if(err2) {
        console.log("Error: " + err2);
        res.sendStatus(500);
        return;
      } // if
      
      res.sendStatus(200);
    });
  });
});

app.listen($CONFIG.serverPort);
console.info("Server listening on port " + $CONFIG.serverPort);