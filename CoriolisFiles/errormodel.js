
var units = "ft";
var height_start = 4;
var radius = 25;
var gs = 1;
var height_thrown = 3;
//var mouseover = false; //input values on first mouseover. Only first.
var allatonce = false; //used so that some functions can change all the values, and submit only once.

Decimal.set({ precision: 30 })

var PI = Decimal.acos(-1)


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


function convertunits(setting) {
    allatonce=true;
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
	submit()
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
		submit()
	}
}
	
function setfields() {
	//if(mouseover==false) //only set the fields when you first move the mouse over.
	//{	
		allatonce=true;
		
		//mouseover=true;

		document.getElementById("heightperson").value = height_start
		document.getElementById("diameter").value = radius*2
		document.getElementById("heightthrown").value = height_thrown
		document.getElementById("percentgravity").value = gs * 100
		
		outputgs(gs * 100)
		
		document.getElementById('imperial').checked = true;
		units="ft"
		setunits(units);

		allatonce=false;
		
		submit()
		
		
	//}
	//otherwise do nothing
}

//This function version (not used) is prior to adding the decimal.js module.
//Look through the code if you want a more straightforward understanding
//of what formulas are being used in the current, more convoluted, function.
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
}

function calc_error(diameter, height_start, gs, height_thrown) {
	
	radius = Decimal(diameter/2)
	
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
	var start_v_x = -1 * Decimal.sqrt( g_onball * r_onball ) //-1 b/c station is rotating clockwise

		//Now find intersection with the circle.
	var slope_ball = start_v_y / start_v_x
	
	var sqroot1 = Decimal.sqrt( Decimal.pow(slope_ball,2).mul(Decimal.pow(r_onball,2)).sub((Decimal(1).add(Decimal.pow(slope_ball,2))).mul( Decimal.pow(r_onball,2).sub(Decimal.pow(radius,2)  )) ) )
	
	//var x_1 = ( (slope_ball * r_onball) + sqroot1 ) / ( 1 + Math.pow(slope_ball,2)) // +
	var x_2 = ( Decimal(slope_ball * r_onball).sub( sqroot1 )).div( Decimal(1).add( Decimal.pow(slope_ball,2)) ) // -

	//WARNING: THIS DOES NOT GIVE YOU THE CORRECT SIGN
	//but it gives the absolute values that go with X.
	//var y_1_abs = Decimal.sqrt(Math.pow(radius,2) - Math.pow(x_1,2) ) 
	var y_2_abs = Decimal.sqrt(Math.pow(radius,2) - Math.pow(x_2,2) )
	
	//Now use the quadratic again for Y to get the sign.

	//var sqroot2 = Math.sqrt( Math.pow(r_onball,2) - ( 1 + Math.pow(slope_ball,2) ) * ( Math.pow(r_onball,2) - Math.pow(radius,2) * Math.pow(slope_ball,2) ) )

	
	var sqroot2 = Decimal.sqrt( Decimal.pow(r_onball,2).sub(( Decimal(1).add(Decimal.pow(slope_ball,2) ) ).mul(Decimal.pow(r_onball,2).sub(Decimal.pow(radius,2).mul(Decimal.pow(slope_ball,2))))) )
		
	//Apparently the (-) from the Y eqn goes with the (+) in the X eqn. Just to be confusing.
	//var y_1 = ( (-1 * r_onball) - sqroot2 ) / ( 1 + Math.pow(slope_ball,2) ) // -
	//var y_2 = ( (-1 * r_onball) + sqroot2 ) / ( 1 + Math.pow(slope_ball,2) ) // +

	var y_2 = ( new Decimal(-1 * r_onball).add( sqroot2 ) ).div( new Decimal(1).add(Decimal.pow(slope_ball,2) ) ) // +
	
	//(X2, Y2) is the point that we want!
	
	var start_vtotal = Decimal.sqrt( Decimal.pow(start_v_x,2).add(Decimal.pow(start_v_y,2) ) )
	
	//Get the time.
	var time = Decimal.sqrt( Decimal.pow(x_2,2).add(( y_2.add(r_onball )).pow(2) )).div( start_vtotal )
	
	//radial angle swept by the person
	var theta_traversed_person = omega.mul( time )
	var initial_angle_person = (Decimal(3).mul(PI)).div(2)
	var final_angle_person = initial_angle_person.sub(theta_traversed_person) //minus b/c clockwise rotation
	
	//final position of person
	//fortunately Javascript uses radians, not degrees
	var xf_person = radius.mul(Decimal.cos(final_angle_person) )
	var yf_person = radius.mul(Decimal.sin(final_angle_person) )
	
	var x_difference = xf_person.sub( x_2 )
	var y_difference = yf_person.sub( y_2 )
	
	var total_difference = Decimal.sqrt( Decimal.pow(x_difference,2).add(Decimal.pow(y_difference,2) ) )

	
	
	
	
	
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
}


//What happens after the person pushes the submit button...
function submit() {
	//Get variables
    height_start = Number(document.getElementById("heightperson").value);
    var diameter = Number(document.getElementById("diameter").value);
	gs = Number(document.getElementById("percentgravity").value) / 100;
    height_thrown = Number(document.getElementById("heightthrown").value);
    //angle = Number(document.getElementById("anglethrown").value);

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

	answers = calc_error( diameter, height_start, gs, height_thrown )

	//expected values
	var expectedheight = height_start + height_thrown
	document.getElementById("expectedheight").innerHTML = round( expectedheight )
	document.getElementById("expectedheightunits").innerHTML = 	"&nbsp;" + units
	document.getElementById("expectedtime").innerHTML = round( Decimal.sqrt( 2 * expectedheight / answers.accel_earth ).add(answers.start_v_y / answers.accel_earth)  )
	document.getElementById("expectedtimeunits").innerHTML = "&nbsp;s"

	
	document.getElementById("maxheightachieved").innerHTML = round(answers.maxvalue);
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


	if(height_start > answers.radius )
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
	}
	
	document.getElementById("error").innerHTML = errortext
}
