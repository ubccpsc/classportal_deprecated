import React from 'react'
import { Glyph, Col, Row, Button, Alert, Form, FormField } from 'elemental'
import config from 'config'

export default React.createClass({
  handleSubmit: function (event) {
    event.preventDefault();
    
    var client_id = config.client_id;
    var redirect_uri = "http://" + config.host + ":" + config.port + "/postlogin";
    window.location = "https://github.com/login/oauth/authorize?client_id=" + client_id + "&redirect_uri=" + redirect_uri;
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
