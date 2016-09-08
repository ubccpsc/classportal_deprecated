/**
 * Created by rtholmes on 2016-06-19.
 */

import fs = require('fs');
import Log from '../Util';
import {Helper} from '../Util';
import async = require('async');

const pathToRoot = __dirname.substring(0, __dirname.lastIndexOf('classportalserver/')) + 'classportalserver/';
var config = require(pathToRoot + 'config.json');

export default class TeamController {

    /**
     * add new entry to teams.json
     * assign team in admins.json
     * set "hasTeam":true in students.json
     * 
     *
     * @param 
     * @returns 
     */
    static createTeam(username: string, nameArray: any[], parentCallback: any) {
        Log.trace("TeamController::createTeam| Creating new team");

        // for each student name in array, convert to sid
        TeamController.nameToSid(nameArray, function (error: any, data: any) {
            if (!error && data.length > 0) {
                var sidArray = data;

                // todo: check permissions. If not admin, can only set team with std1=user
                if (1) {
                    var filename = pathToRoot.concat(config.path_to_teams);
                    var file = require(filename);
                    var newTeam = {
                        "id": file.length + 1,
                        "url": "",
                        "members": sidArray
                    };
                    file.push(newTeam);

                    Log.trace("TeamController::createTeam| Adding new team: " + JSON.stringify(newTeam));
                    fs.writeFile(filename, JSON.stringify(file, null, 2), function (err: any) {
                        if (err) {
                            Log.trace("TeamController::createTeam| Write error: " + err.toString());
                            return parentCallback(true, null);
                        }
                        else {
                            // finally, set hasTeam=true in student file for each student
                            TeamController.updateHasTeamStatus(sidArray, true, function (error: any) {
                                if (!error) {
                                    Log.trace("TeamController::createTeam| Finished - Success!");
                                    return parentCallback(null, true);
                                }
                                else {
                                    Log.trace("TeamController::createTeam| Finished - Error!");
                                    return parentCallback(true, null);
                                }
                            });
                        }
                    });
                }
                else {
                    Log.trace("TeamController::createTeam| Error: Bad permission");
                    return parentCallback(true, null);
                }
            }
            else {
                Log.trace("TeamController::createTeam| Error: Bad team");
                return parentCallback(true, null);
            }
        });
    }

    // input: array with team member names
    // output: array team member sids
    static nameToSid(nameArray: any[], callback: any) {
        Log.trace("TeamController::nameToSid| Converting member names to sid");

        if (!!nameArray) {
            Helper.readFile("students.json", function (error: any, data: any) {
                if (!error && data.length > 0) {
                    var students = JSON.parse(data);
                    var sidArray: any[] = [];

                    // for each student in supplied array, check name against student file
                    for (var i = 0; i < nameArray.length; i++) {
                        for (var j = 0; j < students.length; j++) {
                            if (nameArray[i] === students[j].firstname + " " + students[j].lastname) {
                                sidArray[i] = students[j].sid;
                                break;
                            }
                        }
                    }
                    // if success, return result (todo: check this)
                    callback(null, sidArray);
                }
                else {
                    // error: file read error
                    Log.trace("TeamController::nameToSid| File read error. Returning");
                    callback(true, null);
                    return;
                }
            });
        }
        else {
            // error: bad input
            Log.trace("TeamController::nameToSid| Bad input. Returning");
            callback(true, null);
            return;
        }
    }

    // helper to update students to hasTeam
    static updateHasTeamStatus(sidArray: any[], hasTeam: boolean, parentCallback: any) {
        Log.trace("TeamController::updateHasTeamStatus| Updating..");

        async.waterfall([
            function update_first_hasTeam(callback: any) {
                Log.trace("TeamController::updateHasTeamStatus| update_first_hasTeam");
                Helper.updateEntry("students.json", { 'sid': sidArray[0] }, { 'hasTeam': true }, function (error: any) {
                    if (!error) {
                        callback(null);
                    }
                    else {
                        callback("error");
                    }
                });
            },
            function update_second_hasTeam(callback: any) {
                Log.trace("TeamController::updateHasTeamStatus| update_first_hasTeam");
                Helper.updateEntry("students.json", { 'sid': sidArray[1] }, { 'hasTeam': true }, function (error: any) {
                    if (!error) {
                        callback(null);
                    }
                    else {
                        callback("error");
                    }
                });
            }
        ],
            function end_async(error: any) {
                Log.trace("TeamController::updateHasTeamStatus| end_async");
                if (!error) {
                    return parentCallback(null);
                }
                else {
                    return parentCallback("error");
                }
            }
        );
    }

}