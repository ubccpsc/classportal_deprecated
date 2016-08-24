import React from 'react'
import GithubButton from './GithubButton'

export default React.createClass({
  render() {
    return (
      <div>
        <div className="module">
          <h3>Login</h3>
          <GithubButton/>
        </div>

        <div className="module">
          <h3>Privacy Policy</h3>
          <h5 id="privacy-text">This website uses GitHub's OAuth2 Web Application Flow to authenticate users and access your public GitHub profile. It never gains access to your login credentials, nor does it make any modifications your GitHub account.
            <br/><br/>At any time, you can view and/or revoke the access token granted, by accessing the "OAuth Applications" tab of your settings page on GitHub.  
            <br/><br/>For more information, visit: <a href="https://developer.github.com/v3/" target="blank">https://developer.github.com/v3/</a>
          </h5>
        </div>

        <div className="module">
          <h3>About</h3>
          <h5 id="about-text">
            &copy; Reid Holmes and Michael Sargent 2016
          </h5>
        </div>
        
      </div>  
    )}
})

/*
<br/><br/>Reid Holmes | <a href="https://www.cs.ubc.ca/people/reid-holmes" target="blank">https://www.cs.ubc.ca/people/reid-holmes</a>
<br/>Michael Sargent | <a href="http://www.mksarge.io" target="blank">http://www.mksarge.io</a>
*/