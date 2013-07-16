$(document).ready(function(){
	var programmes=[];
	var genres=[];
	var channels=[];
	var minimacURL="http://192.168.178.42:4000/";
	console.log('document ready');
	
	
	function reloadData() {
		$.getJSON(minimacURL+'channels', function(data) {
			channels=data;
			refreshChannels();
		});
		$.getJSON(minimacURL+'genres', function(data) {
			genres=data;
			refreshGenres();
		});
	$.getJSON(minimacURL+'programmes', function(data) {
	
			programmes=TAFFY(data);
			var prog=programmes().first();
			console.log(prog.title,prog.category, prog.channel, prog.start, prog.stop, prog.desc);
		});
	
	
	
	};
	function refreshGenres() {
		$(".genreItem").remove();
		var genresList=$("#genresList");
			$.each(genres,function (i,c) {
				//console.log(c);
				genresList.append($('<li>').attr('class','genreItem').append($('<a>').attr('class','btn').attr('href','#').append(c)));
				//$("#content ul li:last").after('<li><a href="/user/messages"><span class="tab">Message Center</span></a></li>');
				    //<li class="channelItem"><a href="#" class="btn">BBC 1</a></li>
	
			});
			console.log('refreshed');

	}
	
	function refreshChannels() {
		$(".channelItem").remove();
		var channelsList=$("#channelsList");
			$.each(channels,function (i,c) {
				console.log(c);
				var iconURL=c.iconURL;
				if(iconURL) {
					console.log(iconURL);
				} else {
					iconURL="#";
				}
				channelsList.append($('<li>').attr('class','channelItem').append($('<a>').attr('class','btn').attr('href','#').append(c.name)));
				//$("#content ul li:last").after('<li><a href="/user/messages"><span class="tab">Message Center</span></a></li>');
				    //<li class="channelItem"><a href="#" class="btn">BBC 1</a></li>
	
			});
			console.log('refreshed');

	}	
	
	
	console.log('reloading');
	reloadData();
	console.log('reloaded');

	//refreshGenres();

});// JavaScript Document
