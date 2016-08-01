import React from 'react'
import NavLink from './NavLink'
import LoginPage from './login_components/LoginPage'
import LogoutBar from './studentportal_components/LogoutBar'
import StudentPortal from './studentportal_components/StudentPortal'
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
    console.log("checking login..."); 
    console.log(JSON.stringify(localStorage));
    if (!!localStorage.servertoken) {
      this.setState({ loggedIn: true }, function () {
        console.log("you are logged in!");
      });
    } else {
      console.log("you are NOT logged in!");
    }
  },
  render: function () {
    var showLogout;
    if (this.state.loggedIn) {
      showLogout = <LogoutBar />;
    } else {
      showLogout = null;
    }
    return (
      <div id="App">
        {showLogout}
        <div id="Title">
          <h1>Course Portal</h1>
        </div>
        <div id="NavLinks">
          <Row>
            <Col sm="1/2">
              <NavLink to="/" onlyActiveOnIndex={true}>Portal</NavLink>
            </Col>
            <Col sm="1/2">
              <NavLink to="/update">Update Info</NavLink>
            </Col>
          </Row>
        </div>
        {this.props.children}
      </div>
    )}
})