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
export interface GroupRepoDescription {
    team: number;           // team number (used internally by portal)
    members: string[];      // github usernames
    url?: string;           // github url (leave undefined if not set)
    projectName?: string;   // github project name
    teamName?: string;      // github team name
    teamIndex?: number;
}

export interface GroupCommit {
    repoName: string;
    sha: string;
}

export default class GitHubManager {

    // Use external config file so tokens are not stored in github
    private GITHUB_AUTH_TOKEN = config.githubcontroller_token;
    private GITHUB_USER_NAME = config.githubcontroller_user;

    private ORG_NAME: string;

    constructor(orgName: string) {
        this.ORG_NAME = orgName;
    }

    /**
     * get group repo descriptions
     *
     * on success, returns callback with 1st arg: null, 2nd arg: GroupRepoDescription[]
     * on error, returns callback with 1st arg: error message, 2nd arg: null
     */
    public getGroupDescriptions(): Promise<GroupRepoDescription[]> {
        Log.info("GitHubManager::getGroupDescriptions(..) - start");
        var returnVal: GroupRepoDescription[] = [];
        var studentsFile: any;
        var teamsFile: any;

        return new Promise(function (fulfill, reject) {
            async.waterfall([
                function get_students_file(callback: any) {
                    Log.info("GitHubManager::getGroupDescriptions(..) - get_students_file");
                    Helper.readJSON("students.json", function (error: any, data: any) {
                        if (!error) {
                            studentsFile = data;
                            return callback(null);
                        } else {
                            return callback("error reading students.json");
                        }
                    });
                },
                function get_teams_file(callback: any) {
                    Log.info("GitHubManager::getGroupDescriptions(..) - get_teams_file");
                    Helper.readJSON("teams.json", function (error: any, data: any) {
                        if (!error) {
                            teamsFile = data;
                            return callback(null);
                        } else {
                            return callback("error reading teams.json");
                        }
                    });
                },
                function get_group_repo_descriptions(callback: any) {
                    Log.info("GitHubManager::getGroupDescriptions(..) - get_group_repo_descriptions");

                    // for each team entry, convert team sids to usernames, then add new GroupRepoDescription to returnVal
                    for (var i = 0; i < teamsFile.length; i++) {
                        Log.trace("GitHubManager::getGroupDescriptions(..) - teamId: " + teamsFile[i].id);

                        var sidArray: string[] = teamsFile[i].members;
                        var usernamesArray: string[] = [];

                        // convert each sid in the current team entry to a username
                        async.forEachOf(sidArray,
                            function convert_sid_to_username(sid: string, index: number, callback: any) {
                                Log.trace("GitHubManager::getGroupDescriptions(..) - sid: " + sid);
                                var studentIndex = _.findIndex(studentsFile, {"sid": sid});

                                if (studentIndex >= 0) {
                                    var username = studentsFile[studentIndex].username;
                                    Log.trace("GitHubManager::getGroupDescriptions(..) - username: " + username);

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
                                        team:    teamsFile[i].id,
                                        members: usernamesArray,
                                        url:     teamsFile[i].url
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
                    Log.info("GitHubManager::getGroupDescriptions(..) - success");
                    // return parentCallback(null, returnVal);
                    fulfill(returnVal);
                } else {
                    Log.info("GitHubManager::getGroupDescriptions(..) - error: " + error);
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
                    fulfill(url);
                } else {
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

        Log.info("GitHubManager::createRepo( " + repoName + " ) - start");
        return new Promise(function (fulfill, reject) {
            var options = {
                method:  'POST',
                uri:     'https://api.github.com/orgs/' + ctx.ORG_NAME + '/repos',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent':    ctx.GITHUB_USER_NAME,
                    'Accept':        'application/json'
                },
                body:    {
                    name:          repoName,
                    private:       true,
                    has_issues:    true,
                    has_wiki:      false,
                    has_downloads: false,
                    auto_init:     false
                },
                json:    true
            };

            rp(options).then(function (body: any) {
                let url = body.html_url;
                Log.info("GitHubManager::createRepo(..) - success; url: " + url);
                fulfill(url);
            }).catch(function (err: any) {
                Log.error("GitHubManager::createRepo(..) - ERROR: " + JSON.stringify(err));
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

        Log.info("GitHubManager::deleteRepo(..) - start");
        return new Promise(function (fulfill, reject) {

            var options = {
                method:  'DELETE',
                uri:     'https://api.github.com/repos/' + ctx.ORG_NAME + '/' + repoName,
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent':    ctx.GITHUB_USER_NAME,
                    'Accept':        'application/json'
                }
            };

            rp(options).then(function (body: any) {
                Log.info("GitHubManager::deleteRepo(..) - success; body: " + body);
                fulfill(body);
            }).catch(function (err: any) {
                Log.error("GitHubManager::deleteRepo(..) - ERROR: " + JSON.stringify(err));
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
    public deleteTeam(teamName: string): Promise<string> {
        let ctx = this;

        return new Promise(function (fulfill, reject) {
            let teamId = -1;
            ctx.listTeams().then(function (teamList: any) {
                Log.info("GitHubManager::deleteTeam(..) - all teams: " + JSON.stringify(teamList));
                for (var team of teamList) {
                    if (team.name === teamName) {
                        teamId = team.id;
                        Log.info("GitHubManager::deleteTeam(..) - matched team; id: " + teamId);
                    }
                }
                if (teamId < 0) {
                    //throw new Error('Could not find team called: ' + teamName);
                    reject("GitHubManager::deleteTeam(..) " + teamName + ' could not be found');
                }

                var options = {
                    method:  'DELETE',
                    uri:     'https://api.github.com/teams/' + teamId,
                    headers: {
                        'Authorization': ctx.GITHUB_AUTH_TOKEN,
                        'User-Agent':    ctx.GITHUB_USER_NAME,
                        'Accept':        'application/json'
                    }
                };
                Log.info("GitHubManager::deleteTeam(..) - deleting team; id: " + teamId);

                rp(options).then(function (body: any) {
                    Log.info("GitHubManager::deleteTeam(..) - success; body: " + body);
                    fulfill(body);
                }).catch(function (err: any) {
                    Log.error("GitHubManager::deleteTeam(..) - ERROR: " + JSON.stringify(err));
                    reject(err);
                });

            }).catch(function (err: any) {
                Log.info("GitHubManager::addTeamToRepos(..) - ERROR: " + err);
                reject(err);
            });

            Log.info("GitHubManager::addTeamToRepos(..) - end");
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

        Log.info("GitHubManager::listTeams(..) - start");
        return new Promise(function (fulfill, reject) {

            var options = {
                method:                  'GET',
                uri:                     'https://api.github.com/orgs/' + ctx.ORG_NAME + '/teams?per_page=200',
                headers:                 {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent':    ctx.GITHUB_USER_NAME,
                    'Accept':        'application/json'
                },
                resolveWithFullResponse: true,
                json:                    true
            };

            rp(options).then(function (fullResponse: any) {

                if (typeof fullResponse.headers.link !== 'undefined') {
                    let eMessage = "GitHubManager::listTeams(..) - ERROR; pagination encountered (and not handled)";
                    Log.error(eMessage);
                    reject(eMessage);
                }

                let teams: any = [];
                // Log.trace("GitHubManager::creatlistTeams(..) - success: " + JSON.stringify(fullResponse.body));
                for (var team of fullResponse.body) {
                    let id = team.id;
                    let name = team.name;

                    // Log.info("GitHubManager::listTeams(..) - team: " + JSON.stringify(team));
                    teams.push({id: id, name: name});
                }

                fulfill(teams);
            }).catch(function (err: any) {
                Log.error("GitHubManager::listTeams(..) - ERROR: " + err);
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

        Log.info("GitHubManager::createTeam(..) - start");
        return new Promise(function (fulfill, reject) {

            var options = {
                method:  'POST',
                uri:     'https://api.github.com/orgs/' + ctx.ORG_NAME + '/teams',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent':    ctx.GITHUB_USER_NAME,
                    'Accept':        'application/json'
                },
                body:    {
                    name:       teamName,
                    permission: permission
                },
                json:    true
            };

            rp(options).then(function (body: any) {
                let id = body.id;
                Log.info("GitHubManager::createTeam(..) - success: " + id);
                fulfill({teamName: teamName, teamId: id});
            }).catch(function (err: any) {
                Log.error("GitHubManager::createTeam(..) - ERROR: " + err);
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
        Log.info("GitHubManager::addTeamToRepo( " + teamId + ", " + repoName + " ) - start");
        return new Promise(function (fulfill, reject) {

            var options = {
                method:  'PUT',
                uri:     'https://api.github.com/teams/' + teamId + '/repos/' + ctx.ORG_NAME + '/' + repoName,
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent':    ctx.GITHUB_USER_NAME,
                    'Accept':        'application/json'
                },
                body:    {
                    permission: permission
                },
                json:    true
            };

            rp(options).then(function (body: any) {
                Log.info("GitHubManager::addTeamToRepo(..) - success; team: " + teamId + "; repo: " + repoName);
                // onSuccess(body);
                fulfill({teamId: teamId, repoName: repoName});
            }).catch(function (err: any) {
                Log.error("GitHubManager::addTeamToRepo(..) - ERROR: " + err);
                reject(err);
            });
        });
    }

    /**
     * Add a set of Github members (their usernames) to a given team.
     *
     * @param teamId
     * @param members
     * @returns {Promise<number>} where the number is the teamId
     */
    public addMembersToTeam(teamId: number, members: string[]): Promise<number> {
        let ctx = this;
        Log.info("GitHubManager::addMembersToTeam(..) - start; id: " + teamId + "; members: " + JSON.stringify(members));

        return new Promise(function (fulfill, reject) {
            let promises: any = [];
            for (var member of members) {
                Log.info("GitHubManager::addMembersToTeam(..) - adding member: " + member);

                let opts = {
                    method:  'PUT',
                    uri:     'https://api.github.com/teams/' + teamId + '/memberships/' + member,
                    headers: {
                        'Authorization': ctx.GITHUB_AUTH_TOKEN,
                        'User-Agent':    ctx.GITHUB_USER_NAME,
                        'Accept':        'application/json'
                    },
                    json:    true
                };
                promises.push(rp(opts));
            }

            Promise.all(promises).then(function (results: any) {
                Log.info("GitHubManager::addMembersToTeam(..) - success: " + JSON.stringify(results));
                fulfill(teamId);
            }).catch(function (err: any) {
                Log.error("GitHubManager::addMembersToTeam(..) - ERROR: " + err);
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
        Log.info("GitHubManager::importRepoToNewRepo(..) - start");

        return new Promise(function (fulfill, reject) {

            // PUT /repos/:owner/:repo/import
            let opts = {
                method:  'PUT',
                uri:     'https://api.github.com/repos/' + ctx.ORG_NAME + '/' + targetRepo + '/import',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent':    ctx.GITHUB_USER_NAME,
                    'Accept':        'application/vnd.github.barred-rock-preview'
                },
                body:    {
                    vcs_url: importRepoUrl
                },
                json:    true
            };

            rp(opts).then(function (results: any) {
                Log.info("GitHubManager::importRepoToNewRepo(..) - success: " + JSON.stringify(results));
                fulfill(results);
            }).catch(function (err: any) {
                Log.error("GitHubManager::importRepoToNewRepo(..) - ERROR: " + err);
                reject(err);
            });
        });
    }

    public checkImportProgress(repoName: string): Promise<{}> {
        let ctx = this;
        Log.info("GitHubManager::checkImportProgress(..) - start");

        return new Promise(function (fulfill, reject) {

            // GET /repos/:owner/:repo/import
            let opts = {
                method:  'GET',
                uri:     'https://api.github.com/repos/' + ctx.ORG_NAME + '/' + repoName + '/import',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent':    ctx.GITHUB_USER_NAME,
                    'Accept':        'application/vnd.github.barred-rock-preview'
                },
                json:    true
            };

            rp(opts).then(function (results: any) {
                Log.info("GitHubManager::checkImportProgress(..) - success: " + results);
                fulfill(results);
            }).catch(function (err: any) {
                Log.error("GitHubManager::checkImportProgress(..) - ERROR: " + err);
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
        Log.info("GitHubManager::updateImport(..) - start");

        return new Promise(function (fulfill, reject) {

            // PATCH /repos/:owner/:repo/import
            let opts = {
                method:  'PATCH',
                uri:     'https://api.github.com/repos/' + ctx.ORG_NAME + '/' + repoName + '/import',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent':    ctx.GITHUB_USER_NAME,
                    'Accept':        'application/vnd.github.barred-rock-preview'
                },
                body:    {
                    "vcs_username": "foo",
                    "vcs_password": "bar"
                },
                json:    true
            };

            rp(opts).then(function (results: any) {
                Log.info("GitHubManager::updateImport(..) - success: " + results);
                fulfill(results);
            }).catch(function (err: any) {
                Log.error("GitHubManager::updateImport(..) - ERROR: " + err);
                reject(err);
            });
        });
    }

    public addWebhook(repoName: string): Promise<{}> {
        let ctx = this;
        Log.info("GitHubManager::addWebhook(..) - start");

        return new Promise(function (fulfill, reject) {

            // POST /repos/:owner/:repo/hooks
            let opts = {
                method:  'POST',
                uri:     'https://api.github.com/repos/' + ctx.ORG_NAME + '/' + repoName + '/hooks',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent':    ctx.GITHUB_USER_NAME
                },
                body:    {
                    "name":   "web",
                    "active": true,
                    "events": ["commit_comment"],
                    "config": {
                        "url":          "http://skaha.cs.ubc.ca:8080/submit",
                        "content_type": "json"
                    }
                },
                json:    true
            };

            rp(opts).then(function (results: any) {
                Log.info("GitHubManager::addWebhook(..) - success: " + results);
                fulfill(results);
            }).catch(function (err: any) {
                Log.error("GitHubManager::addWebhook(..) - ERROR: " + err);
                reject(err);
            });
        });
    }


    public getStats(orgName: string, repoName: string): Promise<{}> {
        let ctx = this;
        // Log.info("GitHubManager::getStats(..) - start");

        return new Promise(function (fulfill, reject) {

            // POST /repos/:owner/:repo/hooks
            let opts = {
                method:                  'GET',
                uri:                     'https://api.github.com/repos/' + ctx.ORG_NAME + '/' + repoName + '/stats/commit_activity',
                // uri:                     'https://api.github.com/repos/' + ctx.ORG_NAME + '/' + repoName + '/stats/contributors',
                headers:                 {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent':    ctx.GITHUB_USER_NAME
                },
                body:                    {},
                json:                    true,
                resolveWithFullResponse: true
            };

            rp(opts).then(function (response: any) {
                let code = response.statusCode;

                if (code !== 200) {
                    Log.warn("GitHubManager::getStats(..) - code: " + code + "; for: " + repoName);
                }
                let count = 0;
                for (var week of response.body) {
                    count += week.total;
                }
                count = count - 28;
                // Log.info("GitHubManager::getStats(..) - success (" + code + "); total: " + count + "; data: " + JSON.stringify(response.body));
                // console.log(repoName + "," + count);
                console.log(count);

                let results = {};
                fulfill(results);
            }).catch(function (err: any) {
                Log.error("GitHubManager::getStats(..) - ERROR: " + err);
                reject(err);
            });
        });
    }

    public getLastSHA(orgName: string, repoName: string, targetTs: Date): Promise<GroupCommit> {
        let ctx = this;
        // Log.info("GitHubManager::getStats(..) - start");

        if (typeof targetTs === 'undefined') {
            targetTs = null;
        }

        return new Promise(function (fulfill, reject) {

            // GET /repos/:owner/:repo/commits
            let opts = {
                method:                  'GET',
                uri:                     'https://api.github.com/repos/' + ctx.ORG_NAME + '/' + repoName + '/commits',
                // uri:                     'https://api.github.com/repos/' + ctx.ORG_NAME + '/' + repoName + '/stats/contributors',
                headers:                 {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent':    ctx.GITHUB_USER_NAME
                },
                body:                    {},
                json:                    true,
                resolveWithFullResponse: true
            };

            rp(opts).then(function (response: any) {
                let code = response.statusCode;
                let commits = response.body;
                let sha: string = null;
                if (targetTs === null) {
                    // return first one
                    let commit = commits[0];
                    let sha = commit.sha;
                } else {
                    let date: Date = null;
                    let lastDate: Date = null;
                    for (var commit of commits) {

                        let dateStr = commit.commit.author.date;
                        date = new Date(dateStr);
                        //console.log('considering: ' + date + '; lastDate: ' + lastDate);
                        // figure out which one to use and break
                        if (date.getTime() < targetTs.getTime()) {
                            // we wanted the last one
                            //if (sha === null) {
                            // console.log('using last sha');
                            // aka the last one is the right one, need to set the sha and lastDate
                            lastDate = date;
                            sha = commit.sha;
                            //} else {
                            // use the existing sha
                            //  console.log('using cached sha for ' + lastDate + ' instead of ' + date);
                            //}
                            Log.trace('found it; ' + sha + '; @ ' + lastDate);
                            break;
                        } else {
                            sha = commit.sha;
                            lastDate = date;
                        }
                    }
                }

                if (sha === null) {
                    Log.warn("GitHubManager::getLastSHA(..) - repo: " + repoName + "; no matching SHA!");
                }
                Log.info("GitHubManager::getLastSHA(..) - repo: " + repoName + "; sha: " + sha);

                let results = {repoName: repoName, sha: sha};
                fulfill(results);
            }).catch(function (err: any) {
                Log.error("GitHubManager::getLastSHA(..) - ERROR: " + err);
                reject(err);
            });
        });
    }

    public makeCommitComment(orgName: string, repoName: string, sha: string, msg: string, delay: number): Promise<boolean> {
        let ctx = this;
        // Log.info("GitHubManager::getStats(..) - start");

        return new Promise(function (fulfill, reject) {

            let url = 'https://api.github.com/repos/' + ctx.ORG_NAME + '/' + repoName + '/commits/' + sha + '/comments';
            // Log.info("GitHubManager::makeCommitComment(..) - url: " + url);
            // POST /repos/:owner/:repo/commits/:sha/comments
            let opts = {
                method:                  'POST',
                uri:                     url,
                // uri:                     'https://api.github.com/repos/' + ctx.ORG_NAME + '/' + repoName + '/stats/contributors',
                headers:                 {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent':    ctx.GITHUB_USER_NAME
                },
                body:                    {
                    body: msg
                },
                json:                    true,
                resolveWithFullResponse: true
            };

            ctx.delay(delay).then(function () {

                return rp(opts);
            }).then(function (response: any) {
                let code = response.statusCode;

                if (code === 201) {
                    // https://github.com/CS310-2016Fall/cpsc310project_team56/commit/d7db6c2f351ee3b73e70aec329f34caf767bd562
                    let commitURL = 'https://github.com/' + ctx.ORG_NAME + '/' + repoName + '/commit/' + sha;
                    Log.info("GitHubManager::makeCommitComment(..) - comment posted to: " + repoName + " @ " + commitURL);
                } else {
                    Log.error("GitHubManager::makeCommitComment(..) - ERROR posting comment");
                }

                fulfill(true);
            }).catch(function (err: any) {
                Log.error("GitHubManager::makeCommitComment(..) - ERROR: " + err);
                reject(err);
            });
        });
    }


    public createAllRepos(groupData: GroupRepoDescription[]): Promise<any[]> {
        let ctx = this;
        Log.info("GitHubManager::createAllRepos(..) - start");

        let promises: Promise<any>[] = [];

        for (var gd of groupData) {
            let repoName = gd.projectName;
            Log.trace("GitHubManager::createAllRepos(..) - pushing: " + repoName);
            promises.push(ctx.createRepo(repoName));
        }
        Log.info("GitHubManager::createAllRepos(..) - all pushed");

        return Promise.all(promises);
    }

    public importAllRepos(groupData: GroupRepoDescription[], importRepoUrl: string): Promise<any[]> {
        Log.info("GitHubManager::importAllRepos(..) - start");

        let promises: Promise<any>[] = [];
        for (var gd of groupData) {
            let repoName = gd.projectName;
            Log.trace("GitHubManager::importAllRepos(..) - pushing: " + repoName);
            promises.push(this.importRepoToNewRepo(repoName, importRepoUrl));
        }
        Log.info("GitHubManager::importAllRepos(..) - all pushed");

        return Promise.all(promises);
    }

    public createAllTeams(groupData: GroupRepoDescription[], permissions: string): Promise<any[]> {
        Log.info("GitHubManager::crateAllTeams(..) - start");

        let promises: Promise<any>[] = [];
        for (var gd of groupData) {
            let teamName = gd.teamName;
            Log.trace("GitHubManager::crateAllTeams(..) - pushing: " + teamName);
            promises.push(this.createTeam(teamName, permissions));
        }
        Log.info("GitHubManager::crateAllTeams(..) - all pushed");

        return Promise.all(promises);
    }

    public getTeamNumber(teamName: string): Promise<number> {
        Log.info("GitHubManager::getTeamNumber( " + teamName + " ) - start");
        let ctx = this;

        return new Promise(function (fulfill, reject) {
            let teamId = -1;
            ctx.listTeams().then(function (teamList: any) {
                Log.trace("GitHubManager::getTeamNumber(..) - all teams: " + JSON.stringify(teamList));
                for (var team of teamList) {
                    if (team.name === teamName) {
                        teamId = team.id;
                        Log.info("GitHubManager::getTeamNumber(..) - matched team: " + teamName + "; id: " + teamId);
                    }
                }

                if (teamId < 0) {
                    reject('GitHubManager::getTeamNumber(..) - ERROR: Could not find team: ' + teamName);
                } else {
                    fulfill(teamId);
                }
            }).catch(function (err) {
                Log.error("GitHubManager::addTeamToRepos(..) - could not match team: " + teamName + "; ERROR: " + err);
                reject(err);
            });
        });
    }

    public addTeamToRepos(groupData: GroupRepoDescription[], adminTeamName: string, permissions: string) {
        Log.info("GitHubManager::addTeamToRepos(..) - start");
        let ctx = this;

        return new Promise(function (fulfill, reject) {
            let teamId = -1;
            ctx.listTeams().then(function (teamList: any) {
                Log.info("GitHubManager::addTeamToRepos(..) - all teams: " + JSON.stringify(teamList));
                for (var team of teamList) {
                    if (team.name === adminTeamName) {
                        teamId = team.id;
                        Log.info("GitHubManager::addTeamToRepos(..) - matched admin team; id: " + teamId);
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
                Log.info("GitHubManager::addTeamToRepos(..) - all addTeams pushed");

                Promise.all(promises).then(function (allDone) {
                    Log.info("GitHubManager::addTeamToRepos(..) - all done; final: " + JSON.stringify(allDone));
                    // Promise.resolve(allDone);
                    fulfill(allDone);
                }).catch(function (err) {
                    Log.info("GitHubManager::addTeamToRepos(..) - all done ERROR: " + err);
                    // Promise.reject(err);
                    reject(err);
                });

                //}).then(function (res: any) {
                //    Log.info("GitHubManager::addTeamToRepos(..) - done; team added to all repos: " + JSON.stringify(res));
                //    fulfill(res);
            }).catch(function (err: any) {
                Log.info("GitHubManager::addTeamToRepos(..) - ERROR: " + err);
                reject(err);
            });

            Log.info("GitHubManager::addTeamToRepos(..) - end");
        });
    }


    completeProvision(inputGroup: GroupRepoDescription, importUrl: string, staffTeamName: string): Promise<GroupRepoDescription> {
        let that = this;
        Log.info("GitHubManager::completeProvision(..) - start: " + JSON.stringify(inputGroup));
        return new Promise(function (fulfill, reject) {

            const DELAY = 5000;
            // slow down creation to avoid getting in trouble with GH
            that.delay(inputGroup.teamIndex * DELAY).then(function () {
                Log.info("GitHubManager::completeProvision(..) - creating project: " + inputGroup.projectName);
                return that.createRepo(inputGroup.projectName);
            }).then(function (url: string) {
                inputGroup.url = url;
                // let importUrl = 'https://github.com/CS310-2016Fall/cpsc310project';
                Log.info("GitHubManager::completeProvision(..) - project created; importing url: " + importUrl);
                return that.importRepoToNewRepo(inputGroup.projectName, importUrl);
            }).then(function () {
                Log.info("GitHubManager::completeProvision(..) - import started; adding webhook");
                return that.addWebhook(inputGroup.projectName);

            }).then(function () {
                Log.info("GitHubManager::completeProvision(..) - webhook added; creating team: " + inputGroup.teamName);
                return that.createTeam(inputGroup.teamName, 'push');

            }).then(function (teamDeets: any) {
                var teamId = teamDeets.teamId;
                Log.info("GitHubManager::completeProvision(..) - team created ( " + teamId + " ) ; adding members: " + JSON.stringify(inputGroup.members));
                return that.addMembersToTeam(teamId, inputGroup.members);

            }).then(function (teamId: number) {
                Log.info("GitHubManager::completeProvision(..) - members added to team ( " + teamId + " ); adding team to project");
                const TEAM_PERMISSIONS = 'push';
                return that.addTeamToRepo(teamId, inputGroup.projectName, TEAM_PERMISSIONS);
            }).then(function () {
                Log.info("GitHubManager::completeProvision(..) - team added to repo; getting staff team number");
                // let staffTeamName = '310staff';
                return that.getTeamNumber(staffTeamName);
            }).then(function (staffTeamNumber: number) {
                Log.info("GitHubManager::completeProvision(..) - found staff team number ( " + staffTeamNumber + " ); adding staff to repo");
                const STAFF_PERMISSIONS = 'admin';
                return that.addTeamToRepo(staffTeamNumber, inputGroup.projectName, STAFF_PERMISSIONS);
            }).then(function () {
                Log.info("GitHubManager::completeProvision(..) - admin staff added to repo; saving url");
                return that.setGithubUrl(inputGroup.team, inputGroup.url);
            }).then(function () {
                Log.info("GitHubManager::completeProvision(..) - process complete for: " + JSON.stringify(inputGroup));
                fulfill(inputGroup);
            }).catch(function (err) {
                Log.error("GitHubManager::completeProvision(..) - ERROR: " + err);
                inputGroup.url = "";
                reject(err);
            });
        });
    }

    provisionRepo(inputGroup: GroupRepoDescription, repoName: string, importURL: string): Promise<GroupRepoDescription> {
        let that = this;
        Log.info("GitHubManager::provisionRepo(..) - start: " + JSON.stringify(inputGroup));
        return new Promise(function (fulfill, reject) {

            let initDelay = 60 * 1000;
            that.delay((inputGroup.teamIndex * 5000) + initDelay).then(function () {
                Log.info("GitHubManager::provisionProject(..) - creating repo: " + repoName);
                return that.createRepo(repoName);
            }).then(function (url: string) {
                Log.info("GitHubManager::provisionProject(..) - repo created; importing url: " + importURL);
                return that.importRepoToNewRepo(repoName, importURL);
            }).then(function () {
                Log.info("GitHubManager::provisionProject(..) - repo imported; getting team number for: " + inputGroup.teamName);
                return that.getTeamNumber(inputGroup.teamName);
            }).then(function (teamId: number) {
                Log.info("GitHubManager::provisionProject(..) - have team id ( " + teamId + " ); adding to repo");
                return that.addTeamToRepo(teamId, repoName, 'push');
            }).then(function () {
                Log.info("GitHubManager::provisionProject(..) - team added to repo; getting staff team number");
                return that.getTeamNumber('310Staff');
            }).then(function (staffTeamNumber: number) {
                Log.info("GitHubManager::provisionProject(..) - found staff team number ( " + staffTeamNumber + " ); adding staff to repo");
                return that.addTeamToRepo(staffTeamNumber, repoName, 'admin');
            }).then(function () {
                Log.info("GitHubManager::provisionProject(..) - process complete for: " + JSON.stringify(inputGroup));
                fulfill(inputGroup);
            }).catch(function (err) {
                Log.error("GitHubManager::provisionProject(..) - ERROR: " + err);
                reject(err);
            });
        });
    }


    completeClean(inputGroup: GroupRepoDescription): Promise < GroupRepoDescription > {
        let that = this;
        Log.info("GitHubManager::completeClean(..) - start: " + JSON.stringify(inputGroup));
        return new Promise(function (fulfill, reject) {

            Log.info("GitHubManager::completeClean(..) - removing project: " + inputGroup.projectName);

            that.deleteRepo(inputGroup.projectName).then(function (url: string) {

                Log.info("GitHubManager::completeClean(..) - project removed; removing team");

                return that.deleteTeam(inputGroup.teamName);

            }).then(function () {
                Log.info("GitHubManager::completeClean(..) - team removed; all done.");

                fulfill(inputGroup);
            }).catch(function (err) {
                Log.error("GitHubManager::completeProvision(..) - ERROR: " + err);
                inputGroup.url = "";
                reject(err);
            });
        });
    }


    delay(ms: number): Promise < {} > {
        // Log.info("GitHubManager::delay( " + ms + ") - start");
        return new Promise(function (resolve, reject) {
            let fire = new Date(new Date().getTime() + ms);
            Log.info("GitHubManager::delay( " + ms + " ms ) - waiting; will trigger at " + fire.toLocaleTimeString());
            setTimeout(resolve, ms);
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
 * @type {GitHubManager}
 */

//
// var gpc = new GitHubManager();
//
// try {
//     // const PROJECT_PREFIX = 'cpsc310project_team';
//     // const TEAM_PREFIX = 'cpsc310_team';
//
//     // const D1_PREFIX = 'cpsc310d1public_team';
//     // const D1_URL = 'https://github.com/CS310-2016Fall/cpsc310d1public';
//
//     // let groupDataIn: GroupRepoDescription[];
//
//     gpc.getGroupDescriptions().then(
//         function (descriptions) {
//             Log.info('ProvisioningMain() - Available teams: ' + JSON.stringify(descriptions));
//
//             const clean = false;
//             if (clean) {
//                 // really don't want to do this by accident! comment return if you actually want to clean
//                 return;
//             }
//
//             // won't normally need this
//             //var testGroup: GroupRepoDescription = {team: 1, members: ['rthse2', 'mksarge']};
//             //descriptions.push(testGroup);
//
//             let groupsToProcess: GroupRepoDescription[] = [];
//             let completeGroups: GroupRepoDescription[] = [];
//             for (var descr of descriptions) {
//                 descr.projectName = PROJECT_PREFIX + descr.team;
//                 descr.teamName = TEAM_PREFIX + descr.team;
//
//                 if (clean) {
//                     Log.info('ProvisioningMain() - Clean Team: ' + JSON.stringify(descr));
//                     groupsToProcess.push(descr);
//                 } else {
//                     //if (descr.team === 1) {
//                     if (typeof descr.url === 'undefined' || descr.url === null || descr.url === "") {
//                         // if (descr.url.length > 5) { // for all provisioned repos
//                         Log.info('ProvisioningMain() - Prepared Team: ' + JSON.stringify(descr));
//                         groupsToProcess.push(descr);
//                     } else {
//                         Log.info('ProvisioningMain() - Skipped Team: ' + JSON.stringify(descr));
//                         // Log.info('ProvisioningMain() - Team Repo Created: ' + descr.team);
//                         completeGroups.push(descr);
//                     }
// //                    }
//                 }
//             }
//
//             // set the index for available teams (used by timeout backoff)
//             for (var i = 0; i < groupsToProcess.length; i++) {
//                 let grp = groupsToProcess[i];
//                 grp.teamIndex = i;
//             }
//
//             Log.info("ProvisioningMain() - # Complete teams: " + completeGroups.length);
//
//             Log.info('ProvisioningMain() - # Teams to process: ' + groupsToProcess.length);
//             Log.info("ProvisioningMain() - Teams to process: " + JSON.stringify(completeGroups.length));
//
//             let processList: GroupRepoDescription[] = []; // this is really Promise<GroupRepoDescription>[]
//             for (var toProcess of groupsToProcess) {
//
//                 if (clean) {
//                     // clean instead of provision
//                     processList.push(<any>gpc.completeClean(toProcess));
//                 } else {
//                     // new project
//                     // processList.push(<any>gpc.completeProvision(toProcess));
//
//                     // test suite
//                     // processList.push(<any>gpc.provisionRepo(toProcess, D1_PREFIX + toProcess.team, D1_URL));
//                 }
//             }
//
//
//             var excludes: any = [];
//             excludes = [];
//             for (var toProcess of completeGroups) {
//                 //if (toProcess.projectName === 'cpsc310project_team12') {
//
//                 var include = true;
//                 for (var exclude of excludes) {
//                     if (toProcess.projectName.indexOf(exclude) >= 0) {
//                         include = false;
//                     }
//                 }
//                 if (include) {
//                     // processList.push(<any>gpc.getStats("CS310-2016Fall", toProcess.projectName));
//                     let date: Date = null;
//                     date = new Date('2016-12-02T20:00:00Z'); // TS in Zulu!
//                     processList.push(<any>gpc.getLastSHA("CS310-2016Fall", toProcess.projectName, date));
//                 } else {
//                     Log.info("Excluding: " + toProcess.projectName);
//                 }
//
//                 // }
//             }
//
//             return Promise.all(processList);
//         }).then(function (commits: any[]) {
//         Log.info('processList tasks complete; #: ' + commits.length);
//         var commentList: any[] = [];
//         var msg = '@CPSC310bot #d3 (Automatic execution to check D3 portion of D5 test grade.)';
//         var count = 0;
//         for (var commit of commits as any) {
//             count++;
//             let delay = count * 1 * 60 * 1000;
//             Log.info("Ready to make comment on repo: " + commit.repoName + "; sha: " + commit.sha + "; delay: " + (delay / 1000 / 60 / 60).toFixed(2) + ' hours');
//
//             commentList.push(gpc.makeCommitComment("CS310-2016Fall", commit.repoName, commit.sha, msg, delay));
//         }
//         return Promise.all(commentList);
//
//     }).then(function (provisionedRepos: GroupRepoDescription[]) {
//         Log.info("ProvisioningMain() - Process complete for # projects: " + provisionedRepos.length);
//
//         for (var repo of provisionedRepos) {
//             Log.info("ProvisioningMain() - Repo: " + repo.url);
//         }
//         Log.info("ProvisioningMain() - Done.");
//     }).catch(function (err: any) {
//             Log.error('ProvisioningMain() - ERROR processing project creation chain: ' + err);
//         }
//     );
// } catch (err) {
//     Log.error('ProvisioningMain() - caught ERROR: ' + err);
// }
// /*
//  let groupData: GroupRepoDescription[] = [];
//  groupDataIn.push({team: 5, members: ['rtholmes', 'rthse2']});
//  for (var gd of groupDataIn) {
//  if (typeof gd.url === 'undefined' || gd.url === null) {
//  gd.teamName = TEAM_PREFIX + gd.team;
//  gd.projectName = PROJECT_PREFIX + gd.team;
//  groupData.push(gd);
//  }
//  }*/
//
//
// /*
//  let repoList: string[] = [];
//  for (var i = 0; i < 3; i++) {
//  repoList.push('cpsc310test_team' + i);
//  }
//  */
//
// /*
//  var promises: Promise<any>[] = [];
//  for (var data of groupData) {
//  let repoName = PROJECT_PREFIX + data.team;
//  promises.push(gpc.deleteRepo(repoName));
//  }
//  Promise.all(promises).then(function (succ) {
//  Log.info('all projects deleted: ' + succ);
//  }).catch(function (err) {
//  Log.error('Error deleting projects: ' + err);
//  });
//  */
//
// // create the repos
// /*
//  gpc.createAllRepos(groupData).then(function (res) {
//  Log.info('All repos created: ' + JSON.stringify(res));
//  }).catch(function (err) {
//  Log.error('Error creating repos: ' + JSON.stringify(err));
//  });
//
//  // import the default project to the repos
//  let importUrl = 'https://github.com/CS310-2016Fall/cpsc310project';
//  gpc.importAllRepos(groupData, importUrl).then(function (res) {
//  Log.info('All repos importing: ' + JSON.stringify(res));
//  }).catch(function (err) {
//  Log.error('Error importing repos: ' + JSON.stringify(err));
//  });
//  */
//
// /*
//  gpc.createAllTeams(groupData, 'push').then(function (res) {
//  Log.info('All teams created: ' + JSON.stringify(res));
//
//  let promises: Promise<any>[] = [];
//  for (var teamRec of res) {
//  let id = teamRec.teamId;
//  let name = teamRec.teamName;
//  for (var gd of groupData) {
//  if (gd.teamName === name) {
//  promises.push(gpc.addMembersToTeam(id, gd.members));
//  }
//  }
//  }
//  return Promise.all(promises);
//  }).then(function (teamsDone) {
//  Log.info('All members successfully added to teams: ' + JSON.stringify(teamsDone));
//  }).catch(function (err: any) {
//  Log.error('Error creating teams: ' + err);
//  });
//  */
//
// /*
//  // add the teams to the repos
//  gpc.addTeamToRepos(groupData, '310Staff', 'admin').then(function (res) {
//  Log.info('Adding team to repos success: ' + JSON.stringify(res));
//  }).catch(function (err: any) {
//  Log.info('Error adding team to repos: ' + err);
//  });
//  */
//
//
//
//
//
// /*
//  // FOR IN CLASS DEMO ABOUT CALLBACKS
//
//  var gpc: GitHubManager;
//
//
//  if (typeof foo !== 'undefined' &&
//  typeof foo.bar !== = 'undefined' &&
//  typeof foo.bar.baz !== = 'undefined'
//  ) {
//
//  }
//
//
//  var foo = {bar: 'fish'};
//  Log.info(foo.bar);
//
//
//  gpc.getGroupDescriptions(function (err, data) {
//  if (err) {
//  return;
//  }
//  let g = data[0];
//  let repoName = g.projectName;
//  gpc.createRepo(repoName, function (err, worked) {
//  if (err) {
//  return;
//  }
//  gpc.createTeam(g.teamName, g.members, function (err, teamId) {
//  if (err) {
//  // return
//  }
//  // assume only one member for now
//  gpc.addMembersToTeam(teamId, members[0], function (err, success) {
//
//  }
//
//  }
//  }
//  )
//  }
//  )
//  }
//
//
//  })
//  } catch
//  (err)
//  {
//  Log.error('ProvisioningMain() - caught ERROR: ' + err);
//  }
//  */
//
//
