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
    
    static authenticateGithub(req: restify.Request, res: restify.Response, next: restify.Next) {
        
        function getAccessToken(respon: any, authcode: string, opt: any, callback: any) {
            var postData = {
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

            function requestCallback (err:any, res:any, body:any) {
                if (!err && res.statusCode == 200) { 
                    //write access token to file
                    fs.writeFile(__dirname + '/accessTokens.txt', body.access_token, function (err) {
                        if (err) {
                            Log.trace(err.toString());
                            return;
                        }
                        //if successful, execute callback to redirect user  
                        else {
                            Log.trace('Request successful!\nAccess token is ' + body.access_token + '.\nWritten to file ' + __dirname + '/accessTokens.txt.');
                            callback(respon,opt,body.access_token);
                        }
                    });
                }
                else {
                    Log.trace("Error: " + err.toString());
                    return;
                }
            }
            
            //send GET request to Github with client id, secret, and authcode.
            //Github responds with an access token if successful.
            request(options, requestCallback);
        }

        function redirectResponse(resp:any, redirect:any, access:string){
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

        Log.trace('RoutHandler::githubCallback(..) - params: ' + JSON.stringify(req.params));
        
        //start by requesting access token from Github. If successful, redirect user to appropriate page.
        getAccessToken(res, req.params.authCode, 1, redirectResponse);
        
        return next();
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
        
        function getAccessToken(callback: any) {
            Log.trace("getting AccessToken from file...");
            fs.readFile(__dirname+'/accessTokens.txt', function read(err, data) {
                if (err) {
                    Log.trace("ERROR READING FILE");
                    Log.trace(err.toString());
                }
                else {
                    Log.trace("accessToken is: " + data.toString());
                    callback(data.toString(), returnResponse);
                }    
            })
        }
        
        function requestUserInfo(accessToken: string, callback:any) {
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
                    callback(obj.login);
                }
                else {
                    Log.trace("Error: " + err);
                    Log.trace("Res: " + res);
                    Log.trace("Body: " + body);
                }
            });
        }

        function returnResponse(username:string){
            Log.trace("returning username: " + username);
            res.send(200, username);
        }

        Log.trace('RoutHandler::getStudentFromGithub(..) - params: ' + JSON.stringify(req.params));        
        
        //start by retrieving accesstoken. if success, send GET request to Github.
        //if success, Github responds with user info, which we send back to frontend.
        getAccessToken(requestUserInfo);
        return next();
    }

    static updateNewStudent(req:restify.Request, res:restify.Response, next:restify.Next) {
        Log.trace('RoutHandler::getStudentFromGithub(..) - params: ' + JSON.stringify(req.params));        
        
        //TODO: associate new info with access token.
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

