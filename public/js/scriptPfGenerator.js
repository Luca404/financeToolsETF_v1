
async function onLoad(){
    checkIfLogged();
    connectToServer();
	showUserName();
}

async function showUserName(){
	let usern = getCookie( "username" );
	var profileDiv = document.getElementById("profileDiv");
	console.log(usern);
	profileDiv.innerText = usern;
}

