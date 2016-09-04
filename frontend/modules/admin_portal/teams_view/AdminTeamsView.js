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
        <AdminTeams teams={this.props.teams} students={this.props.students} myTeams={this.props.admin.teams} />
        <CreateTeam students={this.props.students} />
        {this.props.admin.prof && (<CreateProjects/>)}
      </div>
    )}
})