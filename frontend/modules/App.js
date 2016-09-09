import React from 'react'
import {browserHistory} from 'react-router'
import config from 'config';

export default React.createClass({
  goToRoot: function (event) {
    event.preventDefault();
    browserHistory.push('/');
  },
  render: function () {
    return (
      <div>
        <div id="titlebar" onClick={this.goToRoot} >
          <img id="titlebar-img" src="../UBCLogo_Reverse.png"/>
          <h1 id="titlebar-text">{config.titlebar} | </h1>
          <h3 id="titlebar-subtext">{config.titlebar_subtext}</h3>
        </div>
        <div id="body-css">
          {this.props.children}
        </div>
        <br/><br/>
      </div>
    )
  }
})