import React from 'react'
import NavLink from '../shared_components/NavLink'
import Logout from '../shared_components/Logout'
import Ajax from '../shared_components/Ajax'
import { Row, Col, Form, FormField, FormInput, Button, Checkbox, Glyph } from 'elemental'

export default React.createClass({
  getInitialState: function() {
    return {
      adminObject: '',
      studentsFile: '',
      teamsFile: '',
      deliverablesFile: '',
      gradesFile: '',
      classlist: ''
    };
  },
  getFilesAdmin: function () {
    Ajax.getFilesAdmin(
      function success(response) {
        console.log("AdminPortal.js| Retrieved files.");
        this.setState({ adminObject: response.adminObject });
        this.setState({ studentsFile: response.studentsFile });
        this.setState({ teamsFile: response.teamsFile });
        this.setState({ deliverablesFile: response.deliverablesFile });
      }.bind(this),
      function error(xhr, status, error) {
        console.log("AdminPortal.js| Error getting files!");
      }.bind(this)
    )
  },
  getClasslist: function () {
    Ajax.getClasslist(
      function success(response) {
        console.log("AdminPortal.js| Retrieved class list:" + response);
        
        //convert classlist into format useable by Elemental Form-Select
        var classlistWithLabels = []
        for (var index = 0; index < response.length; index++){
          classlistWithLabels[index] = { "label": response[index] };
        }
        
        this.setState({ classlist: classlistWithLabels });
      }.bind(this),
      function error(xhr, status, error) {
        console.log("AdminPortal.js| Error getting classlist!");
      }.bind(this)
    )
  },
  componentDidMount: function () {
    this.getFilesAdmin();
    this.getClasslist();
  },
  render: function () {
    //more info: http://stackoverflow.com/questions/32370994/how-to-pass-props-to-this-props-children
    var childrenWithProps = React.Children.map(this.props.children, function (child) {
      return React.cloneElement(child, {
        "admin": this.state.adminObject,
        "students": this.state.studentsFile,
        "teams": this.state.teamsFile,
        "deliverables": this.state.deliverablesFile,
        "grades": this.state.gradesFile,
        "classlist": this.state.classlist
      });
    }.bind(this));
    
    return (
      <div>
        <div id="NavLinks">
          <Row>
            <Col sm="1/3">
              <NavLink to="/admin/teams" onlyActiveOnIndex={true}>Teams View</NavLink>
            </Col>
            <Col sm="1/3">
              <NavLink to="/admin/students">Students View</NavLink>
            </Col>
            <Col sm="1/3">
              <NavLink to="/admin/deliverables">Deliverables View</NavLink>
            </Col>
          </Row>
        </div>
        {!!this.state.adminObject && (<Logout firstname={this.state.adminObject.firstname} sid={this.state.adminObject.prof ? "Prof" : "TA"} user={localStorage.user}/>) }
        {!!this.state.adminObject && childrenWithProps}
      </div>
    )}
})