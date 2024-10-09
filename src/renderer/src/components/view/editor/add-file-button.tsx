
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
import { filePathsAtom, nowFilePathAtom } from '@/lib/store'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { useAtom } from 'jotai'
import {
    Atom,
    FileText,
    FolderSearch,
    Plus,
    Trash2
} from 'lucide-react'
import { useState } from 'react'
import { useFilePathSearch } from './utils'
const { ipcRenderer } = window.require('electron')

export function AddFileButton() {
    const [filePath, setFilePath] = useState('')
    const [, setNowFilePath] = useAtom(nowFilePathAtom)
    const [filePaths, setFilePaths] = useAtom(filePathsAtom)
    const [open, setOpen] = useState(false);

    const onOk = () => {
        ipcRenderer.invoke('read-file-content', { filePath }).then((arg) => {
            if (arg && arg.content && typeof arg.content === 'string') {
                const newFilePaths: string[] = [...filePaths];
                if (!newFilePaths.includes(filePath)) {
                    newFilePaths.unshift(filePath);
                }
                setFilePaths(newFilePaths)
                setNowFilePath(filePath)
                localStorage.setItem('filePaths', JSON.stringify(newFilePaths))
                setFilePath('')
                setOpen(false)
            } else {
                alert('读取文件内容失败')
                // TODO: 权限问题
            }
        })
    }

    // 打开选择配置文件窗口
    async function openSelectDialog(): Promise<string[]> {
        return new Promise((resolve, reject) => {
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
                    onClick={() => { }}
                    size="sm"
                    className="px-2 h-8 bg-blue-500 hover:bg-blue-600 rounded-md"
                >
                    <Plus className="h-4 w-4 text-white" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>添加配置文件</DialogTitle>
                    <DialogDescription>请添加配置文件的绝对路径</DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                        <Input value={filePath} onChange={(e) => setFilePath(e.target.value)} />
                    </div>
                    <Button type="button" variant="secondary" className="px-3" onClick={onSearchBtnClick}>
                        <span className="sr-only">Search</span>
                        <FolderSearch className="h-4 w-4" />
                    </Button>
                </div>
                <DialogFooter className="sm:justify-end">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onOk}
                        className=" bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                    >
                        确定
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}