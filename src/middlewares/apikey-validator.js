module.exports = async (ctx, next) => {
  const key = ctx.request.headers['oxo-auth']
  if (key === require(`@/config/${process.env.NODE_ENV}.config.js`).apikey) {
    await next();
  } else {
    ctx.throw(401, 'Unauthorized')
  }
};
