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
      loaded: false,
      files: {
        "myStudentFile": {},
        "myTeamFile": {},
        "myGradesFile": {},
        "deliverablesFile": {},
        "namesArray": []
      }
    };
  },
  loadStudentPortal: function () {
    Ajax.loadStudentPortal(
      function onSuccess(response) {
        // console.log("StudentPortal.js| Retrieved files:" + JSON.stringify(response, null, 2));
        this.setState({ files: response }, function () {
          this.setState({ loaded: true });
        });
      }.bind(this),
      function onError(xhr, status, error) {
        console.log("error loading files");
      }.bind(this)
    )
  },
  renderTeamDisplay: function () {
    var renderTeam;
    if (this.state.files.myStudentFile.hasTeam === true) {
      renderTeam = (<DisplayTeam myTeamFile={this.state.files.myTeamFile} teammateNames={this.state.files.namesArray} />);
    }
    else {
      renderTeam = (
        <CreateTeam
          namesArray={this.state.files.namesArray}
          isAdmin="false"
          studentName={this.state.files.myStudentFile.firstname + " " + this.state.files.myStudentFile.lastname} />);
    }
    return renderTeam;
  },
  componentDidMount: function () {
    this.loadStudentPortal();
  },
  render: function () {
    return (
      <div>
        <Logout firstname={this.state.files.myStudentFile.firstname} sid={this.state.files.myStudentFile.sid} username={localStorage.username}/>
        {this.state.loaded && this.renderTeamDisplay() }
        {this.state.loaded && (<Deliverables deliverables={this.state.files.deliverablesFile}/>) }
      </div>
    )
  }
})