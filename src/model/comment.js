const PouchDB = require('pouchdb')
const _ = require('lodash')
const { uuid } = require('../utils/uuid')
const path = require('path')
const { dataDir } = require(`../../config/${process.env.NODE_ENV}.config.js`)
const awaitWrapper = require('../utils/await-wrapper')
const UserModel = require('./users')
const md5 = require('md5');

const Comment = (userId, text, email) => {
  return {
    uuid: uuid(),
    userId,
    text,
    avatar: email ? md5(email) : '',
    deleted: 0,
    children: [],
    createdTime: new Date(),
    likes: 0,
    disses: 0,
  }
}

async function traverse(value, targetId, callback) {
  const target = _.find(value, ['uuid', targetId])
  if (target) {
    callback(target)
    return value
  } else {
    value.map(async child => {
      await traverse(child.children, targetId, callback)
    })
  }
}

async function filterDeleted(comments) {
  comments = comments.filter(x => !x.deleted)
  comments.map(async child => {
    await filterDeleted(child.children)
  })
  return comments
}

class CommentDAO {
  constructor() {
    this.db = new PouchDB(path.resolve(dataDir, 'comments'));
    this.users = new UserModel()
  }

  async newComment(postId, userId, email, text, replyTo) {
    if (userId) {
      const [err2, data2] = await awaitWrapper(this.users.loginOrRegister(userId, email, email))
      if (err2) {
        return Promise.reject(err2)
      }
    }
    const comment = Comment(userId, text, email)
    const [err, record] = await awaitWrapper(this.db.get(postId))
    if (err) {
      return Promise.reject(err)
    }
    if (replyTo) {
      await traverse(record.comments, replyTo, target => target.children.push(comment))
    } else {
      await record.comments.push(comment)
    }
    await this.db.put({
      _id: record._id,
      _rev: record._rev,
      comments: record.comments
    })
    return Promise.resolve(record.comments)
  }

  async getComments(postId) {
    const [err, records] = await awaitWrapper(this.db.get(postId))
    if (err && err.status === 404){
      this.db.put({ _id: postId, comments: [] })
      return []
    } else if (err) {
      return Promise.reject(err)
    }
    return await filterDeleted(records.comments)
  }

  async _modifyComment(postId, uuid, callback) {
    let that = this
    return this.db.get(postId)
      .then(async value => {
        await traverse(value.comments, uuid, callback)
        that.db.put({
          _id: value._id,
          _rev: value._rev,
          comments: value.comments
        })
        return {
          comments: value.comments
        }
      })
  }

  async deleteComment(postId, uuid) {
    return this._modifyComment(postId, uuid, target => target.deleted = 1)
  }

  async likeComment(postId, uuid) {
    return this._modifyComment(postId, uuid, target => target.likes = target.likes + 1)
  }

  async unlikeComment(postId, uuid) {
    return this._modifyComment(postId, uuid, target => target.likes = target.likes === 0 ? 0 : target.likes - 1)
  }

  async dissComment(postId, uuid) {
    return this._modifyComment(postId, uuid, target => target.disses ++)
  }

  async unDissComment(postId, uuid) {
    return this._modifyComment(postId, uuid, target => target.disses = target.disses === 0 ? 0 : target.disses - 1)
  }
}


module.exports = CommentDAO