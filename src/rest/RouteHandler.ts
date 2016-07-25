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

    static getEcho(req:restify.Request, res:restify.Response, next:restify.Next) {
        Log.trace('RoutHandler::getEcho(..) - params: ' + JSON.stringify(req.params));

        if (typeof req.params.message !== 'undefined' && req.params.message.length > 0) {
            let val = req.params.message;
            let ret = EchoController.echo(val);
            res.json(200, {msg: ret});
        } else {
            res.json(400, {error: 'No message provided'});
            //res.send(403);
        }

        return next();
    }

    static getStudents(req:restify.Request, res:restify.Response, next:restify.Next) {
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

    static saveStore(store: MemoryStore): void{
        store.persist();
    }
    
    static authenticateGithub(req: restify.Request, res1: restify.Response, next: restify.Next) {
        Log.trace('RoutHandler::githubCallback(..) - params: ' + JSON.stringify(req.params));
        
        //start by requesting access token from Github. If successful, redirect user to appropriate page.
        getAccessToken(req.params.authCode);

        Log.trace('RoutHandler::githubCallback(..) complete!');
        return next();

        function getAccessToken(authcode: string) {
            var postData = {
                //TODO: THESE SHOULD NOT BE SAVED TO BITBUCKET!
                client_id: "97ae59518a9d5cae2550",
                client_secret: "92b13f20a11919e1b223c16b049283da82dc3638",
                code: authcode
            };
            
            var options = {
                method: 'post',
                body: postData,
                json: true,
                url: 'https://github.com/login/oauth/access_token',
                headers: {}
            };

            request(options, function (err: any, res: any, body0: any) {                
                //1) Using AccessToken, get username from github.
                //2) check students.json if username already exists.
                    //if yes, update the user's accesstoken(?) and redirect to student portal 
                    //if no, redirect to register page
                
                Log.trace("1-getUserFromGithub() executing...");
                getUserFromGithub(body0.access_token, function (err: any, res: any, body: any) {
                    if (!err && res.statusCode == 200) {
                        var obj = JSON.parse(body);
                        Log.trace("4-checkFileForUser() executing...");

                        //todo: figure out a more elegant solution to reference "body0"
                        checkFileForUser(obj.login, body0.access_token);
                    }
                    else {
                        Log.trace("Error: " + err);
                        Log.trace("Res: " + res);
                        Log.trace("Body: " + body);
                    }
                });

                function getUserFromGithub(accessToken: string, callback: any) {
                    //"Accept": "application / vnd.github.v3 + json",
                    var options = {
                        url: 'https://api.github.com/user',
                        headers: {
                            "User-Agent": "ClassPortal-Student",
                            "Authorization": "token " + accessToken
                        }
                    };
                    Log.trace("2-request() executing...");
                    request(options, function (err:any, res:any, body:any) {
                        if (!err && res.statusCode == 200) {
                            Log.trace("3-callback() executing...");
                            callback(err, res, body);
                        }
                        else {
                            Log.trace("Error: " + err);
                            Log.trace("Res: " + res);
                            Log.trace("Body: " + body);
                        }
                    });
                }

                function checkFileForUser(username:string, accessToken:any) {
                    fs.readFile(__dirname.substring(0, __dirname.lastIndexOf("src/rest")) + "sampleData/students.json", function read(err:any, data:any) {
                        if (err) {
                            Log.trace("ERROR READING FILE");
                            Log.trace(err.toString());
                        }
                        else {
                            Log.trace("looking for: " + username + " in students.json");
                            var file = JSON.parse(data);
                            Log.trace("file successfully parsed: "+ file);
                            
                            for (var i = 0; i < file.students.length; i++) {
                                Log.trace("index = " + i);
                                if(file.students[i].github == username) {
                                    //SUCCESS
                                    Log.trace(file.students[i].github+ " is already registered. Redirecting to portal.");
                                    //NEED SOME WAY TO LET PORTAL KNOW WHICH STUDENT IS LOGGED IN though.
                                    //ALSO, find a more elegant way to refer to res1?
                                    //ALSO need to update accesstoken on file??? not sure
                                    res1.json(200, "/portal~"+username);
                                    return;
                                }
                            }
                            //UNSUCCESSFUL: send directly to register page with WHAT? Username or AccessToken, or both????
                            Log.trace("user not found. sending to registration page. (this SHOULDNT execute if student is found in FILE!)");
                            res1.json(200, "/register~"+accessToken);
                            return;
                        }
                    })
                }
            });
        }
    }
    
    static getStudentById(req:restify.Request, res:restify.Response, next:restify.Next) {
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

    static getInfoFromGithub(req:restify.Request, res:restify.Response, next:restify.Next) {
        
        function getAccessToken2(callback: any) {
            Log.trace("getting AccessToken from file: " + __dirname.substring(0, __dirname.lastIndexOf("src/rest")) + "sampleData/students.json");
            fs.readFile(__dirname.substring(0, __dirname.lastIndexOf("src/rest")) + "sampleData/students.json", function read(err:any, data:any) {
                if (err) {
                    Log.trace("ERROR READING FILE");
                    Log.trace(err.toString());
                }
                else { 
                    Log.trace("accessToken is: " + JSON.parse(data).students[0].accesstoken);
                    callback(JSON.parse(data).students[0].accesstoken);
                }
            })
        }
        
        function requestUserInfo(accessToken: string) {
            //"Accept": "application / vnd.github.v3 + json",
            var options = {
                url: 'https://api.github.com/user',
                headers: {
                    "User-Agent": "ClassPortal-Student",
                    "Authorization": "token " + accessToken
                }
            };

            Log.trace("getRequest executing...");
            request(options, function (err:any, res:any, body:any) {
                if (!err && res.statusCode == 200) {
                    var obj = JSON.parse(body);
                    Log.trace("Success! Obj: " + obj);
                    Log.trace("returning username: " + obj.login);
                    res.send(200, obj.login);
                }
                else {
                    Log.trace("Error: " + err);
                    Log.trace("Res: " + res);
                    Log.trace("Body: " + body);
                }
            });
        }

        Log.trace('RoutHandler::getStudentFromGithub(..) - params: ' + JSON.stringify(req.params));        
        
        //start by retrieving accesstoken. if success, send GET request to Github.
        //if success, Github responds with user info, which we send back to frontend.
        getAccessToken2(requestUserInfo);
        return next();
    }

    static updateNewStudent(req:restify.Request, res:restify.Response, next:restify.Next) {
        Log.trace('RoutHandler::getStudentFromGithub(..) - params: ' + JSON.stringify(req.params));        
        
        //TODO: associate new info with access token.
        //first, find the correct student to update.
        //next, add the info to his file.
/*
        function read(callback: any) {
            Log.trace("getting AccessToken from file: " + __dirname.substring(0, __dirname.lastIndexOf("src/rest")) + "sampleData/students.json");
            fs.readFile(__dirname.substring(0, __dirname.lastIndexOf("rest"))+'students.json', function read(err:any, data:any) {
                if (err) {
                    Log.trace("ERROR READING FILE");
                    Log.trace(err.toString());
                }
                else { 
                    Log.trace("accessToken is: " + JSON.parse(data).students[0].accesstoken);
                    callback(JSON.parse(data).students[0].accesstoken);
                }    
            })
        }

        function updateFile() {
            
        }

        function write (err:any, res:any, body:any) {
            Log.trace("filename: " + filename);
            var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest")) + "sampleData/students.json";
            Log.trace("filename: " + filename);
            
            Log.trace("file: " + file);
            var file = require(filename)
            Log.trace("file: " + file);

            if (!err && res.statusCode == 200) { 
                //update value
                file.students[0].accesstoken = body.access_token;

                //write access token to file
                fs.writeFile(filename, JSON.stringify(file, null, 2), function (err:any) {
                    if (err) {
                        Log.trace(err.toString());
                        return;
                    }
                    //if successful, execute callback to redirect user  
                    else {
                        Log.trace('Request successful!\nAccess token is ' + body.access_token + '.\nWritten to file ' + filename+ 'students.json');
                        callback(respon,opt,body.access_token);
                    }
                });
            }
            else {
                Log.trace("Error: " + err.toString());
                return;
            }
        }

*/

        return next();
    }
        
    static createStudent(req:restify.Request, res:restify.Response, next:restify.Next) {
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

    static updateStudent(req:restify.Request, res:restify.Response, next:restify.Next) {
       
        return next();
    }

    static deleteStudent(req:restify.Request, res:restify.Response, next:restify.Next) {
       
        return next();
    }

    static putSay(req:restify.Request, res:restify.Response, next:restify.Next) {
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


                /*
                var filename = __dirname.substring(0, __dirname.lastIndexOf("src/rest")) + "sampleData/students.json";
                var file = require(filename)
                Log.trace("filename: " + filename);
                Log.trace("file: " + file);

                if (!err && res.statusCode == 200) { 
                    //first, check if student is already registered.
                    //do this by getting github username, then checking students.json for that github username
                    //if success, go to portal.
                    
                    //if not, write to file? go to register page? how to let register page know which access token?
                    getUserFromGithub(body.access_token, function (err: any, res: any, body: any) {
                        if (!err && res.statusCode == 200) {
                            Log.trace("33333 executing...");
                            var obj = JSON.parse(body);
                            checkFileForUser(obj.login, function () {
                                Log.trace("44444 executing...");
                            });
                        }
                        else {
                            Log.trace("Error: " + err);
                            Log.trace("Res: " + res);
                            Log.trace("Body: " + body);
                        }
                    });
                    
                    /* NOT SURE IF STILL NECESSARY????
                    //update value
                    file.students[0].accesstoken = body.access_token;

                    //write access token to file
                    fs.writeFile(filename, JSON.stringify(file, null, 2), function (err:any) {
                        if (err) {
                            Log.trace(err.toString());
                            return;
                        }
                        //if successful, execute callback to redirect user  
                        else {
                            Log.trace('Request successful!\nAccess token is ' + body.access_token + '.\nWritten to file ' + filename);
                            callback(respon,opt,body.access_token);
                        }
                    });
                    /*
                }
                else {
                    Log.trace("Error: " + err.toString());
                    return;
                }*/












                        //NEEDED??
/*        function redirectResponse(resp:any, redirect:any, access:string){
            //check against existing tokens to decide where to redirect user
            if (redirect == 1){
                resp.json(200, "/firstlogin");
                Log.trace("First Time Login!");
            } else if (redirect == 2){
                resp.json(200, "admin");
                Log.trace("Admin Login!");
            } else if (redirect == 3){
                resp.json(200, "student");
                Log.trace("Student Login!");
            } else {
                resp.json(500, "There was an error authenticating the user!");
                Log.trace("Authentication error.");
            }
        }

*/