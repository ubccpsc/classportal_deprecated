import React from 'react'
import Deliverables from './Deliverables'
import Grades from './Grades'
import Info from './Info'
import LogoutBar from './LogoutBar'
import Teams from './Teams'
import NavLink from '../NavLink'
import { Row, Col, Button, Alert, Spinner } from 'elemental'

export default React.createClass({
  getInitialState: function() {
    return { studentObject: '' };
  },
  //TODO: DON'T RETURN ALL INFO on student. Make public and private keys in students.json  
  getStudent: function () {  
    console.log("StudentPortal.js| getStudent()");
    $.ajax({
      type: 'POST',
      url: 'http://localhost:4321/api/getStudent',
      data: {
        servertoken: localStorage.servertoken,
        username: localStorage.username
      },
      dataType: "json",
      cache: false,
      success: function(data) {
        console.log("StudentPortal.js| Response: \n"+JSON.stringify(data, null, 2));
        this.setState({ studentObject: data }, function () {
          console.log("StudentPortal.js| this.state.studentObject updated");
        });
      }.bind(this),
      error: function(xhr, status, err) {
        console.error("StudentPortal.js| getStudent error", status, err.toString());
      }.bind(this)
    });
  },
  componentDidMount: function () {
    this.getStudent();
  },
  render: function () {
    return (
      <div>
        <LogoutBar/>
        
        <div className="module">
          <h3>Welcome, {this.state.studentObject.firstname}!</h3>
        </div>
        
        <Teams team={this.state.studentObject}/>

        <Deliverables/><br/>
        
        {!!this.state.studentObject && (<Grades sid={this.state.studentObject.sid}/>)}<br/>

      </div>
    )}
})