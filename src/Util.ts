/**
 * Created by rtholmes on 2016-06-20.
 */

import fs = require('fs');
var _ = require('lodash');

const pathToRoot = __dirname.substring(0, __dirname.lastIndexOf('classportalserver/')) + 'classportalserver/';
var config = require(pathToRoot + 'config.json');

/**
 * Grab bag of methods that probably shouldn't be in the default namespace.
 *
 * @param msg
 */
export default class Log {

    public static trace(msg:string) {
        console.log("<T> " + new Date().toLocaleString() + ": " + msg);
    }

    public static info(msg:string) {
        console.log("<I> " + new Date().toLocaleString() + ": " + msg);
    }

    public static warn(msg:string) {
        console.error("<W> " + new Date().toLocaleString() + ": " + msg);
    }

    public static error(msg:string) {
        console.error("<E> " + new Date().toLocaleString() + ": " + msg);
    }

    public static test(msg:string) {
        console.log("<X> " + new Date().toLocaleString() + ": " + msg);
    }

}

//helper methods for common actions like read/writing to files in /priv 
export class Helper {

    //encapsulates fs.readFile
    //todo: error handling - if data.length = 0, fill file with empty array instead? 
    static readFile(filename: string, callback: any) {
        Log.trace("Helper::readFile| Getting file: " + filename);
        var path = pathToRoot.concat(config.private_folder, filename);

        fs.readFile(path, function (err: any, data: any) {
            if (!err) {
                if (data.length > 0) {
                    Log.trace("Helper::readFile| File read success.");
                    return callback(null, data);
                }
                else {
                    //todo: if data.length = 0, fill with square brackets []
                    //quick fix: just return error for now
                    Log.trace("Helper::readFile| File read error.");
                    return callback(true, null);
                }
            }
            else {
                Log.trace("Helper::readFile| File read error.");
                return callback(true, null);
            }
        });
    }

    //write new value to existing object in json array (students/admins/teams/tokens/grades.json)
    static updateEntry(filename:string, identifierObject: any, newValuesObject: any, callback: any) {
        Log.trace("Helper::updateEntry| filename: " + filename + " identifier: " + JSON.stringify(identifierObject));
        var path = pathToRoot.concat(config.private_folder, filename);
        var file = require(path);
        var userIndex:number = _.findIndex(file, identifierObject);
        
        if (userIndex >= 0) {
            Log.trace("Helper::updateEntry| Username found.");
            var count = 0;

            for (var key in newValuesObject) {
                if (file[userIndex].hasOwnProperty(key)) {
                    Log.trace("Helper::updateEntry| Set " + key + ":" + newValuesObject[key]);
                    file[userIndex][key] = newValuesObject[key];
                    count++;
                }
            }
            
            Log.trace("Helper::updateEntry| Updated " + count + " key(s).");
            fs.writeFile(path, JSON.stringify(file, null, 2), function (err: any) {
                if (err) {
                    Log.trace("Helper::updateEntry| Write error: " + err.toString());
                    return callback(true);                    
                }
                else {
                    Log.trace("Helper::updateEntry| Write successful!");
                    return callback(null);                    
                }
            });
        }
        else {
            Log.trace("Helper::updateEntry| Error: Username was not found.");
            return callback(true);
        }
    }

    //write new object json array (students/admins/teams/tokens/grades.json)
    static addEntry(filename:string, newEntry: any, callback: any) {
        Log.trace("Helper::addEntry| filename: " + filename);
        var path = pathToRoot.concat(config.private_folder, filename);
        var file = require(path);
        
        //add new entry to end of file
        file[file.length] = newEntry;
        
        Log.trace("Helper::addEntry| New entry added: " + JSON.stringify(newEntry));
        fs.writeFile(path, JSON.stringify(file, null, 2), function (err: any) {
            if (err) {
                Log.trace("Helper::addEntry| Write error: " + err.toString());
                return callback(true);                    
            }
            else {
                Log.trace("Helper::addEntry| Write successful!");
                return callback(null);                    
            }
        });
    }

    //check if any entry in the json array contains the key/values in checkedObject.
    //TODO: migrate other code to this function!
    static checkEntry(filename:string, checkedObject: any, callback: any) {
        Log.trace("Helper::checkEntry| Checking " + filename + " for values: " + JSON.stringify(checkedObject));
        var path = pathToRoot.concat(config.private_folder, filename);

        fs.readFile(path, function (err: any, data: any) {
            if (!err && data.length > 0) {
                var file = JSON.parse(data);
                var index: number = _.findIndex(file, checkedObject);
                var result: boolean = index >= 0;

                Log.trace("Helper::checkEntry| Result: " + result);
                return callback(null, result);
            }
            else {
                Log.trace("Helper::checkEntry| File read error.");
                return callback(true, null);
            }
        });
    }

    //check if supplied username exists in admins.json    
    static isAdmin(username: string, callback: any) {
        Log.trace("Helper::isAdmin| Checking admin status..");
        var path = pathToRoot.concat(config.path_to_admins);

        fs.readFile(path, function read(err: any, data: any) {
            if (err) {
                Log.trace("Helper::isAdmin| Error reading file: " + err.toString());
                return callback(true, null);
            }
            else {
                var file = JSON.parse(data);
                var userIndex:number = _.findIndex(file, { "username": username });
                var isAdmin: boolean = userIndex >= 0; 
                Log.trace("Helper::isAdmin| isAdmin: " + isAdmin);
                return callback(null, isAdmin);
            }
        });
    }
}