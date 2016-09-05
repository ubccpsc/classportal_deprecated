import request = require('request');
import Log from '../Util';
import fs = require('fs');
import Helper from '../rest/Helper';
var _ = require('lodash');

const pathToRoot = __dirname.substring(0, __dirname.lastIndexOf('classportalserver/')) + 'classportalserver/';
var config = require(pathToRoot + 'config.json');

export default class RegisterController {
    
    static register(user: string, sid: string, csid: string, authcode: string, callback: any) {
        var validCSID = /^[a-z][0-9][a-z][0-9]$/;
        var validSID = /^\d{8}$/;
        
        //first, test CSID and SID regex
        Log.trace("registerAccount| Testing CSID and SID regex..");
        if (validCSID.test(csid) && validSID.test(sid)) {
            Log.trace("registerAccount| Valid regex.");

            Helper.returnFile("students.json", function (error: any, data: any) {
                if (!error && data.length > 0) {
                    var studentsObject = JSON.parse(data);
                    Log.trace("registerAccount| Classlist retrieved. There are " + (studentsObject.length) + " students in this class.");
                    
                    //check if csid exists
                    Log.trace("registerAccount| Checking CSID..");
                    for (var index = 0; index < studentsObject.length; index++) {
                        if (csid == studentsObject[index].csid) {
                            //check if sid exists
                            Log.trace("registerAccount| CSID Match! Checking SID..");
                            if (sid == studentsObject[index].sid) {
                                Log.trace("registerAccount| SID Match! Updating student information..");
                                
                                //error: can't use "user" to identify
                                Helper.updateUser("students.json", sid, { github_name: user }, function (error:any, data:any) {
                                    if (!error && data.length > 0) {
                                        Log.trace("registerAccount| Account updated successfully. Sending user to homepage.");
                                        return callback(null, "success");
                                    }
                                    else {
                                        Log.trace("registerAccount| Error updating file!");
                                        return callback("error updating file", null);
                                    }
                                });
                            }
                            else {
                                Log.trace("registerAccount| Error: Invalid CSID/SID combination.");
                                return callback("error", null);
                            }
                        }
                    }
                    Log.trace("registerAccount| Error: Invalid CSID.");
                    return callback("error", null);
                }
                else {
                    Log.trace("registerAccount| File read error.");
                    return callback("error", null);
                }
            });
        }
        else {
            Log.trace("registerAccount| Error: Invalid SID or CSID regex.");
            return callback("error", null);
        }
    }
}