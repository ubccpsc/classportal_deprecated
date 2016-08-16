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
var config = require('./config.json');

export default class RouteHandler { 
    static getGradesAdmin(req:restify.Request, res: restify.Response, next: restify.Next) {
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
        var options = {
            method: 'post',
            body: { client_id: config.client_id,
                    client_secret: config.client_secret,
                    code: req.params.authCode },
            json: true,
            url: 'https://github.com/login/oauth/access_token',
            headers: {}
        };
    
        function requestGithubTokenCallback(err1: any, res1: any, body1: any) {
            if (!err1 && res1.statusCode == 200) {
                var githubtoken = body1.access_token;
                Log.trace("authenticateGithub| Successfully acquired github token.");
                
                //next, request github username using githubtoken.
                RouteHandler.requestGithubInfo(githubtoken, function (err2: any, res2: any, body2: any) {
                    if (!err2 && res2.statusCode == 200) {
                        var obj = JSON.parse(body2);
                        var username = obj.login;
                        Log.trace("authenticateGithub| Successfully acquired username: "+username+". Checking registration status..");
                        
                        //first, create servertoken
                        RouteHandler.createServerToken(username, function (servertoken: string) {
                            Log.trace("authenticateGithub| Updated student's servertoken.");
                                    
                            //next, check if username matches list of admin usernames.
                            RouteHandler.isAdmin(username, function (response: boolean) {
                                //check if admin
                                if (response) {
                                    res.send(200, "/admin~" + username + "~"+servertoken);
                                    return next();
                                }
                                //student
                                else {
                                    //next, request student info from database by providing github username.
                                    RouteHandler.returnStudent("students", username, function (studentObject: any) {
                                        
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

        //request githubtoken from Github using authcode and client id+secret
        Log.trace("authenticateGithub| Requesting access token from Github..");
        request(options, requestGithubTokenCallback);
        return next();
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
        var username = req.params.username; 
        var csid = req.params.csid;
        var sid = req.params.sid;
        var validCSID = /^[a-z][0-9][a-z][0-9]$/;
        var validSID = /^\d{8}$/; 
        
        //first, test CSID and SID regex
        Log.trace("registerAccount| Testing CSID and SID regex..");
        if (validCSID.test(csid) && validSID.test(sid)) {
            Log.trace("registerAccount| Valid regex.");
            
            //get class list then check if csid and sid exist and are a valid combination
            RouteHandler.returnFile("classList.csv", function (data: any) {
                var lines = data.toString().split(/\n/);
                Log.trace("registerAccount| Classlist retrieved. There are " + (lines.length - 1) + " students in the class list.");
                        
                // Splice up the first row to get the headings
                var headings = lines[0].split(',');
                
                //data arrays are set up specifically for our classList.csv format
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
                            RouteHandler.writeStudent(username, { "sid": sid, "csid": csid, "firstname": firstArray[index] }, function () {
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
        var csid = req.params.csid;

        //check sid with regex
        Log.trace("getGrades| Testing SID regex..");
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

    static getStudent(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("getStudent| Retrieving student file..");
        RouteHandler.returnStudent("students", req.params.username, function (response:any) {
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

    static deleteServerToken(req: restify.Request, res: restify.Response, next: restify.Next) {
        var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest")) + "sampleData/tokens.json";
        var file = require(filename);
        var username = req.params.username;
        Log.trace("deleteServerToken| Deleting servertoken for user: "+username);
        
        //overwrite or create
        file[username] = "";
        
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
    
    //***HELPER FUNCTIONS***//
    static requestGithubInfo(githubtoken: string, callback: any) {
        var options = {
            url: 'https://api.github.com/user',
            headers: {
                "User-Agent": "ClassPortal-Student",
                "Authorization": "token "+githubtoken
            }
        };
        
        Log.trace("requestGithubInfo| Requesting public info from Github..");
        request(options, callback);
    }

    static createBlankStudent(username: string, githubtoken: string, callback: any) {
        Log.trace("createBlankStudent| Creating new student: "+username);
        
        //RouteHandler.createServerToken(githubUser, function (response: string) { });
        var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest"))+"sampleData/students.json";
        var file = require(filename);        
        file.students[username] = {
            "sid": "",
            "csid": "",
            "firstname": "",
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
    static writeStudent(username: string, paramsObject: any, callback: any) {
        var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest"))+"sampleData/students.json";
        var file = require(filename);
        Log.trace("writeStudent| Writing to user: "+username+" in students.json..");

        //step 1: check if username exists
        if (!!file.students[username]) {
            //step 2: update student object
            //TODO: do i need to worry about mapping to a new object instead of modifying the original object?
            var i = 0;
            for (var key in paramsObject) {
                if (file.students[username].hasOwnProperty(key)) {
                    Log.trace('writeStudent| Writing to '+key+': '+paramsObject[key]);
                    file.students[username][key] = paramsObject[key];
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

    static returnStudent(accessType: string, username: string, callback: any) {
        Log.trace("returnStudent| Accessing students.json");
        
        var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest"))+"sampleData/students.json";
        fs.readFile(filename, function read(err: any, data: any) {
            if (err) {
                Log.trace("returnStudent| Error reading file: "+err.toString());
                return;
            }
            else {
                var file = JSON.parse(data);
                Log.trace("returnStudent| Checking for user "+username);
                
                if (!!file[accessType][username]) {
                    Log.trace("returnStudent| Successfully accessed "+username+".");
                    callback(file[accessType][username]);
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
        var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest"))+"sampleData/"+file;
        Log.trace("returnFile| Accessing: "+file);

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
    
    static createServerToken(username: string, callback: any) {
        Log.trace("createServerToken| Generating new servertoken for user "+username);
        
        //generate unique string
        var servertoken: string = Math.random().toString(36).slice(2);

        //access file
        var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest"))+"sampleData/tokens.json";
        var file = require(filename);
        
        //overwrite or create
        file[username] = servertoken;
        
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
        Log.trace("isAdmin| Accessing admins.json");
        
        var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest"))+"sampleData/admins.json";
        fs.readFile(filename, function read(err: any, data: any) {
            if (err) {
                Log.trace("isAdmin| Error reading file: "+err.toString());
                callback(false);
                return;
            }
            else {
                var file = JSON.parse(data);
                Log.trace("isAdmin| Checking for admin: "+username);
                
                if (!!file[username]) {
                    Log.trace("isAdmin| Successfully accessed "+username+".");
                    callback(true);
                    return;
                }
                else {
                    Log.trace("isAdmin| Username not found.");
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