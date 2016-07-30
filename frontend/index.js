import React from 'react'
import { Router, Route, browserHistory, IndexRoute } from 'react-router'
import { render } from 'react-dom'
import App from './modules/App'
import Login from './modules/Login'
import PostLogin from './modules/PostLogin'
import Update from './modules/Update'
import StudentPortal from './modules/StudentPortal'

//<link rel="stylesheet" href="/index.css" />
//we use require here instead of <link> so we can hot reload in developement
require("./public/index.css");

render((
  <Router history={browserHistory}>
    <Route path="/" component={App}>
			<IndexRoute component={Login}/>
			<Route path="/postlogin" component={PostLogin} />
			<Route path="/update" component={Update} />
			<Route path="/portal" component={StudentPortal} />
		</Route>
  </Router>
), document.getElementById('app'))