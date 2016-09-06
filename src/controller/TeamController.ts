/**
 * Created by rtholmes on 2016-06-19.
 */

import Team from '../model/Team'
import Log from '../Util';
import {Helper} from '../Util';
import fs = require('fs');

const pathToRoot = __dirname.substring(0, __dirname.lastIndexOf('classportalserver/')) + 'classportalserver/';
var config = require(pathToRoot + 'config.json');

export default class TeamController {
    static createTeam(callback:any) {
        
    }
    
    /* todo: edit these functions */
    
    //input: array with team member names
    //output: array team member sids
    static teamNameToSid(nameArray: any[], callback: any) {
        Log.trace("teamNameToSid| Converting member names to sid..");

        if (!!nameArray) {
            Helper.readFile("students.json", function (error: any, data: any) {
                if (!error && data.length > 0) {
                    var students = JSON.parse(data);
                    var sidArray: any[] = [];

                    //for each student in supplied array, check name against student file
                    for (var i = 0; i < nameArray.length; i++) {
                        for (var j = 0; j < students.length; j++) {
                            if (nameArray[i] === students[j].firstname + " " + students[j].lastname) {
                                sidArray[i] = students[j].sid;
                                break;
                            }
                        }
                    }
                    //if success, return result (todo: check this)
                    callback(null, sidArray);
                }
                else {
                    //error: file read error
                    Log.trace("convertFullnameToSid| File read error. Returning..");
                    callback(true, null);
                    return;
                }
            })
        }
        else {
            //error: bad input
            Log.trace("convertFullnameToSid| Bad input. Returning..");
            callback(true, null);
            return;
        }
    }
    
    //helper to update students to hasTeam
    static updateHasTeamStatus(sidArray: any[], hasTeam: boolean, callback: any) {
        Log.trace("updateHasTeamStatus| Updating hasTeam status of the new team members..");

        Helper.readFile("students.json", function (error: any, data: any) {
            if (!error && data.length > 0) {
                var filename = pathToRoot.concat(config.path_to_students);
                var studentsFile = JSON.parse(data);

                for (var i = 0; i < sidArray.length; i++) {
                    for (var j = 0; j < studentsFile.length; j++) {
                        if (sidArray[i] == studentsFile[j].sid) {
                            Log.trace("updateHasTeamStatus| Updating member #" + i + "'s hasTeam status..");
                            studentsFile.hasTeam = hasTeam;
                            break;
                        }
                    }
                }

                //TODO: this executes before the above for loop is finished executing!!!
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

}