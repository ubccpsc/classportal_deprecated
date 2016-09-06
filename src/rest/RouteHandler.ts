/**
 * Created by rtholmes on 14/06/2016.
 */

import restify = require('restify');
import http = require('http');
import request = require('request');
import fs = require('fs');

import MemoryStore from '../store/MemoryStore';
import Store from '../store/Store';
import Student from '../model/Student';
import Log from '../Util';
import {Helper} from '../Util';
import LoginController from '../controller/LoginController';
import TeamController from '../controller/TeamController';

var _ = require('lodash');
var async = require('async');

const pathToRoot = __dirname.substring(0, __dirname.lastIndexOf('classportalserver/')) + 'classportalserver/';
var config = require(pathToRoot + 'config.json');

export default class RouteHandler {
    
    static userLogin(req: restify.Request, res: restify.Response, next: restify.Next) {
        //input: authcode 
        //response: object containing redirect path, username, and auth token
        Log.trace("RouteHandler::userLogin| Checking authcode..");
        var authcode = req.params.authcode;
        var csid = req.params.csid;
        var sid = req.params.sid;

        //check for valid authcode format
        if (typeof authcode === 'string' && authcode.length > 0) {
            //perform login process
            LoginController.login(csid, sid, authcode, function (error:any, data:any) {
                if (!error) {
                    Log.trace("RouteHandler::userLogin| Login success. Response: " + JSON.stringify(data));
                    res.send(200, data);
                    return next();
                }
                else {
                    Log.trace("RouteHandler::userLogin| Failed to login. Returning..");
                    return res.send(500, "user not found");
                }
            });
        }
        else {
            Log.trace("RouteHandler::userLogin| Error: Bad authcode. Returning..");
            return res.send(500, "bad authcode");
        }
    }

    static checkRegistration(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("RouteHandler::checkRegistration| Checking valid ID..");
        var csid = req.params.csid;
        var sid = req.params.sid;

        LoginController.checkRegistration(csid, sid, function (success:boolean) {
            if (success) {
                Log.trace("checkRegistration| Success. Continue to login..");
                res.send(200, true);
                return next();
            }
            else {
                Log.trace("checkRegistration| Error: Bad info");
                return res.send(500, "bad info");
            }
        });
    }

    static userLogout(req: restify.Request, res: restify.Response, next: restify.Next) {
        var username: string = req.header("username");
        Log.trace("RouteHandler::userLogout| Logging out user: " + username);
        
        if (!!username) {
            LoginController.logout(username, function (error:any, success:any) {
                if (!error && success) {
                    Log.trace("RouteHandler::userLogout| Log out successful.");
                    res.send(200, "success");
                    return next();
                }
                else {
                    Log.trace("RouteHandler::userLogout| Log out unsuccessful.");
                    return res.send(500, "err");
                }
            });
        }
    }
    
    //todo: double check
    //todo: move to controller?
    static loadAdminPortal(req: restify.Request, res: restify.Response, next: restify.Next) {
        //input: admin username
        //response: send admin object, students file, teams file, deliverables file back to admin portal
        Log.trace("RouteHandler::loadAdminPortal| Getting files admin portal..");
        var username = req.header('username');
        var responseObject = {
            "myAdmin": "undefined",
            "studentsFile": "undefined",
            "teamsFile": "undefined",
            "deliverablesFile": "undefined",
            "gradesFile": "undefined",
            "classlist": [ "undefined" ]
        }
        
        async.parallel([
            function getAdminObject(callback: any) {
                Log.trace("RouteHandler::loadAdminPortal| getAdminObject..");
                Helper.readFile("admins.json", function (error: any, data: any) {
                    if (!error) {
                        var admins = JSON.parse(data);
                        var adminObject =  _.find(admins, { "username": username });
                        
                        if (adminObject !== undefined) {
                            responseObject.myAdmin = adminObject;
                            return callback(null);
                        }
                        else {
                            responseObject.myAdmin = "err";
                            return callback(null);
                        }
                    }
                    else {
                        responseObject.myAdmin = "err";
                        return callback(null);
                    }
                });
            },
            function getStudentsFile(callback: any) {
                Log.trace("RouteHandler::loadAdminPortal| getStudentsFile..");
                Helper.readFile("students.json", function (error: any, data: any) {
                    if (!error) {
                        responseObject.studentsFile = JSON.parse(data);
                        return callback(null);
                    }
                    else {
                        responseObject.studentsFile = "err";
                        return callback(null);
                    }
                });
            },
            function getTeamsFile(callback: any) {
                Log.trace("RouteHandler::loadAdminPortal| getTeamsFile..");
                Helper.readFile("teams.json", function (error: any, data: any) {
                    if (!error) {
                        responseObject.teamsFile = JSON.parse(data);
                        return callback(null);
                    }
                    else {
                        responseObject.teamsFile = "err";
                        return callback(null);
                    }
                });
            },
            function getDeliverablesFile(callback: any) {
                Log.trace("RouteHandler::loadAdminPortal| getDeliverablesFile..");
                Helper.readFile("deliverables.json", function (error: any, data: any) {
                    if (!error) {
                        responseObject.deliverablesFile = JSON.parse(data);
                        return callback(null);
                    }
                    else {
                        responseObject.deliverablesFile = "err";
                        return callback(null);
                    }
                });
            },
            function getGradesFile(callback: any) {
                Log.trace("RouteHandler::loadAdminPortal| getGradesFile..");
                Helper.readFile("grades.json", function (error: any, data: any) {
                    if (!error) {
                        responseObject.gradesFile = JSON.parse(data);
                        return callback(null);
                    }
                    else {
                        responseObject.gradesFile = "err";
                        return callback(null);
                    }
                });
            },
            function getClasslist(callback:any) {
                Log.trace("RouteHandler::loadAdminPortal| getClasslist..");
                Helper.readFile("students.json", function (error: any, data: any) {
                    if (!error) {
                        var studentsObject = JSON.parse(data);
                        var namesArray: any[] = [];
                        
                        for (var index = 0; index < studentsObject.length; index++) {
                            var name: string = studentsObject[index].firstname + " " + studentsObject[index].lastname;
                            namesArray.push(name);
                        }

                        responseObject.classlist = namesArray;
                        return callback(null);
                    }
                    else {
                        responseObject.classlist = ["err"];
                        return callback(null);
                    }
                })
            }
        ],    
            function end(error: any, results: any) {
                if (!error) {
                    Log.trace("loadAdminPortal| End: sending files.");
                    res.send(200, responseObject)
                    return next();
                }
                else {
                    Log.trace("loadAdminPortal| End: error getting files.");
                    return res.send(500, "error");
                }
            }
        );
    }

    //todo: not finished implementation
    //todo: get my grades
    //todo: get classlist
    //todo: don't get all students??
    static loadStudentPortal(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("RouteHandler::loadStudentPortal| Loading files required by student portal..");
        var username = req.header("username");
        var responseObject = {
            "myStudent": "undefined",
            "myTeam": "undefined",
            "myGrades": "undefined",
            "deliverablesFile": "undefined",
            "classlist": [ "undefined" ]
        }

        async.parallel([
            function getMyStudent(callback: any) {
                Log.trace("RouteHandler::loadStudentPortal| getMyStudent..");
                Helper.readFile("students.json", function (error: any, data: any) {
                    if (!error) {
                        var students = JSON.parse(data);
                        var studentObject =  _.find(students, { "username": username });
                        
                        if (studentObject !== undefined) {
                            responseObject.myStudent = studentObject;
                            return callback(null);
                        }
                        else {
                            responseObject.myStudent = "err";
                            return callback(null);
                        }
                    }
                    else {
                        responseObject.myStudent = "err";
                        return callback(null);
                    }
                });
            },
            function getDeliverablesFile(callback: any) {
                Log.trace("RouteHandler::loadAdminPortal| getDeliverablesFile..");
                Helper.readFile("deliverables.json", function (error: any, data: any) {
                    if (!error) {
                        responseObject.deliverablesFile = JSON.parse(data);
                        return callback(null);
                    }
                    else {
                        responseObject.deliverablesFile = "err";
                        return callback(null);
                    }
                });
            },
            function getMyGrades(callback: any) {
                Log.trace("RouteHandler::loadAdminPortal| getMyGrades..");
                Helper.readFile("grades.json", function (error: any, data: any) {
                    if (!error) {
                        var grades = JSON.parse(data);
                        var gradesObject = _.find(grades, { "username": username });
                        
                        if (gradesObject !== undefined) {
                            responseObject.myStudent = gradesObject;
                            return callback(null);
                        }
                        else {
                            responseObject.myGrades = "err";
                            return callback(null);
                        }
                    }
                    else {
                        responseObject.myGrades = "err";
                        return callback(null);
                    }
                });
            },
            function getClasslist(callback:any) {
                Log.trace("RouteHandler::loadAdminPortal| getClasslist..");
                Helper.readFile("students.json", function (error: any, data: any) {
                    if (!error) {
                        var studentsObject = JSON.parse(data);
                        var namesArray: any[] = [];
                        
                        for (var index = 0; index < studentsObject.length; index++) {
                            var name: string = studentsObject[index].firstname + " " + studentsObject[index].lastname;
                            namesArray.push(name);
                        }

                        responseObject.classlist = namesArray;
                        return callback(null);
                    }
                    else {
                        responseObject.classlist = ["err"];
                        return callback(null);
                    }
                })
            }
        ],    
            function end(error: any, results: any) {
                if (!error) {
                    Log.trace("RouteHandler::loadStudentPortal| End: sending files.");
                    res.send(200, responseObject)
                    return next();
                }
                else {
                    Log.trace("RouteHandler::loadStudentPortal| End: error getting files.");
                    return res.send(500, "error");
                }
            }
        );
    }

    //todo: incomplete!
    static updateClasslist(req: restify.Request, res: restify.Response, next: restify.Next) {
        //input: ubc-classlist.csv
        //(TODO) action: first, get an array of sid's for use in the following actions
        //(TODO) action: edit classlist.csv to match
        //(TODO) action: edit students.json (populate and delete students who are not in classlist)
        //(TODO) action: edit grades.json (overwrite all other student info if student doesn't exist
        //(TODO) action: edit teams.json (overwrite all other student info if student doesn't exist
        //(TODO) action: edit tokens.json (overwrite all other student info if student doesn't exist
        Log.trace("RouteHandler::updateClasslist| Received new classlist.");
        
        var csv = require(req.params);
        var lines = csv.toString().split(/\n/);

        async.waterfall([
            function getSidArray(callback: any) {
                
                var sidArray: any[];
                if (1) {
                    return callback(null, sidArray)
                }
                else {
                    Log.trace("updateClasslist| Error reading classlist! Returning..");
                    return res.send(500, "error: could not read classlist")
                }
            }
        ],
            function end(error: any, sidArray: any) {
                if (!error) {
                    Log.trace("updateClasslist| Got sid array: " + sidArray);

                    async.parallel([
                        //todo: edit this
                        function editClasslist(callback: any) {
                            Log.trace("RouteHandler::updateClasslist| editClasslist");
                            fs.readFile(req.files[0].path, function read(err: any, data: any) {
                                if (err) {
                                    Log.trace("updateClasslist| Error reading file: " + err.toString());
                                    return res.send(500, "error");
                                }
                                else {
                                    Log.trace("updateClasslist| Overwriting old classlist.csv..");
                                    var filename = __dirname.substring(0, __dirname.lastIndexOf('classportalserver/')) + 'classportalserver/priv/classlist.csv';
                                    fs.writeFile(filename, data, function (err: any) {
                                        if (err) {
                                            Log.trace("updateClasslist| Write unsuccessful: " + err.toString());
                                            return res.send(500, "error");
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
                            //the contents of this json array will be written to students.json later.
                            var studentsFile: any[] = [];
                            var studentsAdded: number = 0;

                            // sort values into objects and push to studentFile array
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
                        function  end(error: any, response: any) {
                            if (!error) {
                                Log.trace("RouteHandler::updateClasslist| Updated all the files!");
                                res.send(200, "success");
                                return next();
                            }
                            else {
                                Log.trace("RouteHandler::updateClasslist| Error updating all the files.");
                                return res.send(500, "err");
                            }
                        }
                    );
                }
                else {
                    Log.trace("RouteHandler::updateClasslist| Error getting sid array: " + sidArray);
                    return res.send(500, "err");
                }
            }
        );
    }

    /* TODO: functions below still need to be edited */
    /*
        add new entry to teams.json
        assign team in admins.json
        set "hasTeam":true in students.json
    */
    static createTeam(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("createTeam| Creating new team..");
        var username: string = req.header('username');
        var admin: string = req.header('admin');
        var nameArray: any = req.params.newTeam;
        
        //for each student name in array, convert to sid
        TeamController.teamNameToSid(nameArray, function (error: any, data: any) {
            if (!error && data.length > 0) {
                var sidArray = data;

                //todo: check permissions. If not admin, can only set team with std1=user
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
                            return res.send(500, "error");
                        }
                        else {
                            //finally, set hasTeam=true in student file for each student
                            TeamController.updateHasTeamStatus(sidArray, true, function (error: any, data: any) {
                                if (!error && data.length > 0) {
                                    //finally, return team num
                                    Log.trace("createTeam| Team " + newTeam.id + " created! Returning..");
                                    res.send(200, newTeam.id);
                                    return next();
                                }
                                else {
                                    Log.trace("createTeam| Error: Could not update student file");
                                    return res.send(500, "error");
                                }
                            });
                        }
                    });
                }
                else {
                    Log.trace("createTeam| Error: Bad permission");
                    return res.send(500, "not permitted");
                }
            }
            else {
                //error: bad team 
                return res.send(500, "bad team");
            }
        });
    }
}