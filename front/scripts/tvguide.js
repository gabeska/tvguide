$(document).ready(function(){
	var programmes=TAFFY();
	var genres=[];
	var channels=[];
	var minimacURL="http://192.168.178.42:4000/";
	console.log('document ready');
	
	
	function reloadData() {
	
		$.getJSON(minimacURL+'programmes', function(data) {
	
			programmes=TAFFY(data);
			//var prog=programmes().first();
			//console.log(prog.title,prog.category, prog.channel, prog.start, prog.stop, prog.desc);
			$.getJSON(minimacURL+'channels', function(data) {
				channels=data;
				channels.sort(function(a,b){ return a.name>b.name?1:-1;});
				refreshChannels();
			});
			$.getJSON(minimacURL+'genres', function(data) {
				genres=data;
				refreshGenres();
			});
			$("#refreshBtn").button('reset');
			console.log('finished reloadData');
		});
		
	}
	function clearPrimaryButtons() {
		$("#genresList .btn").removeClass('btn-primary');
		$("#channelsList .btn").removeClass('btn-primary');
	}
	
	
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
	
			});

			// button handler
			$("#genresList").on('click', '.btn', function(e) {
				e.preventDefault();
				clearPrimaryButtons();
				$(this).addClass('btn-primary');
				
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
				//console.log(c);
				/*var iconURL=c.iconURL;
				if(iconURL) {
					console.log(iconURL);
				} else {
					iconURL="#";
				}*/
				
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
				clearPrimaryButtons();
				$(this).addClass('btn-primary');
				var category=this.text;
				if (category=="All") {
					var selector={};
				} else {
					var selector={channel:this.text};
				}
				showProgrammes(selector);
			});

	}	
	
	function formatStartStop(startDate, stopDate) {
		var startText=moment(startDate).format("ddd MMM D HH:mm");
		var stopText=moment(stopDate).format("HH:mm");
		return startText+'-'+stopText
	}
	
	
	function showProgrammes(selector) {
		var programmesList=$("#programmesList");
		programmesList.empty();
		if (shouldHideCrap()) {
			selector.show=true; // add criterium to search query to not show programmes that have show set to false
		
		} 
		var sortOrder=getProgrammesSortOrder();	
		
		/*
		var selectedProgrammes=programmes(selector).limit(500).order(sortOrder).get(); // TODO: remove development limit
		console.log(selectedProgrammes.length+' programmes found (limited at 500)');
		var $el=programmesList;
		var listView=new infinity.ListView($el);

		$.each(selectedProgrammes, function(i,c) {
			var programmeId=c._id;
			// test of date formatter
			
			listView.append($('<li>').attr('class','programmeItem').append($('<a>').attr('href','#').attr('data-programmeId',programmeId).append(formatStartStop(c.start, c.stop)+': '+c.title+' '+c.channel)));

			
		});
		*/
		var listView=new infinity.ListView(programmesList);

		programmes(selector).limit(700).order(sortOrder).each(function (programme,pnumber) {
				listView.append($('<li>').attr('class','programmeItem')
					.append($('<a>').attr('href','#').attr('data-programmeId',programme._id)
					.append(formatStartStop(programme.start, programme.stop)+': '+programme.title+' '+programme.channel)));		
			
		});
		
		
		
		programmesList.on('click', 'a', function(e) {
			e.preventDefault();
	
			var programmeId=($(this).attr('data-programmeId'));
			showProgrammeModal(programmeId);
		});
		
		
	}
	function showProgrammeModal(programmeId) {
		//console.log(programmeId);
		var programme=programmes({_id:programmeId}).first();
		//console.log (programme.desc);
		$("#programmeModal h3").text(programme.title);
		$("#programmeModal #modalDesc").text(programme.desc);
		$("#programmeModal #modalDateTime").text(formatStartStop(programme.start, programme.stop));
		$("#programmeModal #modalChannel").text(programme.channel);
		$('#programmeModal').modal('show');
	
		$('#programmeModal').attr("data-programmeId",programmeId);
	}
	
		
	$('#programmeModal').on('click','#hideProgramme', function(e) {
			console.log('click');
			var programmeId=$('#programmeModal').attr('data-programmeId');
			var programme=programmes({_id:programmeId}).first();
			if (confirm('hide programme '+programme.title+'?')) {
				hideProgrammesWithName(programme.title);
				// todo: refresh
				$("#programmeModal").modal('hide');
			}


	});
	
	
	$('header').on('click', "#refreshBtn", function(e){
		$(this).button('loading');
		reloadData();
	});
	function shouldHideCrap() {
		if ($('#hideCrapBtn').hasClass('active')) {
			return true;
		}
		else {
			return false;
		}
		
	}
	function getProgrammesSortOrder() {
		if($("#titleSortBtn").hasClass('active')) {
			return	"title logical, start, channel";
		} else {
			return "start, channel, title logical"
		}
		
	}
	function hideProgrammesWithName(programmeName) {
		// add the show:false tag to programme items
		// in the local db as well as on the server
			// hide locally
			programmes({title:programmeName}).update({show:false});
			// hide on server
			$.post(minimacURL+'hideprogramme',{title:programmeName}, function(data) {
				console.log(data);
			});
	
	
	}
	//refreshGenres();

});// JavaScript Document
