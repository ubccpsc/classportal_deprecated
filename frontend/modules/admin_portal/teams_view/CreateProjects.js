import React from 'react'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'
import ContentModule from '../../shared_components/ContentModule'

export default React.createClass({
  createProjects: function (e) {
    e.preventDefault();
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