const PouchDB = require('pouchdb')
PouchDB.plugin(require('pouchdb-find'));
const path = require('path')
const { dataDir } = require(`@/config/${process.env.NODE_ENV}.config.js`)
const awaitWrapper = require('../utils/await-wrapper')

const bcrypt = require('bcrypt')
const saltRounds = 10

const jwt = require('jwt-simple');
const jwtSecret = 'xxx';

class UserDBModel {
  constructor() {
    this.db = new PouchDB(path.resolve(dataDir, 'users'));
    this.db.createIndex({
      index: {
        fields: ['email']
      }
    })
  }

  async loginOrRegister(user, password, email) {
    let [err, data] = await awaitWrapper(this.login(user, password))
    if (err && err.message === 'password does not match') {
      throw new Error('user already has an email')
    } else if (err && err.message === 'user id not found') {
      [err, data] = await awaitWrapper(this.register(user, password, email))
      if (err) {
        throw err
      }
      return true
    } else {
      return true
    }
  }

  async register(user, password, email) {
    const [emailErr, emailData] = await awaitWrapper(this.db.find({ selector: { email } }))
    console.log(emailErr, emailData)
    if (emailData.docs.length > 0) {
      const userInfo = emailData.docs[0]
      if (userInfo.userId !== user) {
        throw new Error('email has already taken')
      }
    }
    const [err1, data1] = await awaitWrapper(this.db.get(user.toLowerCase()))
    if (data1) {
      throw new Error('user id exist')
    } else if (err1 && err1.message === 'missing') {
      const hash = await bcrypt.hash(password, saltRounds)
      await this.db.put({
        _id: user.toLowerCase(),
        userId: user,
        password: hash,
        email: email,
      })
    } else if (err1) {
      throw err
    }
  }

  async login(userId, password) {
    let [e, r] = await awaitWrapper(this.db.get(userId.toLowerCase()))
    if (e && e.message === 'missing') {
      throw new Error('user id not found')
    } else if (e) {
      throw e
    }
    let userInfo = r
    const match = await bcrypt.compare(password, userInfo.password)
    if (match) {
      return Promise.resolve({
        userId: userInfo.userId,
        email: userInfo.email,
        // token: jwt.encode({
        //   iss: userInfo._id,
        //   exp: new Date().getTime() + 10 * 60 * 1000
        // }, jwtSecret),
      })
    } else {
      throw new Error('password does not match')
    }
  }

  async getInfo(token) {
    const decoded = jwt.decode(token, jwtSecret);
    if (decoded.exp < new Date().getTime()) {
      throw new Error('token expires')
    } else {
      return this.db.get(decoded.iss)
        .then(res => {
          return {
            userId: res.userId,
            email: res.email,
          }
        })
        .catch(e => {
          console.error(e)
          throw new Error('system error')
        });
    }
  }
}


module.exports = UserDBModel