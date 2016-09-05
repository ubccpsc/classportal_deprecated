import React from 'react'
import NavLink from '../shared_components/NavLink'
import Logout from '../shared_components/Logout'
import Ajax from '../shared_components/Ajax'
import { Row, Col, Form, FormField, FormInput, Button, Checkbox, Glyph } from 'elemental'

export default React.createClass({
  getInitialState: function() {
    return {
      adminFile: '',
      studentsFile: '',
      teamsFile: '',
      deliverablesFile: '',
      gradesFile: '',
      classlist: ''
    };
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
  componentDidMount: function () {
    this.getFilesAdmin();
  },
  render: function () {
    //todo: transition to .bind(this);
    var that = this;
    
    //Read more about passing props to this.props.children: http://stackoverflow.com/questions/32370994/how-to-pass-props-to-this-props-children
    var childrenWithProps = React.Children.map(this.props.children, function (child) {
      return React.cloneElement(child, {
        "admin": that.state.adminFile,
        "students": that.state.studentsFile,
        "teams": that.state.teamsFile,
        "deliverables": that.state.deliverablesFile,
        "grades": that.state.gradesFile,
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

        <Logout firstname={this.state.adminFile.firstname} sid={this.state.adminFile.prof ? "Prof" : "TA"} user={localStorage.user}/>

        {childrenWithProps}

      </div>
    )}
})

/*

this.getAdmin();
this.getDeliverables();
this.getClasslist();
this.getStudents();
this.getTeams();

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
*/