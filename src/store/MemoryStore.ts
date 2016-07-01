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


        let admins:any = [];
        for (var admin of this.admins) {
            let teamIds:string[] = [];
            for (var team of admin.teams) {
                teamIds.push(team.id);
            }
            admins.push({id: admin.id, name: admin.name, teams: teamIds});
        }

        let teams:any = [];
        for (var team of this.teams) {
            let memberIds:string[] = [];
            for (var member of team.members) {
                memberIds.push(member.id);
            }
            teams.push({id: team.id, name: team.name, members: memberIds});
        }

        let grades:any = [];
        for (var grade of this.grades) {
            grades.push({student: grade.student.id, deliverable: grade.deliverable.id, value: grade.value})
        }


        let store = {
            admins:       admins,
            students:     this.students, // no external refs
            deliverables: this.deliverables, // no external refs
            teams:        teams,
            grades:       grades
        };

        let storeVal = JSON.stringify(store);
        Log.trace('TestStore::persist() - done; data: ' + storeVal);

        // TODO: this should write to disk

        return storeVal;
    }

    hydrate(val:string):void {
        Log.trace('TestStore::hydrate() - start');
        let inObj = JSON.parse(val);

        // TODO: should the local fields be cleared first?

        this.students = inObj.students; // no external refs

        for (var team of inObj.teams) {
            // get the real students
            let members:Student[] = [];
            for (var member of team.members) {
                for (var s of this.students) {
                    if (member === s.id) {
                        members.push(s);
                    }
                }
            }
            this.teams.push({id: team.id, name: team.name, members: members});
        }

        for (var admin of inObj.admins) {

            // get the real team
            let teams:Team[] = [];
            for (var t of admin.teams) {
                for (var myTeam of this.teams) {
                    if (myTeam.id === t) {
                        teams.push(myTeam);
                    }
                }
            }
            this.admins.push({id: admin.id, name: admin.name, teams: teams});
        }

        this.deliverables = inObj.deliverables; // no external refs

        for (var grade of inObj.grades) {

            // get the real deliverable
            let deliverable:Deliverable = null;
            for (var d of this.deliverables) {
                if (d.id === grade.deliverable) {
                    deliverable = d;
                }
            }


            // get the real student
            let student:Student = null;
            for (var s of this.students) {
                if (s.id === grade.student) {
                    student = s;
                }
            }

            if (student === null) {
                Log.warn("MemoryStore::hydrate(..) - null student: " + JSON.stringify(grade));
            }
            if (deliverable === null) {
                Log.warn("MemoryStore::hydrate(..) - null deliverable: " + JSON.stringify(grade));
            }
            if (student !== null && deliverable !== null) {
                // only add a grade if it's any good
                this.grades.push({student: student, deliverable: deliverable, value: grade.value});
            }

        }

        Log.trace('TestStore::hydrate() - done');
    }


    getAdmin(id:string):Admin {
        Log.trace('TestStore::getAdmin( ' + id + ' )');

        for (var admin of this.admins) {
            if (admin.id === id) {
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


    getStudent(id:string):Student {
        Log.trace('TestStore::getStudent( ' + id + ' )');

        for (var student of this.students) {
            if (student.id === id) {
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
            if (s.id === student.id) {
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
            if (team.id === teamId) {
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

            if (t.id === team.id) {
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
            if (g.student.id === student.id) {
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
// }