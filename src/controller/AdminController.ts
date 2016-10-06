import fs = require('fs');
import async = require('async');
import _ = require('lodash');
import Log from '../Util';
import {Helper} from '../Util';

const pathToRoot = __dirname.substring(0, __dirname.lastIndexOf('classportal/')) + 'classportal/';
var config = require(pathToRoot + 'config.json');

export default class AdminController {

    /**
     * Checks if all sids provided in arg1 exist in arg2
     * @returns {boolean}
     */
    static isTeamValid(memberSids: string[], validSids: string[], callback: any) {
        var isValid: boolean = true;

        // loop thru the team members sids, checking if they are contained in the array of valid sids
        async.each(
            memberSids,
            function loop(sid, callback) {
                if (_.includes(validSids, sid) === false) {
                    Log.trace("AdminController::isTeamValid - " + sid + " is not a valid student!");
                    isValid = false;
                    Log.trace("AdminController::isTeamValid - isValid: " + isValid);
                } else {
                    Log.trace("AdminController::isTeamValid - " + sid + " is valid!");
                    Log.trace("AdminController::isTeamValid - isValid: " + isValid);
                }
                return callback();
            },
            function end(error) {
                if (!error) {
                    return callback(isValid);
                } else {
                    return callback("error: isTeamValid failed!");
                }
            }
        );
    }

    /**
     * Update database according to new classlist.csv.
     * Expects csv format with 4 columns: (sid, csid, lastname, firstname)
     *
     * first, get an array of sid's for use in the following actions:
     * edit classlist.csv to match
     * edit students.json (populate and delete students who are not in classlist)
     * edit grades.json (overwrite all other student info if student doesn't exist
     * edit teams.json (overwrite all other student info if student doesn't exist
     * edit tokens.json (overwrite all other student info if student doesn't exist
     *
     * @param csv file
     * @returns response message containing files
     */
    static updateClasslist(csv_path: string, parentCallback: any) {
        Log.trace("AdminController::updateClasslist - start");

        // database files are read and stored here for easy access in the async functions below
        var studentsFile: any;
        var teamsFile: any;
        var gradesFile: any;
        var classlistFile: any;

        // these arrays will contain parsed values from the newly submitted classlist.csv
        var csidArray: string[] = [];
        var sidArray: string[] = [];
        var lastnameArray: string[] = [];
        var firstnameArray: string[] = [];

        // array of student ids that will be deleted because they are no longer enrolled
        var invalidStudents: string[] = [];

        // array of student ids that will have new entries created because they just enrolled
        var newStudents: string[] = [];

        // array of team ids that will be deleted because 1 or more students are no longer enrolled
        var invalidTeams: string[] = [];

        // array of student ids that will have their hasTeam set to false because their team is now invalid
        var invalidTeamMembers: string[] = [];

        async.waterfall([
            function get_students_file(callback: any) {
                Log.info("AdminController::updateClasslist - get_students_file");
                Helper.readJSON("students.json", function (error: any, data: any) {
                    if (!error) {
                        studentsFile = data;
                        return callback(null);
                    } else {
                        return callback("get_students_file failed!");
                    }
                });
            },
            function get_teams_file(callback: any) {
                Log.info("AdminController::updateClasslist - get_teams_file");
                Helper.readJSON("teams.json", function (error: any, data: any) {
                    if (!error) {
                        teamsFile = data;
                        return callback(null);
                    } else {
                        return callback("get_teams_file failed!");
                    }
                });
            },
            function get_grades_file(callback: any) {
                Log.info("AdminController::updateClasslist - get_grades_file");
                Helper.readJSON("grades.json", function (error: any, data: any) {
                    if (!error) {
                        gradesFile = data;
                        return callback(null);
                    } else {
                        return callback("get_grades_file failed!");
                    }
                });
            },
            function read_new_classlist(callback: any) {
                Log.trace("AdminController::updateClasslist - read_new_classlist");
                fs.readFile(csv_path, function (error: any, data: any) {
                    if (!error) {
                        classlistFile = data;
                        return callback(null);
                    }
                    else {
                        return callback("read_new_classlist failed!");
                    }
                });
            },
            function overwrite_classlist_file(callback: any) {
                Log.trace("AdminController::updateClasslist - overwrite_classlist_file");
                var filename = __dirname.substring(0, __dirname.lastIndexOf('classportal/')) + 'classportal/priv/classlist.csv';

                fs.writeFile(filename, classlistFile, function (error: any) {
                    if (!error) {
                        return callback(null);
                    } else {
                        return callback("overwrite_classlist_file failed!");
                    }
                });
            },
            function remove_csv_header(callback: any) {
                Log.trace("AdminController::updateClasslist - remove_csv_header");
                var rows = classlistFile.toString().split(/\n/);
                var shift = rows.shift();
                if (shift === undefined) {
                    return callback("remove_csv_header failed!");
                } else {
                    return callback(null, rows);
                }
            },
            function parse_csv(rows: any, callback: any) {
                Log.trace("AdminController::updateClasslist - parse_csv");
                async.forEachOf(rows,
                    function parse_csv_rows(row: any, index: number, callback: any) {
                        Log.trace("AdminController::updateClasslist - parse_csv_row: " + index);
                        var values = row.split(',');

                        // sort csid, sid, lastname, firstname into arrays
                        if (!!values[0] && !!values[1] && !!values[2] && !!values[3]) {
                            csidArray[index] = values[0];
                            sidArray[index] = values[1];
                            lastnameArray[index] = values[2];
                            firstnameArray[index] = values[3];
                            return callback();
                        } else {
                            // this might occur if there is an end-of-file newline in the csv file. don't return error, but don't add to parsed arrays.
                            Log.trace("AdminController::updateClasslist - invalid row: " + row);
                            return callback();
                        }
                    }, function end(error: any) {
                        if (!error) {
                            return callback(null);
                        } else {
                            return callback("parse_csv failed!");
                        }
                    }
                );
            },
            function get_new_and_invalid_students(callback: any) {
                Log.trace("AdminController::updateClasslist - get_invalid_students");
                // https://lodash.com/docs/4.16.0#map
                var oldStudents: string[] = <string[]>_.map(studentsFile, 'sid');
                var validStudents = sidArray;

                Log.trace("AdminController::updateClasslist - oldStudents: " + JSON.stringify(oldStudents));
                Log.trace("AdminController::updateClasslist - validStudents: " + JSON.stringify(validStudents));

                // https://lodash.com/docs/4.16.0#difference
                invalidStudents = _.difference(oldStudents, validStudents);
                newStudents = _.difference(validStudents, oldStudents);

                Log.trace("AdminController::updateClasslist - invalidStudents: " + JSON.stringify(invalidStudents));
                Log.trace("AdminController::updateClasslist - newStudents: " + JSON.stringify(newStudents));

                return callback(null);
            },
            function check_teams_for_invalid_students(callback: any) {
                Log.trace("AdminController::updateClasslist - check_teams_for_invalid_students");
                async.forEachOf(
                    teamsFile,
                    function loop_thru_teams(team: any, index: number, callback: any) {
                        AdminController.isTeamValid(team.members, sidArray, function (result: boolean) {
                            if (result) {
                                Log.trace("AdminController::updateClasslist - team " + team.id + " is valid");
                                return callback();
                            } else {
                                Log.trace("AdminController::updateClasslist - team " + team.id + " is no longer valid and will be deleted!");
                                // save the team id for team deletion in the next function
                                invalidTeams.push(team.id);

                                // save the team members' sids for changing hasTeam status later
                                invalidTeamMembers.push.apply(invalidTeamMembers, team.members);
                                return callback();
                            }
                        });
                    },
                    function end(error: any) {
                        if (!error) {
                            return callback(null);
                        } else {
                            return callback("check_teams_for_invalid_students failed!");
                        }
                    }
                );
            },
            function set_hasteam_false(callback: any) {
                Log.trace("AdminController::updateClasslist - set_hasteam_false");
                async.eachSeries(
                    invalidTeamMembers,
                    function loop_thru_students(sid: string, callback: any) {
                        var index = _.findIndex(studentsFile, { 'sid': sid });
                        if (index !== -1) {
                            Log.trace("AdminController::updateClasslist - setting 'hasTeam':false for student " + sid);
                            studentsFile[index].hasTeam = false;
                            return callback();
                        } else {
                            return callback("could not set " + sid + "'s hasTeam status to false!");
                        }
                    },
                    function end(error: any) {
                        if (!error) {
                            return callback(null);
                        } else {
                            return callback("set_hasteam_false failed: " + error);
                        }
                    }
                );
            },
            function delete_invalid_teams(callback: any) {
                Log.trace("AdminController::updateClasslist - delete_invalid_teams");
                async.eachSeries(
                    invalidTeams,
                    function delete_team(teamId: string, callback: any) {
                        var index = _.findIndex(teamsFile, { 'id': teamId });
                        if (index !== -1) {
                            Log.trace("AdminController::updateClasslist - deleting team " + teamId);
                            teamsFile.splice(index, 1);
                            return callback();
                        } else {
                            return callback("could not delete team " + teamId);
                        }
                    },
                    function end(error: any) {
                        if (!error) {
                            return callback(null);
                        } else {
                            return callback("delete_invalid_teams failed: " + error);
                        }
                    }
                );
            },
            function delete_invalid_students(callback: any) {
                Log.trace("AdminController::updateClasslist - delete_invalid_students");
                async.eachSeries(
                    invalidStudents,
                    function delete_student(sid: string, callback: any) {
                        var index = _.findIndex(studentsFile, { 'sid': sid });
                        if (index !== -1) {
                            Log.trace("AdminController::updateClasslist - deleting student " + sid);
                            studentsFile.splice(index, 1);
                            return callback();
                        } else {
                            return callback("could not delete student " + sid);
                        }
                    },
                    function end(error: any) {
                        if (!error) {
                            return callback(null);
                        } else {
                            return callback("delete_invalid_students failed: " + error);
                        }
                    }
                );
            },
            function delete_invalid_grades(callback: any) {
                Log.trace("AdminController::updateClasslist - delete_invalid_grades");
                async.eachSeries(
                    invalidStudents,
                    function delete_grade(sid: string, callback: any) {
                        var index = _.findIndex(gradesFile, { 'sid': sid });
                        if (index !== -1) {
                            Log.trace("AdminController::updateClasslist - deleting grade of student " + sid);
                            gradesFile.splice(index, 1);
                            return callback();
                        } else {
                            return callback("could not delete grade of student " + sid);
                        }
                    },
                    function end(error: any) {
                        if (!error) {
                            return callback(null);
                        } else {
                            return callback("delete_invalid_grades failed: " + error);
                        }
                    }
                );
            },
            function add_new_students_and_grades(callback: any) {
                Log.trace("AdminController::updateClasslist - add_new_students_and_grades");
                async.eachSeries(
                    newStudents,
                    function loop_thru_new_students(sid: string, callback: any) {
                        Log.trace("AdminController::updateClasslist - current student: " + sid);
                        var index = _.indexOf(sidArray, sid);
                        if (index !== -1) {
                            var newStudentEntry = {
                                "csid": csidArray[index],
                                "sid": sidArray[index],
                                "lastname": lastnameArray[index],
                                "firstname": firstnameArray[index],
                                "username": "",
                                "hasTeam": false
                            };

                            var newGradesEntry = {
                                "sid": sidArray[index],
                                "grades": {}
                            };

                            Log.trace("AdminController::updateClasslist - adding new student: " + JSON.stringify(newStudentEntry));
                            studentsFile.push(newStudentEntry);
                            Log.trace("AdminController::updateClasslist - adding new grade: " + JSON.stringify(newGradesEntry));
                            gradesFile.push(newGradesEntry);
                            return callback();
                        } else {
                            return callback("new student " + sid + " was not found in sidArray!");
                        }
                    },
                    function end(error: any) {
                        if (!error) {
                            return callback(null);
                        } else {
                            return callback("add_new_students_and_grades failed: " + error);
                        }
                    }
                );
            },
            function write_students_file(callback: any) {
                Log.trace("AdminController::updateClasslist - write_students_file");
                Log.trace("new studentsFile:\n" + JSON.stringify(studentsFile, null, 2));
                var path = pathToRoot.concat(config.private_folder, "students.json");
                fs.writeFile(path, JSON.stringify(studentsFile, null, 2), function (err: any) {
                    if (err) {
                        return callback("write_students_file: error");
                    } else {
                        return callback(null);
                    }
                });
            },
            function write_teams_file(callback: any) {
                Log.trace("AdminController::updateClasslist - write_teams_file");
                Log.trace("new teamsFile:\n" + JSON.stringify(teamsFile, null, 2));
                var path = pathToRoot.concat(config.private_folder, "teams.json");
                fs.writeFile(path, JSON.stringify(teamsFile, null, 2), function (err: any) {
                    if (err) {
                        return callback("write_teams_file: error");
                    } else {
                        return callback(null);
                    }
                });
            },
            function write_grades_file(callback: any) {
                Log.trace("AdminController::updateClasslist - write_grades_file");
                Log.trace("new gradesFile:\n" + JSON.stringify(gradesFile, null, 2));
                var path = pathToRoot.concat(config.private_folder, "grades.json");
                fs.writeFile(path, JSON.stringify(gradesFile, null, 2), function (err: any) {
                    if (err) {
                        return callback("write_grades_file: error");
                    } else {
                        return callback(null);
                    }
                });
            }
        ],
            function end_waterfall(error: any) {
                if (!error) {
                    Log.trace("AdminController::updateClasslist - succcess!");
                    return parentCallback(null, invalidStudents, newStudents);
                } else {
                    Log.error("AdminController::updateClasslist - error: " + error);
                    return parentCallback(error, null, null);
                }
            }
        );
    }

    /**
     * Add teamId to the specified admin's 'teams' array in admins.json. 
     */
    static assignTeam(username: string, teamId: string, callback: any) {
        Log.trace("AdminController::assignTeam(..) - start");
        var path = pathToRoot.concat(config.private_folder, "admins.json");

        Helper.readJSON("admins.json", function (error: any, adminsFile: any) {
            if (!error) {
                var adminIndex: number = _.findIndex(adminsFile, { "username": username });
                if (adminIndex !== -1) {
                    // if the team is already assigned to the admin, return error
                    if (_.indexOf(adminsFile[adminIndex].teams, teamId) !== -1) {
                        Log.trace("AdminController::assignTeam(..) - error: admin is already assigned to this team!");
                        return callback("admin is already assigned to this team.");
                    }
                    else {
                        // add teamId to the admin's teams.
                        adminsFile[adminIndex].teams.push(teamId);

                        Log.trace("AdminController::assignTeam(...) - writing to admins file..");
                        fs.writeFile(path, JSON.stringify(adminsFile, null, 2), function (error: any) {
                            if (!error) {
                                Log.trace("AdminController::assignTeam(..) - team " + teamId + " was successfully added to " + username + "'s assigned teams.");
                                return callback(null);
                            }
                            else {
                                Log.trace("AdminController::assignTeam(..) - write failed!");
                                return callback("write error");
                            }
                        });
                    }
                } else {
                    Log.trace("AdminController::assignTeam(..) - error: admin file could not be found!");
                    return callback("admin file could not be found");
                }
            } else {
                Log.trace("AdminController::assignTeam(..) - file read error");
                return callback(error);
            }
        });
    }

    // update grades.json
    // todo: function not yet implmented.
    static submitGrade(student: string, assnId: string, grade: string, comment: string, callback: any) {
        Log.trace("AdminController::submitGrade| Not yet implemented!");

        // return error
        return callback("grade submission not implemented");
    }

}