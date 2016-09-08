/**
 * Created by rtholmes on 14/06/2016.
 */

import restify = require('restify');
import Log from '../Util';
import LoginController from '../controller/LoginController';
import TeamController from '../controller/TeamController';
import AdminController from '../controller/AdminController';

export default class RouteHandler {

    /**
     * User login process.
     * Handled by LoginController
     *
     * @param authcode
     * @param csid (optional)
     * @param sid (optional)
     * @returns server response: {path, username, token}
     */
    static login(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("RouteHandler::userLogin| Logging student in");
        var authcode: string = req.params.authcode;
        var csid: string = req.params.csid;
        var sid: string = req.params.sid;

        LoginController.login(csid, sid, authcode, function (error: any, data: any) {
            if (!error) {
                Log.trace("RouteHandler::userLogin| Succcess!");
                return res.send(200, data);
            }
            else {
                Log.trace("RouteHandler::userLogin| Error!");
                return res.send(500, "user not found");
            }
        });
    }

    /**
     * Registration process
     * Handled by LoginController
     *
     * @param csid
     * @param sid
     * @returns server response: {boolean}
     */
    static checkRegistration(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("RouteHandler::checkRegistration| Checking for valid student info");
        var csid: string = req.params.csid;
        var sid: string = req.params.sid;

        LoginController.checkRegistration(csid, sid, function (error: any, success: boolean) {
            if (!error && success) {
                Log.trace("checkRegistration| Success!");
                return res.send(200, "success");
            }
            else {
                Log.trace("checkRegistration| Error!");
                return res.send(500, "invalid info");
            }
        });
    }

    /**
     * User logout process
     * Handled by LoginController
     *
     * @param username
     * @returns server response: {boolean}
     */
    static logout(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("RouteHandler::userLogout| Logging user out");
        var username: string = req.header("username");

        LoginController.logout(username, function (error: any, success: boolean) {
            if (!error && success) {
                Log.trace("RouteHandler::userLogout| Success!");
                return res.send(200, "success");
            }
            else {
                Log.trace("RouteHandler::userLogout| Error!");
                return res.send(500, "error");
            }
        });
    }

    /**
     * Load all files required by student portal.
     * Handled by LoginController
     *
     * @param username
     * @returns server response: object containing files needed for student portal
     */
    static loadStudentPortal(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("RouteHandler::loadStudentPortal| Getting files for student portal");
        var username = req.header('username');

        LoginController.loadStudentPortal(username, function end(error: any, data: any) {
            if (!error) {
                Log.trace("RouteHandler::loadStudentPortal| Success!");
                return res.send(200, data);
            }
            else {
                Log.trace("RouteHandler::loadStudentPortal| Error!");
                return res.send(500, "error");
            }
        });
    }

    /**
     * Load all files required by admin portal.
     * Handled by LoginController
     *
     * (admin check done in previous middleware functions)
     *
     * @param username 
     * @returns server response: {admin object, students file, teams file, deliverables file}
     */
    static loadAdminPortal(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("RouteHandler::loadAdminPortal| Getting files for admin portal");
        var username = req.header('username');

        LoginController.loadAdminPortal(username, function end(error: any, data: any) {
            if (!error) {
                Log.trace("RouteHandler::loadAdminPortal| Success!");
                return res.send(200, data);
            }
            else {
                Log.trace("RouteHandler::loadAdminPortal| Error!");
                return res.send(500, "error");
            }
        });
    }

    /**
     * Update database based on new classlist.csv
     * Handled by AdminController
     *
     * @param csv
     * @returns server response: {boolean}
     */
    static updateClasslist(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("RouteHandler::updateClasslist| Updating database with new classlist");
        var csv_path = req.files[0].path;

        AdminController.updateClasslist(csv_path, function (error: any, data: any) {
            if (!error) {
                Log.trace("RouteHandler::updateClasslist| Success!");
                return res.send(200, "success");
            }
            else {
                Log.trace("RouteHandler::updateClasslist| Error!");
                return res.send(500, "error");
            }
        });
    }

    /**
     * Create new team process.
     * Handled by TeamController
     *
     * @param 
     * @returns server response
     */
    static createTeam(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("createTeam| Creating new team");
        var username: string = req.header('username');
        var nameArray: any[] = req.params.newTeam;

        TeamController.createTeam(username, nameArray, function (error: any, data: any) {
            if (!error) {
                Log.trace("RouteHandler::createTeam| Success!");
                return res.send(200, "success");
            }
            else {
                Log.trace("RouteHandler::createTeam| Error");
                return res.send(500, "error");
            }
        });
    }
}