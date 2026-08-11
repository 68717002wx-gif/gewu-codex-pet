# gewu-codex-pet

“格物页”工作陪伴桌面宠物第一版：设计图 + 可交互 Demo + 真桌面透明窗口框架。

## 快速查看

- 打开 `demo/index.html` 查看交互 Demo。
- 查看 `docs/product-spec.md` 了解需求规格。
- 查看 `docs/delivery-notes.md` 了解交付范围与下一步。

## 文件结构

```text
gewu-codex-pet/
├── assets/
│   ├── frames/                  # 基础动作帧、情绪帧集中图
│   ├── generated/               # 角色设定稿
│   └── reference/               # 参考图备份
├── app/                         # Electron 真桌面透明窗口框架
├── demo/                        # HTML/CSS/JS 可交互 Demo
├── design/                      # 视觉检查记录
└── docs/                        # 产品规格、交互映射、交付说明
```

## 当前状态

第一版已具备设计稿、Demo、状态系统、右键菜单、音效模拟、Electron 封装骨架。下一步建议先确认视觉，再拆动作帧并运行桌面窗口。
