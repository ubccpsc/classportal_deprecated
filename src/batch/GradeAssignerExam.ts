/**
 * Created by rtholmes on 2016-10-28.
 */

import Log from "../Util";
var request = require('request');
var config = require('../../config.json');
var rp = require('request-promise-native');

import {Helper} from "../Util";
import async = require('async');
import _ = require('lodash');
import fs = require('fs');

const pathToRoot = __dirname.substring(0, __dirname.lastIndexOf('classportal/')) + 'classportal/';

export default class GradeAssignerExam {

    private getGradesForStudent(sid: number, gradeData: any[]): any[] {

        for (var grade of gradeData) {
            if (grade.sid == sid) {
                Log.trace('getGradesForStudent( ' + sid + ', ...) - success: ' + sid);
                return grade.grades;
            }
        }

        Log.error('getGradesForStudent( ' + sid + ', ...) - FAILED!');
        throw new Error('Could not find grades for student');
    }

    public assign(deliverableId: string, fName: string, writeToDisk: boolean) {
        try {

            var inpath = pathToRoot.concat(config.private_folder, fName);
            Log.info('path: ' + inpath);
            var inbuf = fs.readFileSync(inpath);
            Log.info('input data ready!');
            var inData = JSON.parse(inbuf.toString());

            var path = pathToRoot.concat(config.private_folder, 'grades.json');
            Log.info('path: ' + path);
            var buf = fs.readFileSync(path);
            Log.info('grade data ready!');
            var gradeData = JSON.parse(buf.toString());

            var spath = pathToRoot.concat(config.private_folder, 'students.json');
            Log.info('path: ' + path);
            var sbuf = fs.readFileSync(spath);
            var studentData = JSON.parse(sbuf.toString());
            Log.info('student data ready!');

            var updatedGrades: any[] = [];

            for (var row of inData) {
                var github: string = row.key;
                var newGrade = row.value;
                var newGradeRecord = {
                    assnId: deliverableId,
                    autotest: "0",
                    comment: "",
                    coverage: "0", // coverage can't be > 100
                    grade: Number(row.grade) + "",
                    retrospective: ""
                };

                var sid = row.sid;// this.getStudentForGithub(github, studentData);
                if (sid > 0) {
                    var gradeRows = this.getGradesForStudent(sid, gradeData);

                    var found = false;
                    for (var g of gradeRows) {
                        if (g.assnId === deliverableId) {
                            // g.assnId = // stays the same
                            g.autotest = newGradeRecord.autotest;
                            g.comment = newGradeRecord.comment;
                            g.coverage = newGradeRecord.coverage;
                            g.grade = newGradeRecord.grade;
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
            if (writeToDisk === true) {
                Log.trace('Writing results to disk');
                Helper.addGrades(updatedGrades, function () {
                    Log.trace('add record done');
                });
            } else {
                Log.warn('Results not written to disk (writeToDisk false)');
            }
            Log.trace('updating record set sent');

        } catch (err) {
            Log.error('error: ' + err);
        }
    }
}

var gec = new GradeAssignerExam();
gec.assign('midterm', 'mtGrades.json', false);
