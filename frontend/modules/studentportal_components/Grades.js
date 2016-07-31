import React from 'react'

export default React.createClass({
  render: function () {
    return (
      <div>
        Assn1: {this.props.data.assn1}<br/>
        Assn2: {this.props.data.assn2}<br/>
        Assn3: {this.props.data.assn3}<br/>
        Midterm: {this.props.data.midterm}<br/>
        Final Exam: {this.props.data.final}<br/>
      </div>
    )}
})