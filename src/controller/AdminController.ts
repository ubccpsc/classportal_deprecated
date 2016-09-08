import fs = require('fs');
import async = require('async');
import Log from '../Util';
import {Helper} from '../Util';

const pathToRoot = __dirname.substring(0, __dirname.lastIndexOf('classportalserver/')) + 'classportalserver/';
var config = require(pathToRoot + 'config.json');

export default class AdminController {

    /**
     * Update database according to new classlist.csv.
     * Expects csv format with 4 columns: (sid, csid, lastname, firstname)
     *
     * first, get an array of sid's for use in the following actions:
     * edit classlist.csv to match
     * edit students.json (populate and delete students who are not in classlist)
     * edit grades.json (overwrite all other student info if student doesn't exist
     * edit teams.json (overwrite all other student info if student doesn't exist
     * edit tokens.json (overwrite all other student info if student doesn't exist
     *
     * @param csv file
     * @returns response message containing files
     */
    static updateClasslist(csv_path: string, parentCallback: any) {
        Log.trace("AdminController::updateClasslist| Start");

        var persistCSV: any;
        var persistSidArray: any[] = [];

        async.waterfall([
            function parse_csv(callback: any) {
                Log.trace("AdminController::updateClasslist| parse_csv");
                fs.readFile(csv_path, function (err: any, data: any) {
                    if (!err) {
                        persistCSV = data;
                        Log.trace("AdminController::updateClasslist| parse_csv: success");
                        callback(null);
                    }
                    else {
                        Log.trace("AdminController::updateClasslist| parse_csv: error");
                        callback("err");
                    }
                });
            },
            function get_sid_array(callback: any) {
                Log.trace("AdminController::updateClasslist| get_sid_array");
                var lines = persistCSV.toString().split(/\n/);

                for (var index = 0; index < lines.length - 1; index++) {
                    var values = lines[index + 1].split(',');

                    if (!!values[1]) {
                        persistSidArray[index] = values[1];
                    }
                }

                Log.trace("AdminController::updateClasslist| get_sid_array: success");
                callback(null);
            },
            function update_classlist_file(callback: any) {
                Log.trace("AdminController::updateClasslist| update_classlist_file");

                var filename = __dirname.substring(0, __dirname.lastIndexOf('classportalserver/')) + 'classportalserver/priv/classlist.csv';
                fs.writeFile(filename, persistCSV, function (err: any) {
                    if (err) {
                        Log.trace("AdminController::updateClasslist| write_classlist_file: error");
                        return callback(true);
                    }
                    else {
                        Log.trace("AdminController::updateClasslist| write_classlist_file: success");
                        return callback(null);
                    }
                });
            },
            function update_students_file(callback: any) {
                Log.trace("AdminController::updateClasslist| update_students_file");

                // the contents of this json array will be written to students.json later.
                var studentsFile: any[] = [];

                // get contents of csv by line
                var lines = persistCSV.toString().split(/\n/);

                // sort values into objects and push to studentFile array
                // go until length - 1 because we will ignore the first line
                for (var index = 0; index < lines.length - 1; index++) {

                    // ignore the first line
                    var values = lines[index + 1].split(',');

                    // only continue if line contains all necessary values
                    if (!!values[0] && !!values[1] && !!values[2] && !!values[3]) {

                        // new student entry
                        var newStudent = {
                            "csid": values[0],
                            "sid": values[1],
                            "lastname": values[2],
                            "firstname": values[3],
                            "username": "",
                            "hasTeam": false
                        };

                        // add entry to studentsFile
                        studentsFile.push(newStudent);
                    }
                }

                callback(null, studentsFile);
            },
            function write_students_file(studentsFile: any, callback: any) {
                var path = pathToRoot.concat(config.private_folder, "students.json");

                // update students.json
                fs.writeFile(path, JSON.stringify(studentsFile, null, 2), function (err: any) {
                    if (err) {
                        Log.trace("AdminController::updateClasslist| write_students_file: error");
                        return callback("error");
                    }
                    else {
                        Log.trace("AdminController::updateClasslist| write_students_file: success");
                        return callback(null);
                    }
                });
            },
            function update_teams_file(callback: any) {
                Log.trace("AdminController::updateClasslist| update_teams_file");

                Log.trace("AdminController::updateClasslist| update_teams_file: Not implemented!");
                callback(null, []);
            },
            function write_teams_file(teamsFile: any, callback: any) {
                var path = pathToRoot.concat(config.private_folder, "teams.json");

                // update teams.json
                fs.writeFile(path, JSON.stringify(teamsFile, null, 2), function (err: any) {
                    if (err) {
                        Log.trace("AdminController::updateClasslist| write_teams_file: error");
                        return callback("error");
                    }
                    else {
                        Log.trace("AdminController::updateClasslist| write_teams_file: success");
                        return callback(null);
                    }
                });
            },
            function update_grades_file(callback: any) {
                Log.trace("AdminController::updateClasslist| update_grades_file");

                // the contents of this json array will be written to students.json later.
                var gradesFile: any[] = [];

                for (var index = 0; index < persistSidArray.length; index++) {
                    // new student entry
                    var newEntry = {
                        "username": "",
                        "sid": persistSidArray[index],
                        "grades": {
                            "d1a": "",
                            "d1b": "",
                            "d2a": "",
                            "d2b": "",
                            "d3a": "",
                            "d3b": ""
                        }
                    };

                    // add entry to gradesFile
                    gradesFile.push(newEntry);
                }

                callback(null, gradesFile);
            },
            function write_grades_file(gradesFile: any, callback: any) {
                var path = pathToRoot.concat(config.private_folder, "grades.json");
                var file = require(path);

                // update students.json
                fs.writeFile(path, JSON.stringify(gradesFile, null, 2), function (err: any) {
                    if (err) {
                        Log.trace("AdminController::updateClasslist| write_grades_file: error");
                        return callback("error");
                    }
                    else {
                        Log.trace("AdminController::updateClasslist| write_grades_file: success");
                        return callback(null);
                    }
                });
            }
        ],
            function end_async_waterfall(error: any, response: any) {
                if (!error) {
                    Log.trace("AdminController::updateClasslist| end_async_waterfall: Successfully updated all files.");
                    return parentCallback(null, true);
                }
                else {
                    Log.trace("AdminController::updateClasslist| end_async_waterfall: Error updating files.");
                    return parentCallback(true, null);
                }
            }
        );
    }
}