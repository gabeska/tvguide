
/**
 * Module dependencies.
 */

var express = require('express'),
  http = require('http'),
  mongoose = require('mongoose'),
  fs=require('fs'),
  path = require('path'),
  dreambox = require('./dreambox');

var app = express();

mongoose.connect("mongodb://localhost/myguide");

var ProgrammeSchema = new mongoose.Schema({
	category:String,
	title: String,
	start: Date,
	stop: Date,
	channel: String,
	desc: String,
	show: Boolean

});
//ProgrammeSchema.methods.log = function () {
//		console.log(this.title,this.desc,this.channel);
//}

var Programmes = mongoose.model("programmes", ProgrammeSchema);

var ChannelSchema = new mongoose.Schema({
	iconURL:String,
	name:String,
	id:String
});
var Channels = mongoose.model("channels",ChannelSchema);

var GenreSchema = new mongoose.Schema({
	genre:String
});
var Genres = mongoose.model("genres", GenreSchema);

var HiddenProgrammeSchema = new mongoose.Schema({
	title:String
});
var HiddenProgramme = mongoose.model("hiddenprogrammes", HiddenProgrammeSchema);

var QuerySchema = new mongoose.Schema({
    queryName: String,
    selector: String,
    sortNr: Number,
    querySortOrder: String

});

var Query = mongoose.model('queries', QuerySchema);

// all environments
app.set('port', process.env.PORT || 4000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.compress());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'front')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res) {
    fs.readFile(__dirname + '/front/index.html', 'utf8', function(err, text){
        res.send(text);
    });
});
app.get('/api', function(req, res) {
	var page="<h1>API functions</h1><ul><li>/programmes - get all programmes</li><li>/programmes/channel/name "+
"- get progs for channel name</li><li>/programmes/genre/name - get programmes in genre name</li>";
	res.send(page);
});

app.get('/oneprog', function(req,res) {
	return Programmes.findOne({channel:"BBC 2"},function(err,progs) {
		if(err) console.log(err);
		res.json(progs);
	});
});


app.get( '/programmes', function( request, response ) {
	var now=new Date();
	var future={stop:{$gt:now},show:true};
	return Programmes.find(future,function( err, progs ) {
		if( !err ) {
			return response.send( progs );
		} else {
			return console.log( err );
		}
	});
});



app.get( '/programmes/channel/:channel', function( request, response ) {
	return Programmes.find({channel:request.params.channel},{},{sort:{"title":1}}, function( err, progs ) {
		if( !err ) {
			return response.send( progs );
		} else {
			return console.log( err );
		}
	});
});

app.get( '/programmes/channels/:channels', function( request, response ) {

	var channels=request.params.channels.split(','); // NB: gaat niet goed met spaties na kommas?
	return Programmes.find({channel:{$in:channels}},{},{sort:{"title":1}}, function( err, progs ) {
		if( !err ) {
			return response.send( progs );
		} else {
			return console.log( err );
		}
	});
});


app.get( '/programmes/genre/:genre', function( request, response ) {
	return Programmes.find({category:request.params.genre},{},{sort:{"title":1}}, function( err, progs ) {
		if( !err ) {
			return response.send( progs );
		} else {
			return console.log( err );
		}
	});
});

app.get( '/programmes/genres/:genres', function( request, response ) {
	var genres=request.params.genres.split(',');
	return Programmes.find({category:{$in:genres}},{},{sort:{"title":1}}, function( err, progs ) {
		if( !err ) {
			return response.send( progs );
		} else {
			return console.log( err );
		}
	});
});



app.get( '/programmes/find/:query', function( request, response ) {
	var query=JSON.parse(request.params.query);
	return Programmes.find(query,{},{sort:{"title":1}}, function( err, progs ) {
		if( !err ) {
			return response.send( progs );
		} else {
			return console.log( err );
		}
	});
});

//todo: add recording to database en show status
app.post('/recordprogramme', function( req, res ) {
	var b=req.body;
	var p = {
		title: b.title,
		start: b.start,
		stop: b.stop,
		channel: b.channel,
		desc: b.desc
		
	};
	
		
	var cb = function(err,result) {
		console.log('addtimer callback');
		if(err) {
			console.log('error adding timer: '+err);
			res.status(400).end(err);
		} else {
			console.log('result: '+result);
			
			if (result.result==true) {
				res.status(201).end(result.message);
			} else {
				res.status(409).end(result.message);
			}
		}
	}
	
	
	dreambox.addTimer(p.channel,p.start,p.stop, p.title, p.desc,cb);
	
	//todo: add programme to recordings collection (retrieve from db to avoid syncing problems?) 
	//and show recordings somewhere
});

app.post('/hideprogramme', function( req, res) {
	var hiddenprogramme = new HiddenProgramme({title:req.body.title});
	hiddenprogramme.save( function(err) {
		if (!err) {
			console.log('adding prog '+hiddenprogramme.title+' to list of crap');
			// query draaien om overige progs in db ook te hiden (ook in updatescript!)
			var query = { title: hiddenprogramme.title };
			Programmes.update(query,{show:false},{multi:true}, function (err, numberAffected, raw) {
				if (err) return handleError(err);
				console.log('The number of updated documents was %d', numberAffected);
				//console.log('The raw response from Mongo was ', raw);
			});
		} else {
			return console.log(err);
		}
	});
	return res.send(hiddenprogramme); // moet dit zo?
	// todo: nodig om te checken op meerdere keren toevoegen (of title voor HiddenProgrammes uniek maken)?
});

app.post('/unhideprogramme', function( req, res) {
	console.log('supposed to remove '+req.body.title);
	HiddenProgramme.findOneAndRemove({title:req.body.title}, function(err,hiddenprogramme) {
		if (!err) {
			console.log('removed prog '+hiddenprogramme.title+' from list of crap');
			var query = { title: hiddenprogramme.title };
			Programmes.update(query,{show:true},{multi:true}, function (err, numberAffected, raw) {
				if (err) return handleError(err);
				console.log('The number of updated documents was %d', numberAffected);
				console.log('The raw response from Mongo was ', raw);
				return res.send(hiddenprogramme); // todo: waarom hier returnen?
			});
		} else {
			return console.log(err);
		}
	});
});

app.get('/channelsold', function(req, res){
	Programmes.distinct('channel',function (err, result) {
			if (err) return handleError(err);
			res.json(result);
		});
});

app.get('/channels', function(req, res) {
	return Channels.find( function( err,channels) {
		if(!err) {
			return res.send(channels);
		} else {
			return console.log(err);
		}
	});
});

app.get('/genres', function(req, res){
	Programmes.distinct('category',function (err, result) {
			if (err) return handleError(err);
			res.json(result);
		});
});


app.get('/queries', function(req, res) {
    return Query.find( function( err, queries) {
        if(!err) {
            return res.send(queries);
        } else {
            return console.log(err);
        }
    });
});

app.post('/addquery', function( req, res) {
    // add a new query or modify an existing one, based on the name
    var b=req.body;
    Query.findOneAndUpdate({queryName:b.queryName},{selector:b.selector}, {upsert:true},function(err, query) {
        if (!err) {
            console.log('added query '+query.queryName);
            return res.send(query);
        } else {
            res.end(err);
            return console.log(err);
        }
    });
});

app.post('/deletequery', function ( req, res) {
    var b=req.body;
	console.log('supposed to remove '+req.body.queryName);
    Query.findOneAndRemove({queryName:b.queryName}, function (err, query) {
        if (!err) {
            console.log('removed query: '+query.queryName);
            return res.send(query);
        } else {
            res.end(err);
            return console.log(err);
        }
    } );
    });



    // init dreambox PVR
dreambox.readChannelMap('channels.txt');


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

