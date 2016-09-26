'use strict';

var express = require('express');
var fs = require('fs');
var gpio = require('pigpio').Gpio;
var jsonfile = require('jsonfile');

var app = express();
var colors = {};
var file = 'colors.json';
var pins = {
	red: 17,
	green: 22,
	blue: 24
};

// Load or create the LED state file
try {
	fs.accessSync(file, fs.F_OK);
} catch(e) {
	jsonfile.writeFileSync(file, {
		red: 255,
		green: 255,
		blue: 255,
		status: 'on'
	});
} finally {
	colors = jsonfile.readFileSync(file);
}

// Initialize GPIO
var leds = {
	red: {},
	green: {},
	blue: {}
};

leds.red = new gpio(pins.red, { mode: gpio.OUTPUT });
leds.green = new gpio(pins.green, { mode: gpio.OUTPUT });
leds.blue = new gpio(pins.blue, { mode: gpio.OUTPUT });

// Helper functions
function off() {
	colors.status = 'off';

	leds.red.pwmWrite(0);
	leds.green.pwmWrite(0);
	leds.blue.pwmWrite(0);

	jsonfile.writeFileSync(file, colors);
}

function on() {
	colors.status = 'on';

	leds.red.pwmWrite(colors.red);
	leds.green.pwmWrite(colors.green);
	leds.blue.pwmWrite(colors.blue);

	jsonfile.writeFileSync(file, colors);
}

function setColors(query) {
	if(query.hasOwnProperty('red') && !isNaN(parseInt(query.red)))
		colors.red = Math.abs(parseInt(query.red)) % 256;

	if(query.hasOwnProperty('green') && !isNaN(parseInt(query.green)))
		colors.green = Math.abs(parseInt(query.green)) % 256;

	if(query.hasOwnProperty('blue') && !isNaN(parseInt(query.blue)))
		colors.blue = Math.abs(parseInt(query.blue)) % 256;
}

// Start up

on();

// Server pages
app.get('/', (req, res) => {
	res.send(colors);
});

app.get('/off', (req, res) => {
	setColors(req.query);
	off();
	res.send(colors);
});

app.get('/on', (req, res) => {
	setColors(req.query);
	on();
	res.send(colors);
});

app.get('/toggle', (req, res) => {
	setColors(req.query);
	colors.status == 'on' ? off() : on();
	res.send(colors);
});

// Start up the server
app.listen(3000, () => {
	console.log('Listening on port 3000');
});
