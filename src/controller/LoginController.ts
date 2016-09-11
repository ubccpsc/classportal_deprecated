/**
 * Created by rtholmes on 2016-06-19.
 */

import request = require('request');
import _ = require('lodash');
import async = require('async');
import Log from '../Util';
import {Helper} from '../Util';

const pathToRoot = __dirname.substring(0, __dirname.lastIndexOf('classportal/')) + 'classportal/';
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
     * Retrieve the files needed by the student portal:
     * student file
     * teams file
     * grades file
     * deliverables file
     * an array of names for used for team display or team creation
     *
     * @param username
     * @returns object containing files
     */
    static loadStudentPortal(username: string, parentCallback: any) {
        Log.trace("LoginController::loadStudentPortal| Loading files required by student portal");

        // for efficiency, we load and save each file in its entirety just once, here
        var studentsFile: any;
        var teamsFile: any;
        var gradesFile: any;
        var deliverablesFile: any;

        var myStudentIndex: number;
        var myTeamIndex: number;
        var myGradesIndex: number;
        var namesArray: string[] = [];

        async.waterfall([
            function get_student_file_and_index(callback: any) {
                Log.trace("LoginController::loadStudentPortal| get_student_file_and_index");

                Helper.readFile("students.json", function (error: any, data: any) {
                    if (!error) {
                        studentsFile = JSON.parse(data);
                        myStudentIndex = _.findIndex(studentsFile, { "username": username });

                        if (myStudentIndex < 0) {
                            return callback("could not load my student file");
                        }
                        else {
                            return callback(null);
                        }
                    }
                    else {
                        return callback("could not load student file");
                    }
                });
            },
            function get_team_file_and_index(callback: any) {
                Log.trace("LoginController::loadStudentPortal| get_team_file_and_index");

                // only get file if student has team
                if (studentsFile[myStudentIndex].hasTeam === true) {
                    Helper.readFile("teams.json", function (error: any, data: any) {
                        if (!error) {
                            teamsFile = JSON.parse(data);
                            myTeamIndex = _.findIndex(teamsFile, function (team: any) {
                                return _.some(team.members, function (index: any) {
                                    return index === studentsFile[myStudentIndex].sid;
                                });
                            });

                            if (myTeamIndex < 0) {
                                return callback("could not load my team file");
                            }
                            else {
                                return callback(null);
                            }
                        }
                        else {
                            return callback("could not load student file");
                        }
                    });
                }
                else {
                    return callback(null);
                }
            },
            function get_my_grades_file(callback: any) {
                Log.trace("LoginController::loadStudentPortal| get_my_grades_file");

                Helper.readFile("grades.json", function (error: any, data: any) {
                    if (!error) {
                        gradesFile = JSON.parse(data);
                        myGradesIndex = _.findIndex(gradesFile, { "username": username });

                        if (myGradesIndex < 0) {
                            return callback("could not load my grades file");
                        }
                        else {
                            return callback(null);
                        }
                    }
                    else {
                        return callback("could not load grades file");
                    }
                });
            },
            function get_deliverables_file(callback: any) {
                Log.trace("LoginController::loadStudentPortal| get_deliverables_file");

                Helper.readFile("deliverables.json", function (error: any, data: any) {
                    if (!error) {
                        deliverablesFile = JSON.parse(data);
                        return callback(null);
                    }
                    else {
                        return callback("could not load deliverables file");
                    }
                });
            },
            function get_names_array(callback: any) {
                Log.trace("LoginController::loadStudentPortal| get_names_array");

                // if student has a team, populate array with teammate names
                if (studentsFile[myStudentIndex].hasTeam === true) {
                    for (var index = 0; index < teamsFile[myTeamIndex].members.length; index++) {
                        Log.trace("loop: " + index);
                        var sid = teamsFile[myTeamIndex].members[index];
                        Log.trace("sid: " + sid);
                        var teammateStudentIndex: number = _.findIndex(studentsFile, { "sid": sid });

                        if (teammateStudentIndex < 0) {
                            teammateStudentFile[index] = "null";
                        }
                        else {
                            var teammateStudentFile: any = studentsFile[teammateStudentIndex];
                            var name: string = teammateStudentFile.firstname + " " + teammateStudentFile.lastname;
                            Log.trace("name:" + name);
                            namesArray[index] = name;
                        }
                    }
                    return callback(null);
                }
                // else, populate array with student names who don't yet have a team
                else {
                    // for each student, add to array if 'hasTeam' is false
                    for (var index = 0; index < studentsFile.length; index++) {
                        Log.trace("loop: " + index);
                        if (studentsFile[index].hasTeam === false) {
                            var studentName: string = studentsFile[index].firstname + " " + studentsFile[index].lastname;
                            namesArray.push(studentName);
                        }
                    }
                    return callback(null);
                }
            }
        ],
            function async_end(error: any, results: any) {
                Log.trace("LoginController::loadStudentPortal| async_end");
                if (!error) {
                    // wrap files in response object
                    var response = {
                        "myStudentFile": studentsFile[myStudentIndex],
                        "myTeamFile": studentsFile[myStudentIndex].hasTeam ? teamsFile[myTeamIndex] : "no team",
                        "myGradesFile": gradesFile[myGradesIndex],
                        "deliverablesFile": deliverablesFile,
                        "namesArray": namesArray
                    };
                    Log.trace("LoginController::loadStudentPortal| Success! Sending files: " + JSON.stringify(response, null, 2));
                    return parentCallback(null, response);
                }
                else {
                    Log.trace("LoginController::loadStudentPortal| Error: " + error);
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