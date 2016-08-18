import React from 'react'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'

export default React.createClass({
  renderMembers: function () {
    return (
      <Form type="inline" >
        <FormIconField iconPosition="left" iconKey="mortar-board" >
          <FormInput placeholder={" " + this.props.team} name="supported-controls-input-sm" size="sm" name="supported-controls-input-disabled" disabled />
        </FormIconField>
        <FormIconField iconPosition="left" iconKey="mortar-board" >
          <FormInput placeholder={" " + this.props.team} name="supported-controls-input-sm" size="sm" name="supported-controls-input-disabled" disabled />
        </FormIconField>
        <FormIconField iconPosition="left" iconKey="mortar-board" >
          <FormInput placeholder={" " + this.props.team} name="supported-controls-input-sm" size="sm" name="supported-controls-input-disabled" disabled />
        </FormIconField>
      </Form>
    );
  },
  render: function () {
    return (
      <div className="module">
        <h3>Team { this.props.teamNumber }</h3><br/>
        {this.renderMembers()}
      </div>
    )}
})