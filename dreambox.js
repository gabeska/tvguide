var restler = require('restler'),
	fs = require('fs');


var address="http://192.168.178.33/";
var channelMap={}; // store channel names and dreambox service references (needed for recording/zap/etc)
var paddingBefore=180; //extra seconds before recording
var paddingAfter=240; //seconds after recording



var doRequest = function (verb, subject, callback) {
	var url=address+'api/'+verb;
	console.log('performing request: '+url);
	
	var options= {
		method:"get",
		headers: {'Content-type': 'application/json', 'Accept': 'application/json'}
	};
	
	restler.get(url,options).once('success', function(data,response) {
		var retrievedData=data.toString();
	
		console.log('dreambox request status: '+response.statusCode);
		var parsedData=JSON.parse(retrievedData);
		console.log(retrievedData);
		if(callback) {
			callback(parsedData);	
		}
		
	});
};


var setAddress = function (dbURL) {
	address=dbURL;
	console.log ('address changed to '+address);
};
var retrieveChannels = function() {
	console.log('retrieveChannels');
	doRequest("getallservices","",function(data) {
		for(var b = 0; b<data.services.length;b++) {
			var bouquet = data.services[b];
			//console.log('bouquet: '+bouquet.servicename);
			var channels=bouquet.subservices;
			for(var i = 0; i< channels.length; i++) {
				if(channels.indexOf(channels[i].servicename==-1)) {
					//console.log(channels[i].servicename+": refid= "+channels[i].servicereference);
					channelMap[channels[i].servicename]=channels[i].servicereference;
				}
			}
		}
		console.log('channels retrieved from Dreambox');
		//return channelMap;
		
	});
	
};
var getChannelMap = function() {
	return channelMap;
};
var saveChannelMap = function (outFileName) {
//formaat:
// tvgrabnlcode(standaard zelfde als dbcode) , servicename, servicereference
/*
  var cm = [
  	{"guideName":"BBC 4", "dreamboxName":"BBC 4/ Cbeebies", "servicereference":"5jhkjhjkghk4385u"},
	{},
	{},
  etc
  
  ];
*/
	var dreamboxNames=[];
	for (var channel in channelMap) {
		if(channelMap.hasOwnProperty(channel)) {
			dreamboxNames.push(channel);
		}
	}
	var newMap=[];
	for (var i=0;i<dreamboxNames.length;i++) {
		var dbName=dreamboxNames[i];
		newMap.push({"guideName":dbName, "dreamboxName":dbName, "servicereference":channelMap[dbName]});
	}
	
	fs.writeFileSync(outFileName,JSON.stringify(newMap,null,3 ));
	
}
var readChannelMap = function (inFileName) {
	var newMap = JSON.parse(fs.readFileSync(inFileName));
	channelMap={};
	
	for (var i=0; i< newMap.length; i++) {
		channelMap[newMap[i].guideName]=newMap[i].servicereference;
		
	}
	console.log('channels retrieved from '+inFileName);	
}

function zapToChannel() {

}

var addTimer = function (serviceName, startTime, stopTime, title, description, callback) {
	// schedule a recording on service 'serviceName' from 'startTime' until 'stopTime', with title and description
	console.log("addtimer: "+serviceName+":"+startTime+" - "+stopTime+":"+title);
    var sRef=channelMap[serviceName];

    if(!sRef||sRef===""){ // dreambox doesn't know this channel
	    console.error("error: no channel reference for "+serviceName);
        callback("error: no channel reference for "+serviceName,'');
		return;
    }        

	startTime=new Date(startTime).getTime()/1000; // dreambox wants times in seconds since 1/1/1970
	stopTime=new Date(stopTime).getTime()/1000;

	if(stopTime<startTime){
	    console.error("error: endtime before starttime");
		callback("error: endtime before starttime",'');
	    return;
    }
	
    startTime-=paddingBefore;
    stopTime+=paddingAfter;

    sRef=encodeURIComponent(sRef);
    var params='&sRef='+sRef+'&begin='+startTime+'&end='+stopTime;
    params+='&name='+encodeURIComponent(title);
    params+='&description='+encodeURIComponent(description)+'&disabled=0&justplay=0&repeated=0';

    doRequest('timeradd?'+params,'',function(response){
		callback(null,response);
    });
	

};

function getChannels() {

}


exports.doRequest = doRequest;
exports.retrieveChannels=retrieveChannels;
exports.getChannelMap = getChannelMap;
exports.addTimer = addTimer;
exports.readChannelMap = readChannelMap;
exports.saveChannelMap = saveChannelMap;