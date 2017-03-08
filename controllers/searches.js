// global variables & requires
var express = require('express');
var request = require('request');
var apiHeaders = {
			'X-Mashape-Key': process.env.mashapeKey,
			'Accept': 'application/json',
		};
var igdbURL = 'https://igdbcom-internet-game-database-v1.p.mashape.com/games/'
var db = require('../models');

var router = express.Router();

// routes 

// /GET, landing view
router.get('/', function(req, res) {
	res.render('search');
});

router.get('/game', function(req, res) {
	var s = req.query.search;
	request({ 
		headers: apiHeaders,
		url: igdbURL,
		qs: {
			fields: 'name,cover',
			search: s
		}
	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var gameData = JSON.parse(body);
			//console.log(gameData);				//debug code
			//res.send(gameData);					//debug code
			res.render('game', {gameData: gameData});
		} else {
			res.redirect('/search');

		}
	});
});

// /GET, view game details
router.get('/game/:id', function(req, res) {
	var gameId = req.params.id;
	request({
		headers: apiHeaders,
		url: igdbURL + gameId,
		qs: {
			fields: 'name,cover,screenshots,summary'
		}
	}, function(error, response, body) {
		if(!error && response.statusCode == 200) {
			var gameData = JSON.parse(body);
			console.log(gameData);					//debug code
			res.render('gameDescription', {gameData: gameData});			
		} else {
			res.redirect('/search');
		}
	})
});


router.post('/add', function(req, res) {
	var currentUser = req.user;
	var gameId = req.body.gameId;

	if (currentUser) {
		db.user.find({
			where: {username: currentUser.username}
		})
		.then(function(user) {
			request({
				headers: apiHeaders,
				url: igdbURL + gameId,
				qs: {
					fields: 'name,cover'
				}
			}, function(error, response, body) {
				if(!error && response.statusCode == 200) {
					var gameData = JSON.parse(body)[0];
					// res.send(gameData);				//debug code
					user.createGame({
						title: gameData.name,
						cover: gameData.cover.cloudinary_id,
						igdbId: gameData.id,
						userId: user.id
					})
					.then(function(game) {
						res.status(200);
					})
				} else {
					res.redirect('/search');
				}
			})
			
		})
	}

})

// export
module.exports = router;