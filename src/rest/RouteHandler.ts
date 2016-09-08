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
     * @returns send response: {path, username, token}
     */
    static login(req: restify.Request, res: restify.Response, next: restify.Next) { 
        Log.trace("RouteHandler::userLogin| Checking authcode");
        var authcode: string = req.params.authcode;
        var csid: string = req.params.csid;
        var sid: string = req.params.sid;
        
        LoginController.login(csid, sid, authcode, function (error:any, data:any) {
            if (!error) {
                Log.trace("RouteHandler::userLogin| Login success. Response: " + JSON.stringify(data));
                return res.send(200, data);
            }
            else {
                Log.trace("RouteHandler::userLogin| Failed to login. Returning");
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
     * @returns send response: {boolean}
     */
    static checkRegistration(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("RouteHandler::checkRegistration| Checking valid ID");
        var csid: string = req.params.csid;
        var sid: string = req.params.sid;

        LoginController.checkRegistration(csid, sid, function (error: any, success: boolean) {
            if (!error && success) {
                Log.trace("checkRegistration| Success. Continue to login");
                return res.send(200, "success");
            }
            else {
                Log.trace("checkRegistration| Error: Bad info");
                return res.send(500, "invalid info");
            }
        });
    }

    /**
     * User logout process
     * Handled by LoginController
     *
     * @param username
     * @returns send response: {boolean}
     */    
    static logout(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("RouteHandler::userLogout| Logging out user: " + username);
        var username: string = req.header("username");
        
        LoginController.logout(username, function (error: any, success: boolean) {
            if (!error && success) {
                Log.trace("RouteHandler::userLogout| Log out successful.");
                return res.send(200, "success");
            }
            else {
                Log.trace("RouteHandler::userLogout| Log out unsuccessful.");
                return res.send(500, "error");
            }
        });
    }

    /**
     * Load all files required by student portal.
     * Handled by LoginController
     *
     * @param username
     * @returns send response: object containing files needed for student portal
     */
    static loadStudentPortal(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("RouteHandler::loadStudentPortal| Getting files for student portal");
        var username = req.header('username');
        
        LoginController.loadStudentPortal(username, function end(error: any, data: any) {
            if (!error) {
                Log.trace("RouteHandler::loadStudentPortal| Sending files.");
                return res.send(200, data);
            }
            else {
                Log.trace("RouteHandler::loadStudentPortal| Error getting files.");
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
     * @returns send response: {admin object, students file, teams file, deliverables file}
     */
    static loadAdminPortal(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("RouteHandler::loadAdminPortal| Getting files for admin portal");
        var username = req.header('username');
        
        LoginController.loadAdminPortal(username, function end(error: any, data: any) {
            if (!error) {
                Log.trace("RouteHandler::loadAdminPortal| Sending files.");
                return res.send(200, data)
            }
            else {
                Log.trace("RouteHandler::loadAdminPortal| Error getting files.");
                return res.send(500, "error");
            }
        });
    }

    /**
     * Update database based on new classlist.csv
     * Handled by AdminController
     *
     * @param csv
     * @returns send response: 
     */
    static updateClasslist(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("RouteHandler::updateClasslist| Received new classlist.");
        //???
        var csv = require(req.files[0].path);
        
        AdminController.updateClasslist(csv, function (error: any, data: any) {
            if (!error) {
                return res.send(200, "success");
            }
            else {
                return res.send(500, "error");
            }
        });
    }

    /**
     * Create new team process.
     * Handled by TeamController
     *
     * @param 
     * @returns send response
     */
    static createTeam(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("createTeam| Creating new team");
        var username: string = req.header('username');
        var admin: string = req.header('admin');
        var nameArray: any[] = req.params.newTeam;
        
        //todo: what is admin used for?
        TeamController.createTeam(username, admin, nameArray, function (error: any, data: any) {
            if (!error) {
                Log.trace("createTeam| Success! New team id: " + data);
                return res.send(200, "success");
            }
            else {
                Log.trace("createTeam| Error");
                return res.send(500, "error");
            }
        });
    }
}