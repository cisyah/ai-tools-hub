# AI Tools Hub v2

个人自部署 AI 工具入口站。v2.1 保留本地/内网优先的开源自部署定位，并加入 Archive、Lists、星标和网页元数据抓取。

## Features

- 首页展示未归档工具卡片，支持搜索、类型筛选、多标签 AND 筛选和星标筛选。
- Archive 页展示已归档卡片，可恢复、删除或切换星标。
- Lists 支持手动列表和智能列表。智能列表保存搜索词、类型、标签、归档状态和星标状态。
- 管理页无需登录，支持新增、编辑、归档、恢复、删除和全局排序值。
- 标签页支持标签计数、全局重命名和删除。
- 统计页展示打开次数、近 7/30 日、高频卡片、类型分布和标签分布。
- 新增/编辑卡片时可选择本地图片嵌入卡片，也可尝试用 Microlink 自动抓取标题、简介、预览图和来源域名。

## Local Setup

```bash
npm install
cp .env.example .env
mysql -u root -p -e "CREATE DATABASE ai_tools_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p ai_tools_hub < database/schema.sql
mysql -u root -p ai_tools_hub < database/seed.sql
npm run dev
```

Then open http://127.0.0.1:7317.

## Environment

```bash
DATABASE_URL=mysql://user:password@127.0.0.1:3306/ai_tools_hub
MICROLINK_API_KEY=
```

`MICROLINK_API_KEY` is optional. Screenshot capture is best-effort and never blocks card creation.

## Upgrade From v2.0

If you initialized the database before v2.1, run:

```bash
mysql -u root -p ai_tools_hub < database/migrations/002_karakeep_inspired.sql
mysql -u root -p ai_tools_hub < database/migrations/003_split_card_types.sql
mysql -u root -p ai_tools_hub < database/migrations/004_expand_preview_url.sql
```

Fresh installs only need `database/schema.sql` and `database/seed.sql`.

## Deployment Note

This project does not include login, registration, roles, or multi-user permissions. It is intended for personal local or intranet deployment. If you expose it publicly, add reverse-proxy authentication or another access control layer.
