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
import { fileInfosAtom, filePathsAtom, nowFilePathAtom } from '@/lib/store'
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
import { AddFileButton } from './add-file-button'
const { ipcRenderer } = window.require('electron')

export function FileSidebar() {
    const [fileInfos, setFileInfos] = useAtom(fileInfosAtom)
    const [filePaths] = useAtom(filePathsAtom)
    const [nowFilePath, setNowFilePath] = useAtom(nowFilePathAtom)
    const [searchName, setSearchName] = useState<string>('')
    const showFilePaths = useFilePathSearch(filePaths, searchName)

    const onSelect = (name: string) => {
        setNowFilePath(name)
    }

    const onDelete = (filePath: string, e: any) => {
        e.stopPropagation()
        const newFileInfos = fileInfos.filter((file) => file.filePath !== filePath)
        setFileInfos(newFileInfos)
        localStorage.setItem('filePaths', JSON.stringify(newFileInfos))
        if (nowFilePath === filePath) {
            setNowFilePath('')
        }
    }

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-700">
                    <Atom className="mr-2 h-5 w-5" />
                    配置文件管理器
                </h2>
                <div className="flex mb-2">
                    <Input
                        placeholder="搜索文件"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="mr-1 h-8 text-sm bg-gray-100 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <AddFileButton />
                </div>
            </div>
            <ScrollArea className="flex-grow">
                {!showFilePaths.length ? (
                    <>
                        <div className="flex items-center justify-center h-full text-gray-500">空空如也</div>
                    </>
                ) : (
                    <>
                        {showFilePaths.map((file) => (
                            <div
                                key={file}
                                className={`group relative flex items-center w-full py-2 px-4 text-sm hover:bg-gray-100 focus:bg-gray-100 
                            transition-colors ${nowFilePath === file ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}
                        `}
                            >
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start p-0 hover:bg-transparent"
                                    onClick={() => onSelect(file)}
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    {file.split('/')?.pop() ?? ''}
                                    {/* {nowFilePath === file && <ChevronRight className="ml-auto h-4 w-4" />} */}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-500 hover:text-red-500"
                                    onClick={(e) => onDelete(file, e)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </>
                )}
            </ScrollArea>
        </div>
    )
}
