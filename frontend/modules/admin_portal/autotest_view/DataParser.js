import React from 'react'

module.exports = {
    sort_dashboard_rows: function (rows) {
        rows.sort(function (a, b) {
            a = new Date(a.value.timestamp).getTime();
            b = new Date(b.value.timestamp).getTime();
            if (a < b) {
                return 1;
            }
            if (a > b) {
                return -1;
            }
            // a must be equal to b
            return 0;
        });
        return rows;
    },
    process_dashboard_rows: function (rows) {
        rows = this.sort_dashboard_rows(rows);
        var results = [];
        var entries = [];

        var url = window.location.search;
        console.log('url params: ' + url);
        var lastOnly = false;
        var obfuscate = false;
        var hideStaff = false;
        var deliverable = null;
        var until = new Date(new Date().getTime() + (1000 * 60 * 3600)); // some future time
        var after = new Date(0); // epoch
        var sortCol = 0;

        if (document.getElementById('optLast') !== null) {
            lastOnly = document.getElementById('optLast').checked;
        }

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];

            // console.log('row: '+ row);
            var docId = row.id; // only thing outside the value we want
            row = row.value;

            var date = new Date(row.timestamp);
            console.log('considering timestamp: ' + date + '; after: ' + after);
            var ts = date.getTime();
            if (ts > until.getTime()) {
                console.log('trimmed result (after until): ' + date);
                continue;
            }

            if (ts < after.getTime()) {
                console.log('trimmed result (before after): ' + date);
                continue;
            }

            if (hideStaff === true) {
                if (row.executor === 'rtholmes' || row.executor === 'nickbradley' || row.executor === 'vivianig	') {
                    console.log('trimmed result (staff): ' + row.executor);
                    continue;
                }
            }

            if (deliverable !== null) {
                if (deliverable !== row.deliverable) {
                    console.log('trimmed result (wrong deliverable): ' + row.deliverable);
                    continue;
                }
            }

            // var d = new Date(ts-7*60*60*1000); // hack to change to our TZ
            var month = date.getMonth() + 1;
            if (month < 10) {
                month = "0" + month;
            }
            var day = date.getDate();
            if (day < 10) {
                day = "0" + day;
            }
            var hour = date.getHours();
            if (hour < 10) {
                hour = "0" + hour;
            }
            var min = date.getMinutes();
            if (min < 10) {
                min = "0" + min;
            }
            var sec = date.getSeconds();
            if (sec < 10) {
                sec = "0" + sec;
            }
            var dStr = month + "/" + day + " @ " + hour + ":" + min + ":" + sec;
            // http://skaha.cs.ubc.ca:8079/_utils/document.html?cpsc310/b0866bbc3ad3517242091b9dfa001cc9
            // dStr = '<a href="http://skaha.cs.ubc.ca:8079/_utils/document.html?cpsc310/' + docId + '">' + dStr + '</a>';
            // dStr = '<a href=\"' + row.stdioUrl + '\" onclick="makeCall(row.stdioUrl);">' + dStr + '</a>';
            // dStr = '<a href=\"javascript:;\" onclick=\"getStdIO(\'' + row.stdioUrl + '\');\">' + dStr + '</a>';


            // var userText = row.executor;
            var userText = "N/A"; // TODO: lots of hacking here
            // var user = '<a href="https://github.com/' + userText + '">' + userText + '</a>';
            var user = '';
            if (obfuscate) {
                user = CryptoJS.MD5(user) + '';// '&lt;hidden&gt;'
                user = user.substring(0, 8);
            }

            /*
             var repo = row.commitUrl;
             var repoText = repo;
             if (repo.startsWith('cpsc310project_')) {
             repoText = repo.substring(15, repo.length);
             } else if (repo === 'cpsc310project-priv') {
             repoText = 'solution';
             } else if (repo === 'rtholmes-mvp') {
             repoText = 'mvp';
             } else {
             repoText = repoText.substring(repoText.indexOf('2017Jan') + 9, 100);
             repoText = repoText.substring(repoText.indexOf('_') + 1, 100);
             repoText = repoText.substring(0, repoText.indexOf('/'));
             user = repoText;
             }
             // repo = '<a href="https://github.com/CS310-2016Fall/' + repo + '">_' + repoText + '_</a>';
             repo = repoText;
             */
            var repo = row.repoName;
            if (obfuscate) {
                // repo = strhash(repo); //'&lt;hidden&gt;'
                repo = CryptoJS.MD5(repo) + '';
                repo = repo.substring(0, 8);
            }
            var duration = row.duration / 1000;
            duration = duration.toFixed(1);
            var passTests = row.passTests.length;
            var skipTests = row.skipTests.length;
            var failedTests = row.failedTests.length;
            var totalTests = passTests + skipTests + failedTests;

            var finalGrade = row.grade;
            var coverRate = row.coverageGrade;
            var rate = row.testGrade;

            var pass = passTests;
            var fail = failedTests;
            var skipped = skipTests;

            var passing = row.passTests;
            var failing = row.failedTests;
            var skipping = row.skipTests;

            // remove empty elements
            passing = passing.filter(String);
            failing = failing.filter(String);
            skipping = skipping.filter(String);
            var all = [];
            all = all.concat(passing, failing, skipping);
            all = all.sort();

            var annotated = [];
            for (var j = 0; j < all.length; j++) {
                var name = all[j];
                var state = 'unknown';
                var colour = 'muted';
                if (failing.indexOf(name) >= 0) {
                    state = 'fail';
                    colour = 'danger';
                } else if (passing.indexOf(name) >= 0) {
                    state = 'pass';
                    colour = 'success';
                } else if (skipping.indexOf(name) >= 0) {
                    state = 'skip';
                    colour = 'default'
                } else {
                    // uhoh
                }
                annotated.push({name: name, colour: colour, state: state});
            }

            //if (annotated.length === 45 || annotated.length === 50 || annotated.length === 15 || annotated.length === 35 || annotated.length === 25) {
            if (annotated.length > 0) {
                //var result = [dStr, user, repo, duration, rate, pass, fail, skipped, reason, annotated];
                // ["Date", "Commit", "#Sec", "%", "% pass", "% cover", "#P", "#F", "#S", "Results"];
                var result = [dStr, repo, duration, finalGrade, rate, coverRate, pass, fail, skipped, annotated, row.timestamp, row.stdioUrl, row.commitUrl];

                // dummy entry so we know what everything is
                var rowEntry = {
                    timestamp: -1,
                    date: '',
                    repo: '',
                    execUrl: '',
                    commitUrl: '',
                    duration: -1,
                    grade: -1,
                    testGrade: -1,
                    coverGrade: -1,
                    numPass: -1,
                    numFail: -1,
                    numSkip: -1,
                    testDetails: {}
                };

                rowEntry.timestamp = row.timestamp;
                rowEntry.date = dStr;
                rowEntry.repo = repo;
                rowEntry.execUrl = row.stdioUrl;
                rowEntry.commitUrl = row.commitUrl;
                rowEntry.duration = duration;
                rowEntry.grade = finalGrade;
                rowEntry.testGrade = rate;
                rowEntry.coverGrade = coverRate;
                rowEntry.numPass = pass;
                rowEntry.numFail = fail;
                rowEntry.numSkip = skipped;
                rowEntry.testDetails = annotated;

                if (lastOnly === true) {
                    var include = true;
                    for (var l = 0; l < results.length; l++) {
                        if (results[l][1] === repo) {
                            include = false;
                        }
                    }
                    if (include === true) {
                        results.push(result);
                        entries.push(rowEntry);
                    }
                } else {
                    results.push(result);
                    entries.push(rowEntry);
                }

            } else {
                console.log('skipping row; total: ' + annotated.length + '; p: ' + pass + '; f: ' + fail + '; skip: ' + skipped);
            }
            // console.log("ts: "+ts+"; by: "+user+"; on: "+repo+"; rate: "+rate);
        }
        // console.log(results);
        //return results;
        return entries;
    }
};