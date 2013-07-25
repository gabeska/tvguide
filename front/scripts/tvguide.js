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
				//showProgrammes(selector);
				setTableData(selector);
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
				//showProgrammes(selector);
				setTableData(selector);
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
	
		var sortOrder=getProgrammesSortOrder();	
		
		var listView=new infinity.ListView(programmesList);
		var showChannel=true;
		if(selector.channel) {
		//don't need to show channel if we're filtering on it
			showChannel=false;
		
		}
		programmes(selector).limit(1000).order(sortOrder).each(function (programme,pnumber) {
				listView.append($('<li>').attr('class','programmeItem')
					.append($('<a>').attr('href','#').attr('data-programmeId',programme._id)
					.append(formatStartStop(programme.start, programme.stop)+': '+programme.title,showChannel?' ('+programme.channel+')':'')));		
					//todo use template!
		});
		
		
		
		programmesList.on('click', 'a', function(e) {
			e.preventDefault();
	
			var programmeId=($(this).attr('data-programmeId'));
			showProgrammeModal(programmeId);
		});
		
		
	}
	
	// adjust datatable scrolling height for ipad (experimentally)
	
	var windowHeight=$(window).height();
	var scrollY="700px";
	
	if (windowHeight<800) {
		scrollY="440px";
	}
		// init datatable this way?

		 $('#datatable').dataTable( {
        "aaData": [],
		//"sDom": 'l<"pager"p>t<"pager"p><"info"i><"clear">',
        "sDom": '<"top"fl<"clear">>rt<"bottom"ip<"clear">>',
		"aLengthMenu": [[15, 25, 50, -1], [15, 25, 50, "All"]],
		"aoColumns": [
            { "sTitle": "Title" },
            { "sTitle": "Channel" },
            { "sTitle": "Time" },
            { "sTitle": "Category" },
			{ "sTitle": "Id"}
        	],
		"sScrollY":scrollY

    	} );
	
	
	function setTableData(selector) {
		var dataTable=$('#datatable').dataTable();
		
		if (shouldHideCrap()) {
			selector.show=true; // add criterium to search query to not show programmes that have show set to false
		} 
		var showChannel=true;
		var showCategory=true;
	
		
		var progData=programmes(selector).limit(1000).select("title","channel","start","stop","category","_id");	
		//console.dir(progData);
		
		for (var i=0;i<progData.length;i++) {
			var time=formatStartStop(progData[i][2], progData[i][3]);
			var title=progData[i][0].slice(0,50); // prevent excessive titles		
			progData[i]=[title,progData[i][1],time,progData[i][4], progData[i][5]];
			
		}
		//console.dir(progData);
		
		dataTable.fnClearTable();
		dataTable.fnSetColumnVis(4,false); // hide _id column
			if(selector.channel) {
		//don't need to show channel if we're filtering on it
			showChannel=false;
			dataTable.fnSetColumnVis(1,false);
			dataTable.fnSetColumnVis(3,true);
		}
		if(selector.category) {
			showCategory=false;
			dataTable.fnSetColumnVis(1,true);
			dataTable.fnSetColumnVis(3,false);
		}
		dataTable.fnAddData(progData);
		dataTable.fnAdjustColumnSizing();
	
	
		/* Click event handler */
	$('#datatable tbody').off('click');	
	$('#datatable tbody').on('click', 'tr', function (e) {
		e.preventDefault();
		var aData = dataTable.fnGetData( this );
		console.log (aData);
		var iId = aData[4];
		console.log('click on row for programme id: '+iId);
		
		showProgrammeModal(iId);
	} );
	
	}
	
	
	
	function showProgrammeModal(programmeId) {
		//console.log(programmeId);
		var programme=programmes({_id:programmeId}).first();
		//console.log (programme.desc);
		$("#programmeModal h3").text(programme.title);
		$("#programmeModal #modalDesc").text(programme.desc);
		$("#programmeModal #modalDateTime").text(formatStartStop(programme.start, programme.stop));
		$("#programmeModal #modalChannel").text(programme.channel);
		$("#programmeModal #modalCategory").text(programme.category);

		$('#programmeModal').modal('show');
		if (programme.uri) {
			$("#programmeModal #modalUri").show().attr("href",programme.uri);
		} else {
			$("#programmeModal #modalUri").hide().attr("#");
		}
	
		$('#programmeModal').attr("data-programmeId",programmeId);
	}
	
		
	$('#programmeModal').on('click','#hideProgramme', function(e) {
			var programmeId=$('#programmeModal').attr('data-programmeId');
			var programme=programmes({_id:programmeId}).first();
			if (confirm('hide programme '+programme.title+'?')) {
				hideProgrammesWithName(programme.title);
				// todo: refresh
				$("#programmeModal").modal('hide');
			}


	});
	
	$('#programmeModal').on('click','#recordProgramme', function(e) {
			console.log('record click');
			var programmeId=$('#programmeModal').attr('data-programmeId');
			var programme=programmes({_id:programmeId}).first();
			//console.log(programme.desc);
			if (confirm('record this programme '+programme.title+'?')) {
				recordProgramme(programme);
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
	
	function recordProgramme(programme) {
		//var programme=programmes({_id:programmeId}).first();
		
			var programmeDetails = {
				title: programme.title,
				start: programme.start,
				stop: programme.stop,
				channel: programme.channel,
				desc: programme.desc	
				
			};

			$.post(minimacURL+'recordprogramme',programmeDetails, function(data) {
				console.log(data);
			});
	
	
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
