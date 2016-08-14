import React from 'react'
import { Router, Route, browserHistory, IndexRoute, IndexRedirect } from 'react-router'
import { render } from 'react-dom'
import App from './modules/App'
import PostLogin from './modules/PostLogin'
import Register from './modules/Register'
import StudentPortal from './modules/student_portal/StudentPortal'
import AdminPortal from './modules/admin_portal/AdminPortal'
import Auth from './modules/Auth'
import LoginPage from './modules/login_page/LoginPage'

//using require instead of <link rel="stylesheet" href="/index.css"/>
//so we can hot reload styles in development
require("./public/index.css");

function requireAuth(nextState, replace) {
  if (!Auth.loggedIn()) {
    console.log("Index.js| Not logged in: redirecting to login page. localStorage: " + JSON.stringify(localStorage));
    replace({
      pathname: '/login',
      state: { nextPathname: nextState.location.pathname }
    })
  }
}

function requireAdminAuth(nextState, replace) {
  if (!localStorage.admin) {
    console.log("Index.js| Admin not logged in: redirecting to login page. localStorage: " + JSON.stringify(localStorage));
    replace({
      pathname: '/login',
      state: { nextPathname: nextState.location.pathname }
    })
  }
}

function requireNotAuth(nextState, replace) {
  if (Auth.loggedIn()) {
    console.log("Index.js| Logged in: redirecting to homepage. localStorage: " + JSON.stringify(localStorage));
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
      <Route path="register" component={Register} onEnter={requireAuth} />
      <Route path="admin" component={AdminPortal} onEnter={requireAdminAuth} />
    </Route>
  </Router>
), document.getElementById('app'))

/* onEnter={requireAuth}
react events
limit login requests
work on memoryStore
*/