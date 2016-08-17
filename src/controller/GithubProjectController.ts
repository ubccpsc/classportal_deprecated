/**
 * Created by rtholmes on 2016-06-19.
 */

import Log from "../Util";
var request = require('request');

// TODO: migrate to rp: https://www.npmjs.com/package/request-promise
// var rp = require('request-promise-native');

export default class GithubProjectController {

    private GITHUB_AUTH_TOKEN = 'token 8c017236d0429fe33d8aed1ea435e6777aaeab88';
    private GITHUB_USER_NAME = 'zhihaoli';

    private org = "CS410-2015Fall";
    private db: any;

    public createRepo(repoName: string): Promise<string> {
        let ctx = this;
        return new Promise(function (fulfill, reject) {

            request.post(
                {
                    url: 'https://api.github.com/orgs/' + ctx.org + '/repos',
                    headers: {
                        'Authorization': ctx.GITHUB_AUTH_TOKEN,
                        'User-Agent': ctx.GITHUB_USER_NAME,
                        'Accept': 'application/json'
                    },
                    json: {
                        name: repoName,
                        private: true,
                        auto_init: true,
                    }
                },

                function (error: any, response: any, body: any) {
                    if (!error && response.statusCode < 400) {
                        let url = body.html_url;
                        Log.info("GithubProjectController::createRepo(..) - success; url: " + url);
                        fulfill(url);
                    } else {
                        Log.error("GithubProjectController::createRepo(..) - ERROR: " + error);
                        reject(error);
                    }
                }
            );
        });
    }

    /**
     * Creates a team for a groupName (e.g., cpsc310_team1)
     *
     * @param groupName
     * @returns {Promise<T>}
     */
    public createTeam(groupName: string): Promise<string> {
        let ctx = this;
        return new Promise(function (fulfill, reject) {
            request.post(
                {
                    url: 'https://api.github.com/orgs/' + ctx.org + '/teams',
                    headers: {
                        'Authorization': ctx.GITHUB_AUTH_TOKEN,
                        'User-Agent': ctx.GITHUB_USER_NAME,
                        'Accept': 'application/json'
                    },
                    json: {
                        name: groupName
                    }
                },

                function (error: any, response: any, body: any) {
                    if (!error && response.statusCode < 400) {
                        let id = body.id;
                        Log.info("GithubProjectController::createTeam(..) - success: " + id);
                        fulfill(id);
                        // onSuccess(body.id);
                    } else {
                        Log.error("GithubProjectController::createTeam(..) - ERROR: " + response);
                        reject(error);
                    }
                    /*
                     else if (!error && onError) {
                     onError(response);
                     }
                     else if (error) {
                     console.error(error);
                     }
                     */
                }
            );
        });
    }

    public addTeamToRepo(teamName: string, groupName: string) {
        let ctx = this;

        return new Promise(function (fulfill, reject) {
            request.put(
                {
                    url: 'https://api.github.com/teams/' + teamName + '/repos/' + ctx.org + '/' + groupName,
                    headers: {
                        'Authorization': ctx.GITHUB_AUTH_TOKEN,
                        'User-Agent': ctx.GITHUB_USER_NAME,
                        'Accept': 'application/json'
                    }
                },

                function (error: any, response: any, body: any) {
                    if (!error && response.statusCode < 400) {
                        Log.info("GithubProjectController::addTeamToRepo(..) - success: " + body);
                        // onSuccess(body);
                        fulfill(body);
                    } else {
                        Log.error("GithubProjectController::addTeamToRepo(..) - ERROR: " + response);
                        reject(response);
                    }
                    /* else if (!error && onError) {
                     onError(response);
                     }
                     else if (error) {
                     console.error(error);
                     }
                     */
                }
            );
        });
    }

    public addMembersToTeam(members: string[], teamName: string) {
        let ctx = this;

        return new Promise(function (fulfill, reject) {

            for (var m of members) {
                var member = m;// m.github_id;
                if (member) {
                    request.put(
                        {
                            url: 'https://api.github.com/teams/' + teamName + '/memberships/' + member,
                            headers: {
                                'Authorization': ctx.GITHUB_AUTH_TOKEN,
                                'User-Agent': ctx.GITHUB_USER_NAME,
                                'Accept': 'application/json'
                            }
                        },

                        function (error: any, response: any, body: any) {
                            if (!error && response.statusCode < 400) {
                                // onSuccess(body);
                                Log.error("GithubProjectController::addMembersToTeam(..) - success: " + body);
                                fulfill(body);
                            } else {
                                Log.error("GithubProjectController::addMembersToTeam(..) - ERROR: " + response);
                                reject(response);
                            }
                            /*
                             else if (!error && onError) {
                             onError(response);
                             }
                             else if (error) {
                             console.error(error);
                             }
                             */

                        }
                    );
                }
            }
        });
    }

    /*
     public saveRepoUrl(url, group_id, onSuccess, onError) {
     var query = [
     'UPDATE groups SET url=?',
     'WHERE name=?',
     ';'
     ].join('');
     db.all(query, [url, group_id], function (error, result) {
     if (error) {
     console.error("2", error);
     onError(error);
     } else {
     onSuccess(result);
     }
     });
     }
     */

}
