/*
import chai = require('chai');
import restify = require('restify');
import sinon = require('sinon');
var http = require('http');
*/

/**
 * Created by rtholmes on 15-10-31.
 */

/* /// <reference path="../lib/jasmine.d.ts" />*/

import Admin from '../src/model/Admin';
import Grade from '../src/model/Grade';
import Store from '../src/store/Store';
import MemoryStore from '../src/store/MemoryStore';
import Log from "../src/Util";

// import expect from 'expect';
// var expect = require('expect');

var expect = require('chai').expect;


describe("MemoryStore", function () {

    var store:Store;

    beforeEach(function () {

        store = new MemoryStore();
    });

    it("Should be able to get a valid admin", function () {
        let admin = store.getAdmin('prof@gmail.com');
        expect(admin).not.to.equal(null);
        expect(admin.getName()).to.equal('prof');
        expect(admin.getTeams().length).to.equal(0);
    });

    it("Should be able to get a valid admin with students", function () {
        let admin = store.getAdmin('ta1@310.com');
        expect(admin.getTeams().length).to.equal(1);
    });

    it("Should not be able to get an invalid admin", function () {
        let admin = store.getAdmin('x9x9');
        expect(admin).to.equal(null);
    });

    it("Should be able to add / update an admin", function () {
        let admin = store.getAdmin('prof2@gmail.com');
        expect(admin).to.equal(null);

        admin = new Admin('prof2@gmail.com', 'p2', null);
        store.saveAdmin(admin);

        admin = store.getAdmin('prof2@gmail.com');
        expect(admin).not.to.equal(null);
        expect(admin.getName()).to.equal('p2');

        admin = new Admin('prof2@gmail.com', 'p2 name', null);
        store.saveAdmin(admin);
        admin = store.getAdmin('prof2@gmail.com');
        expect(admin.getName()).to.equal('p2 name');
    });


    it("Should be able to get all the students", function () {
        let students = store.getStudents();
        expect(students.length).to.equal(4);
    });

    it("Should be able to get a valid student", function () {
        let student = store.getStudent('a1a1');
        expect(student).not.to.equal(null);
        expect(student.getName()).to.equal('a1');
    });

    it("Should not be able to get an invalid student", function () {
        let student = store.getStudent('x9x9');
        expect(student).to.equal(null);
    });

    it("Should be able to get all the teams", function () {
        let teams = store.getTeams();
        expect(teams.length).to.equal(2);
    });

    it("Should be able to get a valid team", function () {
        let team = store.getTeam('t1');
        expect(team).not.to.equal(null);
        expect(team.getName()).to.equal('Team t1');
        expect(team.getMembers()).not.to.equal(null);
    });

    it("Should not be able to get an invalid team", function () {
        let team = store.getTeam(null);
        expect(team).to.equal(null);
    });

    it("Should be able to get all the deliverables", function () {
        let delivs = store.getDeliverables();
        expect(delivs.length).to.equal(6);
    });

    it("Should be able to get a valid deliverable", function () {
        let deliv = store.getDeliverable('d1');
        expect(deliv).not.to.equal(null);
        expect(deliv.name).to.equal('Deliverable 1');
        expect(deliv.url).to.equal('http://d1');
    });

    it("Should not be able to get an invalid deliverable", function () {
        let deliv = store.getDeliverable(null);
        expect(deliv).to.equal(null);
    });

    it("Should be able to get the grades for a student", function () {
        let student = store.getStudent('a1a1');
        let grades = store.getGrades(student);
        expect(grades.length).to.equal(1); // d1
        expect(grades[0].value).to.equal(88);
    });

    it("Should be able to update an existing grade on a student", function () {
        let student = store.getStudent('a1a1');
        let grades = store.getGrades(student);
        expect(grades.length).to.equal(1); // d1
        expect(grades[0].value).to.equal(88);

        let grade = grades[0];
        grade.value = 80;
        store.saveGrade(grade);

        grades = store.getGrades(student);
        expect(grades.length).to.equal(1);  // still only 1
        expect(grades[0].value).to.equal(80); // should have new value
    });


    it("Should be able to set a new grade on a student deliverable", function () {
        let deliv = store.getDeliverable('d2a');
        let student = store.getStudent('a1a1');
        let grades = store.getGrades(student);
        expect(grades.length).to.equal(1); // d1
        expect(grades[0].value).to.equal(88);

        let grade = new Grade(student, deliv, 84);
        store.saveGrade(grade);
        grades = store.getGrades(student);
        expect(grades.length).to.equal(2); // d1, d2
    });


    it("Should not be able to get a grade that does not exist", function () {
        let student = store.getStudent('d4d4');
        let grades = store.getGrades(student);
        expect(grades.length).to.equal(0);
    });

    it("Should be able to persist", function () {
        let val = (<MemoryStore>store).persist();
        Log.test('Persisted store: ' + val);
        expect(val).not.to.equal(null);
    });

    it("Should be able to hydrate", function () {
        let val = (<MemoryStore>store).persist();
        (<MemoryStore>store).hydrate(val);
        expect(true).to.equal(true);
    });
});