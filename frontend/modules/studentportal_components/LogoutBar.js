import React from 'react'
import { Form, FormField, Glyph, Col, Row, Button, Alert, Spinner } from 'elemental'
import Auth from '../Auth'

export default React.createClass({
  logoutSubmit: function (e) {
    //clear all variables in the app (then refresh?)
    Auth.logout();
    localStorage.clear();
    console.log("LOGGED OUT");
  },
  render: function () {
    return (
      <div id="LogoutBar">
        <Form onSubmit={this.logoutSubmit}>
          <Button submit><Glyph icon="log-out"/> | Log out</Button>
        </Form>
      </div>
    )}
})