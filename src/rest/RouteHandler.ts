/**
 * Created by rtholmes on 14/06/2016.
 */

import restify = require('restify');

import MemoryStore from '../store/MemoryStore';
import EchoController from '../controller/EchoController';

import Student from '../model/Student';

import Log from '../Util';

export default class RouteHandler {

    static getEcho(req:restify.Request, res:restify.Response, next:restify.Next) {
        Log.trace('RoutHandler::getEcho(..) - params: ' + JSON.stringify(req.params));

        if (typeof req.params.message !== 'undefined' && req.params.message.length > 0) {
            let val = req.params.message;
            let ret = EchoController.echo(val);
            res.json(200, {msg: ret});
        } else {
            res.json(400, {error: 'No message provided'});
            //res.send(403);
        }

        return next();
    }

    static getStudents(req:restify.Request, res:restify.Response, next:restify.Next) {
        Log.trace('RoutHandler::getStudents(..) - params: ' + JSON.stringify(req.params));

        // TODO: make sure authorized?

        let store = new MemoryStore();
        store.createData();
        res.json(200, store.getStudents());
        return next();
    }

    static getStudentById(req:restify.Request, res:restify.Response, next:restify.Next) {
        Log.trace('RoutHandler::getStudentById(..) - params: ' + JSON.stringify(req.params));
        
        let store = new MemoryStore();
        store.createData();

        var found = store.getStudent(req.params.id);
        if (found) {
            res.json(200, found);
        }
        else {
            res.send(404, "student not found");
        }
            
        return next();
    }

    static createStudent(req:restify.Request, res:restify.Response, next:restify.Next) {
        Log.trace('RoutHandler::createStudent(..) - params: ' + JSON.stringify(req.params));

        var newStudent = new Student(req.body.id, req.body.name, req.body.studentNumber);

        let store = new MemoryStore();
        store.createData();

        if (!req.body.hasOwnProperty('id') || !req.body.hasOwnProperty('name')) {
            res.send(500, "error: not a student");
        } else {
            store.saveStudent(newStudent);
            res.send(201, "Student " + req.body.name + " created!");
        }


        return next();
    }

    static updateStudent(req:restify.Request, res:restify.Response, next:restify.Next) {
       
        return next();
    }

    static deleteStudent(req:restify.Request, res:restify.Response, next:restify.Next) {
       
        return next();
    }
    
    static githubCallback(req: restify.Request, res: restify.Response, next: restify.Next) {   
        
        return next();
    }

    static putSay(req:restify.Request, res:restify.Response, next:restify.Next) {
        Log.trace('RouteHandler::putSay(..) - params: ' + JSON.stringify(req.params));
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

