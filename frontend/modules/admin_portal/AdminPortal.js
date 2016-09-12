import React from 'react'
import NavLink from '../shared_components/NavLink'
import Logout from '../shared_components/Logout'
import Ajax from '../shared_components/Ajax'
import { Row, Col } from 'elemental'

export default React.createClass({
  getInitialState: function () {
    return {
      loaded: false,
      files: {
        "adminsFile": {},
        "myAdminIndex": 0,
        "studentsFile": {},
        "teamsFile": {},
        "deliverablesFile": {},
        "gradesFile": {},
        "namesArray": []
      }
    };
  },
  loadAdminPortal: function () {
    Ajax.loadAdminPortal(
      function success(response) {
        // console.log("AdminPortal.js| Retrieved files: " + JSON.stringify(response, null, 2));
        this.setState({ files: response }, function () {
          this.setState({ loaded: true });
        });
      }.bind(this),
      function error(xhr, status, error) {
        console.log("AdminPortal.js| Error getting files!");
      }.bind(this)
    )
  },
  renderLogout: function () {
    var firstname = null;
    var prof = null;

    if (this.state.files.adminsFile.length >= 0) {
      firstname = this.state.files.adminsFile[this.state.files.myAdminIndex].firstname;
      prof = this.state.files.adminsFile[this.state.files.myAdminIndex].prof;
    }

    return (<Logout
      firstname={firstname}
      sid={prof ? "Prof" : "TA"}
      username={localStorage.username}/>);
  },
  componentDidMount: function () {
    this.loadAdminPortal();
  },
  render: function () {
    //more info: http://stackoverflow.com/questions/32370994/how-to-pass-props-to-this-props-children
    var childrenWithProps = React.Children.map(this.props.children, function (child) {
      return React.cloneElement(child, { "files": this.state.files });
    }.bind(this));

    return (
      <div>
        <div id="NavLinks">
          <Row>
            <Col sm="1/3">
              <NavLink to="/admin/teams" onlyActiveOnIndex={true}>Teams</NavLink>
            </Col>
            <Col sm="1/3">
              <NavLink to="/admin/students">Students</NavLink>
            </Col>
            <Col sm="1/3">
              <NavLink to="/admin/deliverables">Deliverables</NavLink>
            </Col>
          </Row>
        </div>

        {this.renderLogout() }
        {this.state.loaded && childrenWithProps}
      </div>
    )
  }
})