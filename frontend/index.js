import React from 'react'
import { Router, Route, browserHistory, IndexRoute } from 'react-router'
import { render } from 'react-dom'
import App from './modules/App'
import PostLogin from './modules/PostLogin'
import Update from './modules/studentportal_components/Update'
import StudentPortal from './modules/studentportal_components/StudentPortal'
import Either from './modules/Either'
import Auth from './modules/Auth'
import LoginPage from './modules/login_components/LoginPage'

//using require instead of <link rel="stylesheet" href="/index.css"/>
//so we can hot reload styles in development
require("./public/index.css");

function requireAuth(nextState, replace) {
  if (!Auth.loggedIn()) {
    console.log("not logged in..." + JSON.stringify(localStorage));
    replace({
      pathname: '/login',
      state: { nextPathname: nextState.location.pathname }
    })
  }
}

function requireNotAuth(nextState, replace) {
  if (Auth.loggedIn()) {
    console.log("you are logged in..." + JSON.stringify(localStorage));
    replace({
      pathname: '/',
      state: { nextPathname: nextState.location.pathname }
    })
  }
}

render((
  <Router history={browserHistory}>
    <Route path="/" component={App}>
      <IndexRoute component={StudentPortal} onEnter={requireAuth}/>
      <Route path="login" component={LoginPage} onEnter={requireNotAuth} />
      <Route path="postlogin" component={PostLogin} />
      <Route path="update" component={Update} onEnter={requireAuth}/>
    </Route>
  </Router>
), document.getElementById('app'))

//onEnter={requireAuth}