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


/// <reference path="../../lib/corejs.d.ts" />

import restify = require('restify');
import Log from "../Util";
import RouteHandler from './RouteHandler';


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

                //restify.CORS.ALLOW_HEADERS.push('authorization');
                //rest.use(restify.CORS());
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
