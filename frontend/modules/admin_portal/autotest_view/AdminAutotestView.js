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
        var client = axios.create({
            baseURL: 'http://skaha.cs.ubc.ca:11312',
            timeout: 1000,
            headers: {"Authorization": "Basic " + btoa("autodash:OUi73u9Cn04153O87VFF")}
        });

        var that = this;

        client.get('/results/_design/all/_view/byDateDeliverableTeam').then(function (response) {

            var rows = response.data.rows;
            console.log('loadDashboardData - received; #rows: ' + rows.length);
            var rows = DataParser.process_dashboard_rows(rows);
            console.log('loadDashboardData - processed');

            that.setState({loaded: true, rows: rows});
        }).catch(function (error) {
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
            loaded: false
        }
    },
    sortByDate: function () {
        var timestamp_index = 10;
        var sort = this.state.sort;
        if (typeof sort['date'] === 'undefined') {
            sort['date'] = {desc: true};
        } else {
            sort['date'].desc = !sort['date'].desc;
        }

        var rows = this.state.rows;
        rows.sort(function (a, b) {
            if (sort['date'].desc) {
                return b[timestamp_index] - a[timestamp_index];
            } else {
                return a[timestamp_index] - b[timestamp_index];
            }
        });

        this.setState({sort: sort, rows: rows});
    },
    sortBy: function (key, index) {
        var timestamp_index = 10;
        var sort = this.state.sort;
        if (typeof sort[key] === 'undefined') {
            sort[key] = {desc: true};
        } else {
            sort[key].desc = !sort[key].desc;
        }

        var rows = this.state.rows;
        rows.sort(function (a, b) {
            if (sort[key].desc) {
                return b[index] - a[index];
            } else {
                return a[index] - b[index];
            }
        });

        this.setState({sort: sort, rows: rows});
    },
    renderDashboard: function () {

        var autotest_dashboard = this.state.rows.map(function (autotest_data, i) {
            var dkey = "dashboard_" + i;

            return (
                <Dashboard
                    index={i}
                    date={autotest_data[0]}
                    repo={autotest_data[1]}
                    sec={autotest_data[2]}
                    overall={autotest_data[3]}
                    pass={autotest_data[4]}
                    cover={autotest_data[5]}
                    np={autotest_data[6]}
                    nf={autotest_data[7]}
                    ns={autotest_data[8]}
                    results={autotest_data[9]}
                    ts={autotest_data[10]}
                    details={autotest_data[11]}
                    commit={autotest_data[12]}
                    key={dkey}></Dashboard>
            )
        });

        return autotest_dashboard;
    },
    render: function () {

        var headerLineStyle = {
            backgroundColor: "#002145",
            paddingTop: "5px",
            paddingBottom: "5px",
            color: "white"
        };

        var sortable = {
            color: "white"
        };

        return (
            <ContentModule id="admin-autotest-module" title={"Autotest"} initialHideContent={false}>

                <p>
                    <div>
                        Last Run Only:
                        <input id='optLast' type="checkbox" name="lastOnly" value="true" onchange="filterChange();" checked/>

                        Deliverable:
                        <select id='optDeliv' name="deliverable" onchange="filterChange();">
                            <option value="all">All</option>
                            <option value="d0">D0</option>
                            <option value="d1">D1</option>
                            <option value="d2">D2</option>
                            <option value="d3">D3</option>
                            <option value="d4">D4</option>
                            <option value="d5">D5</option>
                        </select>
                    </div>
                </p>

                {this.state.loaded &&
                <Row style={headerLineStyle}>
                    <Col sm="10%"><a style={sortable} onClick={this.sortByDate}>Date</a></Col>
                    <Col sm="20%">Repo</Col>
                    <Col sm="5%"><a style={sortable} onClick={this.sortBy.bind(this, 'nsec', 2)}>#Sec</a></Col>
                    <Col sm="7%"><a style={sortable} onClick={this.sortBy.bind(this, 'poverall', 3)}>% overall</a></Col>
                    <Col sm="7%"><a style={sortable} onClick={this.sortBy.bind(this, 'ppass', 4)}>% pass</a></Col>
                    <Col sm="8%"><a style={sortable} onClick={this.sortBy.bind(this, 'pcover', 5)}>% cover</a></Col>
                    <Col sm="5%"><a style={sortable} onClick={this.sortBy.bind(this, 'npass', 6)}>#P</a></Col>
                    <Col sm="5%"><a style={sortable} onClick={this.sortBy.bind(this, 'nfail', 7)}>#F</a></Col>
                    <Col sm="5%"><a style={sortable} onClick={this.sortBy.bind(this, 'nskip', 8)}>#S</a></Col>
                    <Col sm="28%">Results</Col>
                </Row>
                }

                <div>
                    {this.state.loaded && this.renderDashboard()}
                    <br></br>
                </div>
            </ContentModule>
        )
    }
})