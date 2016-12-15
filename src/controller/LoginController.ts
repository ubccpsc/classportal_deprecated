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
                        } else {
                            Log.error("LoginController::login| request_access_token: error");
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
                        } else {
                            Log.error("LoginController::login| request_github_name: error");
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
                        } else {
                            Log.error("LoginController::login| check_if_admin: error");
                            return callback("error");
                        }
                    });
                },
                function check_user_exists_or_create_user(callback: any) {
                    Log.trace("LoginController::login| check_user_exists_or_create_user");
                    Helper.readJSON(persistAdmin ? "admins.json" : "students.json", function (error: any, data: any) {
                        if (!error) {
                            Log.trace("LoginController::login| Checking for user");
                            var file = data;
                            var userIndex: number = _.findIndex(file, {'username': persistUsername});

                            // user found, continue to write githubtoken
                            if (userIndex >= 0) {
                                Log.trace("LoginController::login| check_user_exists: success");
                                return callback(null);
                            } else {
                                // user not found. If valid csid and sid supplied, register student.
                                if (persistAdmin) {
                                    Log.error("LoginController::login| check_user_exists: error");
                                    return callback("error");
                                } else {
                                    Log.trace("LoginController::login| Student not found. Checking for first-time login");
                                    var newUserIndex = _.findIndex(file, {'csid': csid, 'sid': sid});
                                    if (newUserIndex >= 0) {
                                        Log.trace("LoginController::login| First time login! Updating student file");
                                        Helper.updateEntry("students.json", {'csid': csid, 'sid': sid}, {"username": persistUsername}, function (error: any) {
                                            if (!error) {
                                                Log.trace("LoginController::login| create_user: success");
                                                return callback(null);
                                            } else {
                                                Log.error("LoginController::login| create_user: error");
                                                return callback("error");
                                            }
                                        });
                                    } else {
                                        Log.error("LoginController::login| check_user_exists: error");
                                        return callback("error");
                                    }
                                }
                            }
                        } else {
                            Log.error("LoginController::login| check_user_exists: error");
                            return callback("error", null);
                        }
                    });
                },
                function store_githubtoken(callback: any) {
                    Log.trace("LoginController::login| store_github_token");
                    Helper.updateEntry("tokens.json", {'username': persistUsername}, {"githubtoken": persistGithubToken}, function (error: any) {
                        if (!error) {
                            Log.trace("LoginController::login| store_githubtoken: success");
                            return callback(null);
                        } else {
                            var newEntry = {
                                "username": persistUsername,
                                "githubtoken": persistGithubToken,
                                "servertoken": ""
                            };

                            Helper.addEntry("tokens.json", newEntry, function (error: any) {
                                if (!error) {
                                    Log.trace("LoginController::login| store_githubtoken: success");
                                    return callback(null);
                                } else {
                                    Log.error("LoginController::login| store_githubtoken: error");
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

                    Helper.updateEntry("tokens.json", {'username': persistUsername}, {"servertoken": servertoken}, function (error: any) {
                        if (!error) {
                            Log.trace("LoginController::login| generate_and_store_servertoken: success");
                            return callback(null, servertoken);
                        } else {
                            Log.error("LoginController::login| generate_and_store_servertoken: error");
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
                } else {
                    Log.error("LoginController::login| end_async: error: " + error);
                    return parentCallback("error", null);
                }
            }
        );
    }

    static logout(username: string, callback: any) {
        Helper.updateEntry("tokens.json", {'username': username}, {"servertoken": ""}, function (error: any) {
            if (!error) {
                Log.trace("LoginController::logout| Success");
                return callback(null, true);
            } else {
                Log.error("LoginController::logout| Error");
                return callback(true, null);
            }
        });
    }

    static checkRegistration(csid: string, sid: string, parentCallback: any) {
        Log.trace("LoginController::checkRegistration| Checking valid regex");
        async.parallel([
                function csidRegexTest(callback: any) {
                    /*
                     var validCsidRegex = /^[a-z][0-9][a-z][0-9]$/;
                     var result: boolean = validCsidRegex.test(csid);
                     Log.trace("LoginController::checkRegistration| csidRegexTest: " + result.toString());
                     */
                    return callback(null);
                },
                function sidRegexTest(callback: any) {
                    /*
                     var validSidRegex = /^\d{8}$/;
                     if (validSidRegex.test(sid)) {
                     return callback(null);
                     }
                     else {
                     return callback("bad sid");
                     }
                     */
                    return callback(null);
                }
            ],
            function end_async(error: any) {
                if (!error) {
                    Log.trace("LoginController::checkRegistration| Valid regex. Checking for registration status");
                    Helper.checkEntry("students.json", {'csid': csid, 'sid': sid}, function (error: any, response: any) {
                        if (!error) {
                            // only allow registration if student is not already registered.
                            if (!response.username) {
                                Log.trace("LoginController::checkRegistration| Valid student. Continue to registration");
                                return parentCallback(null, true);
                            } else {
                                Log.error("LoginController::checkRegistration| Error: Student is already registered!");
                                return parentCallback("student is already registered.", null);
                            }
                        } else {
                            Log.error("LoginController::checkRegistration| Error: Student is not enrolled.");
                            return parentCallback("student is not enrolled", null);
                        }
                    });
                } else {
                    Log.error("LoginController::checkRegistration| error: " + error);
                    return parentCallback(error, null);
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
     * an array of name labels formatted for the team creation form, or
     * an array of names of the student's team (depending on hasTeam status)
     *
     * @param username
     * @returns object containing files
     */
    static loadStudentPortal(username: string, parentCallback: any) {
        // for efficiency, we load and save each file in its entirety just once, here.
        var studentsFile: any;
        var teamsFile: any;
        var gradesFile: any;
        var deliverablesFile: any;

        var myStudentIndex: number;
        var myTeamIndex: number;
        var myGradesIndex: number;
        var namesArray: any[] = [];
        var appsArray: any[] = [];

        async.waterfall([
                function get_student_file_and_index(callback: any) {
                    Log.trace("LoginController::loadStudentPortal| get_student_file_and_index");

                    Helper.readJSON("students.json", function (error: any, data: any) {
                        if (!error) {
                            studentsFile = data;
                            myStudentIndex = _.findIndex(studentsFile, {"username": username});

                            if (myStudentIndex < 0) {
                                return callback("could not load my student file");
                            } else {
                                return callback(null);
                            }
                        } else {
                            return callback("could not load student file");
                        }
                    });
                },
                function get_team_file_and_index(callback: any) {
                    Log.trace("LoginController::loadStudentPortal| get_team_file_and_index");

                    // if student not in team, continue to next function.
                    if (studentsFile[myStudentIndex].hasTeam === false) {
                        return callback(null);
                    } else {
                        Helper.readJSON("teams.json", function (error: any, data: any) {
                            if (!error) {
                                teamsFile = data;

                                // find the index of the object with a field 'members' which contains the given sid
                                myTeamIndex = _.findIndex(teamsFile, function (team: any) {
                                    return _.some(team.members, function (index: any) {
                                        return index === studentsFile[myStudentIndex].sid;
                                    });
                                });

                                if (myTeamIndex < 0) {
                                    return callback("could not load my team file");
                                } else {
                                    return callback(null);
                                }
                            } else {
                                return callback("could not load student file");
                            }
                        });
                    }
                },
                function get_my_grades_file(callback: any) {
                    Log.trace("LoginController::loadStudentPortal| get_my_grades_file");

                    Helper.readJSON("grades.json", function (error: any, data: any) {
                        if (!error) {
                            gradesFile = data;
                            myGradesIndex = _.findIndex(gradesFile, {"sid": studentsFile[myStudentIndex].sid});

                            if (myGradesIndex < 0) {
                                return callback("could not load my grades file");
                            } else {
                                return callback(null);
                            }
                        } else {
                            return callback("could not load grades file");
                        }
                    });
                },
                function get_deliverables_file(callback: any) {
                    Log.trace("LoginController::loadStudentPortal| get_deliverables_file");

                    Helper.readJSON("deliverables.json", function (error: any, data: any) {
                        if (!error) {
                            deliverablesFile = data;
                            return callback(null);
                        } else {
                            return callback("could not load deliverables file");
                        }
                    });
                },
                function get_names_array(callback: any) {
                    Log.trace("LoginController::loadStudentPortal| get_names_array");

                    // if student has a team, populate array with teammate names
                    if (studentsFile[myStudentIndex].hasTeam === true) {
                        for (var index = 0; index < teamsFile[myTeamIndex].members.length; index++) {
                            var sid = teamsFile[myTeamIndex].members[index];
                            var teammateStudentIndex: number = _.findIndex(studentsFile, {"sid": sid});

                            if (teammateStudentIndex < 0) {
                                teammateStudentFile[index] = "null";
                            } else {
                                var teammateStudentFile: any = studentsFile[teammateStudentIndex];
                                var name: string = teammateStudentFile.firstname + " " + teammateStudentFile.lastname;
                                namesArray[index] = name;
                            }
                        }
                        return callback(null);
                    } else {
                        // else, populate array with names of students who aren't in a team
                        for (var index = 0; index < studentsFile.length; index++) {
                            if (studentsFile[index].hasTeam === false) {
                                var studentName: string = studentsFile[index].firstname + " " + studentsFile[index].lastname;
                                namesArray.push({"label": studentName});
                            }
                        }
                        return callback(null);
                    }
                },
                function get_apps_and_comments(callback: any) {
                    Log.trace("LoginController::loadStudentPortal| get_apps_and_comments");
                    if (!!config["enable_app_store"]) {
                        Helper.readJSON("teams.json", function (error: any, data: any) {
                            if (!error) {
                                appsArray = Helper.filterApps(data, studentsFile, false);
                                return callback(null);
                            } else {
                                return callback("could not load teams file");
                            }
                        });
                    } else {
                        // No need to load apps and comments
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
                        "namesArray": namesArray,
                        "appsArray": appsArray
                    };
                    Log.trace("LoginController::loadStudentPortal| Success! Sending files.");
                    return parentCallback(null, response);
                } else {
                    Log.error("LoginController::loadStudentPortal| Error: " + error);
                    return parentCallback(true, null);
                }
            }
        );
    }

    /**
     * Retrieve the files needed by the admin portal:
     * admins file
     * students file
     * teams file
     * grades file
     * deliverables file
     * an array of name labels formatted for the team creation form
     *
     * @param username
     * @returns object containing files
     */
    static loadAdminPortal(username: string, parentCallback: any) {
        var adminsFile: any;
        var myAdminIndex: number;
        var studentsFile: any;
        var teamsFile: any;
        var gradesFile: any;
        var deliverablesFile: any;
        var namesArray: any[] = [];
        var appsArray: any[] = [];

        async.waterfall([
                function get_admins_file_and_index(callback: any) {
                    Log.trace("LoginController::loadAdminPortal| get_admins_file_and_index");

                    Helper.readJSON("admins.json", function (error: any, data: any) {
                        if (!error) {
                            adminsFile = data;
                            myAdminIndex = _.findIndex(adminsFile, {"username": username});

                            if (myAdminIndex < 0) {
                                return callback("could not load my admin file");
                            } else {
                                return callback(null);
                            }
                        } else {
                            return callback("could not load admins file");
                        }
                    });
                },
                function get_students_file(callback: any) {
                    Log.trace("LoginController::loadAdminPortal| get_students_file");

                    Helper.readJSON("students.json", function (error: any, data: any) {
                        if (!error) {
                            studentsFile = data;
                            return callback(null);
                        } else {
                            return callback("could not load students file");
                        }
                    });
                },
                function get_teams_file(callback: any) {
                    Log.trace("LoginController::loadAdminPortal| get_teams_file");
                    Helper.readJSON("teams.json", function (error: any, data: any) {
                        if (!error) {
                            teamsFile = data;
                            return callback(null);
                        } else {
                            return callback("could not load teams file");
                        }
                    });
                },
                function get_grades_file(callback: any) {
                    Log.trace("LoginController::loadAdminPortal| get_grades_file");

                    Helper.readJSON("grades.json", function (error: any, data: any) {
                        if (!error) {
                            gradesFile = data;
                            return callback(null);
                        } else {
                            return callback("could not load grades file");
                        }
                    });
                },
                function get_deliverables_file(callback: any) {
                    Log.trace("LoginController::loadAdminPortal| get_deliverables_file");

                    Helper.readJSON("deliverables.json", function (error: any, data: any) {
                        if (!error) {
                            deliverablesFile = data;
                            return callback(null);
                        } else {
                            return callback("could not load deliverables file");
                        }
                    });
                },
                function get_names_array(callback: any) {
                    Log.trace("LoginController::loadAdminPortal| get_names_array");

                    // populate array with names of students who aren't in a team
                    for (var index = 0; index < studentsFile.length; index++) {
                        if (studentsFile[index].hasTeam === false) {
                            var studentName: string = studentsFile[index].firstname + " " + studentsFile[index].lastname;
                            namesArray.push({"label": studentName});
                        }
                    }
                    return callback(null);
                },
                function get_apps_and_comments(callback: any) {
                    Log.trace("LoginController::loadAdminPortal| get_apps_and_comments");
                    if (!!config["enable_app_store"]) {
                        Helper.readJSON("teams.json", function (error: any, data: any) {
                            if (!error) {
                                appsArray = Helper.filterApps(data, studentsFile, true);
                                return callback(null);
                            } else {
                                return callback("could not load teams file");
                            }
                        });
                    } else {
                        // No need to load apps and comments
                        return callback(null);
                    }
                }
            ],
            function async_end(error: any, results: any) {
                Log.trace("LoginController::loadAdminPortal| async_end");
                if (!error) {
                    // wrap files in response object
                    var response = {
                        "adminsFile": adminsFile,
                        "myAdminIndex": myAdminIndex,
                        "studentsFile": studentsFile,
                        "teamsFile": teamsFile,
                        "gradesFile": gradesFile,
                        "deliverablesFile": deliverablesFile,
                        "namesArray": namesArray,
                        "appsArray": appsArray
                    };
                    Log.trace("LoginController::loadAdminPortal| Success! Sending files.");
                    return parentCallback(null, response);
                } else {
                    Log.error("LoginController::loadAdminPortal| Error: " + error);
                    return parentCallback(true, null);
                }
            }
        );
    }

}