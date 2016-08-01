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

    /*
        - request an access token from Github
        - use token get username from github.
        - check students.json if username already exists.
        - if yes, update the user's accesstoken(?) and redirect to student portal
        - if no, redirect to register page
     */
    static authenticateGithub(req: restify.Request, res1: restify.Response, next: restify.Next) {
        Log.trace('RoutHandler::authenticateGithub(..) - params: ' + JSON.stringify(req.params));

        var postData = {
            client_id: config2.client_id,
            client_secret: config2.client_secret,
            code: req.params.authCode
        };
        
        var options = {
            method: 'post',
            body: postData,
            json: true,
            url: 'https://github.com/login/oauth/access_token',
            headers: {}
        };
    
        //TODO: find a more elegant way to reference body0?
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
                
                //TODO: decide whether to use createBlankStudent or updateStudent
                //for a new user, and implement the correct logic to do so. 
                request(options, function (err: any, res: any, body: any) {
                    if (!err && res.statusCode == 200) {
                        Log.trace("getUserFromGithub-success");
                        var obj = JSON.parse(body);
                        Log.trace("parse: " + obj);
                        RouteHandler.checkFileForUser(obj.login, function (success:number) {
                            if (success==1) {
                                Log.trace("success. Sending user to update page after updating accesstoken");
                                RouteHandler.updateStudent(obj.login, { "accesstoken": body0.access_token }, function () {
                                    Log.trace("Updated Accesstoken!");
                                    RouteHandler.createServerToken(obj.login, function (token: any) {
                                        //send user to update page, while providing servertoken
                                        res1.json(200, "/update~" + obj.login + "~" + token);
                                    })                                    
                                });
                            } else if (success == 2) {
                                Log.trace("success. Sending user to portal after updating accesstoken");
                                //update accesstoken
                                RouteHandler.updateStudent(obj.login, { "accesstoken": body0.access_token }, function () {
                                    Log.trace("Updated Accesstoken!");
                                    RouteHandler.createServerToken(obj.login, function (token: any) {
                                        //send user to portal, while providing servertoken
                                        res1.json(200, "/portal~" + obj.login + "~" + token);
                                    })
                                });
                            } else {
                                //no user, so create blank user with user+token
                                Log.trace("success. Creating new student, then sending to update page");
                                RouteHandler.createBlankStudent(obj.login, body0.access_token, function () {
                                    //after creating blank student, create server token and add to database.
                                    RouteHandler.createServerToken(obj.login, function (token: any) {
                                        //send user to registration to fill in more info, while providing servertoken
                                        res1.json(200, "/update~" + obj.login + "~"+token);
                                    })
                                });
                            }
                        });
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

    //checks students.json for matching username. Executes callback after success.    
    static checkFileForUser(username: string, callback:any) {
        Log.trace('RoutHandler::checkFileForUser()');
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
                        //SUCCESS
                        //check for missing info
                        if (!!file.students[i].sid && 
                            !!file.students[i].csid && 
                            !!file.students[i].email && 
                            !!file.students[i].lastname && 
                            !!file.students[i].firstname ) {
                            Log.trace(file.students[i].github + " is already registered. Redirecting to portal.");
                            callback(2);
                            return;
                        } else {
                            Log.trace(file.students[i].github + " is already registered, but needs to be updated. Redirecting to registration page.");
                            callback(1);
                            return;
                        }
                    }
                }
                //FAIL- send directly to register page with WHAT? Username or AccessToken, or both????
                Log.trace("user not found. sending to registration page. (this SHOULDNT execute if student is found in FILE!)");
                callback(0);
                return;
            }
        })
    }

    //NEEDS FIXING    
    static getUserInfo(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RoutHandler::getUserInfo(..) - params: ' + JSON.stringify(req.params));
        
        var fileName = __dirname.substring(0, __dirname.lastIndexOf("src/rest")) + "sampleData/students.json";
        fs.readFile(fileName, onSuccess);
        return next();

        function onSuccess(err: any, data: any) {
            if (err) {
                Log.trace("Error reading file: " + err.toString());
            }
            else {
                var file = JSON.parse(data);
                Log.trace("File: "+ file + " parsed successfully");
                
                for (var index = 0; index < file.students.length; index++){
                    if (file.students[index].github == req.params.id){
                        Log.trace("name found.");
                        res.json(200, file.students[index]);
                        return;
                    }
                }
                //FAIL
                Log.trace("name not found. FAIL");
                return;
            }
        }
    }

    static updateUserInfo(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RoutHandler::writeInfoToFile(..) - params: ' + JSON.stringify(req.params));

        function findAndReplace(object: any, userName:string){//keyvalue: string, name: string) {            
            Log.trace('findAndReplace()');
            object.map(function (obj: any) {
                if (obj.github == userName) {
                    obj.sid = req.params.sid;
                    obj.csid = req.params.csid;
                    obj.firstname = req.params.firstname;
                    obj.lastname = req.params.lastname;
                    obj.email = req.params.email;
                    Log.trace('mapped new!');
                }
            })
        }

        var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest")) + "sampleData/students.json";
        var file = require(filename);
        findAndReplace(file.students, req.params.id);

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
    
    static createBlankStudent(githubUser: string, accessToken: string, callback:any) {
        Log.trace('RoutHandler::createBlankStudent()');

        //todo: deal with index variable!         
        var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest")) + "sampleData/students.json";
        var file = require(filename);
        var newObj = {
            "sid": '',
            "csid": '',
            "firstname": '',
            "lastname": '',
            "email": '',
            "github": githubUser,
            "accesstoken": accessToken,
            "servertokens": '',
            "grades": {
                "courses": '',
                "assn1": '',
                "assn2": '',
                "assn3": '',
                "midterm": '',
                "final": '',
                "total": ''
            }
        };

        file.students.push(newObj);
        
        //write to file
        fs.writeFile(filename, JSON.stringify(file, null, 2), function (err:any) {
            if (err) {
                Log.trace("New student error: " + err.toString());
            }  
            else {
                Log.trace("New student created!");
                callback();
            }
        });
        
        return;
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

    //update keys in object in username file    
    static updateStudent(username:string, paramsObject:any, callback:any) {
        Log.trace("username: " + username + ", paramsObject: " + JSON.stringify(paramsObject));
        var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest")) + "sampleData/students.json";
        var file = require(filename);
        var index:number;
        var i = 0;
        var cont:boolean = false;

        //step 1: check if username exists
        for (index = 0; index < file.students.length; index++){
            if (file.students[index].github == username) {
                Log.trace("User found!");
                cont = true;
            }
        }

        //only continue if user was found.
        if (cont) {
            
            //step 2: update student object
            //TODO: do i need to worry about mapping to a new object instead of
            //modifying the original object?
            for (var key in paramsObject) {
                Log.trace('key: '+ key +', '+ 'value: '+ paramsObject[key] +', '+ 'current value: '+ JSON.stringify(file.students[0][key]));
                if(file.students[0].hasOwnProperty(key)) {
                    file.students[0][key] = paramsObject[key];
                    i++;
                }
            }
            Log.trace('Mapped ' + i + ' key(s) in ' + username + '\'s file.');

            //step 3: write to file
            fs.writeFile(filename, JSON.stringify(file, null, 2), function (err:any) {
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
        }
    }

    static deleteStudent(req: restify.Request, res: restify.Response, next: restify.Next) {
        return next();
    }

    static createServerToken(username:string, callback:any) {
        //generate unique string
        var servertoken: string = Math.random().toString(36).slice(2);

        //add servertoken to database
        RouteHandler.updateStudent(username, { "servertokens": servertoken }, function () {
            Log.trace("servertoken: " + servertoken + " given to " + username);
            
            //do something with the servertoken
            callback(servertoken);
        })
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
            Log.trace('RouteHandler::putSay(..) - ERROR: ' + err.message);
            res.send(404);
        }

        return next();
    }
}