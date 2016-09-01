/**
 * Created by rtholmes on 15-10-31.
 */


// https://www.npmjs.com/package/icedfrisby 
// https://httpstatuses.com/

import Server from '../src/rest/Server';
import Log from "../src/Util";

var expect = require('chai').expect;

var frisby = require('icedfrisby');
var Joi = require('joi');


describe("Echo Service", function () {

    const URL = 'http://localhost:4321/';
    var server:Server;

    beforeEach(function (done) {

        server = new Server(4321);
        server.start().then(function (val:boolean) {
            Log.test("EchoService::beforeEach() - started: " + val);
            done();
        }).catch(function (err) {
            Log.error("EchoService::beforeEach() - ERROR: " + err);
            done();
        });
    });

    afterEach(function (done) {
        server.stop().then(function (val:boolean) {
            Log.test("EchoService::afterEach() - closed: " + val);
            done();
        }).catch(function (err) {
            Log.error("EchoService::afterEach() - ERROR: " + err);
            done();
        });
    });


    frisby.globalSetup({ // globalSetup is for ALL requests
        request: {
            // headers: { 'X-Auth-Token': 'fa8426a0-8eaf-4d22-8e13-7c1b16a9370c' }
            inspectOnFailure: true // or false
        }
    });

    Log.info('frisby create');

    frisby.create('Should not be able to echo without a msg')
        .get(URL + 'echo/foo')
        .inspectRequest('Request: ')
        .inspectStatus('Response status: ')
        .inspectBody('Response body: ')
        .expectStatus(200)
        .expectJSONTypes({
            msg: Joi.string()
        }).expectJSON({
        msg: 'foo...foo'
    }).toss();

    frisby.create('Should not be able to echo without a msg')
        .get(URL + 'echo/')
        .inspectRequest('Request: ')
        .inspectStatus('Response status: ')
        .inspectBody('Response body: ')
        .expectStatus(400)
        .expectJSONTypes({
            error: Joi.string()
        }).afterJSON(function (json:any) {
        expect(json.error.length).to.be.greaterThan(0);
    }).toss();


    frisby.create('Should not be able to hit the wrong port')
        .get('http://localhost:4322/echo/foo')
        .inspectRequest('Request: ')
        //.inspectStatus('Response status: ')
        //.inspectBody('Response body: ')
        .expectStatus(599)
        .toss();

});


