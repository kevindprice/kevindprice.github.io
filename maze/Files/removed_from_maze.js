		if(mazeDecision["notes"]=="edge")
		{			
			currentIndex = mazeDecision["previousIndex"]
			while( checkedlist[currentIndex]["directions"].length==1 )
			{
				checkedlist[currentIndex]["possible"]==false
				currentIndex = checkedlist[currentIndex]["previousIndex"]
				
				if(currentIndex=="BEGINNING")
					{return "IMPOSSIBLE";}
			}
		}
		else if(mazeDecision["notes"]=="link")
		{
			currentIndex = mazeDecision["previousIndex"]
			while( checkedlist[currentIndex]["directions"].length==1 )
			{
				checkedlist[currentIndex]["notes"]=="link"
				currentIndex = checkedlist[currentIndex]["previousIndex"]
				
				if(currentIndex=="BEGINNING")
					{return "IMPOSSIBLE";}
			}
		}
		else if(mazeDecision["notes"]=="end")
		{
			//do nothing
		}
		else
		{
			if(checkedlist[checkedlist.length-1].hasOwnProperty('links'))
			{
				checkedlist[checkedlist.length-1]["links"].push(checkedlist.length)
				currentIndex = checkedlist.length - 1
				mazeSpot = mazeDecision["choices"][0]
				continue;				
			}
			else { 
				currentIndex = checkedlist[currentIndex]["previousIndex"]
				alert("Does this spot ever get executed?")
			}
		}
		
		
//		{	//If it's already solved all of the paths in this obstacle...
		if(checkedlist[currentIndex]["choices"].length == checkedlist[currentIndex]["directions"].length)
		{
			while(checkedlist[currentIndex]["choices"].length == checkedlist[currentIndex]["directions"].length && checkedlist[currentIndex]["notes"]!="BEGINNING")
			{	
				childNotes = []

				if(checkedlist[currentIndex].hasOwnProperty("choices"))
				{
					for(i=0; i<mazeDecision["choices"].length; i++)
					{
						childNotes.push( checkedlist[checkedlist[currentIndex]["links"][i]]["notes"] )
					}
				}
					
				if(childNotes.indexOf("OK")>=0) //If one of the children still says OK, then this is the correct path!
				{
					currentIndex = checkedlist[currentIndex]["previousIndex"]
				}
				
			}
			
			if(checkedlist[currentIndex]["notes"]=="BEGINNING")
			{
				done=true; //break!
			}
		}
		
		
