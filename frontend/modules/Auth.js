module.exports = {
  login(email, pass, cb) {
    cb = arguments[arguments.length - 1]
    if (localStorage.servertoken) {
      if (cb) cb(true)
      this.onChange(true)
      return
    }
    pretendRequest(email, pass, (res) => {
      if (res.authenticated) {
        localStorage.servertoken = res.servertoken
        if (cb) cb(true)
        this.onChange(true)
      } else {
        if (cb) cb(false)
        this.onChange(false)
      }
    })
  },

  getToken() {
    return localStorage.servertoken
  },

  logout(cb) {
    delete localStorage.servertoken
    if (cb) cb()
    this.onChange(false)
  },

  loggedIn() {
    return !!localStorage.servertoken
  },

  onChange() {}
}

function pretendRequest(email, pass, cb) {
  setTimeout(() => {
    if (email === 'joe@example.com' && pass === 'password1') {
      cb({
        authenticated: true,
        servertoken: Math.random().toString(36).substring(7)
      })
    } else {
      cb({ authenticated: false })
    }
  }, 0)
}