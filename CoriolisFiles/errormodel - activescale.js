
var units = "ft";  //declares the unit type the page is using, either "ft" or "m".
var allatonce = false; //used so that some functions can change all the values
					   //and submit only once.

if(typeof standalone === 'undefined')
{
	var standalone = false;
}

var cnv = {}; //Canvas variable namespace

//namespace
var MyLib = {}
MyLib.PI = Decimal.acos(-1);  //more accurate than Math.PI
MyLib.percenttime = 100;
MyLib.scale=false;
MyLib.points = []
MyLib.globaltime = null;
MyLib.repeattimeout = null;
MyLib.moveinterval = null;

//these are so the scale can be drawn in real-time mode, right when it's selected
//(instead of waiting)
MyLib.radius = null;
MyLib.minmaxes = null;

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
		cnv.CANVAS_WIDTH = htmlCanvas.parentElement.clientWidth;

		//htmlCanvas.width = htmlCanvas.parentElement.clientWidth;
		//htmlCanvas.height = window.innerHeight;
		//redraw();
		cnv.CANVAS_HEIGHT = 300
		cnv.X_BUFFER = cnv.CANVAS_WIDTH/10
		cnv.Y_BUFFER = cnv.CANVAS_HEIGHT/15
		cnv.DRAWING_WIDTH = cnv.CANVAS_WIDTH - 2 * cnv.X_BUFFER
		cnv.DRAWING_HEIGHT = cnv.CANVAS_HEIGHT - 2 * cnv.Y_BUFFER
		if(MyLib.points.length!=0 && MyLib.repeattimeout==null)
		{
			canvasthings = prep_canvas();
			draw_curve_static(canvasthings.canvaspoints)
		}
	}
})();


DELAY_BETWEEN_DRAWS = 2.5 //seconds to wait until next draw, when looping.

Decimal.set({ precision: 30 });  //accuracy of 30 decimals for the initial calculation



//Set the fields after initially loading the page.
function setfields() {
	allatonce=true;
	
	//mouseover=true;
	var percentgravity = 100;
	
	document.getElementById("heightperson").value = 4
	document.getElementById("diameter").value = 50
	document.getElementById("heightthrown").value = 3
	document.getElementById("percentgravity").value = percentgravity
	
	outputgs(percentgravity)
	
	document.getElementById('imperial').checked = true;
	units="ft"
	setunits(units);

	allatonce=false;
	
	submit_values()
	
	var checkboxtime = document.getElementsByTagName('checktime');
	checkboxtime.checked=false;
}

//the starting height cannot be greater than the diameter of the station.
function changeDiameter(value) {
	document.getElementById("heightperson").setAttribute("max",value);
	changeit();
}

function changescale(checkboxElem) {
  if (checkboxElem.checked) {
	  MyLib.scale=true;
	  draw_scale();
	  //EXTRA_X_BUFFER=25;  //It was a good idea. But no.
  } else {
	  MyLib.scale=false;
	  //EXTRA_X_BUFFER=0;
  }
  if(MyLib.repeattimeout==null)
  {
	canvasthings = prep_canvas()
	draw_curve_static(canvasthings.canvaspoints)
  }
}

function changecheck(checkboxElem) {
  if (checkboxElem.checked) 
  {
		var timediv = document.getElementById("percenttimediv")
		
		timediv.innerHTML="&#8195;&#8194;Speed&#160;<input type='number' step='1' min='0' max='500' style='width:63px' id='percenttime' value='100' onchange='changepercenttime(this.value)'/>";
		MyLib.percenttime=100;
		
		timediv.className = "percentsign";
		
		timeinput = document.getElementById("percenttime")
		if(MyLib.globaltime>1)
		{ timeinput.setAttribute("max", Math.floor(MyLib.globaltime)*100 );	}
		else
		{ timeinput.setAttribute("max", 100 );	}
		
		if(standalone!=true)
		{
			document.getElementById("outertime").style.marginTop="-29px";
		}
		else
		{
			document.getElementById("outertime").style.marginTop="-19px";
		}

		set_time_interval();
		
  } else {
	  stop_time_interval();
  }
}


function set_time_interval()
{
	if(MyLib.moveinterval!=null)
	{ clearInterval(MyLib.moveinterval); MyLib.moveinterval=null;	}

	if(MyLib.repeattimeout!=null)
	{ clearTimeout(MyLib.repeattimeout); MyLib.repeattimeout=null; }
	var time = MyLib.globaltime;

	//intervals were being too buggy for this one.
	//An interval created by an interval== not a good idea.
	(function repeatdraw() {    
		canvasthings = prep_canvas()
		draw_curve_active(canvasthings.canvaspoints)
		
		MyLib.repeattimeout = setTimeout(repeatdraw, ((MyLib.globaltime * (100/MyLib.percenttime)) + DELAY_BETWEEN_DRAWS) * 1000);
	})();
}

function stop_time_interval()
{
	clearTimeout(MyLib.repeattimeout);
	clearInterval(MyLib.moveinterval);
	MyLib.repeattimeout=null;
	MyLib.moveinterval=null;
	
	document.getElementById("percenttimediv").innerHTML=""
	document.getElementById("percenttimediv").className = "";
	document.getElementById("outertime").style.marginTop="0px";
	
	canvasthings = prep_canvas()
	draw_curve_static(canvasthings.canvaspoints)
}

function changepercenttime(value)
{
	MyLib.percenttime = value;
	clearTimeout(MyLib.repeattimeout);
	clearInterval(MyLib.moveinterval);
	set_time_interval()
}

//Activated by radiobutton, user changes the unit setting.
function convertunits(setting) {
    allatonce=true; //this changes ALL of the unit fields. 
					//boolean to prevent submission until the end of the function.
	setunits(setting)
	
	if(units=="ft" && setting=="m")
	{
		document.getElementById("heightperson").value = round(to_meters(document.getElementById("heightperson").value) )
		document.getElementById("diameter").value = round(to_meters(document.getElementById("diameter").value) )
		document.getElementById("heightthrown").value = round(to_meters(document.getElementById("heightthrown").value) )
	} else if(units=="m" && setting=="ft")
	{
		document.getElementById("heightperson").value = round(to_feet(document.getElementById("heightperson").value) )
		document.getElementById("diameter").value = round(to_feet(document.getElementById("diameter").value) )
		document.getElementById("heightthrown").value = round(to_feet(document.getElementById("heightthrown").value) )
	}	
	units = setting;
	allatonce=false;
	submit_values()
}

//change the units displayed in the table, after changing the unit setting
function setunits(setting) {
	if(setting=="m")
	{ var changeto="metric" }
	else if(setting=="ft")
	{ var changeto="imperial" }

	document.getElementById("heightpersonunits").className = changeto;
    document.getElementById("diameterunits").className = changeto;
    document.getElementById("heightthrownunits").className = changeto;
	document.getElementById("expecteddistunits").className = changeto;
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

function outputgs(percentgravity)
{	
	gs = percentgravity / 100
	//Tell the user what the gravity is.
	if(gs!=1) {
		document.getElementById("gravitygs").innerHTML = gs.toString() + " g's"; //, g_accel.toString(), " ", units, "/s/s");
	} else {
		document.getElementById("gravitygs").innerHTML = "1 g";
	}
}

function to_meters(feet)
{ return feet * 0.3048 } //defined exactly by the National Bureau of Standards.

function to_feet(meters)
{ return meters * 3.2808333333 }
	
	
function changeit()
{
	if(allatonce == false)
	{
		submit_values()
	}
}
	

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


function CanvasPoint(minmaxes, x, y) {
	//canvasPoint can accept either X and Y coordinates or a RelativePoint.
	if(!(typeof x=="number"))
	{ y = x.y; x=x.x; }
	
	var canvasX = ((x - minmaxes.minX) / minmaxes.range) * minmaxes.canvasSize
	var canvasY = cnv.DRAWING_HEIGHT - (( y / minmaxes.range ) * minmaxes.canvasSize )
	
	this.x = canvasX;
	this.y = canvasY;
}


function minmax(pointlist) {
	var minX=pointlist[0].x
	var maxX=pointlist[0].x
	var minY=0 //definitely need to show the original floor.
	
	//the coin toss assumes a 6-ft person :-)
	//I'd ideally like to put that person into the window.
	if(units=="ft")
	{
		var maxY=6 
	}
	else
	{
		var maxY = 1.829 //meters
	}
	//var maxY=pointlist[0].y

	
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
				 //rangeX: (maxX - minX),
				 //rangeY: (maxY - minY),
				 range: range,
				 canvasSize: canvasSize }
	return minmaxes
}


function prep_canvas() {

	var canvas = document.getElementById("demo");		
    canvas.height = cnv.CANVAS_HEIGHT;
    canvas.width = cnv.CANVAS_WIDTH;    

	var relativepoints = MyLib.points
	var minmaxes = minmax(relativepoints)
	MyLib.minmaxes = minmaxes
	
	var timeinput = document.getElementById("percenttime");
	if(timeinput!=null)
	{
		if(MyLib.globaltime>1)
		{ timeinput.setAttribute("max", Math.floor(MyLib.globaltime)*100 );	}
		else
		{ timeinput.setAttribute("max", 100);	}
	
		//more points for smaller percent time, to smooth it out.
		var numpoints = 55 * MyLib.globaltime / (percenttime.value / 100)
	
		if(numpoints>relativepoints.length)
		{numpoints = relativepoints.length}
		if(numpoints<90)
		{numpoints = 90}
	}
	else
	{ numpoints = 120 }


		
	var canvaspoints = []
	
	//generate HTML canvas coordinates.
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
		
	//ensure the very last canvaspoint gets pushed, to make it seamless.
	if(i!=relativepoints.length-1)
	{
		canvaspoints.push(new CanvasPoint(minmaxes, ))
	}

	draw_floor(Number(answers.radius), minmaxes)
	
	if(MyLib.scale==true)
	{
		draw_scale();
	}
	
	return { canvaspoints: canvaspoints,
			 minmaxes: minmaxes	}
}

function draw_curve_static(canvaspoints)
{
	var canvas = document.getElementById("demo");
    var ctx = canvas.getContext("2d");

	ctx.moveTo(canvaspoints[0].x+cnv.X_BUFFER, canvaspoints[0].y+cnv.Y_BUFFER);
	
	for(var i=1; i<canvaspoints.length; i++)
	{		
		ctx.lineTo(canvaspoints[i].x+cnv.X_BUFFER, canvaspoints[i].y+cnv.Y_BUFFER)
	}
	
    ctx.stroke();
}



function draw_curve_active(canvaspoints)
{
	var canvas = document.getElementById("demo");
    var ctx = canvas.getContext("2d");
	
	if(!(MyLib.moveinterval==null))
	{	clearInterval(MyLib.moveinterval); MyLib.moveinterval=null; }
	
	var time = MyLib.globaltime
	var i=1;
	
	window.MyLib.moveinterval = setInterval(function() {
		
		if(i>=canvaspoints.length)
		{  clearInterval(MyLib.moveinterval); MyLib.moveinterval=null; ctx=null; return; }
		//move to starting point. Maybe it will save processing 
		//if I don't have to move every increment?
		//it must happen within the interval function, or the context gets confused.
			
		//if(i==1)  //necessary to comment out if I allow
		//{			//drawing the scale in realtime
			ctx.moveTo(canvaspoints[i-1].x+cnv.X_BUFFER, canvaspoints[i-1].y+cnv.Y_BUFFER);
		//}
		
		ctx.lineTo(canvaspoints[i].x+cnv.X_BUFFER, canvaspoints[i].y+cnv.Y_BUFFER)
		ctx.stroke();
		
		i+=1
			
	}, ( (time * (100/MyLib.percenttime))*1000 / canvaspoints.length) );
	
}



//Custom circle-drawing function to render the station floor.

//depending on the parameters, the station could be HUGE, or very small.
	//If it's huge, I don't want to render the entire floor. Too big!
	//If it's small, I DO want to render the entire floor.

function draw_floor(radius, minmaxes)
{	
	var canvas = document.getElementById("demo");
    var ctx = canvas.getContext("2d");

	
	radius = Number(radius)
	var toconvert = 2 * minmaxes.range / radius
	
	//Double-check I'm using valid values for the arc-cosine.
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

	var bottomcurve = []
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
}


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

//scale the scale nicely from units of 1,2,4,5,10,20,40,50,100,...
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
	//var lastpoint = relativepoints[relativepoints.length-1]
	var start = 3*Math.PI/2

	var radius = MyLib.radius;
	var minmaxes = MyLib.minmaxes;
	
	var lastpoint = MyLib.points[MyLib.points.length-1];

	//not sure why that didn't work
	var chord_angle = 2 * Math.asin(lastpoint.dist/(2*radius))
	//var chord_angle = lastpoint.theta_pc

	if(lastpoint.x < 0)
	{
		var end = start - chord_angle
	}
	else
	{
		var end = start + chord_angle		
	}

	
	var curve_dist = radius * chord_angle
	
	var pxperfoot = minmaxes.canvasSize / minmaxes.range
	
	var arc_per_foot = 1 / radius
	
	var increment=1;

	var series = [2,2]
	var increaseval = new scale_increment()
	while(pxperfoot*increment<20)
	{
		increment = increaseval.run(increment);
	}
	
	var scalemarks = []
	var i=0;	//draw tic marcks, up to one past the end spot

	if(lastpoint.x < 0)
	{
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
	
	var canvas = document.getElementById("demo");
    var ctx = canvas.getContext("2d");
	ctx.font = "10px Arial";

	for(var i=0; i<scalemarks.length; i++)
	{
		var mark = scalemarks[i]
		ctx.moveTo(mark.start.x+cnv.X_BUFFER, mark.start.y+cnv.Y_BUFFER)
		ctx.lineTo(mark.end.x+cnv.X_BUFFER, mark.end.y+cnv.Y_BUFFER)
		ctx.fillText(mark.value.toString(), mark.numberspot.x+cnv.X_BUFFER, mark.numberspot.y+cnv.Y_BUFFER);
	}
}


function calc_error(diameter, height_start, gs, height_thrown) {
	var radius = Decimal(diameter/2)
	
	var accel_earth
	
	//Get acceleration at floor.
	if(units=="ft")
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

	//var height_start = height_person * (2/3);
	
	var r_onball = radius - height_start;

	var g_onball = omega*omega*r_onball;
	
	//Now get the starting velocities.
	var start_v_y = Decimal.sqrt( 2 * accel_earth * height_thrown ) //calculated comparing to Earth's gravity
	var start_v_x = Decimal(-1).mul( Decimal.sqrt( g_onball * r_onball ) ) //-1 b/c station is rotating clockwise
	
	var slope = start_v_y.div( start_v_x )
	
	//if you start AT the center of the station
	if ( !slope.isFinite() && start_v_y != 0 )
	{
		var time = ((Decimal(2).mul(radius)).sub(height_start)).div(start_v_y)
		var x_f = Decimal(0)
		var y_f = radius
		var maxheight = radius
	}
	else
	{
		variables = crunch_numbers( radius, g_accel, omega, start_v_y, start_v_x, slope, r_onball )
		var time = variables.time
		var x_f = variables.x_f
		var y_f = variables.y_f
		var maxheight = variables.maxheight		
	}
	
	//radial angle swept by the person
	var theta_traversed_person = omega.mul( time )
	var initial_angle_person = (Decimal(3).mul(MyLib.PI)).div(2)
	var final_angle_person = initial_angle_person.sub(theta_traversed_person) //minus b/c clockwise rotation
	
	//final position of person
	//fortunately Javascript uses radians, not degrees
	var xf_person = radius.mul(Decimal.cos(final_angle_person) )
	var yf_person = radius.mul(Decimal.sin(final_angle_person) )
	
	var x_difference = xf_person.sub( x_f )
	var y_difference = yf_person.sub( y_f )
	
	var total_difference = Decimal.sqrt( Decimal.pow(x_difference,2).add(Decimal.pow(y_difference,2) ) )
	
	
	/////SOLVE FOR A LIST OF ABSOLUTE POINTS ALONG PATH/////////////
	////////////////////////////////////////////////////////////////

	
	var absolutepoints = []
	
	//get ~100 increments per second, but min 100 increments, max 3000 increments.		
	if(Number(time)<1.2)
	{ var time_increment = Number(time.div(120)) }
	else if(Number(time)>30)
	{ var time_increment = Number(time.div(3000)) }
	else
	{ var time_increment = .0088; }
	
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

	MyLib.points = relativepoints
	MyLib.radius = Number(radius)
	
	var answers = {
		maxheight: maxheight,
		g_accel: g_accel,
		radius: radius,
		standingvelocity: standingvelocity,
		start_v_y:start_v_y,
		omega: omega,
		total_difference: total_difference,
		time: time,
		accel_earth: accel_earth,
	}
	
	
	return answers

	
	
}



function crunch_numbers( radius, g_accel, omega, start_v_y, start_v_x, slope, r_onball )
{
	var slope = start_v_y.div( start_v_x )
		
	var sqroot1 = Decimal.sqrt( Decimal.pow(slope,2).mul(Decimal.pow(r_onball,2)).sub((Decimal(1).add(Decimal.pow(slope,2))).mul( Decimal.pow(r_onball,2).sub(Decimal.pow(radius,2)  )) ) )
	
	//var x_1 = ( (slope * r_onball) + sqroot1 ) / ( 1 + Math.pow(slope,2)) // +
	var x_2 = ( (slope.mul( r_onball)).sub( sqroot1 )).div( Decimal(1).add( Decimal.pow(slope,2)) ) // -

	//WARNING: THIS DOES NOT GIVE YOU THE CORRECT SIGN
	//but it gives the absolute values that go with X.
	//var y_1_abs = Decimal.sqrt(Math.pow(radius,2) - Math.pow(x_1,2) ) 
	var y_2_abs = Decimal.sqrt(Math.pow(radius,2) - Math.pow(x_2,2) )
	
	//Now use the quadratic again for Y to get the sign.

	//var sqroot2 = Math.sqrt( Math.pow(r_onball,2) - ( 1 + Math.pow(slope,2) ) * ( Math.pow(r_onball,2) - Math.pow(radius,2) * Math.pow(slope,2) ) )

	
	var sqroot2 = Decimal.sqrt( Decimal.pow(r_onball,2).sub(( Decimal(1).add(Decimal.pow(slope,2) ) ).mul(Decimal.pow(r_onball,2).sub(Decimal.pow(radius,2).mul(Decimal.pow(slope,2))))) )
		
	//Apparently the (-) from the Y eqn goes with the (+) in the X eqn. Just to be confusing.
	//var y_1 = ( (-1 * r_onball) - sqroot2 ) / ( 1 + Math.pow(slope,2) ) // -
	//var y_2 = ( (-1 * r_onball) + sqroot2 ) / ( 1 + Math.pow(slope,2) ) // +

	var y_2 = ( new Decimal(-1 * r_onball).add( sqroot2 ) ).div( new Decimal(1).add(Decimal.pow(slope,2) ) ) // +
	
	//(X2, Y2) is the point that we want!
	
	var start_vtotal = Decimal.sqrt( Decimal.pow(start_v_x,2).add(Decimal.pow(start_v_y,2) ) )
	
	//Get the time.
	var time = Decimal.sqrt( Decimal.pow(x_2,2).add(( y_2.add(r_onball )).pow(2) )).div( start_vtotal )
	
	///MAX HEIGHT/////////////////////////////////////
	//////////////////////////////////////////////////

	//a maximization function.
	//This would have made more sense if I did it in reference to time instead.
	//Oh well.

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
    var height_start = Number(document.getElementById("heightperson").value);
    var diameter = Number(document.getElementById("diameter").value);
	var gs = Number(document.getElementById("percentgravity").value) / 100;
    var height_thrown = Number(document.getElementById("heightthrown").value);
    //angle = Number(document.getElementById("anglethrown").value);

	if(!(MyLib.moveinterval==null))
	{ clearInterval(MyLib.moveinterval); 
		MyLib.moveinterval=null; }

	//clear the output fields.
	//////////////////////////
	document.getElementById("centripaccel").innerHTML = ""
	document.getElementById("standingvelocity").innerHTML = ""
	document.getElementById("standingvelocity2").innerHTML = ""
	document.getElementById("standingvelocityunits2").innerHTML = ""
	document.getElementById("rotationalvelocity").innerHTML = ""
	document.getElementById("finalseparation").innerHTML = ""
	document.getElementById("finalseparation2").innerHTML = ""
	document.getElementById("finalseparationunits2").innerHTML = ""
	document.getElementById("verticalvelocity").innerHTML = "";
	document.getElementById("verticalvelocity2").innerHTML = "";
	document.getElementById("verticalvelocityunits").innerHTML = "";
	document.getElementById("verticalvelocityunits2").innerHTML = "";
	document.getElementById("timeinair").innerHTML = "";
	document.getElementById("timeinairunits").innerHTML = "";

	answers = calc_error( diameter, height_start, gs, height_thrown ) //is global
	
	MyLib.globaltime = Number(answers.time)
	
	
	canvasthings = prep_canvas()
	draw_curve_static(canvasthings.canvaspoints)
	
	//expected values
	var expectedheight = height_start + height_thrown
	document.getElementById("expectedheight").innerHTML = round( expectedheight )
	document.getElementById("expectedheightunits").innerHTML = 	"&nbsp;" + units
	document.getElementById("expectedtime").innerHTML = round( Decimal.sqrt( 2 * expectedheight / answers.accel_earth ).add(answers.start_v_y / answers.accel_earth)  )
	document.getElementById("expectedtimeunits").innerHTML = "&nbsp;s"

	
	document.getElementById("maxheightachieved").innerHTML = round(answers.maxheight);
	document.getElementById("maxheightachievedunits").innerHTML = units;
	
	//produce output.//////////////////////////////////////
	///////////////////////////////////////////////////////
	
	document.getElementById("centripaccel").innerHTML = round(answers.g_accel).toString()
	
	document.getElementById("standingvelocity").innerHTML = round(answers.standingvelocity).toString()
	document.getElementById("verticalvelocity").innerHTML = round(answers.start_v_y).toString()

	
	//Show velocity values.
	if(units=="ft")
	{
		document.getElementById("centripaccelunits").innerHTML = "&nbsp;ft/s/s"
		document.getElementById("standingvelocityunits").innerHTML = "&nbsp;ft/s"
		document.getElementById("verticalvelocityunits").innerHTML = "&nbsp;ft/s"
		
		
		var standingvelocity2 = answers.standingvelocity * 0.681818
		var verticalvelocity2 = answers.start_v_y * 0.681818
		document.getElementById("standingvelocity2").innerHTML = "(" + round(standingvelocity2).toString();
		document.getElementById("standingvelocityunits2").innerHTML = "&nbsp;mph)";		
		document.getElementById("verticalvelocity2").innerHTML = "(" + round(verticalvelocity2).toString();
		document.getElementById("verticalvelocityunits2").innerHTML = "&nbsp;mph)";
		
	} else if(units=="m")
	{
		document.getElementById("centripaccelunits").innerHTML = "m/s/s"
		document.getElementById("standingvelocityunits").innerHTML = "m/s";
		document.getElementById("verticalvelocityunits").innerHTML = "m/s";
		
		var standingvelocity2 = answers.standingvelocity * 3.6;
		var verticalvelocity2 = answers.start_v_y * 3.6;
		document.getElementById("standingvelocity2").innerHTML = "(" + round(standingvelocity2).toString();
		document.getElementById("standingvelocityunits2").innerHTML = "km/h)";
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
	document.getElementById("finalseparationunits").innerHTML = units
	
	document.getElementById("timeinair").innerHTML = round(answers.time).toString()
	document.getElementById("timeinairunits").innerHTML = "s"
	
	
	if(answers.total_difference < 1.0)
	{	
		//aligns text to center
		document.getElementById("finalseparation2").className="answer";
		document.getElementById("finalseparationunits2").className="answer"; 
		
		if(units=="ft")
		{
			var finalseparation2 = answers.total_difference * 12
			document.getElementById("finalseparation2").innerHTML = "(" + round(finalseparation2).toString();
			document.getElementById("finalseparationunits2").innerHTML = "in)";
		}
		
		if(units=="m")
		{
			var finalseparation2 = answers.total_difference * 100
			document.getElementById("finalseparation2").innerHTML = "(" + round(finalseparation2).toString();
			document.getElementById("finalseparationunits2").innerHTML = "cm)";
		}
	} else {  //aligns text to bottom
		document.getElementById("finalseparation2").className=""; 
		document.getElementById("finalseparationunits2").className="";
	}
	

	//ERRORS///////////////////////////////////////////
	///////////////////////////////////////////////////
	
	var errortext = ""
	
	/*
	if(gs != 1 )
	{
		errortext = String.concat(errortext, "Now modifying Earth's gravity to match the model.<br/>")
	}*/


	/*if(height_start > answers.radius )
	{
		errortext += "Warning: The starting height is greater than the radius of the station (expect the unexpected).<br/>";
	}
	
	if(height_thrown > (2 * answers.radius) )
	{
		errortext += "Warning: the throwing height is larger than the station (the ball will just hit the ceiling).<br/>";
	}

	if(gs > 5 )
	{
		errortext += "Warning: Dangerous g-forces.<br/>";
	}

	if(units=="ft")
	{
		var throw_vel = round( answers.start_v_y * 0.681818 );
		if(throw_vel > 100)
		{
			errortext += "Warning: the throwing height requires a throwing velocity of " + throw_vel + " mph. This is unrealistic even for a pro-baseball pitcher.<br/>";
		}
	} else if(units=="m")
	{
		var throw_vel_mph = round( answers.start_v_y * 2.23694 );
		if(throw_vel_mph > 100)
		{
			errortext += errortext, "Warning: the throwing height requires a throwing velocity of " + start_v_y + " m/s. This is unrealistic even for a pro-baseball pitcher.<br/>";
		}
	}*/
	
	document.getElementById("error").innerHTML = errortext
}




//This function version (not used) is prior to adding the decimal.js module.
//Look through the code if you want a more straightforward understanding
//of what formulas are being used in the current, more convoluted, function.
/*
function calc_error_original(diameter, height_start, gs, height_thrown) {
	
	radius = diameter/2
	
		var accel_earth
	
	//Get acceleration at floor.
	if(units=="ft")
	{	
		accel_earth = 32.174; // ft/s/s
	} else
	{
		accel_earth = 9.80665; // m/s/s, exact conventional standard
	}
	
	var g_accel = accel_earth * gs;
	
	//CALCULATE!!! /////////////////////////////////////////
	////////////////////////////////////////////////////////
	
	var standingvelocity = Math.sqrt( g_accel * radius )
	
	//Get variables and perform calculations here.
	//Accurate up to about 15 decimals (17?)
	
	//get forces on the ball
	//a = omega^2 * r  eqn with rotational velocity
	var omega = Math.sqrt( g_accel / radius );

	//var height_start = height_person * (2/3);
	
	var r_onball = radius - height_start;

	var g_onball = omega*omega*r_onball;
	
	
	
	
	//Now get the starting velocities.
	var start_v_y = Math.sqrt( 2 * accel_earth * height_thrown ) //calculated comparing to Earth's gravity
	var start_v_x = -1 * Math.sqrt( g_onball * r_onball ) //-1 b/c station is rotating clockwise

		//Now find intersection with the circle.
	var slope_ball = start_v_y / start_v_x
	
	var sqroot1 = Math.sqrt( Math.pow(slope_ball,2) * Math.pow(r_onball,2) - ((1 + Math.pow(slope_ball,2)) * ( Math.pow(r_onball,2) - Math.pow(radius,2)  )) )
	
	var x_1 = ( (slope_ball * r_onball) + sqroot1 ) / ( 1 + Math.pow(slope_ball,2)) // +
	var x_2 = ( (slope_ball * r_onball) - sqroot1 ) / ( 1 + Math.pow(slope_ball,2)) // -

	//WARNING: THIS DOES NOT GIVE YOU THE CORRECT SIGN
	//but it gives the absolute values that go with X.
	var y_1_abs = Math.sqrt(Math.pow(radius,2) - Math.pow(x_1,2) ) 
	var y_2_abs = Math.sqrt(Math.pow(radius,2) - Math.pow(x_2,2) )
	
	//Now use the quadratic again for Y to get the sign.
	var sqroot2 = Math.sqrt( Math.pow(r_onball,2) - ( 1 + Math.pow(slope_ball,2) ) * ( Math.pow(r_onball,2) - Math.pow(radius,2) * Math.pow(slope_ball,2) ) )
	
	//Apparently the (-) from the Y eqn goes with the (+) in the X eqn. Just to be confusing.
	var y_1 = ( (-1 * r_onball) - sqroot2 ) / ( 1 + Math.pow(slope_ball,2) ) // -
	var y_2 = ( (-1 * r_onball) + sqroot2 ) / ( 1 + Math.pow(slope_ball,2) ) // +
	
	//(X2, Y2) is the point that we want!
	
	var start_vtotal = Math.sqrt( Math.pow(start_v_x,2) + Math.pow(start_v_y,2) )
	
	//Get the time.
	var time = Math.sqrt( Math.pow(x_2,2) + Math.pow( ( y_2 + r_onball ),2 ) ) / start_vtotal
	
	//radial angle swept by the person
	var theta_traversed_person = omega * time
	var initial_angle_person = (3 * Math.PI) / 2
	var final_angle_person = initial_angle_person - theta_traversed_person //minus b/c clockwise rotation
	
	//final position of person
	//fortunately Javascript uses radians, not degrees
	var xf_person = radius * Math.cos(final_angle_person)
	var yf_person = radius * Math.sin(final_angle_person)
	
	var x_difference = xf_person - x_2
	var y_difference = yf_person - y_2
	
	var total_difference = Math.sqrt( Math.pow(x_difference,2) + Math.pow(y_difference,2) )

	
	///MAX HEIGHT/////////////////////////////////////
	//////////////////////////////////////////////////

	//a maximization function.

	//Starting values
	var test_x = start_vtotal*(time/10) //Starting test increment
	var direction = -1  //iterate leftwards to start.
	var maxvalue = height_start

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
		current_y = (slope_ball * current_x) - r_onball
		
		//pythagoras, to find distance to ball from center of station
		disttocenter = Math.sqrt( Math.pow(current_x,2) +Math.pow(current_y,2) )
		
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
	
	
	var answers = {
		maxvalue: maxvalue,
		g_accel: g_accel,
		radius: radius,
		standingvelocity: standingvelocity,
		start_v_y:start_v_y,
		omega: omega,
		total_difference: total_difference,
		time: time,
		accel_earth: accel_earth
	}
	
	return answers	
} */

/*function RelativePoint ( time, radius, omega, slope, height_start, start_v_x ) {
	//solve for person's location

	var theta_op = ((Decimal(3).mul(PI)).div(2)).sub(omega.mul( time )) //person's angle, from origin to person
	
	var x_person = radius.mul(Decimal.cos(theta_op) )
	var y_person = radius.mul(Decimal.sin(theta_op) )

	var x_coin = start_v_x.mul(time)
	var y_coin = (slope.mul(x_coin)).sub(radius.sub(height_start))
	
	var theta_pc = Decimal.atan((y_coin.sub(y_person)).div(x_coin.sub(x_person)))
	var theta_po = Decimal.atan(y_person.div(x_person))
	
	var theta_rel = theta_po.sub(theta_pc)
	
	var dist = Decimal.sqrt( (Decimal.pow( y_coin.sub(y_person), 2)).add( Decimal.pow( x_coin.sub(x_person), 2) ) )
	
	var x_rel = dist.mul( Decimal.sin(theta_rel) )
	var y_rel = dist.mul( Decimal.cos(theta_rel) )
	
	this.time = time
	this.dist = dist
	this.x = x_rel
	this.y = y_rel
}*/