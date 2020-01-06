var map = L.map('map').setView([38, -95], 5)
map.scrollWheelZoom.disable();

var StateCSV = loadFile("StateData.csv");
const data = $.csv.toObjects(StateCSV);

// Add basemap
L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)


var statesJSON
// Add GeoJSON
$.getJSON('us-states.json', function (geojson) {
  statesJSON = geojson
  for(i=0; i<statesJSON.features.length; i++)
  {
	  for(var key in data[i]) {
		  //if(data[i].hasOwnProperty(key)) {
		if(data[i].State === statesJSON.features[i].properties["name"]) {
			statesJSON.features[i].properties[key] = data[i][key]
		  }
	  }
  }
  changeChoropleth('Avg F', "&#176;F");
  graph("Avg F", "Average Temperature in Fahrenheit");
})


function changeChoropleth(valueProp,label) {
  L.choropleth(statesJSON, {
    valueProperty: valueProp,
    scale: ['white', 'green'],
    steps: 5,
    mode: 'q',
    style: {
      color: '#fff',
      weight: 2,
      fillOpacity: 0.8
    },
    onEachFeature: function (feature, layer) {
      layer.bindPopup(feature.properties.name + '<br>' +
          feature.properties[valueProp] + label)
    }
  }).addTo(map)
	
	
}


function loadFile(filePath) {
  var result = null;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", filePath, false);
  xmlhttp.send();
  if (xmlhttp.status==200) {
    result = xmlhttp.responseText;
  }
  return result;
}

function setdata(value) {
	if(value===1) { graph("Avg F", "Average Temperature in Fahrenheit"); 
					changeChoropleth("Avg F", "&#176;F"); }
	if(value===2) { graph("Millimeters", "Yearly Millimeters of Precipitation"); 
					changeChoropleth("Millimeters", " Yearly Millimeters of Precipitation"); }
	if(value===3) { graph("Density", "Density (People per Square Mile)");
					changeChoropleth("Density", " People per Square Mile"); }
	if(value===4) { graph("2016 Median Salary", " 2016 Median Hourly Wage");
					changeChoropleth("2016 Median Salary", " 2016 Median Hourly Wage");}
	if(value===5) { graph("Cost of Living Adjusted Income", " Cost of Living Adjusted Income");
					changeChoropleth("Cost of Living Adjusted Income", " Cost of Living Adjusted Income");}
	if(value===6) { graph("Median Home Value", " Median Home Value");
					changeChoropleth("Median Home Value", " Median Home Value");}
}
	
function graph(valueField, valueTitle) {

		var chart = AmCharts.makeChart("chartdiv", {
			"zoomControl": {
				"zoomControlEnabled": true
			},
		  "type": "serial",
		  "dataProvider": data,
		  "dataTableId": "chartdata",
		  "categoryField": "State",
		  "categoryAxis": {
			"gridAlpha": 0.02,
			"axisColor": "#DADADA",
			"startOnAxis": false,
			"gridPosition": "start",
			"tickPosition": "start",
			//"tickLength": 5,
			"boldLabels": true,
			"labelRotation": 270,
			"autoGridCount": false,
			"equalSpacing": true,
			"gridCount": 1000
		  },
		  "valueAxes": [{
			"stackType": "regular",
			//"gridAlpha": 0.02,
			"title": valueTitle
		  }],
		  "graphs": [{
			"type": "column",
			"title": "Data Graph",
			"valueField": valueField,
			"lineAlpha": 0,
			"fillAlphas": 0.6,
			"fillColors": "#4287f5"
		  }], 
		  "chartCursor": {
			"cursorAlpha": 0,
			"categoryBalloonEnabled": false
		  },
		  "autoMargins": false,
		  "marginLeft": 100,
		  "marginRight": 0,
		  "marginBottom": 25
		});	

	  var x = document.getElementById("dataDIV");
		if (x.style.display === "none") {
			x.style.display = "block";
		}
}

function openClose() {
	$("#tableexmple").hide();
    var x = document.getElementById("dataDIV");
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
}

$("#downClick").click(function() {
    $('html, body').animate({
        scrollTop: $("#text").offset().top
    }, 2000);
});
	
			
 $("#upClick").click(function() {
  $("html, body").animate({ scrollTop: 0 }, "slow");
  return false;
});