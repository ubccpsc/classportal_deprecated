import React from 'react'
import { Row, Col, Button, Alert, Spinner } from 'elemental' 
import NavLink from './NavLink'
import LoginBar from './LoginBar'
import LoginPage from './LoginPage'

export default React.createClass({
  getInitialState: function() {
    return {
      loggedIn: '',
      username: ''
    };
  },
  componentDidMount: function () {
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
        {this.state.loggedIn ? (
          <div>
            <LoginBar/>
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
          </div>) : (<LoginPage/>) }
        {this.props.children}
      </div>
    )}
})