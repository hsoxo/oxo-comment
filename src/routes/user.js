const router = require('koa-router')()
const assert = require('../utils/assert')
const UserDBModel = require('../model/users')
const { validateEmail } = require('../utils/validation')
const Model = new UserDBModel()

router.post('/register', async ctx => {
  const { userId, password, email } = ctx.request.body;
  assert(userId, 'missing user id')
  assert(password, 'missing password')
  assert(validateEmail(email), 'email not valid')
  let result = {}
  await Model.register(userId, password, email)
    .then(() =>
      result = {
        code: 200,
        msg: 'success',
      })
    .catch(e => {
      result = {
        code: 900,
        msg: e.message,
      }
    })
  ctx.body = result
});

router.post('/login', async ctx => {
  const { userId, password } = ctx.request.body;
  assert(userId, 'missing user id')
  assert(password, 'missing password')
  await Model.login(userId, password)
    .then(value => {
      ctx.body = {
        code: 200,
        msg: 'success',
        ...value
      }
    })
    .catch(e => {
      console.error(e)
      ctx.body = {
        code: 500,
        msg: e.message,
      }
    })
});


router.post('/getInfo', async ctx => {
  const { token } = ctx.request.body;
  try {
    const value = await Model.getInfo(token)
    ctx.body = {
      code: 200,
      msg: 'success',
      ...value
    }
  } catch (e) {
    console.error(e)
    ctx.body = {
      code: 500,
      msg: e.message,
    }
  }
});

module.exports = router