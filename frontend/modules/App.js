import React from 'react'
import config from 'config';

export default React.createClass({
  render: function () {
    return (
      <div>
        <div id="titlebar">
          <img id="titlebar-img" src="../UBCLogo_Reverse.png"/>
          <h1 id="titlebar-text">{config.titlebar} | </h1>
          <h3 id="titlebar-subtext">{config.titlebar_subtext}</h3>
        </div>
        <div id="body-css">
          {this.props.children}
        </div>
      </div>
    )}
})