module.exports = async (ctx, next) => {
  console.log(`Receive ${ctx.request.method.toUpperCase()} from ${ctx.request.origin}: 
  Body: ${JSON.stringify(ctx.request.body)}`)
  await next();
};
