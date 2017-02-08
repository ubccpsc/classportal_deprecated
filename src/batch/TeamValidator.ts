/**
 * Created by rtholmes on 2016-10-28.
 */

import Log from '../Util';
import { config } from '../../config/env';

import _ = require('lodash');
import fs = require('fs');

const pathToRoot = __dirname.substring(0, __dirname.lastIndexOf('classportal/')) + 'classportal/';

/**
 * There is currently a bug whereby students can be put in multiple groups (e.g., if they form the teams at the same time).
 * This deletes the extra groups. It is probably a good idea to run this from time to time, especially before any GitHub projects are created.
 */
export default class TeamValidator {

  public validateTeams(deleteHighest: boolean) {
    try {

      let spath = pathToRoot.concat(config.private_folder, 'students.json');
      // var spathTmp = pathToRoot.concat(config.private_folder, 'students2.json');
      Log.info('path: ' + spath);
      let sbuf = fs.readFileSync(spath);
      let studentData = JSON.parse(sbuf.toString());
      Log.info('student data ready!');

      let tpath = pathToRoot.concat(config.private_folder, 'teams.json');
      // var tpathTmp = pathToRoot.concat(config.private_folder, 'teams2.json');
      Log.info('path: ' + spath);
      let tbuf = fs.readFileSync(tpath);
      let teamData = JSON.parse(tbuf.toString());
      Log.info('team data ready!');

      let noTeam = 0;
      let bigTeam = 0;
      let rightTeam = 0;

      let teamsToFix: any[] = [];
      let bigTeamIds: number[] = [];
      for (let student of studentData) {
        let sid: string = student.sid;
        let studentTeams: any[] = [];

        for (let team of teamData) {
          if (team.members.indexOf(sid) >= 0) {
            studentTeams.push(team);
          }
        }

        if (studentTeams.length === 0) {
          // Log.trace('no team for: ' + sid);
          noTeam++;
        } else if (studentTeams.length === 1) {
          // Log.trace('one team for: ' + sid);
          rightTeam++;
        } else if (studentTeams.length > 1) {
          Log.warn('multiple teams ( ' + studentTeams.length + ' ) for: ' + sid + '; data: ' + JSON.stringify(studentTeams));
          bigTeam++;

          // make sure we don't already know it is a dupe (e.g., from a prior member)
          let alreadyFound = true;
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

      Log.info('===');
      Log.info('===');
      Log.info('No team: ' + noTeam);
      Log.info('Big team people: ' + bigTeam + '; big teams: ' + teamsToFix.length);  // each person will be duplicated
      Log.info('Right team: ' + rightTeam);
      Log.info('===');
      Log.info('===');

      Log.info('teams length before: ' + teamData.length);
      Log.info('student length before: ' + studentData.length);

      for (let teamList of teamsToFix) {

        teamList.sort(function (a: any, b: any) {
          return a.id - b.id;
        });
        // console.log(JSON.stringify(teamList));

        if (teamList.length === 2) {
          let teamToKeep = teamList[0];
          let teamToRemove = teamList[1];

          // make sure _all_ of the team members are the same!
          let allMembersSame = _.isEqual(teamToKeep.members.sort(), teamToRemove.members.sort());

          if (allMembersSame === true) {
            Log.info('Keeping team: ' + teamToKeep.id + '; removing team: ' + teamToRemove.id);

            // remove from team list
            _.remove(teamData, function (n: any) {
              return n.id === teamToRemove.id;
            });

            // this is out of an abundance of caution; just make sure all students in teams have this flag set
            for (let memberSid of teamToKeep.members) {
              let sIndex: number = _.findIndex(studentData, { 'sid': memberSid });
              // Log.trace('sid index: ' + sIndex + "; hasTeam: " + studentData[sIndex].hasTeam);
              studentData[sIndex].hasTeam = true;
            }
          } else {
            Log.warn('All the team members are not the same!; data: ' + JSON.stringify(teamList));
          }
        } else {
          throw new Error('Cannot handle teams of size: ' + teamList.length);
        }
      }

      // make sure all people on teams have their hasTeam flag set to true
      for (let team of teamData) {
        // this is out of an abundance of caution; just make sure all students in teams have this flag set
        for (let memberSid of team.members) {
          let sIndex: number = _.findIndex(studentData, { 'sid': memberSid });
          // Log.trace('sid index: ' + sIndex + "; hasTeam: " + studentData[sIndex].hasTeam);
          if (studentData[sIndex].hasTeam === false) {
            Log.info('Student in team but flag was false: ' + JSON.stringify(studentData[sIndex]) + '; team: ' + JSON.stringify(team));
            studentData[sIndex].hasTeam = true;
          }
        }
      }

      Log.info('teams length: ' + teamData.length);
      Log.info('student length: ' + studentData.length);

      if (deleteHighest === true) {
        fs.writeFileSync(spath, JSON.stringify(studentData, null, 2));
        fs.writeFileSync(tpath, JSON.stringify(teamData, null, 2));
        Log.warn('Data files written');
      } else {
        Log.warn('Data files NOT changed (simulate mode)');
      }

      Log.info('Done');
    } catch (err) {
      Log.error('error: ' + err);
    }
  }
}

// The only thing to change is the boolean to validateTeams which specifies whether the changes should be written to disk.
let tv = new TeamValidator();
tv.validateTeams(true);
