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

export default class GradeExporter {

    private getTeamForStudent(snum: number, teams: any): number {
        //return -1;
        for (var t of teams) {
            for (var s of t.members) {
                // snum a number, s probably a string
                if (s == snum) {
                    return t.id;
                }
            }
        }
        return -1;
    }

    public export() {
        try {
            var path = pathToRoot.concat(config.private_folder, 'grades.json');
            Log.info('path: ' + path);
            var buf = fs.readFileSync(path);
            var data = JSON.parse(buf.toString());
            Log.info('grade data ready!');

            var spath = pathToRoot.concat(config.private_folder, 'students.json');
            Log.info('path: ' + path);
            var sbuf = fs.readFileSync(spath);
            var sdata = JSON.parse(sbuf.toString());
            Log.info('student data ready!');

            var tpath = pathToRoot.concat(config.private_folder, 'teams.json');
            Log.info('path: ' + path);
            var tbuf = fs.readFileSync(tpath);
            var tdata = JSON.parse(tbuf.toString());
            Log.info('team data ready!');


            var rows: any = [];
            var delivs = ["d0", "d1", "d2", "d3", "d4", "d5", "lab", "midterm", "final"];
            // rHead = rHead.concat(delivs);
            var rHead: any = [];
            rHead.push("Name");
            rHead.push("st #");
            rHead.push("team #");
            rHead.push("d0test");
            rHead.push("d0cover");
            rHead.push("d0retro");
            rHead.push("d0final");
            rHead.push("d1test");
            rHead.push("d1cover");
            rHead.push("d1retro");
            rHead.push("d1final");
            rHead.push("d2test");
            rHead.push("d2cover");
            rHead.push("d2retro");
            rHead.push("d2final");
            rHead.push("d3test");
            rHead.push("d3cover");
            rHead.push("d3retro");
            rHead.push("d3final");
            rHead.push("d4");
            rHead.push("d5");
            rHead.push("midterm");
            rHead.push("final");
            rows.push(rHead);

            for (var student of data) {
                var sid = Number.parseInt(student.sid);

                var row: any = [];

                for (var s of sdata) {
                    if (Number(s.sid) === sid) {
                        row.push(s.firstname + " " + s.lastname);
                    }
                }

                row.push(sid);
                row.push(this.getTeamForStudent(sid, tdata));

                var sgrades = student.grades;
                for (var d of delivs) {
                    var val: string|number = '';
                    for (var g of sgrades) {
                        if (g.assnId === d) {
                            if (d === "d0" || d === "d1" || d === "d2" || d === "d3") {
                                row.push(Number.parseInt(g.autotest));
                                row.push(Number.parseInt(g.coverage));
                                row.push(Number.parseInt(g.retrospective));
                                row.push(Number.parseInt(g.grade));
                            } else {
                                val = Number.parseInt(g.grade);
                                row.push(val);
                            }
                        }
                    }
                }
                rows.push(row);
                Log.trace('row: ' + JSON.stringify(row));
            }

            // NOTE: this is a total hack, we could do this better
            for (var row of rows) {
                var txt = JSON.stringify(row);
                txt = txt.replace('[', '');
                txt = txt.replace(']', '');
                console.log(txt);
            }
        } catch (err) {
            Log.error('error: ' + err);
        }
    }
}

var gec = new GradeExporter();
gec.export();
