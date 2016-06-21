/**
 * Created by rtholmes on 14/06/2016.
 */

import restify = require('restify');

//import {EchoController} from "./Controller";
//import {SayController} from "./Controller";

module portal.rest {
    export class RouteHandler {

        static getEcho(req:restify.Request, res:restify.Response, next:restify.Next) {
            console.log('RoutHandler::getEcho(..) - params: ' + JSON.stringify(req.params));
            // validate params
            if (typeof req.params.val !== 'undefined') {
                // let routeCtrl = new EchoController();

                // let ret = routeCtrl.echo(req.params.val);
                let ret = '';
                res.json(200, {msg: ret});
            } else {
                res.send(403);
            }

            return next();
        }

        static putSay(req:restify.Request, res:restify.Response, next:restify.Next) {
            console.log('RouteHandler::putSay(..) - params: ' + JSON.stringify(req.params));
            try {
                // validate params
                if (typeof req.params.val !== 'undefined') {
                    // let routeCtrl = new SayController();

                    let id = req.params.val;
                    let val = JSON.parse(req.body);

                    // let retVal = routeCtrl.say(id, val);
                    let retVal = 'foo';
                    res.json(200, retVal);
                } else {
                    res.send(403);
                }
            } catch (err) {
                console.log('RouteHandler::putSay(..) - ERROR: ' + err.message);
                res.send(404);
            }

            return next();
        }
    }
}
