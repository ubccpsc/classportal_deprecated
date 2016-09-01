import React from 'react'
import { Row, Col, Form, FormField, FormInput, Button, Checkbox, Glyph } from 'elemental'

import NavLink from '../NavLink'
import Logout from '../shared_components/Logout'
import Ajax from '../shared_components/Ajax'

import AdminTeamsView from './teams_view/AdminTeamsView'
import AdminStudentsView from './students_view/AdminStudentsView'
import AdminDeliverables from './delivs_view/AdminDeliverables'

var util = require('util');

export default React.createClass({
  getInitialState: function() {
    return {
      adminObject: {
          role: "TA",
          firstname: "Michael",
          teams: ["1", "2"]
        },
      teamsObject: '',
      studentsObject: '',
      gradesObject: '',
      deliverablesObject: '',
      classList: ''
    };
  },
  getDeliverables: function () {
    Ajax.getDeliverables(
      function success (response) {
        console.log("AdminDeliverables.js| Retrieved "+response.length+" deliverables.");
        this.setState({ deliverablesObject: response });
      }.bind(this),
      function error (xhr, status, err) {
        console.log("AdminDeliverables.js| Error retrieving deliverables!");
      }.bind(this)
    )
  },
  getClassList: function () {
    Ajax.getClassList(
      function success(response) {
        console.log("AdminPortal.js| Retreived class list.");

        //convert classlist into format useable by Elemental Form-Select
        var classlistWithLabels = []
        for (var index = 0; index < response.length; index++){
          classlistWithLabels[index] = { "label": response[index] };
        }
        
        this.setState({ classList: classlistWithLabels });
      }.bind(this),
      function error(xhr, status, error) {
        console.log("AdminPortal.js| Error getting classlist!");
      }.bind(this)
    )
  },
  getStudents: function () {
    Ajax.getStudents(
      function success(response) {
        console.log("AdminPortal.js| Retreived students file.");
        this.setState({ studentsObject: response });
      }.bind(this),
      function error(xhr, status, error) {
        console.log("AdminPortal.js| Error getting classlist!");
      }.bind(this)
    )
  },
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
  componentDidMount: function () {
    this.getDeliverables();
    this.getClassList();
    this.getStudents();
    this.getTeams();
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
        "classList": that.state.classList
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

        <Logout firstname={this.state.adminObject.firstname} sid={this.state.adminObject.role} user={localStorage.user}/>

        {!!this.state.deliverablesObject && !!this.state.classList && childrenWithProps}

      </div>
    )}
})