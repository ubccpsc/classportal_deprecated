/**
 * Created by rtholmes on 2016-06-19.
 */
import Admin from '../model/Admin';
import Deliverable from '../model/Deliverable';
import Grade from '../model/Grade';
import Student from '../model/Student';
import Team from '../model/Team';

import Store from './Store';
import Log from '../Util';

let fs = require('fs');
let path = require('path');
let STUDENTS_FILE = path.join(__dirname, 'students.json');

// module portal.store {
export default class MemoryStore implements Store {

  private admins: Admin[] = [];
  private students: Student[] = [];
  private deliverables: Deliverable[] = [];
  private teams: Team[] = [];
  private grades: Grade[] = [];

  constructor() {
    // this.hydrate(); //not needed anymore ->: this.createData();
  }

  public createData() {
    Log.info('TestStore::createData()');

    let s1 = new Student('a1a1', 'a1', 111111, 'a@a.com');
    this.students.push(s1);
    this.students.push(new Student('b2b2', 'b2', 222222, 'b@b.org'));
    this.students.push(new Student('c3c3', 'c3', 333333, 'c@c.net'));
    this.students.push(new Student('d4d4', 'd4', 444444, 'd@d.edu'));

    let t1 = new Team('t1', 'Team t1', [this.students[0], this.students[1]]);
    let t2 = new Team('t2', 'Team t2', [this.students[2], this.students[3]]);
    this.teams.push(t1);
    this.teams.push(t2);

    let d1 = new Deliverable('d1', 'Deliverable 1', 'D1 description', 'http://d1', true, true);
    this.deliverables.push(d1);
    this.deliverables.push(new Deliverable('d2a', 'Deliverable 2 Team', 'D2 description', 'http://d2', true, true));
    this.deliverables.push(new Deliverable('d2b', 'Deliverable 2 Individual', 'D2 description', 'http://d2', false, true));
    this.deliverables.push(new Deliverable('d3', 'Deliverable 3', 'D3 description', 'http://d3', true, true));
    this.deliverables.push(new Deliverable('d4a', 'Deliverable 4 Team', 'D4 description', 'http://d4', true, true));
    this.deliverables.push(new Deliverable('d4b', 'Deliverable 4 Individual', 'D4 description', 'http://d4', false, true));

    this.grades.push(new Grade(s1, d1, 88));

    this.admins.push(new Admin('prof@gmail.com', 'prof', null));
    this.admins.push(new Admin('ta1@310.com', 'ta1', [t1]));
    this.admins.push(new Admin('ta1@310reddit.com', 'ta2', [t1, t2]));
  }

  // temp readfile function until i figure out hydrate
  public readFromJson(): any {
    fs.readFile(STUDENTS_FILE, function (err: any, data: any) {
      if (err) {
        console.error(err);
        return null;
      } else {
        return JSON.parse(data);
      }
    });
  }

  public hydrate(val: string): void {
    Log.trace('TestStore::hydrate() - start');
    let inObj = JSON.parse(val);

    // TODO: should the local fields be cleared first?

    this.students = inObj.students; // no external refs

    for (let team of inObj.teams) {
      // get the real students
      let members: Student[] = [];
      for (let member of team.members) {
        for (let s of this.students) {
          if (member === s.id) {
            members.push(s);
          }
        }
      }
      this.teams.push({ id: team.id, name: team.name, members: members });
    }

    for (let admin of inObj.admins) {

      // get the real team
      let teams: Team[] = [];
      for (let t of admin.teams) {
        for (let myTeam of this.teams) {
          if (myTeam.id === t) {
            teams.push(myTeam);
          }
        }
      }
      this.admins.push({ id: admin.id, name: admin.name, teams: teams });
    }

    this.deliverables = inObj.deliverables; // no external refs

    for (let grade of inObj.grades) {

      // get the real deliverable
      let deliverable: Deliverable = null;
      for (let d of this.deliverables) {
        if (d.id === grade.deliverable) {
          deliverable = d;
        }
      }


      // get the real student
      let student: Student = null;
      for (let s of this.students) {
        if (s.id === grade.student) {
          student = s;
        }
      }

      if (student === null) {
        Log.warn('MemoryStore::hydrate(..) - null student: ' + JSON.stringify(grade));
      }
      if (deliverable === null) {
        Log.warn('MemoryStore::hydrate(..) - null deliverable: ' + JSON.stringify(grade));
      }
      if (student !== null && deliverable !== null) {
        // only add a grade if it's any good
        this.grades.push({ student: student, deliverable: deliverable, value: grade.value });
      }

    }

    Log.trace('TestStore::hydrate() - done');
  }

  public persist(): string {
    Log.trace('TestStore::persist()');

    let admins: any = [];
    for (let admin of this.admins) {
      let teamIds: string[] = [];
      for (let team of admin.teams) {
        teamIds.push(team.id);
      }
      admins.push({ id: admin.id, name: admin.name, teams: teamIds });
    }

    let teams: any = [];
    for (let team of this.teams) {
      let memberIds: string[] = [];
      for (let member of team.members) {
        memberIds.push(member.id);
      }
      teams.push({ id: team.id, name: team.name, members: memberIds });
    }

    let grades: any = [];
    for (let grade of this.grades) {
      grades.push({ student: grade.student.id, deliverable: grade.deliverable.id, value: grade.value });
    }


    let store = {
      admins: admins,
      students: this.students, // no external refs
      deliverables: this.deliverables, // no external refs
      teams: teams,
      grades: grades
    };

    let storeVal = JSON.stringify(store);
    Log.trace('TestStore::persist() - done; data: ' + storeVal);

    // TODO: this should write to disk

    return storeVal;
  }

  public getAdmin(id: string): Admin {
    Log.trace('TestStore::getAdmin( ' + id + ' )');

    for (let admin of this.admins) {
      if (admin.id === id) {
        return admin;
      }
    }
    return null;
  }

  public saveAdmin(admin: Admin) {
    Log.trace('TestStore::saveAdmin( ' + admin + ' )');

    let exists = false;
    for (let i = 0; i < this.admins.length; i++) {
      let a = this.admins[i];
      if (a.id === admin.id) {
        exists = true;
        // update
        this.admins[i] = admin;
      }
    }
    if (exists === false) {
      this.admins.push(admin);
    }
  }

  public getStudent(id: string): Student {
    Log.trace('TestStore::getStudent( ' + id + ' )');

    for (let student of this.students) {
      if (student.id === id) {
        return student;
      }
    }
    return null;
  }

  public getStudents(): Student[] {
    Log.trace('TestStore::getStudents()');
    return this.students;
  }

  public saveStudent(student: Student) {
    Log.trace('TestStore::saveStudent( ' + student + ' )');
    let exists = false;

    for (let i = 0; i < this.students.length; i++) {
      let s = this.students[i];
      if (s.id === student.id) {
        exists = true;
        this.students[i] = student;
      }
    }
    if (exists === false) {
      this.students.push(student);
    }
  }

  public getTeam(teamId: string): Team {
    Log.trace('TestStore::getTeam( ' + teamId + ' )');
    for (let team of this.teams) {
      if (team.id === teamId) {
        return team;
      }
    }
    return null;
  }

  public getTeams(): Team[] {
    Log.trace('TestStore::getTeams()');
    return this.teams;
  }

  public saveTeam(team: Team) {
    Log.trace('TestStore::saveTeam( ' + team + ' )');
    let exists = false;

    for (let i = 0; i < this.teams.length; i++) {
      let t = this.teams[i];

      if (t.id === team.id) {
        exists = true;
        this.teams[i] = team;
      }
    }
    if (exists === false) {
      this.teams.push(team);
    }
  }

  public getDeliverable(deliverableId: string): Deliverable {
    Log.trace('TestStore::getDeliverable( ' + deliverableId + ' )');
    for (let deliverable of this.deliverables) {
      if (deliverable.id === deliverableId) {
        return deliverable;
      }
    }
    return null;
  }

  public getDeliverables(): Deliverable[] {
    Log.trace('TestStore::getDeliverables()');
    return this.deliverables;
  }

  public saveDeliverable(deliverable: Deliverable) {
    Log.trace('TestStore::saveDeliverable( ' + deliverable + ' )');
    let exists = false;
    for (let i = 0; i < this.deliverables.length; i++) {
      let d = this.deliverables[i];
      if (d.id === deliverable.id) {
        exists = true;
        this.deliverables[i] = deliverable;
      }
    }
    if (exists === false) {
      this.deliverables.push(deliverable);
    }
  }

  public getGrades(student: Student): Grade[] {
    Log.trace('TestStore::getGrades( ' + student + ' )');
    let grades: Grade[] = [];
    for (let g of this.grades) {
      if (g.student.id === student.id) {
        grades.push(g);
      }
    }
    return grades;
  }

  public saveGrade(grade: Grade) {
    Log.trace('TestStore::saveGrade( ' + grade + ' )');
    let exists = false;

    for (let i = 0; i < this.grades.length; i++) {
      let g = this.grades[i];
      if (g.student.id === grade.student.id && g.deliverable.id === grade.deliverable.id) {
        exists = true;
        this.grades[i] = grade;
      }
    }
    if (exists === false) {
      this.grades.push(grade);
    }

    if (grade.deliverable.isTeam === true) {
      Log.error('saveGrade() - NOT IMPLEMENTED for team deliverables');
    }
  }

}
