import React from 'react'
import Deliverables from './Deliverables'
import Grades from './Grades'
import Info from './Info'
import Logout from '../shared_components/Logout'
import CreateTeam from '../shared_components/CreateTeam'
import DisplayTeam from './DisplayTeam'
import { Row, Col, Form, FormField, FormInput, Button, Checkbox, Glyph } from 'elemental'
import Ajax from '../shared_components/Ajax'

export default React.createClass({
  getInitialState: function () {
    return {
      myStudentFile: '',
      myTeamFile: '',
      myGradesFile: '',
      deliverablesFile: '',
      classlist: ''
    }
  },
  loadStudentPortal: function () {
    Ajax.loadStudentPortal(
      function success(response) {
        // console.log("StudentPortal.js| Retrieved files.");
        // console.log(JSON.stringify(response, null, 2));

        this.setState({ myStudentFile: response.myStudentFile });
        this.setState({ myTeamFile: response.myTeamFile });
        this.setState({ myGradesFile: response.myGradesFile });
        this.setState({ deliverablesFile: response.deliverablesFile });

        //convert classlist into format useable by Elemental Form-Select
        var unformattedClasslist = response.classlist;
        var formattedClasslist = [];
        for (var index = 0; index < unformattedClasslist.length; index++) {
          formattedClasslist[index] = { "label": unformattedClasslist[index] };
        }
        this.setState({ classlist: formattedClasslist });

      }.bind(this),
      function error(xhr, status, error) {
        // console.log("StudentPortal.js| Error getting files!");
      }.bind(this)
    )
  },
  componentDidMount: function () {
    this.loadStudentPortal();
  },
  render: function () {
    return (
      <div>
        <Logout firstname={this.state.myStudentFile.firstname} sid={this.state.myStudentFile.sid} username={localStorage.username}/>

        {!!this.state.myStudentFile.hasTeam ?
          (<DisplayTeam myTeamFile={this.state.myTeamFile} />) :
          !!this.state.classlist && (<CreateTeam classlist={this.state.classlist} isAdmin="false" studentName={this.state.myStudentFile.firstname + " " + this.state.myStudentFile.lastname} />) }

        <Deliverables deliverables={this.state.deliverablesFile}/>

      </div>
    )
  }
})