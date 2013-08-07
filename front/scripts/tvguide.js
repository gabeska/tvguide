// collected (experimental) utility functions
function debouncer( func , timeout ) {
   var timeoutID , timeout = timeout || 200;
   return function () {
      var scope = this , args = arguments;
      clearTimeout( timeoutID );
      timeoutID = setTimeout( function () {
          func.apply( scope , Array.prototype.slice.call( args ) );
      } , timeout );
   }
}
// end

$(document).ready(function(){
	var programmes=TAFFY();
	var queries=TAFFY();
	var genres=[];
	var channels=[];
	
	//queries.store("queries");  // todo: localstorage seems unreliable on firefox + doesn't work with private browsing on ipad -> store in server
	
	console.log('document ready');
	
	$(document).on('touchmove',function(e){
  		e.preventDefault();
	});
	$('.scrollable').bind('touchmove', function(e){
  		e.stopPropagation();
	});
	
	$(window).resize(debouncer( function(e) {
	  var windowheight=$(window).height();
	  var windowwidth=$(window).width();
	  console.log('window resize to: '+windowheight+'x'+windowwidth);
	
	  setupUI(windowheight, windowwidth);
	 
	  setTableData();	  
	
	}));
	
	
	function setupUI(height,width) {
		
		if (height<800) {
		  $(".accordionList").css("max-height","450px");
	  	} else {
		  $(".accordionList").css("max-height","680px");
	  	}
		var dataTable= $('#datatable').dataTable();
		var newTableheight = $(window).height() - 260;
	    console.log('new table height: '+ newTableheight);
		var oSettings = dataTable.fnSettings();
		oSettings.oScroll.sY = newTableheight + "px";
		dataTable.fnDraw();

	}
	
/*	
	$(window).on('orientationchange', function(e) {
	  var windowheight=$(window).height();
	  var windowwidth=$(window).width();
	  console.log('window orientationchange to: '+windowheight+'x'+windowwidth);
	  
	  if(navigator.platform == 'iPad') {
		  alert('window orientationchange to: '+windowheight+'x'+windowwidth);
	  }

	});
	*/
	
	function getProgrammes() {
		return $.getJSON('/programmes');	
	}
	function getChannels() {
		return $.getJSON('/channels');
	}
	
	function getGenres() {
		return $.getJSON('genres');
	}
	
	function getQueries() {
		return $.getJSON('queries');
	}
	
	
	function getEverything() {
		console.log('getEverything');
		$.when(getProgrammes(), getChannels(), getGenres(), getQueries())
			.then(function(progsJS,channelsJS,genresJS,queriesJS) {
				console.log(progsJS, channelsJS, genresJS, queriesJS);
				// return value is array [json_Data, status, jqXHR]
				programmes=TAFFY(progsJS[0]);
				
				channels=channelsJS[0];
				channels.sort(function(a,b){ return a.name>b.name?1:-1;});
				genres=genresJS[0];
				queries=TAFFY(queriesJS[0]);
				queries.sort("queryName");
				
				refreshChannels();
				refreshGenres();
				refreshQueries();
			
		},
			function() {
				alert('error retrieving data');
				console.log('error getting data from server');
			}
		
		)
	}
	
	
	
	function reloadData() {
		
		getEverything();
		
		$("#refreshBtn").button('reset');
		
		var windowheight=$(window).height();
	  	var windowwidth=$(window).width();
	  
	  	setupUI(windowheight, windowwidth);
		setTableData();
		
		console.log('finished reloadData');
		
		
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
			//console.log(query);
			//console.log(query._id);
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
		genresList.empty().detach();
		$.each(genres,function (i,c) {
			//console.log(c);
			genresList.append(
				$('<li>').attr('class','genreItem').append(
					$('<a>').attr('href','#').append(c)
				)
			);

		});
		genresList.appendTo('#collapseGenre');
	  
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
		channelsList.empty().detach(); 
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
		});
		channelsList.appendTo('#collapseChannel');
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
	function formatStartStop(startDate, stopDate) {
		var startText=moment(startDate).format("dd DD-MM HH:mm");
		var stopText=moment(stopDate).format("HH:mm");
		return startText+'-'+stopText;
	}
	
	
	
	
	// adjust datatable scrolling height for ipad (experimentally)
	
	var windowHeight=$(window).height();
	
	
	var scrollY=(windowHeight-260)+"px";
	
		// init datatable this way?

	$('#datatable').dataTable( {
        "aaData": [],
        "sDom": '<"top"<"clear">>rtS<"bottom"if<"clear">>',
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
		"bDeferRender":true,
		//"iDisplayLength":displayLength,
		"bScrollCollapse":true,
		"bPaginate":false,
		"aaSorting":[[5, "asc"]]

    	} );
	
	
	
	function setTableData(selector) {
	
		var dataTable= $('#datatable').dataTable();
		
		var currentSelector=selector;
		
		if(currentSelector) {
			$('#datatable').attr('data-selector',JSON.stringify(currentSelector));
		} else {
			
			var selectorAttr=$('#datatable').attr('data-selector');
			if(selectorAttr) {
				currentSelector=JSON.parse(selectorAttr);
			} else {
				console.log('selector attribute not set');
			}
		}
		
		console.log('selector: '+JSON.stringify(currentSelector));
		if(!currentSelector) {
			console.log('no new or existing selector for datatable');
			dataTable.fnAdjustColumnSizing(true);

			return;
		}
		
		if (shouldHideCrap()) {
			currentSelector.show=true; // add criterium to search query to not show programmes that have show set to false
		} 
		var showChannel=true;
		var showCategory=true;
	
		var validData=true;
		var progData=programmes(currentSelector).limit(5000).select("title","channel","start","stop","category","_id","desc");	
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
		}  
		if (windowWidth<800) {
			
			maxTitleLength=28;
			maxChannelLength=12;
		} 
		if (windowWidth>1400) {
			maxTitleLength=100;
			maxChannelLength=40;
		}
		
		for (var i=0;i<progData.length;i++) {
			var time=formatStartStop(progData[i][2], progData[i][3]);
			var title=progData[i][0].slice(0,maxTitleLength); // prevent excessive titles		
			var channel=progData[i][1].slice(0,maxChannelLength);
			progData[i]=[title,time,channel,progData[i][4], progData[i][5], progData[i][2],progData[i][6]];
			
		}
		dataTable.fnClearTable(true);
	
		if(currentSelector.channel && typeof(currentSelector.channel)=="string") {
		//don't need to show channel if we're filtering on a single channel
			showChannel=false;
			
		}
		if(currentSelector.category  && typeof(currentSelector.category)=="string") {
			showCategory=false;
		}
		
		dataTable.fnSetColumnVis(2,showChannel);
		dataTable.fnSetColumnVis(3,showCategory);


		if(!validData) {
			console.log('query returned no programmes');
			var emptyRow=['No Programmes for this selector',0,0,0,0,0,0]
			progData.push(emptyRow);
		}
		
		
		dataTable.fnAddData(progData,false);
		dataTable.fnAdjustColumnSizing(true);
		
		
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
				setTableData(); // todo: remember scroll position
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
		
		$.post('addquery', query, function(data) {
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
			$.post('deletequery',query,function(data) {
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

			$.post('/recordprogramme',programmeDetails, function(data) {
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
			$.post('/hideprogramme',{title:programmeName}, function(data) {
				console.log(data);
			});
	
	
	}
	//refreshGenres();

});// JavaScript Document
