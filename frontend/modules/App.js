import React from 'react'
import LoginPage from './login_page/LoginPage'
import Logout from './student_portal/Logout'
import StudentPortal from './student_portal/StudentPortal'
import AdminPortal from './admin_portal/AdminPortal'

import { Row, Col, Button, Alert, Spinner } from 'elemental' 

export default React.createClass({
  render: function () {
    return (
      <div id="App">
        <div id="Title">
          <h1>Course Portal</h1>
        </div>
        {this.props.children}
      </div>
    )}
})