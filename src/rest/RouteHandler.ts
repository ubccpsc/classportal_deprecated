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

export default class RouteHandler {
    static validateServerToken(req: restify.Request, res: restify.Response, next: restify.Next) {
        var username = req.params.username;
        var servertoken = req.params.servertoken;
        Log.trace("validateServerToken| username: "+username+", servertoken: "+servertoken);
        
        RouteHandler.returnFile("tokens.json", function (response: any) {
            var file = JSON.parse(response);
            if (!!username && !!servertoken && servertoken == file[username]) {
                Log.trace("validateServerToken| Valid servertoken!");
                return next();
            }
            else if (servertoken == "temp") {
                Log.trace("validateServerToken| Temporary servertoken for login");
                if (!!req.params.authCode) {
                    RouteHandler.authenticateGithub(req, res, next);
                }
                else {
                    Log.trace("validateServerToken| Invalid temp request. Returning..");
                    res.send(500, "badlogin");
                }
            }
            else {
                Log.trace("validateServerToken| Bad servertoken..tokens."+username+" = "+file[username]+". Returning..");
                res.send(500, "badlogin");
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
        Log.trace('RouteHandler.authenticateGithub()\nparams: '+JSON.stringify(req.params));
        var config = require(__dirname+"/config.json");

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
                Log.trace("Successfully acquired github token.");
                
                //next, request github username using githubtoken.
                RouteHandler.requestGithubInfo(githubtoken, function (err2: any, res2: any, body2: any) {
                    if (!err2 && res2.statusCode == 200) {
                        var obj = JSON.parse(body2);
                        var username = obj.login;
                        Log.trace("Successfully acquired Username: "+username+". Checking registration status..");
                        
                        //next, request student info from database by providing github username.
                        RouteHandler.readStudent("students", username, function (studentObject: any) {
                            
                            //first, create servertoken
                            RouteHandler.createServerToken(username, function (servertoken: string) {
                                Log.trace("Updated student's servertoken.");
                                
                                //if student does not exist in database, create new user.
                                //TODO: but what if it was becuase of file read error?
                                if (studentObject == null) {
                                    
                                    //create new student with gitub username and githubtoken.
                                    RouteHandler.createBlankStudent(username, githubtoken, function () {
                                        //finally, send app to registration page.
                                        //todo: double check this action
                                        Log.trace("Redirecting to registration page.");
                                        res.json(200, "/register~"+username+"~"+servertoken);
                                    });
                                }
                                //student exists in database
                                else {
                                
                                    //update githubtoken
                                    RouteHandler.writeStudent(username, { "githubtoken": githubtoken }, function () {
                                        Log.trace("Updated student's githubtoken.");

                                        //check if they have the required info from registration.
                                        if (!!studentObject.csid && !!studentObject.sid && !!studentObject.firstname ) {
                                        Log.trace("Sending user to homepage..");
                                            res.json(200, "/~"+username+"~"+servertoken);
                                        }
                                
                                        else {
                                            Log.trace("User has not completed registration. Redirecting to registration page.");
                                            //TODO: what's stopping someone from manually entering the student portal from the registration screen?'
                                            res.json(200, "/register~"+username+"~"+servertoken);
                                        }
                                    });
                                }
                            });
                        });
                    }
                    else {
                        Log.trace("Error accessing public info from Github.");
                    }
                });
            }
            else {
                Log.trace("Error requesting access token from github.com: "+err1.toString());
            }
        }

        //request githubtoken from Github using authcode and client id+secret
        Log.trace("Requesting access token from Github..");
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
        Log.trace('RouteHandler.registerAccount()\nparams: '+JSON.stringify(req.params));
        //TODO: validate sid and csid
        //if (sid.match(/^\d{8}$/) && csid.match(/^[a-z]{1}\d{1}[a-z]{1}\d{1}$/)){

        //get class list then check if csid and sid exist and are a valid combination
        RouteHandler.returnFile("classList.csv", function (data:any) {
            var lines = data.toString().split(/\n/);
            Log.trace("Classlist retrieved. There are "+(lines.length-1)+" students in the class list.");
                    
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
            
            //check if csid exists
            Log.trace("Checking CSID..");
            for (var index = 0; index < csid.length; index++){
                if (req.params.csid == csid[index]) {
                    //check if sid exists
                    Log.trace("CSID Match! Checking SID..");
                    if (req.params.sid == sid[index]) {
                        Log.trace("SID Match! Updating student information..");
                        RouteHandler.writeStudent(req.params.username, { "sid": req.params.sid, "csid": req.params.csid, "firstname":first[index] }, function () {
                            Log.trace("Account updated successfully. Sending user to homepage.");
                            res.json(200, "success");
                            return next();
                        });
                        //Log.trace("Error: writeStudent failed");
                        //????
                        return next();
                    }
                    else {
                        //invalid login combination
                        Log.trace("Error: Bad SID. Returning..");
                        res.send(500, "bad login");
                        return next();
                    }
                }
            }
            Log.trace("Error: Bad CSID. Returning..");
            res.send(500, "bad login");
            return next();
        });
    }

    static getDeliverables(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RouteHandler.getDeliverables()\nparams: '+JSON.stringify(req.params));
        //read deliverables.json
        RouteHandler.returnFile("deliverables.json", function (data:any) {
            //return all the deliverables for the current couse
            var deliverables = JSON.parse(data);
            res.json(200, deliverables);
            return next();
        });
    }

    static getGrades(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('getGrades| params: '+JSON.stringify(req.params));
        var sid = req.params.sid;
        var csid = req.params.csid;

        //check sid with regex
        if (sid.match(/^\d{8}$/)){
            //read grades.csv
            RouteHandler.returnFile("grades.csv", function (data:any) {
                var lines = data.toString().split(/\n/);
                Log.trace("getGrades| There are "+(lines.length-1)+" students in grades.csv");
                
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
                    Log.trace("getGrades| Grades acquired. Returning grades: "+myGrades);
                    res.json(200, myGrades);    
                }
                else {
                    Log.trace("getGrades| sid not found. Returning error..");
                    res.json(500, "student not found");
                }
            });
        }
        else {
            Log.trace("getGrades| Bad sid. Returning..")
            res.json(500, "bad sid");
        }
    }

    static getStudent(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RouteHandler.getStudent()\nparams: '+JSON.stringify(req.params));
        //read deliverables.json
        RouteHandler.readStudent("students", req.params.username, function (response:any) {
            //return current student
            Log.trace("getStudent success! returning..");
            res.json(200, response);
            return next();
        });
    }

    static deleteServerToken(req: restify.Request, res: restify.Response, next: restify.Next) {
        var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest")) + "sampleData/tokens.json";
        var file = require(filename);
        var username = req.params.username;
        Log.trace("Deleting servertoken for user: "+username);
        
        //overwrite or create
        file[username] = "";
        
        //step 3: write to file
        fs.writeFile(filename, JSON.stringify(file, null, 2), function (err: any) {
            if (err) {
                Log.trace("Write unsuccessful: "+err.toString());
                res.send(500, "bad logout")
                return next();
            }
            else {
                Log.trace("Write successful!");
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
        
        Log.trace("Requesting public info from Github..");
        request(options, callback);
    }

    static createBlankStudent(username: string, githubtoken: string, callback: any) {
        Log.trace("Creating new student: "+username);
        
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
                Log.trace("writeFile error: "+err.toString());
                return;
            }
            else {
                Log.trace("New student created.");
                callback();
            }
        });
    }
    
    //update keys in object in username file
    //more like: update student   
    static writeStudent(username: string, paramsObject: any, callback: any) {
        var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest"))+"sampleData/students.json";
        var file = require(filename);
        Log.trace("Writing to user: "+username+" in students.json..");

        //step 1: check if username exists
        if (!!file.students[username]) {
            //step 2: update student object
            //TODO: do i need to worry about mapping to a new object instead of modifying the original object?
            var i = 0;
            for (var key in paramsObject) {
                if (file.students[username].hasOwnProperty(key)) {
                    Log.trace('Writing to '+key+': '+paramsObject[key]);
                    file.students[username][key] = paramsObject[key];
                    i++;
                }
            }
            Log.trace('Mapped '+i+' key(s).');

            //step 3: write to file
            fs.writeFile(filename, JSON.stringify(file, null, 2), function (err: any) {
                if (err) {
                    Log.trace("Write unsuccessful: "+err.toString());
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

    static readStudent(accessType: string, username: string, callback: any) {
        Log.trace("Accessing students.json");
        
        var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest"))+"sampleData/students.json";
        fs.readFile(filename, function read(err: any, data: any) {
            if (err) {
                Log.trace("Error reading file: "+err.toString());
                return;
            }
            else {
                var file = JSON.parse(data);
                Log.trace("Checking for user "+username);
                
                if (!!file[accessType][username]) {
                    Log.trace("Successfully accessed "+username+".");
                    callback(file[accessType][username]);
                    return;
                }
                else {
                    Log.trace("Username not found.");
                    callback(null);
                    return;
                }
            }
        });
    }

    static returnFile(file: string, callback: any) {
        var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest"))+"sampleData/"+file;
        Log.trace("returnFile| Accessing file "+file);

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
        //generate unique string
        var servertoken: string = Math.random().toString(36).slice(2);

        //access file
        var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest"))+"sampleData/tokens.json";
        var file = require(filename);
        Log.trace("Generating new servertoken");
        
        //overwrite or create
        file[username] = servertoken;
        
        //step 3: write to file
        fs.writeFile(filename, JSON.stringify(file, null, 2), function (err: any) {
            if (err) {
                Log.trace("Write unsuccessful: "+err.toString());
                return;
            }
            else {
                Log.trace("Write successful! Executing callback..");
                callback(servertoken);
                return;
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