/**
 * Created by rtholmes on 2016-06-19.
 */

import request = require('request');
import Log from '../Util';
import fs = require('fs');
import Helper from '../rest/Helper';
var _ = require('lodash');

const pathToRoot = __dirname.substring(0, __dirname.lastIndexOf('classportalserver/')) + 'classportalserver/';
var config = require(pathToRoot + 'config.json');

export default class LoginController {

    /*
        -request an access token from github.
        -use token to get user info from github.
        -check if username exists in database
        -if yes, update the user's githubtoken and redirect app to the homepage.
    */
    static login(authcode:string, callback:any) {
        
        //this callback is executed after a successful request to Github for access token.
        function githubResponse(err1: any, res1: any, body1: any) {
            if (!err1 && res1.statusCode == 200) {
                var githubtoken = body1.access_token;
                Log.trace("LoginController::login| Successfully acquired github token.");
                
                //next, request github username using githubtoken.
                LoginController.requestGithubInfo(githubtoken, function (err2: any, res2: any, body2: any) {
                    if (!err2 && res2.statusCode == 200) {
                        var obj = JSON.parse(body2);
                        var username = obj.login;
                        Log.trace("LoginController::login| Successfully acquired username: " + username);

                        //check if username matches list of admin usernames.
                        Helper.isAdmin(username, function (isAdmin: boolean) {
                            
                            //create servertoken for user
                            LoginController.createServerToken(username, isAdmin, function (servertoken: string) {
                                
                                //request student info from database by providing github username.
                                Helper.returnFile(isAdmin ? "admins.json" : "students.json", function (error: any, data: any) {
                                    if (!error && data.length > 0){
                                        var file = JSON.parse(data);
                                        var userObject = _.find(file, { 'github_name': username });
                                        
                                        //todo: what other checks should go here? sid/csid?
                                        if (!error && !!userObject) {
                                            
                                            //write githubtoken
                                            Helper.updateUser(isAdmin?"admins.json":"students.json", username, { "github_token": githubtoken }, function () {
                                                Log.trace("LoginController::login| Updated user's githubtoken. Sending user to portal..");
                                                var response = { "redirect": isAdmin ? "/admin" : "/", "user": username, "token": servertoken };
                                                callback(null, response);
                                                return;
                                            });
                                        }
                                        else {
                                            //error: student not found in file
                                            Log.trace("LoginController::login| Error: User not found!");
                                            callback("error", null);
                                            return;
                                        }
                                    }
                                    else {
                                        //error: file could not be read
                                        Log.trace("LoginController::login| Error: User not found!");
                                        callback("error", null);
                                        return;
                                    }
                                });
                            });
                        });
                    }
                    else {
                        Log.trace("LoginController::login| Error accessing public info from Github.");
                        callback("error connecting to github", null);
                        return;
                    }
                });
            }
            else {
                Log.trace("LoginController::login| Error requesting access token ");
                callback("error", null);
                return;
            }
        }
        
        //build the request options object
        var options = {
            method: 'post',
            body: {
                client_id: config.client_id,
                client_secret: config.client_secret,
                code: authcode
            },
            json: true,
            url: 'https://github.com/login/oauth/access_token'
        };
        
        Log.trace("LoginController::login| Requesting access token from Github..");
        request(options, githubResponse);
    }

    static requestGithubInfo(githubtoken: string, callback: any) {
        var options = {
            url: 'https://api.github.com/user',
            headers: {
                "User-Agent": "ClasslistPortal-Student",
                "Authorization": "token " + githubtoken
            }
        };
        
        Log.trace("requestGithubInfo| Requesting public info from Github..");
        request(options, callback);
    }

    static createBlankStudent(username: string, githubtoken: string, callback: any) {
        Log.trace("createBlankStudent| Creating new student: " + username);
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
                Log.trace("createBlankStudent| Write error: " + err.toString());
                return;
            }
            else {
                Log.trace("createBlankStudent| New student created.");
                callback();
            }
        });
    }

    static createServerToken(username: string, admin: boolean, callback: any) {
        Log.trace("createServerToken| Generating new servertoken for user " + username);
        
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
                Log.trace("createServerToken| Write unsuccessful: " + err.toString());
                return;
            }
            else {
                Log.trace("createServerToken| Write successful! Executing callback..");
                callback(servertoken);
                return;
            }
        });
    }

}