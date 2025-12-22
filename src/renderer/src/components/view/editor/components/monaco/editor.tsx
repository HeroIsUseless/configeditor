import { appSettingsAtom, downloadProgressAtom, downloadSpeedAtom, downloadStatusAtom, isFileLoadingAtom, newTextContentAtom, nowFileExtAtom, nowFileInfoAtom, nowFilePathAtom, textContentAtom, themeAtom } from '@/components/view/editor/store'
import Editor, { loader } from '@monaco-editor/react'
import { useAtom } from 'jotai'
import * as monaco from "monaco-editor"
import { useRef, useMemo, useEffect } from 'react'
import { WelcomeFragment } from '../welcome-fragment'
import { getLanguageFromFilePath, registerApacheLanguage, registerNginxLanguage } from './languages'
import { MonacoLoading } from './loading'
import { peekViewManager, usePeekView } from './peekView'
import './peekview.css'
import { useLoadFile } from './useLoadFile'

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  }
}

loader.config({ monaco });
registerNginxLanguage(monaco);
registerApacheLanguage(monaco);

export function MonacoEditor() {
    const [nowFilePath] = useAtom(nowFilePathAtom)
    const [nowFileInfo] = useAtom(nowFileInfoAtom)
    const [nowFileExt] = useAtom(nowFileExtAtom)
    const [textContent] = useAtom(textContentAtom);
    const [newTextContent, setNewTextContent] = useAtom(newTextContentAtom);
    const [appSettings] = useAtom(appSettingsAtom);
    const [isFileLoading] = useAtom(isFileLoadingAtom);
    const [downloadProgress] = useAtom(downloadProgressAtom);
    const [downloadSpeed] = useAtom(downloadSpeedAtom);
    const [downloadStatus] = useAtom(downloadStatusAtom);
    const [currentTheme] = useAtom(themeAtom);
    
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
    useLoadFile();
    usePeekView({
        nowFilePath,
        textContent,
        editorRef,
        currentTheme
    });

    // 根据系统主题自动选择 Monaco Editor 主题
    const monacoTheme = useMemo(() => {
        // 否则根据系统主题自动选择
        if (currentTheme === 'dark') {
            return 'vs-dark';
        } else if (currentTheme === 'light') {
            return 'vs';
        } else if (currentTheme === 'system') {
            // 检测系统主题偏好
            const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            return isDarkMode ? 'vs-dark' : 'vs';
        }
        
        return 'vs'; // 默认浅色主题
    }, [currentTheme]);

    // 监听主题变化并同步全局 Monaco 主题
    useEffect(() => {
        // 设置全局 Monaco 主题，确保所有编辑器（包括 diff editor）使用相同主题
        monaco.editor.setTheme(monacoTheme)
    }, [monacoTheme])

    // 根据文件路径和扩展名获取语言类型
    const editorLanguage = nowFilePath ? getLanguageFromFilePath(nowFilePath, nowFileExt) : 'plaintext'

    // 当编辑器挂载时注册 diff 功能
    const onEditorMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
        editorRef.current = editor
        
        // 设置全局 Monaco 主题，确保所有编辑器（包括 diff editor）使用相同主题
        monaco.editor.setTheme(monacoTheme)
        
        if (editorRef.current && nowFilePath) {
            // 使用textContent作为原始内容进行注册
            peekViewManager.registerEditor(editorRef.current, textContent, nowFilePath)
        }
    }

    // 当内容变化时更新 diff
    const onEditorChange = (content: string | undefined) => {
        const newContent = content ?? ''
        setNewTextContent(newContent)
        // 更新 diff 显示
        if (nowFilePath && editorRef.current) {
            peekViewManager.updateDiff()
        }
    }

    return <div className='w-full' style={{height: 'calc(100% - 65px)'}}>
        {/* Text Editor */}
        {nowFilePath ? (
            isFileLoading ? (
                <MonacoLoading
                    downloadStatus={downloadStatus}
                    downloadProgress={downloadProgress}
                    downloadSpeed={downloadSpeed}
                    hasRemoteInfo={!!nowFileInfo?.remoteInfo}
                />
            ) : (
                <Editor
                    defaultLanguage=""
                    defaultValue=""
                    value={newTextContent}
                    onChange={onEditorChange}
                    onMount={onEditorMount}
                    language={editorLanguage}
                    theme={monacoTheme}
                    options={{
                        fontSize: appSettings.fontSize,
                        automaticLayout: true,
                        wordWrap: appSettings.wordWrap ? 'on' : 'off',
                        lineNumbers: appSettings.lineNumbers ? 'on' : 'off',
                        minimap: { enabled: true },
                        // glyphMargin: true, // 启用字形边距以显示 diff 装饰器 但这个在行号左边
                        // lineDecorationsWidth: 20, // 为 line decorations 预留空间，这是什么？
                        // lineNumbersMinChars: 3, // 确保行号有足够空间
                        // revealHorizontalRightPadding: 30, // 右侧留白
                        // overviewRulerLanes: 3, // 启用概览标尺
                    }}
                />
            )
        ) : (
            <WelcomeFragment />
        )}
    </div>
}
