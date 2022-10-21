import { Dict, Image, Page, User } from '@/types'
import { Controller, Get, Post, Put, Params, Body, Query, CurrentUser, Flow, Delete, State, Header } from 'koa-ts-controllers'
import { Op } from 'sequelize'
import ImageModel from '../models/Image'

interface Filter extends Page {
  img_name?: string
}

@Controller('/image')
class ImageController {
  /**
   * 列表
   * @returns 
   */
  @Post('/list')
  async list(@Body() params: Filter, @CurrentUser() user: User) {
    const tmp: any = {
      order: [
        ['updatedAt', 'desc']
      ],
      where: {
        img_name: {
          [Op.like]: params.img_name ? `%${params.img_name}%` : '%%'
        },
        uid: user.id
      }
    }
    const data: any = {}
    if (params.page) {
      tmp.limit = params.size
      tmp.offset = params.page ? (params.page - 1) * params.size : 0
      const { rows, count } = await ImageModel.findAndCountAll(tmp)
      data.total = count
      data.items = rows
    } else {
      data.items = await ImageModel.findAll(tmp)
    }
    return {
      code: 200,
      message: '成功',
      data: data
    }
  }


  /**
   * 新建
   * @param params Image图片
   * @returns 
   */
  @Post('/create')
  async create (@Body() params: Image, @CurrentUser() user: User) {
    params.uid = user.id
    return {
      code: 200,
      message: '成功',
      data: await ImageModel.create(params)
    }
  }


  /**
   * 更新
   * @param params Image图片
   * @returns 
   */
  @Post('/update')
  async update (@Body() params: Image) {
    return {
      code: 200,
      message: '成功',
      data: await ImageModel.update({
      ...params
      }, {
        where: {
          id: params.id
        }
      })
    }
  }


  /**
   * 删除
   * @param params Image图片
   * @returns 
   */
  @Post('/delete')
  async delete (@Body() params: { id: string }, @CurrentUser() user: User) {
    return {
      code: 200,
      message: '成功',
      data: await ImageModel.destroy({
        where: {
          id: params.id,
          uid: user.id
        }
      })
    }
  }
}