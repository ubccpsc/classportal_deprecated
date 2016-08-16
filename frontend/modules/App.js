import React from 'react'
import LoginPage from './login_page/LoginPage'
import Logout from './student_portal/Logout'
import StudentPortal from './student_portal/StudentPortal'
import AdminPortal from './admin_portal/AdminPortal'

import { Row, Col, Button, Alert, Spinner } from 'elemental' 

export default React.createClass({
  getInitialState: function () {
    //TODO: decide which variables to be storing here.
    //figure out how to keep only 1 copy of all variables needed in this app.
    return {
      loggedIn: '',
      username: ''
    };
  },
  componentDidMount: function () {
    //TODO: learn React event system so i don't have to keep looping the below code.
    console.log("App.js| Checking login.."); 
    if (!!localStorage.servertoken) {
      this.setState({ loggedIn: true }, function () {
        console.log("App.js| Logged in as: "+localStorage.username);
      });
    } else {
      console.log("App.js| Not logged in. localStorage: " + JSON.stringify(localStorage));
    }
  },
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