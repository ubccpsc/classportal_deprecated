import React from 'react'
import {Modal, ModalHeader, ModalFooter, ModalBody, Button, Card, Row, Col} from 'elemental'

export default React.createClass({
  getInitialState: function() {
    return {
      modalIsOpen: true,
      data: []
    };
  },
  render: function () {
    return (
      <div className="module">
        <h3>Deliverables</h3><br/>

        <h4>Assignment 1: Building a simple web app</h4><br/>
        open date: {this.props.open}<br/>
        due date: {this.props.due}<br/>
        criteria: <a href="http://google.com">view</a><br/>
        view submission: <a href="http://google.com"> view</a><br />
        submit: <input type="submit" value="submit" /><br/><br/><br/>
        
        <h4>Assignment 2: Building a simple web app</h4><br/>
        open date: {this.props.open}<br/>
        due date: {this.props.due}<br/>
        criteria: <a href="http://google.com">view</a><br/>
        view submission: <a href="http://google.com"> view</a><br />
        submit: <input type="submit" value="submit" /><br/><br/><br/>
        
        <h4>Assignment 3: Building a simple web app</h4><br/>
        open date: {this.props.open}<br/>
        due date: {this.props.due}<br/>
        criteria: <a href="http://google.com">view</a><br/>
        view submission: <a href="http://google.com"> view</a><br />
        submit: <input type="submit" value="submit" /><br/><br/>
      
      </div>
    )}
});