'use client'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { EditorHeadBar } from './components/editor-headbar'
import { FileSidebar } from './components/file-sidebar'
import { MonacoEditor } from './components/monaco/editor'
import { DebugPanel } from './components/debug-panel'
import { AIFragment } from './components/ai-fragment'
import { useInitConfigEditor } from './hooks'
import { useAtom } from 'jotai'
import { isLeftPanelOpenAtom, isAIPanelOpenAtom } from './store'
import { useEffect, useRef } from "react"
import { ImperativePanelHandle } from "react-resizable-panels"

export default function ConfigEditor() {
  useInitConfigEditor();
  const [isLeftPanelOpen] = useAtom(isLeftPanelOpenAtom);
  const [isAIPanelOpen, setIsAIPanelOpen] = useAtom(isAIPanelOpenAtom);
  const resizablePanelRef = useRef<ImperativePanelHandle>(null);
  const aiPanelRef = useRef<ImperativePanelHandle>(null);

  useEffect(() => {
    if (resizablePanelRef.current) {
      console.log('Resizable panel ref is set:', resizablePanelRef.current);
      if (isLeftPanelOpen) {
        resizablePanelRef.current.expand();
      } else {
        resizablePanelRef.current.collapse();
      }
    }
  }, [isLeftPanelOpen]);

  useEffect(() => {
    if (aiPanelRef.current) {
      if (isAIPanelOpen) {
        aiPanelRef.current.expand();
      } else {
        aiPanelRef.current.collapse();
      }
    }
  }, [isAIPanelOpen]);

  return <>
    <ResizablePanelGroup
      direction="horizontal"
      className="w-screen h-screen bg-background text-foreground text-sm font-sans"
    >
      <ResizablePanel
        ref={resizablePanelRef}
        defaultSize={25}
        collapsedSize={0}
        collapsible={true}
        minSize={10}
      >
        <FileSidebar />
      </ResizablePanel>
      <ResizableHandle className=" bg-gray-100 dark:bg-gray-800 hover:bg-default heroui-transition" />
      <ResizablePanel 
        defaultSize={isAIPanelOpen ? 45 : 75}
        minSize={20}
      >
        <div className='w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center'>
            <div style={{width: 'calc(100% - 8px)', height: 'calc(100% - 8px)'}} className='bg-content1 dark:bg-content2 flex flex-col overflow-hidden rounded-md border border-border'>
              <EditorHeadBar />
              <MonacoEditor />
            </div>
        </div>
      </ResizablePanel>
      {isAIPanelOpen && (
        <>
          <ResizableHandle className="w-px bg-gray-50 dark:bg-gray-800 hover:bg-default heroui-transition" />
          <ResizablePanel
            ref={aiPanelRef}
            defaultSize={25}
            collapsedSize={0}
            collapsible={true}
            minSize={20}
            maxSize={50}
          >
            <div className='w-full h-full bg-gray-50 dark:bg-gray-800 flex items-center'>
              <div style={{width: 'calc(100% - 4px)', height: 'calc(100% - 8px)'}} className='bg-content1 dark:bg-content2 flex flex-col overflow-hidden rounded-md border border-border'>
                <AIFragment onClose={() => setIsAIPanelOpen(false)} />
              </div>
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
    <DebugPanel />
  </>
}
