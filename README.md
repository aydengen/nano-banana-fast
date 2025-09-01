# 时光照相馆
> 看看不同时光里的自己

<div style="text-align: center;">
  <img src="https://raw.githubusercontent.com/aydengen/nano-banana-fast/refs/heads/main/public/%E6%97%B6%E5%85%89%E4%B8%93%E8%BE%91.jpg" alt="Preview" />
</div>

“时光照相馆”是一款基于 Next.js 的开源小应用：上传一张照片，AI 为你生成 1950s/60s/70s/80s/90s/00s 六个年代风格的写真，从服饰、发型到色彩与胶片颗粒感，尽量还原每个时代的独特气质。支持单张下载与相册页一键打包下载。

## 功能特性
- 上传照片，一键生成六个年代风格的照片
- 桌面端「宝丽来卡片散落布局」可拖拽，移动端滚动列表
- 相册页生成与下载（聚合 6 张照到一张画布）
- 过渡动效与手写字体风格化呈现
- 可替换为自定义模型与网关，目前使用 OpenRouter 的免费模型

## 技术栈
- Next.js 15、React 19、TypeScript
- Tailwind CSS 4、Framer Motion 12

## 快速开始
### 环境要求
- Node.js 18+（推荐 20+）
- pnpm（推荐）

### 克隆与安装
```bash
git clone <your-repo-url> retro-time-machine
cd retro-time-machine
pnpm i
```

### 配置环境变量
在项目根目录创建 `.env.local`（或 `.env.example` 复制）：
```bash
# 必填：OpenRouter 的 API Key
API_KEY=your_openrouter_api_key

# 可选
API_URL=https://openrouter.ai/api/v1
MODEL=google/gemini-2.5-flash-image-preview:free
```

### 本地开发
```bash
pnpm dev
```
启动后访问浏览器 `http://localhost:3000`。

### 生产构建与启动
```bash
pnpm build
pnpm start
```

## 使用说明
1. 首页上传照片（支持 `image/png`, `image/jpeg`, `image/webp`）。
2. 点击「生成」开始生成，支持并发限制（当前为 2）。
3. 可单独下载该年代图片。
4. 生成完成后可一键下载相册页（整页合成 JPG）。

提示：
- 生成提示词（prompt）在 `src/app/page.tsx` 中固定于调用处，用于保证风格一致性。
- 相册页抬头文案位于 `src/app/lib/albumUtils.ts` 第 40 行，可替换为你的品牌名。

## 部署
- 推荐使用 Vercel 部署， 其他支持 Node 的平台未做测试。
- 请在部署平台配置环境变量（至少包含 `API_KEY`）。
- 生产模式使用 `pnpm build && pnpm start`。

## 注意与安全
- 第三方网关与模型可能存在配额与速率限制，请合理配置 Key 与限流策略。
- 用户上传图片仅在浏览器与网关之间参与生成，不做服务器持久化（除非你自行扩展）。
- 请遵守平台与模型的内容合规与使用条款。

## License
MIT

## 致谢
感谢原作者 [@ammaar](https://x.com/ammaar)，本项目基于 [Past Forward](https://ai.studio/apps/bundled/past_forward) 修改为 Next.js 和适配 OpenRouter API 版本。
