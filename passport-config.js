const LocalStatergy = require("passport-local").Strategy
const bcrypt = require('bcryptjs')


function initialize(passport, getUserbyName, getUserbyId) {
  const authenticateUser = async (name, password, done) => {
    const user = await getUserbyName(name)

    if (user == null) {
      return done(null, false, {
        message: "no user with that name"
      })

    }
    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user)

      } else {
        return done(null, false, {
          message: "Password Incorrect"
        })
      }
    } catch (error) {
      return done(error)
    }


  }
  passport.use(new LocalStatergy({
    usernameField: 'name'
  }, authenticateUser))
  passport.serializeUser((user, done) => {
    done(null, user._id)

  })
  passport.deserializeUser(async (id, done) => {
    const user = await getUserbyId(id)
    return done(null, user)
  })


}
module.exports = initialize
