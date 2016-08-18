import React from 'react'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'

export default React.createClass({
  submitTeam: function (event) {
    event.preventDefault;
    if (1) {
      alert("Submitting team..")
    }
    else {
      alert("Error: Invalid team.")
    }
  },
  handleSelect: function () {
    //alert("Choosing team..")
  },
  formTeam: function () {
    var options1 = [{ "label": "1" }, { "label": "2" }];
    var options2 = [{ "label": "1" }, { "label": "2" }];

    return (
      <Form onSubmit={this.submitTeam}>
        <FormField>
          <FormSelect options={options1} firstOption="Select" onChange={this.handleSelect} />
        </FormField>

        <FormField>
          <FormSelect options={options2} firstOption="Select" onChange={this.handleSelect} />
        </FormField>

        <FormField>
          <Button size="sm" submit>Form Team</Button>
        </FormField>
      </Form>
    );
  },
  render: function () {
    return (
      <div className="module">
        <h3>Create Team</h3><br/>
        {this.formTeam()}
      </div>
    )}
})