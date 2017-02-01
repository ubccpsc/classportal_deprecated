import React from 'react';
import ContentModule from '../../shared_components/ContentModule';
import Dashboard from './Dashboard'
import DataParser from './DataParser'
import axios from 'axios'

import {
    Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Dropdown,
    Glyph, Button, ButtonGroup,
    Row, Col,
    Modal, ModalHeader, ModalBody, ModalFooter
} from 'elemental'


export default React.createClass({
    loadDashboardData: function () {
        console.log('AdminAutoTestView::loadDashboardData() - start');
        var start = new Date().getTime();
        var client = axios.create({
            baseURL: 'http://skaha.cs.ubc.ca:11312',
            timeout: 10000,
            headers: {"Authorization": "Basic " + btoa(localStorage.getItem('autodash'))}
        });

        var that = this;

        client.get('/results/_design/all/_view/byDateDeliverableTeam').then(function (response) {
            var rows = response.data.rows;
            console.log('AdminAutoTestView::loadDashboardData() - received; #rows: ' + rows.length + '; took: ' + (new Date().getTime() - start) + ' ms');
            var rows = DataParser.process_dashboard_rows(rows);
            console.log('AdminAutoTestView::loadDashboardData() - processed');

            that.setState({loaded: true, rows: rows});
        }).catch(function (err) {
            console.log('AdminAutoTestView::loadDashboardData() - ERROR: ' + err.message);
            // the password in config.autotest_dashboard is probably incorrect
            // window.alert('AutoDash not configured correctly');
            document.getElementById('autoDashStats').innerHTML = '<h1>AutoDash not configured</h1>';
            that.setState({loaded: true});
        });
    },
    componentDidMount: function () {
        this.loadDashboardData();
    },
    getInitialState: function () {
        return {
            rows: [],
            sort: {},
            loaded: false,
            lastOnly: true,
            deliverable: "d1"
        }
    },
    sortByDate: function () {
        var sort = this.state.sort;
        if (typeof sort['date'] === 'undefined') {
            sort['date'] = {desc: true};
        } else {
            sort['date'].desc = !sort['date'].desc;
        }

        var rows = this.state.rows;
        rows.sort(function (a, b) {
            var tsKey = 'timestamp';
            if (sort['date'].desc) {
                return b[tsKey] - a[tsKey];
            } else {
                return a[tsKey] - b[tsKey];
            }
        });
        this.setState({sort: sort, rows: rows});
    },
    sortBy: function (key, index) {
        var sort = this.state.sort;
        if (typeof sort[key] === 'undefined') {
            sort[key] = {desc: true};
        } else {
            sort[key].desc = !sort[key].desc;
        }

        var rows = this.state.rows;
        rows.sort(function (a, b) {
            var aVal = a[key];
            var bVal = b[key];

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                if (sort[key].desc) {
                    if (aVal < bVal) {
                        return 1;
                    } else {
                        return -1;
                    }
                } else {
                    if (aVal > bVal) {
                        return 1;
                    } else {
                        return -1;
                    }
                }
            } else {
                if (sort[key].desc) {
                    return bVal - aVal;
                } else {
                    return aVal - bVal;
                }
            }
        });
        this.setState({sort: sort, rows: rows});
    },
    renderDashboard: function () {

        var autotest_dashboard = this.state.rows.map(function (data, i) {
            var dkey = "dashboard_" + i;

            return (
                <Dashboard
                    index={i}
                    // date={autotest_data[0]}
                    date={data.date}
                    // repo={autotest_data[1]}
                    repo={data.repo}
                    // sec={autotest_data[2]}
                    sec={data.duration}
                    // overall={autotest_data[3]}
                    overall={data.grade}
                    //pass={autotest_data[4]}
                    pass={data.testGrade}
                    //cover={autotest_data[5]}
                    cover={data.coverGrade}
                    //np={autotest_data[6]}
                    np={data.numPass}
                    //nf={autotest_data[7]}
                    nf={data.numFail}
                    //ns={autotest_data[8]}
                    ns={data.numSkip}
                    //results={autotest_data[9]}
                    results={data.testDetails}
                    //ts={autotest_data[10]}
                    ts={data.timestamp}
                    //details={autotest_data[11]}
                    details={data.execUrl}
                    //commit={autotest_data[12]}
                    commit={data.commitUrl}
                    key={dkey}></Dashboard>
            )
        });

        return autotest_dashboard;
    },
    lastOnlyChange: function (event) {
        console.log('AdminAutotestView::lastOnlyChange()');
        var that = this;

        this.setState({lastOnly: event.target.checked}, function () {
            console.log('AdminAutotestView::lastOnlyChange() - cb');
        });
    },
    deliverableChange: function (event) {
        console.log('AdminAutotestView::deliverableChange()');
        var that = this;
        this.setState({deliverable: event.target.value}, function () {
            console.log('AdminAutotestView::deliverableChange() - cb');
            // that.renderDashboard();
        });
    },
    render: function () {
        console.log('AdminAutotestView::render()');
        var headerLineStyle = {
            backgroundColor: "#002145",
            paddingTop: "5px",
            paddingBottom: "5px",
            color: "white"
        };

        var sortable = {
            color: "white"
        };

        console.log("current state; lastOnly " + this.state.lastOnly + '; deliv: ' + this.state.deliverable);
        return (
            <ContentModule id="admin-autotest-module" title={"Autotest"} initialHideContent={false}>

                <div>
                    Last Run Only:
                    <input id='optLast' type="checkbox" name="lastOnly" checked={this.state.lastOnly} onChange={this.lastOnlyChange}/>

                    Deliverable:
                    <select id='optDeliv' name="deliverable" value={this.state.deliv} onChange={this.deliverableChange}>
                        <option value="all">All</option>
                        <option value="d0">D0</option>
                        <option value="d1">D1</option>
                        <option value="d2">D2</option>
                        <option value="d3">D3</option>
                        <option value="d4">D4</option>
                        <option value="d5">D5</option>
                    </select>
                </div>

                {this.state.loaded &&
                <Row style={headerLineStyle}>
                    <Col sm="10%"><a style={sortable} onClick={this.sortByDate}>Date</a></Col>
                    <Col sm="20%"><a style={sortable} onClick={this.sortBy.bind(this, 'repo', 2)}>Repo</a></Col>
                    <Col sm="5%"><a style={sortable} onClick={this.sortBy.bind(this, 'duration', 2)}>#Sec</a></Col>
                    <Col sm="7%"><a style={sortable} onClick={this.sortBy.bind(this, 'grade', 3)}>% overall</a></Col>
                    <Col sm="7%"><a style={sortable} onClick={this.sortBy.bind(this, 'testGrade', 4)}>% pass</a></Col>
                    <Col sm="8%"><a style={sortable} onClick={this.sortBy.bind(this, 'coverGrade', 5)}>% cover</a></Col>
                    <Col sm="5%"><a style={sortable} onClick={this.sortBy.bind(this, 'numPass', 6)}>#P</a></Col>
                    <Col sm="5%"><a style={sortable} onClick={this.sortBy.bind(this, 'numFail', 7)}>#F</a></Col>
                    <Col sm="5%"><a style={sortable} onClick={this.sortBy.bind(this, 'numSkip', 8)}>#S</a></Col>
                    <Col sm="28%">Results</Col>
                </Row>
                }

                <div>
                    {this.state.loaded && this.renderDashboard()}
                    <br></br>
                </div>

                <div id="autoDashStats">
                    <h2>AutoTest Statistics</h2>
                    <span><b>Average</b> <span id="bucketAvg"></span></span><br/><br/>
                    <span>00-10% <span id="bucket0"></span></span><br/>
                    <span>10-20% <span id="bucket1"></span></span><br/>
                    <span>20-30% <span id="bucket2"></span></span><br/>
                    <span>30-40% <span id="bucket3"></span></span><br/>
                    <span>40-50% <span id="bucket4"></span></span><br/>
                    <span>50-60% <span id="bucket5"></span></span><br/>
                    <span>60-70% <span id="bucket6"></span></span><br/>
                    <span>70-80% <span id="bucket7"></span></span><br/>
                    <span>80-90% <span id="bucket8"></span></span><br/>
                    <span>90-99% <span id="bucket9"></span></span><br/>
                    <span>100% <span id="bucket10"></span></span><br/><br/>
                </div>

            </ContentModule>
        )
    } // render
}) // create class