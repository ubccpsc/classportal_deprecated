import React from 'react'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'
import AdminTeams from './AdminTeams'
import CreateProjects from './CreateProjects'
import CreateTeam from '../../shared_components/CreateTeam'
import ContentModule from '../../shared_components/ContentModule'

export default React.createClass({
  render: function () {
    return (
      <div>
        <AdminTeams teams={this.props.teamsFile} students={this.props.studentsFile} myTeams={this.props.myAdmin.teams} />
        <CreateTeam classlist={this.props.classlist} isAdmin="true" studentName="null" students={this.props.studentsFile}/>
        {this.props.myAdmin.prof === true && (<CreateProjects />) }
      </div>
    )}
})