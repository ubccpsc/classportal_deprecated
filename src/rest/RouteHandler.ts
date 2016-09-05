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

import LoginController from '../controller/LoginController';
import TeamController from '../controller/TeamController';
import Helper from './Helper';

var _ = require('lodash');

const pathToRoot = __dirname.substring(0, __dirname.lastIndexOf('classportalserver/')) + 'classportalserver/';
var config = require(pathToRoot + 'config.json');

export default class RouteHandler {
    
    static registerStudent(req: restify.Request, res: restify.Response, next: restify.Next) {
        /*
        //create new student with gitub username and githubtoken.
        LoginController.createBlankStudent(username, githubtoken, function () {
            //finally, send app to registration page.
            //todo: double check this action
            Log.trace("authenticateGithub| Redirecting to registration page.");
            res.json(200, "/register~" + username + "~" + servertoken);
        });

        
        else {
        Log.trace("authenticateGithub| User has not completed registration. Redirecting to registration page.");
        //TODO: what's stopping someone from manually entering the student portal from the registration screen?'
        res.json(200, "/register~" + username + "~" + servertoken);
        }

        */
    }
    
    //input: Github authcode 
    //response: object containing redirect path, username, and auth token
    static userLogin(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("userLogin| Checking authcode..");
        var authcode = req.params.authcode;

        //check for valid authcode format
        if (typeof authcode === 'string' && authcode.length > 0) {
            //perform login process
            LoginController.login(authcode, function (error:any, data:any) {
                if (!error) {
                    Log.trace("userLogin| Login success. Response: " + JSON.stringify(data));
                    res.send(200, data);
                    return next();
                }
                else {
                    Log.trace("userLogin| Error: " + error);
                    res.send(500, error);
                    return;
                }
            });
        }
        else {
            Log.trace("userLogin| Error: Bad authcode.");
            res.send(500, "bad authcode");
            return;
        }
    }

    /*
        This function is called from the "link account" page, after a SID and CSID is entered to link Github and UBC details. 
        Parameters: github username, sid, csid
        Actions:
        1) get class list
        2) iterate thru csid's for a match
            3a) csid exists, so check if sid matches
                4a) if match, update blank student's' file and redirect app to homepage.
                4b) if csid and sid doesn't' match, send error to app.
            3b) no matching csid's, so send error to app.
    */
    static registerAccount(req: restify.Request, res: restify.Response, next: restify.Next) {
        var user = req.header('user');
        var csid = req.params.csid;
        var sid = req.params.sid;
        var validCSID = /^[a-z][0-9][a-z][0-9]$/;
        var validSID = /^\d{8}$/;
        
        //first, test CSID and SID regex
        Log.trace("registerAccount| Testing CSID and SID regex..");
        if (validCSID.test(csid) && validSID.test(sid)) {
            Log.trace("registerAccount| Valid regex.");

            Helper.returnFile("students.json", function (error: any, data: any) {
                if (!error && data.length > 0) {
                    var studentsObject = JSON.parse(data);
                    Log.trace("registerAccount| Classlist retrieved. There are " + (studentsObject.length) + " students in this class.");
                    
                    //check if csid exists
                    Log.trace("registerAccount| Checking CSID..");
                    for (var index = 0; index < studentsObject.length; index++) {
                        if (csid == studentsObject[index].csid) {
                            //check if sid exists
                            Log.trace("registerAccount| CSID Match! Checking SID..");
                            if (sid == studentsObject[index].sid) {
                                Log.trace("registerAccount| SID Match! Updating student information..");
                                
                                //error: can't use "user" to identify
                                Helper.updateStudentObject(sid, { github_name: user }, function () {
                                    Log.trace("registerAccount| Account updated successfully. Sending user to homepage.");
                                    res.json(200, "success");
                                    return next();
                                });
                                //Log.trace("Error: writeStudent failed");
                                //????
                                return;
                            }
                            else {
                                //invalid login combination
                                Log.trace("registerAccount| Error: Invalid CSID/SID combination. Returning..");
                                res.send(500, "bad login");
                                return;
                            }
                        }
                    }
                    Log.trace("registerAccount| Error: Invalid CSID. Returning..");
                    res.send(500, "bad login");
                    return;
                }
                else {
                    res.send(500, "error reading file");
                    return;
                }
            });
        }
        else {
            Log.trace("registerAccount| Error: Invalid SID or CSID regex. Returning..");
            res.send(500, "bad login");
            return;
        }
    }

    static getStudent(req: restify.Request, res: restify.Response, next: restify.Next) {
        var user = req.header('user');
        
        Log.trace("getStudent| Retrieving student file..");
        Helper.returnFile("students.json", function (error: any, data: any) {
            if (!error && data.length > 0) {
                var studentsObject = JSON.parse(data);
                for (var index = 0; index < studentsObject.length; index++) {
                    if (studentsObject[index].github_name == user) {
                        Log.trace("getStudent| Success! Returning..");
                        //todo: can't return github token over http!
                        res.json(200, studentsObject[index]);
                        return next();
                    }
                }
                Log.trace("getStudent| Error! Returning..");
                res.json(500, "error");
                return;
            }
            else {
                Log.trace("getStudent| Error! Student object: " + data);
                res.json(500, "error");
            }
        });
    }

    static getDeliverables(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("getDeliverables| Requesting file..");
        Helper.returnFile("deliverables.json", function (error: any, data: any) {
            if (!error && data.length > 0) {
                var delivs = JSON.parse(data);
                Log.trace("getDeliverables| Success! Returning..");
                res.json(200, delivs);
                return next();
            }
            else {
                Log.trace("getDeliverables| Error: Bad data. Returning..");
                res.json(500, "null");
                return next();
            }
        });
    }

    static getGrades(req: restify.Request, res: restify.Response, next: restify.Next) {
        var sid = req.params.sid;
        Log.trace("getGrades| Testing SID regex..");
        
        //check sid with regex
        if (sid.match(/^\d{8}$/)) {
            Log.trace("getGrades| Valid regex. Getting grades..");
            
            Helper.returnFile("grades.json", function (error: any, data: any) {
                if (!error && data.length > 0) {
                    var myGrades = JSON.parse(data).sid;
                    Log.trace("getGrades| Success! Returning..");
                    // TODO: if the user is an admin, return
                    // TODO: if the user is not an admin, make sure the release date for the deliverable has been passed before returning a grade
                    res.json(200, myGrades);
                    return next();
                }
                else {
                    Log.trace("getGrades| Grades not found. Returning error..");
                    res.json(500, "student not found");
                    return;
                }
            });
        }
        else {
            Log.trace("getGrades| Invalid SID regex. Returning..")
            res.json(500, "bad sid");
        }
    }

    static deleteServerToken(req: restify.Request, res: restify.Response, next: restify.Next) {
        var user: string = req.header('user');
        var admin: string = req.header('admin');
        var filename = pathToRoot.concat(config.path_to_tokens);
        var file = require(filename);
        
        //overwrite or create
        Log.trace("deleteServerToken| Deleting servertoken for user: " + user);
        if (admin === "true")
            file.admins[user] = "";
        else
            file.students[user] = "";
        
        //step 3: write to file
        fs.writeFile(filename, JSON.stringify(file, null, 2), function (err: any) {
            if (err) {
                Log.trace("deleteServerToken| Error: Write unsuccessful. Returning..");
                res.send(500, "bad logout");
                return next();
            }
            else {
                Log.trace("deleteServerToken| Success! Returning..");
                res.send(200, "success");
                return next();
            }
        });
    }
    
    /*
        add new entry to teams.json
        assign team in admins.json
        set "hasTeam":true in students.json
    */
    static createTeam(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("createTeam| Creating new team..");
        var user: string = req.header('user');
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
                            res.send(500, "error");
                            return;
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
                                    res.send(500, "error");
                                    return;
                                }
                            });
                        }
                    });
                }
                else {
                    Log.trace("createTeam| Error: Bad permission");
                    res.send(500, "not permitted");
                    return;
                }
            }
            else {
                //error: bad team 
                res.send(500, "bad team");
                return;
            }
        });
    }

    /*
        expects ubc-formatted classlist
        save to classlist.csv
        populate students.json
        do something to grades.json (should grades be in students.json?)
    */
    static updateClasslist(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("updateClasslist| Received new classlist..");

        fs.readFile(req.files[0].path, function read(err: any, data: any) {
            if (err) {
                Log.trace("updateClasslist| Error reading file: " + err.toString());
                res.send(500, "error");
                return;
            }
            else {
                Log.trace("updateClasslist| Overwriting old classlist.csv..");
                var filename = __dirname.substring(0, __dirname.lastIndexOf('classportalserver/')) + 'classportalserver/priv/classlist.csv'; 
                fs.writeFile(filename, data, function (err: any) {
                    if (err) {
                        Log.trace("updateClasslist| Write unsuccessful: " + err.toString());
                        res.send(500, "error");
                        return;
                    }
                    else {
                        Log.trace("updateClasslist| Write successful!");
                        //read new classlist
                        Helper.returnFile("classlist.csv", function (error: any, data: any) {
                            if (!error && data.length > 0) {
                                var classArray = data.toString().split(/\n/);
                                //update students.json
                                Log.trace("updateClasslist| Updating student file..");
                                Helper.updateStudents(classArray, function (success: boolean) {
                                    if (success) {
                                        Log.trace("updateClasslist| Success! Returning..");
                                        res.send(200, "success updating classlist")
                                        return next();
                                    }
                                    else {
                                        Log.trace("updateClasslist| Error updating students.json. Returning..");
                                        res.send(500, "error: could not update students")
                                        return;
                                    }
                                });    
                            }
                            else {
                                Log.trace("updateClasslist| Error reading classlist! Returning..");
                                res.send(500, "error: could not read classlist")
                                return;
                            }       
                        });
                    }
                });
            }
        });
    }

    static getClasslist(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("getClasslist| Getting class list..");
        
        Helper.returnFile("students.json", function (error: any, data: any) {
            if (!error && data.length > 0) {
                var studentsObject = JSON.parse(data);
                var namesArray: any[] = [];
                
                for (var index = 0; index < studentsObject.length; index++) {
                    var name: string = studentsObject[index].firstname + " " + studentsObject[index].lastname;
                    namesArray.push(name);
                }

                Log.trace("getClasslist| Sending array of names..");
                res.json(200, namesArray);
                return next();
            }
            else {
                Log.trace("getClasslist| Error reading classlist..");
                res.json(500, "error");
                return;
            }
        })
    }

    static getAllStudents(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("getAllStudents| Getting students..");
        Helper.returnFile("students.json", function (error: any, data: any) {
            if (!error && data.length > 0) {
                var studentsObject = JSON.parse(data);
                Log.trace("getAllStudents| Sending students object..");
                res.json(200, studentsObject);
                return next();
            }
            else {
                Log.trace("getAllStudents| Error reading file..");
                res.json(500, "error");
                return;
            }
        })
    }

    static getAllTeams(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("getAllTeams| Getting students..");
        Helper.returnFile("teams.json", function (error: any, data: any) {
            if (!error && data.length > 0) {
                var teamsObject = JSON.parse(data);
                Log.trace("getAllStudents| Sending teams object..");
                res.json(200, teamsObject);
                return next();
            }
            else {
                Log.trace("getAllTeams| Error reading file..");
                res.json(500, "error");
                return;
            }
        })
    }
    
    static getAdmin(req: restify.Request, res: restify.Response, next: restify.Next) {
        var username = req.header('user');
        
        Log.trace("getAdmin| Getting admin file..");
        Helper.returnFile("admins.json", function (error: any, data: any) {
            if (!error && data.length > 0) {
                var admin = JSON.parse(data)[username];
                Log.trace("getAllStudents| Sending admin.." + JSON.stringify(admin));
                res.json(200, admin);
                return next();
            }
            else {
                Log.trace("getAdmin| Error reading file..");
                res.json(500, "error");
                return;
            }
        })
    }

    static getAllGrades(req: restify.Request, res: restify.Response, next: restify.Next) {
        var sid = req.params.sid;
        Helper.returnFile("grades.json", function (error: any, data: any) {
            if (!error) {
                var myGrades = JSON.parse(data).sid;
                res.send(200, myGrades);
                return next();
            }
            else {
                res.send(500, "error");
                return;
            }
        });
    }
}