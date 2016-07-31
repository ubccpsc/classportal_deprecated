import React from 'react'
import { Form, FormField, Glyph, Col, Row, Button, Alert, Spinner } from 'elemental'

export default React.createClass({
  logoutSubmit: function (e) {
    //e.preventDefault();
    console.log("LOGGED OUT");
    localStorage.removeItem("username");
    this.setState({ loggedIn: false });

    //also need to clear all variables in the app
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