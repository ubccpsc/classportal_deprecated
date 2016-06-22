/**
 * Created by rtholmes on 15-10-31.
 */

import Server from '../src/rest/Server';
import Log from "../src/Util";
import {IncomingMessage} from "http";

var expect = require('chai').expect;
// var http = require('http');

var rp = require('request-promise');

describe("Echo Service", function () {

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

    it("Should be able to start the server", function (done) {

        done();
    });

    it('Should be able to echo"', function (done) {
        Log.info('starting echo');

        let msg = 'hellooooo';
        /*
        makeRequest({
            method: 'GET',
            url:    'http://localhost:4321/echo/' + msg,
            body:   ''
        }).then(function (response:XMLHttpRequest) {
            Log.info('echo resp');
            expect(response.status).to.equal(200);
            let obj = JSON.parse(response.responseText);
            expect(obj.msg).to.equal(msg + '...' + msg);
            Log.info('got echo: ' + obj.msg);
            done();
        }).catch(function (err) {
            Log.error('Error: ' + err);
            done();
        });
        */

        rp({
            method:                  'GET',
            uri:                     'http://localhost:4321/echo/' + msg,
            resolveWithFullResponse: true
        }).then(function (response:IncomingMessage) {
            Log.info('echo resp');
            expect(response.statusCode).to.equal(200);
            let obj = JSON.parse(response.body);
            expect(obj.msg).to.equal(msg + '...' + msg);
            Log.info('got echo: ' + obj.msg);
            done();
        }).catch(function (err) {
            Log.error('Error: ' + err);
            expect(true).to.equal(false);
            done();
        });
        /*
        http.get('http://localhost:4321/echo/' + msg, function (res:any) {
            var data = '';

            res.on('data', function (chunk) {
                Log.info('getting chunk');
                data += chunk;
            });

            res.on('end', function () {
                Log.info('done');
                let obj = JSON.parse(data);
                expect(typeof obj.msg).not.to.equal('undefined');
                expect(obj.msg).to.equal(msg + '...' + msg);
                done();
            });
        });
        */
    });

});


/**
 * Make a remote request and return promises for the result.
 *
 * from: http://stackoverflow.com/a/30008115/3133691
 * @param opts
 * @returns {Promise<T>}
 */
function makeRequest(opts:any):Promise<XMLHttpRequest> {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        Log.info("makeRequest(..) - url: " + opts.url);
        xhr.open(opts.method, opts.url);
        xhr.onload = function () {
            Log.trace("makeRequest(..) - onload: " + this.status);

            if (this.status >= 200 && this.status < 300) {
                resolve(xhr);
            } else {
                reject(xhr);
            }
        };
        xhr.onerror = function () {
            Log.trace("makeRequest(..) - onerror");
            reject(xhr);
        };
        xhr.ontimeout = function () {
            Log.trace("makeRequest(..) - ontimeout");
            reject(xhr);
        };
        if (opts.headers) {
            Object.keys(opts.headers).forEach(function (key) {
                Log.trace("makeRequest(..) - header: " + key + "; value: " + opts.headers[key]);
                xhr.setRequestHeader(key, opts.headers[key]);
            });
        }
        var params = opts.params;
        // We'll need to stringify if we've been given an object
        // If we have a string, this is skipped.
        let fd:FormData = new FormData();
        if (params && typeof params === 'object') {
            Object.keys(params).map(function (key) {
                fd.append(key, params[key]);
            });
        }

        if (typeof opts.body !== 'undefined') {
            Log.trace("makeRequest(..) - sending body");
            xhr.send(opts.body);
        } else {
            Log.trace("makeRequest(..) - sending formdata");
            xhr.send(fd);
        }

    });
}