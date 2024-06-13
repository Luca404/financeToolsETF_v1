import mysql.connector


def printDbs( connection ):
    cursor = connection.cursor()
    cursor.execute( "SHOW DATABASES" )
    for i in cursor:
        print( i )
    pass

def createNewDb( name ):
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password=""
    )
    cursor = conn.cursor()
    cursor.execute( "CREATE DATABASE " + name )
    pass

def createTables( db ):
    cursor = db.cursor()
    cursor.execute( "CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR (255))" )
    pass

def printTables( db ):
    cursor = db.cursor()
    cursor.execute( "SHOW TABLES" )
    for i in cursor:
        print( i ) 
    pass


#Insert single element in a table, given db object, table Name, columns and values list
def insertInTable( db, tableName, columns, values ):
    try:
        cursor = db.cursor()
        query = "INSERT INTO " + tableName + " ("
        for i in range(0, len(columns)):
            query += columns[i]
            if( i != len(columns)-1 ):
                query += ", "
        query += ") VALUES ("
        for k in range(0, len(values)):
            query += "'" + values[k] + "'"
            if( k != len(values)-1 ):
                query += ", "
        query += ");"
        cursor.execute( query )
        #Save changes in db
        db.commit()
        print( "Element added successfully!" )
    except:
        print( "Error!!" )
    pass

if  __name__ == "__main__":
    #createNewDb( "prova1" )
    #printDbs( conn )
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="prova1"
    )
    #createTables( db )
    #printTables( db )
    #insertInTable( db, "users", ["name", "passwd"], ["Andrea", "Neri"] )
    cursor = db.cursor()
    query = "SELECT * FROM users WHERE name = 'Andrea'"
    cursor.execute( query )
    result = cursor.fetchall()
    for r in result:
        print( r )



    
