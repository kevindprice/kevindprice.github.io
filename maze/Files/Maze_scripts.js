

/*
These are the functions in this file:
What the functions do is explained next to 
the function definitions themselves.

Global variable definitions

cancel_button
setPage
setQueryVariable
animate_string

drawGrid
refreshObstacles

drawObstacle
setLine

checkForObstacle
findBegin
isIn

Arrow key handling function (anonymous)
clickHandler
startCustom

createMaze
drawSetting
eraseMaze
changeGridSize
displayEnds

solveMaze
stopMaze
resumeMaze
startMaze
move

checkObstacles
obstacleHandler

turnRight
turnLeft
moveForward
turnBackward
backTrack

zoomPrompt
zoomIn
zoomOut
speedUp
slowDown

loadMaze
loadSample
getFile
processFile
sampleFile
saveMaze
outputFile

OpenInstructions
window_onunload
*/




//==================================================================
//GLOBAL Definitions

var INTERVAL = 20;  //line spacing

//size of canvas based on number of grids
var X_GRIDS = 28;
var Y_GRIDS = 25;

var BORDER = 1; //1 px border around the maze, so the edges show completely.

var CANVAS_WIDTH = INTERVAL * X_GRIDS;
var CANVAS_HEIGHT = INTERVAL * Y_GRIDS;

var TIME_INTERVAL = 30; // how often in ms the line is moved.

var MOVEDIST=3; //distance line moves on each refresh

var OBSTACLE_TYPE = "wall"; //is used in "Create Maze" mode
                            //to determine which type of obstacle
                            //to draw. Possible types: 
                            //  "wall"
                            //  "permeable"
                            //  "begin"
                            //  "end"

var obstacles = []; //contains a list of all obstacles.
                    //Each obstacle contains dictionaries:
                        // { "type":  <obstacle type>
                        //   "orient": <obstacle orientation>
                        //   "x":     <x-coordinate of origin>
                        //   "y":     <y-coordinate of origin> }

loadHTML = "<input type='submit' value='How to Play' onclick='openInstructions()' style='font-weight:bold;'/> <input type='submit' value='Load Sample'  style='font-weight:bold;' onclick='loadSample()' style='margin-left:20px;'/> <input type='submit' value='Create New Maze' onclick='createMaze()'> <input type='submit' value='Load from File' onclick='loadMaze()' />   "
                        
//All of the different possible buttons for the action bar
startingHTML = "<input type='submit' value='Solve Maze' style='font-weight:bold;' onclick='solveMaze()'/> <input type='submit' value='Add Obstacles' onclick='createMaze()'/> <input type='submit' value='Load Maze' onclick='loadMaze()'/>"

mazeSOLVER = "<input type='submit' value='Begin Maze' style='font-weight:bold;' onclick='startMaze()'/> <input type='submit' value='Identify Beginning/End' onmousedown='displayEnds()' onmouseup='drawGrid()' />"

//<input type='submit' value='Return to Solver' onclick='solveMaze()'/> 

createMAZE = "<input type='submit' value='Grid Size' onclick='changeGridSize()'/> <input type='submit' value='Erase All' onclick='eraseMaze()'/> <input type='submit' value='Save' onclick='saveMaze()'/> <!--<input type='submit' value='SOLVE' onclick='solveMaze()' style='margin-right: 10px;'/>-->Draw: <input type='submit' value='Wall' onclick='drawSetting(\"wall\")'/> <input type='submit' value='Permeable' onclick='drawSetting(\"permeable\")'/> <input type='submit' value='Beginning' onclick='drawSetting(\"begin\")'/> <input type='submit' value='End' onclick='drawSetting(\"end\")'/>"

movingHTML = "Actions: <input type='submit' value='Stop the Maze' onclick='stopMaze()'/> <input type='submit' value='Backtrack' onclick='backTrack()' style='margin-right:10px'/> <input type='submit' value='Speed(+)' onclick='speedUp()'/> <input type='submit' value='Speed(-)' onclick='slowDown()'/>"

pausedHTML = "<input type='submit' value='Resume Maze' onclick='resumeMaze()'/> <input type='submit' value='Backtrack' onclick='backTrack()' style='margin-right:10px'/> <input type='submit' value='Speed(+)' onclick='speedUp()'/> <input type='submit' value='Speed(-)' onclick='slowDown()' style='margin-right:10px'/> Go to:<input type='submit' value='Beginning' onclick='startMaze()'/> <input type='submit' value='Custom Spot' onclick='startCustom()'/>"

turningHTML = "Actions: <input type='submit' value='Backtrack' onclick='backTrack()' style='margin-right:10px'/> "

var tempHTML = "";  //allows the CANCEL button to remember
                    //where to cancel back to.

var customSpot = []; //temporarily filled with the click location
                    //when a user chooses to start from a custom spot.
                    
var spot = []; //keep track of the user's location in the maze

var route = []; //keep track of the route the user took

var turns = {}; //keep track of what keys to look for when turning.

//document.onkeydown = checkKey;

var newWindow;

//These functions run at the beginning of the program,
//or at regular intervals when the page is refreshed.
//================================================================
//================================================================

function cancel_button()  //I confess, the implementation of this
{                         //is a bit sloppy.
    if(tempHTML != "")
    {
        document.getElementById("action").innerHTML = tempHTML;
        tempHTML = "";        
    }
    else
    {
        document.getElementById("action") = startingHTML;
    }
}


//a few housekeeping items that need to happen
//right when the page is loaded.
function setPage()
{
    //set the action bar to say "Start the Maze"
    document.getElementById("action").innerHTML = loadHTML;

    //the canvas needs to be set to the right size
    //before the spot is initialized, or it will misbehave.
    //So this once, these values get initialized twice.
    var canvas = document.getElementById("canvas");
    canvas.height = CANVAS_HEIGHT;
    canvas.width = CANVAS_WIDTH;

    //The starting location is intialized here.
    //This can't be done when it is defined as a global.

    //The spot is in reference to the GRID LINES
    //the actual line is drawn halfway in the middle of the square.
    //This makes obstacle comparisons easier.
    //Notice, I subtract half an interval 
    //so it doesn't start off the edge.
    spot = [ 0, canvas.height/INTERVAL - 1/2 , "up", "stopped" ];

    animate_string('title');
    drawGrid();
    //loadSample();
	
	sample = getQueryVariable("sample");
	if(sample!=null)
	{
		sampleFile(sample)
	}
	else
	{
		sampleFile(1);
	}
}


function getQueryVariable(variable) {
    var query = document.location.href;
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
}


//animates the title
function animate_string(id)   
{
    var element = document.getElementById(id);
    var textNode = element.childNodes[0]; // assuming no other children
    var text = textNode.data;

    setInterval(function () 
    {
        text = text.substring(1, text.length) + text[0];
        textNode.data = text;
    }, 175);
}


function drawGrid() 
{
    //make sure the canvas is set to the right size.
    var canvas = document.getElementById("canvas");
    canvas.height = CANVAS_HEIGHT;
    canvas.width = CANVAS_WIDTH;
    
    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");

    //refresh the page
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle="#DDDDDD"; //gray color
    context.beginPath();

    //vertical grid marks  x=1 b/c 1 pixel buffer at edge.
    for (var x=BORDER; x<=canvas.width; x+=INTERVAL) {
        context.moveTo(x, 0); 
        context.lineTo(x, canvas.height);
    }

    //horizontal grid marks  y=1 b/c 1 pixel buffer at edge.
    for (var y=BORDER; y<canvas.height; y+=INTERVAL) {
        context.moveTo(0, y); 
        context.lineTo(canvas.width, y);
    }
        
    context.stroke(); 

    refreshObstacles(canvas, context);
    
    if(route.length>0)
    {
        refreshRoute(canvas, context);
    }
}

function refreshRoute(canvas, context)
{
    context.beginPath();
    context.strokeStyle="#00FF00"; //green

    context.moveTo( Math.round( route[0]["spot"][0]*INTERVAL + INTERVAL/2)+BORDER, 
                    Math.round( route[0]["spot"][1]*INTERVAL + INTERVAL/2)+BORDER ); 
    
    for(var i=1; i<route.length; i++)
    {
        context.lineTo(Math.round( route[i]["spot"][0]*INTERVAL + INTERVAL/2)+BORDER, 
                       Math.round( route[i]["spot"][1]*INTERVAL + INTERVAL/2)+BORDER );
    }

    context.stroke();

    context.beginPath(); //draw the LAST SEGMENT in a darker color.
    context.strokeStyle="#006600"; //DARK green
    
    context.moveTo(Math.round( route[route.length - 1]["spot"][0]*INTERVAL + INTERVAL/2)+BORDER, 
                   Math.round( route[route.length - 1]["spot"][1]*INTERVAL + INTERVAL/2)+BORDER );
    context.lineTo(Math.round( spot[0]*INTERVAL + INTERVAL/2)+BORDER, 
                   Math.round( spot[1]*INTERVAL + INTERVAL/2)+BORDER );
    
    context.stroke()
    
}

//after drawing the grid, you have to refresh the obstacles.
function refreshObstacles(canvas, context)
{

    var obst_types = ["wall","permeable","begin","end"];
    
    for(var h=0; h<obst_types.length; h++)
    {
        context.beginPath();
        
        switch(obst_types[h])
        {
            case "wall":
                context.strokeStyle="#FF0000";
                break;
            case "permeable":
                context.strokeStyle="#0000FF";
                break;
            case "begin":
                context.strokeStyle="#005500";
                break;
            case "end":
                context.strokeStyle="#00DD00";
                break;
        }

        for(var i=0; i<obstacles.length; i++)
        {
            var x = obstacles[i]["x"] * INTERVAL;
            var y = obstacles[i]["y"] * INTERVAL;
            var moveX;
            var moveY;
            if(obstacles[i]["type"]==obst_types[h])
            {
                if(obstacles[i]["orient"]=="vertical")
                {
                    moveX = 0;
                    moveY = INTERVAL;
                }
                else if(obstacles[i]["orient"]=="horizontal")
                {
                    moveX = INTERVAL;
                    moveY = 0;
                }

                context.moveTo(x+BORDER, y+BORDER);  //Now move the line to the coordinate
                context.lineTo(x + moveX+BORDER, y + moveY+BORDER);  //and draw the hash.
            }
        }
        context.stroke();
    }
}

//===========================================================
//===========================================================
//These mammoth functions are necessary to draw new obstacles.

//This function runs when during the maze creator.
//Takes a coordinate from the click handler,
//creates an obstacle object, and decides where to put the line.
function setLine(x, y)
{
    var lessThanX = 0;
    var lessThanY = 0;
    //gets whether it's closer to a horizontal or vertical line
    if (x % INTERVAL < INTERVAL - (x % INTERVAL) )
    { var x_dist = x % INTERVAL }
    else { var x_dist = INTERVAL - (x % INTERVAL)
           lessThanX = 1;
    }

    if (y % INTERVAL < INTERVAL - (y % INTERVAL))
    { var y_dist = y % INTERVAL }
    else { var y_dist = INTERVAL - (y % INTERVAL)
           lessThanY = 1;
    }

    
    if (x_dist < y_dist) {  //closer to vertical line, VERTICAL hash
        
        if (lessThanX == 1){
        //user clicked BEHIND grid mark
            while(x % INTERVAL != 0) //line up exactly to grid mark
                { x++; } //it's ++ because you're BEHIND the grid mark
            while(y % INTERVAL != 0)
               { y--; }
        } else {   
            //user clicked IN FRONT of grid mark
            while(x % INTERVAL != 0)
                { x--; }
            while(y % INTERVAL != 0)
               { y--; }
        }

        //now save x and y based on intervals
        var x_int = x / INTERVAL;
        var y_int = y / INTERVAL;

        //create new obstacle item
        var DictItem = {};
        DictItem["type"]=OBSTACLE_TYPE;
        DictItem["orient"]="vertical";
        DictItem["x"]=x_int;
        DictItem["y"]=y_int;
    }
    else {      //closer to horizontal line, HORIZONTAL hash

        if(lessThanY == 1) {  
        //user clicked BEHIND grid mark
            while(x % INTERVAL != 0) //line up exactly to grid mark
                { x--; } 
            while(y % INTERVAL != 0)           
                { y++; } //it's ++ because you're BEHIND the grid mark
        } else { 
        //user clicked IN FRONT of grid mark
            while(x % INTERVAL != 0)
                { x--; }
            while(y % INTERVAL != 0)
                { y--; }
        }

        //now save x and y based on intervals
        var x_int = x / INTERVAL;
        var y_int = y / INTERVAL;
        
        //add item to objects list
        var DictItem = {};
        DictItem["type"]=OBSTACLE_TYPE;
        DictItem["orient"]="horizontal";
        DictItem["x"]=x_int;
        DictItem["y"]=y_int;
    }

    //check if an obstacle already exists at that spot.
    //If it does, erase that obstacle from the list.
    //If it does not, create a new obstacle.
    var isObstacle = checkForObstacle(DictItem)
    if (isObstacle == -1)
    { 
      switch(OBSTACLE_TYPE)
      {
        case "wall":
            drawObstacle(DictItem);
            break;
        case "permeable":
            drawObstacle(DictItem);
            break;
        case "begin":
            drawObstacle(DictItem);
            break;
        case "end":
            drawObstacle(DictItem);
            break;
        }
    }
    else { 
        obstacles.splice(isObstacle, 1) 
        drawGrid();    //refresh the page to erase the obstacle.
    }   
}

//takes an obstacle object from DrawLine and draws it.
function drawObstacle(obstacle)
{

    if(obstacle["type"] == "begin")
    {
        obstacle["orient"] = "horizontal";
        var isObstacle = findBegin()
        
        if (isObstacle != -1) //e.g. if there IS a beginning square
        { 
            obstacles.splice(isObstacle, 1) 
            drawGrid();
        }
    }
    
    obstacles.push(obstacle); 

    x = obstacle["x"] * INTERVAL
    y = obstacle["y"] * INTERVAL
    
    switch(obstacle["orient"])
    {
        case "vertical":
            var moveX = 0;
            var moveY = INTERVAL;
            break;
        case "horizontal":
            var moveX = INTERVAL;
            var moveY = 0;
            break;
    }

    //sets up the context...
    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");
    
    switch(OBSTACLE_TYPE)
    {
        case "wall":
            context.strokeStyle="#FF0000";
            break;
        case "end":
            context.strokeStyle="#00DD00";
            break;
        case "permeable":
            context.strokeStyle="#0000FF";
            break;
        case "begin":
            context.strokeStyle="#005500";
            break;
        }

    context.beginPath();
    
    context.moveTo(x+BORDER, y+BORDER);  //Move the line to the coordinate
    context.lineTo(x + moveX+BORDER, y + moveY+BORDER);  //and draw the hash.

    context.stroke();
}




//these functions check for specific obstacles.
//****************************************************

//check the obstacles list for a given obstacle.
//If that obstacle already exists, return the index of the obstacle.
//Otherwise, return -1.
function checkForObstacle(obstacle)
{
    for (var i=0; i<obstacles.length; i++)
    {
        if( obstacle["x"] == obstacles[i]["x"] &&
            obstacle["y"] == obstacles[i]["y"] &&
            obstacle["orient"] == obstacles[i]["orient"] )
        { return i; }
    }
    
    return -1;
}



function findBegin()
{
    for (var i=0; i<obstacles.length; i++)
    {
        if(obstacles[i]["type"]=="begin")
        { return i; }
    }
    
    return -1;
}

function findEnds()
{
	var ends = [];
    for (var i=0; i<obstacles.length; i++)
    {
        if(obstacles[i]["type"]=="end")
        { ends.push(i); }
    }
    
    return ends;
}


//adds compatibility for Edge Browser
//(the .includes feature doesn't work, so I had to create my own.)
function isIn(list, item)
{
    for(var i=0; i<list.length; i++)
    {
        if(list[i] == item)
        {
            return true;
        }
        
    }
    return false;
}


//============================================================
//============================================================



//checks the ARROW KEYS to tell the computer what to do at a stop.
//function checkKey(e) {
document.onkeydown = function(e) {
    e = e || window.event;

	key = e.keyCode;
    isShift = !!e.shiftKey; // typecast to boolean

	//capture SHIFT/+ sign for zoom in
    if ( isShift ) {
		switch (key) {
			case 16: // ignore shift key
				break;
			case 187: //Chrome/Safari/Opera/MSIE
			case 61:  //Firefox
				zoomIn();
			default: //do nothing
				break;
		}
	} else {
		//capture (-) sign for zoom out (NO SHIFT)
		switch(key)
		{
			case 189: //Chrome/Safari/Opera/MSIE
			case 173: //Firefox
				zoomOut();
			default:
				break;
		}
	}
	
	switch(key){
		case 8:
			backTrack();
			break;
		default:
			break;
	}
	
	//Now for other keys.
	
    if(spot[3]=="startCustom")
    {
        switch(key)
        {
            case 37:
                startCustom(-1,-1,"left")
                break;
            case 38:
                startCustom(-1,-1,"up")
                break;
            case 39:
                startCustom(-1,-1,"right")
                break;
            case 40:
                startCustom(-1,-1,"down")
                break;
        }
    }    
    
    if(spot[3]!="drawing")
    {
        if (key == '38') {
        // up arrow
            switch(turns["upkey"])
            {
                case "forward":
                    moveForward();
                    break;
                case "backward":
                    turnBackward();
                    break;
                case "right":
                    turnRight();
                    break;
                case "left":
                    turnLeft();
                    break;
            }        
        }
        else if (key == '40') {
            // down arrow
            switch(turns["downkey"])
            {
                case "forward":
                    moveForward();
                    break;
                case "backward":
                    turnBackward();
                    break;
                case "right":
                    turnRight();
                    break;
                case "left":
                    turnLeft();
                    break;
            }        
        }
        else if (key == '37') {
        // left arrow
            switch(turns["leftkey"])
            {
                case "forward":
                    moveForward();
                    break;
                case "backward":
                    turnBackward();
                    break;
                case "right":
                    turnRight();
                    break;
                case "left":
                    turnLeft();
                    break;
            }           
        }
        else if (key == '39') {
        // right arrow
            switch(turns["rightkey"])
            {
                case "forward":
                    moveForward();
                    break;
                case "backward":
                    turnBackward();
                    break;
                case "right":
                    turnRight();
                    break;
                case "left":
                    turnLeft();
                    break;
            }        
        }
    }
}

//This function handles what to do when you click on the canvas.
function clickHandler(event) {
    //get canvas
    var canvas = document.getElementById("canvas");

    //now find coordinates of the click relative to the canvas.

    var rect = canvas.getBoundingClientRect(); //borders of the canvas

    //clientX = the click relative to the page edge
    //rect.left = the canvas edge relative to page
    var x = Math.round(event.clientX - rect.left);
    var y = Math.round(event.clientY - rect.top);

    switch(spot[3])  //decide what to do with the click
    {
        case "moving":
            stopMaze();
            break;
        case "drawing":
            setLine(x, y);
            break;
        case "startCustom":
            startCustom(x, y);
            break;
        default:
            startCustom(x, y);
            break;
    }    
}

//This function handles starting in a custom location.
//It starts in three different modes depending on what state
//the user is in.

//First, it prompts the user to click.
//Then, it takes the location from the click handler.
//Finally, it asks for what direction to start in and
//passes the vector to resumeMaze().
function startCustom(x,y,direction) //=-1, y=-1, direction = "")
{               //changing this allowed the script to work in 
    if(x==null)                                 //edge browser
    { x=-1; y=-1 }
    if(x == -1 && direction == null) //if the user hasn't clicked yet...
    {
        spot[3]="startCustom"

        tempHTML = document.getElementById("action").innerHTML;

        document.getElementById("action").innerHTML = "Please click where you would like to start."
    }
    else if(x != -1)
    {
        while(x % INTERVAL != 0)
        {x--;}
        while(y % INTERVAL != 0)
        {y--;}
 
        customSpot[0] = x / INTERVAL;
        customSpot[1] = y / INTERVAL;
        
        if(tempHTML == "")
        {
            tempHTML = document.getElementById("action").innerHTML;
        }
        
        spot[3] = "startCustom"
        
        document.getElementById("action").innerHTML = "Start here?  Starting direction: <input type='submit' value='Up' onclick='startCustom(-1,-1,\"up\")'/> <input type='submit' value='Down' onclick='startCustom(-1,-1,\"down\")'/> <input type='submit' value='Right' onclick='startCustom(-1,-1,\"right\")'/> <input type='submit' value='Left' onclick='startCustom(-1,-1,\"left\")'/> <input type='submit' value='Cancel' style='margin-left: 30px' onclick='cancel_button()' />"
    }
    else if(direction != "")
    {
        tempHTML = "";
        spot[0] = customSpot[0];
        spot[1] = customSpot[1];
        spot[2]=direction;

        route = []
        drawGrid();
        
        var tempSpot = [];
        tempSpot[0] = spot[0];
        tempSpot[1] = spot[1];
        tempSpot[2] = spot[2];
        route.push( {"spot":tempSpot, "obstacle":"Start"} );
        
        resumeMaze()
    }
}


//=========================================================
//=========================================================
//These functions power the maze creator.

function createMaze()
{
    route = [];
    drawGrid();
    document.getElementById("action").innerHTML = createMAZE;
    spot[3]="drawing";  //necessary so the click handler knows
                        //you're in the draw setting.
                        //Otherwise the click won't be passed to 
                        //the correct function.
}


function drawSetting(type)
{
    OBSTACLE_TYPE = type;
}


function eraseMaze()
{
    if(confirm("Are you sure?"))
    { 
    
        obstacles = []
    
        INTERVAL = 20;  //line spacing

        X_GRIDS = 28;
        Y_GRIDS = 12;
        drawGrid();
    }    
}


function changeGridSize(horizontal, vertical)
{
    if(horizontal==null)
    {	//function calls itself recursively. First display prompt, then get value.
        tempHTML = document.getElementById("action").innerHTML
        document.getElementById("action").innerHTML = "(10 < x < 200) Horizontal Grids: <input type='text' id='horizontal' style='width:40px; margin-left: 5px; margin-right: 20px;'/> Vertical Grids: <input type='text' id='vertical' style='width:40px; margin-left: 5px;'/> <input type='submit' value='OK' onclick='changeGridSize( document.getElementById(\"horizontal\").value, document.getElementById(\"vertical\").value )'/>"
        
        document.getElementById("horizontal").value = X_GRIDS;
        document.getElementById("vertical").value = Y_GRIDS;
        
    }
    else
    {
        horizontal = Number(horizontal)
        vertical = Number(vertical)
        
        if(!isNaN(horizontal) && !isNaN(vertical) 
            && horizontal < 201 && horizontal > 9
            && vertical < 201 && vertical > 9 )
        {
            /* if(horizontal > 200)
            { horizontal = 200; } 
            else if(horizontal < 5)
            { horizontal = 5; }

            if(vertical > 200)
            { vertical = 200; } 
            else if(vertical < 5)
            { vertical = 5; } */

            X_GRIDS = Math.round(horizontal);
            Y_GRIDS = Math.round(vertical);

            CANVAS_WIDTH = INTERVAL * X_GRIDS + (BORDER*2);
            CANVAS_HEIGHT = INTERVAL * Y_GRIDS + (BORDER*2);
            
            drawGrid();
            
			horizontal=null;
			vertical=null;
			
            cancel_button()
        }   
    }
}

function displayEnds()
{
	var beginIndex = findBegin()
	var endIndices = findEnds()
	
	//Get context
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');
	//var centerX = canvas.width / 2;
	//var centerY = canvas.height / 2;
	var radius = INTERVAL / 2 + 5;
	
	//Identify the beginning
	var centerX = (obstacles[beginIndex]["x"] * INTERVAL) + INTERVAL / 2 + 1
	var centerY = obstacles[beginIndex]["y"] * INTERVAL
	
		//obstacles[i]["x"] == spot[0] &&
		//obstacles[i]["y"] == spot[1] &&
		//obstacles[i]["orient"] == "vertical" &&
             
	context.beginPath();
	context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
	//context.fillStyle = 'green';
	//context.fill();
	context.lineWidth = 3;
	context.strokeStyle = '#FFA613';
	context.stroke();
	
    for (var i=0; i<endIndices.length; i++)
	{

		if(obstacles[endIndices[i]]["orient"]=="horizontal")
		{
			var centerX = (obstacles[endIndices[i]]["x"] * INTERVAL) + INTERVAL / 2 + 1
			var centerY = obstacles[endIndices[i]]["y"] * INTERVAL
		}
		else{
			var centerX = obstacles[endIndices[i]]["x"] * INTERVAL + 1
			var centerY = (obstacles[endIndices[i]]["y"] * INTERVAL) + INTERVAL / 2 + 1
		}
		
		context.beginPath();
		context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
		//context.fillStyle = 'green';
		//context.fill();
		context.lineWidth = 3;
		context.strokeStyle = '#FFA613';
		context.stroke();

	}
	
	
	
	
	
}


//==========================================================
//==========================================================
//These functions power the maze solver.

//enters the maze solver mode.
function solveMaze()
{
    document.getElementById("action").innerHTML = mazeSOLVER;
	if(route.length > 0)
	{
		document.getElementById("action").innerHTML += "<input type='submit' value='Resume Maze' onclick='resumeMaze()'/>"
	}
    spot[3]="stopped";  //needs to be changed
}                       //so the click handler won't send 
                        //clicks to the maze creator.

//handles the 'stop maze' button.
//The move() function checks for the spot status
//and stops if the status is 'stopped'.
function stopMaze()
{
    spot[3] = "stopped";
    document.getElementById("action").innerHTML = pausedHTML;
}

//resumes the maze after pausing.
function resumeMaze()
{
    spot[3] = "moving";
    turns = [];
    document.getElementById("action").innerHTML = movingHTML;
    move();
}

//finds the beginning obstacle and starts the maze from there.
function startMaze()
{
    beginObstacle = findBegin()
    route = []

    if(beginObstacle == -1)
    {
        alert("A beginning location has not been placed yet!\n\nGo to the Create Maze page (Main Menu-->Maze Creator) and place the maze beginning. The maze will start upwards from that location. Go to the Instructions page (Main Menu-->Instructions) for more information.")
    } else
    {
        //set the action bar to say "Start the Maze"
        document.getElementById("action").innerHTML = movingHTML;

        spot = [ obstacles[beginObstacle]["x"], obstacles[beginObstacle]["y"] - 1/2 , "up", "moving"];

        var tempSpot = [];
        tempSpot[0] = spot[0];
        tempSpot[1] = spot[1];
        tempSpot[2] = spot[2];
        route.push( {"spot":tempSpot, "obstacle":obstacles[beginObstacle]} );

        drawGrid(); //to erase the line that's already there. Refresh.
        move();
    }
}

//This is the function that moves the line.
//It sets up an interval function, which runs repeatedly
//to nudge the line forward.
//It stops after it arrives at the location of the next obstacle.
function move()
{
    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");
 
    var pixelsSpot;
        
    //an array containing the distance to the next stop
    //and the information about the next obstacle.
    var stop = checkObstacles();

    //move the line on an interval
    var time_interval = setInterval(function() {

		//Do this first. Otherwise, the backtrack function will not work properly.
        if(spot[3] == "stopped")
        {
            clearInterval(time_interval);
			return;
        }

		context.beginPath();   //First draw a line in GREEN
        context.strokeStyle="#007700"; //dark green

        context.moveTo( Math.round(spot[0]*INTERVAL + INTERVAL/2)+BORDER, 
                         Math.round(spot[1]*INTERVAL + INTERVAL/2)+BORDER ); 

        switch(spot[2])  //move the line in the right direction,
        {                //while keeping it in reference to the grids.
            case "up":
                pixelsSpot = spot[1]*INTERVAL;
                pixelsSpot -= MOVEDIST;
                spot[1] = pixelsSpot / INTERVAL;
                break;
            case "down":
                pixelsSpot = spot[1]*INTERVAL;
                pixelsSpot += MOVEDIST;
                spot[1] = pixelsSpot / INTERVAL;
                break;
            case "right":
                pixelsSpot = spot[0]*INTERVAL;
                pixelsSpot += MOVEDIST;
                spot[0] = pixelsSpot / INTERVAL;
                break;
            case "left":
                pixelsSpot = spot[0]*INTERVAL;
                pixelsSpot -= MOVEDIST;
                spot[0] = pixelsSpot / INTERVAL;
                break;
        }

        
        //draw the line, ALWAYS keeping it in reference to the grids.
        context.lineTo( Math.round(spot[0]*INTERVAL + INTERVAL/2)+BORDER, 
                        Math.round(spot[1]*INTERVAL + INTERVAL/2)+BORDER );  
        context.stroke();

        //Decrease the distance to the next obstacle
        pixelsSpot = stop["dist"]*INTERVAL;
        pixelsSpot -= MOVEDIST;
        stop["dist"] = pixelsSpot / INTERVAL;

        /*
        //Now give the line a BLACK tip AHEAD of your spot.
        context.beginPath();   
        context.moveTo( Math.round(spot[0]*INTERVAL + INTERVAL/2), 
                        Math.round(spot[1]*INTERVAL + INTERVAL/2) );  
        context.strokeStyle="#000000";

        var tip = []
        tip[0]=spot[0]
        tip[1]=spot[1]
        
        switch(spot[2])  //Add a BLACK tip 
        {                //so you can better see the END.
            case "up":
                pixelsSpot = tip[1]*INTERVAL;
                pixelsSpot -= MOVEDIST;
                tip[1] = pixelsSpot / INTERVAL;
                break;
            case "down":
                pixelsSpot = tip[1]*INTERVAL;
                pixelsSpot += MOVEDIST;
                tip[1] = pixelsSpot / INTERVAL;
                break;
            case "right":
                pixelsSpot = tip[0]*INTERVAL;
                pixelsSpot += MOVEDIST;
                tip[0] = pixelsSpot / INTERVAL;
                break;
            case "left":
                pixelsSpot = tip[0]*INTERVAL;
                pixelsSpot -= MOVEDIST;
                tip[0] = pixelsSpot / INTERVAL;
                break;
        }
        
        context.lineTo( Math.round(tip[0]*INTERVAL + INTERVAL/2), 
                        Math.round(tip[1]*INTERVAL + INTERVAL/2) );  
        context.stroke();
        */

        
        //If you hit an obstacle, clear the interval
        //and handle each obstacle differently.
        if (stop["dist"] <= 0)
        {
            clearInterval(time_interval);
            obstacleHandler(stop["obstacle"]);
        }        
        
    }, TIME_INTERVAL);  //how often in ms the line is moved.
}

//================================================
//================================================
//These functions handle checking for and hitting obstacles.

//when you start moving, this finds which obstacle you're
//going to hit next.
function checkObstacles()
{
    var stop = {};
    var inColumn = [];
    var inRow = [];

    switch(spot[2])
    {
        case "up":
            //check for obstacles in the same COLUMN
            //that are ABOVE your spot.
            //and are oriented HORIZONTALLY
            for (var i=0; i<obstacles.length; i++)
            {
                if(obstacles[i]["x"] == spot[0] &&
                   obstacles[i]["y"] <= spot[1] &&
                   obstacles[i]["orient"] == "horizontal" )
                {
                    inColumn.push(obstacles[i]);                
                }
            }
            //if NONE, then add the TOP edge of the screen.
            if(inColumn.length == 0)
            {
                var DictItem = {}
                DictItem["type"]="edge"
                DictItem["orient"]="horizontal"
                DictItem["x"]=spot[0]
                DictItem["y"]=0 - 0.5
                inColumn.push(DictItem) 
            }
            break;

        case "down":
            //check for obstacles in the same COLUMN
            //that are BELOW your spot
            //and are oriented HORIZONTALLY
            for (var i=0; i<obstacles.length; i++)
            {
                if(obstacles[i]["x"] == spot[0] &&
                   obstacles[i]["y"] > spot[1] + 1 &&
                   obstacles[i]["orient"] == "horizontal" )
                {
                    inColumn.push(obstacles[i]);
                }
            }
            //if NONE, then add the BOTTOM edge of the screen.
            if(inColumn.length == 0)
            {
                var DictItem = {}
                DictItem["type"]="edge"
                DictItem["orient"]="horizontal"
                DictItem["x"]=spot[0]
                DictItem["y"]=document.getElementById("canvas").height/INTERVAL + 1 - 0.5 //+1 because it's going DOWN
                inColumn.push(DictItem)
            }
            break;
            
        case "right":
            //check for obstacles in the same ROW
            //that are TO THE RIGHT OF your spot
            //and are oriented VERTICALLY
            for (var i=0; i<obstacles.length; i++)
            {
                if(obstacles[i]["y"] == spot[1] &&
                   obstacles[i]["x"] > spot[0] + 1 && // >, not >=
                   obstacles[i]["orient"] == "vertical" )
                {
                    inRow.push(obstacles[i]);
                }
            }
            //if NONE, then add the RIGHT edge of the screen.
            if(inRow.length == 0)
            {
                var DictItem = {}
                DictItem["type"]="edge"
                DictItem["orient"]="vertical"
                DictItem["x"]=document.getElementById("canvas").width/INTERVAL + 1 - 0.5  // +1 because it's moving RIGHT
                DictItem["y"]=spot[1]
                inRow.push(DictItem)
            }
            break;
        
        case "left":    
            //check for obstacles in the same ROW
            //that are TO THE LEFT OF your spot
            //and are oriented VERTICALLY
            for (var i=0; i<obstacles.length; i++)
            {
                if(obstacles[i]["y"] == spot[1] &&
                   obstacles[i]["x"] <= spot[0] &&
                   obstacles[i]["orient"] == "vertical" )
                {
                    inRow.push(obstacles[i]);
                }
            }
            //if NONE, then add the LEFT edge of the screen.
            if(inRow.length == 0)
            {
                var DictItem = {}
                DictItem["type"]="edge"
                DictItem["orient"]="vertical"
                DictItem["x"]=0 - 0.5
                DictItem["y"]=spot[1]
                inRow.push(DictItem) 
            }
            break;
    }

    if(inColumn.length > 0) //if up or down
    {   //sort obstacles based on which is CLOSEST to your spot.
        inColumn.sort(function(a, b) {
            var x = Math.abs(a["y"] - spot[1]); 
            var y = Math.abs(b["y"] - spot[1]);
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        } )

        //now return the closest obstacle and it's distance.
        stop["obstacle"] = inColumn[0]
        
        switch(spot[2])
        {
            case "up":
                stop["dist"] = Math.abs(stop["obstacle"]["y"] - spot[1])
                break;
            case "down":
                stop["dist"] = Math.abs(stop["obstacle"]["y"] - spot[1]) - 1 //minus ONE grid.          
                break;
        }



    }
    
    if(inRow.length > 0) //if right or left
    {   //sort obstacles based on which is CLOSEST to your spot.
        inRow.sort(function(a, b) {
            var x = Math.abs(a["x"] - spot[0]); 
            var y = Math.abs(b["x"] - spot[0]);
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        } )

        //now return the closest obstacle and it's distance.
        stop["obstacle"] = inRow[0]

        switch(spot[2])
        {
            case "right":
                stop["dist"] = Math.abs(stop["obstacle"]["x"] - spot[0] - 1) // minus ONE grid.
                break;
            case "left":
                stop["dist"] = Math.abs(stop["obstacle"]["x"] - spot[0])
                break;
        }
    }

    if(stop["obstacle"]["type"] == "end")
    {
        stop["dist"] += 0.5; //so you actually hit the endpost :-).
    }

    return stop;
}



//this function handles what to do when you hit an obstacle.
function obstacleHandler(stop_obstacle, checkNumber)   
                           //checkNumber = flag to use this function
{                                          //to check number of directions
    //just in case the interval is an odd number,
    //and you didn't land exactly on INTERVAL
    //this will fix that problem. :-)
    spot[0]=Math.round(spot[0]);
    spot[1]=Math.round(spot[1]);

    spot[3]="stopped";
    
    drawGrid(); //refresh the line so the corners look nice.
                //do this BEFORE adding the last obstacle
                //so the line refresh can make the last segment
                //in a darker color.

    if(checkNumber != 1)
    {       //add the next stop point to the route[] list.
        var tempSpot = [];
        tempSpot[0] = spot[0];
        tempSpot[1] = spot[1];
        tempSpot[2] = spot[2];
        route.push( {"spot":tempSpot, "obstacle":stop_obstacle} );

    }    
    
    var sides = [];  //will be populated with which sides
                     //of the square have obstacles in them

    for (var i=0; i<obstacles.length; i++)
    {
        if(  obstacles[i]["x"] == spot[0] &&
             obstacles[i]["y"] == spot[1] &&
             obstacles[i]["orient"] == "vertical" &&
             obstacles[i]["type"] != "permeable" )
            {  sides.push("left");  }
        
        if(  obstacles[i]["x"] == spot[0] &&
             obstacles[i]["y"] == spot[1] &&
             obstacles[i]["orient"] == "horizontal" &&
             obstacles[i]["type"] != "permeable" )
            {  sides.push("top");  }
        
        if(  obstacles[i]["x"] == (spot[0] + 1) &&
             obstacles[i]["y"] == spot[1] &&
             obstacles[i]["orient"] == "vertical" &&
             obstacles[i]["type"] != "permeable" )
            {  sides.push("right");  }
                        
        if ( obstacles[i]["x"] == spot[0] &&
             obstacles[i]["y"] == (spot[1] + 1) &&
             obstacles[i]["orient"] == "horizontal" &&
             obstacles[i]["type"] != "permeable" )
            {  sides.push("bottom");  }
    }

    var directions = [] //will be populated with the direction 
                        // choices the user has.

    //now handle the directions based on where you are oriented.
    switch(spot[2])  
    {   //switch case for your direction when you stopped.
        case "up":  //we KNOW there is an obstacle on TOP.
            if( stop_obstacle["type"] == "permeable" )
            { directions.push("forward")
              turns["upkey"] = "forward"  }
            
            if( isIn(sides, "left") &&
                isIn(sides, "right") )
            { directions.push("backward") 
              turns["downkey"] = "backward" }

            if( isIn(sides, "left") &&
                !isIn(sides, "right") )
            { directions.push("right") 
              turns["rightkey"] = "right" }
            
            if( !isIn(sides, "left") &&
                isIn(sides, "right") )
            { directions.push("left")
              turns["leftkey"] = "left" }
            
            if( !isIn(sides, "right") &&
                !isIn(sides, "left") )
            { directions.push("right")
              directions.push("left") 
              turns["rightkey"] = "right"
              turns["leftkey"] = "left" }

            break;

        case "down":  //we KNOW there is an obstacle BELOW.
            if( stop_obstacle["type"] == "permeable" )
            { directions.push("forward") 
              turns["downkey"] = "forward" }
            
            if( isIn(sides, "left") &&
                isIn(sides, "right") )
            { directions.push("backward")
              turns["upkey"] = "backward" }

            if( isIn(sides, "left") &&
                !isIn(sides, "right") )
            { directions.push("left") 
              turns["rightkey"] = "left" }
                                        //left and right are swapped
                                        //when moving down
            if( !isIn(sides, "left") &&
                isIn(sides, "right") )
            { directions.push("right") 
              turns["leftkey"] = "right" }
                                        //left and right are swapped
                                        //when moving down
            if( !isIn(sides, "right") &&
                !isIn(sides, "left") )
            { directions.push("right")
              directions.push("left") 
              turns["leftkey"] = "right"
              turns["rightkey"] = "left" }
            break;

        case "right": //we KNOW there is an obstacle TO THE RIGHT.
            if( stop_obstacle["type"] == "permeable" )
            { directions.push("forward")
              turns["rightkey"] = "forward" }
            
            if( isIn(sides, "top") &&
                isIn(sides, "bottom") )
            { directions.push("backward") 
              turns["leftkey"] = "backward" }

            if( isIn(sides, "top") &&
                !isIn(sides, "bottom") )
            { directions.push("right") 
              turns["downkey"] = "right" }

            if( !isIn(sides, "top") &&
                isIn(sides, "bottom") )
            { directions.push("left") 
              turns["upkey"] = "left" }

            if( !isIn(sides, "top") &&
                !isIn(sides, "bottom") )
            { directions.push("right")
              directions.push("left") 
              turns["downkey"] = "right"
              turns["upkey"] = "left" }
            break;

        case "left": //we KNOW there is an obstacle TO THE LEFT.
            if( stop_obstacle["type"] == "permeable" )
            { directions.push("forward")
              turns["leftkey"] = "forward" }
            
            if( isIn(sides, "top") &&
                isIn(sides, "bottom") )
            { directions.push("backward")
              turns["rightkey"] = "backward" }

            if( isIn(sides, "top") &&
                !isIn(sides, "bottom") )
            { directions.push("left")
              turns["downkey"] = "left" }

            if( !isIn(sides, "top") &&
                isIn(sides, "bottom") )
            { directions.push("right") 
              turns["upkey"] = "right" }

            if( !isIn(sides, "top") &&
                !isIn(sides, "bottom") )
            { directions.push("right")
              directions.push("left")
              turns["upkey"] = "right"
              turns["downkey"] = "left" }
            break;
    }
    
    if(checkNumber == 1)    //flag to use this function
    {                       //just to check number of directions.
        return directions.length
    }
    
    //to simplify changing the action bar
    actionBar = document.getElementById("action");
    
    if(stop_obstacle["type"] == "edge")
    {
        //set the action bar to say "Start the Maze"
        actionBar.innerHTML = "<input type='submit' value='Backtrack' onclick='backTrack()'/>" + mazeSOLVER;
        spot[3] = "stopped";
        directions = [];
        alert("You went off the edge!")
    }
    else if(stop_obstacle["type"] == "end")
    {
        actionBar.innerHTML = mazeSOLVER;
        actionBar.innerHTML = mazeSOLVER;
        spot[3] = "stopped";
        directions = [];
        alert("Goncratulations! You win!");
    }
    else if (directions.length == 1 && directions[0] != "backward")
    {
        if(directions[0] == "right")
        { turnRight(); }
    
        if(directions[0] == "left")
        { turnLeft(); }        
    }
    else 
    {
        actionBar.innerHTML = turningHTML;
    }

    if(directions.length != 1)
    {
        if(isIn(directions, "left"))
        {
          /*  actionBar.innerHTML += " <input type='submit' value='Turn Left' onclick='turnLeft()'/>" */
          
          //I added this to make the maze a little less disorienting.
          switch(spot[2])
          {
            case "up":
                actionBar.innerHTML += " <input type='submit' value='Go Left' onclick='turnLeft()'/>"
                break;
            case "down":
                actionBar.innerHTML += " <input type='submit' value='Go Right' onclick='turnLeft()'/>"
                break;
            case "right":
                actionBar.innerHTML += " <input type='submit' value='Go Up' onclick='turnLeft()'/>"
                break;
            case "left":
                actionBar.innerHTML += " <input type='submit' value='Go Down' onclick='turnLeft()'/>"
                break;
          }
          
        }

        if(isIn(directions, "right"))
        {
          /*  actionBar.innerHTML += " <input type='submit' value='Turn Right' onclick='turnRight()'/>" */
          
          //I added this to make the maze a little less disorienting.
          switch(spot[2])
          {
            case "up":
                actionBar.innerHTML += " <input type='submit' value='Go Right' onclick='turnRight()'/>"
                break;
            case "down":
                actionBar.innerHTML += " <input type='submit' value='Go Left' onclick='turnRight()'/>"
                break;
            case "right":
                actionBar.innerHTML += " <input type='submit' value='Go Down' onclick='turnRight()'/>"
                break;
            case "left":
                actionBar.innerHTML += " <input type='submit' value='Go Up' onclick='turnRight()'/>"
                break;
          }
          
        }
    }
    
    if(isIn(directions, "backward"))
    {
        actionBar.innerHTML += " <input type='submit' value='Turn Around' onclick='turnBackward()'/>"
    }
    
    if(isIn(directions, "forward"))
    {
        actionBar.innerHTML += " <input type='submit' value='Move Forward' onclick='moveForward()'/>"
    }

    if(directions.length > 1 ) //&& !isIn(directions, "backward") )
    {actionBar.innerHTML += "<input type='submit' value='Restart' onclick='startMaze()' style='margin-left: 15px;'/> <input type='submit' value='Custom Spot' onclick='startCustom()'/>" }
}

//======================================================
//======================================================
//These four functions handle turns.

function turnRight()
{
//    alert("I'm turning right!")
    switch(spot[2])
    {
        case "up":
            spot[2]="right"
            break;
        case "down":
            spot[2]="left"
            break;
        case "right":
            spot[2]="down"
            break;
        case "left":
            spot[2]="up"
            break;
    }
    resumeMaze()
}

function turnLeft()
{
//    alert("I'm turning left!")
    switch(spot[2])
    {
        case "up":
            spot[2]="left"
            break;
        case "down":
            spot[2]="right"
            break;
        case "right":
            spot[2]="up"
            break;
        case "left":
            spot[2]="down"
            break;
    }
    resumeMaze()
}

function moveForward()
{
    var pixelsSpot;
    
    //move the line forward just a tad to get it past
    //its current obstacle, so it can find a new one.
    //Uses the same algorithm as above.
    switch(spot[2])  
    {                
        case "up":
            pixelsSpot = spot[1]*INTERVAL;
            pixelsSpot -= MOVEDIST;
            spot[1] = pixelsSpot / INTERVAL;
            break;
        case "down":
            pixelsSpot = spot[1]*INTERVAL;
            pixelsSpot += MOVEDIST;
            spot[1] = pixelsSpot / INTERVAL;
            break;
        case "right":
            pixelsSpot = spot[0]*INTERVAL;
            pixelsSpot += MOVEDIST;
            spot[0] = pixelsSpot / INTERVAL;
            break;
        case "left":
            pixelsSpot = spot[0]*INTERVAL;
            pixelsSpot -= MOVEDIST;
            spot[0] = pixelsSpot / INTERVAL;
            break;
        }
    resumeMaze();
}

function turnBackward()
{
//    alert("Reversing direction!")
    switch(spot[2])
    {
        case "up":
            spot[2]="down"
            break;
        case "down":
            spot[2]="up"
            break;
        case "right":
            spot[2]="left"
            break;
        case "left":
            spot[2]="right"
            break;
    }
    resumeMaze()
}

function backTrack()
{
    var tempVar = route.pop();

    //if you are AT an obstacle, go another obstacle previous.
    //Otherwise, just go to the final obstacle.
    if( spot[0]==tempVar["spot"][0] && 
        spot[1]==tempVar["spot"][1] )
    {
        tempVar = route.pop();
    }

    spot[0] = tempVar["spot"][0]
    spot[1] = tempVar["spot"][1]
    spot[2] = tempVar["spot"][2]
    
    var directionsCheck = obstacleHandler( tempVar["obstacle"], 1 );
    
    //if there is only one direction available,
    //keep going backward until there is a choice.
    while( directionsCheck == 1 ) 
    {                                   
        tempVar = route.pop();
        spot[0] = tempVar["spot"][0]
        spot[1] = tempVar["spot"][1]
        spot[2] = tempVar["spot"][2]

        if( tempVar["obstacle"]["type"]=="begin" )
        { 
            startMaze();
            return; 
        }
        if( tempVar["obstacle"]=="Start" )
        {
            //have to repopulate the route[] with the custom starting spot.
            route = []
        
            var tempSpot = [];
            tempSpot[0] = spot[0];
            tempSpot[1] = spot[1];
            tempSpot[2] = spot[2];
            route.push( {"spot":tempSpot, "obstacle":"Start"} );
            
            resumeMaze();
            return;
        }

        var directionsCheck = obstacleHandler( tempVar["obstacle"], 1 );
    }

    //there are TWO ways the backtrack could approach the begin: in the above loop,
    //or also after another obstacle. So I have to put this segment in twice.
    if( tempVar["obstacle"]["type"]=="begin" )
    { 
        startMaze();
        return; 
    }
    if( tempVar["obstacle"]=="Start" )
    {
        //have to repopulate the route[] with the custom starting spot.
        route = []
        
        var tempSpot = [];
        tempSpot[0] = spot[0];
        tempSpot[1] = spot[1];
        tempSpot[2] = spot[2];
        route.push( {"spot":tempSpot, "obstacle":"Start"} );
           
        resumeMaze();
        return;
    }
    
    drawGrid();
    obstacleHandler( tempVar["obstacle"] );
    
}



//==========================================================
//==========================================================
//These functions change background settings.


function zoomPrompt()
{
    if (tempHTML == "")
    {
        tempHTML = document.getElementById("action").innerHTML;
    }
    
    document.getElementById("action").innerHTML = "<input type='submit' value='Zoom In' onclick='zoomIn()'/> <input type='submit' value='Zoom Out' onclick='zoomOut()'/> <input type='submit' value='Done'  onclick='cancel_button()'/>&nbsp; You may also adjust with the + and - keys."

}

function zoomIn()
{
    if(INTERVAL <= 35)  //limit to how much you can zoom in.
    {
        INTERVAL += 5;
        CANVAS_WIDTH = INTERVAL * X_GRIDS;
        CANVAS_HEIGHT = INTERVAL * Y_GRIDS;
        drawGrid();
    }
}


function zoomOut()
{
    if(INTERVAL >= 15)  //limit to how much you can zoom out.
    {
        INTERVAL -= 5;
        CANVAS_WIDTH = INTERVAL * X_GRIDS;
        CANVAS_HEIGHT = INTERVAL * Y_GRIDS;
        drawGrid();
    }
}


function speedUp()
{
    if(TIME_INTERVAL > 10)
    { TIME_INTERVAL -= 10 }
}


function slowDown()
{
    if(TIME_INTERVAL < 100)
    { TIME_INTERVAL += 10 }
}


//=======================================================
//=======================================================
//These functions handle file processing.


function loadMaze()
{
    if (tempHTML == "")
    {
        tempHTML = document.getElementById("action").innerHTML;
    }
    
    document.getElementById("action").innerHTML = "Browse For File: <input type='file' accept='.maze' onchange='getFile(event)' id='files' name='files[]'/> <input type='submit' value='Cancel'  onclick='cancel_button()'/>"
	
}	//style='margin-right: -60px;'


function loadSample()
{
    if(tempHTML == "")
    {
        tempHTML = document.getElementById("action").innerHTML;
    }
    
    document.getElementById('action').innerHTML = "<input type='submit' value='Sample 1 (Easy)' onclick='sampleFile(1)'/> <input type='submit' value='Sample 2 (Challenging)' onclick='sampleFile(2)' /> <input type='submit' value='Sample 3 (Challenging)' onclick='sampleFile(3)' /> <input type='submit' value='Cancel'  onclick='cancel_button()' style='font-weight:bold;'/> <input type='submit' value='Load from File' style='margin-left:25px;' onclick='loadMaze()' />"
}


function getFile(event)
{
    var file = event.target.files[0];
    tempHTML = "";
    
    if(file) {
        document.getElementById('action').innerHTML = mazeSOLVER;

        var reader = new FileReader();
        reader.onload = function(event) {
            var contents = event.target.result;
            processFile(contents);
        };

        reader.onerror = function(event) {
            console.error("File could not be read! Code " + event.target.error.code);
        };
    }
    
    reader.readAsText(file);
}



function processFile(contents)
{
	//XML Parser
	var xml = (new window.DOMParser() ).parseFromString(contents, "text/xml")
	    
	X_GRIDS = parseInt(xml.getElementsByTagName('X_GRIDS')[0].firstChild.nodeValue);
    Y_GRIDS = parseInt(xml.getElementsByTagName('Y_GRIDS')[0].firstChild.nodeValue);
	DefaultSpacing = parseInt(xml.getElementsByTagName('DefaultSpacing')[0].firstChild.nodeValue);
	
    //Each obstacle contains dictionaries:
    // { "type":  <obstacle type>
    //   "orient": <obstacle orientation>
    //   "x":     <x-coordinate of origin>
    //   "y":     <y-coordinate of origin> }

    obstacles = []
	route = []
	
	var XML_obstacles = xml.getElementsByTagName('obstacle')
	for (var i = 0; i < XML_obstacles.length; i++) {

		newObstacle = {}
		
        newObstacle["type"]=XML_obstacles[i].getElementsByTagName("type")[0].firstChild.nodeValue
        newObstacle["orient"]=XML_obstacles[i].getElementsByTagName("orient")[0].firstChild.nodeValue
        newObstacle["x"]=parseInt(XML_obstacles[i].getElementsByTagName("x")[0].firstChild.nodeValue)
        newObstacle["y"]=parseInt(XML_obstacles[i].getElementsByTagName("y")[0].firstChild.nodeValue)

        obstacles.push(newObstacle)
	
	}

    INTERVAL = DefaultSpacing
    CANVAS_WIDTH = INTERVAL * X_GRIDS + (BORDER*2);
    CANVAS_HEIGHT = INTERVAL * Y_GRIDS + (BORDER*2);
	drawGrid()

}


function sampleFile(sampleNum, customInterval)
{
	var xmlhttp = new XMLHttpRequest();

	xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
           if (xmlhttp.status == 200) {
			   //alert( xmlhttp.responseText )
			   processFile( xmlhttp.responseText );
           }
           else if (xmlhttp.status == 400) {
              alert('There was an error 400');
           }
           else {
               alert(xmlhttp.status + ' was returned');
           }
        }
    };

    xmlhttp.open("GET", "Files/Sample" + sampleNum.toString() + ".maze", true);
    xmlhttp.send();


    document.getElementById('action').innerHTML = mazeSOLVER;
	
	if(customInterval != null)
	{ INTERVAL = customInterval	}
}


function saveMaze()
{
    if(tempHTML == "")
    {
        tempHTML = document.getElementById("action").innerHTML;
    }
    document.getElementById("action").innerHTML = "Output Filename: <input type='text' id='savefield' style='width:110px; margin-left: 5px;'/>.maze <input type='submit' style='margin-left:20px;' value='OK' onclick='outputFile()'/> <input type='submit' value='Cancel' onclick='cancel_button()'/>"
}

function outputFile()
{
    tempHTML = ""
    
	var textString = "";
    textString += "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\r\n"
	textString += "<maze>\r\n"
	textString += "  <size><X_GRIDS>" + X_GRIDS + "</X_GRIDS>"
	textString += "<Y_GRIDS>" + Y_GRIDS + "</Y_GRIDS>"
	textString += "<DefaultSpacing>" + INTERVAL + "</DefaultSpacing></size>"
	
    for(var i = 0; i<obstacles.length; i++)
    {
        textString += "\r\n  <obstacle>"
		textString += "<type>" + obstacles[i]["type"] + "</type>"
		textString += "<orient>" + obstacles[i]["orient"] + "</orient>"
		textString += "<x>" + obstacles[i]["x"] + "</x>"
		textString += "<y>" + obstacles[i]["y"] + "</y>"
		textString += "</obstacle>"
	}
        
	textString += "\r\n</maze>"
    var savename = document.getElementById('savefield').value + ".maze"

    //handled by FileSaver.js included at top.
    var blob = new Blob([textString], {type: "text/plain;charset=utf-8"});
    saveAs(blob, savename);

    //do this last after processing the file.
    document.getElementById('action').innerHTML = startingHTML;
}


//================================================================
//================================================================
//These functions handle opening new windows.

function solutions(sampleNum)
{	//opens itself recursively. 
	//First displays the menu, then opens the window.
	if(sampleNum==null)
	{
		if (tempHTML == "")
		{
			tempHTML = document.getElementById("action").innerHTML;
		}
		
		document.getElementById("action").innerHTML = "<input type='submit' value='Sample 1' onclick='solutions(1)'/> <input type='submit' value='Sample 2' onclick='solutions(2)'/> <input type='submit' value='Sample 3' onclick='solutions(3)'/>&nbsp;&nbsp;Opens as a popup.&nbsp;<input type='submit' value='Cancel'  onclick='cancel_button()'/>"
	}	
	else
	{
		var newImg = new Image();

		newImg.onload = function() {
			var height = newImg.height;
			var width = newImg.width;
			//alert ('The image size is '+width+'*'+height);
			openImage( newImg.src,width,height );
			
		}
		
		var imgSrc = "Files/Solution" + sampleNum.toString() + ".png"
		newImg.src = imgSrc; // this must be done AFTER setting onload
		
		//viewwin = window.open("Files/Solution" + sampleNum.toString() + ".png",'Solution to Sample ' + sampleNum.toString(),"width="+width+", height="+height );

		
		cancel_button();

	}
}

//Open the super secret solution.
function openImage(source, width, height)
{
//	viewwin = window.open(source,"Solution","width="+width*.67+", height="+height*.67 );
//	viewwin = window.open(source,"Solution","width="+width*1.5+", height="+height*1.5 );
	viewwin = window.open(source,"Solution","width="+width+", height="+height );

}

//opens instructions in new tab.
function openInstructions()
{
    var winTop = (screen.height / 2) - (3 * screen.height / 7);
    var winLeft = (screen.width / 2) - (3 * screen.width / 7);
    //var windowFeatures = "width=770,height=570,scrollbars=yes,";
    var windowFeatures = "";
	windowFeatures = windowFeatures + "left=" + winLeft + ",";
    windowFeatures = windowFeatures + "top=" + winTop;
    newWindow = window.open("instructions.html", "_blank"); //, windowFeatures);
}


function window_onunload()
{
    if (typeof (newWindow) != "undefined" && newWindow.closed == false)
    {
        newWindow.close();
    }
}

