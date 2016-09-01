//parent component for all content modules.
//required props: id (string), title (string), initialHideContent (boolean)

import React from 'react'
import { Row, Col, Button, Alert, Glyph, Spinner } from 'elemental'

export default React.createClass({
  getInitialState: function () {
    return { hideContent: this.props.initialHideContent };
  },
  showOrHide: function (e) {
    e.preventDefault;
    this.setState({ hideContent: !this.state.hideContent });
  },
  render: function () {
    var display = {
      display: this.state.hideContent ? "none" : "block"
    }
    
    return (
      <div className="module"> 
        <Button className="absolute-pos" onClick={this.showOrHide} type={this.state.hideContent ? "primary" : "hollow-primary"} size="sm">
          <Glyph icon={this.state.hideContent ? "plus" : "dash"} />
        </Button>
        
        <h3 className="text-center">{this.props.title}</h3>

        <div className="text-center" id={this.props.id} style={display} >
          {this.props.children}
        </div>
      </div>
  )}
})