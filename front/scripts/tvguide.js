$(document).ready(function(){
	var programmes=TAFFY();
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
			//var prog=programmes().first();
			//console.log(prog.title,prog.category, prog.channel, prog.start, prog.stop, prog.desc);
		});
	
	
	
	};
	function refreshGenres() {
		var genresList=$("#genresList");
		genresList.empty(); // Todo: haalt ook 'All' knop weg!
			$.each(genres,function (i,c) {
				//console.log(c);
				genresList.append(
					$('<li>').attr('class','genreItem').append(
						$('<a>').attr('class','btn btn-small').attr('href','#').append(
						c)
					)
				);
				//$("#content ul li:last").after('<li><a href="/user/messages"><span class="tab">Message Center</span></a></li>');
				    //<li class="channelItem"><a href="#" class="btn">BBC 1</a></li>
	
			});

			// button handler
			$("#genresList").on('click', '.btn', function(e) {
				e.preventDefault();
				var category=this.text;
				if (category=="All") {
					var selector={};
				} else {
					var selector={category:this.text};
				}
				showProgrammes(selector);
			});
	}
	
	function refreshChannels() {
		var channelsList=$("#channelsList");
		channelsList.empty(); //Todo: haalt ook 'All' knop weg!
			$.each(channels,function (i,c) {
				console.log(c);
				var iconURL=c.iconURL;
				if(iconURL) {
					console.log(iconURL);
				} else {
					iconURL="#";
				}
				
				channelsList.append(
					$('<li>').attr('class','channelItem').append(
						$('<a>').attr('class','btn btn-small').attr('href','#').append(
							c.name)
						)
					);
				//$("#content ul li:last").after('<li><a href="/user/messages"><span class="tab">Message Center</span></a></li>');
				    //<li class="channelItem"><a href="#" class="btn">BBC 1</a></li>
	
			});
				// button handler
			$("#channelsList").on('click', '.btn', function(e) {
				e.preventDefault();
				var category=this.text;
				if (category=="All") {
					var selector={};
				} else {
					var selector={channel:this.text};
				}
				showProgrammes(selector);
			});

	}	
	
	function showProgrammes(selector) {
		var programmesList=$("#programmesList");
		programmesList.empty(); 
		var selectedProgrammes=programmes(selector).limit(100).order("title logical, start, channel").get(); // TODO: remove development limit
		console.log(selectedProgrammes.length+' programmes found (limited at 100)');
		

		$.each(selectedProgrammes, function(i,c) {
			var programmeId=c._id;
			programmesList.append($('<li>').attr('class','programmeItem').append($('<a>').attr('href','#').attr('data-programmeId',programmeId).append(c.title+' '+c.channel+' '+c.start)));

			
		});
		programmesList.on('click', 'a', function(e) {
			e.preventDefault();
	
			var programmeId=($(this).attr('data-programmeId'));
			showProgrammeModal(programmeId);
		});
		
		
	}
	function showProgrammeModal(programmeId) {
		console.log(programmeId);
		var programme=programmes({_id:programmeId}).first();
		console.log (programme.desc);
		$("#programmeModal h3").text(programme.title);
		$("#programmeModal p").text(programme.desc);

		$('#programmeModal').modal('show');
		
		
	}
	
	
	
	$('header').on('click', "#refreshBtn", function(e){
		console.log('reloading');
		reloadData();
		console.log('reloaded');			
	});
	

	//refreshGenres();

});// JavaScript Document
