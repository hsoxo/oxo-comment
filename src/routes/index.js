const fs = require('fs')
const path = require('path')
const router = require('koa-router')()


let base_path = __dirname + '/'
let file_path = '/'                           //默认文件路由为/

const requireRouters = (base_path,file_path) => {
  let files = fs.readdirSync(base_path + file_path);  //读取目录下的文件
  files = files.filter(x => x !== 'index.js')

  //遍历所有文件
  files.forEach(file=>{
    let file_name = base_path + file_path + file  //完整文件名
    if(fs.statSync(file_name).isFile() && path.extname(file_name)==='.js'){    //如果是文件且是js后缀文件
      let inner_router = require(file_name)  //require这个文件
      let base_router = file_path + file.substring(0,file.length-3)  //文件所在目录+文件名，作为路由前缀
      router.use(base_router,inner_router.routes())   //通过嵌套路由方式设置真实的路由
    }else{
      requireRouters(base_path,`${file_path}${file}/`)  //如果是文件夹，则遍历这个文件夹
    }
  })
}

requireRouters(base_path,file_path)

module.exports = router
