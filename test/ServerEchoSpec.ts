/**
 * Created by rtholmes on 15-10-31.
 */

// overview:
// https://www.sitepoint.com/promises-in-javascript-unit-tests-the-definitive-guide/
// specific:
// http://catfish.life/testing-promises-with-mocha/
import Server from '../src/rest/Server';
import Log from "../src/Util";

var expect = require('chai').expect;
var request = require('request-promise');

describe("Echo Service", function () {

    const url = 'http://localhost:4321/';

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

    it('Should be able to echo', function () {
        let msg = 'hellooooo';
        return request({
            method: 'GET',
            uri: url + 'echo/' + msg,
            json: true
        }).then(function (obj:any) {
            Log.test('Echo response: ' + obj.msg);
            expect(obj.msg).to.equal(msg + '...' + msg);
        });
    });

    it('Should not be able to echo without a msg', function () {
        let thenExecuted = false;
        return request({
            method: 'GET',
            uri: url + 'echo/',
            json: true
        }).then(function (obj:any) {
            Log.test("THEN");
            thenExecuted = true;
            expect(thenExecuted).to.equal(false);
            // throw new Error('should not happen');
        }).catch(function (err:any) {
            Log.test("CATCH");
            Log.info("Expected error: " + err);
            expect(thenExecuted).to.equal(false);
            expect(err).not.to.equal(null);
        });
    });


    it('Should not be able to hit the wrong port', function () {
        let thenExecuted = false;
        return request({
            method: 'GET',
            uri: 'http://localhost:4322/echo/foo',
            json: true
        }).then(function (obj:any) {
            Log.test("THEN");
            thenExecuted = true;
            expect(thenExecuted).to.equal(false);
            // throw new Error('should not happen');
        }).catch(function (err:any) {
            Log.test("CATCH");
            Log.info("Expected error: " + err);
            expect(thenExecuted).to.equal(false);
            expect(err).not.to.equal(null);
        });
    });


});


