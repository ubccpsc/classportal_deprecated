import React from 'react'

export default React.createClass({
  render: function() {
    return (
      <div>
        {this.props.data.firstname} {this.props.data.lastname}<br/><br/>
        student #: {this.props.data.sid} <br/>
        cpsc id: {this.props.data.csid}<br/>
        github: {this.props.data.github}<br/>
      </div>
    )}
});