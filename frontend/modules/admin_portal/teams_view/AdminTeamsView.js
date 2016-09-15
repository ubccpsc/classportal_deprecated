import React from 'react'
import AdminTeams from './AdminTeams'
import CreateProjects from './CreateProjects'
import CreateTeam from '../../shared_components/CreateTeam'

export default React.createClass({
  render: function () {
    return (
      <div>
        <AdminTeams
          teams={this.props.files.teamsFile}
          students={this.props.files.studentsFile}
          admins={this.props.files.adminsFile}
          myAdminIndex = {this.props.files.myAdminIndex} />
        <CreateTeam
          namesArray={this.props.files.namesArray}
          isAdmin="true"
          studentName="null" />
        {this.props.files.adminsFile[this.props.files.myAdminIndex].prof === true && (<CreateProjects />) }
      </div>
    )
  }
})