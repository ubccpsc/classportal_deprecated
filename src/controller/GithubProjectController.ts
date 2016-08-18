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
     * Lists teams. Doesn't work (dealing with pagination is irritating)
     *
     * @param teamName
     * @returns {Promise<T>}
     */
    public listTeams(): Promise<[]> {
        let ctx = this;

        Log.info("GithubProjectController::listTeams(..) - start");
        return new Promise(function (fulfill, reject) {

            var options = {
                method: 'GET',
                uri: 'https://api.github.com/orgs/' + ctx.org + '/teams?per_page=200',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME,
                    'Accept': 'application/json'
                },
                resolveWithFullResponse: true,
                json: true
            };

            rp(options).then(function (fullResponse: any) {

                // let linkString = fullResponse.headers.link;
                // let links = ctx.parseLinkHeader(linkString);

                if (typeof fullResponse.headers.link !== 'undefined') {
                    let eMessage = "GithubProjectController::creatlistTeams(..) - ERROR; pagination encountered (and not handled)";
                    Log.error(eMessage);
                    reject(eMessage);
                }
                // ignore whatever
                Log.info("GithubProjectController::creatlistTeams(..) - success: " + JSON.stringify(fullResponse.body));
                for (var team of fullResponse.body) {
                    let id = team.id;
                    let name = team.name;

                    Log.info("GithubProjectController::creatlistTeams(..) - team: " + JSON.stringify(team));
                }

                fulfill(JSON.stringify(fullResponse.body));
            }).catch(function (err: any) {
                Log.error("GithubProjectController::listTeams(..) - ERROR: " + err);
                reject(err);
            });
        });
    }

    /**
     * From: https://gist.github.com/niallo/3109252#gistcomment-1474669
     */
    private parseLinkHeader(header: string) {
        if (header.length === 0) {
            throw new Error("input must not be of zero length");
        }

        // Split parts by comma
        var parts = header.split(',');
        var links = {};
        // Parse each part into a named link
        for (var i = 0; i < parts.length; i++) {
            var section = parts[i].split(';');
            if (section.length !== 2) {
                throw new Error("section could not be split on ';'");
            }
            var url = section[0].replace(/<(.*)>/, '$1').trim();
            var name = section[1].replace(/rel="(.*)"/, '$1').trim();
            links[name] = url;
        }
        return links;
    }

    /**
     * Creates a team for a groupName (e.g., cpsc310_team1)
     *
     * @param teamName
     * @returns {Promise<T>}
     */
    public createTeam(teamName: string): Promise<number> {
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
                    name: teamName
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
        });
    }

    /**
     * NOTE: needs the team Id (number), not the team name (string)!
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
