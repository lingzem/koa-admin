import crypto from 'crypto'
import { v4 as uuid } from 'uuid'
import * as dao from '../dao'
import { Context } from 'koa';
import { post } from '../decorator/httpMethod'

const makeSalt = () => Math.round((new Date().valueOf() * Math.random())) + '';//generate salt
const encryptPass = (pass: string, salt: string) => crypto.createHash('md5').update(pass + salt).digest('hex');// generate md5

// export const sign = async (ctx: Context) => {
// 	ctx.render('sign.html');
// };

export default class Sign {

  @post('/login')
  async login(ctx: Context) {
    const { email, password } = ctx.request.body;
    const users = await dao.getUser({ email });
    if (!users.length) {
      return ctx.body = {
        code: 2,
        msg: '用户不存在'
      };
    }
    if (users[0].hash_password !== encryptPass(password, users[0].salt)) {
      return ctx.body = {
        code: 3,
        msg: '密码错误'
      };
    }
    await ctx.sign({ uid: users[0].id, email });
    return ctx.body = {
      code: 0,
      msg: '登录成功',
      data: users[0]
    };
  }

  @post('/register')
  async register(ctx: Context) {
    const { email, password } = ctx.request.body;
    const salt = makeSalt();
    const hash_password = encryptPass(password, salt);

    const countRet = await dao.count({ email });
    if (countRet[0].count > 0) {
      return ctx.body = {
        code: 2,
        msg: '该邮箱已经被注册！'
      }
    }
    const id = uuid();
    const form = { id, salt, hash_password, email, name: email, nick: email };
    const insertRet = await dao.insert(form);
    if (!insertRet.affectedRows) {
      return ctx.body = {
        code: 3,
        msg: '注册失败！'
      }
    }
    ctx.sign({ uid: id, email }); //注册成功后立即登陆
    return ctx.body = {
      code: 0,
      msg: '注册成功！',
      data: { id, email, nick: email, signature: '' }
    }
  }
}