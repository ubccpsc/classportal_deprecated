/**
 * Created by rtholmes on 2016-06-19.
 */

import request = require('request');
import _ = require('lodash');
import async = require('async');
import Log from '../Util';
import {Helper} from '../Util';

const pathToRoot = __dirname.substring(0, __dirname.lastIndexOf('classportalserver/')) + 'classportalserver/';
var config = require(pathToRoot + 'config.json');

export default class LoginController {

    static login(csid: string, sid: string, authcode: string, parentCallback: any) {
        // save these variables in the outer function, for easy access from any inner function in the waterfall.
        var persistUsername: string;
        var persistAdmin: boolean;
        var persistGithubToken: string;

        // login process, executed step-by-step with help of async module.
        async.waterfall([
            function request_access_token(callback: any) {
                Log.trace("LoginController::login| request_access_token");
                var options = {
                    url: 'https://github.com/login/oauth/access_token',
                    method: 'post',
                    body: {
                        client_id: config.client_id,
                        client_secret: config.client_secret,
                        code: authcode
                    },
                    json: true
                };

                request(options, function (err: any, res: any, body: any) {
                    if (!err && res.statusCode == 200) {
                        persistGithubToken = body.access_token;
                        Log.trace("LoginController::login| request_access_token: success");
                        return callback(null);
                    }
                    else {
                        Log.trace("LoginController::login| request_access_token: error");
                        return callback("error");
                    }
                });
            },
            function request_github_name(callback: any) {
                Log.trace("LoginController::login| request_github_name");
                var options = {
                    url: 'https://api.github.com/user',
                    headers: {
                        "User-Agent": "ClasslistPortal-Student",
                        "Authorization": "token " + persistGithubToken
                    },
                    json: true
                };

                request(options, function (err: any, res: any, body: any) {
                    if (!err && res.statusCode == 200) {
                        persistUsername = body.login;
                        Log.trace("LoginController::login| request_github_name: success (value:" + persistUsername + ")");
                        return callback(null);
                    }
                    else {
                        Log.trace("LoginController::login| request_github_name: error");
                        return callback("error", null);
                    }
                });
            },
            function check_if_admin(callback: any) {
                Log.trace("LoginController::login| check_if_admin");
                Helper.isAdmin(persistUsername, function (error: any, response: boolean) {
                    if (!error) {
                        persistAdmin = response;
                        Log.trace("LoginController::login| check_if_admin: success (value:" + persistAdmin + ")");
                        return callback(null);
                    }
                    else {
                        Log.trace("LoginController::login| check_if_admin: error");
                        return callback("error");
                    }
                });
            },
            function check_user_exists_or_create_user(callback: any) {
                Log.trace("LoginController::login| check_user_exists_or_create_user");
                Helper.readFile(persistAdmin ? "admins.json" : "students.json", function (error: any, data: any) {
                    if (!error) {
                        Log.trace("LoginController::login| Checking for user");
                        var file = JSON.parse(data);
                        var userIndex: number = _.findIndex(file, { 'username': persistUsername });

                        // user found, continue to write githubtoken
                        if (userIndex >= 0) {
                            Log.trace("LoginController::login| check_user_exists: success");
                            return callback(null);
                        }
                        // user not found. If valid csid and sid supplied, register student.
                        else {
                            if (persistAdmin) {
                                Log.trace("LoginController::login| check_user_exists: error");
                                return callback("error");
                            }
                            else {
                                Log.trace("LoginController::login| Student not found. Checking for first-time login");
                                var newUserIndex = _.findIndex(file, { 'csid': csid, 'sid': sid });
                                if (newUserIndex >= 0) {
                                    Log.trace("LoginController::login| First time login! Updating student file");
                                    Helper.updateEntry("students.json", { 'csid': csid, 'sid': sid }, { "username": persistUsername }, function (error: any) {
                                        if (!error) {
                                            Log.trace("LoginController::login| create_user: success");

                                            // next, update_grades_entry
                                            Helper.updateEntry("grades.json", { 'sid': sid }, { "username": persistUsername }, function (error: any) {
                                                if (!error) {
                                                    Log.trace("LoginController::login| update_grades_entry: success");
                                                    return callback(null);
                                                }
                                                else {
                                                    Log.trace("LoginController::login| update_grades_entry: error");
                                                    return callback(null);
                                                }
                                            });
                                        }
                                        else {
                                            Log.trace("LoginController::login| create_user: error");
                                            return callback("error");
                                        }
                                    });
                                }
                                else {
                                    Log.trace("LoginController::login| check_user_exists: error");
                                    return callback("error");
                                }
                            }
                        }
                    }
                    else {
                        Log.trace("LoginController::login| check_user_exists: error");
                        return callback("error", null);
                    }
                });
            },
            function store_githubtoken(callback: any) {
                Log.trace("LoginController::login| store_github_token");
                Helper.updateEntry("tokens.json", { 'username': persistUsername }, { "githubtoken": persistGithubToken }, function (error: any) {
                    if (!error) {
                        Log.trace("LoginController::login| store_githubtoken: success");
                        return callback(null);
                    }
                    else {
                        var newEntry = {
                            "username": persistUsername,
                            "githubtoken": persistGithubToken,
                            "servertoken": ""
                        };

                        Helper.addEntry("tokens.json", newEntry, function (error: any) {
                            if (!error) {
                                Log.trace("LoginController::login| store_githubtoken: success");
                                return callback(null);
                            }
                            else {
                                Log.trace("LoginController::login| store_githubtoken: error");
                                return callback("error");
                            }
                        });
                    }
                });
            },
            function generate_and_store_servertoken(callback: any) {
                Log.trace("LoginController::createServerToken| Generating new servertoken for user " + persistUsername);

                // generate unique string
                var servertoken: string = Math.random().toString(36).slice(2);

                Helper.updateEntry("tokens.json", { 'username': persistUsername }, { "servertoken": servertoken }, function (error: any) {
                    if (!error) {
                        Log.trace("LoginController::login| generate_and_store_servertoken: success");
                        return callback(null, servertoken);
                    }
                    else {
                        Log.trace("LoginController::login| generate_and_store_servertoken: error");
                        return callback("error", null);
                    }
                });
            }
        ],
            function end_async(error: any, result: any) {
                if (!error) {
                    var response = {
                        "admin": persistAdmin,
                        "username": persistUsername,
                        "token": result
                    };
                    Log.trace("LoginController::login| end_async: success! Response: " + response);
                    return parentCallback(null, response);
                }
                else {
                    Log.trace("LoginController::login| end_async: error!");
                    return parentCallback("error", null);
                }
            }
        );
    }

    static logout(username: string, callback: any) {
        Helper.updateEntry("tokens.json", { 'username': username }, { "servertoken": "" }, function (error: any) {
            if (!error) {
                Log.trace("LoginController::logout| Success");
                return callback(null, true);
            }
            else {
                Log.trace("LoginController::logout| Error");
                return callback(true, null);
            }
        });
    }

    static checkRegistration(csid: string, sid: string, parentCallback: any) {
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
                    Log.trace("LoginController::checkRegistration| Valid regex. Checking for registration status");
                    Helper.checkEntry("students.json", { 'csid': csid, 'sid': sid }, function (error: any, response: any) {
                        if (!error) {
                            // only allow registration if student is not already registered.
                            if (!response.username) {
                                Log.trace("LoginController::checkRegistration| Valid student. Continue to registration");
                                return parentCallback(null, true);
                            }
                            else {
                                Log.trace("LoginController::checkRegistration| Error: Student is already registered!");
                                return parentCallback("Student is already registered.", null);
                            }
                        }
                        else {
                            Log.trace("LoginController::checkRegistration| Error: Student is not registered.");
                            return parentCallback("Invalid csid or sid.", null);
                        }
                    });
                }
                else {
                    Log.trace("LoginController::checkRegistration| Invalid id regex.");
                    return parentCallback("Invalid csid or sid.", null);
                }
            }
        );
    }

    /**
     * Retrieve files needed by student portal:
     * - students.json (only own entry)
     * - teams.json (only own entry)
     * - grades.json (only own entry)
     * - deliverables.json
     * - classlist (array of all student names for team creation form)
     *
     * Note: For the async functions, we purposely return 'callback(null)' instead of 'callback(true)'
     * on error branches. This allows us to send the successfully retrieved files even if some files
     * can't be retrieved.
     *
     * @param username
     * @returns object containing files
     */
    static loadStudentPortal(username: string, parentCallback: any) {
        Log.trace("LoginController::loadStudentPortal| Loading files required by student portal");

        // store sid here for now
        var persistMySid: number;

        var studentPortalFiles = {
            "myStudentFile": {},
            "myTeamFile": {},
            "myGradesFile": {},
            "deliverablesFile": {},
            "classlist": ['']
        };

        // synchronously load files into studentPortalFiles object
        async.waterfall([
            function get_my_student_file(callback: any) {
                Log.trace("LoginController::loadStudentPortal| get_my_student_file");
                Helper.readFile("students.json", function (error: any, data: any) {
                    if (!error) {
                        var allStudents = JSON.parse(data);
                        var myStudentFile: any = _.find(allStudents, { "username": username });

                        if (typeof myStudentFile !== 'undefined') {
                            persistMySid = myStudentFile.sid;
                            studentPortalFiles.myStudentFile = myStudentFile;
                            return callback(null);
                        }
                        else {
                            studentPortalFiles.myStudentFile = "err";
                            return callback(null);
                        }
                    }
                    else {
                        studentPortalFiles.myStudentFile = "err";
                        return callback(null);
                    }
                });
            },
            function get_my_team_file(callback: any) {
                Log.trace("LoginController::loadStudentPortal| get_my_team_file");
                Helper.readFile("teams.json", function (error: any, data: any) {
                    if (!error) {
                        var allTeams = JSON.parse(data);
                        var myTeamFile = _.find(allTeams, function (team: any) {
                            return _.some(team.members, function (index: any) {
                                return index === persistMySid;
                            });
                        });

                        if (typeof myTeamFile !== 'undefined') {
                            Log.trace("LoginController::loadStudentPortal| get_my_team_file: success");
                            studentPortalFiles.myTeamFile = myTeamFile;
                            return callback(null);
                        }
                        else {
                            Log.trace("LoginController::loadStudentPortal| Error: " + myTeamFile);
                            studentPortalFiles.myTeamFile = "err";
                            return callback(null);
                        }
                    }
                    else {
                        studentPortalFiles.myTeamFile = "err";
                        return callback(null);
                    }
                });
            },
            function get_my_grades_file(callback: any) {
                Log.trace("LoginController::loadStudentPortal| get_my_grades_file");
                Helper.readFile("grades.json", function (error: any, data: any) {
                    if (!error) {
                        var allGrades = JSON.parse(data);
                        var myGradesFile = _.find(allGrades, { "username": username });

                        if (myGradesFile !== 'undefined') {
                            studentPortalFiles.myGradesFile = myGradesFile;
                            return callback(null);
                        }
                        else {
                            studentPortalFiles.myGradesFile = "err";
                            return callback(null);
                        }
                    }
                    else {
                        studentPortalFiles.myGradesFile = "err";
                        return callback(null);
                    }
                });
            },
            function get_deliverables_file(callback: any) {
                Log.trace("LoginController::loadStudentPortal| get_deliverables_file");
                Helper.readFile("deliverables.json", function (error: any, data: any) {
                    if (!error) {
                        studentPortalFiles.deliverablesFile = JSON.parse(data);
                        return callback(null);
                    }
                    else {
                        studentPortalFiles.deliverablesFile = "err";
                        return callback(null);
                    }
                });
            },

            function get_classlist(callback: any) {
                Log.trace("LoginController::loadStudentPortal| get_classlist");
                Helper.readFile("students.json", function (error: any, data: any) {
                    if (!error) {
                        var studentsObject = JSON.parse(data);
                        var namesArray: any[] = [];

                        for (var index = 0; index < studentsObject.length; index++) {

                            // NEW: only add to array if student 'hasTeam' is false
                            if (studentsObject[index].hasTeam === false) {
                                var name: string = studentsObject[index].firstname + " " + studentsObject[index].lastname;
                                namesArray.push(name);
                            }
                        }

                        studentPortalFiles.classlist = namesArray;
                        return callback(null);
                    }
                    else {
                        studentPortalFiles.classlist = ["err"];
                        return callback(null);
                    }
                });
            }
        ],
            function async_end(error: any, results: any) {
                if (!error) {
                    Log.trace("LoginController::loadStudentPortal| async_end: Sending files.");
                    return parentCallback(null, studentPortalFiles);
                }
                else {
                    Log.trace("LoginController::loadStudentPortal| async_end: Error getting files.");
                    return parentCallback(true, null);
                }
            }
        );
    }

    /**
     * Retrieve files needed by admin portal:
     * - admins.json
     * - students.json
     * - teams.json
     * - grades.json
     * - deliverables.json
     * - classlist (array of all student names for team creation form)
    
     * Note: For the async functions, we purposely return 'callback(null)' instead of 'callback(true)'
     * on error branches. This allows us to send the successfully retrieved files even if some files
     * can't be retrieved.
     *
     * @param username
     * @returns object containing files
     */
    static loadAdminPortal(username: string, parentCallback: any) {
        Log.trace("LoginController::loadAdminPortal| Getting files admin portal");
        var adminPortalFiles = {
            "myAdmin": {},
            "adminsFile": {},
            "studentsFile": {},
            "teamsFile": {},
            "gradesFile": {},
            "deliverablesFile": {},
            "classlist": ['']
        };

        // synchronously load files into adminPortalFiles object
        async.waterfall([
            function get_admins_file(callback: any) {
                Log.trace("LoginController::loadAdminPortal| get_admin_file");
                Helper.readFile("admins.json", function (error: any, data: any) {
                    if (!error) {
                        var allAdmins = JSON.parse(data);
                        var myAdmin = _.find(allAdmins, { "username": username });

                        adminPortalFiles.adminsFile = allAdmins;
                        adminPortalFiles.myAdmin = myAdmin;
                        return callback(null);
                    }
                    else {
                        adminPortalFiles.adminsFile = "err";
                        return callback(null);
                    }
                });
            },
            function get_students_file(callback: any) {
                Log.trace("LoginController::loadAdminPortal| get_students_file");
                Helper.readFile("students.json", function (error: any, data: any) {
                    if (!error) {
                        adminPortalFiles.studentsFile = JSON.parse(data);
                        return callback(null);
                    }
                    else {
                        adminPortalFiles.studentsFile = "err";
                        return callback(null);
                    }
                });
            },
            function get_teams_file(callback: any) {
                Log.trace("LoginController::loadAdminPortal| get_teams_file");
                Helper.readFile("teams.json", function (error: any, data: any) {
                    if (!error) {
                        adminPortalFiles.teamsFile = JSON.parse(data);
                        return callback(null);
                    }
                    else {
                        adminPortalFiles.teamsFile = "err";
                        return callback(null);
                    }
                });
            },
            function get_deliverables_file(callback: any) {
                Log.trace("LoginController::loadAdminPortal| get_deliverables_file");
                Helper.readFile("deliverables.json", function (error: any, data: any) {
                    if (!error) {
                        adminPortalFiles.deliverablesFile = JSON.parse(data);
                        return callback(null);
                    }
                    else {
                        adminPortalFiles.deliverablesFile = "err";
                        return callback(null);
                    }
                });
            },
            function get_grades_file(callback: any) {
                Log.trace("LoginController::loadAdminPortal| get_grades_file");
                Helper.readFile("grades.json", function (error: any, data: any) {
                    if (!error) {
                        adminPortalFiles.gradesFile = JSON.parse(data);
                        return callback(null);
                    }
                    else {
                        adminPortalFiles.gradesFile = "err";
                        return callback(null);
                    }
                });
            },
            function get_classlist(callback: any) {
                Log.trace("LoginController::loadAdminPortal| get_classlist");
                Helper.readFile("students.json", function (error: any, data: any) {
                    if (!error) {
                        var studentsObject = JSON.parse(data);
                        var namesArray: any[] = [];

                        for (var index = 0; index < studentsObject.length; index++) {

                            // NEW: only add to array if student 'hasTeam' is false
                            if (studentsObject[index].hasTeam === false) {
                                var name: string = studentsObject[index].firstname + " " + studentsObject[index].lastname;
                                namesArray.push(name);
                            }
                        }

                        adminPortalFiles.classlist = namesArray;
                        return callback(null);
                    }
                    else {
                        adminPortalFiles.classlist = ["err"];
                        return callback(null);
                    }
                });
            }
        ],
            function async_end(error: any, results: any) {
                if (!error) {
                    Log.trace("LoginController::loadAdminPortal| async_end: Sending files.");
                    return parentCallback(null, adminPortalFiles);
                }
                else {
                    Log.trace("LoginController::loadAdminPortal| async_end: Error getting files.");
                    return parentCallback(true, null);
                }
            }
        );
    }

}