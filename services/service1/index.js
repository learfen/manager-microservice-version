var express = require('express');
var app = express();
var fs = require("fs")
// tenes que usar el mismo puerto que vas a 

let env = fs.readFileSync("./app/env.json")
app.get("/", function(){
	res.send('<h3>Soy otro servicio</h3>')
})
app.listen(3001, function () {

	console.log('APP launch in 3001!');

});