import React from 'react'
import {browserHistory } from 'react-router'
import {Form, FormField, Button, FormInput, FormIconField, Glyph} from 'elemental'
import Ajax from '../shared_components/Ajax'
import config from 'config'

const sidRegex = /^([0-9]){8}$/;
const csidRegex = /^[a-z][0-9][a-z][0-9]$/;

export default React.createClass({
  handleSubmit: function (event) {
    event.preventDefault();
    var sid = event.target.elements[0].value;
    var csid = event.target.elements[1].value;

    Ajax.register(
      csid,
      sid,
      function onSuccess() {
        //clear any previously set values in localstorage
        localStorage.clear();

        //set sid and csid for later use by postlogin
        localStorage.setItem('sid', sid);
        localStorage.setItem('csid', csid);

        //login with github
        var client_id = config.client_id;
        var redirect_uri = "http://" + config.host + ":" + config.port + "/postlogin";
        window.location = "https://github.com/login/oauth/authorize?client_id=" + client_id + "&redirect_uri=" + redirect_uri;
      }.bind(this),
      function onError(xhr, status, err) {
        var err_msg = JSON.parse(xhr.responseText);
        alert("Error: " + err_msg);

        //clear any previously set values in localstorage
        localStorage.clear();
      }.bind(this)
    )
  },
  render: function () {
    return (
      <div className="module">
        <h3>Register</h3>
        <p>Please confirm your student identity to continue registration.</p><br/><br/>
        <Form onSubmit={this.handleSubmit} className="form" type="horizontal">
          <FormIconField label="UBC Student Number" iconPosition="left" iconKey="mortar-board">
            <FormInput placeholder="eg. 12345678"/>
          </FormIconField>
          <FormIconField label="Computer Science ID" iconPosition="left" iconKey="keyboard">
            <FormInput placeholder="eg. a1b2"/>
          </FormIconField>
          <FormField offsetAbsentLabel>
            <Button submit>
              <Glyph icon="mark-github"/>
              &nbsp; Continue to GitHub
            </Button>
          </FormField>
        </Form>
      </div>
    )
  }
})