/**
 * Created by rtholmes on 2016-10-28.
 */

import Log from '../Util';
let request = require('request');
import { config } from '../../config/env';
let rp = require('request-promise-native');

import { Helper } from '../Util';
import async = require('async');
import _ = require('lodash');
import fs = require('fs');

const pathToRoot = __dirname.substring(0, __dirname.lastIndexOf('classportal/')) + 'classportal/';

export default class GradeExporter {

  public export() {
    try {
      let path = pathToRoot.concat(config.private_folder, 'grades.json');
      Log.info('path: ' + path);
      let buf = fs.readFileSync(path);
      Log.info('grade data ready!');

      let data = JSON.parse(buf.toString());
      let spath = pathToRoot.concat(config.private_folder, 'students.json');
      Log.info('path: ' + path);
      let sbuf = fs.readFileSync(spath);
      let sdata = JSON.parse(sbuf.toString());
      Log.info('student data ready!');

      let rows: any = [];
      let delivs = ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'lab', 'mt', 'final'];
      let rHead: any = [];
      rHead.push('Name');
      rHead.push('st #');
      rHead = rHead.concat(delivs);
      rows.push(rHead);

      for (let student of data) {
        let sid = Number.parseInt(student.sid);

        let row: any = [];

        for (let s of sdata) {
          if (Number(s.sid) === sid) {
            row.push(s.firstname + ' ' + s.lastname);
          }
        }

        row.push(sid);
        let sgrades = student.grades;
        for (let d of delivs) {
          let val: string | number = '';
          for (let g of sgrades) {
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
      for (let row of rows) {
        let txt = JSON.stringify(row);
        txt = txt.replace('[', '');
        txt = txt.replace(']', '');
        console.log(txt);
      }
    } catch (err) {
      Log.error('error: ' + err);
    }
  }
}

let gec = new GradeExporter();
gec.export();
