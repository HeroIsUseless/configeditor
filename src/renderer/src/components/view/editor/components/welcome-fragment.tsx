import { Button } from "@/components/ui/button";
import { Github, FileText, Plus } from "lucide-react";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { 
    recommendedConfigFilesAtom, 
    isLoadingRecommendedFilesAtom,
    fileInfosAtom,
    nowFileIdAtom,
    RecommendedConfigFile,
    FileInfo
} from "../store";
import { saveFileInfos } from "../utils";

const { ipcRenderer } = window.require('electron');

export function WelcomeFragment() {
    const [recommendedFiles, setRecommendedFiles] = useAtom(recommendedConfigFilesAtom);
    const [isLoading, setIsLoading] = useAtom(isLoadingRecommendedFilesAtom);
    const [fileInfos, setFileInfos] = useAtom(fileInfosAtom);
    const [, setNowFileId] = useAtom(nowFileIdAtom);

    // 加载推荐配置文件
    useEffect(() => {
        const loadRecommendedFiles = async () => {
            setIsLoading(true);
            try {
                const result = await ipcRenderer.invoke('scan-config-files');
                if (result.success) {
                    setRecommendedFiles(result.configFiles);
                }
            } catch (error) {
                console.error('Failed to load recommended files:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadRecommendedFiles();
    }, [setRecommendedFiles, setIsLoading]);

    // 处理点击推荐文件
    const handleRecommendedFileClick = (recommendedFile: RecommendedConfigFile) => {
        // 检查文件是否已经在列表中
        const existingFile = fileInfos.find(file => file.filePath === recommendedFile.filePath);
        
        if (existingFile) {
            // 如果已存在，直接打开
            setNowFileId(existingFile.id);
        } else {
            // 如果不存在，创建新的文件信息
            const newFileInfo: FileInfo = {
                id: recommendedFile.filePath + "@127.0.0.1",
                filePath: recommendedFile.filePath,
                refreshCmd: recommendedFile.refreshCmd,
                description: recommendedFile.description
            };
            
            const newFileInfos = [newFileInfo, ...fileInfos];
            setFileInfos(newFileInfos);
            saveFileInfos(newFileInfos);
            setNowFileId(newFileInfo.id);
        }
    };

    return <div className="w-full h-[100%] p-8 pb-0 bg-content1 flex flex-col items-center heroui-transition" style={{ maxHeight: '100%', overflow: 'auto' }}>
        <div className="flex flex-col max-w-4xl w-full">
            <h2 className="text-3xl font-bold mb-8 text-foreground text-center">欢迎使用配置文件管理器</h2>

            <div className="border border-divider rounded-2xl p-6 mb-6 bg-content2 heroui-transition">
                <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                    快速入门
                </h3>
                <ol className="list-decimal list-inside space-y-3 text-default-500">
                    <li>在左侧面板中，点击 <span className="font-medium text-primary px-2 py-1 bg-primary/10 rounded-md">+</span> 按钮引用新的配置文件</li>
                    <li>点击文件名以选择并编辑配置文件</li>
                    <li>使用顶部工具栏中的 <span className="font-medium text-success px-2 py-1 bg-success/10 rounded-md">保存</span> 按钮保存更改（可能需要权限）</li>
                    <li>使用 <span className="font-medium text-warning px-2 py-1 bg-warning/10 rounded-md">刷新</span> 按钮重新加载配置文件（可自定义刷新命令）</li>
                    <li>悬停在文件上可以看到移除按钮，点击即可移除文件</li>
                    <li>点击下方推荐列表中的配置文件，快速添加到文件列表</li>
                </ol>
            </div>

            {/* 推荐配置文件部分 */}
            <div className="border border-divider rounded-2xl p-6 mb-6 bg-content2 heroui-transition">
                <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center">
                    <span className="w-2 h-2 bg-warning rounded-full mr-3"></span>
                    推荐配置文件
                </h3>
                {isLoading ? (
                    <div className="text-center py-4 text-default-500">
                        正在扫描配置文件...
                    </div>
                ) : recommendedFiles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {recommendedFiles.map((file, index) => (
                            <div
                                key={index}
                                onClick={() => handleRecommendedFileClick(file)}
                                className="flex items-center p-3 bg-content1 rounded-lg border border-divider hover:border-primary hover:bg-primary/5 cursor-pointer heroui-transition group"
                            >
                                <FileText className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-foreground truncate">
                                        {file.description}
                                    </div>
                                    <div className="text-xs text-default-500 truncate">
                                        {file.filePath}
                                    </div>
                                </div>
                                <Plus className="h-4 w-4 text-default-400 group-hover:text-primary ml-2 flex-shrink-0 heroui-transition" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 text-default-500">
                        未找到推荐的配置文件
                    </div>
                )}
            </div>

            <div className="border border-divider rounded-2xl p-6 mb-6 bg-content2 heroui-transition">
                <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center">
                    <span className="w-2 h-2 bg-success rounded-full mr-3"></span>
                    功能亮点
                </h3>
                <ul className="list-disc list-inside space-y-3 text-default-500">
                    <li>简洁直观的用户界面，支持浅色/深色主题</li>
                    <li>快速管理和刷新多个配置文件</li>
                    <li>文件路径一键复制</li>
                    <li>支持本地和远程文件编辑</li>
                    <li>实时文件状态监控</li>
                </ul>
            </div>

            <div className="border border-divider rounded-2xl p-6 bg-content2 heroui-transition">
                <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center">
                    <span className="w-2 h-2 bg-secondary rounded-full mr-3"></span>
                    了解更多
                </h3>
                <p className="mb-4 text-default-500">访问我们的 GitHub 仓库，获取详细文档、报告问题或贡献代码：</p>
                <Button 
                    variant="outline" 
                    className="flex items-center heroui-button heroui-button-ghost border border-divider hover:border-primary hover:bg-primary/5 heroui-transition rounded-lg shadow-none" 
                    onClick={() => window.open('https://github.com/heroisuseless/configeditor', '_blank')}
                >
                    <Github className="mr-2 h-4 w-4" />
                    访问 GitHub 仓库
                </Button>
            </div>
        </div>
    </div>
}
