/**
 * Created by rtholmes on 2016-06-19.
 */

import restify = require('restify');
import Log from "../Util";
import {Helper} from "../Util";
import RouteHandler from './RouteHandler';
import _ = require('lodash');
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

                    //for post requests, print headers and params
                    if (req.method === 'POST') {
                        console.log("Username: " + req.header('username') + " | Token: " + req.header('token') + " | Admin: " + req.header('admin'));
                        console.log("Params: " + JSON.stringify(req.params) + "\n----------------------------------------------------");
                    }
                    return next();
                });
                
                /* Routes acccessible by TEMP users only */
                //called upon login
                that.rest.post('/api/login', requireTempToken, RouteHandler.login);
                that.rest.post('/api/register', requireTempToken, RouteHandler.checkRegistration);

                /* Routes acccessible by STUDENT or ADMIN users */
                that.rest.post('/api/logout', requireToken, RouteHandler.logout);
                that.rest.post('/api/loadStudentPortal', requireToken, RouteHandler.loadStudentPortal);
                that.rest.post('/api/createTeam', requireToken, RouteHandler.createTeam);

                /* Routes acccessible by ADMIN users only */
                that.rest.post('/api/loadAdminPortal', requireAdmin, requireToken, RouteHandler.loadAdminPortal);
                that.rest.post('/api/submitClasslist', requireAdmin, requireToken, RouteHandler.updateClasslist);

                //serve static css and js files
                that.rest.get(/\w+\.(?:(js)|(css)|(png))/, restify.serveStatic({
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

//calls next middleware only if temp username/token supplied
function requireTempToken(req: restify.Request, res: restify.Response, next: restify.Next) {
    Log.trace("checkTempToken| Checking token..");
    var username: string = req.header('username');
    var token: string = req.header('token');
    
    if (username === "temp" && token === "temp") {
        Log.trace("checkTempToken| Valid temp request! Continuing to authentication..\n----------------------------------------------------");
        return next();
    }
    else {
        Log.trace("checkTempToken| Error: Bad request. Returning..");
        return res.send(500, "bad request");
    }
}

//calls next middleware only if valid student or admin token is supplied
function requireToken(req: restify.Request, res: restify.Response, next: restify.Next) {
    Log.trace("checkToken| Checking token..");
    var username: string = req.header('username');
    var token: string = req.header('token');
    var admin: string = req.header('admin');
    
    if (!!username && !!token) {
        Helper.readFile("tokens.json", function (error: any, data: any) {
            if (!error) {
                var file = JSON.parse(data);
                var userIndex:number = _.findIndex(file, { 'username': username });
                var servertoken: string = file[userIndex].servertoken;

                if (!!servertoken && (token === servertoken)) {
                    Log.trace("checkToken| Tokens match! Continuing to next middleware..\n----------------------------------------------------");
                    return next();
                }
                else {
                    Log.trace("checkToken| Error: Tokens do not match (" + token + ":" + servertoken + ") Returning..");
                    return res.send(500, "bad request");
                }
            }
            else {
                Log.trace("checkToken| Could not read file! Returning..");
                return res.send(500, "Error reading tokens.json");
            }
        });
    }
    else {
        Log.trace("checkToken| Error: Bad request. Returning..");
        return res.send(500, "bad request");
    }
}

//calls next middleware only if valid admin field is supplied
//todo: verify username as well?
function requireAdmin(req: restify.Request, res: restify.Response, next: restify.Next) {
    Log.trace("requireAdmin| Checking admin status..");  
    var admin: string = req.header('admin')
    
    if (admin === "true") {
        Log.trace("requireAdmin| Valid admin field. Continuing to next middleware..\n----------------------------------------------------");
        return next();
    }
    else {
        Log.trace("requireAdmin| Missing admin field. Returning..");
        return res.send(500, "permission denied");
    }
}