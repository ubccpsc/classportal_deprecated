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
    process_dashboard_rows: function (rows, lastOnlyFilter, delivFilter, tsFilter) {
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

        if (typeof lastOnly !== 'undefined') {
            lastOnly = lastOnlyFilter;
        }
        if (typeof delivFilter !== 'undefined') {
            deliverable = delivFilter;
        }
        if (typeof tsFilter !== 'undefined') {
            until = new Date(tsFilter);
        }

        console.log('process_dashboard_rows(.., ' + lastOnly + ', ' + deliverable + ', ' + tsFilter + ' ( ' + until + ' )');

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];

            // console.log('row: '+ row);
            var docId = row.id; // only thing outside the value we want
            row = row.value;

            var date = new Date(row.timestamp);
            // console.log('considering timestamp: ' + date + '; after: ' + after);
            var ts = date.getTime();
            if (ts > until.getTime()) {
                console.log('trimmed result (after until): ' + date);
                continue;
            }

            if (ts < after.getTime()) {
                console.log('trimmed result (before after): ' + date);
                continue;
            }

            /*
             if (hideStaff === true) {
             if (row.executor === 'rtholmes' || row.executor === 'nickbradley' || row.executor === 'vivianig	') {
             console.log('trimmed result (staff): ' + row.executor);
             continue;
             }
             }
             */

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

            var repo = row.repoName;
            if (obfuscate) {
                repo = CryptoJS.MD5(repo) + '';
                repo = repo.substring(0, 8);
            }
            var duration = row.duration / 1000;
            duration = duration.toFixed(1);
            var passTests = row.passTests.length;
            var skipTests = row.skipTests.length;
            var failedTests = row.failedTests.length;

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

            var include = true;
            if (annotated.length > 0) {
                include = true;
            }
            if (include === true) {

                var result = [dStr, repo, duration, finalGrade, rate, coverRate, pass, fail, skipped, annotated, row.timestamp, row.stdioUrl, row.commitUrl];
                // dummy entry so we know what everything is
                var rowEntry = {
                    timestamp: -1,
                    date: '',
                    repo: '',
                    deliverable: '',
                    execUrl: '',
                    commitUrl: '',
                    duration: -1,
                    grade: -1,
                    testGrade: -1,
                    coverGrade: -1,
                    numPass: -1,
                    numFail: -1,
                    numSkip: -1,
                    loc: -1,
                    testDetails: {}
                };

                rowEntry.timestamp = row.timestamp;
                rowEntry.date = dStr;
                rowEntry.repo = repo;
                rowEntry.deliverable = row.deliverable;
                rowEntry.execUrl = row.stdioUrl;
                rowEntry.commitUrl = row.commitUrl;
                rowEntry.duration = duration;
                rowEntry.grade = finalGrade;
                rowEntry.testGrade = rate;
                rowEntry.coverGrade = coverRate;
                rowEntry.numPass = pass;
                rowEntry.numFail = fail;
                rowEntry.numSkip = skipped;
                rowEntry.loc = row.loc.total;
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
        }

        this.processEntries(entries);
        return entries;
    },
    processEntries: function (entries) {

        var myData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        var gradeList = [];
        var total = 0;
        var num = 0;
        var numPassing = 0;
        var numFailing = 0;
        for (var r of entries) {
            //if (r[2].indexOf('team') > 0) { // only look at student projects for histogram
            // if (r[1].indexOf('310') > 0) { // only look at student projects for histogram
            if (true) {
                if (Number.isFinite(r.grade)) {
                    var grade = Number(r.grade);

                    num++;
                    total += grade;
                    var index = Math.floor(grade / 10);
                    gradeList.push(grade);
                    if (grade >= 50) {
                        numPassing++;
                    } else {
                        numFailing++;
                    }
                    //if (index === 10) {
                    //    index = 9;
                    // }
                    // console.log('b index: ' + index + "; data: " + JSON.stringify(myData));
                    myData[index] = myData[index] + 1;
                    // console.log('a index: ' + index + "; data: " + JSON.stringify(myData));
                }
            }
        }

        console.log('Histogram: ' + JSON.stringify(myData));
        var totalProjects = 0;
        for (var i = 0; i < myData.length; i++) {
            totalProjects = totalProjects + myData[i];
        }

        for (var i = 0; i < myData.length; i++) {
            var perc = '0 %';
            if (myData[i] > 0) {
                perc = ( (myData[i] / totalProjects) * 100 ).toFixed(1) + ' %';
            }
            document.getElementById('bucket' + i).innerHTML = myData[i] + ' of ' + totalProjects + ' ( ' + perc + ' )';
            console.log("Histogram Bucket: " + i * 10 + ' %; ' + myData[i] + ' of ' + totalProjects + ' ( ' + perc + ' )');
        }
        console.log("Avg: " + (total / totalProjects ).toFixed(1) + ' ( # ' + totalProjects + ' )');
        document.getElementById('bucketAvg').innerHTML = (total / totalProjects ).toFixed(1) + ' ( # ' + totalProjects + ' )';

        gradeList = gradeList.sort(function (a, b) {
            return a - b;
        });
        var median = gradeList[Math.ceil(gradeList.length / 2)];

        document.getElementById('bucketMedian').innerHTML = median;
        document.getElementById('bucketPassing').innerHTML = numPassing;
        document.getElementById('bucketFailing').innerHTML = numFailing;
    }
};