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

import config2 from './config2';

export default class RouteHandler {
    /*
        This function is called from the "post-login" page, after a successful Github login.
        Parameters: Github authcode 
        Actions:
        1) request an access token from github.
        2) use token to get user info from github.
        3) check if username exists in database
        4a) if yes, update the user's accesstoken and redirect app to the homepage.
        4b) if no, create blank student and redirect app to registration page.
    */
    static requestAccessToken(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RouteHandler::requestAccessToken(..) - params: ' + JSON.stringify(req.params));

        var options = {
            method: 'post',
            body: { client_id: config2.client_id,
                    client_secret: config2.client_secret,
                    code: req.params.authCode },
            json: true,
            url: 'https://github.com/login/oauth/access_token',
            headers: {}
        };
    
        function requestAccessTokenCallback(err1: any, res1: any, body1: any) {
            if (!err1 && res1.statusCode == 200) {
                var accesstoken = body1.access_token;
                Log.trace("Successfully acquired accesstoken: " + accesstoken);

                //next, request github username using accesstoken.
                RouteHandler.requestGithubInfo(accesstoken, function (err2: any, res2: any, body2: any) {
                    if (!err2 && res2.statusCode == 200) {
                        var obj = JSON.parse(body2);
                        var username = obj.login;
                        Log.trace("Successfully! Now checking file for registration status..");
                        
                        //next, request student info from database by providing github username.
                        RouteHandler.readJSON("students", username, function (studentObject: any) {
                            //if student does not exist in database, create new user.
                                //TODO: but what if it was becuase of file read error?
                            if (studentObject == null) {
                                //create new student with gitub username and accesstoken.
                                RouteHandler.createBlankStudent(username, accesstoken, function () {
                                    //finally, send app to registration page.
                                    //todo: double check this action
                                    Log.trace("Redirecting to registration page.");
                                    res.json(200, "/register~" + username + "~temp");
                                });
                            }
                            else {
                                //if a match is found, check if they have the required info from registration.
                                if (!!studentObject.csid && !!studentObject.sid && !!studentObject.firstname ) {
                                    
                                    //next, update accesstoken
                                    RouteHandler.writeJSON(username, { "accesstoken": accesstoken }, function () {
                                        Log.trace("Updated student's accesstoken. Sending user to homepage..");
                                        res.json(200, "/~" + username + "~legit");
                                        //next, create servertoken
                                        /*RouteHandler.createServerToken(username, function (servertoken:string) {
                                            Log.trace("Updated student's servertoken. Redirecting to home page.");
                                            
                                            //finally, redirect app to home page with user and new servertoken.
                                            res.json(200, "/~" + username + "~" + servertoken);
                                        });*/
                                    });
                                }
                                else {
                                    Log.trace("User has not completed registration. Redirecting to registration page.");
                                    res.json(200, "/register~" + username + "~temp");
                                }
                            }
                        });
                    }
                    else {
                        Log.trace("Error accessing info from Github.");
                    }
                });
            }
            else {
                Log.trace("Error requesting access token from github.com: " + err1.toString());
            }
        }

        //request accesstoken from Github using authcode and client id + secret
        Log.trace("Requesting access token from github.com..");
        request(options, requestAccessTokenCallback);
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
        Log.trace('RouteHandler::registerAccount(..) - params: ' + JSON.stringify(req.params));
        //start, as always, by checking servertoken. if fail, return error response.
        //validate sid and csid
        
        //get class list then check if csid and sid exist and are a valid combination
        RouteHandler.getClassList(function (csidArray: any, sidArray: any, lastArray: any, firstArray: any) {
            //check if csid exists
            Log.trace("Checking CSID..");
            for (var index = 0; index < csidArray.length; index++){
                if (req.params.csid == csidArray[index]) {
                    //check if sid exists
                    Log.trace("CSID Match! Checking SID..");
                    if (req.params.sid == sidArray[index]) {
                        Log.trace("SID Match! Updating student information..");
                        RouteHandler.writeJSON(req.params.github, { "sid": req.params.sid, "csid": req.params.csid, "firstname":firstArray[index] }, function () {
                            Log.trace("Account updated successfully. Sending user to homepage.");
                            res.json(200, "success~legit");
                            return next();
                        });
                        //Log.trace("Error: writeJSON failed");
                        //????
                        return next();
                    }
                    else {
                        //invalid login combination
                        Log.trace("Error: Bad SID.");
                        res.send(200, "bad login");
                        return next();
                    }
                }
            }
            Log.trace("Error: Bad CSID.");
            res.send(200, "bad login");
            return next();
        });
    }

    //***HELPER FUNCTIONS***//
    static requestGithubInfo(accessToken: string, callback: any) {
        Log.trace('RouteHandler::requestGithubInfo(..)');
        var options = {
            url: 'https://api.github.com/user',
            headers: {
                "User-Agent": "ClassPortal-Student",
                "Authorization": "token " + accessToken
            }
        };
        
        Log.trace("Requesting public info from github.com..");
        request(options, callback);
    }

    static createBlankStudent(username: string, accessToken: string, callback: any) {
        Log.trace('RouteHandler::createBlankStudent():: '+username+', '+accessToken);
        
        //RouteHandler.createServerToken(githubUser, function (response: string) { });
        var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest")) + "sampleData/students.json";
        var file = require(filename);        
        file.students[username] = {
            "sid": "",
            "csid": "",
            "firstname": "",
            "accesstoken": accessToken,
            "grades": {
                "courses": "",
                "assn1": "",
                "assn2": "",
                "assn3": "",
                "midterm": "",
                "final": "",
                "total": ""
            }
        };
        fs.writeFile(filename, JSON.stringify(file, null, 2), function (err: any) {
            if (err) {
                Log.trace("writeFile error: " + err.toString());
                return;
            }
            else {
                Log.trace("New student: "+username+" created.");
                callback();
            }
        });
    }
    
    //update keys in object in username file    
    static writeJSON(username: string, paramsObject: any, callback: any) {
        Log.trace("RouteHandler::writeJSON():: username: " + username + ", paramsObject: " + JSON.stringify(paramsObject));
        var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest")) + "sampleData/students.json";
        var file = require(filename);
        Log.trace("Accessed file: students.json. Checking for user: " + username);

        //step 1: check if username exists
        if (!!file.students[username]) {
            Log.trace("User " + username + " found.");
            
            //step 2: update student object
            //TODO: do i need to worry about mapping to a new object instead of
            //modifying the original object?
            var i = 0;
            for (var key in paramsObject) {
                Log.trace('Mapping ' + key + ':' + paramsObject[key] + ' (Previous value was: ' + JSON.stringify(file.students[username][key])+')');
                if (file.students[username].hasOwnProperty(key)) {
                    file.students[username][key] = paramsObject[key];
                    i++;
                }
            }
            Log.trace('Mapped ' + i + ' key(s)!');

            //step 3: write to file
            fs.writeFile(filename, JSON.stringify(file, null, 2), function (err: any) {
                if (err) {
                    Log.trace("Write unsuccessful: " + err.toString());
                    return;
                }
                else {
                    Log.trace("Write successful! Executing callback..");
                    callback();
                    return;
                }
            });
        }
        else {
            Log.trace("Error: User was not found..");
            return;
        }
    }

    static readJSON(accessType: string, username: string, callback: any) {
        Log.trace('RouteHandler::readJSON(..) - params: ' + accessType + ', ' + username);
        var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest")) + "sampleData/students.json";
        Log.trace("Accessing file: students.json");

        fs.readFile(filename, function read(err: any, data: any) {
            if (err) {
                Log.trace("Error reading file: " + err.toString());
                return;
            }
            else {
                var file = JSON.parse(data);
                Log.trace("File read successfully. Checking for user " + username);
                
                if (!!file[accessType][username]) {
                    Log.trace("Successfully accessed user " + username+". Executing callback..");
                    callback(file[accessType][username]);
                    return;
                }
                else {
                    Log.trace(username + "not found in file! Returning..");
                    callback(null);
                    return;
                }
            }
        });
    }
    
    static createServerToken(username: string, callback: any) {
        //generate unique string
        var servertoken: string = Math.random().toString(36).slice(2);

        //add servertoken to database
        RouteHandler.writeJSON(username, { "servertoken": servertoken }, function () {
            Log.trace("servertoken: " + servertoken + " given to " + username);
            
            //do something with the servertoken
            callback(servertoken);
        })
    }

/*    
    static checkServerToken(serverToken: string, github: string, callback: any) {
        Log.trace('RouteHandler::checkServerToken(..) - params: ' + serverToken + ', ' + github);
        RouteHandler.readJSON("students", serverToken, github, function (userObject: any) {
            Log.trace("readJSON() successful. Checking token...");
            var existing_token = userObject.servertoken;
            if (!!existing_token && existing_token == serverToken) {
                Log.trace("Good servertoken. Executing callback...");
                callback(userObject);
                return;
            }
            else {
                Log.trace("Bad servertoken");
                return;
            }
        });
    }
*/
    
    static getClassList(callback:any) {
        Log.trace('RouteHandler::getClassList(..)');
        var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest")) + "sampleData/classList.csv";
        
        Log.trace("Reading from file: classList.csv");
        fs.readFile(filename, function read(err: any, data: any) {
            if (err) {
                Log.trace("Error reading file: " + err.toString());
                return;
            }
            else {
                var lines = data.toString().split(/\n/);
                Log.trace("File read successfully. There are " + (lines.length-1) + " students in the class list.");

                // Splice up the first row to get the headings
                var headings = lines[0].split(',');
                
                //data arrays are set up specifically for our classList.csv format
                var csid: any[] = [];
                var sid: any[] = [];
                var last: any[] = [];
                var first: any[] = [];
                
                // Split up the comma seperated values and sort into arrays
                for (var index = 1; index < lines.length; index++) {
                    var values = lines[index].split(','); 
                    csid.push(values[0]);
                    sid.push(values[1]);
                    last.push(values[2]);
                    first.push(values[3]);
                }

                Log.trace("Classlist acquired. Executing callback..");
                callback( csid, sid, last, first );
            }
        });
    }
    
    //***OLD FUNCTIONS***//

    static putSay(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RouteHandler::putSay(..) - params: ' + JSON.stringify(req.params));
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
            Log.trace('RouteHandler::putSay(..) - ERROR: ' + err.message);
            res.send(404);
        }

        return next();
    }
    
    static getEcho(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RouteHandler::getEcho(..) - params: ' + JSON.stringify(req.params));

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
        Log.trace('RouteHandler::getStudents(..) - params: ' + JSON.stringify(req.params));
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
        Log.trace('RouteHandler::getStudentById(..) - params: ' + JSON.stringify(req.params));
        
        
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
        Log.trace('RouteHandler::createStudent(..) - params: ' + JSON.stringify(req.params));

        var newStudent = new Student(req.body.id, req.body.name, req.body.studentNumber);

        let store = new MemoryStore();
        store.createData();

        if (!req.body.hasOwnProperty('id') || !req.body.hasOwnProperty('name')) {
            res.send(500, "error: not a student");
        } else {
            store.saveStudent(newStudent);
            res.send(201, "Student " + req.body.name + " created!");
        }


        return next();
    }
}