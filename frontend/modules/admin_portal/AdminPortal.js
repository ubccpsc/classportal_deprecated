import React from 'react'
import NavLink from '../NavLink'
import { Row, Col, Form, FormField, FormInput, Button, Checkbox, Glyph } from 'elemental'
import Logout from '../shared_components/Logout'
import AdminTeamsView from './AdminTeamsView'
import AdminDeliverables from './AdminDeliverables'
import Ajax from '../shared_components/Ajax'
var util = require('util');

export default React.createClass({
  getInitialState: function() {
    return {
      adminObject: {
          role: "Prof",
          firstname: "Michael"
        },
      studentObject: '',
      gradesObject: '',
      deliverablesObject: '',
      classList: ''
    };
  },
  getDeliverables: function () {
    Ajax.getDeliverables(
      function success (response) {
        console.log("AdminDeliverables.js| Retrieved "+response.length+" deliverables");
        this.setState({ deliverablesObject: response }, function () {
          console.log("AdminDeliverables.js| deliverablesObject set: "+JSON.stringify(this.state.deliverablesObject[1]));
        });
      }.bind(this),
      function error (xhr, status, err) {
        console.log("AdminDeliverables.js| Error retrieving deliverables!");
      }.bind(this)
    )
  },
  getClassList: function () {
    Ajax.getClassList(
      function success(response) {
        console.log("AdminPortal.js| Retreived class list: " + JSON.stringify(response));
        
        //convert classlist into format useable by Elemental Form-Select
        var classlistWithLabels = []
        for (var index = 0; index < response.length; index++){
          classlistWithLabels[index] = { "label": response[index] };
        }

        this.setState({ classList: classlistWithLabels });
      }.bind(this),
      function error(xhr, status, error) {
        console.log("AdminPortal.js| Error getting classlist!");
      }.bind(this)
    )
  },
  componentDidMount: function () {
    this.getDeliverables();
    this.getClassList();
  },
  render: function () {
    var that = this;
    //Read more about passing props to this.props.children:
    //http://stackoverflow.com/questions/32370994/how-to-pass-props-to-this-props-children
    var childrenWithProps = React.Children.map(this.props.children, function (child) {
      return React.cloneElement(child, {
        "admin": that.state.adminObject,
        "students": that.state.studentsObject,
        "grades": that.state.gradesObject,
        "deliverables": that.state.deliverablesObject,
        "classList": that.state.classList
      });
    });
    
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

        <Logout firstname={this.state.adminObject.firstname} sid={this.state.adminObject.role} user={localStorage.user}/>

        {!!this.state.deliverablesObject && !!this.state.classList && childrenWithProps}

      </div>
    )}
})