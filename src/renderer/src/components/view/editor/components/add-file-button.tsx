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
import { FileInfo, fileInfosAtom, filePathsAtom, nowFilePathAtom } from '@/components/view/editor/store'
import { useAtom } from 'jotai'
import {
    FolderSearch,
    Plus
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

    const onOk = () => {
        ipcRenderer.invoke('read-file-content', { filePath }).then((arg) => {
            if (arg && arg.content && typeof arg.content === 'string') {
                const newFileInfos: FileInfo[] = [...fileInfos];
                if (!filePaths.includes(filePath)) {
                    newFileInfos.unshift({filePath, refreshCmd: 'cat ' + filePath});
                }
                setFileInfos(newFileInfos)
                saveFileInfos(newFileInfos)
                setNowFilePath(filePath)
                setFilePath('')
                setOpen(false)
            } else {
                alert('读取文件失败！可能文件不存在或文件权限不足')
                // 权限问题，这里是只读的，大部分文件都是只读的，所以这里不做特殊处理了
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
                <Button size="sm" className="px-2 h-8 bg-blue-500 hover:bg-blue-600 rounded-md">
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
