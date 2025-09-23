# 漫画管理系统

这是一个基于 Vue.js 和 Node.js 的漫画管理系统，旨在提供一个流畅的用户体验，方便用户浏览和管理漫画。

## 技术栈

### 前端
*   **Vue.js**: 渐进式 JavaScript 框架，用于构建用户界面。
*   **Vue Router**: Vue.js 官方路由管理器，用于实现单页面应用的导航。
*   **Axios**: 基于 Promise 的 HTTP 客户端，用于与后端 API 进行通信。
*   **Vue-Lazyload**: 图片懒加载插件，优化图片加载性能，提升用户体验。
*   **Vite**: 极速的前端构建工具，提供快速的开发服务器和优化的构建输出。
*   **CSS**: 用于页面样式设计。

### 后端
*   **Node.js**: 运行时环境，用于构建后端服务。
*   **Express.js**: 快速、开放、极简的 Node.js Web 框架，用于构建 RESTful API。
*   **express-rate-limit**: 速率限制中间件，用于保护 API 免受滥用。
*   **cors**: 跨域资源共享中间件，处理前后端跨域请求。
*   **fs-extra**: 增强的 Node.js 文件系统模块，提供更多文件操作方法。
*   **dotenv**: 从 .env 文件加载环境变量。
*   **comicCache.js**: 自定义漫画数据缓存模块，提高数据读取效率。
*   **logger.js**: 自定义日志模块，用于记录应用运行日志。

## 架构思路

本系统采用前后端分离的架构，前端负责用户界面的展示和交互，后端负责数据存储、业务逻辑处理和 API 接口提供。

*   **性能优化**: 通过图片懒加载 (Vue-Lazyload) 和后端数据缓存 (comicCache) 提升系统响应速度和用户体验。
*   **用户体验**: 实现滚动位置和页码的保存与恢复，确保用户在返回漫画书架时能回到上次浏览的位置。
*   **安全性**: 后端 API 引入速率限制，防止恶意请求和滥用。
*   **模块化**: 前后端代码均采用模块化设计，便于开发、维护和扩展。

## 架构设计

### 前端架构
*   **组件化**: 页面由多个 Vue 组件构成，如 `ComicShelf.vue` (漫画书架), `ComicDetail.vue` (漫画详情), `ComicReader.vue` (漫画阅读器) 等。
*   **路由管理**: 使用 Vue Router 进行页面导航，支持动态路由和路由守卫。
*   **状态管理**: 局部状态通过 Vue 的 `ref` 和 `computed` 管理，全局状态（如用户认证、主题等，如果存在）可以通过 Vuex 或 Pinia 管理（当前项目未明确体现全局状态管理，但可扩展）。
*   **API 调用**: 统一使用 `Axios` 封装的 `apiClient` 进行后端数据请求。

### 后端架构
*   **RESTful API**: 提供标准的 RESTful API 接口，供前端调用，包括获取漫画列表、漫画详情、更新标签等。
*   **数据缓存**: `comicCache.js` 模块负责从文件系统读取漫画信息并进行内存缓存，减少对文件系统的频繁访问。
*   **文件服务**: 后端负责提供静态漫画图片文件服务。
*   **中间件**: 使用 `express-rate-limit` 进行 API 速率限制，`cors` 处理跨域请求。
*   **日志记录**: `logger.js` 模块统一处理应用日志，便于问题追踪和调试。

## 功能列表 (已实现/优化)

*   **漫画书架**: 展示所有漫画列表，支持分页加载和无限滚动。
*   **漫画详情**: 查看单个漫画的详细信息。
*   **漫画阅读**: 在线阅读漫画。
*   **标签筛选**: 根据标签筛选漫画。
*   **封面图懒加载**: 优化首页封面图加载速度。
*   **滚动位置恢复**: 从详情页返回书架时，自动恢复到上次浏览的滚动位置和页码。
*   **API 速率限制**: 保护后端 API。
*   **新漫画提示**: 检测到新的漫画目录时给出提示。

## 安装与运行

### 前提条件
*   Node.js (推荐 LTS 版本)
*   npm (通常随 Node.js 一起安装)

### 后端设置
1.  进入 `server` 目录: `cd server`
2.  安装依赖: `npm install`
3.  创建 `.env` 文件并配置 `COMIC_BASE_PATH` (漫画存放的根目录) 和 `CORS_ORIGIN` (前端地址，默认为 `http://localhost:5173`)。
    示例 `.env`:
    ```
    COMIC_BASE_PATH=D:/Comics
    CORS_ORIGIN=http://localhost:5173
    ```
4.  启动后端服务: `node index.js`

### 前端设置
1.  回到项目根目录: `cd ..` (如果当前在 `server` 目录)
2.  安装依赖: `npm install`
3.  启动前端开发服务器: `npm run dev`
4.  访问 `http://localhost:5173/` 查看应用。

## Docker Hub 镜像部署

为了更方便地部署前后端服务，本项目已将 Docker 镜像发布到 Docker Hub。

### 前提条件
*   已安装 Docker。

### 部署步骤

1.  **拉取 Docker Hub 镜像**

    从 Docker Hub 拉取最新镜像：
    ```bash
    docker pull ojdev/local_comic_reader:latest
    ```

2.  **配置必要的环境变量**

    创建 `server/.env` 文件，并配置 `COMIC_BASE_PATH` (漫画存放的根目录)。
    示例 `server/.env`:
    ```
    COMIC_BASE_PATH=/app/Comics
    CORS_ORIGIN=http://localhost:5173
    ```
    **注意**: 在 Docker 环境中，`CORS_ORIGIN` 通常设置为前端服务的地址，例如 `http://localhost:5173` 或 `http://localhost:80` (如果前端通过 Nginx 代理)。

3.  **运行容器**

    使用以下命令运行 Docker 容器，并挂载你的漫画目录和环境变量文件：
    ```bash
    docker run -d \
      -p 3000:3000 \
      -v /path/to/your/comics:/app/Comics \
      --env-file ./server/.env \
      ojdev/local_comic_reader:latest
    ```
    **请务必修改 `/path/to/your/comics` 为你的实际漫画存储路径。**

4.  **验证部署是否成功**

    服务启动后，你可以在浏览器中访问 `http://localhost:3000` 来使用应用。
    你可以通过以下命令查看容器日志：
    ```bash
    docker logs <container_id_or_name>
    ```

### 常用 Docker 命令

*   **查看运行中的容器**:
    ```bash
    docker ps
    ```
*   **停止容器**:
    ```bash
    docker stop <container_id_or_name>
    ```
*   **删除容器**:
    ```bash
    docker rm <container_id_or_name>
    ```
*   **删除镜像**:
    ```bash
    docker rmi ojdev/local_comic_reader:latest
    ```

## Docker Compose 部署

为了更方便地部署前后端服务，本项目提供了 `docker-compose.yml` 文件，用于本地构建和运行服务。

### 前提条件

*   已安装 Docker 和 Docker Compose。

### 部署步骤

1.  **创建 `.env` 文件**

    在项目根目录下的 `server` 文件夹中创建 `.env` 文件，并配置 `COMIC_BASE_PATH` (漫画存放的根目录)。

    示例 `server/.env`:
    ```
    COMIC_BASE_PATH=/app/Comics
    CORS_ORIGIN=http://localhost:3000
    ```

    **注意**: 在 Docker Compose 环境中，`CORS_ORIGIN` 通常设置为前端服务的地址，例如 `http://localhost:3000` 或 `http://localhost:80` (如果前端通过 Nginx 代理)。

2.  **使用 `docker-compose.yml` 文件**

    本项目根目录下已提供 `docker-compose.yml` 文件，内容如下：

```yaml
version: '3.8'
services:
  local_comic_reader:
    image: ojdev/local_comic_reader:latest
    ports:
      - "3000:3000" # 服务端口
    volumes:
      - /path/to/your/comics:/app/Comics # 挂载你的漫画目录，请替换为实际路径
    env_file:
      - ./server/.env
```

    **请务必修改 `volumes` 挂载路径 `/path/to/your/comics` 为你的实际漫画存储路径。**

3.  **启动服务**

    在项目根目录下执行以下命令启动所有服务：

    ```bash
    docker-compose up -d
    ```

    *   `-d`: 后台运行容器。

4.  **访问应用**

    服务启动后，你可以在浏览器中访问 `http://localhost:3000` 来使用应用。

### 常用 Docker Compose 命令

*   **停止服务**:
    ```bash
    docker-compose stop
    ```
*   **停止并删除容器、网络、卷和镜像**:
    ```bash
    docker-compose down
    ```
*   **查看服务状态**:
    ```bash
    docker-compose ps
    ```
*   **查看服务日志**:
    ```bash
    docker-compose logs -f
    ```
