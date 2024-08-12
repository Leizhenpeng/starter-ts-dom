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

// 定义要查找的占位符
const placeholder = 'pkg-placeholder'

// 定义替换函数
async function replaceInFiles(dir: string, packageName: string) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)

    // 跳过 node_modules 目录
    if (filePath.includes('node_modules'))
      continue

    const stats = fs.statSync(filePath)

    if (stats.isDirectory()) {
      await replaceInFiles(filePath, packageName) // 递归目录
    }
    else if (stats.isFile() && filePath.endsWith('.ts')) { // 限制文件类型
      const content = fs.readFileSync(filePath, 'utf-8')

      // 检查是否包含关键词
      if (content.includes(placeholder)) {
        const updatedContent = content.replace(new RegExp(placeholder, 'g'), packageName)
        fs.writeFileSync(filePath, updatedContent, 'utf-8')
        consola.success(`文件 ${filePath} 已更新`)
      }
    }
  }
}

// 获取用户输入并执行替换
rl.question('请输入新的包名: ', async (packageName) => {
  if (!packageName) {
    consola.error('未提供包名，脚本将退出。')
    rl.close()
    return
  }

  try {
    await replaceInFiles(path.resolve('.'), packageName) // 可以调整为你的项目根目录路径
    consola.success('所有文件处理完成。')
  }
  catch (error) {
    consola.error('处理时发生错误:', error)
  }

  rl.close()
})
