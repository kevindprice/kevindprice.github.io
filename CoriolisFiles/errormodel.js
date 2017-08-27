/* Author: Kevin Price */
/* Performs all of the calculations relevant to the Coriolis model. */




//make the script context-aware. Is it embedded or standalone?
//(if standalone, it is manually set to true in a <script> tag underneath <head>)
if(typeof standalone === 'undefined')
{  var standalone = false;   }



//Namespace for variables relevant to canvas
var cnv = {}; 
cnv.clientWidth = null;
cnv.canvasmaxString = getComputedStyle(document.getElementById("canvascontainer")).maxWidth
cnv.canvasMax = parseInt( cnv.canvasmaxString.substring(0, cnv.canvasmaxString.length-2));
cnv.DELAY_BETWEEN_DRAWS = 2.5 //seconds to wait until next draw, when looping.


Decimal.set({ precision: 30 });  //accuracy of 30 decimals for the calculations.
							//Calculations with a large diameter tend to need this.
		//(the diameter field is set to MAX out before it gets glitchy again at precision 30...)
		//(though it is entertaining watching the computer attempt to draw that)


//Namespace for other variables
var MyLib = {}
MyLib.units = "ft";  //declares the unit type the page is using, either "ft" or "m".
MyLib.allatonce = false; //used so that some functions can change all the values
					   //and submit only once.

MyLib.PI = Decimal.acos(-1);  //Math.PI only goes out to 15 decimals.
MyLib.percenttime = 100;
MyLib.scale=false;
MyLib.relativepoints = []
MyLib.globaltime = null;
MyLib.repeattimeout = null;
MyLib.movetimeout = null;

//these are set to the global namespace
//so the scale can be drawn in real-time mode, right when it's selected
//instead of waiting for the next re-draw.
//(though if you deselect it, you still have to wait)
MyLib.radius = null;
MyLib.minmaxes = null;
MyLib.canvaspoints = null;
MyLib.start_v_y = null;





//Set the fields after initially loading the page.
//(or reset them if you push the "reset" button)
function setfields() {
	MyLib.allatonce=true;
	
	document.getElementById('checkscale').checked = false;
	MyLib.scale=false;
	document.getElementById("scalemessage").innerHTML = ""
	document.getElementById('checktime').checked = false;
	document.getElementById('percenttimediv').innerHTML = "";
	document.getElementById("percenttimediv").className = "";
	document.getElementById("outertime").style.marginTop="0px";
	
	if(MyLib.repeattimeout!=null)
	{
		clearTimeout(MyLib.repeattimeout);
		clearTimeout(MyLib.movetimeout);
		MyLib.repeattimeout=null;
		MyLib.movetimeout=null;
	}


	//mouseover=true;
	var percentgravity = 100;
	
	document.getElementById("heightstart").value = 4
	document.getElementById("diameter").value = 50
	document.getElementById("heightstart").setAttribute("max",50);
	document.getElementById("heightthrown").value = 3
	document.getElementById("percentgravity").value = percentgravity
	
	outputgs(percentgravity)
	
	document.getElementById('imperial').checked = true;
	document.getElementById('up').checked = true;
	changeparams("up")
	
	MyLib.units="ft";
	setunits(MyLib.units);

	MyLib.allatonce=false;
	
	submit_values()
	
	var checkboxtime = document.getElementsByTagName('checktime');
	checkboxtime.checked=false;	
}


//the starting height cannot be greater than the diameter of the station.
//Ensure that this never happens!
//(set to run whenever the diameter changes...just to make sure)
function changeDiameter(value) {
	MyLib.allatonce=true;
	var startfield = document.getElementById("heightstart");
	startfield.setAttribute("max",value);
	
	//if the starting height already IS larger, then fix it.
	if(Number(startfield.value) > Number(value))
	{ startfield.value = value; }

	MyLib.allatonce=false;

	changeit();
}

//handles selecting/deselecting the scale option.
function changescale(checkboxElem) {
  if (checkboxElem.checked) {
	  MyLib.scale=true;
	  draw_scale();
	  //EXTRA_X_BUFFER=25;  //It was a good idea. But no. (alter the x-positions based on whether it's displaying a scale...)
													//(...can bump part of the display off the canvas.)
  } else {
	  MyLib.scale=false;
	  //EXTRA_X_BUFFER=0;
	  
	document.getElementById("scalemessage").innerHTML = ""

	  
	  if(MyLib.repeattimeout==null && MyLib.movetimeout==null) //if the scale is static, it won't erase otherwise.
	  {
		reset_canvas()
		draw_curve_static()
	  }
  }
}

//gets called when the user selects "show in real time"
function changecheck(checkboxElem) {
  if(checkboxElem.checked) 
  {
		var timediv = document.getElementById("percenttimediv")
		
		//Add the input field to alter the percent speed
		timediv.innerHTML="&#8195;&#8194;Time&#160;<input type='number' step='1' min='0' max='500' style='width:63px' id='percenttime' value='100' onchange='changepercenttime(this.value)'/>";
		MyLib.percenttime=100;
		
		timediv.className = "percentsign";
		
		//Set a MAX on percenttime. The browser can only handle about 100 canvaspoints per second.
		timeinput = document.getElementById("percenttime")
		if(MyLib.globaltime>1)
		{ timeinput.setAttribute("max", Math.ceil(MyLib.globaltime)*100 );	}
		else
		{ timeinput.setAttribute("max", 100 );	}
	
		//I have to change the top margin of the checkbox depending on whether the checkmark is selected.
		//When you adjust the width of the div, it also alters its height on a page, which looks super awkward.
		//the margins work out differently depending on whether you view the model embedded vs standalone.
		if(standalone!=true)
		{	document.getElementById("outertime").style.marginTop="-29px"; }
		else
		{	document.getElementById("outertime").style.marginTop="-19px"; }

		draw_curve_active();
		
  } else {
	  stop_time_interval();
  }
}


//Self-explanatory. Go from active to static display.
function stop_time_interval()
{
	clearTimeout(MyLib.repeattimeout);
	clearTimeout(MyLib.movetimeout);
	MyLib.repeattimeout=null;
	MyLib.movetimeout=null;
	
	document.getElementById("percenttimediv").innerHTML=""
	document.getElementById("percenttimediv").className = "";
	document.getElementById("outertime").style.marginTop="0px";
	
	reset_canvas()
	draw_curve_static()
}

//Change the percent time in the global namespace, when the user changes it.
function changepercenttime(value)
{
	MyLib.percenttime = value;
	//clearTimeout(MyLib.repeattimeout);
	//clearTimeout(MyLib.movetimeout);
	//prep_canvas()
	//set_time_interval()
}

//Activated by radiobutton when the user changes the unit setting.
function convertunits(setting) {
    MyLib.allatonce=true; //this changes ALL of the unit fields. 
					//boolean to prevent submission until the end of the function.
	setunits(setting);
	
	if(MyLib.units=="ft" && setting=="m")
	{
		document.getElementById("heightstart").value = round(to_meters(document.getElementById("heightstart").value) )
		document.getElementById("diameter").value = round(to_meters(document.getElementById("diameter").value) )
		document.getElementById("heightthrown").value = round(to_meters(document.getElementById("heightthrown").value) )
		document.getElementById("velocity").value = round(to_meters(document.getElementById("velocity").value) )

	} else if(MyLib.units=="m" && setting=="ft")
	{
		document.getElementById("heightstart").value = round(to_feet(document.getElementById("heightstart").value) )
		document.getElementById("diameter").value = round(to_feet(document.getElementById("diameter").value) )
		document.getElementById("heightthrown").value = round(to_feet(document.getElementById("heightthrown").value) )
		document.getElementById("velocity").value = round(to_feet(document.getElementById("velocity").value) )
	}	
	MyLib.units = setting;
	MyLib.allatonce=false;
	submit_values();
}

//Change between throw "up" vs throw with velocity and angle
function changeparams(setting) {
	if(setting=="anglevel")
	{
		//the ~ operator in css refused to work for me. So I'm doing this instead.
		document.getElementById("ang").className = "inputsquare"
		document.getElementById("vel").className = "inputsquare"
		document.getElementById("throwup").className = "hide"
		
		document.getElementById("angle").value = 0;
		document.getElementById("velocity").value = MyLib.start_v_y;
		changeangle(0);
		
		if(MyLib.units=="m")
		{ document.getElementById("veloc").className = "metricvel"; }
		else
		{ document.getElementById("veloc").className = "imperialvel"; }
	}
	
	if(setting=="up")
	{
		document.getElementById("ang").className = "hide"
		document.getElementById("vel").className = "hide"
		document.getElementById("throwup").className = "inputsquare"
	}
}


//change the units displayed in the table, after changing the unit setting
function setunits(setting) {
	if(setting=="m")
	{ var changeto="metric"; var changeto2 = "metricvel"; }
	else if(setting=="ft")
	{ var changeto="imperial"; var changeto2 = "imperialvel"; }

	document.getElementById("heightstartunits").className = changeto;
    document.getElementById("diameterunits").className = changeto;
	
	if(document.getElementById('up').checked)
	{
		document.getElementById("heightthrownunits").className = changeto;
	}
	else
	{
		document.getElementById("veloc").className = changeto2;
	}
}


//round to the nearest thousandth.
function round(num) {   //, places) {
    var places=3;
	var multiplier = Math.pow(10, places);
    var output = Math.round(num * multiplier) / multiplier;
	
	//fix some weird output. Probably due to feet/meters conversion not being more precise.
	if(Math.abs(output - Math.round(output)) <= .0011)
	{ output = Math.round(output); }

	return output;	
}

//Tell the user the g-forces (if they customize gravity)
function outputgs(percentgravity)
{	
	gs = percentgravity / 100
	if(gs!=1) {
		document.getElementById("gravitygs").innerHTML = gs.toString() + " g's"; //, g_accel.toString(), " ", MyLib.units, "/s/s");
	} else {
		document.getElementById("gravitygs").innerHTML = "1 g";
	}
}

function to_meters(feet) //defined exactly by the National Bureau of Standards.
{ return feet * 0.3048 } //Is the definition of a foot.
						 //I can't get more accurate than that.

function to_feet(meters)			//The inverse calculates to more decimals...
{ return meters * 3.2808333333 }

	
//creates a buffer when submitting values, in case I am changing all of them at once.
//In that case, I don't need to submit multiple times.
function changeit()
{
	if(MyLib.allatonce == false)
	{
		submit_values()
	}
}


//Calculate and store the location of the person and coin at t = time,
//given the rotation rate and slope.
function AbsolutePoints( time, radius, omega, slope, height_start, start_v_x)
{
	//solve for the location of the person and the coin.

	var theta_op = (3*MyLib.PI / 2) - (omega * time) //person's angle, from origin to person
	
	var x_person = radius * Math.cos(theta_op)
	var y_person = radius * Math.sin(theta_op)

	var x_coin = start_v_x * time
	var y_coin = (slope * x_coin) - (radius - height_start)
	
	this.time = time
	this.x_person = x_person
	this.y_person = y_person
	this.x_coin = x_coin
	this.y_coin = y_coin
}

//If the slope of the ball is not finite (e.g. it is heading directly up with infinite slope),
//then AbsolutePoints() will not work correctly. Here is an alternate function.
function AbsolutePointsVertical( time, radius, omega, slope, height_start, start_v_y)
{
	var theta_op = (3*MyLib.PI / 2) - (omega * time) //person's angle, from origin to person
	
	var x_person = radius * Math.cos(theta_op)
	var y_person = radius * Math.sin(theta_op)
	
	var x_coin = 0;
	var y_coin = (height_start-radius) + start_v_y * time

	this.time = time
	this.x_person = x_person
	this.y_person = y_person
	this.x_coin = x_coin
	this.y_coin = y_coin	
}


//Take a set of absolute points [(personx, persony), (coinx, coiny)],
//and find the coin's distance relative to the person's feet at (0,0), oriented "upward."
function RelativePoint( points )
{
	var x_diff = points.x_coin - points.x_person
	var y_diff = points.y_coin - points.y_person
	var dist = Math.sqrt( Math.pow( (y_diff), 2) + Math.pow( (x_diff), 2) )

	//horizontal-person-origin
	var theta_po = Math.atan(points.y_person/points.x_person) 
	
	if(y_diff>0)
	{
		var theta_pc = (Math.PI /2) - Math.atan(x_diff / y_diff)
		var theta_rel = (theta_pc - theta_po)
		var x_rel = -1 * dist * Math.sin(theta_rel)
	}
	else{
		
		if(x_diff>0)
		{
			//horizontal-person-coin
			var theta_pc = -1 * Math.atan(y_diff / x_diff)
		}
		else
		{
			var theta_pc = Math.atan(x_diff / y_diff) + (Math.PI / 2)
		}
		
		theta_rel = (theta_pc + theta_po) //orign-person-coin
		var x_rel = dist * Math.sin(theta_rel)

	}
	
	var y_rel = dist * Math.cos(theta_rel)
	
	//rare case if the person traverses an entire half-arc
	//you have to be really playing with the model to get this
	if(points.x_person>0)
	{
		x_rel = x_rel*-1
		y_rel = y_rel*-1
	}
		
	this.dist = dist
	this.x = x_rel
	this.y = y_rel
	this.time = points.time
	//this.x_diff = x_diff
	//this.y_diff = y_diff
	this.theta_pc = theta_pc
	//this.theta_po = theta_po
	//this.theta_rel = theta_rel
}


//Generate point coordinates with respect to the canvas.
function CanvasPoint(minmaxes, x, y) {
	//canvasPoint can accept either X and Y coordinates or a RelativePoint.
	if(!(typeof x=="number"))
	{ y = x.y; x=x.x; }
	
	var canvasX = ((x - minmaxes.minX) / minmaxes.range) * minmaxes.canvasSize
	var canvasY = cnv.DRAWING_HEIGHT - (( y / minmaxes.range ) * minmaxes.canvasSize )
	
	this.x = canvasX;
	this.y = canvasY;
}

//calculate the min and max values for the displayed canvas.
function minmax(pointlist) {
	
	//Ensure, that if these max values are not reached, that
	//these are set to the maxes (otherwise it will find a greater value)
	var minX=pointlist[0].x  //a good starting value is the first one in the list.
	var maxX=pointlist[0].x
	var minY=0 //definitely need to show the original floor. Include y=0 in the range!

	//the coin toss assumes a 6-ft person :-)
	//I'd ideally like to put that person into the window.
	if(MyLib.units=="ft")
	{	var maxY=6 	}
	else
	{	var maxY = 1.829  } //meters
	
	//Iterate through the given point list to find the min and max values
	//(assuming it supercedes the values I initialized above)
	for(var i=0; i<pointlist.length; i++)
	{
		if(pointlist[i].x < minX)
		{ minX = pointlist[i].x }

		if(pointlist[i].x > maxX)
		{ maxX = pointlist[i].x }

		if(pointlist[i].y < minY)
		{ minY = pointlist[i].y }

		if(pointlist[i].y > maxY)
		{ maxY = pointlist[i].y }
	}
	
	var rangeX = Math.abs(maxX - minX)
	var rangeY = Math.abs(maxY - minY)
	if(rangeX > rangeY)
	{ var range = rangeX }
	else
	{ var range = rangeY }
	
	//Ensures the scale stays proportional if height/width are adjusted differently.
	if(cnv.DRAWING_WIDTH/cnv.DRAWING_HEIGHT < rangeX/rangeY)
	{ canvasSize = cnv.DRAWING_WIDTH }
	else
	{ canvasSize = cnv.DRAWING_HEIGHT }
	
	minmaxes = { minX: minX,
				 maxX: maxX,
				 minY: minY,
				 maxY: maxY,
				 range: range, //only one variable for range, to keep x proportional with y.
				 canvasSize: canvasSize }
				 
	return minmaxes
}

//only runs when the canvaspoints need to be *changed*.
//(when the model is changed, or percent speed is altered)
function prep_canvas() {
	var relativepoints = MyLib.relativepoints
	var minmaxes = minmax(relativepoints)
	MyLib.minmaxes = minmaxes
	
	var timeinput = document.getElementById("percenttime");
	if(timeinput!=null)
	{
		if(MyLib.globaltime>1)
		{ timeinput.setAttribute("max", Math.ceil(MyLib.globaltime)*100 );	}
		else
		{ timeinput.setAttribute("max", 100);	}
	}

	//more points for smaller percent time, to smooth it out.
	//55 points per second, min 80.
	var numpoints = Math.floor(55 * MyLib.globaltime / (MyLib.percenttime / 100))

	if(numpoints>relativepoints.length)
	{numpoints = relativepoints.length}
	if(numpoints<80)
	{numpoints = 80}
		
	var canvaspoints = []
	
	//generate HTML canvas coordinates.
	//Will select a variable number based on the "percent speed" selected.
	//(it won't use all of the relativepoint()'s)
	var i=0;
	var lastpoint = false;
	var interval = relativepoints.length / numpoints
	for(var inc=0; inc<relativepoints.length; inc+=interval)
	{
		i=Math.ceil(inc)
		if(i>=relativepoints.length)
		{
			break;
		}
		
		canvaspoints.push(new CanvasPoint(minmaxes, relativepoints[i]))
	}
		
	//ensure the very last relativepoint gets used, to make it seamless with the floor.
	if(i!=relativepoints.length-1)
	{
		canvaspoints.push(new CanvasPoint(minmaxes, relativepoints[relativepoints.length-1]))
	}

	MyLib.canvaspoints = canvaspoints;  //set it in the global namespace for the draw functions.
}

//In velocity-angle mode, render the little compass next to the input field
//to help the viewers interpret angle values.
function changeangle(angle)
{
	var canvas = document.getElementById("compass");
	canvas.width = 20;
	canvas.height = 20;
    var ctx = canvas.getContext("2d");

	ctx.beginPath();
	ctx.strokeStyle="#000000";	
    ctx.arc(10, 10, 10, 0, 2 * Math.PI, false);
	
	var computedangle = (angle * Math.PI / 180);
	var x = 10 * Math.sin(computedangle)
	var y = 10 * Math.cos(computedangle)
	
	ctx.moveTo(10,10)
	ctx.lineTo(10-x, 10+y)
	ctx.stroke();
	
	ctx.beginPath();
	ctx.strokeStyle="#FF0000";
	ctx.moveTo(10,10)
	ctx.lineTo(10+x, 10-y)
	ctx.stroke();
	
	changeit()
}

//erase canvas, draw the floor, and draw the scale if applicable.
function reset_canvas() {

	var canvas = document.getElementById("demo");		
    canvas.height = cnv.CANVAS_HEIGHT;
    canvas.width = cnv.CANVAS_WIDTH;    

	draw_floor(Number(MyLib.radius), MyLib.minmaxes)
	
	if(MyLib.scale==true)
	{
		draw_scale();
	}
}

function draw_curve_static()
{
	var canvaspoints = MyLib.canvaspoints
	var canvas = document.getElementById("demo");
    var ctx = canvas.getContext("2d");

	//draw a little circle where the coin *started*.
	ctx.beginPath();
	ctx.strokeStyle="#5c6870";
	ctx.arc(canvaspoints[0].x+cnv.X_BUFFER, canvaspoints[0].y+cnv.Y_BUFFER,5,0,2*Math.PI);
	ctx.stroke();
	
	//now render all of the canvaspoints for the coin's calculated path.
	ctx.beginPath();
	ctx.strokeStyle="#000000";
	ctx.moveTo(canvaspoints[0].x+cnv.X_BUFFER, canvaspoints[0].y+cnv.Y_BUFFER);
	
	for(var i=1; i<canvaspoints.length; i++)
	{		
		ctx.lineTo(canvaspoints[i].x+cnv.X_BUFFER, canvaspoints[i].y+cnv.Y_BUFFER)
	}
	
    ctx.stroke();
}



function draw_curve_active()
{
	var canvaspoints = MyLib.canvaspoints
	var canvas = document.getElementById("demo");
    var ctx = canvas.getContext("2d");
	
	canvasthings = reset_canvas()
	
	if(MyLib.movetimeout!=null)
	{	clearTimeout(MyLib.movetimeout); MyLib.movetimeout=null;
		clearTimeout(MyLib.repeattimeout); MyLib.repeattimeout=null; }
	
	var time = MyLib.globaltime
	var i=1;
	
	//draw a little circle where the coin *started*.
	ctx.beginPath();
	ctx.strokeStyle="#5c6870";
	ctx.arc(canvaspoints[0].x+cnv.X_BUFFER, canvaspoints[0].y+cnv.Y_BUFFER,5,0,2*Math.PI);
	ctx.stroke();

	ctx.strokeStyle="#000000"; //reset the stroke style to black.
	
	//Timeouts are better than intervals because they can be adjusted mid-draw,
	//and they will not interfere with each other.
	(function moveline() {    
		MyLib.movetimeout = setTimeout(moveline, (time * (100/MyLib.percenttime))*1000 / canvaspoints.length); //set the next timeout FIRST, so
									//drawing time will not distort "realtime"

		if(i>=canvaspoints.length)
		{  clearTimeout(MyLib.movetimeout); MyLib.movetimeout=null; 
			//necessary so you don't have to wait forever
			//if you adjusted the percent time mid-draw.

			MyLib.repeattimeout = setTimeout(draw_curve_active, cnv.DELAY_BETWEEN_DRAWS * 1000);
			prep_canvas();
			return; 
		}

		ctx.beginPath();
		ctx.moveTo(canvaspoints[i-1].x+cnv.X_BUFFER, canvaspoints[i-1].y+cnv.Y_BUFFER);
		ctx.lineTo(canvaspoints[i].x+cnv.X_BUFFER, canvaspoints[i].y+cnv.Y_BUFFER)
		ctx.stroke();
		i+=1
	})();

	
}





//Custom circle-drawing function to render the station floor.

//depending on the parameters, the station could be HUGE, or very small.
	//If it's huge, I don't want to render the entire floor. Too big!
	//If it's small, I DO want to render the entire floor.
	
//I felt that it would be easier to keep it proportional by doing this
		//together with my canvaspoint()'s,
//rather than simply using the context.arc() function.
function draw_floor(radius, minmaxes)
{	
	
	radius = Number(radius)
	var toconvert = 2 * minmaxes.range / radius
	
	//Double-check here that I'm using valid values for the arc-cosine.
	if(toconvert < 1)
	{
		var floor_start = Math.acos( toconvert )
		var floor_end = Math.acos( -1 * toconvert )
	}
	else{
		var floor_start = 0
		var floor_end = Math.PI
	}
	
	
	var arc = floor_end - floor_start

	var bottomcurve = [] //points for bottom half of circle
	for(var i=floor_start; i<floor_end; i+=arc/100)
	{	
		var x = radius * Math.cos(i)
		var y = -1 * radius * Math.sin(i) + radius //-1, bottom arc!
		var values = new CanvasPoint(minmaxes, x, y)
		bottomcurve.push(values)
	}

	//once more AT floor_end, so there won't be a break if I render the top.
	var x = radius * Math.cos(floor_end)
	var y = -1 * radius * Math.sin(floor_end) + radius //-1, bottom arc!
	var values = new CanvasPoint(minmaxes, x, y)
	bottomcurve.push(values)

	var canvas = document.getElementById("demo");
    var ctx = canvas.getContext("2d");
	
	ctx.beginPath()
	ctx.lineWidth=3; 
	ctx.strokeStyle="#007acc";
	ctx.moveTo(bottomcurve[0].x+cnv.X_BUFFER, bottomcurve[0].y+cnv.Y_BUFFER)
	
	for(var i=1; i<bottomcurve.length; i+=1)
	{
		ctx.lineTo(bottomcurve[i].x+cnv.X_BUFFER, bottomcurve[i].y+cnv.Y_BUFFER)
	}
	ctx.stroke()

	
	//if the top of the station is close to actually appearing, then render it.
	var x=radius*Math.cos(0)
	var y=radius*Math.sin(0) + radius
	var values = new CanvasPoint(minmaxes, x, y)
	if(values.y>-50) 
	{
		var topcurve = []
		for(var i=floor_start; i<floor_end; i+=arc/100)
		{	
			var x = radius * Math.cos(i)
			var y = 1 * radius * Math.sin(i) + radius //+1, top arc!
			var values = new CanvasPoint(minmaxes, x, y)
			topcurve.push(values)
		}

		var x = radius * Math.cos(floor_end)
		var y = 1 * radius * Math.sin(floor_end) + radius //+1, top arc!
		var values = new CanvasPoint(minmaxes, x, y)
		topcurve.push(values)

		ctx.moveTo(topcurve[0].x+cnv.X_BUFFER, topcurve[0].y+cnv.Y_BUFFER)
		
		for(var i=1; i<topcurve.length; i+=1)
		{
			ctx.lineTo(topcurve[i].x+cnv.X_BUFFER, topcurve[i].y+cnv.Y_BUFFER)
		}
		ctx.stroke()
	}
	
	//reset the stroke
	ctx.lineWidth=1;	
	ctx.strokeStyle="#000000";
}


//generate the positions for a scale mark,
//given the angle on a circle where you want to display it and a labeled "value"
function scalemark(radius, angle, minmaxes, pxperfoot, value)
{
	//mark size 10px, means 5px above and below station curve
	//subtract the proper number of feet-per-pixel from the radius to achieve.
	var x1 = (radius - (5 / pxperfoot)) * Math.cos(angle)
	var x2 = (radius + (5 / pxperfoot)) * Math.cos(angle)
	//var x3 = (radius + (30 / pxperfoot)) * Math.cos(angle)
	
	var y1 = (radius - (5 / pxperfoot)) * Math.sin(angle) + radius
	var y2 = (radius + (5 / pxperfoot)) * Math.sin(angle) + radius
	//var y3 = (radius + (20 / pxperfoot)) * Math.sin(angle) + radius
	
	this.start = new CanvasPoint(minmaxes, x1, y1)
	this.end = new CanvasPoint(minmaxes, x2, y2)
	
	var length = value.toString().length;
	var canvasX3 = this.end.x - length*3 + length*3*Math.cos(angle) + 10*Math.cos(angle)
	var canvasY3 = this.end.y - 15*Math.sin(angle) + 3*(Math.sin(angle)+1)
				//the draw coord starts from the bottom. adjust for that.
				//the more "up" on the circle, the more it matters.
				
	this.numberspot = {x : canvasX3, y : canvasY3}
	//this.numberoffsetX = value.toString().length*5
	//this.numberoffsetY = -5 * Math.cos(angle)
	this.value = value
}

//increment the scale nicely to units of 1,2,4,5,10,20,40,50,100,...
//more intuitive for the user.
function scale_increment() {
	this.series = -1;
		
	this.run = function(value) {
		this.series+=1;
		if(this.series==4)
		{
			this.series=0;
		}
		
		if(this.series!=2)
		{
			return value*=2
		}
		else
		{
			return value+=value/4
		}
	}
}

function draw_scale()
{
	//Label the scale so people know what they're looking at.
	if(MyLib.units=="ft")
	{  document.getElementById("scalemessage").innerHTML = "<sup><i>Scale in feet</i></sup>"  }
	else
	{  document.getElementById("scalemessage").innerHTML = "<sup><i>Scale in meters</i></sup>"  }
	
	var radius = MyLib.radius;
	var minmaxes = MyLib.minmaxes;
	
	//the last point is the relative landing position of the coin,
	//which is where the scale should go to.
	var lastpoint = MyLib.relativepoints[MyLib.relativepoints.length-1];

	//angle swept from person to coin's landing position.
	var chord_angle = 2 * Math.asin(lastpoint.dist/(2*radius))
	//var chord_angle = lastpoint.theta_pc //is apparently not equivalent?

	//var curve_dist = radius * chord_angle //total scale distance
											//variable never used.
	
	var start = 3*Math.PI/2  //starting scale angle, always at 3PI/2 (270D)
	
	//show the scale in both directions! 
	//If the coin goes the other way, then display the scale the other way.	
	if(lastpoint.x < 0)
	{	var end = start - chord_angle  } //end scale angle
	else
	{	var end = start + chord_angle  }


	//Match the scale to the canvas. Calculate arc-per-foot, px-per-foot.
	//Or METERS...the math works out the same. I'm not changing variable names.
	//arcperfoot is the variable actually used to calculate tic locations.
	//Pxperfoot is used to generate a scale range that would actually be
	//human-interpretable.
	var pxperfoot = minmaxes.canvasSize / minmaxes.range
	var arc_per_foot = 1 / radius
	
	//Pick a scale distance that fits with > 20 pixels between each tick.
	//Intelligently increment the scale interval to something human-interpretable.
	//Goes 1, 2, 4, 5, 10, 20, 40, 50, 100, 200, 400, 500, 1000...
	var increment=1;
	var increaseval = new scale_increment()
	
	while(pxperfoot*increment<20)
	{
		increment = increaseval.run(increment);
	}

	//if the numbers are long, give it extra space
	//by incrementing the interval once more.
	if(increment.toString().length >= 3)
	{	increment = increaseval.run(increment); }
	
	//generate the locations for the tic marcks, 
	//up to the end spot plus one tic.
	//coded for both a positive arc and a negative arc, depending
	//which way the coin went.
	var i=0;
	var scalemarks = [];
	if(lastpoint.x < 0)
	{
		//incrementing over an angle, so I called it a for angle.
		for(var a=start; a>end-(arc_per_foot*increment); a-=(arc_per_foot*increment))
		{
			scalemarks.push(new scalemark(radius, a, minmaxes, pxperfoot, i) )
			i+=increment;
		}		
	}
	else
	{
		for(var a=start; a<end+(arc_per_foot*increment); a+=(arc_per_foot*increment))
		{
			scalemarks.push(new scalemark(radius, a, minmaxes, pxperfoot, i) )
			i+=increment;
		}		
	}

	//draw the marks	
	var canvas = document.getElementById("demo");
    var ctx = canvas.getContext("2d");
	ctx.font = "10px Arial";

	ctx.beginPath();
	for(var i=0; i<scalemarks.length; i++)
	{
		var mark = scalemarks[i]
		ctx.moveTo(mark.start.x+cnv.X_BUFFER, mark.start.y+cnv.Y_BUFFER)
		ctx.lineTo(mark.end.x+cnv.X_BUFFER, mark.end.y+cnv.Y_BUFFER)
		ctx.fillText(mark.value.toString(), mark.numberspot.x+cnv.X_BUFFER, mark.numberspot.y+cnv.Y_BUFFER);
	}
	ctx.stroke()
}



//Calculate the variables for the model!
//If a velocity is received, then height_thrown is actually the "angle."
function calc_error(diameter, height_start, gs, height_thrown, velocity) {
	var radius = Decimal(diameter/2)
	
	var accel_earth
	
	//Get acceleration at floor.
	if(MyLib.units=="ft")
	{	
		accel_earth = 32.174; // ft/s/s
	} else
	{
		accel_earth = 9.80665; // m/s/s, exact conventional standard
	}
	
	var g_accel = accel_earth * gs;
	
	//CALCULATE!!! /////////////////////////////////////////
	////////////////////////////////////////////////////////
	
	var standingvelocity = Decimal.sqrt( g_accel * radius )
	
	//Get variables and perform calculations here.
	//Accurate up to about 15 decimals (17?)
	
	//get forces on the ball
	//a = omega^2 * r  eqn with rotational velocity
	var omega = Decimal.sqrt( g_accel / radius );
	
	var r_onball = radius - height_start;

	var g_onball = omega*omega*r_onball;

	//Now get the starting velocities.
	//start_v_y is calculated as if you launched with Earth's gravity.
	//var start_v_y = Math.sqrt( 2 * accel_earth * height_thrown ) 
	//var start_v_x = -1 * Math.sqrt( g_onball * r_onball ) //-1 b/c station is rotating clockwise
	
	var standingcoin = Decimal(-1).mul( Decimal.sqrt( g_onball * r_onball ) ) //-1 b/c station is rotating clockwise

	if(document.getElementById('up').checked)
	{
		var start_v_y = Decimal.sqrt( 2 * accel_earth * height_thrown )
		MyLib.start_v_y = round(start_v_y);
		var throw_v_x = 0;
		var start_v_x = standingcoin
	}
	else
	{
		var angle = height_thrown; //override inputs.
		var computedangle = (-1* angle * Math.PI / 180) + (Math.PI / 2);

		var throw_v_x = Decimal(velocity * Math.cos(computedangle))
		
		var start_v_x = throw_v_x.add(standingcoin)
		var start_v_y = Decimal(velocity * Math.sin(computedangle))
	}
	
	//slope of ball's path
	//var slope_ball = start_v_y / start_v_x
	var slope = start_v_y.div( start_v_x )
	
	//if it goes perfectly straight up, the slope will not be finite.
	//(for example, thrown at the exact radius of the station)
	if ( !slope.isFinite() && start_v_y != 0 )
	{
		var time = ((Decimal(2).mul(radius)).sub(height_start)).div(start_v_y)
		var x_f = Decimal(0)
		var y_f = radius
		var maxheight = radius
	}
	else
	{
		variables = crunch_numbers( radius, g_accel, omega, start_v_y, start_v_x, r_onball )
		var time = variables.time
		var x_f = variables.x_f
		var y_f = variables.y_f
		var maxheight = variables.maxheight		
	}
	
	//radial angle swept by the person
	
	//var theta_traversed_person = omega * time
	//var initial_angle_person = (3 * Math.PI) / 2
	//var final_angle_person = initial_angle_person - theta_traversed_person //minus b/c clockwise rotation
	var theta_traversed_person = omega.mul( time )
	var initial_angle_person = (Decimal(3).mul(MyLib.PI)).div(2)
	var final_angle_person = initial_angle_person.sub(theta_traversed_person)
	
	
	//final position of person
	//fortunately Javascript uses radians, not degrees
	
	//var xf_person = radius * Math.cos(final_angle_person)
	//var yf_person = radius * Math.sin(final_angle_person)
	var xf_person = radius.mul(Decimal.cos(final_angle_person) )
	var yf_person = radius.mul(Decimal.sin(final_angle_person) )
	
	//var x_difference = xf_person - x_2
	//var y_difference = yf_person - y_2	
	//var total_difference = Math.sqrt( Math.pow(x_difference,2) + Math.pow(y_difference,2) )
	
	var x_difference = xf_person.sub( x_f )
	var y_difference = yf_person.sub( y_f )
	var total_difference = Decimal.sqrt( Decimal.pow(x_difference,2).add(Decimal.pow(y_difference,2) ) )
	
	
	/////SOLVE FOR A LIST OF ABSOLUTE POINTS ALONG PATH/////////////
	////////////////////////////////////////////////////////////////
	//These calculations apparently do not require as much precision.
	//I apparently do not need the Decimal module for this part.
	
	var absolutepoints = []
	
	//get ~240 increments per second, but min 240 increments, max 3000 increments.
	//It won't SHOW that many, but if the user shows at 50% speed, then I'll want them.
	if(Number(time)<1.2)
	{ var time_increment = Number(time.div(240)) }
	else if(Number(time)>30)
	{ var time_increment = Number(time.div(3000)) }
	else
	{ var time_increment = .0044; }
	
	//var time_increment = Number(time.div(150))

	if(slope.isFinite())
	{
		for(var t=0; t<=Number(time); t+=time_increment)
		{
			var absolutePoints = new AbsolutePoints( t, Number(radius), Number(omega), Number(slope), Number(height_start), Number(start_v_x) )
			absolutepoints.push(absolutePoints)
		}
		
		//do it once more at t = time.
		var absolutePoints = new AbsolutePoints( Number(time), Number(radius), Number(omega), Number(slope), Number(height_start), Number(start_v_x) );
		absolutepoints.push( absolutePoints );			
	}
	else
	{
		for(var t=0; t<=Number(time); t+=time_increment)
		{
			var absolutePoints = new AbsolutePointsVertical( t, Number(radius), Number(omega), Number(slope), Number(height_start), Number(start_v_y) )
			absolutepoints.push(absolutePoints)
		}
		
		//do it once more at t = time.
		var absolutePoints = new AbsolutePointsVertical( Number(time), Number(radius), Number(omega), Number(slope), Number(height_start), Number(start_v_y) );
		absolutepoints.push( absolutePoints );
	}
	
	//point = new RelativePoint( Number(time), Number(radius), Number(omega), Number(slope), Number(height_start), Number(start_v_x) )
	
	//point = new RelativePoint( 0.25, Number(radius), Number(omega), Number(slope), Number(height_start), Number(start_v_x) )
	
	var relativepoints = []
	for(var i=0; i<absolutepoints.length; i++)
	{
		relativepoints.push( new RelativePoint( absolutepoints[i] ) )
	}

	MyLib.relativepoints = relativepoints
	MyLib.radius = Number(radius)


	if(start_v_y > 0)
	{			
		//var expectedheight = height_start + height_thrown; //works out exactly the same for case throw "up"

		var expectedheight = (Math.pow(start_v_y,2) / (2 * accel_earth)) + height_start;
		var expectedtime = Decimal.sqrt( 2 * expectedheight / accel_earth ).add(start_v_y / accel_earth) //same formula as throw "up"
	}
	else
	{
		var expectedheight = height_start;
		
		var end_v_y = -1 * Math.sqrt( Math.pow(start_v_y,2) + 2*accel_earth*height_start )
		var expectedtime = Math.abs(2 * height_start / (Number(start_v_y) + end_v_y))
	}

	var expecteddist = throw_v_x * expectedtime

	
	var answers = {
		maxheight: maxheight,
		g_accel: g_accel,
		radius: radius,
		standingvelocity: standingvelocity,
		standingcoin: standingcoin,
		start_v_y:start_v_y,
		expecteddist : Math.abs(expecteddist),
		expectedtime : expectedtime,
		expectedheight : expectedheight,
		omega: omega,
		total_difference: total_difference,
		time: time,
		accel_earth: accel_earth,
		g_onball : g_onball
	}
	
	
	return answers
}



//finds the coin's landing position on the circle, and max height achieved.
function crunch_numbers( radius, g_accel, omega, start_v_y, start_v_x, r_onball )
{
	//Now find intersection with the circle.

	if(Math.abs(start_v_x) < 1e-13)
	{ start_v_x=Decimal(0) }
	if(Math.abs(start_v_y) < 1e-13)
	{ start_v_y=Decimal(0) }
	
	//slope of ball's path
	//var slope_ball = start_v_y / start_v_x
	var slope = start_v_y.div( start_v_x )
	
	//two possible forms of quadratic equation for both x and y.
	//Solve for x_1, x_2, y_1, y_2.
	//Punch in the x answer to absolute value y-equations to match up
	//to the correct y before doing quadratic again for y.
	//sqroot1 and sqroot2 are intermediate calculations.
	//sqroot1 is needed for the x calculation, and sqroot2 is needed for y.	
	
	//var sqroot1 = Math.sqrt( Math.pow(slope_ball,2) * Math.pow(r_onball,2) - ((1 + Math.pow(slope_ball,2)) * ( Math.pow(r_onball,2) - Math.pow(radius,2)  )) )
	var sqroot1 = Decimal.sqrt( Decimal.pow(slope,2).mul(Decimal.pow(r_onball,2)).sub((Decimal(1).add(Decimal.pow(slope,2))).mul( Decimal.pow(r_onball,2).sub(Decimal.pow(radius,2)  )) ) )

	//var sqroot2 = Math.sqrt( Math.pow(r_onball,2) - ( 1 + Math.pow(slope,2) ) * ( Math.pow(r_onball,2) - Math.pow(radius,2) * Math.pow(slope,2) ) )
	var sqroot2 = Decimal.sqrt( Decimal.pow(r_onball,2).sub(( Decimal(1).add(Decimal.pow(slope,2) ) ).mul(Decimal.pow(r_onball,2).sub(Decimal.pow(radius,2).mul(Decimal.pow(slope,2))))) )
		
	if(Number(slope)<0 && Number(start_v_x) < 0)
	{
		//var x_2 = ( (slope * r_onball) - sqroot1 ) / ( 1 + Math.pow(slope,2)) // -
		//var y_2_abs = Math.sqrt(Math.pow(radius,2) - Math.pow(x_2,2) )
		//var y_2 = ( (-1 * r_onball) + sqroot2 ) / ( 1 + Math.pow(slope,2) ) // +
		
		//Apparently the (-) from the Y eqn goes with the (+) in the X eqn, just to be confusing.		
		
		var x_2 = ( (slope.mul( r_onball)).sub( sqroot1 )).div( Decimal(1).add( Decimal.pow(slope,2)) ) // -
		var y_2 = ( new Decimal(-1 * r_onball).add( sqroot2 ) ).div( new Decimal(1).add(Decimal.pow(slope,2) ) ) // +
	}
	else if(slope > 0 && Number(start_v_x) > 0)
	{
		//var x_1 = ( (slope * r_onball) + sqroot1 ) / ( 1 + Math.pow(slope,2)) // +
		//var x_1 = ((slope.mul(r_onball)).add(sqroot1)).div( Decimal(1).add(Decimal.pow(slope,2)))
		
		var x_1 = ((slope.mul(r_onball)).add(sqroot1)).div( Decimal(1).add(Decimal.pow(slope,2))) //+
		var y_2 = ( new Decimal(-1 * r_onball).add( sqroot2 ) ).div( new Decimal(1).add(Decimal.pow(slope,2) ) ) // +		
		
		var x_2 = x_1
	}
	else if(slope < 0 && Number(start_v_y) < 0)
	{
		var x_1 = ((slope.mul(r_onball)).add(sqroot1)).div( Decimal(1).add(Decimal.pow(slope,2))) //+
		var y_1 = ((Decimal(-1).mul(r_onball)).sub( sqroot2 )).div( Decimal(1).add( Decimal.pow(slope,2)) ) // -
		
		var x_2 = x_1
		var y_2 = y_1
	}
	else //if((slope > 0 && Number(start_v_x) < 0) || slope == 0 )
	{
		//var y_1_abs = Math.sqrt(Math.pow(radius,2) - Math.pow(x_1,2) ) 
		//var y_1 = ( (-1 * r_onball) - sqroot2 ) / ( 1 + Math.pow(slope,2) ) // -
		
		var x_2 = ( (slope.mul( r_onball)).sub( sqroot1 )).div( Decimal(1).add( Decimal.pow(slope,2)) ) // -
		var y_1 = ((Decimal(-1).mul(r_onball)).sub( sqroot2 )).div( Decimal(1).add( Decimal.pow(slope,2)) ) // -
		
		var y_2 = y_1  //the later equations simply reference y_2.
					   //Keep it standard.
	}	
	
	
	//total (absolute) starting velocity
	//var start_vtotal = Math.sqrt( Math.pow(start_v_x,2) + Math.pow(start_v_y,2) )
	var start_vtotal = Decimal.sqrt( Decimal.pow(start_v_x,2).add(Decimal.pow(start_v_y,2) ) )
	
	//Get the time in the air, now that we know the landing spot.
	//var time = Math.sqrt( Math.pow(x_2,2) + Math.pow( ( y_2 + r_onball ),2 ) ) / start_vtotal
	var time = Decimal.sqrt( Decimal.pow(x_2,2).add(( y_2.add(r_onball )).pow(2) )).div( start_vtotal )
	
	///MAX HEIGHT/////////////////////////////////////
	//////////////////////////////////////////////////

	//a maximization function.
	//This would have made more sense if I did it in reference to time instead.
	//Oh well.

	if(Number(start_v_y) > 0)
	{
		//Starting values
		var test_x = start_vtotal*(time/10) //Starting test increment
		var direction = -1  //iterate leftwards to start.
		var maxvalue = radius.sub(r_onball)  //start with initial height
		var current_x = 0    //ball goes left. Negative.
		var current_y = 0
		var current_value = 0
		var disttocenter = 0
		var lastvalue = 0
		var timesinarow = 0
		
		for(i=0; i<1000; i++)
		{
			current_x = current_x + (test_x * direction)
			
			//y = mx + b
			current_y = (slope * current_x) - r_onball
			
			//pythagoras, to find distance to ball from center of station
			disttocenter = Decimal.sqrt( Math.pow(current_x,2) +Math.pow(current_y,2) )
			
			current_value = radius - disttocenter
			
			if(current_value<lastvalue)
			{  //if the values are decreasing
				//then it's the wrong direction.
				direction = direction * -1;
				test_x = test_x / 2;
			}

			if(current_value > maxvalue)
			{ maxvalue = current_value  }
			
			if( Math.abs(current_value - lastvalue) < .0001 )
			{ timesinarow += 1	}
			else
			{ timesinarow = 0 }
			
			if(timesinarow == 5)
			{
				break;
			}
			
			lastvalue = current_value;
		}
	}
	else //if it was thrown downwards
	{
		var maxvalue = radius - r_onball;
	}
	
	return {
		maxheight:maxvalue,
		x_f : x_2,
		y_f : y_2,
		time: time
	}
}



//What happens after the person pushes the submit button...
function submit_values() {
	//Get variables
    var height_start = Number(document.getElementById("heightstart").value);
    var diameter = Number(document.getElementById("diameter").value);
	var gs = Number(document.getElementById("percentgravity").value) / 100;

	if(!(MyLib.movetimeout==null))
	{ clearTimeout(MyLib.movetimeout); 
		MyLib.movetimeout=null; }

	//clear the output fields.
	//////////////////////////
	document.getElementById("centripaccel").innerHTML = ""
	document.getElementById("standingvelocity").innerHTML = ""
	document.getElementById("standingcoin").innerHTML = ""
	document.getElementById("standingvelocity2").innerHTML = ""
	document.getElementById("standingvelocityunits2").innerHTML = ""
	document.getElementById("rotationalvelocity").innerHTML = ""
	document.getElementById("finalseparation").innerHTML = ""
	document.getElementById("finalseparation2").innerHTML = ""
	document.getElementById("expecteddist2").innerHTML = ""
	document.getElementById("expecteddistunits2").innerHTML = ""
	document.getElementById("finalseparationunits2").innerHTML = ""
	document.getElementById("verticalvelocity").innerHTML = "";
	document.getElementById("verticalvelocity2").innerHTML = "";
	document.getElementById("verticalvelocityunits").innerHTML = "";
	document.getElementById("verticalvelocityunits2").innerHTML = "";
	document.getElementById("timeinair").innerHTML = "";
	document.getElementById("timeinairunits").innerHTML = "";

	if(document.getElementById('up').checked)
	{
		var height_thrown = Number(document.getElementById("heightthrown").value);		
		var answers = calc_error( diameter, height_start, gs, height_thrown )
	}
	else
	{
		var angle = Number(document.getElementById("angle").value);
		var velocity = Number(document.getElementById("velocity").value);
		var answers = calc_error( diameter, height_start, gs, angle, velocity )
	}
	MyLib.globaltime = Number(answers.time)

	prep_canvas();
	reset_canvas();
	
	if(MyLib.repeattimeout!=null || MyLib.movetimeout!=null)
	{
		draw_curve_active();
	}
	else
	{
		draw_curve_static();
	}
	
	//expected values
	document.getElementById("expectedheight").innerHTML = round( answers.expectedheight )
	document.getElementById("expectedheightunits").innerHTML = 	"&nbsp;" + MyLib.units
	document.getElementById("expectedtime").innerHTML = round( answers.expectedtime )
	document.getElementById("expectedtimeunits").innerHTML = "&nbsp;s"
	document.getElementById("expecteddist").innerHTML = round(answers.expecteddist)
	document.getElementById("expecteddistunits").innerHTML = 	"&nbsp;" + MyLib.units

	
	document.getElementById("maxheightachieved").innerHTML = round(answers.maxheight);
	document.getElementById("maxheightachievedunits").innerHTML = MyLib.units;
	
	//produce output.//////////////////////////////////////
	///////////////////////////////////////////////////////
	
	document.getElementById("centripaccel").innerHTML = round(answers.g_accel).toString()
	document.getElementById("coinaccel").innerHTML = round(answers.g_onball).toString()
	
	
	document.getElementById("standingvelocity").innerHTML = round(answers.standingvelocity).toString()

	if(document.getElementById('up').checked)
	{
		var verticalvelocity = answers.start_v_y
	}
	else{
		var verticalvelocity = velocity
	}

	document.getElementById("verticalvelocity").innerHTML = round(verticalvelocity).toString()
	document.getElementById("standingcoin").innerHTML = round(Math.abs(answers.standingcoin)).toString()
	
	//Show velocity values.
	if(MyLib.units=="ft")
	{
		document.getElementById("centripaccelunits").innerHTML = "&nbsp;ft/s/s"
		document.getElementById("coinaccelunits").innerHTML = "&nbsp;ft/s/s"
		document.getElementById("standingvelocityunits").innerHTML = "&nbsp;ft/s"
		document.getElementById("standingcoinunits").innerHTML = "&nbsp;ft/s"
		document.getElementById("verticalvelocityunits").innerHTML = "&nbsp;ft/s"
		
		
		var standingvelocity2 = answers.standingvelocity * 0.681818
		var standingcoin2 = Math.abs(answers.standingcoin * 0.681818)
		var verticalvelocity2 = verticalvelocity * 0.681818
		document.getElementById("standingvelocity2").innerHTML = "(" + round(standingvelocity2).toString();
		document.getElementById("standingcoin2").innerHTML = "(" + round(standingcoin2).toString();
		document.getElementById("standingvelocityunits2").innerHTML = "&nbsp;mph)";		
		document.getElementById("standingcoinunits2").innerHTML = "&nbsp;mph)";		
		document.getElementById("verticalvelocity2").innerHTML = "(" + round(verticalvelocity2).toString();
		document.getElementById("verticalvelocityunits2").innerHTML = "&nbsp;mph)";
		
	} else if(MyLib.units=="m")
	{
		document.getElementById("centripaccelunits").innerHTML = "m/s/s"
		document.getElementById("coinaccelunits").innerHTML = "m/s/s"
		document.getElementById("standingvelocityunits").innerHTML = "m/s";
		document.getElementById("standingcoinunits").innerHTML = "m/s";
		document.getElementById("verticalvelocityunits").innerHTML = "m/s";
		
		var standingvelocity2 = answers.standingvelocity * 3.6;
		var standingcoin2 = Math.abs(answers.standingcoin * 3.6);
		var verticalvelocity2 = verticalvelocity * 3.6;
		document.getElementById("standingvelocity2").innerHTML = "(" + round(standingvelocity2).toString();
		document.getElementById("standingcoin2").innerHTML = "(" + round(standingcoin2).toString();
		document.getElementById("standingvelocityunits2").innerHTML = "km/h)";
		document.getElementById("standingcoinunits2").innerHTML = "km/h)";
		document.getElementById("verticalvelocity2").innerHTML = "(" + round(verticalvelocity2).toString();
		document.getElementById("verticalvelocityunits2").innerHTML = "km/h)";
	}
	
	var rotational_units = "rev/s" //not likely. But I validate below.
	var rotation = answers.omega / (2 * Math.PI);
	if(rotation < 1)
	{
		rotational_units = "&nbsp;rpm"
		rotation = rotation * 60;
	}
	
	if(rotation < 1)
	{
		rotational_units = "rev/hr"
		rotation = rotation * 60;	
	}
	document.getElementById("rotationalvelocity").innerHTML = round(rotation).toString()
	document.getElementById("rotationalvelocityunits").innerHTML = rotational_units
	
	document.getElementById("finalseparation").innerHTML = round(answers.total_difference).toString()
	document.getElementById("finalseparationunits").innerHTML = MyLib.units
	
	document.getElementById("expecteddist").innerHTML = round( Math.abs(answers.expecteddist) )
	document.getElementById("expecteddistunits").innerHTML = "&nbsp;" + MyLib.units

	document.getElementById("timeinair").innerHTML = round(answers.time).toString()
	document.getElementById("timeinairunits").innerHTML = "s"
	
	
	if(answers.total_difference < 1.0)
	{	
		document.getElementById("conditionalbreak").className = ""

		if(MyLib.units=="ft")
		{
			var finalseparation2 = answers.total_difference * 12
			document.getElementById("finalseparation2").innerHTML = "(" + round(finalseparation2).toString();
			document.getElementById("finalseparationunits2").innerHTML = "in)";
		}
		
		if(MyLib.units=="m")
		{
			var finalseparation2 = answers.total_difference * 100
			document.getElementById("finalseparation2").innerHTML = "(" + round(finalseparation2).toString();
			document.getElementById("finalseparationunits2").innerHTML = "cm)";
		}
	}
	else
	{
		document.getElementById("conditionalbreak").className = "hide"
	}
	
	if(answers.expecteddist < 1.0 && answers.expecteddist != 0)
	{	
		document.getElementById("conditionalbreak2").className = ""

		if(MyLib.units=="ft")
		{
			var expecteddist2 = answers.expecteddist * 12
			document.getElementById("expecteddist2").innerHTML = "(" + round(expecteddist2).toString();
			document.getElementById("expecteddistunits2").innerHTML = "in)";
		}
		
		if(MyLib.units=="m")
		{
			var expecteddist2 = answers.expecteddist * 100
			document.getElementById("expecteddist2").innerHTML = "(" + round(expecteddist2).toString();
			document.getElementById("expecteddistunits2").innerHTML = "cm)";
		}
	}
	else
	{
		document.getElementById("conditionalbreak2").className = "hide"
	}
	

	//ERRORS///////////////////////////////////////////
	///////////////////////////////////////////////////
	//no longer used. Was previously used to flash annoying messages
	//on the screen if the launch is an "unrealistic scenario."
	var errortext = ""
	document.getElementById("error").innerHTML = errortext
}




//Self-invoking function handles window resizing.
//I want the drawing canvas to adaptively adjust to the width of the page,
//if the page shrinks to smaller than the CSS-selected canvas max-width.
(function() {
	var
	// Obtain a reference to the canvas element using its id.
	htmlCanvas = document.getElementById('demo'),
	// Obtain a graphics context on the canvas element for drawing.
	context = htmlCanvas.getContext('2d');

   // Start listening to resize events and draw canvas.
   initialize();

   function initialize() {
	   // Register an event listener to call the resizeCanvas() function 
	   // each time the window is resized.
	   window.addEventListener('resize', resizeCanvas, false);
	   // Draw canvas border for the first time.
	   resizeCanvas();
	}

	// Display custom canvas. In this case it's a blue, 5 pixel 
	// border that resizes along with the browser window.
	function redraw() {  //not being used
	   context.strokeStyle = 'blue';
	   context.lineWidth = '5';
	   context.strokeRect(0, 0, window.innerWidth, window.innerHeight);
	}

	// Runs each time the DOM window resize event fires.
	// Resets the canvas dimensions to match window,
	// then draws the new borders accordingly.
	function resizeCanvas() {
		var clientWidth = htmlCanvas.parentElement.clientWidth;

		//only resize if the parent's width has actually changed, and if this width is actually less than the max.
		if(clientWidth != cnv.clientWidth && (clientWidth < cnv.canvasMax || cnv.clientWidth < cnv.canvasMax) )
		{
			cnv.clientWidth = clientWidth;
			cnv.CANVAS_WIDTH = htmlCanvas.parentElement.clientWidth;

			//htmlCanvas.width = htmlCanvas.parentElement.clientWidth;
			//htmlCanvas.height = window.innerHeight;
			//redraw();
			cnv.CANVAS_HEIGHT = 300
			cnv.X_BUFFER = cnv.CANVAS_WIDTH/10
			cnv.Y_BUFFER = cnv.CANVAS_HEIGHT/15
			cnv.DRAWING_WIDTH = cnv.CANVAS_WIDTH - 2 * cnv.X_BUFFER
			cnv.DRAWING_HEIGHT = cnv.CANVAS_HEIGHT - 2 * cnv.Y_BUFFER
			if(MyLib.relativepoints.length!=0 && MyLib.repeattimeout==null)
			{
				reset_canvas();
				draw_curve_static()
			}
			else if(MyLib.relativepoints.length!=0)
			{
				clearTimeout(MyLib.repeattimeout);
				clearTimeout(MyLib.movetimeout);
				MyLib.repeattimeout=null;
				MyLib.movetimeout=null;

				reset_canvas();
				draw_curve_active();				
			}
		}
	}
})();