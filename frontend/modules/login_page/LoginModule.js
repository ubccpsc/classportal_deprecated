import React from 'react'
import {browserHistory} from 'react-router'
import { Form, FormRow, FormField, Button, Glyph, ButtonGroup } from 'elemental'
import config from 'config'

export default React.createClass({
  registerButton: function (event) {
    event.preventDefault();
    browserHistory.push("/register");
  },
  loginButton: function (event) {
    event.preventDefault();
    var client_id = config.client_id;
    var redirect_uri = "http://" + config.host + ":" + config.port + "/postlogin";
    window.location = "https://github.com/login/oauth/authorize?client_id=" + client_id + "&redirect_uri=" + redirect_uri;
  },
  render() {
    return (
      <div className="module">
        <h3>Login</h3>
        <Form id="text-center">
          <FormField>
            <ButtonGroup>
              <Button id="1" size="sm" onClick={this.registerButton}>
                <Glyph icon="bookmark"/>
                &nbsp; Register Account
              </Button>
              <Button id="2" size="sm" onClick={this.loginButton}>
                <Glyph icon="mark-github"/>
                &nbsp; Log in with GitHub
              </Button>
            </ButtonGroup>
          </FormField>
        </Form>
      </div>
    )
  }
})