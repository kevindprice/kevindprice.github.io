
//asynchronously loads an HTML file body into a given <div> element.
function insertPage(divId, fileName, onload)
{
	var xmlhttp = new XMLHttpRequest();

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
	
	
	loadScripts(filetext, onload)
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
	newScript.src = script_src;
	newScript.type=script_type;
	head.appendChild(newScript);
	newScript.onload = function() { eval(script_onload); loadScripts(filetext, onload) }
}