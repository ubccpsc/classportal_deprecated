import React from 'react'
import GithubButton from './GithubButton'

export default React.createClass({
  render() {
    return (
      <div>
        <div className="module">
          <h3>Login</h3><br/>
          <GithubButton/>
        </div>
        <div className="module">
          <h3>About</h3>
          <h5 className="text-left">
            Copyright Reid Holmes 2016.
            <br/><br/><a href="https://www.cs.ubc.ca/people/reid-holmes" target="blank">https://www.cs.ubc.ca/people/reid-holmes</a>
          </h5>
        </div>
        <div className="module">
          <h3>Privacy Policy</h3>
          <h5 className="text-left">This website does not store or otherwise gain access to your Github login credentials, nor does it make any modifications to the your Github account.
            <br/><br/>Upon first login, this application will request authorization to access your public Github profile information only.
            Any time thereafter, you can view and/or revoke this access in the "OAuth Applications" tab of your Settings page on Github.  
            <br/><br/>For more information, visit: <a href="https://developer.github.com/" target="blank">https://developer.github.com/</a>
          </h5>
        </div>
      </div>  
    )}
})