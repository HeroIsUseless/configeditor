import { Button } from "@/components/ui/button";
import { Github, FileText, Server, Code, Database, Settings, PanelLeft, Bot, Zap, Globe, Box, Layers, Terminal, Command, Cpu, Plus, FolderOpen, Book, Clock, ArrowRight, Search, GripVertical, Play, Square, Hexagon, Info, MemoryStick, HardDrive, Wifi, Users } from "lucide-react";
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
                    <div className="w-full flex justify-center">
                        <a
                            href="https://github.com/heroisuseless/configeditor"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20"
                        >
                            <Github className="w-4 h-4" />
                            <span className="text-xs">如果喜欢 Envis，去 GitHub 点个 Star</span>
                            <ArrowRight className="w-3.5 h-3.5 opacity-70" />
                        </a>
                    </div>
                    <div>
                        <h1 className="text-3xl font-medium tracking-tight text-gray-900 dark:text-white mb-2">Envis</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">一款全平台环境管理软件</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ActionCard
                        icon={<Plus className="w-5 h-5 text-blue-500 dark:text-blue-400" />}
                        title="New Environment"
                        desc="Create a new service stack"
                    />
                    <ActionCard
                        icon={<Terminal className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />}
                        title="Open Terminal"
                        desc="Import existing configuration"
                    />
                    <ActionCard
                        icon={<Zap className="w-5 h-5 text-purple-500 dark:text-purple-400" />}
                        title="AI Assistant"
                        desc="Chat with AI"
                    />
                    <ActionCard
                        icon={<Book className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />}
                        title="Documentation"
                        desc="Learn how to use Envis"
                        onClick={() => window.open('https://github.com/heroisuseless/configeditor', '_blank')}
                    />
                </div>

                {/* Usage Scenarios */}
                <div className="space-y-3">
                    <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1">使用场景</h2>
                    <div className="grid grid-cols-1 gap-3">
                        {[
                            {
                                icon: <Zap className="w-5 h-5 text-orange-500 dark:text-orange-400" />,
                                title: "极速环境搭建",
                                description: "开发一个新项目，搭建环境往往是最难的，下载困难，配置繁琐，依赖错误，这时候就可以用envis一键下载安装服务程序，告别繁琐的手动配置与依赖排错，让项目立即进入可运行状态"
                            },
                            {
                                icon: <Layers className="w-5 h-5 text-blue-500 dark:text-blue-400" />,
                                title: "多项目无缝切换",
                                description: "多项目开发时，项目A需要node14，Java8，mysql，而另一个项目需要Node20，Java11，mariadb，每次切换项目开发都要先切换一串环境，比较麻烦，用envis可一键切换环境。轻松切换复杂的项目依赖。"
                            },
                            {
                                icon: <Users className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
                                title: "团队环境标准化",
                                description: "每个电脑都要配置一遍环境，比较麻烦，envis支持导出导入环境配置，一键搭建完全相同环境，让项目稳定运行起来。消除“在我电脑上能跑”的困扰，确保所有团队成员拥有一致的开发环境，保障项目在不同设备上的稳定运行。"
                            }
                        ].map((scenario, index) => (
                            <div key={index} className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:border-gray-300 dark:hover:border-white/10 transition-all group">
                                <div className="mt-1 p-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 group-hover:border-gray-300 dark:group-hover:border-white/10 transition-colors shrink-0">
                                    {scenario.icon}
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{scenario.title}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{scenario.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Getting Started */}
                <div className="space-y-3">
                    <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1">Getting Started</h2>
                    <div className="grid grid-cols-3 gap-3">
                        <Step number="1" title="Create" desc="New Environment" />
                        <Step number="2" title="Configure" desc="Service Configuration" />
                        <Step number="3" title="Run" desc="One-Click Start" />
                    </div>
                </div>

            </div>
        </div>

    </div>
}

function ActionCard({ icon, title, desc, onClick }: { icon: React.ReactNode, title: string, desc: string, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:border-gray-300 dark:hover:border-white/10 transition-all text-left group"
        >
            <div className="mt-1 p-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 group-hover:border-gray-300 dark:group-hover:border-white/10 transition-colors">
                {icon}
            </div>
            <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
        </button>
    )
}

function Step({ number, title, desc }: { number: string, title: string, desc: string }) {
    return (
        <div className="flex flex-col items-center text-center p-3 rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-white mb-2">
                {number}
            </div>
            <div className="text-xs font-medium text-gray-900 dark:text-white">{title}</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">{desc}</div>
        </div>
    )
}
