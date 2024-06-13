var tickersList = [];
var tickersListOG = [];
var elemPerPage = 20;
var lastPage = 1;
var pageNum = 1;

//Connect to server
async function onLoad(){
    connectToServer();
    usern = showLoginModal();
	if( usern != false ){
		getTickersList();
	}
}

//Call server to get tickersList
async function getTickersList(){
    //Get ETFs list from server
    server.emit( "getTickersList", (result) => {
		tickersList = result["data"];
        for(let i=0; i<Object.keys(tickersList).length; i++){
            tickersList[Object.keys(tickersList)[i]] = Object.keys( tickersList[Object.keys(tickersList)[i]] ).map( function( key ){
                return tickersList[Object.keys(tickersList)[i]][key]
            });
        }
        tickersListOG = {...tickersList}

        //Set max page number
        setLastPage(true);
        
        //Fill table
        fillETFTable();
        
	});
    
}

//set last page number
function setLastPage(first){
    if( first )
        var lastPageBtn = document.getElementById( "btnPageFinal" );
    else
        var lastPageBtn = document.getElementById( "btnPage" + lastPage  );

    lastPage = Math.ceil(tickersList["Name"].length/elemPerPage);
    if( lastPage == 0 )
        lastPage = 1;

    lastPageBtn.innerText = lastPage;
    lastPageBtn.id = "btnPage" + lastPage;


    //Get all btns
    let btns = document.getElementById( "numBtnDiv" ).children;

    if( lastPage < 7 ){
        //If there is no result
        if( tickersList["Name"].length == 0 ){
            btns.remove
            let btn = document.createElement( "button" );
            btn.id = "btnPage" + (k+1);
            btn.innerText = (k+1);
            btn.onclick = "changePage(this)"
        }
        else{
            //Reset original state of btns
            for( let k=btns.length-1; k>0 ;k-- ){
                if( k<lastPage ){
                    btns[k].id = "btnPage" + (k+1);
                    btns[k].classList = "btn";
                    btns[k].innerText = (k+1);
                }
                else{
                    btns[k].remove();
                }
            }
            if( lastPage > 5 )
                btns[5].removeAttribute("disabled");
        }
    }

    if( btns.length < 6 ){
        let btnsDiv = document.getElementById( "numBtnDiv" );
        btnsDiv.innerHTML = "";
        //Reset original state of btns
        for( let k=0; k<6 ;k++ ){
            let btn = document.createElement( "button" );
            btn.id = "btnPage" + (k+1);
            btn.innerText = (k+1);
            btn.onclick = "changePage(this)"
            if( k == 0 )
                btn.classList = "btn btn-primary"
            else
                btn.classList = "btn";
            btnsDiv.appendChild( btn );
        }
        /*
        let btn = document.createElement( "button");
        btn.id = "btnPageX";
        btn.classList = "btn";
        btn.innerText = "...";
        btn.setAttribute( "disabled", "" );
        btnsDiv.appendChild( btn );*/
    }

}

//Fill table with tickers from server
function fillETFTable(){

    var tbody = document.getElementById("etfListBody");
    tbody.innerHTML = "";

    for(let i = elemPerPage*(pageNum-1); i<elemPerPage*pageNum && i<lastPage; i++){

        let tr = document.createElement( "tr" );

        let td = document.createElement( "td" );
        td.id = "ISIN";
        td.innerText = tickersList["ISIN"][i];
        tr.appendChild( td );

        let td1 = document.createElement( "td" );
        td1.id = "Name";
        td1.innerText = tickersList["Name"][i];
        td1.style.maxWidth = "400px";
        tr.appendChild( td1 );

        let td2 = document.createElement( "td" );
        td2.id = "Distribution";
        td2.innerText = tickersList["Dividendi"][i];
        tr.appendChild( td2 );

        let td3 = document.createElement( "td" );
        td3.id = "Symbol";
        td3.innerText = tickersList["Symbol"][i].split(":")[0];
        tr.appendChild( td3 );

        let td4 = document.createElement( "td" );
        td4.id = "Type";
        td4.innerText = tickersList["BenchmarkType"][i];
        if( tickersList["BenchmarkType"][i] == "Bonds" )
            td4.innerText += ", " + tickersList["Sector"][i]
        tr.appendChild( td4 );

        let td5 = document.createElement( "td" );
        td5.id = "Area";
        td5.innerText = tickersList["Area"][i];
        tr.appendChild( td5 );

        let td6 = document.createElement( "td" );
        td6.id = "TER";
        td6.innerText = tickersList["TER"][i];
        tr.appendChild( td6 );

        tbody.appendChild( tr )
    }
}

//Change items per page
function changeNTickers(elem){
    let num = elem.id;
    if( num != elemPerPage ){
        let btns = document.getElementById( "nTickersDiv" ).children;

        //change selected btn
        for( let i=0; i<btns.length; i++ ){
            if( btns[i].id != elem.id )
                btns[i].classList = "btn"
            else
                btns[i].classList = "btn btn-primary"
        }

        elemPerPage = num;
        setLastPage(false);
        console.log( document.getElementById( "btnPage" + 1 ) );
        changePage( document.getElementById( "btnPage" + 1 ) );
        fillETFTable();
    }
}

//Change page with arrow btn
function changePageBtn( elem ){
    if( elem.id == "nextBtn" )
        changePage( document.getElementById( "btnPage" + (parseInt(pageNum)+1) ) );
    else if( elem.id == "backBtn" )
        changePage( document.getElementById( "btnPage" + (parseInt(pageNum)-1) ) );
}

//Function for changing page with page number button
function changePage(elem){

    //Get page from clicked button
    let page = elem.id.split( "btnPage" )[1]

    //Enable/disable arrow button
    if( page > 1 )
        document.getElementById( "backBtn" ).removeAttribute("disabled");
    else
        document.getElementById( "backBtn" ).setAttribute("disabled", "");

    if (page == lastPage)
        document.getElementById( "nextBtn" ).setAttribute("disabled", "");
    else
        document.getElementById( "nextBtn" ).removeAttribute("disabled");
    
    //Get all btns
    let btns = document.getElementById( "numBtnDiv" ).children;

    //if btn clicked is the last visible
    if( elem.classList.contains( "last" ) ){
        //Increase all btns number 
        for( let k=4; k>1 ;k-- ){
            btns[k].id = "btnPage" + (parseInt(page)+(k-3));
            btns[k].innerText = (parseInt(page)+(k-3));  
        }

        //Replace "2" with "..." btn
        btns[1].id = "btnPageX";
        btns[1].innerText = "...";
        btns[1].setAttribute( "disabled", "" );
    }

    //if btn clicked is the first visible
    else if( elem.classList.contains( "first" )){
        //Decrease btns number 
        for( let k=2; k<5 ;k++ ){
            btns[k].id = "btnPage" + (parseInt(page)+(k-3));
            btns[k].innerText = (parseInt(page)+(k-3));
        }

        //Replace "..." with btn "2" if im at start (page = 4)
        if(page == 4){
            btns[1].id = "btnPage2";
            btns[1].innerText = "2";
            btns[1].removeAttribute( "disabled" );
            btns[2].classList = "btn";
        }  
        //Replace btn(lastPage-4) with btn "..." if im at end
        if( page == lastPage-4 ){
            btns[5].id = "btnPageX";
            btns[5].innerText = "...";
            btns[5].setAttribute( "disabled", "" );
        }
    }

    //if btn clicked is first page
    else if( page == 1 && lastPage > 7 ){
        //Reset original state of btns
        for( let k=1; k<5 ;k++ ){
            btns[k].id = "btnPage" + (k+1);
            btns[k].innerText = (k+1);
            btns[1].removeAttribute( "disabled" );
        }
        btns[5].id = "btnPageX";
        btns[5].innerText = "...";
        btns[5].setAttribute( "disabled", "" );
    }

    //if btn clicked is in the last part
    else if( page > lastPage-5 && lastPage > 7 ){
        //Change number
        for( let k=6; k>1 ;k-- ){
            btns[k].id = "btnPage" + (lastPage+(k-6));
            btns[k].innerText = (lastPage+(k-6));
            btns[k].classList = "btn";
        }

        //set first attribute
        btns[2].classList.add("first");

        //remove disabled from btn that was "..."
        btns[5].removeAttribute( "disabled" );

        //Set "..." to the second btn
        btns[1].id = "btnPageX";
        btns[1].innerText = "...";
        btns[1].setAttribute( "disabled", "" );
    }

    
    for( let i=0; i<btns.length; i++ ){
        //Set selected button
        if( btns[i].id.split( "btnPage" )[1] != page )
            btns[i].classList.remove( "btn-primary" );
        else
            btns[i].classList.add( "btn-primary" );

        //Set last class
        if( i == 4 ){
            //only if im not at the end
            if( page < lastPage-4 )
                btns[i].classList.add("last");
            else
                btns[i].classList.remove("last");
        }

        //Set first class
        if( i == 2 ){
            //only if im not at the start
            if( page > 4 )
                btns[i].classList.add("first");
            else
                btns[i].classList.remove("first");
        }

    }

    pageNum = page;

    fillETFTable();
}

//Function for searching etfs
function searchEtf(input){
    let key = input.value.toLowerCase();
    let newTickersList = [];

    //Reset to original
    tickersList = {...tickersListOG};

    let objKeys = Object.keys(tickersList);
    for( let k=0; k<objKeys.length; k++)
        newTickersList[objKeys[k]] = [];
    
    //If there is text
    if( key != "" ){
        for( let i = 0; i<tickersList["Name"].length; i++ ){
            if( tickersList["Name"][i].toLowerCase().search( key ) != -1 ){
                for( let k=0; k<objKeys.length; k++)
                    newTickersList[objKeys[k]].push( tickersList[objKeys[k]][i] );        
            }   
        }
        tickersList = {...newTickersList}
    }

    pageNum = 1;

    console.log( tickersList["Name"].length );
    setLastPage(false);

    //Fill etf table with founded tickers
    fillETFTable();
}
