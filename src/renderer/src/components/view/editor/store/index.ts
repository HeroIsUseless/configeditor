'use client'

import { atom } from 'jotai'

export type FileInfo = { 
  id: string;
  filePath: string; 
  refreshCmd: string;
  description: string;
  remoteInfo?: {
    host: string;
    port: number;
    username: string;
    password: string;
  }
}

// AI相关类型定义
export type AIProvider = 'openai' | 'deepseek'

export type AISettings = {
  provider: AIProvider
  apiKey: string
  baseUrl: string
  model: string
  enabled: boolean
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export type AppSettings = {
  theme: 'light' | 'dark' | 'system' | '',
  lineNumber: boolean,
  fontSize: number,
  language: string,
  wordWrap: boolean,
  lineNumbers: boolean,
  ai: AISettings
}
export const defaultAppSettings: AppSettings = {
  theme: 'system',
  lineNumber: true,
  fontSize: 14,
  language: 'en',
  wordWrap: false,
  lineNumbers: true,
  ai: {
    provider: 'openai',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo',
    enabled: false
  }
}

// 主题相关的原子状态
export const themeAtom = atom<'light' | 'dark' | 'system'>('system')

// 初始化主题从 localStorage 读取
export const initThemeAtom = atom(
  null,
  (_get, set) => {
    const storedTheme = localStorage.getItem('configeditor-theme') as 'light' | 'dark' | 'system'
    if (storedTheme) {
      set(themeAtom, storedTheme)
    }
  }
)

// 设置主题并保存到 localStorage
export const setThemeAtom = atom(
  null,
  (_get, set, theme: 'light' | 'dark' | 'system') => {
    set(themeAtom, theme)
    localStorage.setItem('configeditor-theme', theme)
    
    // 应用主题到 document
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }
)

export const fileInfosAtom = atom<FileInfo[]>([])
export const filePathsAtom = atom<string[]>((get) => get(fileInfosAtom).map(({ filePath }) => (filePath ?? '')))

export const nowFileIdAtom = atom('')
export const nowFileInfoAtom = atom<FileInfo | null>((get) => get(fileInfosAtom).find(({ id }) => id === get(nowFileIdAtom)) ?? null)
export const nowFilePathAtom = atom((get) => {
  const nowFileId = get(nowFileIdAtom)
  const fileInfos = get(fileInfosAtom)
  const fileInfo = fileInfos.find(({ id }) => id === nowFileId)
  return fileInfo ? fileInfo.filePath : ''
})
export const nowFileNameAtom = atom((get) => {
  return (get(nowFilePathAtom).split('/')?.pop() ?? '').replace(/\.[^/.]+$/, '')
})
export const nowFileExtAtom = atom((get) => get(nowFilePathAtom).split('.')?.pop() ?? '')

// 编辑器部分
export const textContentAtom = atom('') // 原文件的内容
export const newTextContentAtom = atom('') // 编辑后的内容，与原文件内容做对比可得知是否发生了修改
export const isEditingAtom = atom((get) => get(textContentAtom) !== get(newTextContentAtom))
export const isFileLoadingAtom = atom(false)

export const isLeftPanelOpenAtom = atom(true)

// 文件下载进度相关状态
export const downloadProgressAtom = atom<number>(0) // 下载进度百分比 0-100
export const downloadSpeedAtom = atom<string>('') // 下载速度
export const downloadStatusAtom = atom<string>('') // 下载状态描述

// Debug panel 相关状态
export type DebugLogType = 'info' | 'success' | 'error' | 'warning'

export type DebugLog = {
  id: string
  message: string
  type: DebugLogType
  timestamp: string
}

export const isDebugPanelOpenAtom = atom(false)
export const debugLogsAtom = atom<DebugLog[]>([])

// 添加日志的action
export const addDebugLogAtom = atom(
  null,
  (get, set, message: string, type: DebugLogType = 'info') => {
    const currentLogs = get(debugLogsAtom);
    const timestamp = new Date().toLocaleTimeString();
    const newLog: DebugLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      timestamp
    };
    set(debugLogsAtom, [...currentLogs, newLog]);
  }
)

// 清空日志的action
export const clearDebugLogsAtom = atom(
  null,
  (_get, set) => {
    set(debugLogsAtom, []);
  }
)

// 保存和刷新loading状态
export const isSavingAtom = atom(false)
export const isRefreshingAtom = atom(false)

// sudo dialog相关
export type SudoScenario = {
  type: 'user' | 'root'
  description: string
  purpose: 'file' | 'command'  // 区分是文件操作还是命令执行
}

export const isSudoDialogOpenAtom = atom(false)
export const sudoScenarioAtom = atom<SudoScenario>({
  type: 'user',
  description: '请输入你的登录密码（sudo密码）',
  purpose: 'file'
})

export const appSettingsAtom = atom<AppSettings>(defaultAppSettings)

// AI相关状态
export const isAIPanelOpenAtom = atom(false)
export const chatMessagesAtom = atom<ChatMessage[]>([])
export const isAIResponseLoadingAtom = atom(false)

// 添加聊天消息的action
export const addChatMessageAtom = atom(
  null,
  (get, set, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const currentMessages = get(chatMessagesAtom);
    const timestamp = new Date().toLocaleTimeString();
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      ...message
    };
    set(chatMessagesAtom, [...currentMessages, newMessage]);
  }
)

// 清空聊天记录的action
export const clearChatMessagesAtom = atom(
  null,
  (_get, set) => {
    set(chatMessagesAtom, []);
  }
)

// 推荐配置文件相关类型
export type RecommendedConfigFile = {
  filePath: string
  description: string
  refreshCmd: string
}

// 推荐配置文件相关状态
export const recommendedConfigFilesAtom = atom<RecommendedConfigFile[]>([])
export const isLoadingRecommendedFilesAtom = atom(false)
