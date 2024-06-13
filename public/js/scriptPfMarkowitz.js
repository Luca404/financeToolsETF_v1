//CONST
var pfData;
var selectedPf;
var PERIOD = 2;
var ITERATION = 1000;
var MAX_SHARES = 10;
var MAX_VALUES = 10000;
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
    loadMarkowitzData();
}
 
function setPeriod(){
    var opt = document.getElementById("setPeriod");
    var pfPeriod = opt.options[opt.selectedIndex].text;
    PERIOD = pfPeriod.split("Y")[0];
    loadMarkowitzData();
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
    loadMarkowitzData();
    changeIterations();
}

function changeMaxShares(){
    var maxShares = $("#maxSharesInput").val();
    if( maxShares != MAX_SHARES ){
        $("#maxSharesButton").css("opacity", 1);
        $("#maxSharesButton").prop("disabled", false);
    }
    else{
        $("#maxSharesButton").css("opacity", 0.2);
        $("#maxSharesButton").prop("disabled", true);
    }
}

function setMaxShares(){
    var maxShares = $("#maxSharesInput").val();
    MAX_SHARES = parseInt(maxShares);
    loadMarkowitzData();
    changeMaxShares();
}

function changeMaxValues(){
    var maxValues = $("#maxValuesInput").val();
    if( maxValues != MAX_VALUES ){
        $("#maxValuesButton").css("opacity", 1);
        $("#maxValuesButton").prop("disabled", false);
    }
    else{
        $("#maxValuesButton").css("opacity", 0.2);
        $("#maxValuesButton").prop("disabled", true);
    }
}

function setMaxValues(){
    var maxValues = $("#maxValuesInput").val();
    MAX_VALUES = parseInt(maxValues);
    loadMarkowitzData();
    changeMaxValues();
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
    $("#maxSharesInput").on("keypress", ( filterLetters ));
    $("#maxSharesInput").val( MAX_SHARES );
    $("#maxValuesInput").on("keypress", ( filterLetters ));
    $("#maxValuesInput").val( MAX_VALUES);
    loadMarkowitzData(); 
}

function loadMarkowitzData(){
    selectedPf = getCookie( "selectedPf" );
    if( selectedPf == "" )
        selectedPf = 0;
    var pfName = portFolios[selectedPf].pfName;
    var pfTickers = portFolios[selectedPf].tickers;
    var weights = portFolios[selectedPf].numShares;
    
    var actualWeights = document.getElementById( "actualWeightsInput" );
    var text = ""
    for( var i = 0; i<weights.length; i++ )
        text = text + pfTickers[i] + ": " + weights[i] + "    ";
    actualWeights.value = text;
    resizeInput.call( actualWeights );

    var actualValue = document.getElementById( "actualValueInput" );
    var text = ""
    var value = 0;
    for( var i = 0; i<weights.length; i++ )
        value = value + portFolios[selectedPf].prices[i] * weights[i];
    actualValue.value = parseInt(value).toString() + "$";
    actualValue.style.width = actualWeights.style.width;

    //Remove canvas
    var canvasDiv = document.getElementById("markowitzCanvasDiv");
    if( canvasDiv.children.length > 0 )
        canvasDiv.removeChild( document.getElementById("singlePerfCanvas") );
    
    $("#markowitzCanvasCont").addClass( "ph-item" );
    $("#markowitzCanvasDiv").addClass( "ph-picture" );

    server.emit("getMarkowitzData", {name: pfName, tickers: pfTickers, period: PERIOD, weights: weights, iter: ITERATION, maxShares: MAX_SHARES, maxValues: MAX_VALUES, prices:portFolios[selectedPf].prices}, (res) =>{
        var pfRetAndVol = JSON.parse( res["data"] );
        var pfWeights = res["weights"];
        var pfData = res["pfData"];
        drawMarkowitzChart( pfRetAndVol, pfWeights, pfData, pfTickers, portFolios[selectedPf].prices );
    })
}

function drawMarkowitzChart( data, weights, pfData, tickers, prices ){
    var pfReturn = Object.values( data["return"] );
    var pfVol = Object.values( data["volatility"] );
    var pfWeights = Object.values( weights );
    
    $("#markowitzCanvasCont").removeAttr( "class" );
    $("#markowitzCanvasDiv").removeAttr( "class" );

    //Canvas creation
    var canvasDiv = document.getElementById("markowitzCanvasDiv");
    var canvasMarkowitz = document.createElement("canvas");
    canvasMarkowitz.id = "singlePerfCanvas";
    canvasDiv.appendChild(canvasMarkowitz);

    var dataList = []
    for( var i = 0; i<pfReturn.length; i++ )
        dataList[i] = {
            x: parseFloat( pfVol[i] ), 
            y: parseFloat( pfReturn[i] ),
            id: i
        };

    //Markowitz chart Draw
    new Chart(document.getElementById("singlePerfCanvas"), {
        type: 'scatter',
        data: {
            datasets:[  
            {
                label: "Actual Weights",
                data: [{ x: pfData[0], y: pfData[1] }],
                fill: false,
                pointBackgroundColor: 'grey',       
                showLine: false,
                pointRadius: 5,
                pointHoverRadius: 7
            },
            {
                label: "Markowitz Efficient Frontier",
                data: dataList,
                fill: false,
                pointBackgroundColor: 'blue',       
                showLine: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        return ["Return: " + tooltipItem.yLabel.toFixed(2), "Volatility: " + tooltipItem.xLabel.toFixed(2)];
                    }
                  },
                  backgroundColor: '#FFF',
                  titleFontSize: 16,
                  titleFontColor: '#0066ff',
                  bodyFontColor: '#000',
                  bodyFontSize: 14,
                  displayColors: false
            },
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Volatility'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                      display: true,
                      labelString: 'Return'
                    }
                  }]
            },
            hover: {
                mode: 'nearest',
                intersect: true,
                onHover: function (e, item) {
                    if (item.length) {
                        var selectedWeights = document.getElementById( "selectedWeightsInput" );
                        var actualWeights = document.getElementById( "actualWeightsInput" );
                        var text = "";
                        if( item[0]._datasetIndex == 1 ){
                            var data = item[0]._chart.config.data.datasets[1].data[item[0]._index];
                            var id = data.id;
                            for( var i = 0; i<tickers.length; i++ )
                                text = text + tickers[i] + ": " + pfWeights[id][i] + "    ";
                            selectedWeights.value = text;   
                        }
                        else
                            selectedWeights.value = actualWeights.value; 
                        resizeInput.call( selectedWeights );

                        var selectedValue = document.getElementById( "selectedValueInput" );
                        var actualValue = document.getElementById( "actualValueInput" );
                        var value = 0;
                        if( item[0]._datasetIndex == 1 ){
                            var data = item[0]._chart.config.data.datasets[1].data[item[0]._index];
                            var id = data.id;
                            for( var i = 0; i<tickers.length; i++ )
                                value = value + prices[i] * pfWeights[id][i];
                            selectedValue.value = parseInt(value).toString() + "$";   
                        }
                        else
                            selectedValue.value = actualValue.value; 
                        selectedValue.style.width = selectedWeights.style.width;
                    }
                }
            }
        }          
    });
}

function filterLetters(evt){
	var hold = String.fromCharCode(evt.which);  
	if( !(/[0-9]/.test(hold)) )
		evt.preventDefault();
}