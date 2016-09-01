import React from 'react'
import { Glyph, Col, Row, Button, Alert, Form, FormField } from 'elemental'

export default React.createClass({
  handleSubmit: function (event) {
    event.preventDefault();
    window.location = "https://github.com/login/oauth/authorize?client_id=7e8402ce48a2c3f08ca1&redirect_uri=http://skaha.cs.ubc.ca:8020/postlogin";
  },
  render: function () {
    return (
      <div>
        <Form id="text-center" onSubmit={this.handleSubmit}>
          <FormField>
            <Button size="sm" submit>
              <Glyph icon="mark-github"/>
              &nbsp; Log in with GitHub
            </Button>
          </FormField>
        </Form>
      </div>
    )}
})
