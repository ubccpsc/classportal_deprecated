import React from 'react'

export default React.createClass({
   render: function() {
    return (
      <div>
        team #: {this.props.data.team} <br/>
        team members: {this.props.data.members} <br/>
      </div>
    )}
})