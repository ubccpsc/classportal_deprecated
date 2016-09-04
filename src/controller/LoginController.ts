/**
 * Created by rtholmes on 2016-06-19.
 */

import request = require('request');
import Log from '../Util';
import fs = require('fs');

const pathToRoot = __dirname.substring(0, __dirname.lastIndexOf('classportalserver/')) + 'classportalserver/';
var config = require(pathToRoot + 'config.json');

export default class LoginController {

    public login(user: string, pass: string): boolean {
        return false;
    }

    static requestGithubInfo(githubtoken: string, callback: any) {
        var options = {
            url: 'https://api.github.com/user',
            headers: {
                "User-Agent": "ClasslistPortal-Student",
                "Authorization": "token " + githubtoken
            }
        };
        
        Log.trace("requestGithubInfo| Requesting public info from Github..");
        request(options, callback);
    }

    static createBlankStudent(username: string, githubtoken: string, callback: any) {
        Log.trace("createBlankStudent| Creating new student: " + username);
        var filename = pathToRoot.concat(config.path_to_students);
        var file = require(filename);
        file[username] = {
            "sid": "",
            "csid": "",
            "firstname": "",
            "lastname": "",
            "githubtoken": githubtoken
        };
        
        fs.writeFile(filename, JSON.stringify(file, null, 2), function (err: any) {
            if (err) {
                Log.trace("createBlankStudent| Write error: " + err.toString());
                return;
            }
            else {
                Log.trace("createBlankStudent| New student created.");
                callback();
            }
        });
    }

    static createServerToken(username: string, admin: boolean, callback: any) {
        Log.trace("createServerToken| Generating new servertoken for user " + username);
        
        //generate unique string
        var servertoken: string = Math.random().toString(36).slice(2);

        //access file
        var filename = pathToRoot.concat(config.path_to_tokens);
        var file = require(filename);
        
        //overwrite or create
        if (admin)
            file.admins[username] = servertoken;
        else
            file.students[username] = servertoken;
        
        //step 3: write to file
        fs.writeFile(filename, JSON.stringify(file, null, 2), function (err: any) {
            if (err) {
                Log.trace("createServerToken| Write unsuccessful: " + err.toString());
                return;
            }
            else {
                Log.trace("createServerToken| Write successful! Executing callback..");
                callback(servertoken);
                return;
            }
        });
    }

}
