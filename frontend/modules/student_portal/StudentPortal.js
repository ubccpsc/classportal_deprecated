import React from 'react'
import Deliverables from './Deliverables'
import Grades from './Grades'
import Info from './Info'
import Logout from './Logout'
import CreateTeam from '../shared_components/CreateTeam'
import DisplayTeam from './DisplayTeam'
import NavLink from '../NavLink'
import { Row, Col, Form, FormField, FormInput, Button, Checkbox, Glyph } from 'elemental'
import Ajax from '../shared_components/Ajax'

export default React.createClass({
  getInitialState: function() {
    return {
      studentObject: '',
      deliverablesObject: '',
      gradesObject: ''
    };
  },
  //TODO: DON'T RETURN ALL INFO on student. Make public and private keys in students.json  
  getStudent: function () {
    Ajax.getStudent(
      function success(response) {
        console.log("StudentPortal.js| Retrieved student: \n" + JSON.stringify(response));
        this.setState({ studentObject: response }, function () {
          this.getDeliverables();
        });
      }.bind(this),
      function error(xhr, status, err) {
        console.error("StudentPortal.js| Error retrieving student file!", status, err.toString());
      }.bind(this)
    )
  },
  getDeliverables: function () {
    Ajax.getDeliverables(  
      function success (response) {
        console.log("StudentPortal.js| Retrieved "+response.length+" deliverables");
        this.setState({ deliverablesObject: response }, function () {
          this.getGrades();
        });
      }.bind(this),
      function error (xhr, status, err) {
        console.log("StudentPortal.js| Error retrieving deliverables!");
      }.bind(this)
    )
  },
  getGrades: function () {
    Ajax.getDeliverables(  
      function success (response) {
        console.log("StudentPortal.js| Retrieved grades: " + response);
        this.setState({ gradesObject: response });
      }.bind(this),
      function error (xhr, status, err) {
        console.log("StudentPortal.js| Error getting grades!");
      }.bind(this)
    )
  },
  getClasslist: function () {
    return [{ "label": "asdf" }, { "label": "qwerty" }];
  },
  componentDidMount: function () {
    this.getStudent();
  },
  render: function () {
    return (
      <div>
        <div className="module">
          <h3>Welcome, {this.state.studentObject.firstname}!</h3><br/>
          <Logout sid={this.state.studentObject.sid} user={localStorage.user}/><br/>
        </div>
        
        { !!this.state.studentObject.team ?
          (<DisplayTeam teamNumber={this.state.studentObject.team}/>) : (<CreateTeam classList={this.getClasslist()} />) }

        <Deliverables deliverables={this.state.deliverablesObject}/>
        
        <Grades grades={this.state.gradesObject} deliverables={this.state.deliverablesObject}/><br/>

      </div>
    )}
})