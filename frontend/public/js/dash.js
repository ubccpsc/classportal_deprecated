/**
 * Created by rtholmes on 2017-01-11.
 */

    // table docs: http://www.millstream.com.au/upload/code/tablekit/index.html?1377489802

    console.log('Page started');

function makeReq() {
    var req = new XMLHttpRequest();
    req.open('GET', 'data.json');
    req.onload = function () {
        parseJSON(req)
    };
    console.log('Sending request.');
    req.send(null);
}

function parseJSON(req, url) {
    try {
        console.log('Data received.');
        if (req.status == 200) {
            var jsonResponse = JSON.parse(req.response);
            render(jsonResponse.rows);
        }
    } catch (err) {
        console.log("ERROR: " + err);
    }
}

function render(rows)
    var results = [];
    var headers = ["Date", "Repo", "#Sec", "% overall", "% pass", "% cover", "#P", "#F", "#S", "Results"];
    results.push(headers);

    var url = window.location.search;
    console.log('url params: ' + url);
    var lastOnly = false;
    var obfuscate = false;
    var hideStaff = false;
    var deliverable = null;
    var until = new Date(new Date().getTime() + (1000 * 60 * 3600)); // some future time
    var after = new Date(0); // epoch
    var sortCol = 0;

    lastOnly = document.getElementById('optLast').checked;

    /*
     if (url.length > 1) {
     url = url.substring(1); // get rid of ?
     var parts = url.split('&');
     for (var p = 0; p < parts.length; p++) {
     if (parts[p] === 'lastOnly=true') {
     lastOnly = true;
     }
     if (parts[p] === 'obfuscate=true') {
     // console.log('obf set to true');
     obfuscate = true;
     }
     if (parts[p] === 'hideStaff=true') {
     // console.log('obf set to true');
     hideStaff = true;
     }
     if (parts[p].startsWith('sortCol=')) {
     sortCol = parts[p].substr(8, 1);
     }
     if (parts[p].startsWith('until=')) {
     until = new Date(parts[p].substr(6));
     }
     if (parts[p].startsWith('after=')) {
     after = new Date(parts[p].substr(6));
     }
     if (parts[p].startsWith('deliv=')) {
     deliverable = parts[p].substr(6);
     }
     }
     }
     */
    window.sortCol = Number(sortCol);
    console.log('lastOnly: ' + lastOnly + '; sortCol: ' + sortCol + '; obfuscate: ' + obfuscate + '; hideStaff: ' + hideStaff + '; until: ' + until + '; after: ' + after + '; deliverable: ' + deliverable);

    // sort by TS so last row of a team comes first if lastOnly is used
    rows.sort(
        function (a, b) {
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
        dStr = '<a href=\"javascript:;\" onclick=\"getStdIO(\''+row.stdioUrl+'\');\">' + dStr + '</a>';


        // var userText = row.executor;
        var userText = "N/A"; // TODO: remove
        var user = '<a href="https://github.com/' + userText + '">' + userText + '</a>';
        if (obfuscate) {
            user = CryptoJS.MD5(user) + '';// '&lt;hidden&gt;'
            user = user.substring(0, 8);
        }

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
        repo = '<a href=\"' + repo + '\">_' + repoText + '_</a>';
        if (obfuscate) {
            // repo = strhash(repo); //'&lt;hidden&gt;'
            repo = CryptoJS.MD5(repo) + '';
            repo = repo.substring(0, 8);
        }
        var duration = row.duration; // row.stats.duration / 1000; // TODO
        duration = duration.toFixed(1);
        var passTests = row.passTests.length;
        var skipTests = row.skipTests.length;
        var failedTests = row.failedTests.length;
        var totalTests = passTests + skipTests + failedTests;

        var finalGrade = row.grade;
        var coverRate = row.coverageGrade;
        var rate = row.testGrade; // row.stats.percentPass;

        var pass = passTests;///"N/A";//row.stats.pass;
        var fail = failedTests;//"N/A";//row.stats.fail;
        var skipped = skipTests;//"N/A";//row.stats.skip;

        var passing = row.passTests;//row.testKeywords.pass;
        var failing = row.failedTests; //row.testKeywords.fail;
        var skipping = row.skipTests; //row.testKeywords.skip;

        // remove empty elements
        passing = passing.filter(String);
        failing = failing.filter(String);
        skipping = skipping.filter(String);
        var all = [];
        all = all.concat(passing, failing, skipping);
        all = all.sort();

        var reason = ""; //row.firstFailure; // TODO: stop doing this
        /*
         if (reason.indexOf('~') > -1) {
         reason = '<span title="' + reason + '">' + reason.substr(1, reason.indexOf('~', 1) - 1) + '</span>';
         }
         */

        var annotated = [];
        for (var j = 0; j < all.length; j++) {
            var name = all[j];
            var state = 'unknown';
            var colour = 'grey';
            if (failing.indexOf(name) >= 0) {
                state = 'fail';
                colour = 'red';
            } else if (passing.indexOf(name) >= 0) {
                state = 'pass';
                colour = 'green';
            } else if (skipping.indexOf(name) >= 0) {
                state = 'skip';
                colour = 'white'
            } else {
                // uhoh
            }
            annotated.push({name: name, colour: colour, state: state});
        }

        //if (annotated.length === 45 || annotated.length === 50 || annotated.length === 15 || annotated.length === 35 || annotated.length === 25) {
        if (annotated.length > 0) {
            //var result = [dStr, user, repo, duration, rate, pass, fail, skipped, reason, annotated];
            // ["Date", "Commit", "#Sec", "%", "% pass", "% cover", "#P", "#F", "#S", "Results"];
            var result = [dStr, repo, duration, finalGrade, rate, coverRate, pass, fail, skipped, annotated];
            if (lastOnly === true) {
                var include = true;
                for (var l = 0; l < results.length; l++) {
                    if (results[l][1] === repo) {
                        include = false;
                    }
                }
                if (include === true) {
                    results.push(result);
                }
            } else {
                results.push(result);
            }

        } else {
            console.log('skipping row; total: ' + annotated.length + '; p: ' + pass + '; f: ' + fail + '; skip: ' + skipped);
        }
        // console.log("ts: "+ts+"; by: "+user+"; on: "+repo+"; rate: "+rate);
    }
    addTable(results);

    // ["Date", "Commit", "#Sec", "%", "% pass", "% cover", "#P", "#F", "#S", "Results"];
    var myData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var total = 0;
    var num = 0;
    for (var r of results) {
        //if (r[2].indexOf('team') > 0) { // only look at student projects for histogram
        if (r[1].indexOf('310') > 0) { // only look at student projects for histogram
            if (Number.isFinite(r[4])) {
                num++;
                total += r[4];
                var index = Math.floor(r[4] / 10);
                if (index === 10) {
                    index = 9;
                }
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
    }
    document.getElementById('bucketAvg').innerHTML = (total / totalProjects ).toFixed(1) + ' ( # ' + totalProjects + ' )';
}

function addTable(rows) {
    var myTableDiv = document.getElementById("myTableDiv");

    var table = document.createElement('TABLE');
    table.border = '1';
    table.className = 'sortable resizable';
    table.style.fontSize = '100%';

    var tableBody = document.createElement('TBODY');
    table.appendChild(tableBody);

    for (var i = 0; i < rows.length; i++) {
        var tr = document.createElement('TR');
        tableBody.appendChild(tr);
        var row = rows[i];
        for (var j = 0; j < row.length; j++) {
            var td;

            if (i === 0) {
                td = document.createElement('TH');
                if (j === 0) {
                    td.className = 'text';
                }
            } else {
                td = document.createElement('TD');
                td.style.textAlign = 'right';
            }

            if (j === 9 && i > 0) {
                var rt = document.createElement('table');
                var rtr = document.createElement('tr');
                rt.appendChild(rtr);
                var hist = row[j];
                for (var k = 0; k < hist.length; k++) {
                    var rtd = document.createElement('td');
                    rtd.style.background = hist[k].colour;
                    rtd.style.height = '1em';
                    rtd.style.width = '5';
                    rtd.style.padding = '2';
                    rtd.title = hist[k].name;
                    rtr.appendChild(rtd);
                }
                td.appendChild(rt);
            } else {
                var cell = document.createElement('span');
                cell.innerHTML = row[j];
                td.appendChild(cell);
            }
            tr.appendChild(td);
        }
    }
    myTableDiv.appendChild(table);
    var options = {
        editable: false,
        defaultSortDirection: -1
    };
    window.tableKit = new TableKit(table, options);
    window.tableKit.sort(window.sortCol, -1);
}

function strhash(str) {
    if (str.length % 32 > 0) str += Array(33 - str.length % 32).join("z");
    var hash = '', bytes = [], i = j = k = a = 0, dict = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    for (i = 0; i < str.length; i++) {
        ch = str.charCodeAt(i);
        bytes[j++] = (ch < 127) ? ch & 0xFF : 127;
    }
    var chunk_len = Math.ceil(bytes.length / 32);
    for (i = 0; i < bytes.length; i++) {
        j += bytes[i];
        k++;
        if ((k == chunk_len) || (i == bytes.length - 1)) {
            a = Math.floor(j / k);
            if (a < 32)
                hash += '0';
            else if (a > 126)
                hash += 'z';
            else
                hash += dict[Math.floor((a - 32) / 2.76)];
            j = k = 0;
        }
    }
    return hash;
}

function reqListener() {
    console.log(this.responseText);
}

function makeCall(url) {
    console.log("makeCall( "+url+" )");
    var oReq = new XMLHttpRequest();
    oReq.open("GET", url);
    oReq.setRequestHeader("Authorization", "Basic " + btoa("autodash:OUi73u9Cn04153O87VFF"));

    oReq.onload = function () {
        parseJSON(oReq);
    };
    oReq.send();
}

function getStdIO(url) {
    console.log("makeCall( "+url+" )");
    var oReq = new XMLHttpRequest();
    oReq.open("GET", url);
    oReq.setRequestHeader("Authorization", "Basic " + btoa("autodash:OUi73u9Cn04153O87VFF"));

    oReq.onload = function () {
        // parseJSON(oReq);
        var data = oReq.responseText;
        // console.log(oReq.response);

        // var data = "<p>This is 'myWindow'</p>";
        /*
         var myWindow = window.open("data:text/plain," + encodeURIComponent(data),
         "_blank", "width=200,height=100");
         myWindow.focus();
         */
        //document.open('text/plain');
        var newWindow = window.open('text/plain');

        data = data
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/\n/g, "<br/>");

        // and then do
        newWindow.document.write(data);
        //var uri = "data:text/html," + encodeURIComponent(data);
        //var newWindow = window.open(uri);

    };
    oReq.send();
}


function filterChange() {
    console.log('filter change');
    refresh();
}

function refresh() {
    var myTableDiv = document.getElementById("myTableDiv");
    myTableDiv.innerHTML = '';
    makeCall('http://skaha.cs.ubc.ca:11312/results/_design/all/_view/byDateDeliverableTeam');
}

// refresh();

