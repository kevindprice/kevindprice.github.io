
//asynchronously loads an HTML file body into a given <div> element.
function insertPage(divId, fileName, onload)
{
	var xmlhttp = new XMLHttpRequest();

	//document.write("<base href='./' />");

	xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
           if (xmlhttp.status == 200) {
			   //alert( xmlhttp.responseText )
			   afterLoad( divId, xmlhttp.responseText, onload );
           }
           else if (xmlhttp.status == 400) {
              alert('There was an error 400');
           }
           else {
               alert(xmlhttp.status + ' was returned');
           }
        }
    };

    xmlhttp.open("GET", fileName, true);
    xmlhttp.send();
}


function afterLoad(divId, filetext, onload)
{
	var insertdiv = document.getElementById(divId)
	var sliced = filetext.slice( filetext.search("<body>") + 6, filetext.search("</body>") )

	insertdiv.innerHTML = sliced
	
	loadScripts(sliced, onload)
}

//recursive function. Waits for each script to be loaded before loading the next one.
//Loads each script asynchronously, successively.
function loadScripts(filetext, onload)
{
	if(filetext.search("<script")==-1)
	{eval(onload); return;}

	var head = document.getElementsByTagName("head")[0];

	var script = filetext.slice(filetext.search("<script"), filetext.search("</script>")+9 )
	filetext = filetext.replace(script,"")

	var scriptInner = script.slice(script.search(">")+1,script.search("</script>"))
	var xml = (new window.DOMParser() ).parseFromString(script, "text/xml")
	var XML_script = xml.getElementsByTagName('script')[0]
	
	var script_type = XML_script.getAttribute("type")
	var script_onload = XML_script.getAttribute("onload")
	var script_src = XML_script.getAttribute("src")
	
	var newScript = document.createElement("script");
	if(script_src!=null){ newScript.src = script_src; }
	if(script_type!=null){ newScript.type=script_type; }
	newScript.onload = function() { eval(script_onload); eval(scriptInner); loadScripts(filetext, onload); }
	head.appendChild(newScript);
}


//was completely unnecessary and not fully debugged. (not used)
function adjustWorkingDir(script_src)
{
	if(script_src=="" || script_src==null)
	{ return ""; }

	if(script_src.startsWith("http") || script_src.startsWith("ftp"))
	{
		return script_src;
	}
	else if(script_src[0]=="/")
	{
		return ".." + script_src;
	}
	else
	{
		return "../" + script_src;
	}
}
