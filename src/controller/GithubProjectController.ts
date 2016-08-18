/**
 * Created by rtholmes on 2016-06-19.
 */

import Log from "../Util";
var request = require('request');

// TODO: migrate to rp: https://www.npmjs.com/package/request-promise
var rp = require('request-promise-native');

export default class GithubProjectController {

    private GITHUB_AUTH_TOKEN = 'token 9c6e586170923383fe5bec2a295c1c38d80e1221';
    private GITHUB_USER_NAME = 'rtholmes';
    // bruce
    // private GITHUB_AUTH_TOKEN = 'token 8c017236d0429fe33d8aed1ea435e6777aaeab88';
    // private GITHUB_USER_NAME = 'zhihaoli';

    private org = "CS410-2015Fall";
    private db: any;

    /*
     public createRepo(repoName: string): Promise<string> {
     let ctx = this;

     Log.info("GithubProjectController::createRepo(..) - start");
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
     Log.error("GithubProjectController::createRepo(..) - ERROR: " + JSON.stringify(body));
     reject(body);
     }
     }
     );
     });
     }
     */
    public createRepo(repoName: string): Promise<string> {
        let ctx = this;

        Log.info("GithubProjectController::createRepo(..) - start");
        return new Promise(function (fulfill, reject) {

            var options = {
                method: 'POST',
                uri: 'https://api.github.com/orgs/' + ctx.org + '/repos',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME,
                    'Accept': 'application/json'
                },
                body: {
                    name: repoName,
                    private: true,
                    auto_init: true
                },
                json: true
            };

            rp(options).then(function (body: any) {
                let url = body.html_url;
                Log.info("GithubProjectController::createRepo(..) - success; url: " + url);
                fulfill(url);
            }).catch(function (err: any) {
                Log.error("GithubProjectController::createRepo(..) - ERROR: " + JSON.stringify(err));
                reject(err);
            });

        });
    }

    /**
     * Deletes a repo from the organization.
     *
     * @param repoName
     * @returns {Promise<T>}
     */
    public deleteRepo(repoName: string): Promise<string> {
        let ctx = this;

        Log.info("GithubProjectController::deleteRepo(..) - start");
        return new Promise(function (fulfill, reject) {

            var options = {
                method: 'DELETE',
                uri: 'https://api.github.com/repos/' + ctx.org + '/' + repoName,
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME,
                    'Accept': 'application/json'
                }
            };

            rp(options).then(function (body: any) {
                Log.info("GithubProjectController::deleteRepo(..) - success; body: " + body);
                fulfill(body);
            }).catch(function (err: any) {
                Log.error("GithubProjectController::deleteRepo(..) - ERROR: " + JSON.stringify(err));
                reject(err);
            });

        });
    }

    /**
     * Creates a team for a groupName (e.g., cpsc310_team1)
     *
     * @param groupName
     * @returns {Promise<T>}
     */
    public createTeam(groupName: string): Promise<number> {
        let ctx = this;

        Log.info("GithubProjectController::createTeam(..) - start");
        return new Promise(function (fulfill, reject) {


            var options = {
                method: 'POST',
                uri: 'https://api.github.com/orgs/' + ctx.org + '/teams',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME,
                    'Accept': 'application/json'
                },
                body: {
                    name: groupName
                },
                json: true
            };

            rp(options).then(function (body: any) {
                let id = body.id;
                Log.info("GithubProjectController::createTeam(..) - success: " + id);
                fulfill(id);
            }).catch(function (err: any) {
                Log.error("GithubProjectController::createTeam(..) - ERROR: " + err);
                reject(err);
            });
            /*
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

             }
             );
             */
        });
    }

    /**
     * Deletes a repo from the organization.
     *
     * @param repoName
     * @returns {Promise<T>}
     */
    /*
     public deleteTeam(teamName: string): Promise<string> {
     let ctx = this;

     Log.info("GithubProjectController::deleteTeam(..) - start");
     return new Promise(function (fulfill, reject) {

     var options = {
     method: 'DELETE',
     uri: 'https://api.github.com/teams/' + teamName,// TODO: needs to be a team id
     headers: {
     'Authorization': ctx.GITHUB_AUTH_TOKEN,
     'User-Agent': ctx.GITHUB_USER_NAME,
     'Accept': 'application/json'
     }
     };

     rp(options).then(function (body: any) {
     Log.info("GithubProjectController::deleteTeam(..) - success; body: " + body);
     fulfill(body);
     }).catch(function (err: any) {
     Log.error("GithubProjectController::deleteTeam(..) - ERROR: " + JSON.stringify(err));
     reject(err);
     });

     });
     }
     */

    /**
     * NOTE: needs the team Id, not the team name!
     *
     * @param teamId
     * @param repoName
     * @returns {Promise<T>}
     */
    public addTeamToRepo(teamId: number, repoName: string) {
        let ctx = this;
        Log.info("GithubProjectController::addTeamToRepo( " + teamId + ", " + repoName + " ) - start");
        return new Promise(function (fulfill, reject) {

            var options = {
                method: 'PUT',
                uri: 'https://api.github.com/teams/' + teamId + '/repos/' + ctx.org + '/' + repoName,
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME,
                    'Accept': 'application/json'
                }
            };

            rp(options).then(function (body: any) {
                Log.info("GithubProjectController::addTeamToRepo(..) - success: " + body);
                // onSuccess(body);
                fulfill(body);
            }).catch(function (err: any) {
                Log.error("GithubProjectController::addTeamToRepo(..) - ERROR: " + err);
                reject(err);
            });
        });
    }

    public addMembersToTeam(teamId: number, members: string[]) {
        let ctx = this;
        Log.info("GithubProjectController::addMembersToTeam(..) - start");

        return new Promise(function (fulfill, reject) {
            let promises: any = [];
            for (var member of members) {
                Log.info("GithubProjectController::addMembersToTeam(..) - adding member: " + member);

                let opts = {
                    method: 'PUT',
                    uri: 'https://api.github.com/teams/' + teamId + '/memberships/' + member,
                    headers: {
                        'Authorization': ctx.GITHUB_AUTH_TOKEN,
                        'User-Agent': ctx.GITHUB_USER_NAME,
                        'Accept': 'application/json'
                    },
                    json: true
                };
                promises.push(rp(opts));
            }

            Promise.all(promises).then(function (results: any) {
                Log.info("GithubProjectController::addMembersToTeam(..) - success: " + results);
                fulfill(results);
            }).catch(function (err: any) {
                Log.error("GithubProjectController::addMembersToTeam(..) - ERROR: " + err);
                reject(err);
            });
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
