import React from 'react'
import {browserHistory} from 'react-router'
import config from 'config';

export default React.createClass({
  goToRoot: function (event) {
    event.preventDefault();
    //go to root path
    window.location = "http://" + config.host + ":" + config.port + "/";
  },
  render: function () {
    return (
      <div>
        <div id="titlebar" onClick={this.goToRoot} >
          <img id="titlebar-img" src="../UBCLogo_Reverse.png"/>
          <div id="titlebar-text">{config.titlebar}</div>
          <div id="titlebar-subtext">{config.titlebar_subtext}</div>
        </div>
        <div id="body-css">
          {this.props.children}
        </div>
        <br/><br/>
      </div>
    )
  }
})