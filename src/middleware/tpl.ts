import { existsSync, statSync, createReadStream } from 'fs'
import path from 'path'
import log from '../common/logger'
import { MiddleWare } from '@/type'

/**
 * simple template engine
 */
const tpl: MiddleWare = (opt: { path: string }) => async (ctx, next) => {
  ctx.render = (fileName: string) => {
    ctx.type = 'text/html; charset=utf-8';
    try {
      const file = path.join(opt.path, fileName);
      if (existsSync(file) && statSync(file).isFile()) {
        // ctx.body = readFileSync(file);
        ctx.body = createReadStream(file);
      } else {
        const msg = 'template file not exist : ' + file;
        log.error(msg);
        ctx.status = 404;
        if (ctx.app.env === 'development') ctx.body = msg;
        else ctx.throw(404, msg);
      }
    } catch (err) {
      log.error(err);
      ctx.status = 404;
      if (ctx.app.env === 'development') ctx.body = err.message;
      else ctx.throw(404, err.message);
    }
  };
  await next();//注意要加上 await
};

export default tpl