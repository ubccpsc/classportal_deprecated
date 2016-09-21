/**
 * Created by rtholmes on 2016-06-20.
 */

import fs = require('fs');
import _ = require('lodash');
import async = require('async');

const pathToRoot = __dirname.substring(0, __dirname.lastIndexOf('classportal/')) + 'classportal/';
var config = require(pathToRoot + 'config.json');

/**
 * Grab bag of methods that probably shouldn't be in the default namespace.
 *
 * @param msg
 */
export default class Log {

    public static trace(msg: string) {
        console.log("<T> " + new Date().toLocaleString() + ": " + msg);
    }

    public static info(msg: string) {
        console.log("<I> " + new Date().toLocaleString() + ": " + msg);
    }

    public static warn(msg: string) {
        console.error("<W> " + new Date().toLocaleString() + ": " + msg);
    }

    public static error(msg: string) {
        console.error("<E> " + new Date().toLocaleString() + ": " + msg);
    }

    public static test(msg: string) {
        console.log("<X> " + new Date().toLocaleString() + ": " + msg);
    }

}

/**
 * Helper methods for common file i/o actions.
 */
export class Helper {

    /**
     * This function cannot be optimised, so it's best to keep it small!
     * Original: http://stackoverflow.com/questions/29797946/handling-bad-json-parse-in-node-safely
     */
    static safelyParseJSON(json: any, callback: any) {
        try {
            var parsedJSON = JSON.parse(json);
            return callback(null, parsedJSON);
        } catch (error) {
            return callback(error, null);
        }
    }

    /**
     * Helper method for reading and parsing JSON data files.
     */
    static readJSON(filename: string, callback: any) {
        Log.trace("Helper::readJSON(..) - file: " + filename);
        var path = pathToRoot.concat(config.private_folder, filename);

        fs.readFile(path, function (error: any, data: any) {
            if (!error) {
                Helper.safelyParseJSON(data, function (error: any, parsedJSON: any) {
                    if (!error) {
                        Log.trace("Helper::readJSON(..) - success!");
                        return callback(null, parsedJSON);
                    } else {
                        Log.error("Helper::readJSON(..) - error parsing json: " + error);
                        return callback(error, null);
                    }
                });
            } else {
                Log.error("Helper::readJSON(..) - file read error.");
                return callback(true, null);
            }
        });
    }

    /**
     * Add new key/value pairs to an existing entry in a JSON array.
     *
     * Design: is this check needed?
     *      if (jsonFile[index].hasOwnProperty(key)){
     *          //only add value if key already existed!
     *      }
     */
    static updateEntry(filename: string, identifierObject: any, newValuesObject: any, callback: any) {
        Log.trace("Helper::updateEntry(..) - start");
        var path = pathToRoot.concat(config.private_folder, filename);

        Helper.readJSON(filename, function (error: any, jsonFile: any) {
            if (!error) {
                // find index of entry containing values specified in identifierObject
                var index: number = _.findIndex(jsonFile, identifierObject);

                if (index !== -1) {
                    Log.trace("Helper::updateEntry(..) - found entry containing " + JSON.stringify(identifierObject));
                    var count: number = 0;

                    // update entry with each key/value in newValuesObject, then write to file.
                    async.forEachOfSeries(
                        newValuesObject,
                        function add_key_value(value: any, key: any, callback: any) {
                            Log.trace("Helper::updateEntry(..) - new key/value: {\"" + key + "\":" + value + "}");
                            jsonFile[index][key] = value;
                            count++;
                            return callback();
                        },
                        function end(error: any) {
                            if (!error) {
                                fs.writeFile(path, JSON.stringify(jsonFile, null, 2), function (error: any) {
                                    if (!error) {
                                        Log.trace("Helper::updateEntry(..) - successfully updated " + count + " value(s)!");
                                        return callback(null);
                                    } else {
                                        Log.trace("Helper::updateEntry(..) - write error: " + error);
                                        return callback(error);
                                    }
                                });
                            } else {
                                Log.trace("Helper::updateEntry(..) - error: " + error);
                                return callback(true);
                            }
                        }
                    );
                } else {
                    Log.error("Helper::updateEntry(..) - error: entry not found!");
                    return callback("entry not found");
                }
            } else {
                Log.error("Helper::updateEntry(..) - error");
                return callback(error);
            }
        });
    }

    // write new object json array (students/admins/teams/tokens/grades.json)
    static addEntry(filename: string, newEntry: any, callback: any) {
        Log.trace("Helper::addEntry| filename: " + filename);
        var path = pathToRoot.concat(config.private_folder, filename);
        var file = require(path);

        // add new entry to end of file
        file[file.length] = newEntry;

        Log.trace("Helper::addEntry| New entry added: " + JSON.stringify(newEntry));
        fs.writeFile(path, JSON.stringify(file, null, 2), function (err: any) {
            if (err) {
                Log.trace("Helper::addEntry| Write error: " + err.toString());

                // create a backup
                try {
                    fs.createReadStream(path).pipe(fs.createWriteStream(path + "_" + new Date().getTime()));
                } catch (err) {
                    Log.error('Helper::addEntry() - ERROR: ' + err.message);
                }

                return callback(true);
            } else {
                Log.trace("Helper::addEntry| Write successful!");
                return callback(null);
            }
        });
    }

    // check if any entry in the json array contains the key/values in checkedObject.
    // if true, return object.
    // TODO: migrate other code to this function!
    static checkEntry(filename: string, checkedObject: any, callback: any) {
        Log.trace("Helper::checkEntry| Checking " + filename + " for values: " + JSON.stringify(checkedObject));
        var path = pathToRoot.concat(config.private_folder, filename);

        fs.readFile(path, function (err: any, data: any) {
            if (!err && data.length > 0) {
                var file = JSON.parse(data);
                var entry = _.find(file, checkedObject);

                if (entry !== undefined) {
                    Log.trace("Helper::checkEntry| Entry found: " + JSON.stringify(entry));
                    return callback(null, entry);
                } else {
                    Log.trace("Helper::checkEntry| Error: entry not found!");
                    return callback(true, null);
                }
            } else {
                Log.trace("Helper::checkEntry| File read error.");
                return callback(true, null);
            }
        });
    }

    // delete entry from json array in specified file
    static deleteEntry(filename: string, identifierObject: any, callback: any) {
        Log.trace("Helper::deleteEntry| filename: " + filename);
        var path = pathToRoot.concat(config.private_folder, filename);
        var file = require(path);

        var entryIndex: number = _.findIndex(file, identifierObject);

        if (entryIndex < 0) {
            Log.trace("Helper::deleteEntry| Error: could not find entry.");
            return callback(true);
        } else {
            // remove entry from file
            file.splice(entryIndex, 1);

            fs.writeFile(path, JSON.stringify(file, null, 2), function (err: any) {
                if (err) {
                    Log.trace("Helper::deleteEntry| Write error: " + err.toString());
                    return callback(true);
                } else {
                    Log.trace("Helper::deleteEntry| Write successful!");
                    return callback(null);
                }
            });
        }
    }

    // check if supplied username exists in admins.json    
    static isAdmin(username: string, callback: any) {
        Log.trace("Helper::isAdmin| Checking admin status..");
        var path = pathToRoot.concat(config.path_to_admins);

        fs.readFile(path, function read(err: any, data: any) {
            if (err) {
                Log.trace("Helper::isAdmin| Error reading file: " + err.toString());
                return callback(true, null);
            } else {
                var file = JSON.parse(data);
                var userIndex: number = _.findIndex(file, { "username": username });
                var isAdmin: boolean = userIndex >= 0;
                Log.trace("Helper::isAdmin| isAdmin: " + isAdmin);
                return callback(null, isAdmin);
            }
        });
    }
}