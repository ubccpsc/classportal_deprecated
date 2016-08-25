import React from 'react'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'
import AdminTeams from './AdminTeams'
import CreateTeam from '../shared_components/CreateTeam'
import ContentModule from '../shared_components/ContentModule'

export default React.createClass({
  render: function () {
    return (
      <div>
        <AdminTeams />
        <CreateTeam classList={this.props.classList} />
        {this.props.admin.role === "Prof" && (<CreateProjects/>)}
      </div>
    )}
})

const CreateProjects = React.createClass({
  createProjects: function () {
    console.log("Created the projects!");
  },
  render: function () {
    return (
       <ContentModule id="create-projects-module" title="Create Projects" initialHideContent={false}>
        <Form onSubmit={this.createProjects}>
          <FormField id="text-center">
            <Button type="danger" size="sm" submit>Create Projects</Button>
          </FormField>
        </Form>
    </ContentModule>
    )}        
})