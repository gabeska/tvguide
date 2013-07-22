var request = require('superagent');
var mongoose = require('mongoose');


var at = 'http://atlas.metabroadcast.com/3.0/schedule.json'

mongoose.connect("mongodb://localhost/myguide");


var ProgrammeSchema = new mongoose.Schema({
	category:{type:String, index:true},
	title: {type:String,index:true},
	start: {type:Date,index:true},
	stop: Date,
	channel: {type:String,index:true},
	desc: String,
	show: Boolean,
	source: String

});
//ProgrammeSchema.methods.log = function () {
//		console.log(this.title,this.desc,this.channel);
//}

var Programme = mongoose.model("Programme", ProgrammeSchema);
//Programme.on('error', handleError);
var schedule={};
var getWeeklySchedule = function(channelName) {
	var channels={'BBC 1':'cbbh','BBC 2':'cbbG','BBC 3':'cbbP','BBC 4':'cbbQ'};
	
	
	request 
	.get(at) //NB doesn't work in node REPL (thinks .get is a keyword)
	.query({from:'now'})
	.query({to:'now.plus.124h'})
	.query({publisher:'bbc.co.uk'})
	.query({annotations:'description,broadcasts,brand_summary,series_summary,extended_description'})
	.query({channel_id:channels[channelName]})
	.end(function(res) {
	
		var retobject = res.body.schedule[0];
		console.log (retobject);
		console.log(res.type);
		console.log('status: '+res.status);
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
				
				if (item.genres) {
					if(item.genres[0]){
						genre=item.genres[0].replace(/.*\//, '');
					}
				}
				//console.log('genre: '+genre);	
		
				//console.log('---------');
				var startTime = new Date(item.broadcasts[0].transmission_time);
				var stopTime = new Date(item.broadcasts[0].transmission_end_time);
		
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
		console.log('update ready for '+ channelName);
	});
};
getWeeklySchedule('BBC 1');
getWeeklySchedule('BBC 2');
getWeeklySchedule('BBC 3');
getWeeklySchedule('BBC 4');

// todo: update 'show' for programmes to should be hidden



