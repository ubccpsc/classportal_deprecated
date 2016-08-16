import React from 'react'
import { Glyph, Col, Row, Button, Alert, Form, FormField } from 'elemental'

export default React.createClass({
  handleSubmit: function (event) {
    event.preventDefault();
  },
  render: function () {
    return (
      <div>
        <Button href="https://github.com/login/oauth/authorize?client_id=97ae59518a9d5cae2550&redirect_uri=http://localhost:4321/postlogin">
          <Glyph icon="mark-github"/>&nbsp; Log in with GitHub
        </Button>
      </div>
    )}
})