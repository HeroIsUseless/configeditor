import { appSettingsAtom, fileInfosAtom, filePathsAtom, initThemeAtom } from '@/components/view/editor/store'
import { useAtom } from "jotai"
import { useEffect, useMemo } from "react"
import { isSubstr, readAppSettings, readFileInfos } from "../utils"
import { historyStorage } from "../utils/history-storage"

export function useInitConfigEditor() {
    const [, setAppSettings] = useAtom(appSettingsAtom)
    const [, setFileInfos] = useAtom(fileInfosAtom)
    const [, initTheme] = useAtom(initThemeAtom)

    useEffect(() => {
        const localFileInfos = readFileInfos()
        setFileInfos(localFileInfos)
        const localAppSettings = readAppSettings()
        setAppSettings(localAppSettings)
        // 初始化主题
        initTheme()
        // 初始化历史存储
        historyStorage.init().catch(console.error)
    }, [setFileInfos, setAppSettings, initTheme])
}

export function useShowFileIds(searchName: string) {
    const [fileInfos] = useAtom(fileInfosAtom)

    const searchResults = useMemo(() => {
        let res: string[] = []
        if (searchName.trim().length === 0) {
            res = fileInfos.map(f => f.id)
        } else {
            for (const info of fileInfos) {
                if (isSubstr(info.filePath.trim(), searchName.trim()) || (info.description && isSubstr(info.description.trim(), searchName.trim()))) {
                    res.push(info.id)
                }
            }
        }
        return res;
    }, [searchName, fileInfos])

    return searchResults
}
