import React from 'react'
import NavLink from './NavLink'
import LoginPage from './login_components/LoginPage'
import LogoutBar from './studentportal_components/LogoutBar'
import StudentPortal from './studentportal_components/StudentPortal'
import { Row, Col, Button, Alert, Spinner } from 'elemental' 

export default React.createClass({
  getInitialState: function () {
    //TODO: store copy of all variables in this top-level component?
    return {
      loggedIn: '',
      username: ''
    };
  },
  componentDidMount: function () {
    //TODO: learn React event system

    console.log(JSON.stringify(localStorage));
    console.log("checking login..." + localStorage.username);
    if (localStorage.username != null) {
      this.setState({ loggedIn: true }, function () {
        console.log("logged in!");
      });
    }
  },
  render: function () {
    return (
      <div id="App">
        {this.state.loggedIn ?
          (<div>
            <LogoutBar/>
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
          </div>
      ): (<LoginPage/>) }
        {this.props.children}
      </div>
    )}
})