import React from 'react'
import NavLink from '../NavLink'
import { Row, Col, Form, FormField, FormInput, Button, Checkbox, Glyph } from 'elemental'
import Logout from '../student_portal/Logout'

export default React.createClass({
  getInitialState: function() {
    return {
      studentObject: '',
      deliverablesObject: '',
      gradesObject: ''
    };
  },
  componentDidMount: function () {
    //this.getStudent();
  },
  render: function () {
    return (
      <div>
        <div className="module">
          <h3>Welcome!</h3><br/>
          <Logout sid={this.state.studentObject.sid} username={localStorage.username}/><br/>
        </div>
      </div>
    )}
})