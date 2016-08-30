/**
 * Created by rtholmes on 14/06/2016.
 */

import restify = require('restify');
import http = require('http');
import qs = require('querystring');
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
    static getAllGrades(req:restify.Request, res: restify.Response, next: restify.Next) {
        res.send(200, "suh, dude");
        return;
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
        
        //only continue if authcode is present.
        if (!!req.params.authcode) {
            //build the request options object
            var options = {
                method: 'post',
                body: { client_id: config.client_id,
                        client_secret: config.client_secret,
                        code: req.params.authcode },
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

        //callback executed after successful request to Github for access token.
        function requestGithubTokenCallback(err1: any, res1: any, body1: any) {
            if (!err1 && res1.statusCode == 200) {
                var githubtoken = body1.access_token;
                Log.trace("authenticateGithub| Successfully acquired github token.");
                
                //next, request github username using githubtoken.
                RouteHandler.requestGithubInfo(githubtoken, function (err2: any, res2: any, body2: any) {
                    if (!err2 && res2.statusCode == 200) {
                        var obj = JSON.parse(body2);
                        var username = obj.login;
                        Log.trace("authenticateGithub| Successfully acquired username: "+username);
                                    
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
        var username = req.header('user');
        var csid = req.params.csid;
        var sid = req.params.sid;
        var validCSID = /^[a-z][0-9][a-z][0-9]$/;
        var validSID = /^\d{8}$/; 
        
        //first, test CSID and SID regex
        Log.trace("registerAccount| Testing CSID and SID regex..");
        if (validCSID.test(csid) && validSID.test(sid)) {
            Log.trace("registerAccount| Valid regex.");
            
            //get class list then check if csid and sid exist and are a valid combination
            RouteHandler.returnFile("class.csv", function (data: any) {
                var lines = data.toString().split(/\n/);
                Log.trace("registerAccount| Classlistlist retrieved. There are " + (lines.length - 1) + " students in the class list.");
                        
                // Splice up the first row to get the headings
                var headings = lines[0].split(',');
                
                //data arrays are set up specifically for our class.csv format
                //TODO: last names are unused in this function.
                var csidArray: any[] = [];
                var sidArray: any[] = [];
                var lastArray: any[] = [];
                var firstArray: any[] = [];
                
                // Split up the comma seperated values and sort into arrays
                for (var index = 1; index < lines.length; index++) {
                    var values = lines[index].split(',');
                    csidArray.push(values[0]);
                    sidArray.push(values[1]);
                    lastArray.push(values[2]);
                    firstArray.push(values[3]);
                }
                
                //check if csid exists
                Log.trace("registerAccount| Checking CSID..");
                for (var index = 0; index < csidArray.length; index++) {
                    if (csid == csidArray[index]) {
                        //check if sid exists
                        Log.trace("registerAccount| CSID Match! Checking SID..");
                        if (sid == sidArray[index]) {
                            Log.trace("registerAccount| SID Match! Updating student information..");
                            RouteHandler.writeStudent(username, { "sid": sid, "csid": csid, "firstname": firstArray[index], "lastname": lastArray[index] }, function () {
                                Log.trace("registerAccount| Account updated successfully. Sending user to homepage.");
                                res.json(200, "success");
                                return next();
                            });
                            //Log.trace("Error: writeStudent failed");
                            //????
                            return next();
                        }
                        else {
                            //invalid login combination
                            Log.trace("registerAccount| Error: Invalid CSID/SID combination. Returning..");
                            res.send(500, "bad login");
                            return next();
                        }
                    }
                }
                Log.trace("registerAccount| Error: Invalid CSID. Returning..");
                res.send(500, "bad login");
                return next();
            });
        }
        else {
            Log.trace("registerAccount| Error: Invalid SID or CSID regex. Returning..");
            res.send(500, "bad login");
            return next();
        }
    }

    static getStudent(req: restify.Request, res: restify.Response, next: restify.Next) {
        var user = req.header('user');
        
        Log.trace("getStudent| Retrieving student file..");
        RouteHandler.returnStudent(user, function (response:any) {
            //return current student
            if (response == null) {
                Log.trace("getStudent| Error! Student object: "+response);
                res.json(500, "error");
            }
            else {
                Log.trace("getStudent| Success! Returning..");
                res.json(200, response);
                return next();
            }
        });
    }

    static getDeliverables(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("getDeliverables| Requesting file..");
        RouteHandler.returnFile("deliverables.json", function (response: any) {
            var data = JSON.parse(response);
            if (data == null) {
                Log.trace("getDeliverables| Error: Bad data. Returning..");
                res.json(500, "null");
                return next();
            }
            else {
                Log.trace("getDeliverables| Success! Returning..");
                res.json(200, data);
                return next();    
            }
        });
    }

    static getGrades(req: restify.Request, res: restify.Response, next: restify.Next) {
        var sid = req.params.sid;
        Log.trace("getGrades| Testing SID regex..");
        
        //check sid with regex
        if (sid.match(/^\d{8}$/)) {
            Log.trace("getGrades| Valid regex.");

            //read grades.csv
            RouteHandler.returnFile("grades.csv", function (data:any) {
                Log.trace("getGrades| Getting grades..");
                
                var lines = data.toString().split(/\n/);
                var myGrades: any[] = [];
                // Split up the comma seperated values and sort into arrays
                for (var i = 1; i < lines.length; i++) {
                    var values = lines[i].split(',');
                    if (values[0] == sid) {
                        for (var j = 1; j < values.length; j++){
                            myGrades.push(values[j]);
                        }
                    }
                }

                if (myGrades.length > 0) {
                    Log.trace("getGrades| Success! Returning..");
                    res.json(200, myGrades);    
                }
                else {
                    Log.trace("getGrades| sid not found. Returning error..");
                    res.json(500, "student not found");
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
        Log.trace("deleteServerToken| Deleting servertoken for user: "+user);
        if (admin === "true")
            file.admins[user] = "";
        else
            file.students[user] = "";
        
        //step 3: write to file
        fs.writeFile(filename, JSON.stringify(file, null, 2), function (err: any) {
            if (err) {
                Log.trace("deleteServerToken| Error: Write unsuccessful. Returning..");
                res.send(500, "bad logout")
                return next();
            }
            else {
                Log.trace("deleteServerToken| Success! Returning..");
                res.send(200, "success")
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

        //todo: permissions: if not admin, can only set team with std1=user
        if (1) {
            var filename = pathToRoot.concat(config.path_to_teams);
            var file = require(filename);        
            var newEntry = {
                "team": file.length + 1,
                "url": "",
                "members": req.params.students
            };

            Log.trace("createTeam| New team: " + JSON.stringify(newEntry));
            
            file.push(newEntry);
            
            fs.writeFile(filename, JSON.stringify(file, null, 2), function (err: any) {
                if (err) {
                    Log.trace("createTeam| Write error: " + err.toString());
                    res.send(500, "error")
                    return;
                }
                else {
                    Log.trace("createTeam| Team added to teams.json");

                    for (var i = 0; i < req.params.students.length; i++) {
                        RouteHandler.writeStudent(req.params.students[i], { "hasTeam": true }, function () {
                            Log.trace("createTeam| Updated " + req.params.students[i] + "'s team status.");
                        });
                    }
                    
                    Log.trace("createTeam| Team " + newEntry.team + " created! Returning..");
                    res.send(200, newEntry.team)
                    return next();
                }
            });
        }
        else {
            Log.trace("createTeam| Error: Bad permission");
            res.send(500, "bad permissions")
            return;
        }
    }

    /*
        expects ubc-formatted classlist
        save to classlist.csv
        populate students.json
        do something to grades.json (should grades be in students.json?)
    */
    static updateClasslist(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("updateClasslist| Reading new file..");

        fs.readFile(req.files[0].path, function read(err: any, data: any) {
            if (err) {
                Log.trace("updateClasslist| Error reading file: " + err.toString());
                res.send(500, "error");
                return;
            }
            else {
                Log.trace("updateClasslist| Accessing old file..");
                var filename = __dirname.substring(0, __dirname.lastIndexOf('classportalserver/')) + 'classportalserver/priv/classlist.csv'; 
                    Log.trace("updateClasslist| " + filename);
                //var file = require(filename);
                    //Log.trace("updateClasslist| " + file);

                Log.trace("updateClasslist| Overwriting old file..");
                fs.writeFile(filename, data, function (err: any) {
                    if (err) {
                        Log.trace("updateClasslist| Write unsuccessful: " + err.toString());
                        res.send(500, "error");
                        return;
                    }
                    else {
                        Log.trace("updateClasslist| Write successful!");
                        
                        //read new classlist
                        RouteHandler.returnFile("classlist.csv", function (response: any) {
                            var classArray = response.toString().split(/\n/);
                            if (!!classArray) {
                                //update students.json
                                Log.trace("updateClasslist| Updating students.json..");
                                RouteHandler.updateStudents(classArray, function (success: boolean) {
                                    if (success) {
                                        Log.trace("updateClasslist| Successfully updated students.json. Returning..");
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
        
        RouteHandler.returnFile("classlist.csv", function (data: any) {
            if (data == null) {
                res.json(500, "Bad class list. Returning..");
            }
            else {
                var lines = data.toString().split(/\n/);
                Log.trace("getClasslist| Classlistlist retrieved. There are " + (lines.length - 1) + " students in the class list.");
                        
                // Splice up the first row to get the headings
                var headings = lines[0].split(',');
                
                //data arrays are set up specifically for our class.csv format
                //TODO: last names are unused in this function.
                var classlist: any[] = [];
                
                // Split up the comma seperated values and sort into arrays
                for (var index = 1; index < lines.length; index++) {
                    var values = lines[index].split(',');
                    classlist.push(values[3] + " " + values[2])
                }
                
                Log.trace("getClasslist| Sending class list..");
                res.json(200, classlist);
            }
        });
    }
    
    //***HELPER FUNCTIONS***//

    //todo: on login, let students only log in if student exists
    //in classlist, not in students.json. if not, redirect to error page (Please email prof holmes @ ..)
    //todo: make sure we don't overwrite existing info by accident!
    static updateStudents(classlist:any, callback:any) {
        Log.trace("updateStudents| classlist: " + classlist);
        Log.trace("updateStudents| classlist.length: " + classlist.length);
        RouteHandler.returnFile("students.json", function (response: any) {
            if (response == null) {
                //???
            }
            else {
                //???
            }
            var studentsFile = JSON.parse(response);
            Log.trace("updateStudents| Response: " + studentsFile);
            Log.trace("studentsFile.length: " + studentsFile.length);
            //loop: for each students in classlist
            for (var index = 1; index < classlist.length; index++) {
                Log.trace("updateStudents| Index: " + index);
                //csid, sid, lastname, firstname
                var values = classlist[index].split(',');
                Log.trace("updateStudents| values: " + values);

                Log.trace("updateStudents| TEST");
                //check if student exists in students.json
                //if yes: do nothing(?)


                function findSID(student: any) {
                    Log.trace("updateStudents| values[1]:" + values[1] + ", student.sid:" + student.sid);
                    return student.sid === values[1];
                };

                var asdf: boolean = !!studentsFile.find(findSID);
                Log.trace("updateStudents| asdf: " + asdf);

                if (asdf) {
                    Log.trace("updateStudents| doNothing");
                }
                else {
                    //add blank student to students.json
                    Log.trace("updateStudents| Adding new student..");
                    var newStudent = {
                        "csid": values[0],
                        "sid": values[1],
                        "firstname": values[3],
                        "lastname": values[2],
                        "github_name": "",
                        "github_token": "",
                        "hasTeam": false
                    };
                    Log.trace("updateStudents| Pushing student: " + JSON.stringify(newStudent, null, 2));
                    studentsFile[studentsFile.length] = newStudent;
                    
                    Log.trace("updateStudents| test1");
                }
                Log.trace("updateStudents| test2");
                //for students who were already in students.json but not in new classlist:
                //do not let them log in?
                //do nothing for now.
            }
            //done
            Log.trace("updateStudents| Writing new student file: " + JSON.stringify(studentsFile));
            var filename = pathToRoot.concat(config.path_to_students);      
            fs.writeFile(filename, JSON.stringify(studentsFile, null, 2), function (err: any) {
                if (err) {
                    Log.trace("updateStudents| Write error: "+err.toString());
                    return;
                }
                else {
                    Log.trace("updateStudents| New file created.");
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
    
    //update keys in object in username file
    //todo: rename writeStudent to updateStudent
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

    static returnFile(file: string, callback: any) {
        Log.trace("returnFile| Accessing: " + file);
        var filename = pathToRoot.concat(config.private_folder, file);

        fs.readFile(filename, function read(err: any, data: any) {
            if (err) {
                Log.trace("returnFile| Error reading file: "+err.toString());
                return;
            }
            else {
                Log.trace("returnFile| File read successfully. Executing callback..");
                callback(data);
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
    
    //***OLD FUNCTIONS***//

    static putSay(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RouteHandler.putSay()\nparams: '+JSON.stringify(req.params));
        try {
            // validate params
            if (typeof req.params.val !== 'undefined') {
                // let routeCtrl = new SayController();

                let id = req.params.val;
                let val = JSON.parse(req.body);

                // let retVal = routeCtrl.say(id, val);
                let retVal = 'foo';
                res.json(200, retVal);
            } else {
                res.send(403);
            }
        } catch (err) {
            Log.trace('RouteHandler.putSay() - ERROR: '+err.message);
            res.send(404);
        }

        return next();
    }
    
    static getEcho(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RouteHandler.getEcho()\nparams: '+JSON.stringify(req.params));

        if (typeof req.params.message !== 'undefined' && req.params.message.length > 0) {
            let val = req.params.message;
            let ret = EchoController.echo(val);
            res.json(200, { msg: ret });
        } else {
            res.json(400, { error: 'No message provided' });
            //res.send(403);
        }

        return next();
    }

    static deleteStudent(req: restify.Request, res: restify.Response, next: restify.Next) {
        return next();
    }
    
    static getStudents(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RouteHandler.getStudents()\nparams: '+JSON.stringify(req.params));
        let store = new MemoryStore();
        store.createData();
        res.json(200, store.getStudents());
        return next();
    }

    static getStore(): Store {
        return new MemoryStore();
    }

    static saveStore(store: MemoryStore): void {
        store.persist();
    }

    static getStudentById(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RouteHandler.getStudentById()\nparams: '+JSON.stringify(req.params));
        
        
        let store = new MemoryStore();
        //store.createData();

        var found = store.getStudent(req.params.id);
        if (found) {
            res.json(200, found);
        }
        else {
            res.send(404, "student not found");
        }
        
        store.persist();
        return next();
    }
    
    static createStudent(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RouteHandler.createStudent()\nparams: '+JSON.stringify(req.params));

        var newStudent = new Student(req.body.id, req.body.name, req.body.studentNumber);

        let store = new MemoryStore();
        store.createData();

        if (!req.body.hasOwnProperty('id') || !req.body.hasOwnProperty('name')) {
            res.send(500, "error: not a student");
        } else {
            store.saveStudent(newStudent);
            res.send(201, "Student "+req.body.name+" created!");
        }


        return next();
    }
}