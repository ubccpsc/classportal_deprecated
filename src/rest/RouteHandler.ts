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
  public static login(req: restify.Request, res: restify.Response, next: restify.Next) {
    Log.trace('RouteHandler::userLogin| Logging student in');
    let authcode: string = req.params.authcode;
    let csid: string = req.params.csid;
    let sid: string = req.params.sid;

    LoginController.login(csid, sid, authcode, function (error: any, data: any) {
      if (!error) {
        Log.trace('RouteHandler::userLogin| Succcess!');
        return res.send(200, data);
      } else {
        Log.error('RouteHandler::userLogin| Error!');
        return res.send(500, 'Login failed. (Students must first register before logging in.)');
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
  public static checkRegistration(req: restify.Request, res: restify.Response, next: restify.Next) {
    Log.trace('RouteHandler::checkRegistration| Checking for valid student info');
    let csid: string = req.params.csid;
    let sid: string = req.params.sid;

    LoginController.checkRegistration(csid, sid, function (error: any, success: boolean) {
      if (!error && success) {
        Log.trace('RouteHandler::checkRegistration| Success!');
        return res.send(200, 'success');
      } else {
        Log.error('RouteHandler::checkRegistration| Error: ' + error);
        return res.send(500, error);
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
  public static logout(req: restify.Request, res: restify.Response, next: restify.Next) {
    Log.trace('RouteHandler::userLogout| Logging user out');
    let username: string = req.header('username');

    LoginController.logout(username, function (error: any, success: boolean) {
      if (!error && success) {
        Log.trace('RouteHandler::userLogout| Success!');
        return res.send(200, 'success');
      } else {
        Log.error('RouteHandler::userLogout| Error!');
        return res.send(500, 'error');
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
  public static loadStudentPortal(req: restify.Request, res: restify.Response, next: restify.Next) {
    Log.trace('RouteHandler::loadStudentPortal| Getting files for student portal');
    let username = req.header('username');

    LoginController.loadStudentPortal(username, function end(error: any, data: any) {
      if (!error) {
        Log.trace('RouteHandler::loadStudentPortal| Success!');
        return res.send(200, data);
      } else {
        Log.error('RouteHandler::loadStudentPortal| Error!');
        return res.send(500, 'error');
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
  public static loadAdminPortal(req: restify.Request, res: restify.Response, next: restify.Next) {
    Log.trace('RouteHandler::loadAdminPortal| Getting files for admin portal');
    let username = req.header('username');

    LoginController.loadAdminPortal(username, function end(error: any, data: any) {
      if (!error) {
        Log.trace('RouteHandler::loadAdminPortal| Success!');
        return res.send(200, data);
      } else {
        Log.error('RouteHandler::loadAdminPortal| Error!');
        return res.send(500, 'error');
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
  public static updateClasslist(req: restify.Request, res: restify.Response, next: restify.Next) {
    Log.trace('RouteHandler::updateClasslist| Updating database with new classlist');
    let csv_path = req.files[0].path;

    AdminController.updateClasslist(csv_path, function (error: any, invalidStudents: string[], newStudents: string[]) {
      if (!error) {
        Log.trace('RouteHandler::updateClasslist| Success!');
        return res.send(200, 'added: ' + newStudents + 'removed: ' + invalidStudents);
      } else {
        Log.error('RouteHandler::updateClasslist| Error!');
        return res.send(500, error);
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
  public static createTeam(req: restify.Request, res: restify.Response, next: restify.Next) {
    Log.trace('RouteHandler::createTeam| Creating new team');
    let username: string = req.header('username');
    let namesArray: any[] = req.params.newTeam;
    let appName: string = req.params.appName;
    let appDescription: string = req.params.appDescription;

    TeamController.createTeam(username, namesArray, appName, appDescription, function (error: any, newTeamId: number) {
      if (!error) {
        Log.trace('RouteHandler::createTeam| Success: Created team ' + newTeamId);
        return res.send(200, newTeamId);
      } else {
        Log.error('RouteHandler::createTeam| Error: ' + error);
        return res.send(500, 'error');
      }
    });
  }

  /**
   * Disband a team.
   * Handled by TeamController
   *
   * @param teamId
   * @returns server response
   */
  public static disbandTeam(req: restify.Request, res: restify.Response, next: restify.Next) {
    Log.trace('RouteHandler::disbandTeam| Disbanding team');
    let teamId: number = parseInt(req.params.teamId, 10);

    TeamController.disbandTeam(teamId, function (error: any, response: boolean) {
      if (!error) {
        Log.trace('RouteHandler::disbandTeam| Success!');
        return res.send(200, 'success');
      } else {
        Log.error('RouteHandler::disbandTeam| Error');
        return res.send(500, 'error');
      }
    });
  }

  /**
   * Assign a TA to a team.
   * Handled by AdminController
   *
   * @param teamId
   * @returns server response
   */
  public static assignTeam(req: restify.Request, res: restify.Response, next: restify.Next) {
    let newTA: string = req.params.newTA;
    let teamId: string = req.params.teamId;
    Log.trace('RouteHandler::assignTeam| Assigning TA: ' + newTA + ' to team: ' + teamId);

    AdminController.assignTeam(newTA, teamId, function (error: any, response: boolean) {
      if (!error) {
        Log.trace('RouteHandler::assignTeam| Success!');
        return res.send(200, 'success');
      } else {
        Log.trace('RouteHandler::assignTeam| Error');
        return res.send(500, 'error');
      }
    });
  }

  /**
   * Submit a new grade.
   * Handled by AdminController
   *
   * @param student, assignment id, grade, comment
   * @returns server response
   */
  public static submitGrade(req: restify.Request, res: restify.Response, next: restify.Next) {
    let sid: string = req.params.sid;
    let assnId: string = req.params.assnId;
    let grade: string = req.params.grade;
    let comment: string = req.params.comment;
    Log.trace('RouteHandler::submitGrade(..) - ' + sid + ', ' + assnId + ', ' + grade + ', ' + comment);

    AdminController.submitGrade(sid, assnId, grade, comment, function (error: any, response: boolean) {
      if (!error) {
        Log.trace('RouteHandler::submitGrade(..) - Success!');
        return res.send(200, 'success');
      } else {
        Log.trace('RouteHandler::submitGrade(..) - Error:' + error);
        return res.send(500, error);
      }
    });
  }

  /**
   * Submit a new comment.
   * Handled by AdminController
   *
   * @param student, ratting, appId, comment
   * @returns server response
   */
  public static submitComment(req: restify.Request, res: restify.Response, next: restify.Next) {
    let username: string = req.header('username');
    let appID: string = req.params.appID;
    let ratting: string = req.params.ratting;
    let comment: string = req.params.comment;
    Log.trace('RouteHandler::submitComment(..) - ' + username + ', ' + appID + ', ' + ratting + ', ' + comment);

    TeamController.submitComment(username, appID, ratting, comment, function (error: any, response: boolean) {
      if (!error) {
        Log.trace('RouteHandler::submitComment(..) - Success!');
        return res.send(200, 'success');
      } else {
        Log.trace('RouteHandler::submitComment(..) - Error:' + error);
        return res.send(500, error);
      }
    });
  }

  /**
   * Submit all the grades for a student.
   * Handled by AdminController
   *
   * @param student
   * @returns server response
   */
  public static submitGrades(req: restify.Request, res: restify.Response, next: restify.Next) {
    let student: any = req.params.student;
    Log.trace('RouteHandler::submitGrades(..) - ' + student['sid']);

    AdminController.submitGrades(student, function (error: any, response: boolean) {
      if (!error) {
        Log.trace('RouteHandler::submitGrades(..) - Success!');
        return res.send(200, 'success');
      } else {
        Log.trace('RouteHandler::submitGrades(..) - Error:' + error);
        return res.send(500, error);
      }
    });
  }

  /**
   * Update the comments of one app/team
   * Handled by AdminController
   *
   * @param updated comments
   * @returns server response
   */
  public static updateComments(req: restify.Request, res: restify.Response, next: restify.Next) {
    let appID: string = req.params.appID;
    Log.trace('RouteHandler::updateComments(..) - ' + appID);

    let comments: any[] = req.params.comments;

    AdminController.updateComments(appID, comments, function (error: any, response: boolean) {
      if (!error) {
        Log.trace('RouteHandler::updateComments(..) - Success!');
        return res.send(200, 'success');
      } else {
        Log.trace('RouteHandler::updateComments(..) - Error:' + error);
        return res.send(500, error);
      }
    });
  }
}
