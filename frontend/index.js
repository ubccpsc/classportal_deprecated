import React from 'react'
import { Router, Route, browserHistory, IndexRoute, IndexRedirect } from 'react-router'
import { render } from 'react-dom'
import App from './modules/App'
import StudentPortal from './modules/student_portal/StudentPortal'
import AdminPortal from './modules/admin_portal/AdminPortal'
import AdminTeamsView from './modules/admin_portal/teams_view/AdminTeamsView'
import AdminStudentsView from './modules/admin_portal/students_view/AdminStudentsView'
import AdminDeliverablesView from './modules/admin_portal/delivs_view/AdminDeliverablesView'
import LoginPage from './modules/login_page/LoginPage'
import RegisterPage from './modules/register_page/RegisterPage'
import PostloginPage from './modules/postlogin_page/PostloginPage'

//require here instead of <link> in index.html, so we can hot reload css in dev.
require("./public/index.css");

render((
  <Router history={browserHistory}>
    <Route path="/" component={App}>
      <IndexRoute component={StudentPortal} onEnter={requireStudentAuth}/>
      <Route path="login" component={LoginPage} onEnter={requireNoAuth} />
      <Route path="postlogin" component={PostloginPage} onEnter={requireNoAuth} />
      <Route path="register" component={RegisterPage} onEnter={requireNoAuth} />
      <Route path="admin" component={AdminPortal} onEnter={requireAdminAuth} >
        <IndexRedirect to="teams" />
        <Route path="teams" component={AdminTeamsView} onEnter={requireAdminAuth} />
        <Route path="students" component={AdminStudentsView} onEnter={requireAdminAuth} />
        <Route path="deliverables" component={AdminDeliverablesView} onEnter={requireAdminAuth} />
      </Route>
    </Route>
  </Router>
), document.getElementById('app'))

// If token exists, redirect to either '/' or '/admin'.
function requireNoAuth(nextState, replace) {
  if (!!localStorage.token) {
    console.log("Index.js::requireNoAuth| Logged in: redirecting to portal..\nlocalStorage: " + JSON.stringify(localStorage));
    replace({
      pathname: localStorage.admin === "true" ? 'admin/' : '/',
      state: { nextPathname: nextState.location.pathname }
    })
  }
}

// If token doesn't exist, redirect to '/login'.
// If admin, redirect to '/admin'.
function requireStudentAuth(nextState, replace) {
  if (!localStorage.token) {
    console.log("Index.js::requireStudentAuth| Not logged in: redirecting to login page..\nlocalStorage: " + JSON.stringify(localStorage));
    replace({
      pathname: '/login',
      state: { nextPathname: nextState.location.pathname }
    })
  }

  if (localStorage.admin === "true") {
    console.log("Index.js::requireStudentAuth| Not a student! Redirecting..\nlocalStorage: " + JSON.stringify(localStorage));
    replace({
      pathname: '/admin',
      state: { nextPathname: nextState.location.pathname }
    })
  }
}

// If token doesn't exist, redirect to '/login'.
// If student, redirect to '/'.
function requireAdminAuth(nextState, replace) {
  if (!localStorage.token) {
    console.log("Index.js::requireAdminAuth| Not logged in: redirecting to login page..\nlocalStorage: " + JSON.stringify(localStorage));
    replace({
      pathname: '/login',
      state: { nextPathname: nextState.location.pathname }
    })
  }

  if (localStorage.admin !== "true") {
    console.log("Index.js::requireAdminAuth| Not an admin! Redirecting..\nlocalStorage: " + JSON.stringify(localStorage));
    replace({
      pathname: '/',
      state: { nextPathname: nextState.location.pathname }
    })
  }
}