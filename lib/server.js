var express = require('express')
var morgan = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var session = require('express-session')
var errorHandler = require('errorhandler')

var Aws = require('aws-sdk')
var xmldom = require('xmldom')
var xpath = require('xpath.js')
var config = require('../config')
var Auth = require('../lib/auth')
var AwsCredentials = require('../lib/aws-credentials')

var auth = new Auth(config.auth)
var credentials = new AwsCredentials(config.aws)
var app = express()

var sessionSecret = '491F9BAD-DFFF-46E2-A0F9-56397B538060'
app.set('host', config.server.host)
app.set('port', config.server.port)
app.use(morgan('dev'))
app.use(cookieParser(sessionSecret))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session({ secret: sessionSecret }))
app.use(auth.initialize())
app.use(auth.session())

app.post(config.auth.path, auth.authenticate('saml', {
  failureRedirect: config.auth.entryPoint,
  failureFlash: true
}), function (req, res) {
  var arns = req.user['https://aws.amazon.com/SAML/Attributes/Role'].split(',')
  req.session.passport.samlResponse = req.body.SAMLResponse
  req.session.passport.roleArn = arns[0]
  req.session.passport.principalArn = arns[1]
  res.redirect('/v1')
})

app.all('*', auth.guard)

app.all('/v1', function (req, res) {
  var session = req.session.passport
  res.end('Hello, '+req.user.firstName+'!')

  process.nextTick(function () {
    var sts = new Aws.STS()
    sts.assumeRoleWithSAML({
      PrincipalArn: session.principalArn,
      RoleArn: session.roleArn,
      SAMLAssertion: session.samlResponse,
      DurationSeconds: config.aws.duration
    }, function (err, data) {
      if (err) {
        return console.log(err, err.stack)
      }
      credentials.save(data.Credentials, function (err) {
        if (err) {
          return console.log(err, err.stack)
        }
      })
    })
  })
})

app.use(errorHandler())

module.exports = app