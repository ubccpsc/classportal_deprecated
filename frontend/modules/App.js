import React from 'react'
import Config from 'Config';

export default React.createClass({
  render: function () {
    return (
      <div>
        <div id="titlebar">
          <img id="titlebar-img" src="UBCLogo_Reverse.png"/>
          <h1 id="titlebar-text">{Config.titlebar} | </h1>
          <h3 id="titlebar-subtext">{Config.titlebar_subtext}</h3>
        </div>
        <div id="body-css">
          {this.props.children}
        </div>
      </div>
    )}
})