'use client'

import { Button } from '@/components/ui/button'
import { isEditingAtom, isLeftPanelOpenAtom, newTextContentAtom, nowFileInfoAtom, nowFilePathAtom, textContentAtom } from '@/lib/store'
import { useAtom } from 'jotai'
import { Check, ChevronRight, Copy, RefreshCw, Save, Settings } from 'lucide-react'
import { useState } from 'react'
import SettingsDialog from './settings-dialog'
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SudoDialog } from './sudo-dialog'
const { ipcRenderer } = window.require('electron')

export function EditorHeadBar() {
  const [nowFileInfo] = useAtom(nowFileInfoAtom)
  const [nowFilePath] = useAtom(nowFilePathAtom)
  const [isEditing] = useAtom(isEditingAtom);
  const [isPathCopied, setIsPathCopied] = useState(false)
  const [isSettingDialogOpen, setIsSettingDialogOpen] = useState(false)
  const [textContent, setTextContent] = useAtom(textContentAtom)
  const [newTextContent] = useAtom(newTextContentAtom)
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useAtom(isLeftPanelOpenAtom)

  const onSaveBtnClick = () => {
    return new Promise((resolve) => {
      if (isEditing) {
        // 文件已编辑过
        ipcRenderer.invoke('is-file-write', { filePath: nowFilePath }).then((arg) => {
          // 判断文件是否可写
          const { code, msg } = arg ?? {}
          if (code === 3) {
            // 可写
            ipcRenderer.invoke('write-file', { filePath: nowFilePath, content: newTextContent }).then((res) => {
              // 写入文件成功，处理当前数据
              setTextContent(newTextContent)
              toast("文件存储成功")
            })
          } else if (code === 2) {
            // 不可写(读取文件出错或文件不可写)
            alert('Save failed: ' + msg)
          }
          resolve(true)
        })
      }
    })
  }

  const onRefreshBtnClick = () => {
    onSaveBtnClick().then((res) => {
      console.log('Refreshing config:', nowFilePath)
      if (nowFileInfo?.refreshCmd) {
        ipcRenderer.invoke('exec-refresh', { refreshCmd: nowFileInfo?.refreshCmd }).then((res) => {
          console.log('exec-refresh:', res)
          toast("配置文件刷新成功")
        })
      } else {
        toast('No refresh command found')
      }
    })
  }

  const onCopyBtnClick = async (filePath: string) => {
    if (filePath) {
      try {
        await navigator.clipboard.writeText(filePath)
        setIsPathCopied(true)
        setTimeout(() => setIsPathCopied(false), 2000)
      } catch (err) {
        alert('Failed to copy: Please try again')
      }
    }
  }

  const onOpenLeftPanelBtnClick = () => {
    setIsLeftPanelOpen(true)
  }

  return <>
    {/* Top Management Bar */}
    <div className="w-full max-w-full bg-white shadow-sm p-4 pr-2 flex justify-between items-center border-b border-gray-200">
      <div className="flex items-center" style={{ width: 'calc(100% - 192px)' }}>
        {/* {!isLeftPanelOpen && (
          <Button onClick={onOpenLeftPanelBtnClick} size="icon" variant="ghost" className="mr-2 h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        )} */}
        <h1 className={`text-lg font-semibold truncate ${isEditing ? 'text-red-700' : 'text-gray-700'}`}>
          {nowFilePath || '选择一个配置文件'}
        </h1>
        {!!nowFilePath && (
          <Button
            onClick={() => onCopyBtnClick(nowFilePath)}
            size="sm"
            variant="ghost"
            className="text-gray-500 hover:text-gray-700"
          >
            {isPathCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        )}
      </div>
      <div className='whitespace-nowrap w-[192px] flex justify-end'>
        {!!nowFilePath && <>
          <Button
            onClick={onSaveBtnClick}
            size="sm"
            className="mr-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
          >
            <Save className="mr-1 h-4 w-4" />
            保存
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  onClick={onRefreshBtnClick}
                  size="sm"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
                >
                  <RefreshCw className="mr-1 h-4 w-4" />
                  刷新
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{nowFileInfo?.refreshCmd}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>}
        <Button onClick={() => setIsSettingDialogOpen(true)} size="sm" variant="ghost" className="text-gray-500 hover:text-gray-700 ml-2">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
    <SettingsDialog isSettingDialogOpen={isSettingDialogOpen} setIsSettingDialogOpen={setIsSettingDialogOpen} />
    <SudoDialog />
  </>
}