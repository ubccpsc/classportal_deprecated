import React from 'react'
import { Row, Col, Button, Alert, Spinner } from 'elemental'

export default React.createClass({
  render: function () {
    return (
      <div className="module">
        <h3>Grades</h3><br/>
        
        <Row>
          <Col sm="1">Assignment 1: {this.props.data.assn1}<br/>
          </Col>
          <Col sm="1">Assignment 2: {this.props.data.assn2}<br/>
          </Col>
          <Col sm="1">Assignment 3: {this.props.data.assn3}<br/>
          </Col>
          <Col sm="1">Midterm: {this.props.data.midterm}<br/>
          </Col>
          <Col sm="1">Final Exam: {this.props.data.final}<br/>
          </Col>
        </Row>
      </div>
    )}
})