/* eslint-disable node/prefer-global/process */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { createInterface } from 'node:readline'
import { createConsola } from 'consola'

// 创建 consola 实例
const consola = createConsola()

// 初始化 readline 接口
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
})

// 定义两个占位符
const placeholders = {
  packageName: 'pkg-placeholder',
  description: '_description_',
}

// 定义替换函数
async function replaceInFiles(dir: string, replacements: { packageName: string, description: string }) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)

    // 跳过 node_modules 目录
    if (filePath.includes('node_modules'))
      continue

    const stats = fs.statSync(filePath)

    if (stats.isDirectory()) {
      await replaceInFiles(filePath, replacements) // 递归目录
    }
    else if (stats.isFile() && !filePath.endsWith('replace.ts')) { // 限制文件类型
      const content = fs.readFileSync(filePath, 'utf-8')
      let updatedContent = content

      // 检查并替换所有占位符
      Object.entries(placeholders).forEach(([key, value]) => {
        if (updatedContent.includes(value)) {
          updatedContent = updatedContent.replace(new RegExp(value, 'g'), replacements[key])
          consola.success(`文件 ${filePath} 中的 ${value} 已更新为 ${replacements[key]}`)
        }
      })

      // 如果内容发生变化，则写回文件
      if (updatedContent !== content)
        fs.writeFileSync(filePath, updatedContent, 'utf-8')
    }
  }
}

// 获取用户输入并执行替换
rl.question('请输入新的包名: ', (packageName) => {
  if (!packageName) {
    consola.error('未提供包名，脚本将退出。')
    rl.close()
    return
  }

  rl.question('请输入新的描述: ', async (description) => {
    if (!description) {
      consola.error('未提供描述，脚本将退出。')
      rl.close()
      return
    }

    try {
      await replaceInFiles(path.resolve('.'), { packageName, description })
      consola.success('所有文件处理完成。')
    }
    catch (error) {
      consola.error('处理时发生错误:', error)
    }

    rl.close()
  })
})
