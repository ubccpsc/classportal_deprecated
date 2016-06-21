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

import restify = require('restify');
import Log from "../Util";


export default class Server {

    private port:number;

    constructor(port:number) {
        console.log("Server::<init>( " + port + " )");
        this.port = port;
        this.start();
    }

    private start():void {

        var api = restify.createServer({
            name: 'classPortal'
        });

        //restify.CORS.ALLOW_HEADERS.push('authorization');
        //api.use(restify.CORS());
        //api.pre(restify.pre.sanitizePath());
        //api.use(restify.acceptParser(api.acceptable));
        api.use(restify.bodyParser());
        // api.use(restify.queryParser());
        //api.use(restify.authorizationParser());
        //api.use(restify.fullResponse());

        // clear; curl -is  http://localhost:3031/echo/foo
        // api.get('/echo/:val', portal.rest.RouteHandler.getEcho);

        // clear; curl -is -X PUT -d '{"key":"val","key2":"val2"}' http://localhost:3031/say/randomKey67
        // api.put('/say/:val', portal.rest.RouteHandler.putSay);

        let that = this;
        api.listen(this.port, function () {
            Log.info('Server::start() - restify listening on port: ' + that.port + ' at: ' + api.url);
        });
    }
}
