/**
 * Created by rtholmes on 2016-06-19.
 */
import Admin from '../model/Admin';
import Deliverable from '../model/Deliverable';
import Grade from '../model/Grade';
import Student from '../model/Student';
import Team from '../model/Team';

import Store from './Store';
import Log from "../Util";

// module portal.store {
export default class MemoryStore implements Store {

    private admins:Admin[] = [];
    private students:Student[] = [];
    private deliverables:Deliverable[] = [];
    private teams:Team[] = [];
    private grades:Grade[] = [];

    constructor() {
        this.createData();
    }

    createData() {
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

    persist():string {
        Log.trace('TestStore::persist()');

        let store = {
            admins:       this.admins,
            students:     this.students,
            deliverables: this.deliverables,
            teams:        this.teams,
            grades:       this.grades
        };

        let storeVal = JSON.stringify(store);
        Log.trace('TestStore::persist() - done; data: ' + storeVal);

        return storeVal;
    }

    hydrate(val:string):void {
        Log.trace('TestStore::hydrate() - start');
        let inObj = JSON.parse(val);
        this.admins = inObj.admins;
        this.students = inObj.students;
        this.deliverables = inObj.deliverables;
        this.teams = inObj.teams;
        this.grades = inObj.grades;
        Log.trace('TestStore::hydrate() - done');
    }


    getAdmin(id:string):Admin {
        Log.trace('TestStore::getAdmin( ' + id + ' )');

        for (var admin of this.admins) {
            if (admin.getId() === id) {
                return admin;
            }
        }
        return null;
    }

    saveAdmin(admin:Admin) {
        Log.trace('TestStore::saveAdmin( ' + admin + ' )');

        var exists = false;
        for (var i = 0; i < this.admins.length; i++) {
            let a = this.admins[i];
            if (a.getId() === admin.getId()) {
                exists = true;
                // update
                this.admins[i] = admin;
            }
        }
        if (exists === false) {
            this.admins.push(admin);
        }
    }


    getStudent(id:string):Student {
        Log.trace('TestStore::getStudent( ' + id + ' )');

        for (var student of this.students) {
            if (student.getId() === id) {
                return student;
            }
        }
        return null;
    }

    getStudents():Student[] {
        Log.trace('TestStore::getStudents()');
        return this.students;
    }

    saveStudent(student:Student) {
        Log.trace('TestStore::saveStudent( ' + student + ' )');
        var exists = false;

        for (var i = 0; i < this.students.length; i++) {
            let s = this.students[i];
            if (s.getId() === student.getId()) {
                exists = true;
                this.students[i] = student;
            }
        }
        if (exists === false) {
            this.students.push(student);
        }
    }

    getTeam(teamId:string):Team {
        Log.trace('TestStore::getTeam( ' + teamId + ' )');
        for (var team of this.teams) {
            if (team.getId() === teamId) {
                return team;
            }
        }
        return null;
    }

    getTeams():Team[] {
        Log.trace('TestStore::getTeams()');
        return this.teams;
    }

    saveTeam(team:Team) {
        Log.trace('TestStore::saveTeam( ' + team + ' )');
        var exists = false;

        for (var i = 0; i < this.teams.length; i++) {
            let t = this.teams[i];

            if (t.getId() === team.getId()) {
                exists = true;
                this.teams[i] = team;
            }
        }
        if (exists === false) {
            this.teams.push(team);
        }
    }

    getDeliverable(deliverableId:string):Deliverable {
        Log.trace('TestStore::getDeliverable( ' + deliverableId + ' )');
        for (var deliverable of this.deliverables) {
            if (deliverable.id === deliverableId) {
                return deliverable;
            }
        }
        return null;
    }

    getDeliverables():Deliverable[] {
        Log.trace('TestStore::getDeliverables()');
        return this.deliverables;
    }

    saveDeliverable(deliverable:Deliverable) {
        Log.trace('TestStore::saveDeliverable( ' + deliverable + ' )');
        var exists = false;
        for (var i = 0; i < this.deliverables.length; i++) {
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

    getGrades(student:Student):Grade[] {
        Log.trace('TestStore::getGrades( ' + student + ' )');
        let grades:Grade[] = [];
        for (var g of this.grades) {
            if (g.student.getId() === student.getId()) {
                grades.push(g);
            }
        }
        return grades;
    }

    saveGrade(grade:Grade) {
        Log.trace('TestStore::saveGrade( ' + grade + ' )');
        var exists = false;

        for (var i = 0; i < this.grades.length; i++) {
            let g = this.grades[i];
            if (g.student.getId() === grade.student.getId() && g.deliverable.id === grade.deliverable.id) {
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
// }