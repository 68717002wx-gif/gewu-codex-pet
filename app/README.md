# gewu-codex-pet 桌面窗口框架

这是“格物页”桌面宠物的 Electron 透明窗口框架，用于后续把 `demo/index.html` 封装成真桌面宠物。

## 已预留能力

- 真桌面透明窗口：`frame: false`、`transparent: true`、透明背景。
- 悬浮置顶：`alwaysOnTop` + `floating` level。
- 右下角默认出现，可拖动后保存位置。
- 隐藏/唤出：窗口关闭时默认隐藏，托盘菜单可显示/隐藏。
- 右键菜单：待机、开心、专注、睡觉、摸鱼、贴边、置顶、隐藏、退出。
- 状态持久化：状态文件写入 Electron `userData` 目录。
- Codex/CLI 状态预留：通过 `codex:status` IPC 通道向前端派发状态。

## 本阶段不直接运行的原因

当前交付目标是“设计图 + Demo 同步做”。Electron 运行需要本机安装依赖；涉及安装软件/依赖前，需要你单独确认。

确认后可在 `app/` 目录执行：

```bash
npm install
npm start
```

> 后续如果你希望我继续封装，我会先确认安装依赖，再执行。
