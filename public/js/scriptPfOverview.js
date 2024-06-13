//CONST
var pfData = [];
var singleAssetData = [];
var portFolios = [];
var userName = "";
var selectedPf;

//PortFolio Period
var sPERIOD = 2;
var NORMALIZED = true;
var pfPERIOD = 2;
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


function drawSingleAssetsChart(data, info) {
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
    
    var tickers = [];
    for( var i=0; i<info.length; i++ )
        tickers.push( info[i]["Symbol"] )
    
    var dataText = [];
    for( var i=0; i<data.length; i++ )
        dataText.push( tickers[i] + ": " + (data[i]*100).toFixed(2) + "%" )
    
    //Assets pie Chart Draw
    new Chart(document.getElementById("singlePerfCanvas"), {
        type: 'pie',
        data: {
            labels: tickers,
            datasets: [{
                data: data,
                hoverOffset: 2,
                backgroundColor: colorsArray
            }]
        },
        options: {
            tooltips: {
                callbacks: {
                    label: function(context) {
                        return dataText[context.index];
                    }
                }
            }
        }          
    });
}

function drawPfChart(data) {
    //Canvas creation
    var canvasDiv = document.getElementById("pfCanvasDiv");
    if( canvasDiv.children.length > 0 ){
        canvasDiv.removeChild( document.getElementById("pfPerfCanvas") );
    }
    var canvasPfPerformance = document.createElement("canvas");
    canvasPfPerformance.id = "pfPerfCanvas";
    canvasPfPerformance.width = 700;
    canvasPfPerformance.height = 450;
    canvasPfPerformance.setAttribute("style", "display: inline-block;");
    canvasDiv.appendChild(canvasPfPerformance);

    //Timestamp to Date conversion
    var tickers = Object.keys(data);
    var datasetSingle = [];
    var datasetPf = []
    for(var i = 0; i < tickers.length; i++){
        if( tickers[i] == "pfRet" ){
            datasetPf[0] = {
                data: Object.values(data[tickers[i]]),
                label: "Portfolio",
                borderColor: "#3498DB",
                fill: false
            };
        }
        else{
            datasetSingle[i] = {
                data: Object.values(data[tickers[i]]),
                label: tickers[i],
                borderColor: colorsArray[i],
                fill: false
            };
        }
    }
    var dateArray = Object.keys(data[tickers[0]]);
    var dateList = [];
    for(var i = 0; i < dateArray.length; i++){
        var date = new Date(dateArray[i] * 1);
        var aDate = date.toLocaleDateString();
        dateList.push(aDate);
    }

    //PortFolio performance chart draw
    new Chart(document.getElementById("pfPerfCanvas"), {
        type: 'line',
        data: {
            labels: dateList,
            datasets: datasetPf 
        },
        options: {
            title: {
                display: true,
                text: 'Portfolio performance'
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

function setPfPeriod(){
    var opt = document.getElementById("selectPfPeriod");
    var pfPeriod = opt.options[opt.selectedIndex].text;
    sPERIOD = pfPeriod.split("Y")[0];
    loadPfData();
}

function loadSelectedPf(){
    saveSelectedPf();
    loadSingleAssetData();
    loadPfData();
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
        setCookie( "selectedPf", 0, 5 );
    }

    $("#savedPfMenu").selectpicker("refresh");
    loadSingleAssetData();
    loadPfData(); 
}

function loadSingleAssetData(){
    selectedPf = getCookie( "selectedPf" );
    if( selectedPf == "" )
        selectedPf = 0;
    
    var pfName = portFolios[selectedPf].pfName;
    var pfTickers = portFolios[selectedPf].tickers;
    var weights = portFolios[selectedPf].numShares;

    server.emit("getSingleAssetInfo", {name: pfName, tickers: pfTickers, period: 10, weights: weights}, (res) =>{
        drawSingleAssetsChart( res["weights"], res["info"] );
        drawAssetInfo( res["info"] );
    });
}

function drawAssetInfo( info ){
    var infoTable = document.getElementById("assetInfoTable").getElementsByTagName("tbody")[0];
    $(infoTable).empty();
    console.log( info );
    for(var i = 0; i < info.length; i++) {
        var tr = document.createElement("tr");

        var th = document.createElement("th");
        th.appendChild(document.createTextNode(info[i].Symbol));
        tr.appendChild(th);

        var td1 = document.createElement("td");
        td1.appendChild(document.createTextNode(info[i].Type));
        tr.appendChild(td1);
        
        var td2 = document.createElement("td");
        td2.appendChild(document.createTextNode(info[i].Name));
        tr.appendChild(td2);
        
        var td3 = document.createElement("td");
        //td3.style = "width: 300px";
        td3.appendChild(document.createTextNode(info[i].Descr.slice(0,70) + "..."));
        tr.appendChild(td3);

        if( info[i].Type == "ETF" ){
            var td4 = document.createElement("td");
            td4.appendChild(document.createTextNode(info[i].Category));
            tr.appendChild(td4);

            var td5 = document.createElement("td");
            td5.appendChild(document.createTextNode(""));
            tr.appendChild(td5);

            var td6 = document.createElement("td");
            td6.appendChild(document.createTextNode(""));
            tr.appendChild(td6);
        }
        else{
            var td4 = document.createElement("td");
            td4.appendChild(document.createTextNode(info[i].Sector));
            tr.appendChild(td4);

            var td5 = document.createElement("td");
            td5.appendChild(document.createTextNode(info[i].Industry));
            tr.appendChild(td5);

            var td6 = document.createElement("td");
            td6.appendChild(document.createTextNode(info[i].Country));
            tr.appendChild(td6);
        }

        infoTable.appendChild(tr);
    }
}

function loadPfData(){
    selectedPf = getCookie( "selectedPf" );
    if( selectedPf == "" )
        selectedPf = 0;
    var pfName = portFolios[selectedPf].pfName;
    var pfTickers = portFolios[selectedPf].tickers;
    var weights = portFolios[selectedPf].numShares;
    
    server.emit("getPfData", {name: pfName, tickers: pfTickers, period: sPERIOD, norm: NORMALIZED, weights: weights}, (res) =>{
        pfData = JSON.parse( res["data"] );    
        drawPfChart(pfData);
        drawPfInfo( res["info"], res["infoYoY"] )
    });
}

function drawPfInfo( info, infoYoY ){
    var pfInfoTable = document.getElementById("pfInfoTable").getElementsByTagName("tbody")[0];
    $(pfInfoTable).empty();
    var tr = document.createElement("tr");
    var td1 = document.createElement("td");
    td1.appendChild(document.createTextNode(info.TotRet + "%"));
    tr.appendChild(td1);
    var td2 = document.createElement("td");
    td2.appendChild(document.createTextNode(info.AnnualRet + "%"));
    tr.appendChild(td2);    
    var td3 = document.createElement("td");
    td3.appendChild(document.createTextNode(info.MDD + "%"));
    tr.appendChild(td3);
    var td4 = document.createElement("td");
    td4.appendChild(document.createTextNode(info.STD + "%"));
    tr.appendChild(td4);
    pfInfoTable.appendChild(tr);

    var indexes = Object.keys(infoYoY);
    var pfInfoYoYTable = document.getElementById("pfInfoYoYTable").getElementsByTagName("tbody")[0];
    $(pfInfoYoYTable).empty();
    for( var i = 0; i<indexes.length; i++){
        var tr = document.createElement("tr");
        var th = document.createElement("th");
        th.appendChild( document.createTextNode(indexes[i]) )
        tr.appendChild( th )
        var td1 = document.createElement("td");
        td1.appendChild(document.createTextNode(infoYoY[indexes[i]].return + "%"));
        tr.appendChild(td1);
        var td2 = document.createElement("td");
        td2.appendChild(document.createTextNode(infoYoY[indexes[i]].MDD + "%"));
        tr.appendChild(td2);    
        var td3 = document.createElement("td");
        td3.appendChild(document.createTextNode(infoYoY[indexes[i]].STD + "%"));
        tr.appendChild(td3);
        pfInfoYoYTable.appendChild(tr);
    }
}
