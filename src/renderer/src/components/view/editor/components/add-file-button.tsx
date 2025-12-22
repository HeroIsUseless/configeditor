import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { FileInfo, fileInfosAtom, filePathsAtom, nowFilePathAtom } from '@/components/view/editor/store'
import { useAtom } from 'jotai'
import {
    FolderSearch,
    Plus,
    ChevronDown,
    ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import { saveFileInfos } from '../utils'
const { ipcRenderer } = window.require('electron')

export function AddFileButton() {
    const [filePath, setFilePath] = useState('')
    const [, setNowFilePath] = useAtom(nowFilePathAtom)
    const [fileInfos, setFileInfos] = useAtom(fileInfosAtom);
    const [filePaths] = useAtom(filePathsAtom)
    const [open, setOpen] = useState(false);
    
    // 高级设置状态
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
    const [host, setHost] = useState('')
    const [port, setPort] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [description, setDescription] = useState('')

    const onOk = () => {
        // 验证文件路径不能为空
        if (!filePath.trim()) {
            alert('请输入文件路径')
            return
        }

        // 验证文件描述不能为空
        if (!description.trim()) {
            alert('请输入文件描述')
            return
        }
        
        // 验证远程连接信息
        const isRemoteFile = isAdvancedOpen && host.trim() && port.trim() && username.trim() && password.trim()
        if (isAdvancedOpen && !isRemoteFile) {
            alert('请填写完整的远程连接信息')
            return
        }

        // 检查文件是否已存在
        for (const info of fileInfos) {
            if (info.filePath === filePath && info.remoteInfo?.host === host.trim()) {
                alert('文件已存在于列表中')
                return
            }
        }

        if (isRemoteFile) {
            // 远程文件，先测试连接
            const remoteInfo = {
                host: host.trim(),
                port: parseInt(port),
                username: username.trim(),
                password: password.trim()
            }
            
            ipcRenderer.invoke('test-remote-connection', { remoteInfo }).then((arg) => {
                const { code, msg } = arg ?? {}
                if (code === 3) {
                    // 连接成功，添加远程文件
                    const newFileInfos: FileInfo[] = [...fileInfos];
                    const fileInfo: FileInfo = {
                        filePath, 
                        refreshCmd: 'cat ' + filePath,
                        description: description.trim(),
                        remoteInfo
                    };
                    newFileInfos.unshift(fileInfo);
                    setFileInfos(newFileInfos)
                    saveFileInfos(newFileInfos)
                    setNowFilePath(filePath)
                    // resetForm()
                    setOpen(false)
                } else {
                    alert(`远程连接失败: ${msg || '连接验证失败'}`)
                }
            }).catch((err) => {
                alert(`远程连接失败: ${err.message || '未知错误'}`)
            })
        } else {
            // 本地文件
            ipcRenderer.invoke('read-file-content', { filePath }).then((arg) => {
                if (arg && arg.content && typeof arg.content === 'string') {
                    const newFileInfos: FileInfo[] = [...fileInfos];
                    const fileInfo: FileInfo = {
                        filePath, 
                        refreshCmd: 'cat ' + filePath,
                        description: description.trim()
                    };
                    newFileInfos.unshift(fileInfo);
                    setFileInfos(newFileInfos)
                    saveFileInfos(newFileInfos)
                    setNowFilePath(filePath)
                    // resetForm()
                    setOpen(false)
                } else {
                    alert('读取文件失败！可能文件不存在或文件权限不足')
                }
            })
        }
    }

    const resetForm = () => {
        setFilePath('')
        setDescription('')
        setIsAdvancedOpen(false)
        setHost('')
        setPort('')
        setUsername('')
        setPassword('')
    }

    // 打开选择配置文件窗口
    async function openSelectDialog(): Promise<string[]> {
        return new Promise((resolve) => {
            ipcRenderer.invoke('open-select-dialog', {}).then((arg) => {
                if (arg && arg.filePaths) {
                    resolve(arg.filePaths)
                } else {
                    resolve([])
                }
            })
        })
    }

    const onSearchBtnClick = async () => {
        const filePaths = await openSelectDialog()
        if (filePaths && filePaths.length > 0) {
            setFilePath(filePaths[0])
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button 
                    size="sm" 
                    className="px-2 h-8 heroui-button heroui-button-primary border-0 rounded-lg shadow-none"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border border-divider rounded-2xl shadow-none bg-content1">
                <DialogHeader>
                    <DialogTitle className="text-foreground font-semibold">添加配置文件</DialogTitle>
                    <DialogDescription className="text-default-500">请添加配置文件的绝对路径</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor="filePath" className="text-sm font-medium text-foreground">文件路径</Label>
                            <Input 
                                id="filePath"
                                value={filePath} 
                                onChange={(e) => setFilePath(e.target.value)} 
                                placeholder="请输入文件的绝对路径"
                                className="border border-divider rounded-lg bg-content2 focus:border-primary shadow-none heroui-transition"
                            />
                        </div>
                        <Button 
                            type="button" 
                            variant="secondary" 
                            className="px-3 mt-6 heroui-button heroui-button-secondary border-0 rounded-lg shadow-none" 
                            onClick={onSearchBtnClick}
                        >
                            <span className="sr-only">Search</span>
                            <FolderSearch className="h-4 w-4" />
                        </Button>
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="description" className="text-sm font-medium text-foreground">
                            描述 <span className="text-danger">*</span>
                        </Label>
                        <Input 
                            id="description"
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            placeholder="请输入文件描述"
                            className="border border-divider rounded-lg bg-content2 focus:border-primary shadow-none heroui-transition"
                        />
                    </div>
                    
                    {/* 高级设置 - 可折叠 */}
                    <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                        <CollapsibleTrigger asChild>
                            <Button 
                                variant="link" 
                                className="flex items-center space-x-2 p-0 h-auto text-sm rounded-lg shadow-none"
                            >
                                {isAdvancedOpen ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                                <span>高级设置</span>
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3 mt-3">
                            <div className="text-sm text-default-500 mb-2">
                                配置远程连接信息
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="host" className="text-sm font-medium text-foreground">主机地址</Label>
                                    <Input
                                        id="host"
                                        value={host}
                                        onChange={(e) => setHost(e.target.value)}
                                        placeholder="192.168.1.100"
                                        className="border border-divider rounded-lg bg-content2 focus:border-primary shadow-none heroui-transition"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="port" className="text-sm font-medium text-foreground">端口</Label>
                                    <Input
                                        id="port"
                                        value={port}
                                        onChange={(e) => setPort(e.target.value)}
                                        placeholder="22"
                                        type="number"
                                        className="border border-divider rounded-lg bg-content2 focus:border-primary shadow-none heroui-transition"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="username" className="text-sm font-medium text-foreground">用户名</Label>
                                    <Input
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="root"
                                        className="border border-divider rounded-lg bg-content2 focus:border-primary shadow-none heroui-transition"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="password" className="text-sm font-medium text-foreground">密码</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="请输入密码"
                                        className="border border-divider rounded-lg bg-content2 focus:border-primary shadow-none heroui-transition"
                                    />
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
                <DialogFooter className="sm:justify-end">
                    <Button
                        type="button"
                        onClick={onOk}
                        className="heroui-button heroui-button-primary border-0 rounded-lg shadow-none"
                    >
                        确定
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
