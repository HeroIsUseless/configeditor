import { AppSettings, defaultAppSettings, FileInfo } from "../store";

export function isSubstr(str: string, sub: string) {
  let res = false;
  let i = 0;
  let j = 0;
  if (str.length === 0 || sub.length === 0) {
    res = false;
  }
  while (i < str.length && j < sub.length) {
    if (str[i] === sub[j]) {
      i += 1;
      j += 1;
    } else {
      i += 1;
    }
  }
  if (j === sub.length) { 
    res = true;
  }
  return res;
}

export function getDefaultRefreshCmd(filePath: string) {
  let res = `cat ${filePath}`;
  if (filePath) {
    // 获取文件名
    const fileName = filePath.split("/").pop();
    if (fileName?.includes('nginx')) {
      res = `nginx -s reload`;
    } else if (fileName?.includes('.zshrc')) {
      res = `source ${filePath}`;
    } else if (fileName?.includes('.bashrc')) {
      res = `source ${filePath}`;
    } else if (fileName?.includes('vimrc')) {
      res = `source ${filePath}`;
    } else if (fileName?.includes('tmux.conf')) {
      res = `tmux source-file ${filePath}`;
    } else if (fileName?.includes('gitconfig')) {
      res = `git config --global -e`;
    }
  }
  return res;
}

const FILE_INFOS = 'configeditorfileinfos';
export function saveFileInfos(newFileInfos: FileInfo[]) {
  localStorage.setItem(FILE_INFOS, JSON.stringify(newFileInfos))
}

export function readFileInfos(): FileInfo[] {
  console.log('zws 读取本地文件列表readFileInfos', localStorage.getItem(FILE_INFOS))
  let fileInfos: FileInfo[] = [];
  try {
    fileInfos = JSON.parse(localStorage.getItem(FILE_INFOS) || '[]');
  } catch (e) {
    console.error('读取文件列表失败，数据格式错误：', e);
    fileInfos = [];
  }
  for (const fileInfo of fileInfos) {
    if (!fileInfo.id) {
      // 容错处理，补全 id 字段
      fileInfo.id = fileInfo.filePath + '@' + (fileInfo.remoteInfo?.host || '127.0.0.1');
    }
  }
  return fileInfos;
}

export const STORE_APP_SETTINGS = 'STORE_APP_SETTINGS';
export function saveAppSettings(appSettings: AppSettings) {
  localStorage.setItem(STORE_APP_SETTINGS, JSON.stringify(appSettings))
}

export function readAppSettings(): AppSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(STORE_APP_SETTINGS) || '');
    // 合并默认设置，确保所有属性都存在
    return {
      ...defaultAppSettings,
      ...stored,
      ai: {
        ...defaultAppSettings.ai,
        ...(stored.ai || {})
      }
    };
  } catch (e) {
    return defaultAppSettings;
  }
}
