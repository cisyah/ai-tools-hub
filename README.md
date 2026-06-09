<div align="center">

# AI Tools Hub

**自部署的 AI 工具聚合站 — 收藏、分类、检索你的 AI 工具和学习资源**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?logo=mysql)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

---

## Features

- 🔖 **卡片管理** — 新增、编辑、归档、删除、批量排序，支持星标和备注
- 🏷️ **标签系统** — 多标签 AND 筛选，标签重命名、删除，自动清理未使用标签
- 📂 **列表分组** — 手动列表和智能列表（按搜索词/类型/标签/状态自动归集）
- 🔍 **元数据自动抓取** — 粘贴 URL 自动提取标题、简介、封面图和来源域名
- 🎬 **视频平台适配** — YouTube（oEmbed API）、B站（公共 API）自动提取，小红书手动引导
- 📋 **智能粘贴** — 自动从分享文本中提取 URL，自动清理小红书标题中的 #标签 和噪音文字
- 🌐 **Chrome 浏览器插件** — 一键保存当前网页到 Hub，支持平台识别和元数据抓取
- 📊 **数据统计** — 打开次数、近 7/30 日趋势、高频卡片、类型分布和标签分布
- 🗃️ **归档系统** — 归档卡片独立查看，可恢复或永久删除
- 🌏 **中英双语** — 完整的 i18n 支持，界面可切换中文和英文
- 🎨 **主题系统** — 内置多套主题，支持自定义 CSS 变量

## Screenshots

> 📸 TODO: 添加截图

## Quick Start

```bash
# 1. 克隆仓库
git clone https://github.com/Xuyahang1201/ai-tools-hub.git
cd ai-tools-hub

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的 MySQL 连接信息（见下方 Database Setup）

# 4. 导入数据库
mysql -u <user> -p <database_name> < database/schema.sql
mysql -u <user> -p <database_name> < database/seed.sql  # 可选：导入示例数据

# 5. 启动开发服务器
npm run dev
```

打开 http://localhost:7317 即可使用。

生产构建：

```bash
npm run build
npm run start
```

---

## Database Setup

### 🐳 方式一：Docker MySQL（推荐本地开发）

最简单的方式，不需要手动安装 MySQL。

```bash
# 启动 MySQL 容器
docker run -d \
  --name ai-tools-hub-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=ai_tools_hub \
  -e MYSQL_USER=aitools \
  -e MYSQL_PASSWORD=aitools123 \
  -p 3306:3306 \
  mysql:8.0 \
  --character-set-server=utf8mb4 \
  --collation-server=utf8mb4_unicode_ci

# 等待容器启动（约 10 秒）
sleep 10

# 导入表结构
docker exec -i ai-tools-hub-mysql mysql -u aitools -paitools123 ai_tools_hub < database/schema.sql

# 导入示例数据（可选）
docker exec -i ai-tools-hub-mysql mysql -u aitools -paitools123 ai_tools_hub < database/seed.sql
```

`.env` 配置：

```env
DATABASE_URL=mysql://aitools:aitools123@127.0.0.1:3306/ai_tools_hub
```

停止/重启容器：

```bash
docker stop ai-tools-hub-mysql    # 停止
docker start ai-tools-hub-mysql   # 重启
docker rm -f ai-tools-hub-mysql   # 删除
```

---

### ☁️ 方式二：火山引擎服务器 MySQL

适用于将 AI Tools Hub 部署到云服务器。

**1. 在服务器上安装 MySQL**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql

# CentOS/RHEL
sudo yum install mysql-server -y
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

**2. 创建数据库和用户**

```bash
sudo mysql -u root
```

```sql
-- 创建数据库
CREATE DATABASE ai_tools_hub
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 创建用户（将 <your_password> 替换为你的密码）
CREATE USER 'aitools'@'%'
  IDENTIFIED BY '<your_password>';

-- 授权
GRANT ALL PRIVILEGES ON ai_tools_hub.* TO 'aitools'@'%';
FLUSH PRIVILEGES;
EXIT;
```

**3. 导入数据**

```bash
mysql -u aitools -p ai_tools_hub < database/schema.sql
mysql -u aitools -p ai_tools_hub < database/seed.sql  # 可选
```

**4. 配置远程访问**

编辑 MySQL 配置文件：

```bash
# Ubuntu: /etc/mysql/mysql.conf.d/mysqld.cnf
# CentOS: /etc/my.cnf
# 找到 bind-address 改为：
bind-address = 0.0.0.0
```

重启 MySQL：

```bash
sudo systemctl restart mysql
```

**5. 开放端口**

```bash
# 火山引擎控制台 → 安全组 → 入站规则 → 添加 3306 端口
# 服务器防火墙
sudo ufw allow 3306/tcp
```

**6. `.env` 配置**

```env
DATABASE_URL=mysql://aitools:<your_password>@<服务器公网IP>:3306/ai_tools_hub
```

---

### 🛡️ 方式三：宝塔面板 MySQL

适用于已安装宝塔面板的服务器。

**1. 安装 MySQL**

宝塔面板 → 软件商店 → 搜索 MySQL → 安装（推荐 5.7 或 8.0）

**2. 创建数据库**

宝塔面板 → 数据库 → 添加数据库：

| 字段 | 填写 |
|------|------|
| 数据库名 | `ai_tools_hub` |
| 用户名 | `aitools` |
| 密码 | `<your_password>` |
| 访问权限 | 本地服务器 或 所有人（如需远程连接） |

**3. 导入数据**

通过宝塔的 phpMyAdmin 导入：

1. 点击数据库名 → 导入
2. 选择 `database/schema.sql` → 执行
3. 再导入 `database/seed.sql`（可选）

或者命令行：

```bash
mysql -u aitools -p ai_tools_hub < /path/to/database/schema.sql
mysql -u aitools -p ai_tools_hub < /path/to/database/seed.sql
```

**4. `.env` 配置**

```env
# 本地部署
DATABASE_URL=mysql://aitools:<your_password>@127.0.0.1:3306/ai_tools_hub

# 远程部署（填服务器公网IP）
DATABASE_URL=mysql://aitools:<your_password>@<服务器公网IP>:3306/ai_tools_hub
```

**5. 开放端口（远程连接时需要）**

宝塔面板 → 安全 → 放行端口 `3306`
同时在云服务商控制台的安全组中放行 3306。

---

## Database Schema

导入 `schema.sql` 后会创建以下表：

| 表名 | 说明 |
|------|------|
| `cards` | 工具卡片（名称、描述、URL、类型、标签、预览图等） |
| `card_types` | 自定义卡片类型（默认 6 种，可扩展） |
| `tag_registry` | 标签注册表（用于标签管理页） |
| `lists` | 列表（手动列表和智能列表） |
| `card_lists` | 卡片与列表的关联关系 |
| `card_open_events` | 卡片打开事件（用于统计） |

### cards 表字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) | UUID 主键 |
| `name` | VARCHAR(160) | 卡片名称 |
| `description` | TEXT | 简介（最多 120 字） |
| `url` | TEXT | 链接地址 |
| `type` | VARCHAR(64) | 类型 ID（关联 card_types） |
| `icon` | VARCHAR(80) | 图标名称（Lucide 图标） |
| `preview_url` | MEDIUMTEXT | 预览图（URL 或 base64） |
| `preview_position` | VARCHAR(32) | 预览图裁剪位置 |
| `source_domain` | VARCHAR(255) | 来源域名 |
| `tags` | JSON | 标签数组，如 `["AI", "效率"]` |
| `notes` | TEXT | 备注 |
| `is_archived` | BOOLEAN | 是否归档 |
| `is_favorite` | BOOLEAN | 是否星标 |
| `sort_order` | INT | 排序值 |
| `created_at` | DATETIME(3) | 创建时间 |
| `updated_at` | DATETIME(3) | 更新时间 |

---

## Environment Variables

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | ✅ | MySQL 连接字符串，格式：`mysql://user:password@host:port/database` |
| `MICROLINK_API_KEY` | ❌ | Microlink API Key，用于增强元数据抓取（截图等）。不填则使用免费端点（有速率限制）。[获取地址](https://microlink.io) |
| `EXTENSION_API_TOKEN` | ❌ | 浏览器插件写入 Token。留空则仅本地开发可用。公开部署前请设置：`openssl rand -hex 32` |

---

## Browser Extension

AI Tools Hub 提供 Chrome 浏览器插件，支持一键保存当前网页。

### 安装

1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `extensions/chrome` 目录

### 配置

1. 点击插件图标 → 右上角「设置」
2. 填写服务器地址（如 `http://localhost:7317`）
3. 如果服务器设置了 `EXTENSION_API_TOKEN`，在此处填写

### 使用

在任意网页点击插件图标，自动提取页面标题、简介和预览图，编辑后保存到 Hub。

支持的平台增强提取：
- **YouTube** — 自动提取视频标题、封面和频道名
- **B站** — 自动提取视频标题、封面和 UP 主
- **小红书** — 识别链接并引导手动填写（反爬限制）

---

## Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **UI**: React 19 + [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [MySQL 8.0](https://www.mysql.com/) (mysql2 driver)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Metadata**: [Microlink API](https://microlink.io/) + 平台专属 API
- **Language**: TypeScript

## Project Structure

```
ai-tools-hub/
├── database/
│   ├── schema.sql          # 表结构 + 默认数据
│   ├── seed.sql            # 示例数据（可选导入）
│   └── migrations/         # 增量迁移脚本
├── extensions/
│   └── chrome/             # Chrome 浏览器插件
├── src/
│   ├── app/
│   │   ├── api/            # API 路由
│   │   │   ├── cards/      # 卡片 CRUD + 元数据抓取
│   │   │   ├── lists/      # 列表管理
│   │   │   ├── tags/       # 标签管理
│   │   │   └── stats/      # 统计数据
│   │   ├── archive/        # 归档页
│   │   ├── manage/         # 管理页
│   │   ├── settings/       # 设置页
│   │   ├── stats/          # 统计页
│   │   └── tags/           # 标签页
│   ├── components/         # React 组件
│   ├── lib/
│   │   ├── db.ts           # 数据库连接
│   │   ├── preview.ts      # 元数据抓取（Microlink + 平台提取）
│   │   ├── platform-extractors.ts  # YouTube/B站/小红书平台提取器
│   │   ├── title-cleaner.ts        # 标题清理工具
│   │   ├── url-extractor.ts        # URL 提取工具
│   │   └── types.ts        # TypeScript 类型定义
│   └── i18n/               # 国际化资源
├── .env.example            # 环境变量模板
├── package.json
└── README.md
```

## License

[MIT](LICENSE)
