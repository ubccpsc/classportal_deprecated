/**
 * Created by rtholmes on 14/06/2016.
 */

import restify = require('restify');
import http = require('http');
import request = require('request');
import fs = require('fs');

import MemoryStore from '../store/MemoryStore';
import Store from '../store/Store';
import EchoController from '../controller/EchoController';
import Student from '../model/Student';
import Log from '../Util';

const pathToRoot = __dirname.substring(0, __dirname.lastIndexOf('classportalserver/')) + 'classportalserver/';
var config = require(pathToRoot + 'config.json');

export default class RouteHandler {
    static getAllGrades(req: restify.Request, res: restify.Response, next: restify.Next) {
        var sid = req.params.sid;
        RouteHandler.returnFile("grades.json", function (error: any, data: any) {
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

    /*
        This function is called from the "post-login" page, after a successful Github login.
        Parameters: Github authcode 
        Actions:
        1) request an access token from github.
        2) use token to get user info from github.
        3) check if username exists in database
        4a) if yes, update the user's githubtoken and redirect app to the homepage.
        4b) if no, create blank student and redirect app to registration page.
    */
    static authenticateGithub(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("authenticateGithub| Checking authcode..");
        
        //this callback is executed after a successful request to Github for access token.
        function requestGithubTokenCallback(err1: any, res1: any, body1: any) {
            if (!err1 && res1.statusCode == 200) {
                var githubtoken = body1.access_token;
                Log.trace("authenticateGithub| Successfully acquired github token.");
                
                //next, request github username using githubtoken.
                RouteHandler.requestGithubInfo(githubtoken, function (err2: any, res2: any, body2: any) {
                    if (!err2 && res2.statusCode == 200) {
                        var obj = JSON.parse(body2);
                        var username = obj.login;
                        Log.trace("authenticateGithub| Successfully acquired username: " + username);
                                    
                        //check if username matches list of admin usernames.
                        RouteHandler.isAdmin(username, function (isAdmin: boolean) {

                            //create servertoken with admin flag
                            RouteHandler.createServerToken(username, isAdmin, function (servertoken: string) {
                        
                                //do if admin
                                if (isAdmin) {

                                    //TODO: write github token to admin file!

                                    Log.trace("Authentication complete! Redirecting to admin portal..");
                                    res.send(200, "/admin~" + username + "~" + servertoken);
                                    return next();
                                }
                                //do if student
                                else {
                                    //request student info from database by providing github username.
                                    RouteHandler.returnStudent(username, function (studentObject: any) {
                                        
                                        //if student does not exist in database, create new user.
                                        //TODO: but what if it was becuase of file read error?
                                        if (studentObject == null) {
                                            //create new student with gitub username and githubtoken.
                                            RouteHandler.createBlankStudent(username, githubtoken, function () {
                                                //finally, send app to registration page.
                                                //todo: double check this action
                                                Log.trace("authenticateGithub| Redirecting to registration page.");
                                                res.json(200, "/register~" + username + "~" + servertoken);
                                            });
                                        }
                                        //student exists in database
                                        else {
                                            //update githubtoken
                                            RouteHandler.writeStudent(username, { "githubtoken": githubtoken }, function () {
                                                Log.trace("authenticateGithub| Updated student's githubtoken.");

                                                //check if they have the required info from registration.
                                                if (!!studentObject.csid && !!studentObject.sid && !!studentObject.firstname) {
                                                    Log.trace("authenticateGithub| Sending user to homepage..");
                                                    res.json(200, "/~" + username + "~" + servertoken);
                                                }
                                        
                                                else {
                                                    Log.trace("authenticateGithub| User has not completed registration. Redirecting to registration page.");
                                                    //TODO: what's stopping someone from manually entering the student portal from the registration screen?'
                                                    res.json(200, "/register~" + username + "~" + servertoken);
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        });
                    }
                    else {
                        Log.trace("authenticateGithub| Error accessing public info from Github.");
                        res.send(500, "error connecting to github");
                    }
                });
            }
            else {
                Log.trace("authenticateGithub| Error requesting access token from github.com: " + err1.toString());
                res.send(500, "error connecting to github");
            }
        }

        //only continue if authcode is present.
        if (!!req.params.authcode) {
            //build the request options object
            var options = {
                method: 'post',
                body: {
                    client_id: config.client_id,
                    client_secret: config.client_secret,
                    code: req.params.authcode
                },
                json: true,
                url: 'https://github.com/login/oauth/access_token',
                headers: {}
            };
            
            Log.trace("authenticateGithub| Requesting access token from Github..");
            request(options, requestGithubTokenCallback);
            return next();
        }
        else {
            Log.trace("authenticateGithub| Error: Missing authcode.");
            res.send(500, "missing authcode");
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

            RouteHandler.returnFile("students.json", function (error: any, data: any) {
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
                                RouteHandler.updateStudentObject(sid, { github_name: user }, function () {
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
        RouteHandler.returnFile("students.json", function (error: any, data: any) {
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
        RouteHandler.returnFile("deliverables.json", function (error: any, data: any) {
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
            
            RouteHandler.returnFile("grades.json", function (error: any, data: any) {
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
    
    //input: array with team member names
    //output: array team member sids
    static teamNameToSid(nameArray: any[], callback: any) {
        Log.trace("teamNameToSid| Converting member names to sid..");

        if (!!nameArray) {
            RouteHandler.returnFile("students.json", function (error: any, data: any) {
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
        RouteHandler.teamNameToSid(nameArray, function (error: any, data: any) {
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
                            RouteHandler.updateHasTeamStatus(sidArray, true, function (error: any, data: any) {
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

    //helper to update students to hasTeam
    static updateHasTeamStatus(sidArray: any[], hasTeam: boolean, callback: any) {
        Log.trace("updateHasTeamStatus| Updating hasTeam status of the new team members..");

        RouteHandler.returnFile("students.json", function (error: any, data: any) {
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
                        RouteHandler.returnFile("classlist.csv", function (error: any, data: any) {
                            if (!error && data.length > 0) {
                                var classArray = data.toString().split(/\n/);
                                //update students.json
                                Log.trace("updateClasslist| Updating student file..");
                                RouteHandler.updateStudents(classArray, function (success: boolean) {
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
        
        RouteHandler.returnFile("students.json", function (error: any, data: any) {
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
        RouteHandler.returnFile("students.json", function (error: any, data: any) {
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
        RouteHandler.returnFile("teams.json", function (error: any, data: any) {
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
        RouteHandler.returnFile("admins.json", function (error: any, data: any) {
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

    //***HELPER FUNCTIONS***//

    //todo: on login, let students only log in if student exists
    //in classlist, not in students.json. if not, redirect to error page (Please email prof holmes @ ..)
    //todo: make sure we don't overwrite existing info by accident!
    static updateStudents(classlist:any, callback:any) {
        RouteHandler.returnFile("students.json", function (error: any, data:any) {
            var studentsFile: any[];

            //check if response exists and is not 0-length file
            //todo: look into streams instead of fs.readFile
            if (!error && data.length > 0) {
                studentsFile = JSON.parse(data);
            }
            else {
                studentsFile = [];
            }

            var studentsAdded: number = 0;
            for (var index = 1; index < classlist.length; index++) {
                var studentInfo = classlist[index].split(','); //csid, sid, lastname, firstname
                if (!!studentInfo[0] && !!studentInfo[1] && !!studentInfo[2] && !!studentInfo[3]) {
                    //check if student exists in students.json
                    if (!!studentsFile.find((student: any) => student.sid === studentInfo[1])) {
                        //Log.trace("updateStudents| Student file exists already!");
                    }
                    //else, add blank student to students.json
                    else {
                        var newStudent = {
                            "csid": studentInfo[0],
                            "sid": studentInfo[1],
                            "lastname": studentInfo[2],
                            "firstname": studentInfo[3],
                            "github_name": "",
                            "github_token": "",
                            "hasTeam": false
                        };
                        //studentsFile[studentsFile.length] = newStudent;
                        studentsFile.push(newStudent);
                        studentsAdded++;
                    }
                    //for students who were already in students.json but not in new classlist:
                    //should we not let them log in? do nothing for now.
                }
                else {
                    Log.trace("updateStudents| This line is empty or badly formatted.");
                }
            }
            //done updating
            Log.trace("updateStudents| Added " + studentsAdded + " new students to students.json");
            var filename = pathToRoot.concat(config.path_to_students);      
            fs.writeFile(filename, JSON.stringify(studentsFile, null, 2), function (err: any) {
                if (err) {
                    Log.trace("updateStudents| Write error: "+err.toString());
                    return;
                }
                else {
                    Log.trace("updateStudents| Write successful.");
                    callback(true);
                    return;
                }
            });
        });
    }

    static parseClasslist(file:any, callback:any) {
        Log.trace("parseCSV| Reading file..");
        
        fs.readFile(file, function read(err: any, data: any) {
            if (err) {
                Log.trace("parseCSV| Error reading file: "+err.toString());
                return;
            }
            else {
                Log.trace("parseCSV| File read successfully.");
                
                var lines = data.toString().split(/\n/);
                Log.trace("parseCSV| Classlistlist retrieved. There are " + (lines.length - 1) + " students in the class list.");

                // Splice up the first row to get the headings
                Log.trace("parseCSV| Headings: " + lines[0]);
                var headings = lines[0].split(',');

                //data arrays are set up specifically for our class.csv format
                var studentObject: any[] = [];

                // Split up the comma seperated values and sort into arrays
                for (var index = 1; index < lines.length; index++) {
                    Log.trace("index: "+index);
                    var values = lines[index].split(',');
                    var newStudent = {
                        "sid": "",
                        "csid": "",
                        "firstname": "",
                        "lastname": "",
                        "github_name": "",
                        "github_token": "",
                        "hasTeam": false
                    };
                    newStudent.csid = values[0];
                    newStudent.sid = values[1];
                    newStudent.lastname = values[2];
                    newStudent.firstname = values[3];
                    studentObject.push(newStudent);
                }
                
                Log.trace("parseCSV| Sending class list.." + JSON.stringify(studentObject));
                callback(studentObject);
                return;
            }
        });
    }

    static requestGithubInfo(githubtoken: string, callback: any) {
        var options = {
            url: 'https://api.github.com/user',
            headers: {
                "User-Agent": "ClasslistPortal-Student",
                "Authorization": "token "+githubtoken
            }
        };
        
        Log.trace("requestGithubInfo| Requesting public info from Github..");
        request(options, callback);
    }

    static createBlankStudent(username: string, githubtoken: string, callback: any) {
        Log.trace("createBlankStudent| Creating new student: "+username);
        var filename = pathToRoot.concat(config.path_to_students);
        var file = require(filename);        
        file[username] = {
            "sid": "",
            "csid": "",
            "firstname": "",
            "lastname": "",
            "githubtoken": githubtoken
        };
        
        fs.writeFile(filename, JSON.stringify(file, null, 2), function (err: any) {
            if (err) {
                Log.trace("createBlankStudent| Write error: "+err.toString());
                return;
            }
            else {
                Log.trace("createBlankStudent| New student created.");
                callback();
            }
        });
    }
    
    static writeStudent(username: string, paramsObject: any, callback: any) {
        Log.trace("writeStudent| Writing to user: " + username + " in students.json..");
        
        var filename = pathToRoot.concat(config.path_to_students); 
        var file = require(filename);

        //step 1: check if username exists
        if (!!file[username]) {
            //step 2: update student object
            //TODO: do i need to worry about mapping to a new object instead of modifying the original object?
            var i = 0;
            for (var key in paramsObject) {
                if (file[username].hasOwnProperty(key)) {
                    Log.trace('writeStudent| Writing to '+key+': '+paramsObject[key]);
                    file[username][key] = paramsObject[key];
                    i++;
                }
            }
            Log.trace('writeStudent| Mapped '+i+' key(s).');

            //step 3: write to file
            fs.writeFile(filename, JSON.stringify(file, null, 2), function (err: any) {
                if (err) {
                    Log.trace("writeStudent| Write unsuccessful: "+err.toString());
                    return;
                }
                else {
                    Log.trace("writeStudent| Write successful! Executing callback..");
                    callback();
                    return;
                }
            });
        }
        else {
            Log.trace("writeStudent| Error: User was not found..");
            return;
        }
    }

    static include(arr:any, obj:any) {
      var result = (arr.indexOf(obj) != -1);
      console.log("AdminStudents.js| Checking if " + obj + " exists in " + JSON.stringify(arr) + ". Result: " + result.toString());
      return (result);
    }

    //update students in students.json
    //todo: add error callback to this (and all other functions)    
    static updateStudentObject(sid: string, paramsObject: any, callback: any) {
        Log.trace("updateStudentObject| Updating student: " + sid);
        var filename = pathToRoot.concat(config.path_to_students); 
        var file = require(filename);
        var valuesUpdated:number = 0;

        //step 1: check if sid exists
        for (var index = 0; index < file.length; index++){
            if (file[index].sid == sid) {
                for (var key in paramsObject) {
                    if (file[index].hasOwnProperty(key)) {
                        Log.trace("updateStudentObject| New value for key: " + key);
                        Log.trace("updateStudentObject| Old: " + file[index][key] + " New: " + paramsObject[key]);
                        file[index][key] = paramsObject[key];
                        valuesUpdated++;
                    }
                }
                //only update file if at least 1 value was updated.
                if (valuesUpdated > 0) {
                    //step 3: write to file
                    fs.writeFile(filename, JSON.stringify(file, null, 2), function (err: any) {
                        if (err) {
                            Log.trace("updateStudentObject| Write unsuccessful: "+err.toString());
                            return;
                        }
                        else {
                            Log.trace("updateStudentObject| Write successful! Executing callback..");
                            callback();
                            return;
                        }
                    });
                }
                else {
                    //no values to be updated
                    return;
                }
            }
        }
        return;
    }

    static returnStudent(username: string, callback: any) {
        Log.trace("returnStudent| Accessing students.json");
        var filename = pathToRoot.concat(config.path_to_students);
        
        fs.readFile(filename, function read(err: any, data: any) {
            if (err) {
                Log.trace("returnStudent| Error reading file: "+err.toString());
                return;
            }
            else {
                var file = JSON.parse(data);
                Log.trace("returnStudent| Checking for user "+username);
                
                if (!!file[username]) {
                    Log.trace("returnStudent| Successfully accessed "+username+".");
                    callback(file[username]);
                    return;
                }
                else {
                    Log.trace("returnStudent| Username not found.");
                    callback(null);
                    return;
                }
            }
        });
    }

    //todo: returns bad data when reading empty (0-length) file. look into i/o streams    
    static returnFile(file: string, callback: any) {
        Log.trace("returnFile| Accessing: " + file);
        var filename = pathToRoot.concat(config.private_folder, file);

        fs.readFile(filename, function read(err: any, data: any) {
            if (err) {
                Log.trace("returnFile| Error reading file! Returning error..");
                callback(true, null);
                return;
            }
            else {
                Log.trace("returnFile| File read successfully! Returning data..");
                callback(null, data);
                return;
            }
        });
    }
    
    static createServerToken(username: string, admin: boolean, callback: any) {
        Log.trace("createServerToken| Generating new servertoken for user "+username);
        
        //generate unique string
        var servertoken: string = Math.random().toString(36).slice(2);

        //access file
        var filename = pathToRoot.concat(config.path_to_tokens); 
        var file = require(filename);
        
        //overwrite or create
        if (admin)
            file.admins[username] = servertoken;
        else
            file.students[username] = servertoken;
        
        //step 3: write to file
        fs.writeFile(filename, JSON.stringify(file, null, 2), function (err: any) {
            if (err) {
                Log.trace("createServerToken| Write unsuccessful: "+err.toString());
                return;
            }
            else {
                Log.trace("createServerToken| Write successful! Executing callback..");
                callback(servertoken);
                return;
            }
        });
    }

    static isAdmin(username: string, callback:any) {
        Log.trace("isAdmin| Checking admin status..");
        var filename = pathToRoot.concat(config.path_to_admins);

        fs.readFile(filename, function read(err: any, data: any) {
            if (err) {
                Log.trace("isAdmin| Error reading file: "+err.toString());
                callback(false);
                return;
            }
            else {
                var file = JSON.parse(data);
                if (!!file[username]) {
                    Log.trace("isAdmin| " + username + " is an admin! Executing callback..");                    
                    callback(true);
                    return;
                }
                else {
                    Log.trace("isAdmin| " + username + " is an student! Executing callback..");
                    callback(false);
                    return;
                }
            }
        });
    }
}