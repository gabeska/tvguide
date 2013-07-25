var request = require('superagent');
var mongoose = require('mongoose');


var at = 'http://atlas.metabroadcast.com/3.0/schedule.json'

mongoose.connect("mongodb://localhost/myguide");

//todo: move these to a central file!
var ProgrammeSchema = new mongoose.Schema({
	category:{type:String, index:true},
	title: {type:String,index:true},
	start: {type:Date,index:true},
	stop: Date,
	channel: {type:String,index:true},
	desc: String,
	show: Boolean,
	uri: String,
	source: String

});

var HiddenProgrammeSchema = new mongoose.Schema({
	title:String
});
var HiddenProgramme = mongoose.model("hiddenprogrammes", HiddenProgrammeSchema);


//ProgrammeSchema.methods.log = function () {
//		console.log(this.title,this.desc,this.channel);
//}

/* 
	Programmes have multiple genres and subgenres (or no genres at all?)
	There seems to be at least 1 Atlas genre, of the form:
	http://ref.atlasapi.org/genres/atlas/news
	
	There are also multiple BBC genres, of the form:
	http://www.bbc.co.uk/programmes/genres/factual/money
	http://www.bbc.co.uk/programmes/genres/factual/lifestories
	http://www.bbc.co.uk/programmes/genres/factual
	
	All BBC genres can be found at: http://www.bbc.co.uk/programmes/genres(.json)
	
	let's start by using the first Atlas genre we find.
	*/
	
var extractGenres = function(genres) {
	// for the first version, just return a string containing the first Atlas genre, or 'Unknown'
	genre='Unknown';
	
	if (genres.length===0) {
		return genre;
	}
	
	var atlasGenre='http://ref.atlasapi.org/genres/atlas/'
	//console.log(genres);
	for (var i=0; i<genres.length;i++) {
		//console.log(genres[i]);
		if (genres[i].indexOf(atlasGenre)==0) {
			genre=genres[i].replace(/.*\//, '');
			// capitalize genre
					
			genre= genre.charAt(0).toUpperCase()+genre.slice(1);
			//console.log('atlas genre: '+genre);
			return genre;
		}
		
	}
	//console.log('no atlas genre found'); // todo: how often does this happen?
	
	return genre;
	
};
	


var Programme = mongoose.model("Programme", ProgrammeSchema);
//Programme.on('error', handleError);
var schedule={};


var clearProgrammes = function() {
	Programme.remove({source:"Atlas"}, function(err){
		if(!err) {
			console.log('programmes cleared')
		} else {
			console.log('error: '+err);
		}
	});

};


var getWeeklySchedule = function(channelName) {
	var channels={'BBC 1':'cbbh','BBC 2':'cbbG','BBC 3':'cbbP','BBC 4':'cbbQ'};
	addChannel(channelName);
	
	request 
	.get(at) //NB doesn't work in node REPL (thinks .get is a keyword)
	.query({from:'now'})
	.query({to:'now.plus.168h'})
	.query({publisher:'bbc.co.uk'})
	.query({annotations:'description,broadcasts,brand_summary,series_summary,extended_description'})
	.query({channel_id:channels[channelName]})
	.end(function(res) {
	
		var retobject = res.body.schedule[0];
		//console.log (retobject);
		//console.log(res.type);
		//console.log('status: '+res.status);
		schedule=retobject.items;
	
		var programmes=[];
		schedule.forEach(function(item) {
			var title=item.title;
			if (item.container) {
				title=item.container.title;
				//console.log('container title: '+item.container.title);
			}
				//console.log('item title: '+item.title);	
				//console.log('broadcast start: '+item.broadcasts[0].transmission_time);
				//console.log('broadcast stop: '+item.broadcasts[0].transmission_end_time);
				//console.log('description: '+item.description);	
				
				var genre="Atlas";
				var BBCgenres=[];
				//console.log('------');
				//console.log('genres for programme: '+title);
				if (item.genres) {
					/*
					if(item.genres[0]){
						genre=item.genres[0].replace(/.*\//, '');
					}
					console.log('-------');

					for (var genre in item.genres)
					{
						console.log(item.genres[genre]);
						BBCgenres.push(item.genres[genre].replace(/.*\//, ''));	 
					};*/
					genre=extractGenres(item.genres);
					
				}
				//console.log('genre: '+genre);	
		
				//console.log('---------');
				var startTime = new Date(item.broadcasts[0].transmission_time);
				var stopTime = new Date(item.broadcasts[0].transmission_end_time);
		
				var uri='';
				if (item.uri) {
					uri=item.uri;
				}
		
				//var genre="Atlas"; // todo map atlas genres to XMLtv genres somewhere
				//	var hiddenprogramme = new HiddenProgramme({title:req.body.title});
				var programme = new Programme({
											category:genre, 
											title:title, 
											start:startTime,
											stop:stopTime,
											channel:channelName,
											desc:item.description,
											show:true,
											uri:uri,
											source:"Atlas"});
		
				//console.log('pre-save');
				
				programme.save(function (err,p) {
					//console.log('save callback');
					if(err) {
						console.log('error in save');
						console.log(err);	
					} else {
						//console.log('saved: '+p);
					}
				});
			
		
		}); // forEach
		hideProgrammes();
		console.log('update ready for '+ channelName);
	});
};

var ChannelSchema = new mongoose.Schema({
	iconURL:String,
	name:String,
	source:String,
	id:String
});
var Channels = mongoose.model("channels",ChannelSchema);


var clearChannels = function() {
	Channels.remove({source:"Atlas"}, function(err){
		if(!err) {
			console.log('channels cleared')
		} else {
			console.log('error: '+err);
		}
	});

};

var addChannel=function(channelName) {
	var channel = new Channels({
		iconURL:'',
		name:channelName,
		source:"Atlas",
		id:'42'
		});
	channel.save(function (err,p) {
	//console.log('save callback');
	if(err) {
			console.log('error in save');
			console.log(err);	
		} else {
				//console.log('saved: '+p);
		}
	});
	
	
};
var hideProgrammes = function () {
	console.log('hideprogrammes');
	
	var progTitles=[];
	HiddenProgramme.find({},'title').exec(function(err,progs) {
		for (var i=0;i<progs.length;i++) {
			progTitles.push(progs[i].title);
		}
		//console.dir(progTitles);

		Programme.update({title:{$in: progTitles}},{show:false},{multi:true}, function (err, numberAffected, raw) {
			if (err) return handleError(err);
			console.log('The number of updated documents was %d', numberAffected);
			console.log('The raw response from Mongo was ', raw);
		});
	});

};

// todo: use async library
console.log('start');

clearChannels();
clearProgrammes();
getWeeklySchedule('BBC 1');
getWeeklySchedule('BBC 2');
getWeeklySchedule('BBC 3');
getWeeklySchedule('BBC 4');
//hideProgrammes(); // doesn't work here (async), moved to callback

console.log('end');


