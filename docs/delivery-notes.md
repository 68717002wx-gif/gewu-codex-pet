# gewu-codex-pet 第一版交付说明

## 已完成

1. 需求规格：`docs/product-spec.md`
2. 视觉资产：
   - `assets/generated/gewuye-character-sheet.png`
   - `assets/frames/gewuye-basic-actions.png`
   - `assets/frames/gewuye-emotions.png`
   - `assets/reference/reference.png`
3. 视觉检查：`design/visual-review.md`
4. HTML Demo：
   - `demo/index.html`
   - `demo/styles.css`
   - `demo/script.js`
5. Electron 真桌面透明窗口框架：
   - `app/main.js`
   - `app/preload.js`
   - `app/package.json`
   - `app/state.example.json`
   - `app/README.md`
6. 交互映射：`docs/interaction-map.md`

## Demo 使用方式

直接用浏览器打开：

`demo/index.html`

可体验：

- 拖动宠物
- 点击开心反馈
- hover 抬头
- 右键菜单
- 状态切换
- 定时说话
- 轻音效模拟
- 本地状态保存

## 桌面窗口说明

`app/` 是 Electron 封装框架，目标是实现真桌面透明悬浮窗口。当前没有安装依赖，也没有启动应用，因为安装依赖属于需要单独确认的操作。

## 下一步建议

1. 你先确认角色视觉是否需要更贴近参考图。
2. 若视觉方向确认，我继续把动作帧拆成独立 PNG 序列。
3. 再确认是否允许安装 Electron 依赖并运行真桌面透明窗口。
4. 最后接入 Codex/CLI 状态来源。

## 已知限制

- 当前生成图可能带有 AI 生成水印或少量非目标文字，后续正式资产可重新生成无字版/切帧版。
- HTML Demo 是浏览器模拟；真正跨窗口置顶、透明背景、托盘唤出要通过 Electron 运行。
- Codex/CLI 联动目前是接口预留，尚未绑定真实命令或日志源。
