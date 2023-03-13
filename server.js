const express = require("express");
const bodyParser = require("body-parser");
const Datastore = require("nedb");

const { nedbExt } = require(__dirname + "/neDB_ext.js");

const app = express();
app.use(bodyParser.json());

const db = new nedbExt(Datastore);
db.addCollection("places", __dirname + "/db/places.txt");

db.init(() => {
  const server = app.listen(process.env.PORT || 52978, function() {
    console.log("Trains! started");
  });
});

app.get("/", (req,res) => {
  res.sendFile(__dirname + "/public/trains.html");
});

app.get("/map", (req,res) => {
  console.log(req.query)
  res.send("TEST")
});


app.use( express.static(__dirname + '/public') ); // at the end to prevent 404 errors