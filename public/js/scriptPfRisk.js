//CONST
var pfData;
var PERIOD = 2;
var selectedPf = 0;
var portFolios;
 
async function onLoad(){
    connectToServer();
    pfData = await showLoginDiv();
    console.log( pfData );
    if( pfData != false )
        loadSavedPf();
    else
        console.log("No saved Portfolio for logged user!");
}


function saveSelectedPf(){
    var opt = document.getElementById("savedPfMenu");
    var pfInfo = opt.options[opt.selectedIndex].text;
    var pfName = pfInfo.split(": ")[0];
    var pfTickers = pfInfo.split(": ")[1];
    var k = 0;
    for(var i = 0; i < portFolios.length; i++) {
        if(portFolios[i].pfName == pfName && portFolios[i].tickers == pfTickers )
            k = i;
    }
    setCookie( "selectedPf", k, 5 );
    selectedPf = k;
}

function loadSelectedPf(){
    saveSelectedPf();
    loadRiskData();
}

function setPeriod(){
    var opt = document.getElementById("setPeriod");
    var pfPeriod = opt.options[opt.selectedIndex].text;
    PERIOD = pfPeriod.split("Y")[0];
    loadRiskData();
}

function loadSavedPf(){
    portFolios = pfData;
    var savedPfMenu = document.getElementById('savedPfMenu'); 
    for(var i = 0; i < portFolios.length; i++) {
        var opt = document.createElement('option');
        opt.value = i;
        opt.appendChild(document.createTextNode(portFolios[i].pfName + ":  "));
        opt.appendChild(document.createTextNode(" " + portFolios[i].tickers));
        savedPfMenu.appendChild(opt);
    }
    $("#savedPfMenu").selectpicker("refresh");
    if( getCookie( "selectedPf" ) != "" )
        $("#savedPfMenu").selectpicker( "val", getCookie( "selectedPf" ) );
    else{
        $("#savedPfMenu").selectpicker( "val", "0" );
        setCookie( "selectedPf", k, 0 );
    }
    $("#savedPfMenu").selectpicker("refresh");
    loadRiskData();
}

function loadRiskData(){
    selectedPf = getCookie( "selectedPf" );
    if( selectedPf == "" )
        selectedPf = 0;
    var pfName = portFolios[selectedPf].pfName;
    var pfTickers = portFolios[selectedPf].tickers;
    var weights = portFolios[selectedPf].numShares;

    server.emit("getRiskData", {name: pfName, tickers: pfTickers, period: PERIOD, weights: weights}, (res) =>{
        drawRiskTable( res );
    });
}

function drawRiskTable( data ){
    var pfCorrTable = document.getElementById( "pfRiskTable" );
    var tableBody = pfCorrTable.getElementsByTagName( "tbody" )[0];
    $(tableBody).empty();

    var tr = document.createElement( "tr" );

    var td1 = document.createElement( "td" ); 
    td1.appendChild( document.createTextNode( data["pfVolatility"]+"%" ));
    tr.appendChild( td1 );

    var td2 = document.createElement( "td" ); 
    td2.appendChild( document.createTextNode( data["diversRisk"]+"%" ));
    tr.appendChild( td2 );

    var td3 = document.createElement( "td" ); 
    td3.appendChild( document.createTextNode( data["nonDiversRisk"]+"%" ));
    tr.appendChild( td3 );

    tableBody.appendChild( tr );
}