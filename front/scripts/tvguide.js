$(document).ready(function(){
	var programmes=TAFFY();
	var queries=TAFFY();
	var genres=[];
	var channels=[];
	var minimacURL="http://192.168.178.42:4000/";
	
	//queries.store("queries");  // todo: localstorage seems unreliable on firefox + doesn't work with private browsing on ipad -> store in server
	
	console.log('document ready');
	
	
	function reloadData() {
	
		$.getJSON(minimacURL+'programmes', function(data) {
	
			programmes=TAFFY(data);
			//calcProgrammeLength();
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
	
			$.getJSON(minimacURL+'queries', function(data) {
				queries=TAFFY(data);
				queries.sort("queryName");
				
				refreshQueries();
			});
			
			$("#refreshBtn").button('reset');
			console.log('finished reloadData');
		});
		
	}
	
	
	function clearActive() {
		$("#genresList li").removeClass('active');
		$("#channelsList li").removeClass('active');
		$("#queriesList li").removeClass('active');

	}
	
	function refreshQueries() {
		console.log('refreshQueries');
		var queriesList=$("#queriesList");
		queriesList.empty(); 
		//var icon='<i class="icon-remove pull-right"></i>';
		queries().each(function (query, qnum) {
			console.log(query);
			console.log(query._id);
			var icon = $('<i>').attr('class','icon-edit pull-right').attr('data-queryid',query._id);
			//	var icon = document.createElement('i');

			queriesList.append(
				//icon.attr('class','icon-remove pull-right').attr('data-queryId',query.___id);
				$('<li>').attr('class','queryItem').append(
						$('<a>').attr('href','#').attr('data-selector',query.selector).append(
						query.queryName).append(icon)
					)				
			);
			
		});
		
			// button handler
		console.log('adding button handler');
		$("#queriesList").off('click','a');	
		$("#queriesList").on('click', 'a', function(e) {
			console.log('click');
			e.preventDefault();
			clearActive();
			
			$(this).parent('li').addClass('active');
				
			var selector=$(this).attr('data-selector');
			console.log("showing programmes for selector "+selector);
			//showProgrammes(selector);
			setTableData(JSON.parse(selector));
		});
		
				// button handler
		$("#searchesHeading").off('click','i');
		$("#searchesHeading").on('click', 'i', function(e) {
			e.preventDefault();
			e.stopPropagation();
				
			showQueryModal();
				
			//}
		});
		
		
		
			
			// button handler
		$("#queriesList").off('click','i');
		$("#queriesList").on('click', 'i', function(e) {
			e.preventDefault();
			e.stopPropagation();
			//if (confirm('edit this query?')) {
				var queryId=$(this).attr('data-queryid');
				console.log('editing query: '+ queryId);
				showQueryModal(queryId);
				
			//}
		});
	}
	
	function refreshGenres() {
		var genresList=$("#genresList");
		genresList.empty(); // Todo: haalt ook 'All' knop weg!
			$.each(genres,function (i,c) {
				//console.log(c);
				genresList.append(
					$('<li>').attr('class','genreItem').append(
						$('<a>').attr('href','#').append(c)
					)
				);
	
			});

			// button handler
			$("#genresList").off('click');
			$("#genresList").on('click', 'a', function(e) {
				console.log('click');
				e.preventDefault();
				clearActive();
				$(this).parent('li').addClass('active');							
				
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
						$('<a>').attr('href','#').append(
							c.name)
						)
					);
				//$("#content ul li:last").after('<li><a href="/user/messages"><span class="tab">Message Center</span></a></li>');
				    //<li class="channelItem"><a href="#" class="btn">BBC 1</a></li>
	
			});
				// button handler
			$("#channelsList").off('click');
			$("#channelsList").on('click', 'a', function(e) {
				console.log('click');
				e.preventDefault();
				clearActive();
				$(this).parent('li').addClass('active');
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
		var startText=moment(startDate).format("dd DD-MM HH:mm");
		var stopText=moment(stopDate).format("HH:mm");
		return startText+'-'+stopText;
	}
	
	
	function showProgrammes(selector) {
		var programmesList=$("#programmesList");
		programmesList.empty();
	
		var sortOrder=getProgrammesSortOrder();	
		
		var listView=new infinity.ListView(programmesList);
		var showChannel=true;
		if(selector.channel) {
		//don't need to show channel if we're filtering on it
			if(typeof(selector.channel)=="string") {
				showChannel=false;
			}
		}
		programmes(selector).limit(5000).order(sortOrder).each(function (programme,pnumber) {
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
	var displayLength=25;
	if (windowHeight<800) {
		scrollY="440px";
		displayLength=15;
	}
		// init datatable this way?

		 $('#datatable').dataTable( {
        "aaData": [],
        "sDom": '<"top"<"clear">>rt<"bottom"if<"clear">>',
		"aoColumns": [
            { "sTitle": "Title" },
            { "sTitle": "Time", "iDataSort":5 },
			{ "sTitle": "Channel" },
            { "sTitle": "Category" },
			{ "bVisible": false}, // id-column
			{ "bVisible": false}, // start time (for sorting)
			{ "bVisible":false} // desc
        	],
		"sScrollY":scrollY,
		"bScrollCollapse":true,
		"bScrollInfinite": true,
		"iDisplayLength":displayLength,
		"aaSorting":[[5, "asc"]]
//		"bPaginate":false,

    	} );
	
	
	function setTableData(selector) {
		var dataTable=$('#datatable').dataTable();
		dataTable.attr('data-selector',selector);
		if (shouldHideCrap()) {
			selector.show=true; // add criterium to search query to not show programmes that have show set to false
		} 
		var showChannel=true;
		var showCategory=true;
	
		var validData=true;
		var progData=programmes(selector).limit(5000).select("title","channel","start","stop","category","_id","desc");	
		//console.dir(progData);
		if (progData.length<1) {
			validData=false;
		}
		
		var maxTitleLength=60;
		var maxChannelLength=30;
		var windowWidth=$(window).width();
		if (windowWidth<1050) {
			maxTitleLength=50;
			maxChannelLength=18;
		} else if (windowWidth<800) {
			maxTitleLength=36;
			maxChannelLength=18;
		} else if (windowWidth>1400) {
			maxTitleLength=100;
			maxChannelLength=40;
		}
		// todo: do this in CSS
		
		
		
		for (var i=0;i<progData.length;i++) {
			var time=formatStartStop(progData[i][2], progData[i][3]);
			var title=progData[i][0].slice(0,maxTitleLength); // prevent excessive titles		
			var channel=progData[i][1].slice(0,maxChannelLength);
			progData[i]=[title,time,channel,progData[i][4], progData[i][5], progData[i][2],progData[i][6]];
			
		}
		dataTable.fnClearTable();
	
		if(selector.channel && typeof(selector.channel)=="string") {
		//don't need to show channel if we're filtering on a single channel
			showChannel=false;
			
		}
		if(selector.category  && typeof(selector.category)=="string") {
			showCategory=false;
		}
		
		dataTable.fnSetColumnVis(2,showChannel);
		dataTable.fnSetColumnVis(3,showCategory);


		if(!validData) {
			console.log('query returned no programmes');
			var emptyRow=['No Programmes for this selector',0,0,0,0,0,0]
			progData.push(emptyRow);
		}
		
		
		dataTable.fnAddData(progData);
		dataTable.fnAdjustColumnSizing();
		
		
		/* Click event handler */
		
		$('#datatable tbody').off('click');	
		// only attach the programme click handler if there is something to click on
		if(validData) {
			$('#datatable tbody').on('click', 'tr td:first-child', function (e) {
				e.preventDefault();
				//var aData = dataTable.fnGetData( this);
				var p = this.parentElement;
				var pData = dataTable.fnGetData( p );
				
				var iId = pData[4];
			
				showProgrammeModal(iId);
			} );
		}
	
	}
	
	
	
	function showProgrammeModal(programmeId) {
		var programme=programmes({_id:programmeId}).first();
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
			e.preventDefault();
			var programmeId=$('#programmeModal').attr('data-programmeId');
			var programme=programmes({_id:programmeId}).first();
			if (confirm('hide programme '+programme.title+'?')) {
				hideProgrammesWithName(programme.title);
				// todo: refresh
				$("#programmeModal").modal('hide');
			}
	});
	
	$('#programmeModal').on('click','#recordProgramme', function(e) {
			e.preventDefault();
			console.log('record click');
			var programmeId=$('#programmeModal').attr('data-programmeId');
			var programme=programmes({_id:programmeId}).first();
			//console.log(programme.desc);
			if (confirm('record this programme '+programme.title+'?')) {
				recordProgramme(programme);
				$("#programmeModal").modal('hide');
			}
	});
		
	function showQueryModal(queryId) {
		console.log('showQueryModal: id='+queryId);
		if(queryId) {
			var query=queries({_id:queryId}).first();
			console.log('showing query modal for: '+query.queryName);
			console.log('with selector: '+query.selector);
			$("#queryModal #queryName").val(query.queryName);
		
			$("#queryModal #selector").val(query.selector);
		} else {
			console.log("no queryId");
			$("#queryModal #queryName").val("");
			$("#queryModal #selector").val('{"field":"value"}');	
		}

		$("#queryModal").modal("show");
		//$('#queryModal').attr("data-queryId",queryId);
	}
	
	
	$('#queryModal').on('click','#testQuery', function(e) {
		e.preventDefault();
		console.log('test query');
		var selectorText = $("#selector").val();
		console.log("text: "+selectorText);
	
		var selector = JSON.parse(selectorText);

		
		console.log("query object: "+selector);
		alert('query returns '+programmes(selector).count()+' programmes.');
		
		programmes(selector).limit(100).each(function (programme,pnumber) {
				console.log(programme);

		});	
		
		
	});
	
	
	$('#queryModal').on('click','#saveQuery', function(e) {
		e.preventDefault();
		console.log('save query');
		var queryName = $("#queryName").val();
		console.log ("name: "+queryName);
		var selectorText = $("#selector").val();
		console.log("selector text: "+selectorText);
		
		// todo: add validation for name & query; add description box
		
		if(queries({queryName:queryName}).count()>0) {
			if(confirm('replace existing query?')) {
				queries({queryName:queryName}).remove();
			} else {
				return;
			}
		}
	
		var query={"queryName":queryName,"selector":selectorText};
		//queries.merge(query,{key:"queryName"});
		
		$.post(minimacURL+'addquery', query, function(data) {
			queries.insert(data)
			console.log(data);
			refreshQueries();
		});
		
		$("#queryModal").modal('hide');
		
		
	});
	$('#queryModal').on('click','#deleteQuery', function(e) {
		e.preventDefault();
		console.log('delete query');
		var queryName = $("#queryName").val();
		console.log ("name: "+queryName);
		if(confirm('delete this query?')) {
			queries({queryName:queryName}).remove();
	
			var query = {
				queryName: queryName
			}
			$.post(minimacURL+'deletequery',query,function(data) {
				console.log(data);
				$("#queryModal").modal('hide');
				refreshQueries();
	
			});
	
	
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
				//alert('Recording added');
				alert(data);
				console.log(data);
			}).fail(function(data) {
				alert('Recording not added. Reason: '+data.responseText);
				console.log(data);
			});
	
	
	}
	
	
	function getProgrammesSortOrder() {
		if($("#titleSortBtn").hasClass('active')) {
			return	"title logical, start, channel";
		} else {
			return "start, channel, title logical";
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
