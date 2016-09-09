import React from 'react'
import NavLink from '../shared_components/NavLink'
import Logout from '../shared_components/Logout'
import Ajax from '../shared_components/Ajax'
import { Row, Col, Form, FormField, FormInput, Button, Checkbox, Glyph } from 'elemental'

export default React.createClass({
  getInitialState: function () {
    return {
      myAdmin: '',
      adminsFile: '',
      studentsFile: '',
      teamsFile: '',
      deliverablesFile: '',
      gradesFile: '',
      classlist: ''
    };
  },
  loadAdminPortal: function () {
    Ajax.loadAdminPortal(
      function success(response) {
        console.log("AdminPortal.js| Retrieved files.");
        console.log(JSON.stringify(response, null, 2));

        this.setState({ myAdmin: response.myAdmin });
        this.setState({ adminsFile: response.adminsFile });
        this.setState({ studentsFile: response.studentsFile });
        this.setState({ teamsFile: response.teamsFile });
        this.setState({ deliverablesFile: response.deliverablesFile });
        this.setState({ gradesFile: response.gradesFile });

        //convert classlist into format useable by Elemental Form-Select
        var unformattedClasslist = response.classlist;
        var formattedClasslist = [];
        for (var index = 0; index < unformattedClasslist.length; index++) {
          formattedClasslist[index] = { "label": unformattedClasslist[index] };
        }
        this.setState({ classlist: formattedClasslist });

      }.bind(this),
      function error(xhr, status, error) {
        console.log("AdminPortal.js| Error getting files!");
      }.bind(this)
    )
  },
  componentDidMount: function () {
    this.loadAdminPortal();
  },
  render: function () {
    //more info: http://stackoverflow.com/questions/32370994/how-to-pass-props-to-this-props-children
    var childrenWithProps = React.Children.map(this.props.children, function (child) {
      return React.cloneElement(child, {
        "myAdmin": this.state.myAdmin,
        "adminsFile": this.state.adminsFile,
        "studentsFile": this.state.studentsFile,
        "teamsFile": this.state.teamsFile,
        "deliverablesFile": this.state.deliverablesFile,
        "gradesFile": this.state.gradesFile,
        "classlist": this.state.classlist
      });
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
        <Logout firstname={this.state.myAdmin.firstname} sid={this.state.myAdmin.prof ? "Prof" : "TA"} username={localStorage.username}/>
        {!!this.state.adminsFile && childrenWithProps}
      </div>
    )
  }
})