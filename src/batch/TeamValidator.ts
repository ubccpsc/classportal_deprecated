/**
 * Created by rtholmes on 2016-10-28.
 */

import Log from "../Util";
var request = require('request');
var config = require('../../config.json');

import {Helper} from "../Util";
import async = require('async');
import _ = require('lodash');
import fs = require('fs');

const pathToRoot = __dirname.substring(0, __dirname.lastIndexOf('classportal/')) + 'classportal/';

export default class TeamValidator {


    public validateTeams(deleteHighest: boolean) {
        try {

            var spath = pathToRoot.concat(config.private_folder, 'students.json');
            // var spathTmp = pathToRoot.concat(config.private_folder, 'students2.json');
            Log.info('path: ' + spath);
            var sbuf = fs.readFileSync(spath);
            var studentData = JSON.parse(sbuf.toString());
            Log.info('student data ready!');

            var tpath = pathToRoot.concat(config.private_folder, 'teams.json');
            // var tpathTmp = pathToRoot.concat(config.private_folder, 'teams2.json');
            Log.info('path: ' + spath);
            var tbuf = fs.readFileSync(tpath);
            var teamData = JSON.parse(tbuf.toString());
            Log.info('team data ready!');


            let noTeam = 0;
            let bigTeam = 0;
            let rightTeam = 0;

            var teamsToFix: any[] = [];
            var bigTeamIds: number[] = [];
            for (var student of studentData) {
                var sid: string = student.sid;
                var studentTeams: any[] = [];

                for (var team of teamData) {
                    if (team.members.indexOf(sid) >= 0) {
                        studentTeams.push(team);
                    }
                }

                if (studentTeams.length === 0) {
                    // Log.trace('no team for: ' + sid);
                    noTeam++;
                } else if (studentTeams.length === 1) {
                    //Log.trace('one team for: ' + sid);
                    rightTeam++;
                } else if (studentTeams.length > 1) {
                    Log.warn('multiple teams ( ' + studentTeams.length + ' ) for: ' + sid + '; data: ' + JSON.stringify(studentTeams));
                    bigTeam++;

                    // make sure we don't already know it is a dupe (e.g., from a prior member)
                    var alreadyFound = true;
                    for (let t of studentTeams) {
                        if (bigTeamIds.indexOf(t.id) < 0) {
                            alreadyFound = false;
                        }
                    }
                    if (alreadyFound === false) {
                        for (let t of studentTeams) {
                            bigTeamIds.push(t.id);
                            // Log.trace('adding big: ' + t.id);
                        }
                        teamsToFix.push(studentTeams);
                    } else {
                        // already know about this one
                        // Log.trace('already know about big: ' + studentTeams[0].id);
                    }
                }
            }

            Log.info("===");
            Log.info("===");
            Log.info("No team: " + noTeam);
            Log.info("Big team people: " + bigTeam + '; big teams: ' + teamsToFix.length);  // each person will be duplicated
            Log.info("Right team: " + rightTeam);
            Log.info("===");
            Log.info("===");

            Log.info("teams length before: " + teamData.length);
            Log.info("student length before: " + studentData.length);

            for (let teamList of teamsToFix) {

                teamList.sort(function (a: any, b: any) {
                    return a.id - b.id;
                });
                // console.log(JSON.stringify(teamList));

                if (teamList.length === 2) {
                    var teamToKeep = teamList[0];
                    var teamToRemove = teamList[1];

                    // make sure _all_ of the team members are the same!
                    var allMembersSame = _.isEqual(teamToKeep.members.sort(), teamToRemove.members.sort());

                    if (allMembersSame === true) {
                        Log.info("Keeping team: " + teamToKeep.id + "; removing team: " + teamToRemove.id);

                        // remove from team list
                        _.remove(teamData, function (n: any) {
                            return n.id === teamToRemove.id;
                        });

                        // this is out of an abundance of caution; just make sure all students in teams have this flag set
                        for (var memberSid of teamToKeep.members) {
                            var sIndex: number = _.findIndex(studentData, {"sid": memberSid});
                            // Log.trace('sid index: ' + sIndex + "; hasTeam: " + studentData[sIndex].hasTeam);
                            studentData[sIndex].hasTeam = true;
                        }
                    } else {
                        Log.warn("All the team members are not the same!; data: " + JSON.stringify(teamList));
                    }
                } else {
                    throw new Error("Cannot handle teams of size: " + teamList.length);
                }
            }

            Log.info("teams length: " + teamData.length);
            Log.info("student length: " + studentData.length);

            if (deleteHighest === true) {
                fs.writeFileSync(spath, JSON.stringify(studentData, null, 2));
                fs.writeFileSync(tpath, JSON.stringify(teamData, null, 2));
                Log.warn("Data files written");
            } else {
                Log.warn("Data files NOT changed (simulate mode)");
            }

            Log.info("Done");
            /*
             var updatedGrades: any[] = [];

             for (var row of inData.rows) {
             var github: string = row.key;
             var newGrade = row.value;
             var newGradeRecord = {
             assnId: deliverableId,
             autotest: row.value.testGrade + "",
             comment: "",
             coverage: row.value.coverGrade + "",
             grade: row.value.finalGrade + "",
             retrospective: ""
             };

             var sid = this.getStudentForGithub(github, studentData);
             if (sid > 0) {
             var gradeRows = this.getGradesForStudent(sid, gradeData);

             var found = false;
             for (var g of gradeRows) {
             if (g.assnId === deliverableId) {
             // g.assnId = // stays the same
             g.autotest = newGradeRecord.autotest;
             g.comment = newGradeRecord.comment;
             g.coverage = newGradeRecord.coverage;
             g.grade = Math.round(Number(newGradeRecord.grade));
             g.retrospective = newGradeRecord.retrospective;
             found = true;
             Log.trace('updating record for: ' + sid);
             }

             }
             if (found === false) {
             Log.trace('adding new record for: ' + sid);
             gradeRows.push(newGradeRecord);
             }
             var gradeRecord = {sid: sid + "", grades: gradeRows};
             updatedGrades.push(gradeRecord);
             Log.trace('current grade record: ' + JSON.stringify(gradeRecord));

             Log.trace('current grade record complete');
             } else {
             // student not in student file (happens if course is dropped)
             }
             }
             // Log.trace('row: ' + JSON.stringify(row));
             Log.trace('updating record set');
             Helper.addGrades(updatedGrades, function () {
             Log.trace('add record done');
             });
             Log.trace('updating record set sent');

             for (var grade of gradeData) {
             //Log.info('grade: ' + JSON.stringify(grade));
             //Helper.addGrades()
             }

             // write gradeData back to disk
             //Log.trace('done, need to write');
             */
        } catch (err) {
            Log.error('error: ' + err);
        }
    }
}

var tv = new TeamValidator();
tv.validateTeams(false);
