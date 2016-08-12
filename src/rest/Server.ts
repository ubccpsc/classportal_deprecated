/**
 * Created by rtholmes on 2016-06-19.
 */

/*
 export default class Server {
 private port:number;

 constructor(port:number) {
 console.log("Server::<init>( " + port + " )");
 this.port = port;
 this.start();
 }

 private start():void {

 }
 }
 */
/*
 /// <reference path="../../lib/corejs.d.ts" />
 */

import restify = require('restify');
import Log from "../Util";
import RouteHandler from './RouteHandler';
const path = require('path');

export default class Server {

    private port:number;
    private rest:restify.Server;

    constructor(port:number) {
        Log.info("Server::<init>( " + port + " )");
        this.port = port;
    }

    public stop():Promise<boolean> {
        Log.info('Server::close()');
        let that = this;
        return new Promise(function (fulfill, reject) {
            that.rest.close(function () {
                fulfill(true);
            })
        });
    }

    public start():Promise<boolean> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                that.rest = restify.createServer({
                    name: 'classPortal'
                });
                
                that.rest.use(function(req, res, next){
                    // Set permissive CORS header - this allows this server to be used only as
                    // an API server in conjunction with something like webpack-dev-server.
                    res.setHeader('Access-Control-Allow-Origin', '*');    

                    // Disable caching so we'll always get the latest students.
                    res.setHeader('Cache-Control', 'no-cache');
                    
                    console.log(req.method + ' ' + req.url);
                    return next();
                });

                //restify.CORS.ALLOW_HEADERS.push('authorization');
                //that.rest.use(restify.CORS());
                //rest.pre(restify.pre.sanitizePath());
                //rest.use(restify.acceptParser(rest.acceptable));
                that.rest.use(restify.bodyParser());
                // rest.use(restify.queryParser());
                //rest.use(restify.authorizationParser());
                //rest.use(restify.fullResponse());                
                
                // clear; curl -is  http://localhost:4321/echo/foo
                that.rest.get('/echo/:message', RouteHandler.getEcho);

                // clear; curl -is -X PUT -d '{"key":"val","key2":"val2"}' http://localhost:3031/say/randomKey67
                // rest.put('/say/:val', portal.rest.RouteHandler.putSay);

                // clear; curl -is  http://localhost:4321/students
                that.rest.get('/api/students', RouteHandler.getStudents);
                
                //get, add, update, delete students
                that.rest.get('/api/students/:id', RouteHandler.getStudentById);
                that.rest.post('/api/students', RouteHandler.createStudent);
                //that.rest.put('/api/students/:id', RouteHandler.updateStudent);
                that.rest.del('/api/students/:id', RouteHandler.deleteStudent);

                //used for authenticating with Github
                that.rest.post('/api/authenticate', function (req: restify.Request, res: restify.Response, next: restify.Next) {
                    if (req.params.servertoken == "temp") {
                        Log.trace("servertoken: "+req.params.servertoken);
                        RouteHandler.requestGithubToken(req, res, next);
                    }
                    else if (req.params.servertoken == "legit") {
                        Log.trace("servertoken: "+req.params.servertoken);
                        RouteHandler.requestGithubToken(req, res, next);
                    }
                    else {
                        //error
                        Log.trace("servertoken: "+req.params.servertoken);
                        next();
                    }
                    
                });
                
                //get + update user info (old/unneeded?)
                //that.rest.get('/api/getUserInfo/:id', RouteHandler.getUserInfo);
                that.rest.post('/api/register', RouteHandler.registerAccount);
                
                //that.rest.post('/api/getDeliverables', RouteHandler.getDeliverables);
                that.rest.post('/api/getDeliverables', RouteHandler.validateServerToken, RouteHandler.getDeliverables);
                that.rest.post('/api/getGrades', RouteHandler.validateServerToken, RouteHandler.getGrades);
                that.rest.post('/api/getStudent', RouteHandler.validateServerToken, RouteHandler.getStudent);

                //serve static css and js files
                that.rest.get(/\w+\.[jc]ss?/, restify.serveStatic({
                    directory: __dirname.substring(0, __dirname.lastIndexOf("/src")) + '/frontend/public',
                    default: 'index.html'
                }));
                                
                //otherwise, serve index.html and let the react router decide how to render the route
                that.rest.get(/^((?!\.).)*$/, restify.serveStatic({
                    directory: __dirname.substring(0, __dirname.lastIndexOf("/src")) + '/frontend/public',
                    file: 'index.html'
                }));

                that.rest.listen(that.port, function () {
                    Log.info('Server::start() - restify listening: ' + that.rest.url);
                    fulfill(true);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
}
