import React from 'react'
import { Glyph, Col, Row, Button, Alert, Form, FormField } from 'elemental'
import {browserHistory} from 'react-router'

export default React.createClass({
  handleSubmit: function (event) {
    event.preventDefault();
    browserHistory.push("/register");
  },
  render: function () {
    return (
      <div>
        <Form id="text-center" onSubmit={this.handleSubmit}>
          <FormField>
            <Button size="sm" submit>Register</Button>
          </FormField>
        </Form>
      </div>
    )}
})