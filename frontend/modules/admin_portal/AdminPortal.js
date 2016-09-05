import React from 'react'
import { Row, Col, Form, FormField, FormInput, Button, Checkbox, Glyph } from 'elemental'

import NavLink from '../shared_components/NavLink'
import Logout from '../shared_components/Logout'
import Ajax from '../shared_components/Ajax'

import AdminTeamsView from './teams_view/AdminTeamsView'
import AdminStudentsView from './students_view/AdminStudentsView'
import AdminDeliverables from './delivs_view/AdminDeliverables'

var util = require('util');

export default React.createClass({
  getInitialState: function() {
    return {
      adminObject: '',
      teamsObject: '',
      studentsObject: '',
      gradesObject: '',
      deliverablesObject: '',
      classlist: ''
    };
  },
  //returns admin object from admins.json
  getAdmin: function () {
    Ajax.getAdmin(
      function success(response) {
        console.log("AdminPortal.js| Retreived admin file. " + response);
        this.setState({ adminObject: response });
      }.bind(this),
      function error(xhr, status, error) {
        console.log("AdminPortal.js| Error getting admin!");
      }.bind(this)
    )
  },
  //returns teams.json
  getTeams: function () {
    Ajax.getTeams(
      function success(response) {
        console.log("AdminPortal.js| Retreived teams file.");
        this.setState({ teamsObject: response });
      }.bind(this),
      function error(xhr, status, error) {
        console.log("AdminPortal.js| Error getting teams!");
      }.bind(this)
    )
  },
  //returns students.json
  getStudents: function () {
    Ajax.getStudents(
      function success(response) {
        console.log("AdminPortal.js| Retreived students file.");
        this.setState({ studentsObject: response });
      }.bind(this),
      function error(xhr, status, error) {
        console.log("AdminPortal.js| Error getting students!");
      }.bind(this)
    )
  },
  //returns deliverables.json
  getDeliverables: function () {
    Ajax.getDeliverables(
      function success (response) {
        console.log("AdminPortal.js| Retrieved deliverables file.");
        this.setState({ deliverablesObject: response });
      }.bind(this),
      function error (xhr, status, err) {
        console.log("AdminPortal.js| Error retrieving deliverables!");
      }.bind(this)
    )
  },
  getClasslist: function () {
    Ajax.getClasslist(
      function success(response) {
        console.log("AdminPortal.js| Retrieved class list:" + response);
        
        //convert classlist into format useable by Elemental Form-Select
        var classlistWithLabels = []
        for (var index = 0; index < response.length; index++){
          classlistWithLabels[index] = { "label": response[index] };
        }
        
        this.setState({ classlist: classlistWithLabels });
      }.bind(this),
      function error(xhr, status, error) {
        console.log("AdminPortal.js| Error getting classlist!");
      }.bind(this)
    )
  },
  getFilesAdmin: function () {
    Ajax.getFilesAdmin(
      function success(response) {
        console.log("AdminPortal.js| Retrieved files!");
        console.log("AdminPortal.js| admins.json: " + response.admins);
        console.log("AdminPortal.js| students.json: " + response.students);
        console.log("AdminPortal.js| teams.json: " + response.teams);
        console.log("AdminPortal.js| deliverables.json: " + response.deliverables);
      }.bind(this),
      function error(xhr, status, error) {
        console.log("AdminPortal.js| Error getting files!");
      }.bind(this)
    )
  },
  componentDidMount: function () {
    this.getFilesAdmin();
    
    /*this.getAdmin();
    this.getDeliverables();
    this.getClasslist();
    this.getStudents();
    this.getTeams();
    */
  },
  render: function () {
    var that = this;
    //Read more about passing props to this.props.children:
    //http://stackoverflow.com/questions/32370994/how-to-pass-props-to-this-props-children
    var childrenWithProps = React.Children.map(this.props.children, function (child) {
      return React.cloneElement(child, {
        "admin": that.state.adminObject,
        "teams": that.state.teamsObject,
        "students": that.state.studentsObject,
        "grades": that.state.gradesObject,
        "deliverables": that.state.deliverablesObject,
        "classlist": that.state.classlist
      });
    });
    
    return (
      <div>
        <div id="NavLinks">
          <Row>
            <Col sm="1/3">
              <NavLink to="/admin/teams" onlyActiveOnIndex={true}>Teams View</NavLink>
            </Col>
            <Col sm="1/3">
              <NavLink to="/admin/students">Students View</NavLink>
            </Col>
            <Col sm="1/3">
              <NavLink to="/admin/deliverables">Deliverables View</NavLink>
            </Col>
          </Row>
        </div>

        <Logout firstname={this.state.adminObject.firstname} sid={this.state.adminObject.prof ? "Prof" : "TA"} user={localStorage.user}/>

        {!!this.state.deliverablesObject && !!this.state.classlist && childrenWithProps}

      </div>
    )}
})