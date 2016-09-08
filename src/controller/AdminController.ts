import fs = require('fs');
import async = require('async');
import Log from '../Util';

export default class AdminController {

    /**
     * Update database according to new classlist.csv.
     * Expects csv format with 4 columns: (sid, csid, lastname, firstname)
     *
     * first, get an array of sid's for use in the following actions
     * edit classlist.csv to match
     * edit students.json (populate and delete students who are not in classlist)
     * edit grades.json (overwrite all other student info if student doesn't exist
     * edit teams.json (overwrite all other student info if student doesn't exist
     * edit tokens.json (overwrite all other student info if student doesn't exist
     *
     * @param csv file
     * @returns response message containing files
     */
    static updateClasslist(csv: any, parentCallback: any) {
        var lines = csv.toString().split(/\n/);
        async.waterfall([
            function getSidArray(callback: any) {
                var sidArray: any[];
                if (1) {
                    return callback(null, sidArray);
                }
                else {
                    Log.trace("updateClasslist| Error reading classlist! Returning");
                    return callback(true, null);
                }
            }
        ],
            function end(error: any, sidArray: any) {
                if (!error) {
                    Log.trace("updateClasslist| Got sid array: " + sidArray);

                    async.parallel([
                        // todo: edit this
                        function editClasslist(callback: any) {
                            Log.trace("RouteHandler::updateClasslist| editClasslist");
                            fs.readFile(csv, function read(err: any, data: any) {
                                if (err) {
                                    Log.trace("updateClasslist| Error reading file: " + err.toString());
                                    return parentCallback(true, null);
                                }
                                else {
                                    Log.trace("updateClasslist| Overwriting old classlist.csv");
                                    var filename = __dirname.substring(0, __dirname.lastIndexOf('classportalserver/')) + 'classportalserver/priv/classlist.csv';
                                    fs.writeFile(filename, data, function (err: any) {
                                        if (err) {
                                            Log.trace("updateClasslist| Write unsuccessful: " + err.toString());
                                            return parentCallback(true, null);
                                        }
                                        else {
                                            Log.trace("updateClasslist| Write successful!");
                                        }
                                    });
                                }
                            });
                        },
                        function editStudentsFile(callback: any) {
                            Log.trace("RouteHandler::updateClasslist| editStudentsFile");
                            // the contents of this json array will be written to students.json later.
                            var studentsFile: any[] = [];
                            var studentsAdded: number = 0;

                            //  sort values into objects and push to studentFile array
                            for (var index = 1; index < lines.length; index++) {
                                Log.trace("Creating student: " + index);
                                var values = lines[index].split(',');
                                var newStudent = {
                                    "csid": values[0],
                                    "sid": values[1],
                                    "lastname": values[2],
                                    "firstname": values[3],
                                    "username": "",
                                    "hasTeam": false
                                };
                                studentsFile.push(newStudent);
                                studentsAdded++;
                            }
                        },
                        function editTeamsFile(callback: any) {
                            Log.trace("RouteHandler::updateClasslist| editTeamsFile");
                        },
                        function editGradesFile(callback: any) {
                            Log.trace("RouteHandler::updateClasslist| editGradesFile");
                        },
                        function editTokensFile(callback: any) {
                            Log.trace("RouteHandler::updateClasslist| editTokensFile");
                        }
                    ],
                        function end(error: any, response: any) {
                            if (!error) {
                                Log.trace("RouteHandler::updateClasslist| Updated all the files!");
                                return parentCallback(true, null);
                            }
                            else {
                                Log.trace("RouteHandler::updateClasslist| Error updating all the files.");
                                return parentCallback(true, null);
                            }
                        }
                    );
                }
                else {
                    Log.trace("RouteHandler::updateClasslist| Error getting sid array: " + sidArray);
                    return parentCallback(true, null);
                }
            }
        );
    }



}