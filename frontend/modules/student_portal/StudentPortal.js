import React from 'react'
import Deliverables from './Deliverables'
import Grades from './Grades'
import Logout from '../shared_components/Logout'
import CreateTeam from '../shared_components/CreateTeam'
import DisplayTeam from './DisplayTeam'
import Ajax from '../shared_components/Ajax'

export default React.createClass({
  getInitialState: function () {
    return {
      myStudentFile: '',
      myTeamFile: '',
      myGradesFile: '',
      deliverablesFile: '',
      namesArray: []
    }
  },
  loadStudentPortal: function () {
    Ajax.loadStudentPortal(
      function success(response) {
        // console.log("StudentPortal.js| Retrieved files.");
        console.log(JSON.stringify(response, null, 2));

        this.setState({ myStudentFile: response.myStudentFile });
        this.setState({ myTeamFile: response.myTeamFile });
        this.setState({ myGradesFile: response.myGradesFile });
        this.setState({ deliverablesFile: response.deliverablesFile });

        // if student has team, do nothing to the namesArray.
        if (response.myStudentFile.hasTeam === true) {
          this.setState({ namesArray: response.namesArray });
        }
        // else, convert the namesArray into a format useable by Elemental Form-Select.
        else {
          var unformattedArray = response.namesArray;
          var formattedArray = [];
          for (var index = 0; index < unformattedArray.length; index++) {
            formattedArray[index] = { "label": unformattedArray[index] };
          }
          this.setState({ namesArray: formattedArray });
        }

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

        {this.state.myStudentFile.hasTeam === true ?
          (<DisplayTeam myTeamFile={this.state.myTeamFile} teammateNames={this.state.namesArray} />) :
          !!this.state.namesArray &&
          (<CreateTeam classlist={this.state.namesArray}
            isAdmin="false"
            studentName={this.state.myStudentFile.firstname + " " + this.state.myStudentFile.lastname} />) }

        <Deliverables deliverables={this.state.deliverablesFile}/>

      </div>
    )
  }
})