//CONST
var pfData;
var selectedPf;
var PERIOD = 2;
var ITERATION = 20;
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
    loadMontecarloData();
}

function setPeriod(){
    var opt = document.getElementById("setPeriod");
    var pfPeriod = opt.options[opt.selectedIndex].text;
    PERIOD = pfPeriod.split("Y")[0];
    loadMontecarloData();
}

function changeIterations(){
    var iter = $("#iterationsInput").val();
    if( iter != ITERATION ){
        $("#iterationButton").css( "opacity", 1 );
        $("#iterationButton").prop( "disabled", false );
    }
    else{
        $("#iterationButton").css( "opacity", 0.2 );
        $("#iterationButton").prop( "disabled", true );
    }
}


function setIterations(){
    var iter = $("#iterationsInput").val();
    ITERATION = parseInt(iter);
    loadMontecarloData();
    changeIterations();
}

function resizeInput() {
    this.style.width = this.value.length - 5 + "ch";
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
        setCookie( "selectedPf", 0 );
    }
    $("#savedPfMenu").selectpicker("refresh");
    $("#iterationsInput").on("keypress", ( filterLetters ));
    $("#iterationsInput").val( ITERATION );
    loadMontecarloData();
}

function loadMontecarloData(){
    selectedPf = getCookie( "selectedPf" );
    if( selectedPf == "" )
        selectedPf = 0;
    var pfName = portFolios[selectedPf].pfName;
    var pfTickers = portFolios[selectedPf].tickers;
    var weights = portFolios[selectedPf].numShares;    

    //Remove canvas
    var canvasDiv = document.getElementById("montecarloCanvasDiv");
    if( canvasDiv.children.length > 0 )
        canvasDiv.removeChild( document.getElementById("montecarloCanvas") );
    
    $("#montecarloCanvasCont").addClass( "ph-item" );
    $("#montecarloCanvasDiv").addClass( "ph-picture" );

    server.emit("getMontecarloData", {name: pfName, tickers: pfTickers, period: PERIOD, weights: weights, iter: ITERATION}, (res) =>{
        drawMontecarloChart( res["data"], res["lastDate"], JSON.parse( res["info"] ) );
    })
}

function drawMontecarloChart( data, lastDate, info ){
    $("#montecarloCanvasCont").removeAttr( "class" );
    $("#montecarloCanvasDiv").removeAttr( "class" );

    //Canvas creation
    var canvasDiv = document.getElementById("montecarloCanvasDiv");
    var canvasMontecarlo = document.createElement("canvas");
    canvasMontecarlo.id = "montecarloCanvas";
    canvasDiv.appendChild(canvasMontecarlo);

    var dateList = [];
    date = new Date(lastDate);
    for(var i = 0; i < Object.values(data[0]).length; i++){
        dateList[i] = date.toLocaleDateString();
        date.setDate(date.getDate() + 1);
        while( date.getDay() > 5 )
            date.setDate(date.getDate() + 1);
    }

    const randomNum = () => Math.floor(Math.random() * (235 - 52 + 1) + 52);
    const randomRGB = () => `rgb(${randomNum()}, ${randomNum()}, ${randomNum()})`;
    
    var dataset = [];
    for( var i = 0; i < data.length; i++ ){
        dataset[i] = {
            data: Object.values(data[i]),
            borderColor: randomRGB(),
            fill: false
        }
    }
    
    //Montecarlo chart Draw
    new Chart(document.getElementById("montecarloCanvas"), {
        type: 'line',
        data: {
            labels: dateList,
            datasets: dataset
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            legend: {
                display: false
            },
            tooltips: {
                callbacks: {
                   label: function(tooltipItem) {
                          return tooltipItem.yLabel;
                   }
                }
            },
            elements: {
                point:{
                    radius: 0
                }
            },
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Date'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                      display: true,
                      labelString: 'Price'
                    }
                  }]
            }
        }          
    });

    //montecarlo best, worst and mean values
    console.log( info )
    $("#bestReturn > input").val( info["best"][0] + "%" )
    $("#bestVolatility > input").val( info["best"][1] + "%" )
    $("#worstReturn > input").val( info["worst"][0] + "%" )
    $("#worstVolatility > input").val( info["worst"][1] + "%" )
    $("#meanReturn > input").val( info["mean"][0] + "%" )
    $("#meanVolatility > input").val( info["mean"][1] + "%" )
}

function filterLetters(evt){
	var hold = String.fromCharCode(evt.which);  
	if( !(/[0-9]/.test(hold)) )
		evt.preventDefault();
}