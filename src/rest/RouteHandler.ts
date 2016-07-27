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

    static getEcho(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RoutHandler::getEcho(..) - params: ' + JSON.stringify(req.params));

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

    static getStudents(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RoutHandler::getStudents(..) - params: ' + JSON.stringify(req.params));

        // TODO: make sure authorized?

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

    /* description:
        request an access token from Github
        get username from github.
        check students.json if username already exists.
        if yes, update the user's accesstoken(?) and redirect to student portal
        if no, redirect to register page
     */
    static authenticateGithub(req: restify.Request, res1: restify.Response, next: restify.Next) {
        Log.trace('RoutHandler::authenticateGithub(..) - params: ' + JSON.stringify(req.params));
        
        var postData = {
            //TODO: do not post these here
            client_id: "97ae59518a9d5cae2550",
            client_secret: "92b13f20a11919e1b223c16b049283da82dc3638",
            code: req.params.authCode
        };
        
        var options = {
            method: 'post',
            body: postData,
            json: true,
            url: 'https://github.com/login/oauth/access_token',
            headers: {}
        };
    
        //todo: right now, the success and fail implementations are baked-in to the function.
        function checkFileForUser(username: string, accessToken: any) {
            var fileName = __dirname.substring(0, __dirname.lastIndexOf("src/rest")) + "sampleData/students.json";

            fs.readFile(fileName, function read(err: any, data: any) {
                if (err) {
                    Log.trace("Error reading file: " + err.toString());
                }
                else {
                    Log.trace("Searching students.json for username : " + username);
                    var file = JSON.parse(data);
                    Log.trace("File: "+ file + " parsed successfully");
                    
                    for (var i = 0; i < file.students.length; i++) {
                        Log.trace("index = " + i);
                        if (file.students[i].github == username) {
                            //case: SUCCESS
                            Log.trace(file.students[i].github + " is already registered. Redirecting to portal.");
                            //NEED SOME WAY TO LET PORTAL KNOW WHICH STUDENT IS LOGGED IN though.
                            //todo: find a more elegant way to refer to res1
                            //todo: need to update accesstoken on file??? not sure
                            res1.json(200, "/portal~" + username);
                            return;
                        }
                    }
                    //case: FAIL- send directly to register page with WHAT? Username or AccessToken, or both????
                    Log.trace("user not found. sending to registration page. (this SHOULDNT execute if student is found in FILE!)");
                    res1.json(200, "/register~" + accessToken);
                    return;
                }
            })
        }
        
        //todo: clean up use of "body0:"
        function requestCallback (err: any, res: any, body0: any) {

            //todo: un-nest this function
            function getUserFromGithub(accessToken: string) {
                var options = {
                    url: 'https://api.github.com/user',
                    headers: {
                        "User-Agent": "ClassPortal-Student",
                        "Authorization": "token " + accessToken
                    }
                };
                
                request(options, function (err: any, res: any, body: any) {
                    if (!err && res.statusCode == 200) {
                        Log.trace("getUserFromGithub-success");
                        var obj = JSON.parse(body);
                        Log.trace("parse: " + obj);
                        checkFileForUser(obj.login, body0.access_token);
                    }
                    else {
                        Log.trace("getUserFromGithub - Error: " + err +  res + body);
                    }
                });
            }
            
            Log.trace("successfully acquired accesstoken: " + body0.access_token + "..getUserFromGithub() executing...");
            getUserFromGithub(body0.access_token);
        }
        
        request(options, requestCallback);
        return next();        
    }

    static getUserInfo(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RoutHandler::getUserInfo(..) - params: ' + JSON.stringify(req.params));

        function readStudentFile (index: number) {
            var fileName = __dirname.substring(0, __dirname.lastIndexOf("src/rest")) + "sampleData/students.json";

            function readFileSuccess(err: any, data: any) {
                if (err) {
                    Log.trace("Error reading file: " + err.toString());
                }
                else {
                    var file = JSON.parse(data);
                    Log.trace("File: "+ file + " parsed successfully");
                    
                    res.json(200, file.students[index]);   
                }
            }
            
            fs.readFile(fileName, readFileSuccess);
        }

        //todo: need better way to specify index        
        readStudentFile(0);
        return next();
    }

    static updateUserInfo(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RoutHandler::writeInfoToFile(..) - params: ' + JSON.stringify(req.params));

        //todo: deal with index variable!         
        var index = 0;
        var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest")) + "sampleData/students.json";
        var file = require(filename)

        //update the values in the file.
        //todo: use forEach?
        file.students[index].sid = req.params.sid;
        file.students[index].csid = req.params.csid;
        file.students[index].firstname = req.params.firstname;
        file.students[index].lastname = req.params.lastname;
        file.students[index].email = req.params.email;

        //write to file
        fs.writeFile(filename, JSON.stringify(file, null, 2), function (err:any) {
            if (err) {
                Log.trace("Write unsuccessful: " + err.toString());
                return;
            }  
            else {
                Log.trace("Write successful!");

                //redirect user to portal page after successful info update.
                res.json(200, "/portal");
            }
        });
        
        return next();
    }
    
    static getStudentById(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RoutHandler::getStudentById(..) - params: ' + JSON.stringify(req.params));
        
        
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
        Log.trace('RoutHandler::createStudent(..) - params: ' + JSON.stringify(req.params));

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

    static updateStudent(req: restify.Request, res: restify.Response, next: restify.Next) {
       
        return next();
    }

    static deleteStudent(req: restify.Request, res: restify.Response, next: restify.Next) {
       
        return next();
    }

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
            console.log('RouteHandler::putSay(..) - ERROR: ' + err.message);
            res.send(404);
        }

        return next();
    }
}