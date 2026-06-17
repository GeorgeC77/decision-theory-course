# 决策理论与方法 · 交互式学习平台

《决策理论与方法》课程在线交互式学习网页，包含第 2–6 章内容，统一风格后部署于 GitHub Pages。

## 在线访问

访问地址：https://georgec77.github.io/decision-theory-course/

## 项目结构

```
.
├── index/              # 目录首页源码
├── chapters/
│   ├── ch2/            # 第二章构建产物（确定型决策分析）
│   ├── ch3/            # 第三章源码（风险型决策分析）
│   ├── ch4/            # 第四章源码（不确定型决策分析）
│   ├── ch5/            # 第五章源码（多目标决策分析）
│   └── ch6/            # 第六章源码（序贯决策分析）
├── scripts/
│   └── build-all.sh    # 统一构建脚本
├── .github/workflows/
│   └── deploy.yml      # GitHub Actions 自动部署
└── dist/               # 构建输出（gitignored）
```

## 本地构建

确保已将 Node.js 安装到 `env_Lecture` 环境，或系统 PATH 中已有 `node` / `npm`：

```bash
bash scripts/build-all.sh
```

构建完成后，使用任意静态文件服务器预览 `dist/`：

```bash
cd dist
python -m http.server 8080
```

## 部署

推送到 GitHub 的 `main` 分支后，GitHub Actions 会自动运行 `scripts/build-all.sh` 并将 `dist/` 部署到 GitHub Pages。

## 内容验证状态

- 第 2 章：已人工验证，内容未改动。
- 第 3–6 章：已完成两轮知识性与交互逻辑检查，修正了贝叶斯公式、EVSI 口径、不确定型决策动态结论、DEA 术语表述、AHP 一致性建议、多阶段决策先验最优值、马尔可夫广告策略结论、转移矩阵校验、效用并合权重归一化、模糊评价分数方向、群体决策 Condorcet 表述、案例推荐统计等问题。
- 第五章 DEA 页面仅为思想简化演示，未实现严格 CCR/BCC 线性规划模型；所有简化演示页面均已添加免责声明。

## 设计风格

全站统一采用第二章的视觉风格：

- 主色：`#1B3A5F`（深蓝）
- 强调色：`#C8963E`（金色）
- 背景色：`#F8F6F2`（暖白）
- 边框色：`#E0DDD5`
