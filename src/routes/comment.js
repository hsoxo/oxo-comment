const router = require('koa-router')()
const assert = require('../utils/assert')
const CommentDAO = require('../model/comment')
const DAOModel = new CommentDAO()
const { validateEmail } = require('../utils/validation')
const awaitWrapper = require('../utils/await-wrapper')

router.post('/getAll', async ctx => {
  const { postId } = ctx.request.body;
  const [err, data] = await awaitWrapper(DAOModel.getComments(postId))
  if (err) {
    ctx.body = {
      code: 500,
      msg: 'system error',
    }
    return
  }
  ctx.body = {
    code: 200,
    msg: 'success',
    comments: data
  }
});

router.post('/create', async ctx => {
  const { postId, userId, email, text, replyTo } = ctx.request.body;
  console.log(postId, userId, email, text, replyTo)
  assert(text && text.length, 'missing text')
  if (userId || email) {
    assert(userId && userId.length, 'missing user id')
    assert(validateEmail(email), 'email not valid')
  }
  const value = await DAOModel.newComment(postId, userId, email, text, replyTo)
  ctx.body = {
    code: 200,
    msg: 'success',
    ...value
  }
});

router.post('/delete', async ctx => {
  const { postId, uuid } = ctx.request.body;
  assert(uuid && uuid.length, 'missing text')
  await DAOModel.deleteComment(postId, uuid)
  ctx.body = {
    code: 200,
    msg: 'success',
  }
});

router.post('/like', async ctx => {
  const { postId, commentUuid } = ctx.request.body;
  assert(commentUuid && commentUuid.length, 'system error')
  await DAOModel.likeComment(postId, commentUuid)
  ctx.body = {
    code: 200,
    msg: 'success',
  }
});


router.post('/unlike', async ctx => {
  const { postId, commentUuid } = ctx.request.body;
  assert(commentUuid && commentUuid.length, 'system error')
  await DAOModel.unlikeComment(postId, commentUuid)
  ctx.body = {
    code: 200,
    msg: 'success',
  }
});


module.exports = router