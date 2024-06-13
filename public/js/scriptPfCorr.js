//CONST
var PERIOD = 2;
var NORMALIZED = 2;
var pfData;
var portFolios;
var colorsArray = ["#17A589","#F9E79F","#EC7063","#82E0AA","#F7DC6F","#99A3A4","#B3B6B7","#A569BD","#CB4335","#196F3D"];


async function onLoad(){
    connectToServer();
    pfData = await showLoginDiv();
    console.log( pfData );
    if( pfData != false )
        loadSavedPf();
    else
        console.log("No saved Portfolio for logged user!");
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
    loadSingleAssetData();
    loadCorrelationData(); 
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
    loadSingleAssetData();
    loadCorrelationData();
}

function setPeriod(){
    var opt = document.getElementById("selectSingleAssetPeriod");
    var pfPeriod = opt.options[opt.selectedIndex].text;
    PERIOD = pfPeriod.split("Y")[0];
    loadSingleAssetData();
    loadCorrelationData();
}

function setSingleAssetNormalized(){
    var input = document.getElementById("selectNormalized");
    if( input.checked )
        NORMALIZED = true;
    else
        NORMALIZED = false;
    loadSingleAssetData();
}

function loadSingleAssetData(){
    selectedPf = getCookie( "selectedPf" );
    if( selectedPf == "" )
        selectedPf = 0;
    var pfName = portFolios[selectedPf].pfName;
    var pfTickers = portFolios[selectedPf].tickers;

    server.emit("getSingleAssetData", {name: pfName, tickers: pfTickers, period: PERIOD, norm: NORMALIZED}, (res) =>{
        singleAssetData = JSON.parse( res["data"] );
        drawSingleAssetsChart( singleAssetData );
    });
}

function loadCorrelationData(){
    selectedPf = getCookie( "selectedPf" );
    if( selectedPf == "" )
        selectedPf = 0;
    var pfName = portFolios[selectedPf].pfName;
    var pfTickers = portFolios[selectedPf].tickers;
    var weights = portFolios[selectedPf].numShares;

    server.emit("getCorrData", {name: pfName, tickers: pfTickers, period: PERIOD, weights: weights}, (res) =>{
        var corrData = JSON.parse( res["assetsCorr"] );
        var indexes = Object.keys(corrData);
        var corr = [];
        for(var i = 0; i<indexes.length; i++){
            if( i+1 == indexes.length )
                corr.push( corrData[indexes[i]][indexes[0]] );
            else
                corr.push( corrData[indexes[i]][indexes[i+1]] );
        }
        drawCorrTable( corr, indexes );
        var pfCorrData = JSON.parse( res["pfCorr"] );
        drawPfCorrTable( corr, pfCorrData );
    });
}

function drawCorrTable( corr, indexes ){        
    var corrTable = document.getElementById( "corrTable" );
    var tableBody = corrTable.getElementsByTagName( "tbody" )[0];
    $(tableBody).empty();
    for(var i=0;i<indexes.length;i++){
        var tr = document.createElement( "tr" );

        var td1 = document.createElement( "td" );
        td1.appendChild( document.createTextNode( indexes[i] ));
        
        var td2 = document.createElement( "td" );
        if( i+1 != indexes.length )
            td2.appendChild( document.createTextNode( indexes[i+1] ) );
        else
            td2.appendChild( document.createTextNode( indexes[0] ) );
        
        var td3 = document.createElement( "td" );
        td3.appendChild( document.createTextNode( corr[i] ) );
        
        setCorrTdColor( [td3] );
        
        tr.appendChild( td1 );
        tr.appendChild( td2 );
        tr.appendChild( td3 );
        tableBody.appendChild( tr );
    }

}

function drawPfCorrTable( corrData, pfCorrData ){
    console.log( pfCorrData );
    var pfCorrTable = document.getElementById( "pfCorrTable" );
    var tableBody = pfCorrTable.getElementsByTagName( "tbody" )[0];
    $(tableBody).empty();
    var tr = document.createElement( "tr" );

    var td1 = document.createElement( "td" );
    var pfCorr = (( corrData.reduce((a, b) => a + b, 0) ) / corrData.length ) || 0;    
    td1.appendChild( document.createTextNode( pfCorr.toFixed(2) ));
    tr.appendChild( td1 );

    var td2 = document.createElement( "td" ); 
    td2.appendChild( document.createTextNode( pfCorrData["gold"] ));
    tr.appendChild( td2 );

    var td3 = document.createElement( "td" ); 
    td3.appendChild( document.createTextNode( pfCorrData["inflation"] ));
    tr.appendChild( td3 );

    var td4 = document.createElement( "td" ); 
    td4.appendChild( document.createTextNode( pfCorrData["US"] ));
    tr.appendChild( td4 );

    var td5 = document.createElement( "td" ); 
    td5.appendChild( document.createTextNode( pfCorrData["EU"] ));
    tr.appendChild( td5 );

    var td6 = document.createElement( "td" ); 
    td6.appendChild( document.createTextNode( pfCorrData["Asia"] ));
    tr.appendChild( td6 );

    var tds = tr.getElementsByTagName("td");
    setCorrTdColor( tds );

    tableBody.appendChild( tr );
}

function setCorrTdColor( tds ){
    for( var i=0; i<tds.length; i++ ){
        var td = tds[i];
        td.style.backgroundColor = "#33673b";
        if( td.innerText > -0.5 )
            td.style.backgroundColor = "#5FAD56";
        if( td.innerText > 0 )
            td.style.backgroundColor = "#E74C3C";
        if( td.innerText > 0.5 )
            td.style.backgroundColor = "#C0392B";
        
    }
}

function drawSingleAssetsChart(data) {
    //Canvas creation
    var canvasDiv = document.getElementById("singleCanvasDiv");
    if( canvasDiv.children.length > 0 ){
        canvasDiv.removeChild( document.getElementById("singlePerfCanvas") );
    }
    var canvasSinglePerformance = document.createElement("canvas");
    canvasSinglePerformance.id = "singlePerfCanvas";
    canvasSinglePerformance.width = 700;
    canvasSinglePerformance.height = 450;
    canvasSinglePerformance.setAttribute("style", "display: inline-block");
    canvasDiv.appendChild(canvasSinglePerformance);

    //Timestamp to Date conversion
    var tickers = Object.keys(data);
    console.log( tickers );
    var datasetSingle = [];
    for(var i = 0; i < tickers.length; i++){
        datasetSingle[i] = {
            data: Object.values(data[tickers[i]]),
            label: tickers[i],
            borderColor: colorsArray[i],
            fill: false
        };
    }
    var dateArray = Object.keys(data[tickers[0]]);
    var dateList = [];
    for(var i = 0; i < dateArray.length; i++){
        var date = new Date(dateArray[i] * 1);
        var aDate = date.toLocaleDateString();
        dateList.push(aDate);
    }
    
    //Single Performance Chart Draw
    new Chart(document.getElementById("singlePerfCanvas"), {
        type: 'line',
        data: {
            labels: dateList,
            datasets: datasetSingle
        },
        options: {
            title: {
                display: true,
                text: 'Single Assets performance'
            },
            responsive:false,
            elements: {
                point:{
                    radius: 0
                }
            },
            scales: {
                xAxes: [{
                    ticks: {
                        maxTicksLimit: 20
                    }
                }]
            }
        }          
    });
}