import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import fs from 'fs'
import os from 'os'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { exec, execSync, spawn } from 'child_process'
import { Client } from 'ssh2'
import { autoUpdater } from 'electron-updater'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: '配置文件编辑器',
    width: 800,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // 设置为 true，则你可以在网页中使用 Node.js 的 API，例如 require 方法来引入 Node.js 的模块
      nodeIntegration: true,
      // 设置为 true，那么 Electron 主进程和渲染进程的 JavaScript 上下文将被隔离，
      // 这意味着在主进程中定义的全局变量、函数等将无法在渲染进程中访问，反之亦然。
      contextIsolation: false,
      webSecurity: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    // mainWindow.webContents.openDevTools()
  }

  ipcMain.handle('open-select-dialog', async () => {
    const openDialogReturnValue = await dialog.showOpenDialog(mainWindow, {
      title: '选择配置文件',
      properties: ['openFile']
    })
    const filePaths = openDialogReturnValue.filePaths
    if (filePaths && filePaths.length > 0) {
      return { filePaths }
    } else {
      return { filePaths: [] }
    }
  })

  function getAbsoluteFilePath(filePath: string): string {
    filePath = filePath ?? ''
    if (String(filePath).startsWith('~')) {
      filePath = String(filePath).replace(/^~/, os.homedir()) // 将 ~ 替换为 homeDirectory
    }
    return filePath
  }

  // 获取txt文件的内容
  ipcMain.handle('read-file-content', (_, arg) => {
    let code = 0;
    let msg: any;
    let content: string | undefined = undefined
    let { filePath } = arg ?? {};
    filePath = getAbsoluteFilePath(filePath);
    try {
      fs.accessSync(filePath, fs.constants.F_OK);
      fs.accessSync(filePath, fs.constants.R_OK);
      const data = fs.readFileSync(filePath, 'utf8');
      content = data;
      code = 3;
      msg = '读取文件成功'
    } catch (err) {
      code = 2;
      msg = '读取文件出错'
    }
    return { content, code, msg }
  })

  // 判断txt文件是否可写
  ipcMain.handle('is-file-write', (_, arg) => {
    let code = 0;
    let msg: any;
    let { filePath } = arg ?? {};
    filePath = getAbsoluteFilePath(filePath);
    try {
      fs.accessSync(filePath, fs.constants.F_OK);
      fs.accessSync(filePath, fs.constants.W_OK);
      code = 3;
      msg = '文件可写'
    } catch (err) {
      code = 2;
      msg = '读取文件出错或文件不可写'
      console.log(filePath, err)
    }
    return { code, msg }
  })

  // 写入txt文件
  ipcMain.handle('write-file', (_, arg) => {
    let code = 0;
    let msg: any;
    let { filePath } = arg ?? {};
    const { content } = arg ?? {};
    filePath = getAbsoluteFilePath(filePath);
    try {
      if (typeof content === 'string') {
        fs.writeFileSync(filePath, content);
      }
      code = 3;
    } catch (err) {
      code = 2;
      msg = '读取文件出错或文件不可写'
      console.log(filePath, err)
    }
    return { code, msg }
  })

  // 执行refresh command
  ipcMain.handle('exec-refresh', (_, arg) => {
    let code = 0;
    let msg: any;
    let { refreshCmd } = arg ?? {};
    refreshCmd = refreshCmd ?? '';
    try {
      const result = execSync(refreshCmd, { encoding: 'utf8' });
      msg = result;
      code = 3;
    } catch (err: any) {
      msg = err.message || err.stderr || err.stdout || err;
      code = 2;
      
      // 如果是权限错误，提供更详细的信息
      if (err.message && (err.message.includes('Permission denied') || err.message.includes('Operation not permitted'))) {
        msg = `权限不足: ${err.message}`;
      }
    }
    return { code, msg }
  });

  // 测试远程连接
  ipcMain.handle('test-remote-connection', async (_, arg) => {
    const { remoteInfo } = arg ?? {}
    
    return new Promise((resolve) => {
      const conn = new Client()
      
      conn.on('ready', () => {
        conn.end()
        resolve({ code: 3, msg: '连接成功' })
      }).on('error', (err) => {
        resolve({ code: 2, msg: err.message || '连接失败' })
      }).connect({
        host: remoteInfo.host,
        port: remoteInfo.port,
        username: remoteInfo.username,
        password: remoteInfo.password
      })
    })
  })

  // 读取远程文件内容
  ipcMain.handle('read-remote-file-content', async (event, arg) => {
    const { filePath, remoteInfo } = arg ?? {}
    
    return new Promise((resolve) => {
      const conn = new Client()
      
      // 发送连接进度和日志
      event.sender.send('download-progress', { 
        progress: 0, 
        status: '正在连接远程服务器...', 
        speed: '' 
      })
      event.sender.send('debug-log', {
        message: `开始连接远程服务器 ${remoteInfo.host}:${remoteInfo.port}`,
        type: 'info'
      })
      
      conn.on('ready', () => {
        event.sender.send('download-progress', { 
          progress: 30, 
          status: '连接成功，正在建立SFTP连接...', 
          speed: '' 
        })
        event.sender.send('debug-log', {
          message: `SSH连接成功，正在建立SFTP连接...`,
          type: 'success'
        })
        
        conn.sftp((err, sftp) => {
          if (err) {
            conn.end()
            event.sender.send('download-progress', { 
              progress: 0, 
              status: '连接失败', 
              speed: '' 
            })
            event.sender.send('debug-log', {
              message: `SFTP连接失败: ${err.message}`,
              type: 'error'
            })
            resolve({ code: 2, msg: 'SFTP连接失败: ' + err.message })
            return
          }
          
          event.sender.send('download-progress', { 
            progress: 50, 
            status: '正在获取文件信息...', 
            speed: '' 
          })
          event.sender.send('debug-log', {
            message: `SFTP连接成功，正在获取文件信息: ${filePath}`,
            type: 'info'
          })
          
          // 首先获取文件大小
          sftp.stat(filePath, (err, stats) => {
            if (err) {
              // 如果获取文件信息失败，直接读取文件
              event.sender.send('download-progress', { 
                progress: 70, 
                status: '正在读取文件内容...', 
                speed: '估算中...' 
              })
              event.sender.send('debug-log', {
                message: `无法获取文件大小信息，直接读取文件内容`,
                type: 'warning'
              })
              
              const startTime = Date.now()
              sftp.readFile(filePath, 'utf8', (err, data) => {
                conn.end()
                if (err) {
                  event.sender.send('download-progress', { 
                    progress: 0, 
                    status: '读取失败', 
                    speed: '' 
                  })
                  event.sender.send('debug-log', {
                    message: `读取文件失败: ${err.message}`,
                    type: 'error'
                  })
                  resolve({ code: 2, msg: '读取文件失败: ' + err.message })
                } else {
                  const endTime = Date.now()
                  const duration = (endTime - startTime) / 1000
                  const fileSize = data.length
                  const speed = duration > 0 ? `${(fileSize / 1024 / duration).toFixed(1)} KB/s` : ''
                  
                  event.sender.send('download-progress', { 
                    progress: 100, 
                    status: '下载完成，解析中...', 
                    speed: speed 
                  })
                  event.sender.send('debug-log', {
                    message: `文件下载完成: ${(fileSize / 1024).toFixed(1)} KB，平均速度: ${speed}`,
                    type: 'success'
                  })
                  resolve({ code: 3, msg: '读取文件成功', content: data })
                }
              })
            } else {
              // 获取到文件大小，可以提供更准确的进度
              const fileSize = stats.size
              event.sender.send('download-progress', { 
                progress: 60, 
                status: `正在下载文件 (${(fileSize / 1024).toFixed(1)} KB)...`, 
                speed: '' 
              })
              event.sender.send('debug-log', {
                message: `文件大小: ${(fileSize / 1024).toFixed(1)} KB，开始流式下载`,
                type: 'info'
              })
              
              const startTime = Date.now()
              let downloadedBytes = 0
              
              // 使用流式读取来跟踪进度
              const readStream = sftp.createReadStream(filePath, { encoding: 'utf8' })
              let content = ''
              
              readStream.on('data', (chunk) => {
                content += chunk
                downloadedBytes += Buffer.byteLength(chunk, 'utf8')
                
                const progress = Math.min(90, 60 + (downloadedBytes / fileSize) * 30)
                const elapsed = (Date.now() - startTime) / 1000
                const speed = elapsed > 0 ? `${(downloadedBytes / 1024 / elapsed).toFixed(1)} KB/s` : ''
                
                event.sender.send('download-progress', { 
                  progress: Math.round(progress), 
                  status: `正在下载文件... ${(downloadedBytes / 1024).toFixed(1)}/${(fileSize / 1024).toFixed(1)} KB`, 
                  speed: speed 
                })
              })
              
              readStream.on('end', () => {
                conn.end()
                const endTime = Date.now()
                const duration = (endTime - startTime) / 1000
                const speed = duration > 0 ? `${(fileSize / 1024 / duration).toFixed(1)} KB/s` : ''
                
                event.sender.send('download-progress', { 
                  progress: 100, 
                  status: '下载完成，解析中...', 
                  speed: speed 
                })
                event.sender.send('debug-log', {
                  message: `文件下载完成: ${(fileSize / 1024).toFixed(1)} KB，用时: ${duration.toFixed(1)}s，平均速度: ${speed}`,
                  type: 'success'
                })
                resolve({ code: 3, msg: '读取文件成功', content: content })
              })
              
              readStream.on('error', (err) => {
                conn.end()
                event.sender.send('download-progress', { 
                  progress: 0, 
                  status: '下载失败', 
                  speed: '' 
                })
                event.sender.send('debug-log', {
                  message: `文件流式下载失败: ${err.message}`,
                  type: 'error'
                })
                resolve({ code: 2, msg: '读取文件失败: ' + err.message })
              })
            }
          })
        })
      }).on('error', (err) => {
        event.sender.send('download-progress', { 
          progress: 0, 
          status: '连接失败', 
          speed: '' 
        })
        event.sender.send('debug-log', {
          message: `SSH连接失败: ${err.message}`,
          type: 'error'
        })
        resolve({ code: 2, msg: '连接失败: ' + err.message })
      }).connect({
        host: remoteInfo.host,
        port: remoteInfo.port,
        username: remoteInfo.username,
        password: remoteInfo.password
      })
    })
  })

  // 写入远程文件
  ipcMain.handle('write-remote-file', async (_, arg) => {
    const { filePath, content, remoteInfo } = arg ?? {}
    
    return new Promise((resolve) => {
      const conn = new Client()
      
      conn.on('ready', () => {
        conn.sftp((err, sftp) => {
          if (err) {
            conn.end()
            resolve({ code: 2, msg: 'SFTP连接失败: ' + err.message })
            return
          }
          
          sftp.writeFile(filePath, content, 'utf8', (err) => {
            conn.end()
            if (err) {
              resolve({ code: 2, msg: '写入文件失败: ' + err.message })
            } else {
              resolve({ code: 3, msg: '写入文件成功' })
            }
          })
        })
      }).on('error', (err) => {
        resolve({ code: 2, msg: '连接失败: ' + err.message })
      }).connect({
        host: remoteInfo.host,
        port: remoteInfo.port,
        username: remoteInfo.username,
        password: remoteInfo.password
      })
    })
  })

  // 使用sudo写入远程文件
  ipcMain.handle('write-remote-file-sudo', async (_, arg) => {
    const { filePath, content, remoteInfo, sudoPassword } = arg ?? {}
    
    return new Promise((resolve) => {
      const conn = new Client()
      
      conn.on('ready', () => {
        // 创建临时文件并使用sudo移动
        const tempFile = `/tmp/config_editor_temp_${Date.now()}`
        
        conn.sftp((err, sftp) => {
          if (err) {
            conn.end()
            resolve({ code: 2, msg: 'SFTP连接失败: ' + err.message })
            return
          }
          
          // 先写入临时文件
          sftp.writeFile(tempFile, content, 'utf8', (err) => {
            if (err) {
              conn.end()
              resolve({ code: 2, msg: '写入临时文件失败: ' + err.message })
              return
            }
            
            // 使用sudo移动文件
            const sudoCmd = `echo '${sudoPassword}' | sudo -S cp ${tempFile} ${filePath} && rm ${tempFile}`
            
            conn.exec(sudoCmd, (err, stream) => {
              if (err) {
                conn.end()
                resolve({ code: 2, msg: '执行sudo命令失败: ' + err.message })
                return
              }
              
              let stderr = ''
              stream.on('close', (code) => {
                conn.end()
                if (code === 0) {
                  resolve({ code: 3, msg: '写入文件成功' })
                } else {
                  resolve({ code: 2, msg: 'sudo写入失败: ' + stderr })
                }
              }).on('data', () => {
                // stdout data (ignored for sudo operation)
              }).stderr.on('data', (data) => {
                stderr += data
              })
            })
          })
        })
      }).on('error', (err) => {
        resolve({ code: 2, msg: '连接失败: ' + err.message })
      }).connect({
        host: remoteInfo.host,
        port: remoteInfo.port,
        username: remoteInfo.username,
        password: remoteInfo.password
      })
    })
  })

  // 执行远程刷新命令
  ipcMain.handle('exec-remote-refresh', async (_, arg) => {
    const { refreshCmd, remoteInfo } = arg ?? {}
    
    return new Promise((resolve) => {
      const conn = new Client()
      
      conn.on('ready', () => {
        conn.exec(refreshCmd, (err, stream) => {
          if (err) {
            conn.end()
            resolve({ code: 2, msg: '执行命令失败: ' + err.message })
            return
          }
          
          let stdout = ''
          let stderr = ''
          
          stream.on('close', (code) => {
            conn.end()
            if (code === 0) {
              resolve({ code: 3, msg: '命令执行成功', output: stdout })
            } else {
              resolve({ code: 2, msg: '命令执行失败: ' + stderr })
            }
          }).on('data', (data) => {
            stdout += data
          }).stderr.on('data', (data) => {
            stderr += data
          })
        })
      }).on('error', (err) => {
        resolve({ code: 2, msg: '连接失败: ' + err.message })
      }).connect({
        host: remoteInfo.host,
        port: remoteInfo.port,
        username: remoteInfo.username,
        password: remoteInfo.password
      })
    })
  })

  // 使用sudo执行远程refresh命令
  ipcMain.handle('exec-remote-refresh-sudo', async (_, arg) => {
    const { refreshCmd, remoteInfo, sudoPassword } = arg ?? {}
    
    return new Promise((resolve) => {
      const conn = new Client()
      
      conn.on('ready', () => {
        // 使用sudo执行远程命令，添加 -p 参数来指定密码提示符
        const sudoCmd = `sudo -S -p '' ${refreshCmd}`
        
        conn.exec(sudoCmd, (err, stream) => {
          if (err) {
            conn.end()
            resolve({ code: 2, msg: '执行sudo命令失败: ' + err.message })
            return
          }
          
          let stdout = ''
          let stderr = ''
          let promptSent = false
          
          stream.on('close', (code) => {
            conn.end()
            if (code === 0) {
              resolve({ code: 3, msg: '命令执行成功', output: stdout })
            } else {
              resolve({ code: 2, msg: 'sudo命令执行失败: ' + stderr })
            }
          }).on('data', (data) => {
            stdout += data
          }).stderr.on('data', (data) => {
            stderr += data
            // 如果检测到密码提示符，发送密码
            if (!promptSent && (data.toString().includes('password') || data.toString().includes('Password') || stderr.includes('[sudo]'))) {
              stream.write(sudoPassword + '\n')
              promptSent = true
            }
          })
          
          // 立即发送密码，不等待提示符
          stream.write(sudoPassword + '\n')
          promptSent = true
        })
      }).on('error', (err) => {
        resolve({ code: 2, msg: '连接失败: ' + err.message })
      }).connect({
        host: remoteInfo.host,
        port: remoteInfo.port,
        username: remoteInfo.username,
        password: remoteInfo.password
      })
    })
  })

  // 使用sudo写入本地文件
  ipcMain.handle('write-file-sudo', async (_, arg) => {
    const { filePath, content, sudoPassword } = arg ?? {}
    const absoluteFilePath = getAbsoluteFilePath(filePath)
    
    return new Promise((resolve) => {
      // 创建临时文件
      const tempFile = `/tmp/config_editor_temp_${Date.now()}`
      
      try {
        // 写入临时文件
        fs.writeFileSync(tempFile, content)
        
        // 使用sudo移动文件
        const sudoCmd = `echo '${sudoPassword}' | sudo -S cp ${tempFile} ${absoluteFilePath} && rm ${tempFile}`
        
        exec(sudoCmd, (error) => {
          if (error) {
            resolve({ code: 2, msg: 'sudo写入失败: ' + error.message })
          } else {
            resolve({ code: 3, msg: '写入文件成功' })
          }
        })
      } catch (err: any) {
        resolve({ code: 2, msg: '创建临时文件失败: ' + err.message })
      }
    })
  })

  // 使用sudo执行本地refresh命令
  ipcMain.handle('exec-refresh-sudo', async (_, arg) => {
    const { refreshCmd, sudoPassword } = arg ?? {}
    
    return new Promise((resolve) => {
      // 使用spawn来更好地控制stdin/stdout
      const child = spawn('sudo', ['-S', '-p', '', ...refreshCmd.split(' ')], {
        stdio: ['pipe', 'pipe', 'pipe']
      })
      
      let stdout = ''
      let stderr = ''
      
      // 立即发送密码
      child.stdin.write(sudoPassword + '\n')
      child.stdin.end()
      
      child.stdout.on('data', (data) => {
        stdout += data.toString()
      })
      
      child.stderr.on('data', (data) => {
        stderr += data.toString()
      })
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({ code: 3, msg: '命令执行成功', output: stdout })
        } else {
          resolve({ code: 2, msg: 'sudo命令执行失败: ' + stderr })
        }
      })
      
      child.on('error', (error) => {
        resolve({ code: 2, msg: 'sudo命令执行失败: ' + error.message })
      })
    })
  })

  // 打开/关闭开发者工具
  ipcMain.handle('toggle-dev-tools', async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    if (focusedWindow) {
      if (focusedWindow.webContents.isDevToolsOpened()) {
        focusedWindow.webContents.closeDevTools()
        return { code: 3, msg: '开发者工具已关闭' }
      } else {
        focusedWindow.webContents.openDevTools()
        return { code: 3, msg: '开发者工具已打开' }
      }
    } else {
      return { code: 2, msg: '未找到活动窗口' }
    }
  })

  // 检查本地是否有已下载的更新，并通知渲染层
  function checkDownloadedUpdate(mainWindow: BrowserWindow) {
    try {
      const updateInfoPath = join(app.getPath('userData'), 'update-downloaded.json')
      if (fs.existsSync(updateInfoPath)) {
        const info = JSON.parse(fs.readFileSync(updateInfoPath, 'utf8'))
        if (info.updateDownloaded && info.version) {
          // 通知渲染层弹窗
          mainWindow.webContents.once('did-finish-load', () => {
            mainWindow.webContents.send('update-downloaded', info)
          })
        }
      }
    } catch (e) {
      // 忽略
    }
  }

  function setupAutoUpdate(mainWindow: BrowserWindow) {
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = false
    autoUpdater.checkForUpdates()

    autoUpdater.on('update-downloaded', (info) => {
      // 记录已下载状态
      const updateInfoPath = join(app.getPath('userData'), 'update-downloaded.json')
      fs.writeFileSync(updateInfoPath, JSON.stringify({ updateDownloaded: true, version: info.version }))
      // 通知渲染层弹窗
      mainWindow.webContents.send('update-downloaded', { updateDownloaded: true, version: info.version })
    })
  }

  // 渲染层请求重启升级
  ipcMain.handle('quit-and-install', () => {
    autoUpdater.quitAndInstall()
  })

  // 检查本地已下载更新
  checkDownloadedUpdate(mainWindow)
  // 启动自动更新
  setupAutoUpdate(mainWindow)

  // 扫描用户根目录的配置文件
  ipcMain.handle('scan-config-files', async () => {
    try {
      const homeDir = os.homedir()
      const configFiles: Array<{filePath: string, description: string, refreshCmd: string}> = []
      
      // 常见的配置文件列表
      const commonConfigFiles = [
        '.zshrc',
        '.bashrc', 
        '.bash_profile',
        '.vimrc',
        '.gitconfig',
        '.ssh/config',
        '.npmrc',
        '.yarnrc',
      ]
      
      // 检查这些文件是否存在
      for (const configFile of commonConfigFiles) {
        const fullPath = join(homeDir, configFile)
        try {
          if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath)
            if (stats.isFile()) {
              // 生成文件描述
              let description = getConfigFileDescription(configFile)
              
              configFiles.push({
                filePath: fullPath,
                description,
                refreshCmd: getDefaultRefreshCmd(fullPath)
              })
            }
          }
        } catch (err) {
          // 忽略无权限访问的文件
          continue
        }
      }
      
      return { success: true, configFiles }
    } catch (error: any) {
      return { success: false, error: error?.message || 'Unknown error' }
    }
  })

  // 在Finder中打开文件
  ipcMain.handle('show-file-in-finder', async (_, arg) => {
    const { filePath } = arg ?? {}
    
    try {
      if (!filePath) {
        return { code: 2, msg: '文件路径不能为空' }
      }
      
      const absoluteFilePath = getAbsoluteFilePath(filePath)
      
      // 检查文件是否存在
      if (!fs.existsSync(absoluteFilePath)) {
        return { code: 2, msg: '文件不存在' }
      }
      
      // 使用 shell.showItemInFolder 在 Finder 中显示文件
      shell.showItemInFolder(absoluteFilePath)
      
      return { code: 3, msg: '已在Finder中打开文件' }
    } catch (error: any) {
      return { code: 2, msg: '打开文件失败: ' + (error?.message || 'Unknown error') }
    }
  })

  // 获取配置文件描述的辅助函数
  function getConfigFileDescription(fileName: string): string {
    const descriptions: Record<string, string> = {
      '.zshrc': 'Zsh Shell 配置文件',
      '.bashrc': 'Bash Shell 配置文件',
      '.bash_profile': 'Bash Profile 配置文件',
      '.vimrc': 'Vim 编辑器配置文件',
      '.gitconfig': 'Git 全局配置文件',
      '.ssh/config': 'SSH 客户端配置文件',
      '.npmrc': 'NPM 包管理器配置',
      '.yarnrc': 'Yarn 包管理器配置',
    }
    
    return descriptions[fileName] || `${fileName} 配置文件`
  }

  // 获取默认刷新命令的辅助函数
  function getDefaultRefreshCmd(filePath: string): string {
    const fileName = filePath.split('/').pop() || ''
    
    if (fileName.includes('nginx')) {
      return 'nginx -s reload'
    } else if (fileName.includes('.zshrc')) {
      return `source ${filePath}`
    } else if (fileName.includes('.bashrc')) {
      return `source ${filePath}`
    } else if (fileName.includes('vimrc')) {
      return `source ${filePath}`
    } else if (fileName.includes('tmux.conf')) {
      return `tmux source-file ${filePath}`
    } else if (fileName.includes('gitconfig')) {
      return 'git config --global -e'
    }
    
    return `cat ${filePath}`
  }

  // 渲染层请求重启升级
  ipcMain.handle('quit-and-install', () => {
    autoUpdater.quitAndInstall()
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.xopenbeta.configeditor')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
