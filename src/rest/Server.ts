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
                
                /*  Bundled middleware start */

                //parses the body of the request into req.params
                that.rest.use(restify.bodyParser());
                
                that.rest.use(function(req, res, next){
                    //Set permissive CORS header - this allows this server to be used only as
                    //an API server in conjunction with something like webpack-dev-server.
                    //TODO: delete??
                    res.setHeader('Access-Control-Allow-Origin', '*');

                    //Disable caching so we'll always get the latest data
                    res.setHeader('Cache-Control', 'no-cache');
                    
                    //log request method and url
                    console.log('\n' + req.method + ' ' + req.url);
                    return next();
                });

                /* User-defined middleware start */
                
                /* Requires TEMP token */
                //called upon login
                that.rest.post('/api/authenticate', logRequest, requireTempToken, RouteHandler.authenticateGithub);
                
                /* Requires STUDENT OR ADMIN token */
                //called after submitting registration
                //TODO: what's stopping an admin from calling this?
                that.rest.post('/api/register', logRequest, requireToken, RouteHandler.registerAccount);
                //called upon arriving at student portal
                that.rest.post('/api/getStudent', logRequest, requireToken, RouteHandler.getStudent);
                that.rest.post('/api/getDeliverables', logRequest, requireToken, RouteHandler.getDeliverables);
                that.rest.post('/api/getGrades', logRequest, requireToken, RouteHandler.getGrades);
                that.rest.post('/api/getClassList', logRequest, requireToken, RouteHandler.getClasslist);
                that.rest.post('/api/createTeam', logRequest, requireToken, RouteHandler.createTeam);
                
                //called by logout button
                that.rest.post('/api/logout', logRequest, requireToken, RouteHandler.deleteServerToken);
                
                /* Requires ADMIN token */
                that.rest.post('/api/submitClassList', logRequest, requireAdmin, requireToken, RouteHandler.updateClasslist);
                that.rest.post('/api/getGradesAdmin', logRequest, requireAdmin, requireToken, RouteHandler.getAllGrades);
                that.rest.post('/api/getStudentsAdmin', logRequest, requireAdmin, requireToken, RouteHandler.getAllStudents);
                that.rest.post('/api/getTeamsAdmin', logRequest, requireAdmin, requireToken, RouteHandler.getAllTeams);
                

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

function logRequest(req: restify.Request, res: restify.Response, next: restify.Next) {
    //for user-defined apis, log request auth headers and request params
    console.log("User: " + req.header('user') + " | Token: " + req.header('token') + " | Admin: " + req.header('admin'));
    console.log("Params: " + JSON.stringify(req.params));
    console.log("----------------------------------------------------");
    return next();
}

function requireTempToken(req: restify.Request, res: restify.Response, next: restify.Next) {
    Log.trace("checkTempToken| Checking token..");

    var user: string = req.header('user');
    var token: string = req.header('token');
    
    //check that user & token fields are both set to "temp"
    if (user === "temp" && token === "temp") {
        Log.trace("checkTempToken| Valid temp request! Continuing to authentication..\n----------------------------------------------------");
        return next();
    }
    else {
        Log.trace("checkTempToken| Error: Bad request. Returning..");
        res.send(500, "bad request");
        return;
    }
}

//calls next middleware if valid user + token fields are supplied.
//can be called by both regular users (students) and admins.
function requireToken(req: restify.Request, res: restify.Response, next: restify.Next) {
    Log.trace("checkToken| Checking token..");
    var user: string = req.header('user');
    var token: string = req.header('token');
    var admin: string = req.header('admin');
    
    //check that user & token fields are non-empty
    if (!!user && !!token) {
        //evaluate token and continue to next middleware if match
        RouteHandler.returnFile("tokens.json", function (error: any, data: any) {
            if (!error && data.length > 0) {
                var file = JSON.parse(data);
                var servertoken: string;
                
                //get saved token
                if (admin === "true") {
                    servertoken = file.admins[user];
                }
                else {
                    servertoken = file.students[user];
                }
                
                //the next middleware called can be accessed by both students and admins alike.
                if (!!servertoken && (token === servertoken)) {
                    Log.trace("checkToken| Tokens match! Continuing to next middleware..\n----------------------------------------------------");
                    return next();
                }
                else {
                    Log.trace("checkToken| Error: Tokens do not match (" + token + ":" + servertoken + ") Returning..");
                    res.send(500, "bad request");
                    return;
                }
            }
            else {
                Log.trace("checkToken| Could not read file! Returning..");
                res.send(500, "Error reading tokens.json");
                return;
            }
        });
    }
    else {
        Log.trace("checkToken| Error: Bad request. Returning..");
        res.send(500, "bad request");
        return;
    }
}


//only calls next middleware if valid admin field is true
function requireAdmin(req: restify.Request, res: restify.Response, next: restify.Next) {
    Log.trace("requireAdmin| Checking admin status..");
    
    var admin: string = req.header('admin')
    
    if (admin === "true") {
        Log.trace("requireAdmin| Valid admin field. Continuing to next middleware..\n----------------------------------------------------");
        return next();
    }
    else {
        Log.trace("requireAdmin| Missing admin field. Returning..");
        return next(new Error("Error: Permission denied."));
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

*/