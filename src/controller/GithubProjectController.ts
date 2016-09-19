/**
 * Created by rtholmes on 2016-06-19.
 */

import Log from "../Util";
var request = require('request');
var config = require('../../config.json');
var rp = require('request-promise-native');

import {Helper} from "../Util";
import async = require('async');
import _ = require('lodash');

/**
 * Represents a complete team that has been formed and where all members
 * are already registered (so we have their Github ids).
 */
interface GroupRepoDescription {
    team: number;
    members: string[];      // github usernames
    url?: string;           // github url (leave undefined if not set)
    projectName?: string;   // github project name
    teamName?: string;      // github team name
}

export default class GithubProjectController {

    // Use external config file so tokens are not stored in github
    private GITHUB_AUTH_TOKEN = config.githubcontroller_token;
    private GITHUB_USER_NAME = config.githubcontroller_user;

    // private ORG_NAME = "CS410-2015Fall";
    private ORG_NAME = "CS310-2016Fall";


    /**
     * get group repo descriptions
     *
     * on success, returns callback with 1st arg: null, 2nd arg: GroupRepoDescription[]
     * on error, returns callback with 1st arg: error message, 2nd arg: null
     */
    public getGroupDescriptions(): Promise<GroupRepoDescription[]> {
        Log.info("GithubProjectController::getGroupDescriptions(..) - start");
        var returnVal: GroupRepoDescription[] = [];
        var studentsFile: any;
        var teamsFile: any;

        return new Promise(function (fulfill, reject) {
            async.waterfall([
                function get_students_file(callback: any) {
                    Log.info("GithubProjectController::getGroupDescriptions(..) - get_students_file");
                    Helper.readFile("students.json", function (error: any, data: any) {
                        if (!error) {
                            studentsFile = JSON.parse(data);
                            return callback(null);
                        } else {
                            return callback("error reading students.json");
                        }
                    });
                },
                function get_teams_file(callback: any) {
                    Log.info("GithubProjectController::getGroupDescriptions(..) - get_teams_file");
                    Helper.readFile("teams.json", function (error: any, data: any) {
                        if (!error) {
                            teamsFile = JSON.parse(data);
                            return callback(null);
                        } else {
                            return callback("error reading teams.json");
                        }
                    });
                },
                function get_group_repo_descriptions(callback: any) {
                    Log.info("GithubProjectController::getGroupDescriptions(..) - get_group_repo_descriptions");

                    // for each team entry, convert team sids to usernames, then add new GroupRepoDescription to returnVal
                    for (var i = 0; i < teamsFile.length; i++) {
                        Log.trace("GithubProjectController::getGroupDescriptions(..) - teamId: " + teamsFile[i].id);

                        var sidArray: string[] = teamsFile[i].members;
                        var usernamesArray: string[] = [];

                        // convert each sid in the current team entry to a username
                        async.forEachOf(sidArray,
                            function convert_sid_to_username(sid: string, index: number, callback: any) {
                                Log.trace("GithubProjectController::getGroupDescriptions(..) - sid: " + sid);
                                var studentIndex = _.findIndex(studentsFile, {"sid": sid});

                                if (studentIndex >= 0) {
                                    var username = studentsFile[studentIndex].username;
                                    Log.trace("GithubProjectController::getGroupDescriptions(..) - username: " + username);

                                    // return error if any student does not yet have a github username
                                    if (!username) {
                                        return callback(new Error(sid + "'s github username is not set"));
                                    } else {
                                        usernamesArray[index] = username;
                                        return callback();
                                    }
                                } else {
                                    return callback(new Error("could not find sid in students.json"));
                                }
                            }, function add_new_group_repo_description(error: any) {
                                if (!error) {
                                    var newGroupRepoDescription: GroupRepoDescription = {
                                        team: teamsFile[i].id,
                                        members: usernamesArray,
                                        url: teamsFile[i].url
                                    };
                                    returnVal.push(newGroupRepoDescription);
                                } else {
                                    // return callback(error.message);
                                    // there was a problem, but this just means we won't add it to the group list
                                    Log.warn('Problem adding new repo description: ' + error.message);
                                    // return callback(null);
                                }
                            }
                        );
                    }
                    // next function 'end' won't execute until above for loop is finished runnning.
                    return callback(null);
                }
            ], function end(error: any) {
                if (!error) {
                    Log.info("GithubProjectController::getGroupDescriptions(..) - success");
                    // return parentCallback(null, returnVal);
                    fulfill(returnVal);
                } else {
                    Log.info("GithubProjectController::getGroupDescriptions(..) - error: " + error);
                    // return parentCallback(error, null);
                    reject(error);
                }
            });
        });
    }

    /**
     * Update team entry with new URL.
     *
     * @param teamId, url, callback
     * @returns callback(null) on success, callback("error") on error
     */
    public setGithubUrl(teamId: number, url: string): Promise<string> {
        Log.trace("AdminController::setGithubUrl| Updating team " + teamId + " with url: " + url);
        return new Promise(function (fulfill, reject) {
            Helper.updateEntry("teams.json", {'id': teamId}, {'url': url}, function (error: any) {
                if (!error) {
                    // success
                    //         return callback(null);
                    fulfill(url);
                } else {
                    // error
                    // return callback("error: entry not updated");
                    reject('URL not assigned for: ' + url);
                }
            });
        });
    }

    /**
     * Creates a given repo and returns its url. Will fail if the repo already exists.
     *
     * @param repoName
     * @returns {Promise<{}>}
     */
    public createRepo(repoName: string): Promise<string> {
        let ctx = this;

        Log.info("GithubProjectController::createRepo(..) - start");
        return new Promise(function (fulfill, reject) {

            var options = {
                method: 'POST',
                uri: 'https://api.github.com/orgs/' + ctx.ORG_NAME + '/repos',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME,
                    'Accept': 'application/json'
                },
                body: {
                    name: repoName,
                    private: true,
                    has_issues: true,
                    has_wiki: false,
                    has_downloads: false,
                    auto_init: false
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
     * @returns {Promise<{}>}
     */
    public deleteRepo(repoName: string): Promise<string> {
        let ctx = this;

        Log.info("GithubProjectController::deleteRepo(..) - start");
        return new Promise(function (fulfill, reject) {

            var options = {
                method: 'DELETE',
                uri: 'https://api.github.com/repos/' + ctx.ORG_NAME + '/' + repoName,
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
     * Lists teams. Will fail if more than 200 teams are in the organization
     * (or Github starts to disallow forcing the per_page variable).
     *
     * The success callback will include the Github team objects.
     *
     * @returns {Promise<{}>}
     */
    public listTeams(): Promise<{}> {
        let ctx = this;

        Log.info("GithubProjectController::listTeams(..) - start");
        return new Promise(function (fulfill, reject) {

            var options = {
                method: 'GET',
                uri: 'https://api.github.com/orgs/' + ctx.ORG_NAME + '/teams?per_page=200',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME,
                    'Accept': 'application/json'
                },
                resolveWithFullResponse: true,
                json: true
            };

            rp(options).then(function (fullResponse: any) {

                if (typeof fullResponse.headers.link !== 'undefined') {
                    let eMessage = "GithubProjectController::listTeams(..) - ERROR; pagination encountered (and not handled)";
                    Log.error(eMessage);
                    reject(eMessage);
                }

                let teams: any = [];
                // Log.trace("GithubProjectController::creatlistTeams(..) - success: " + JSON.stringify(fullResponse.body));
                for (var team of fullResponse.body) {
                    let id = team.id;
                    let name = team.name;

                    Log.info("GithubProjectController::listTeams(..) - team: " + JSON.stringify(team));
                    teams.push({id: id, name: name});
                }

                fulfill(teams);
            }).catch(function (err: any) {
                Log.error("GithubProjectController::listTeams(..) - ERROR: " + err);
                reject(err);
            });
        });
    }

    /**
     * Creates a team for a groupName (e.g., cpsc310_team1).
     *
     * Returns the teamId (used by many other Github calls).
     *
     * @param teamName
     * @param permission 'admin', 'pull', 'push'
     * @returns {Promise<{}>}
     */
    public createTeam(teamName: string, permission: string): Promise<number> {
        let ctx = this;

        Log.info("GithubProjectController::createTeam(..) - start");
        return new Promise(function (fulfill, reject) {

            var options = {
                method: 'POST',
                uri: 'https://api.github.com/orgs/' + ctx.ORG_NAME + '/teams',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME,
                    'Accept': 'application/json'
                },
                body: {
                    name: teamName,
                    permission: permission
                },
                json: true
            };

            rp(options).then(function (body: any) {
                let id = body.id;
                Log.info("GithubProjectController::createTeam(..) - success: " + id);
                fulfill({teamName: teamName, teamId: id});
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
     * @param permission ('pull', 'push', 'admin')
     * @returns {Promise<{}>}
     */
    public addTeamToRepo(teamId: number, repoName: string, permission: string) {
        let ctx = this;
        Log.info("GithubProjectController::addTeamToRepo( " + teamId + ", " + repoName + " ) - start");
        return new Promise(function (fulfill, reject) {

            var options = {
                method: 'PUT',
                uri: 'https://api.github.com/teams/' + teamId + '/repos/' + ctx.ORG_NAME + '/' + repoName,
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME,
                    'Accept': 'application/json'
                },
                body: {
                    permission: permission
                },
                json: true
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

    /**
     * Add a set of Github members (their usernames) to a given team.
     *
     * @param teamId
     * @param members
     * @returns {Promise<{}>}
     */
    public addMembersToTeam(teamId: number, members: string[]): Promise<{}> {
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
                Log.info("GithubProjectController::addMembersToTeam(..) - success: " + JSON.stringify(results));
                fulfill(results);
            }).catch(function (err: any) {
                Log.error("GithubProjectController::addMembersToTeam(..) - ERROR: " + err);
                reject(err);
            });
        });
    }

    /**
     *
     *
     * @param targetRepo
     * @param importRepoUrl
     * @returns {Promise<{}>}
     */
    public importRepoToNewRepo(targetRepo: string, importRepoUrl: string): Promise<{}> {
        let ctx = this;
        Log.info("GithubProjectController::importRepoToNewRepo(..) - start");

        return new Promise(function (fulfill, reject) {

            // PUT /repos/:owner/:repo/import
            let opts = {
                method: 'PUT',
                uri: 'https://api.github.com/repos/' + ctx.ORG_NAME + '/' + targetRepo + '/import',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME,
                    'Accept': 'application/vnd.github.barred-rock-preview'
                },
                body: {
                    vcs_url: importRepoUrl
                },
                json: true
            };

            rp(opts).then(function (results: any) {
                Log.info("GithubProjectController::importRepoToNewRepo(..) - success: " + results);
                fulfill(results);
            }).catch(function (err: any) {
                Log.error("GithubProjectController::importRepoToNewRepo(..) - ERROR: " + err);
                reject(err);
            });
        });
    }

    public checkImportProgress(repoName: string): Promise<{}> {
        let ctx = this;
        Log.info("GithubProjectController::checkImportProgress(..) - start");

        return new Promise(function (fulfill, reject) {

            // GET /repos/:owner/:repo/import
            let opts = {
                method: 'GET',
                uri: 'https://api.github.com/repos/' + ctx.ORG_NAME + '/' + repoName + '/import',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME,
                    'Accept': 'application/vnd.github.barred-rock-preview'
                },
                json: true
            };

            rp(opts).then(function (results: any) {
                Log.info("GithubProjectController::checkImportProgress(..) - success: " + results);
                fulfill(results);
            }).catch(function (err: any) {
                Log.error("GithubProjectController::checkImportProgress(..) - ERROR: " + err);
                reject(err);
            });
        });
    }

    /**
     * Used to provide updated credentials for an import.
     *
     * @param repoName
     * @returns {Promise<{}>}
     */
    public updateImport(repoName: string): Promise<{}> {
        let ctx = this;
        Log.info("GithubProjectController::updateImport(..) - start");

        return new Promise(function (fulfill, reject) {

            // PATCH /repos/:owner/:repo/import
            let opts = {
                method: 'PATCH',
                uri: 'https://api.github.com/repos/' + ctx.ORG_NAME + '/' + repoName + '/import',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME,
                    'Accept': 'application/vnd.github.barred-rock-preview'
                },
                body: {
                    "vcs_username": "foo",
                    "vcs_password": "bar"
                },
                json: true
            };

            rp(opts).then(function (results: any) {
                Log.info("GithubProjectController::updateImport(..) - success: " + results);
                fulfill(results);
            }).catch(function (err: any) {
                Log.error("GithubProjectController::updateImport(..) - ERROR: " + err);
                reject(err);
            });
        });
    }

    public addWebhook(repoName: string): Promise<{}> {
        let ctx = this;
        Log.info("GithubProjectController::addWebhook(..) - start");

        return new Promise(function (fulfill, reject) {

            // POST /repos/:owner/:repo/hooks
            let opts = {
                method: 'POST',
                uri: 'https://api.github.com/repos/' + ctx.ORG_NAME + '/' + repoName + '/hooks',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME
                },
                body: {
                    "name": "web",
                    "active": true,
                    "events": ["commit_comment"],
                    "config": {
                        "url": "http://skaha.cs.ubc.ca:8080/submit",
                        "content_type": "json"
                    }
                },
                json: true
            };

            rp(opts).then(function (results: any) {
                Log.info("GithubProjectController::addWebhook(..) - success: " + results);
                fulfill(results);
            }).catch(function (err: any) {
                Log.error("GithubProjectController::addWebhook(..) - ERROR: " + err);
                reject(err);
            });
        });
    }


    public createAllRepos(groupData: GroupRepoDescription[]): Promise<any[]> {
        let ctx = this;
        Log.info("GithubProjectController::createAllRepos(..) - start");

        let promises: Promise<any>[] = [];

        for (var gd of groupData) {
            let repoName = gd.projectName;
            Log.trace("GithubProjectController::createAllRepos(..) - pushing: " + repoName);
            promises.push(ctx.createRepo(repoName));
        }
        Log.info("GithubProjectController::createAllRepos(..) - all pushed");

        return Promise.all(promises);
    }

    public importAllRepos(groupData: GroupRepoDescription[], importRepoUrl: string): Promise<any[]> {
        Log.info("GithubProjectController::importAllRepos(..) - start");

        let promises: Promise<any>[] = [];
        for (var gd of groupData) {
            let repoName = gd.projectName;
            Log.trace("GithubProjectController::importAllRepos(..) - pushing: " + repoName);
            promises.push(this.importRepoToNewRepo(repoName, importRepoUrl));
        }
        Log.info("GithubProjectController::importAllRepos(..) - all pushed");

        return Promise.all(promises);
    }

    public createAllTeams(groupData: GroupRepoDescription[], permissions: string): Promise<any[]> {
        Log.info("GithubProjectController::crateAllTeams(..) - start");

        let promises: Promise<any>[] = [];
        for (var gd of groupData) {
            let teamName = gd.teamName;
            Log.trace("GithubProjectController::crateAllTeams(..) - pushing: " + teamName);
            promises.push(this.createTeam(teamName, permissions));
        }
        Log.info("GithubProjectController::crateAllTeams(..) - all pushed");

        return Promise.all(promises);
    }

    public addTeamToRepos(groupData: GroupRepoDescription[], adminTeamName: string, permissions: string) {
        Log.info("GithubProjectController::addTeamToRepos(..) - start");
        let ctx = this;

        return new Promise(function (fulfill, reject) {
            let teamId = -1;
            ctx.listTeams().then(function (teamList: any) {
                Log.info("GithubProjectController::addTeamToRepos(..) - all teams: " + JSON.stringify(teamList));
                for (var team of teamList) {
                    if (team.name === adminTeamName) {
                        teamId = team.id;
                        Log.info("GithubProjectController::addTeamToRepos(..) - matched admin team; id: " + teamId);
                    }
                }
                if (teamId < 0) {
                    throw new Error('Could not find team called: ' + adminTeamName);
                }
                let promises: Promise<any>[] = [];

                for (var gd of groupData) {
                    let repoName = gd.projectName;
                    promises.push(ctx.addTeamToRepo(teamId, repoName, permissions));
                }
                Log.info("GithubProjectController::addTeamToRepos(..) - all addTeams pushed");

                Promise.all(promises).then(function (allDone) {
                    Log.info("GithubProjectController::addTeamToRepos(..) - all done; final: " + JSON.stringify(allDone));
                    // Promise.resolve(allDone);
                    fulfill(allDone);
                }).catch(function (err) {
                    Log.info("GithubProjectController::addTeamToRepos(..) - all done ERROR: " + err);
                    // Promise.reject(err);
                    reject(err);
                });

                //}).then(function (res: any) {
                //    Log.info("GithubProjectController::addTeamToRepos(..) - done; team added to all repos: " + JSON.stringify(res));
                //    fulfill(res);
            }).catch(function (err: any) {
                Log.info("GithubProjectController::addTeamToRepos(..) - ERROR: " + err);
                reject(err);
            });

            Log.info("GithubProjectController::addTeamToRepos(..) - end");
        });
    }

} // end class


/**
 * Steps required to configure a course. The first 1-7 are all async.
 *
 * 0. Get the data about the github usernames, repos, and teams.
 * 1. Create N project repos.
 * 2. Import base repo into each project repo. (optional; often helpful for getting started)
 * 3. Add webhook to each project repo. (optional; needed for autotest)
 * 4. Create M student teams.
 * 5. Add the right students to each team.
 * 6. Add the student team to the project repo.
 * 7. Add the course staff team to the project repo.
 * 8. Report back what has been created.
 *
 * @type {GithubProjectController}
 */


var gpc = new GithubProjectController();

const PROJECT_PREFIX = 'cpsc310test_team';
const TEAM_PREFIX = 'cpsc310_team';


let groupDataIn: GroupRepoDescription[];

gpc.getGroupDescriptions().then(function (descriptions) {
    Log.info('getGroupeDescriptions(..) - done: ' + descriptions);
    Log.info('getGroupeDescriptions(..) - # complete teams: ' + descriptions.length);
    for (var descr of descriptions) {
        Log.info('Group: ' + JSON.stringify(descr));
    }
    return gpc.setGithubUrl(1, 'test url');
}).then(function (url) {
    Log.info('url set successfully: ' + url);
}).catch(function (err) {
    Log.error('getGroupeDescriptions(..) - ERROR: ' + err);
});

/*
 let groupData: GroupRepoDescription[] = [];
 groupDataIn.push({team: 5, members: ['rtholmes', 'rthse2']});
 for (var gd of groupDataIn) {
 if (typeof gd.url === 'undefined' || gd.url === null) {
 gd.teamName = TEAM_PREFIX + gd.team;
 gd.projectName = PROJECT_PREFIX + gd.team;
 groupData.push(gd);
 }
 }*/


/*
 let repoList: string[] = [];
 for (var i = 0; i < 3; i++) {
 repoList.push('cpsc310test_team' + i);
 }
 */

/*
 var promises: Promise<any>[] = [];
 for (var data of groupData) {
 let repoName = PROJECT_PREFIX + data.team;
 promises.push(gpc.deleteRepo(repoName));
 }
 Promise.all(promises).then(function (succ) {
 Log.info('all projects deleted: ' + succ);
 }).catch(function (err) {
 Log.error('Error deleting projects: ' + err);
 });
 */

// create the repos
/*
 gpc.createAllRepos(groupData).then(function (res) {
 Log.info('All repos created: ' + JSON.stringify(res));
 }).catch(function (err) {
 Log.error('Error creating repos: ' + JSON.stringify(err));
 });

 // import the default project to the repos
 let importUrl = 'https://github.com/CS310-2016Fall/cpsc310project';
 gpc.importAllRepos(groupData, importUrl).then(function (res) {
 Log.info('All repos importing: ' + JSON.stringify(res));
 }).catch(function (err) {
 Log.error('Error importing repos: ' + JSON.stringify(err));
 });
 */

/*
 gpc.createAllTeams(groupData, 'push').then(function (res) {
 Log.info('All teams created: ' + JSON.stringify(res));

 let promises: Promise<any>[] = [];
 for (var teamRec of res) {
 let id = teamRec.teamId;
 let name = teamRec.teamName;
 for (var gd of groupData) {
 if (gd.teamName === name) {
 promises.push(gpc.addMembersToTeam(id, gd.members));
 }
 }
 }
 return Promise.all(promises);
 }).then(function (teamsDone) {
 Log.info('All members successfully added to teams: ' + JSON.stringify(teamsDone));
 }).catch(function (err: any) {
 Log.error('Error creating teams: ' + err);
 });
 */

/*
 // add the teams to the repos
 gpc.addTeamToRepos(groupData, '310Staff', 'admin').then(function (res) {
 Log.info('Adding team to repos success: ' + JSON.stringify(res));
 }).catch(function (err: any) {
 Log.info('Error adding team to repos: ' + err);
 });
 */

