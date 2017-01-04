import React from 'react'
import { Form, FormRow, FormField, FormInput, FormIconField, Glyph, Button, InputGroup } from 'elemental'
import {browserHistory, Link} from 'react-router'
import Ajax from '../shared_components/Ajax'
import config from 'config'

export default React.createClass({
  logoutSubmit: function (event) {
    event.preventDefault();
    Ajax.logout(
      function onSuccess(response) {
        localStorage.clear();
        browserHistory.push("/login");
      }.bind(this),
      function onError(xhr, status, err) {
        /* Design: For any reason, if the logout process fails, we still log the
           user out as normal instead of leaving them stuck in the course portal.
           Similarly, the server will clear the servertoken even if there were any
           errors.
        */
        localStorage.clear();
        browserHistory.push("/login");
      }.bind(this)
    )
  },
  render: function () {
    return (
      <div className="module">
        <h3>Welcome, {this.props.firstname}!</h3>
        <InputGroup >
          <InputGroup.Section grow >
            <FormIconField iconKey="mortar-board" >
              <FormInput
                placeholder={" " + this.props.sid}
                size="sm"
                disabled />
            </FormIconField>
          </InputGroup.Section>
          <InputGroup.Section grow>
            <FormIconField iconKey="mark-github" >
              <FormInput
                placeholder={" " + this.props.username}
                size="sm"
                disabled />
            </FormIconField>
          </InputGroup.Section>
          {config.enable_app_store &&
            <InputGroup.Section>
              <Link to={this.props.app_path} target="_blank">
                <Button size="sm">
                  <Glyph icon="package"/>&nbsp; App store
                </Button>
              </Link>
            </InputGroup.Section>

          }
          <InputGroup.Section>
            <Button size="sm" onClick={this.logoutSubmit}>
              <Glyph icon="sign-out"/>&nbsp; Log out
            </Button>
          </InputGroup.Section>
        </InputGroup>
      </div>
    )
  }
})