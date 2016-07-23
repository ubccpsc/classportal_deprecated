import React from 'react'
import { Link } from 'react-router'
import NavLink from './NavLink'
import { IndexLink } from 'react-router'

export default React.createClass({
  render() {
    return (
      <div id="App">
        <h1 id="Title">UBC CPSC 400 Course Portal</h1>
        <h3 id="TopLinks">
          <NavLink to="/" onlyActiveOnIndex={true}>Home</NavLink>
          <NavLink to="/about">About</NavLink>
        </h3>
        {this.props.children}
      </div>
    )}
})