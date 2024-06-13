from ast import expr_context
import os
import json
import yfinance as yf
import time


def getPrice( tickers ):
    prices = []
    data = yf.download( tickers=tickers, period="1w", threads=True )
    print( data )
    time.sleep( 10 )
    for ticker in data["Adj Close"]:
        print( ticker )
        price = data["Adj Close"][ticker][-1]
        print( price )
        prices.append( { ticker: round(price, 2) } )
    print( prices )
    time.sleep( 10 )
    return prices

def changeFilesAndAddPrices( path ):
    files = os.listdir( path )
    tickers = []
    for file in files:
        fileName = file.split( ".json" )[0]
        with open( path + file ) as f:
            jsonData = json.load(f)
        newJsonData = {"data":[]}
        for data in jsonData["data"]:
            tickers.append( data["s"] )
        prices = getPrice( tickers )
        k = 0
        keys = list( prices[k].keys() )
        data = jsonData["data"]
        for data in jsonData["data"]:
            if( k < len(prices) ):
                keys = list( prices[k].keys() )
                if( keys[0] == data["s"] ):
                    values = list(prices[k].values())
                    newJsonData["data"].append( { data['s']:{"n":data['n'], "p":values[0]} } )
                    k += 1
                else:
                    newJsonData["data"].append( { data['s']:{"n":data['n'], "p":"noData"} } )
       
        with open( path + fileName + "1" + ".json", "w" ) as f:
            json.dump( newJsonData, f )
        pass

def addPfPrices( user ):
    pfData = []
    with open("./json/portfolios.json") as f:
        data = json.load(f)
   
    for i in range(0, len(data["PortFolios"]) ):
        if( data["PortFolios"][i]["userID"] == user ):
            for k in range(0, len(data["PortFolios"][i]["pfData"]) ):
                prices = []
                for ticker in data["PortFolios"][i]["pfData"][k]["tickers"]:
                    prices.append( getCurrentPrice( ticker ) )
                data["PortFolios"][i]["pfData"][k]["prices"] = prices
    
    with open("./json/portfolios.json", "w") as f:
        json.dump( data, f )
    pass

def getCurrentPrice( ticker ):
    try:
        data = yf.Ticker( ticker )
        price = data.history(period="1w")["Close"][-1]
        return price
    except:
        return "noData"

def updatePrices():
    files = os.listdir("./json/tickersList/tickersOld/")
    for file in files:
        with open( "./json/tickersList/tickersOld/" + file ) as f:
            jsonData = json.load(f)
        k = 0
        for data in jsonData["data"]:
            ticker = data["s"]
            if( file.find( "crypto" ) == 0 ):
                ticker = ticker + "-USD"
            price = getCurrentPrice( ticker )
            jsonData["data"][k]["p"] = price
            k += 1
            print( ticker, " : ", price )
        with open( "./json/tickersList/newTickers/" + file, "w" ) as f:
            json.dump(jsonData, f)
    pass

if __name__ == "__main__":
    #getCurrentPrice( "GC=F" )
    #addPfPrices( "Lika44" )
    updatePrices()
    #changeFilesAndAddPrices( "./json/tickersList/newTickers/" )
        
        
