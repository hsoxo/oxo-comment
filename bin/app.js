require('module-alias/register')

const Koa = require("koa");
const app = new Koa();

if (process.env.NODE_ENV === 'dev') {
  app.use(require('@/src/middlewares/koa-cors'));
}

app.use(require('../src/middlewares/apikey-validator'));

// 配置程序异常输出的json格式
const koa_json_error = require('koa-json-error');
app.use(koa_json_error((err) => {
  return {
    code: err.status || 500,
    description: err.message
  }
}));

// 解析表单提交参数
const koa_body = require('koa-body');
app.use(koa_body());
// 显示请求和响应日志

const koa_logger = require('koa-logger');
app.use(koa_logger());

app.use(require('../src/middlewares/requests-log'));

// 路由
const routers = require('../src/routes/index');
app.use(routers.routes())


process.on('unhandledRejection', (err, p) => {
  console.log('An unhandledRejection occurred');
  console.log(`Rejected Promise: ${p}`);
  console.log(`Rejection: ${err}`);
});

module.exports = app
