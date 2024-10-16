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
