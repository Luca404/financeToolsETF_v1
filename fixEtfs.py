import json
import os
import pandas as pd

if __name__ == "__main__":
    
    dfData = pd.read_csv("ETF_Milano.csv")

    print( dfData )