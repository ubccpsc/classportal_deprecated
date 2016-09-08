/**
 * Created by rtholmes on 2016-06-19.
 */

import fs = require('fs');
import Log from '../Util';
import {Helper} from '../Util';

const pathToRoot = __dirname.substring(0, __dirname.lastIndexOf('classportalserver/')) + 'classportalserver/';
var config = require(pathToRoot + 'config.json');

export default class TeamController {
    // input: array with team member names
    // output: array team member sids
    static teamNameToSid(nameArray: any[], callback: any) {
        Log.trace("teamNameToSid| Converting member names to sid");

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
                    Log.trace("convertFullnameToSid| File read error. Returning");
                    callback(true, null);
                    return;
                }
            });
        }
        else {
            // error: bad input
            Log.trace("convertFullnameToSid| Bad input. Returning");
            callback(true, null);
            return;
        }
    }

    // helper to update students to hasTeam
    static updateHasTeamStatus(sidArray: any[], hasTeam: boolean, callback: any) {
        Log.trace("updateHasTeamStatus| Updating hasTeam status of the new team members");

        Helper.readFile("students.json", function (error: any, data: any) {
            if (!error && data.length > 0) {
                var filename = pathToRoot.concat(config.path_to_students);
                var studentsFile = JSON.parse(data);

                for (var i = 0; i < sidArray.length; i++) {
                    for (var j = 0; j < studentsFile.length; j++) {
                        if (sidArray[i] === studentsFile[j].sid) {
                            Log.trace("updateHasTeamStatus| Updating member #" + i + "'s hasTeam status");
                            studentsFile.hasTeam = hasTeam;
                            break;
                        }
                    }
                }

                // TODO: this executes before the above for loop is finished executing!!!
                fs.writeFile(filename, JSON.stringify(studentsFile, null, 2), function (err: any) {
                    if (err) {
                        Log.trace("updateHasTeamStatus| Write error: " + err.toString());
                        callback(true, null);
                        return;
                    }
                    else {
                        Log.trace("updateHasTeamStatus| Finished updating hasTeam statuses.");
                        callback(null, "done");
                        return;
                    }
                });
            }
            else {
                Log.trace("updateHasTeamStatus| Error: Bad file read");
                callback(true, null);
                return;
            }
        });
    }

    /**
     * add new entry to teams.json
     * assign team in admins.json
     * set "hasTeam":true in students.json
     * 
     *
     * @param 
     * @returns 
     */
    static createTeam(username: string, admin: string, nameArray: any[], parentCallback: any) {
        Log.trace("createTeam| Creating new team");

        // for each student name in array, convert to sid
        TeamController.teamNameToSid(nameArray, function (error: any, data: any) {
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

                    Log.trace("createTeam| Adding new team: " + JSON.stringify(newTeam));
                    fs.writeFile(filename, JSON.stringify(file, null, 2), function (err: any) {
                        if (err) {
                            Log.trace("createTeam| Write error: " + err.toString());
                            return parentCallback(true, null);
                        }
                        else {
                            // finally, set hasTeam=true in student file for each student
                            TeamController.updateHasTeamStatus(sidArray, true, function (error: any, data: any) {
                                if (!error && data.length > 0) {
                                    // finally, return team num
                                    Log.trace("createTeam| Team " + newTeam.id + " created! Returning");
                                    return parentCallback(null, newTeam.id);
                                }
                                else {
                                    Log.trace("createTeam| Error: Could not update student file");
                                    return parentCallback(true, null);
                                }
                            });
                        }
                    });
                }
                else {
                    Log.trace("createTeam| Error: Bad permission");
                    return parentCallback(true, null);
                }
            }
            else {
                Log.trace("createTeam| Error: Bad team");
                return parentCallback(true, null);
            }
        });
    }


}