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
        <AdminTeams teams={this.props.teams} myTeams={this.props.admin.teams} />
        <CreateTeam classList={this.props.classList} />
        {this.props.admin.role === "Prof" && (<CreateProjects/>)}
      </div>
    )}
})