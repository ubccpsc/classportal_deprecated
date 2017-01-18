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

    public export() {
        try {
            var path = pathToRoot.concat(config.private_folder, 'grades.json');
            Log.info('path: ' + path);
            var buf = fs.readFileSync(path);
            Log.info('grade data ready!');

            var data = JSON.parse(buf.toString());
            var spath = pathToRoot.concat(config.private_folder, 'students.json');
            Log.info('path: ' + path);
            var sbuf = fs.readFileSync(spath);
            var sdata = JSON.parse(sbuf.toString());
            Log.info('student data ready!');

            var rows: any = [];
            var delivs = ["d0", "d1", "d2", "d3", "d4", "d5", "lab", "mt", "final"];
            var rHead: any = [];
            rHead.push("Name");
            rHead.push("st #");
            rHead = rHead.concat(delivs);
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
                var sgrades = student.grades;
                for (var d of delivs) {
                    var val: string|number = '';
                    for (var g of sgrades) {
                        if (g.assnId === d) {
                            val = Number.parseInt(g.grade);
                        }
                    }
                    row.push(val);
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
