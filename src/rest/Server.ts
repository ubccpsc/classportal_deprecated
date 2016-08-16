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
                    //Set permissive CORS header - this allows this server to be used only as
                    //an API server in conjunction with something like webpack-dev-server.
                    res.setHeader('Access-Control-Allow-Origin', '*');    
                    //Disable caching so we'll always get the latest data
                    res.setHeader('Cache-Control', 'no-cache');
                    console.log('\n' + req.method + ' ' + req.url);
                    return next();
                });

                //parses the body of the request, so we can access req.params
                that.rest.use(restify.bodyParser());                

                /* USER DEFINED API ROUTES START HERE */
                //called upon login
                that.rest.post('/api/authenticate', checkToken);
                //called after submitting registration
                that.rest.post('/api/register', checkToken, RouteHandler.registerAccount);
                //called upon arriving at student portal
                that.rest.post('/api/getStudent', checkToken, RouteHandler.getStudent);
                that.rest.post('/api/getDeliverables', checkToken, RouteHandler.getDeliverables);
                that.rest.post('/api/getGrades', checkToken, RouteHandler.getGrades);
                //called by logout button
                that.rest.post('/api/logout', checkToken, RouteHandler.deleteServerToken);
                
                /* ADMIN API */ 
                that.rest.post('/api/getGradesAdmin', checkAdminToken, RouteHandler.getGradesAdmin);

                /* API END */
                
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

//only calls next middleware if valid admin + user + token fields are supplied 
function checkAdminToken(req: restify.Request, res: restify.Response, next: restify.Next) {
    console.log("Params: " + JSON.stringify(req.params));
    Log.trace("checkAdminToken| Checking admin token..");

    var admin: boolean = req.params.admin;
    var user: string = req.params.user;
    var token:string = req.params.token;

    //check that admin field is true, and that user & token fields are non-empty
    if ((admin == true) && !!user && !!token) {
        RouteHandler.returnFile("tokens.json", function (response: any) {
            var file = JSON.parse(response);
            var servertoken = file.admins[user];

            //check if admin token exists in database and matches the supplied token
            if (!!servertoken && (token == servertoken)) {
                Log.trace("checkAdminToken| Valid request. Continuing to next middleware..");
                Log.trace("");
                return next();
            }
            else {
                Log.trace("checkAdminToken| Error: Tokens do not match. Returning..");
                res.send(500, "bad admin request");
                return;
            }
        });
    }
    else {
        Log.trace("checkAdminToken| Error: Bad request. Returning..");
        res.send(500, "bad admin request");
        return;
    }
}

//calls next middleware if valid user + token fields are supplied.
//can be called by both regular users (students) and admins.
function checkToken(req: restify.Request, res: restify.Response, next: restify.Next) {
    console.log("Params: " + JSON.stringify(req.params));
    Log.trace("checkAdminToken| Checking admin token..");

    var admin: boolean = req.params.admin;
    var user: string = req.params.user;
    var token: string = req.params.token;
    
    //check that user & token fields are non-empty
    if (!!user && !!token) {
        //special case: if token is "temp", continue to login
        if (token == "temp") {
            //TODO: this conditional check should exist in authenticateGithub!
            if (!!req.params.authCode) {
                Log.trace("checkToken| Valid temp request. Continuing to authentication..");
                Log.trace("");
                RouteHandler.authenticateGithub(req, res, next);
                return;
            }
            else {
                Log.trace("checkToken| Error: Request missing authcode.");
                res.send(500, "badtoken");
                return;
            }
        //normal case: evaluate token and continue to next middleware if match
        } else {
            RouteHandler.returnFile("tokens.json", function (response: any) {
                var file = JSON.parse(response);
                var servertoken:string;
                
                if (admin) servertoken = file.admins[user];
                else servertoken = file.students[user];

                //the next middleware called can be accessed by both students and admins alike.
                if (!!servertoken && (token == servertoken)) {
                    Log.trace("checkToken| Valid request. Continuing to next middleware..");
                    Log.trace("");
                    return next();
                }
                else {
                    Log.trace("checkAdminToken| Error: Tokens do not match. Returning..");
                    res.send(500, "bad request");
                    return;
                }
            });
        }
    }
    else {
        Log.trace("checkToken| Error: Bad request. Returning..");
        res.send(500, "bad request");
        return;
    }
}
    
    
/*  Unused


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





*/