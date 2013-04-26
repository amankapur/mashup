var YT = require('youtube-feeds');
var prettyprint = require( 'prettyprint' ).prettyprint;

exports.getvids = function(req, res){
	query = req.body.query;
	YT.feeds.videos( {q: query}, function(err,data){
		if (err) return console.log('error', err);
		// console.log(data.items[0].thumbnail);
		res.render('youtubevids', {videos: data});

	});

}