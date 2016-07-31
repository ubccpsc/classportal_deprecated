import React from 'react'
import { Router, Route, browserHistory, IndexRoute } from 'react-router'
import { render } from 'react-dom'
import App from './modules/App'
import PostLogin from './modules/PostLogin'
import Update from './modules/studentportal_components/Update'
import StudentPortal from './modules/studentportal_components/StudentPortal'
import Either from './modules/Either'

//using require instead of <link rel="stylesheet" href="/index.css"/>
//so we can hot reload styles in development
require("./public/index.css");

render((
  <Router history={browserHistory}>
    <Route path="/" component={App}>
      <Route path="/postlogin" component={PostLogin} />
      <Route path="/update" component={Update} />
    </Route>
  </Router>
), document.getElementById('app'))

//<IndexRoute component={Either} />