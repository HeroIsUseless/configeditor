import { Github, FileText, Database, Zap, Globe, Layers, Clock, ArrowRight, Search, Plus, Users } from "lucide-react";
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

    return <div className="relative w-full h-full bg-white dark:bg-[#030303] text-gray-900 dark:text-white overflow-hidden flex flex-col font-sans selection:bg-blue-500/20 dark:selection:bg-white/20">
        {/* Cursor-style Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Subtle gradient glow at the top */}
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-black/[0.02] dark:bg-white/[0.03] blur-[120px] rounded-full"></div>

            {/* Grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        </div>

        {/* Main Content - App Welcome Screen */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center">
            <div className="w-full max-w-2xl px-6 flex flex-col gap-8">

                {/* Brand Header */}
                <div className="text-center space-y-4 mt-6">
                    <div>
                        <h1 className="text-3xl font-medium tracking-tight text-gray-900 dark:text-white mb-2">配置文件管理器</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">轻松管理和编辑您的配置文件</p>
                    </div>
                </div>

                {/* Quick Start */}
                <div className="space-y-3">
                    <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1">快速入门</h2>
                    <div className="grid grid-cols-1 gap-3">
                        {[
                            {
                                icon: <Plus className="w-4 h-4" />,
                                text: "在左侧面板中，点击 + 按钮引用新的配置文件"
                            },
                            {
                                icon: <FileText className="w-4 h-4" />,
                                text: "点击文件名以选择并编辑配置文件"
                            },
                            {
                                icon: <Database className="w-4 h-4" />,
                                text: "使用顶部工具栏中的 保存 按钮保存更改（可能需要权限）"
                            },
                            {
                                icon: <Zap className="w-4 h-4" />,
                                text: "使用 刷新 按钮重新加载配置文件（可自定义刷新命令）"
                            },
                            {
                                icon: <Search className="w-4 h-4" />,
                                text: "悬停在文件上可以看到移除按钮，点击即可移除文件"
                            },
                            {
                                icon: <Clock className="w-4 h-4" />,
                                text: "点击下方推荐列表中的配置文件，快速添加到文件列表"
                            }
                        ].map((item, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                                <div className="text-blue-500 dark:text-blue-400 shrink-0">
                                    {item.icon}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recommended Config Files */}
                <div className="space-y-3">
                    <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1">推荐配置文件</h2>
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02]">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"></div>
                                <span className="text-sm">正在扫描配置文件...</span>
                            </div>
                        </div>
                    ) : recommendedFiles.length === 0 ? (
                        <div className="flex items-center justify-center p-8 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02]">
                            <p className="text-sm text-gray-500 dark:text-gray-400">未找到推荐的配置文件</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {recommendedFiles.map((file, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleRecommendedFileClick(file)}
                                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:border-gray-300 dark:hover:border-white/10 transition-all text-left group"
                                >
                                    <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 group-hover:border-gray-300 dark:group-hover:border-white/10 transition-colors shrink-0 mt-0.5">
                                        <FileText className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {file.filePath.split('/').pop() || file.filePath}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{file.filePath}</p>
                                        {file.description && (
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{file.description}</p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Features */}
                <div className="space-y-3">
                    <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1">功能亮点</h2>
                    <div className="grid grid-cols-1 gap-3">
                        {[
                            {
                                icon: <Layers className="w-5 h-5 text-blue-500 dark:text-blue-400" />,
                                title: "简洁直观的用户界面",
                                description: "支持浅色/深色主题"
                            },
                            {
                                icon: <Zap className="w-5 h-5 text-orange-500 dark:text-orange-400" />,
                                title: "快速管理和刷新多个配置文件",
                                description: "高效的文件管理体验"
                            },
                            {
                                icon: <FileText className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
                                title: "文件路径一键复制",
                                description: "便捷的路径管理"
                            },
                            {
                                icon: <Globe className="w-5 h-5 text-purple-500 dark:text-purple-400" />,
                                title: "支持本地和远程文件编辑",
                                description: "灵活的文件访问方式"
                            },
                            {
                                icon: <Clock className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />,
                                title: "实时文件状态监控",
                                description: "及时了解文件变化"
                            }
                        ].map((feature, index) => (
                            <div key={index} className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:border-gray-300 dark:hover:border-white/10 transition-all group">
                                <div className="mt-1 p-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 group-hover:border-gray-300 dark:group-hover:border-white/10 transition-colors shrink-0">
                                    {feature.icon}
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{feature.title}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Learn More */}
                <div className="space-y-3 pb-8">
                    <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1">了解更多</h2>
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02]">
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                            访问我们的 GitHub 仓库，获取详细文档、报告问题或贡献代码：
                        </p>
                        <a
                            href="https://github.com/heroisuseless/configeditor"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm font-medium"
                        >
                            <Github className="w-4 h-4" />
                            <span>访问 GitHub 仓库</span>
                            <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
                </div>



            </div>
        </div>

    </div>
}
