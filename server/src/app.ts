import Koa, { Context, Next } from 'koa'
import KoaRouter from 'koa-router'
import koaBody from 'koa-body'// 解析请求体
import { bootstrapControllers as KoaControllers } from 'koa-ts-controllers'
import * as Colors from 'colors.ts'
import cors from 'koa2-cors'
import webtoken from 'jsonwebtoken'


// 实例化koa
const app: Koa = new Koa({
  proxy: true,
  proxyIpHeader: 'x-forwarded-for'
})
const router: KoaRouter = new KoaRouter()
Colors.enable()

function getClientIP(req: any) {
  let ip = req.headers['x-forwarded-for'] || // 判断是否有反向代理 IP
    req.ip  ||
    req.connection.remoteAddress || // 判断 connection 的远程 IP
    req.socket.remoteAddress || // 判断后端的 socket 的 IP
    req.connection.socket.remoteAddress || ''
  if(ip) {
    ip = ip.replace('::ffff:', '')
  }
  return ip;
}



// 处理404不存在的
app.use(async (ctx: Koa.DefaultContext, next: Next) => {
  console.log(getClientIP(ctx.req))
  if (ctx.headers['authorization']) {
    const res: any = webtoken.verify(ctx.headers['authorization'], 'a1b2c3')
    ctx.state = {
      user: {
        id: res.data
      },
      code: 200,
    }
  }
  ctx.set('Content-Type', 'application/json; charset=utf-8')
  if(parseInt(ctx.status) === 404 && ctx.request.url !== '/favicon.ico'){
    ctx.body = {
      code: 404,
      message: '404 NotFound'
    }
  }
  await next()
})


// 启动路由
;(async () => {
  // 在controllers中读文件涉及到异步
  // 后续访问就需要 host:port/api/v1/接口地址
  await KoaControllers(app, {
    router: router, // 内部还是要使用router来实现路由绑定
    basePath: '/api', // 定义api的规则【所有接口的基础路径】
    versions: [1], // 版本
    controllers: [__dirname + '/controllers/**/*.ts'], // 存放所有控制器类，是数组
    errorHandler (error: any, ctx: Context) {
      ctx.body = {
        code: error.status,
        message: '报错了',
        data: error.message
      }
    }
  })

  // 解析request body
  app.use(koaBody({
    multipart: true,
    formidable: {
      maxFileSize: 200 * 1024 * 1024 // 文件最大支持的大小
    }
  }))

  app.use(cors({
    credentials: true,
    allowMethods: ['GET', 'POST', 'DELETE', 'PUT'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept']
  }))

  // 注册路由
  app.use(router.routes())

  // 监听端口
  app.listen(3002, () => {
    console.log(' DONE '.bg_green, 'Compiled successfully in 10ms'.green);
    console.log(`访问启动成功：`, 'http://localhost:3002'.green);
  })
})()