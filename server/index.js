const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit'); // 引入速率限制模块
const comicCache = require('./comicCache'); // 引入 comicCache 模块
const logger = require('./logger'); // 引入日志模块
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));
app.use(express.json());

// 配置速率限制
const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 100 requests per windowMs
  message: '来自此IP的请求过多，请在15分钟后重试'
});

// 将速率限制应用于所有 /api/ 请求
app.use('/api/', apiLimiter);

// 初始化漫画缓存
comicCache.initComicCache();

// API 接口：获取漫画总数
app.get('/api/comic-count', (req, res) => {
    const comics = comicCache.getAllComicsFromCache();
    logger.info('API: comic-count requested');
    res.json({ count: comics.length });
});

// API 接口：获取漫画列表（带分页）
app.get('/api/comics', async (req, res) => {
    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);

    if (isNaN(page) || page <= 0) {
        page = 1; // Default to first page
    }
    if (isNaN(limit) || limit <= 0) {
        limit = 10; // Default limit
    }

    logger.info(`API: comics requested with page=${page}, limit=${limit}`);

    try {
        const { comics, totalComics } = await comicCache.getComics(page, limit);
        res.json({ comics, totalComics });
    } catch (error) {
        logger.error(`Error fetching comics: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: 'Internal server error' });
    }
});

// API 接口：获取单个漫画的详情
app.get('/api/comic/:comicTitle', async (req, res) => {
    const comicTitle = decodeURIComponent(req.params.comicTitle);
    logger.info(`API: comic detail requested for ${comicTitle}`);
    const comic = comicCache.getComicFromCacheByTitle(comicTitle);

    if (!comic) {
        logger.warn(`Comic not found: ${comicTitle}`);
        return res.status(404).send('Comic not found');
    }

    try {
        const files = await fs.readdir(comic.path);
        const imageFiles = files.filter(file => /\.(jpg|png)$/i.test(file)).sort();
        const images = imageFiles.map(file => `/comics/${encodeURIComponent(comicTitle)}/${encodeURIComponent(file)}`);

        res.json({
            title: comic.title,
            images: images,
            metadata: comic.metadata
        });
    } catch (error) {
        logger.error(`Error fetching comic details for ${comicTitle}: ${error.message}`, { stack: error.stack });
        res.status(500).send('Error fetching comic details');
    }
});

// API 接口：更新漫画标签
app.put('/api/comic/:comicTitle/tags', async (req, res) => {
    const comicTitle = decodeURIComponent(req.params.comicTitle);
    const { tags } = req.body;
    logger.info(`API: update comic tags for ${comicTitle} with tags: ${tags}`);

    if (!Array.isArray(tags)) {
        logger.warn(`Invalid tags format for ${comicTitle}. Tags must be an array.`);
        return res.status(400).json({ message: 'Tags must be an array.' });
    }

    try {
        const updated = await comicCache.updateComicTags(comicTitle, tags);
        if (updated) {
            res.json({ message: 'Comic tags updated successfully.', tags });
        } else {
            logger.warn(`Comic not found or tags not updated for ${comicTitle}`);
            res.status(404).json({ message: 'Comic not found or tags not updated.' });
        }
    } catch (error) {
        logger.error(`Error updating comic tags for ${comicTitle}: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: 'Internal server error' });
    }
});

// API 接口：获取所有唯一标签
app.get('/api/tags', (req, res) => {
    logger.info('API: all unique tags requested');
    const uniqueTags = comicCache.getAllUniqueTagsFromCache();
    res.json({ tags: uniqueTags });
});

// 静态文件服务：漫画图片
app.use('/comics', express.static(process.env.COMIC_BASE_PATH || path.join(__dirname, '..', 'Comics')));

// 启动服务器
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
    logger.error(`Unhandled error: ${err.message}`, { stack: err.stack, statusCode: err.statusCode });
    res.status(err.statusCode || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'production' ? {} : err.stack // 在生产环境中不发送堆栈信息
    });
});