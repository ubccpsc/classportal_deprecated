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
      function onSuccess(response) {
        // console.log("AdminPortal.js| Retrieved files: " + JSON.stringify(response, null, 2));
        this.setState({ files: response }, function () {
          //verify files exist and are a proper format here
          if (1) {
            this.setState({ loaded: true });
          }
          else {
            alert("Error loading files for user " + localStorage.username + "!");
          }
        });
      }.bind(this),
      function onError(xhr, status, error) {
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
      app_path="/admin/apps" 
      apps={this.state.files.appsArray}
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

    // TODO: this enables or disables the autotest tab
    var navsSM = "1/3";
    var enable_autotest = true;

    if (enable_autotest) {
      navsSM = "1/4";
    } 

    return (
      <div>
        <div id="NavLinks">
          <Row>
            <Col sm={navsSM}>
              <NavLink to="/admin/teams" onlyActiveOnIndex={true}>Teams</NavLink>
            </Col>
            <Col sm={navsSM}>
              <NavLink to="/admin/students">Students</NavLink>
            </Col>
            <Col sm={navsSM}>
              <NavLink to="/admin/deliverables">Deliverables</NavLink>
            </Col>
            {enable_autotest && 
              <Col sm={navsSM}>
              <NavLink to="/admin/autotest">Autotest</NavLink>
              </Col>
            }
          </Row>
        </div>

        {this.renderLogout() }
        {this.state.loaded && childrenWithProps}
      </div>
    )
  }
})