import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { nowFilePathAtom } from '@/lib/store'
import { useAtom } from 'jotai'
import { HardDrive, Info, Moon, RefreshCw, Sun } from 'lucide-react'
import { useState } from 'react'

export default function SettingsDialog(props: {
  isSettingDialogOpen: boolean
  setIsSettingDialogOpen: (isSettingDialogOpen: boolean) => void
}) {
  const { isSettingDialogOpen, setIsSettingDialogOpen } = props;
  const [nowFilePath] = useAtom(nowFilePathAtom)
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState('en')
  const [fontSize, setFontSize] = useState('14')

  return (
    <Dialog open={isSettingDialogOpen} onOpenChange={setIsSettingDialogOpen}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={nowFilePath ? "file" : "general"} className="w-full">
          <TabsList className={`grid w-full ${nowFilePath ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {!!nowFilePath && <TabsTrigger value="file">文件</TabsTrigger>}
            <TabsTrigger value="general">通用</TabsTrigger>
            <TabsTrigger value="editor">编辑</TabsTrigger>
          </TabsList>
          <TabsContent value="file">
            <div className="space-y-4 py-2 pb-4">
              <div className="space-y-2">
                <Label htmlFor="current-file-path">当前文件路径</Label>
                <Input
                  id="current-file-path"
                  value={nowFilePath}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="permissions">文件权限</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="选择文件权限" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="write">Write</SelectItem>
                    <SelectItem value="execute">Execute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="command">刷新按钮命令</Label>
                <Input id="command" placeholder="Enter command..." value={'source /user/path/.zshrc'} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="general">
            <div className="space-y-4 py-2 pb-4">

              <div className="space-y-2">
                <Label htmlFor="command">明暗模式</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="dark-mode"
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                  />
                  {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>About</Label>
                <Button variant="outline" className="w-full justify-start">
                  <Info className="mr-2 h-4 w-4" /> About Us
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="editor">
            <div className="space-y-4 py-2 pb-4">
              <div className="space-y-2">
                <Label htmlFor="font-size">Font Size</Label>
                <Select value={fontSize} onValueChange={setFontSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12px</SelectItem>
                    <SelectItem value="14">14px</SelectItem>
                    <SelectItem value="16">16px</SelectItem>
                    <SelectItem value="18">18px</SelectItem>
                    <SelectItem value="20">20px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme">Editor Theme</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="monokai">Monokai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <div className="flex items-center space-x-2 justify-end">
            <Button><RefreshCw className="mr-2 h-4 w-4" />还原设置</Button>
            <Button><HardDrive className="mr-2 h-4 w-4" />存储设置</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}