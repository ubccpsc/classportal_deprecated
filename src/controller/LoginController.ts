/**
 * Created by rtholmes on 2016-06-19.
 */

import request = require('request');
import Log from '../Util';
import {Helper} from '../Util';
import fs = require('fs');

var _ = require('lodash');
var async = require('async');

const pathToRoot = __dirname.substring(0, __dirname.lastIndexOf('classportalserver/')) + 'classportalserver/';
var config = require(pathToRoot + 'config.json');

export default class LoginController {
    
    static login(csid: string, sid: string, authcode: string, callback: any) {
        //save these variables in the outer function, for easy access from any inner function in the waterfall.
        var persistUsername: string;
        var persistAdmin: boolean;
        var persistGithubToken: string;
        
        //login process, executed step-by-step with help of async module.
        async.waterfall([
            function request_access_token(callback: any) {
                Log.trace("LoginController::login| request_access_token..");
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
                
                request(options, function (err: any, res: any, body: any) {
                    if (!err && res.statusCode == 200) {
                        //var github_token: string = body.access_token;
                        persistGithubToken = body.access_token;

                        Log.trace("LoginController::login| Successfully acquired github token.");
                        return callback(null);
                    }
                    else {
                        return callback("error", null);
                    }
                });
            },
            function request_github_name(callback: any) {
                Log.trace("LoginController::login| request_github_name..");
                LoginController.requestGithubInfo(persistGithubToken, function (err: any, res: any, body: any) {
                    if (!err && res.statusCode == 200) {
                        var obj = JSON.parse(body);
                        persistUsername = obj.login;
                        
                        Log.trace("LoginController::login| Successfully acquired username: " + persistUsername);
                        return callback(null)
                    }
                    else {
                        return callback("error", null);
                    }
                });
            },
            function check_if_admin(callback: any) {
                Log.trace("LoginController::login| check_if_admin..");
                Helper.isAdmin(persistUsername, function (error: any, response: boolean) {
                    if (!error) {
                        persistAdmin = response;
                        return callback(null);
                    }
                    else {
                        return callback("error");
                    }
                });
            },
            function check_user_exists_or_create_user(callback: any) {
                Log.trace("LoginController::login| check_user_exists_or_create_user..");
                Helper.readFile(persistAdmin ? "admins.json" : "students.json", function (error: any, data: any) {
                    if (!error) {
                        Log.trace("LoginController::login| Checking for user..");
                        var file = JSON.parse(data);
                        var userIndex: number = _.findIndex(file, { 'username': persistUsername });

                        //user found, continue to write githubtoken
                        if (userIndex >= 0) {
                            Log.trace("LoginController::login| User found!");
                            return callback(null);
                        }
                        //user not found. If valid csid and sid supplied, register student.
                        else {
                            if (persistAdmin) {
                                Log.trace("LoginController::login| Error: Admin not found!");
                                return callback("error");
                            }
                            else {
                                Log.trace("LoginController::login| Student not found. Checking for first-time login..");
                                var newUserIndex = _.findIndex(file, { 'csid': csid, 'sid': sid });
                                if (newUserIndex >= 0) {
                                    Log.trace("LoginController::login| First time login: Updating student file..");
                                    Helper.updateEntry("students.json", { 'csid': csid, 'sid': sid }, { "username": persistUsername }, function (error: any) {
                                        if (!error) {
                                            return callback(null);
                                        }
                                        else {
                                            return callback(null);
                                        }
                                    });
                                }
                                else {
                                    Log.trace("LoginController::login| Error: User not found!");
                                    return callback("error");
                                }
                            }
                        }
                    }
                    else {
                        Log.trace("LoginController::login| Error: User not found!");
                        return callback("error", null);
                    }
                });
            },
            function store_githubtoken(callback: any) {
                Log.trace("LoginController::login| store_github_token..");
                Helper.updateEntry("tokens.json", { 'username': persistUsername }, { "githubtoken": persistGithubToken }, function (error: any) {
                    if (!error) {
                        return callback(null);
                    }
                    else {
                        var newEntry = {
                            "username": persistUsername,
                            "githubtoken": persistGithubToken,
                            "servertoken": ""
                        }

                        Helper.addEntry("tokens.json", newEntry, function (error: any) {
                            if (!error) {
                                return callback(null);
                            }
                            else {
                                return callback("error");
                            }
                        });
                    }
                });
            },
            function generate_and_store_servertoken(callback: any) {
                Log.trace("LoginController::createServerToken| Generating new servertoken for user " + persistUsername);
                
                //generate unique string
                var servertoken: string = Math.random().toString(36).slice(2);

                Helper.updateEntry("tokens.json", { 'username': persistUsername }, { "servertoken": servertoken }, function (error: any) {
                    if (!error) {
                        return callback(null, servertoken);
                    }
                    else {
                        return callback("error", null);
                    }
                });
            }
        ],
            function end_async(error: any, result: any) {
                Log.trace("LoginController::login| end_async");
                if (!error) {
                    var response = {
                        "admin": persistAdmin,
                        "username": persistUsername,
                        "token": result
                    };
                    return callback(null, response);
                }
                else {
                    return callback("error", null);
                }
            }
        );
    }
    
    static logout(username: string, callback: any) {
        Helper.updateEntry("tokens.json", { 'username': username }, { "servertoken": "" }, function (error: any) {
            if (!error) {
                return callback(null, true);
            }
            else {
                return callback(true, null);
            }
        });
    }

    static requestGithubInfo(githubtoken: string, callback: any) {
        var options = {
            url: 'https://api.github.com/user',
            headers: {
                "User-Agent": "ClasslistPortal-Student",
                "Authorization": "token " + githubtoken
            }
        };
        
        Log.trace("LoginController::requestGithubInfo| Requesting public info from Github..");
        request(options, callback);
    }
    
    static checkRegistration(csid: string, sid: string, callback: any) {
        Log.trace("LoginController::checkRegistration| Checking valid regex");
        async.parallel([
            function csidRegexTest(callback: any) {
                var validCsidRegex = /^[a-z][0-9][a-z][0-9]$/;
                var result: boolean = validCsidRegex.test(csid);
                Log.trace("LoginController::checkRegistration| csidRegexTest: " + result.toString());
                return callback(null, result);
            },
            function sidRegexTest(callback: any) {
                var validSidRegex = /^\d{8}$/;
                var result: boolean = validSidRegex.test(sid);
                Log.trace("LoginController::checkRegistration| sidRegexTest: " + result.toString());
                return callback(null, result);
            }
        ],
            function end_async(err: any, result: any) {
                if (!err && result[0] === true && result[1] === true) {
                    Log.trace("LoginController::checkRegistration| Valid regex. Checking for registration status..");
                    Helper.checkEntry("students.json", { 'csid': csid, 'sid': sid }, function (error: any, result: boolean) {
                        if (!error && result === true) {
                            Log.trace("LoginController::checkRegistration| Success: Student is registered!");
                            return callback(true);
                        }
                        else {
                            Log.trace("LoginController::checkRegistration| Error: Student is not registered in the course!");
                            return callback(false);
                        }
                    });
                }
                else {
                    Log.trace("LoginController::checkRegistration| Invalid id regex.");
                    return callback(false);
                }
            }
        );
    }
}