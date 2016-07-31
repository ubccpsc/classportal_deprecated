import React from 'react'
import { Glyph, Col, Row, Button, Alert, Spinner } from 'elemental'

export default React.createClass({
  render: function () {
    return (
      <div>        
        <a href="https://github.com/login/oauth/authorize?client_id=97ae59518a9d5cae2550&redirect_uri=http://localhost:4321/postlogin">
          <Button><Glyph icon="mark-github"/> | Log in with GitHub</Button>
        </a>
      </div>
    )}
})