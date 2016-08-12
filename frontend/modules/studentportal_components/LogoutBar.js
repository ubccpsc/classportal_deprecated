import React from 'react'
import { Form, FormField, Glyph, Col, Row, Button, Alert, Spinner } from 'elemental'
import Auth from '../Auth'

export default React.createClass({
  logoutSubmit: function (e) {
    //clear all variables in the app (then refresh?)
    Auth.logout();
    localStorage.clear();
    console.log("Logout.js| Logged out!");
  },
  render: function () {
    return (
      <Form id="text-center" onSubmit={this.logoutSubmit}>
        <Button submit><Glyph icon="sign-out"/>&nbsp; Log out</Button>
      </Form>
    )}
})