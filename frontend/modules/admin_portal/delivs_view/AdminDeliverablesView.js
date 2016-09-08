import React from 'react'
import AdminDeliverables from './AdminDeliverables'

export default React.createClass({
  render: function () {
    return (
      <div>
        <AdminDeliverables deliverables={this.props.deliverablesFile}/>
      </div>  
    )}
})