import React from 'react'
import AdminTeams from './AdminTeams'
import CreateProjects from './CreateProjects'
import CreateTeam from '../../shared_components/CreateTeam'

export default React.createClass({
  render: function () {
    return (
      <div>
        <AdminTeams teams={this.props.teamsFile} students={this.props.studentsFile} myTeams={this.props.myAdmin.teams} />
        <CreateTeam classlist={this.props.classlist} isAdmin="true" studentName="null" />
        {this.props.myAdmin.prof === true && (<CreateProjects />) }
      </div>
    )
  }
})