const fs = require('fs-extra');
const path = require('path');
const config = require('./config');
const logger = require('./logger'); // 引入日志模块

const COMIC_BASE_PATH = path.resolve(config.COMIC_BASE_PATH);
let comicCache = []; // 存储所有漫画的缓存

/**
 * 辅助函数：获取漫画封面
 * @param {string} comicPath - 漫画的完整路径
 * @returns {Promise<string|null>} 封面图片的相对路径或 null
 */
async function getComicCover(comicPath) {
    try {
        const files = await fs.readdir(comicPath);
        const imageFiles = files.filter(file => /\.(jpg|png)$/i.test(file));

        // 优先使用 00000001.jpg 作为封面
        const firstPageAsCover = imageFiles.find(file => file.toLowerCase() === '00000001.jpg');
        if (firstPageAsCover) {
            return path.join(comicPath, firstPageAsCover);
        }

        if (imageFiles.length > 0) {
            return path.join(comicPath, imageFiles[0]);
        }
        return null;
    } catch (error) {
        console.error(`Error getting comic cover for ${comicPath}:`, error);
        return null;
    }
}

/**
 * 辅助函数：解析 readme 文件获取元数据
 * @param {string} comicPath - 漫画的完整路径
 * @returns {Promise<object>} 包含作者、标签、简介的元数据对象
 */
async function parseReadme(comicPath) {
    try {
        const files = await fs.readdir(comicPath);
        const readmeFile = files.find(file => /^readme/i.test(file) && /\.(txt|md)$/i.test(file));

        if (readmeFile) {
            const readmeContent = await fs.readFile(path.join(comicPath, readmeFile), 'utf8');
            const metadata = {};
            const authorMatch = readmeContent.match(/作者：(.+)/);
            if (authorMatch) metadata.author = authorMatch[1].trim();

            const tagsMatch = readmeContent.match(/标签：(.+)/);
            if (tagsMatch) metadata.tags = tagsMatch[1].split('#').filter(Boolean).map(tag => tag.trim());

            const descriptionMatch = readmeContent.match(/简介：([\s\S]+?)(?=\s*(?:标签：|作者：|$))/);
            if (descriptionMatch) metadata.description = descriptionMatch[1].trim();

            return metadata;
        }
        return {};
    } catch (error) {
        console.error(`Error parsing readme for ${comicPath}:`, error);
        return {};
    }
}

/**
 * 初始化漫画缓存
 * 扫描 COMIC_BASE_PATH 目录，构建所有漫画的元数据缓存
 */
async function initComicCache() {
    console.log('Initializing comic cache...');
    try {
        const allComicFolders = await fs.readdir(COMIC_BASE_PATH, { withFileTypes: true });
        const validComicFolders = allComicFolders.filter(folder => folder.isDirectory() && !folder.name.startsWith('.'));

        const comics = [];
        for (const folder of validComicFolders) {
            const comicPath = path.join(COMIC_BASE_PATH, folder.name);
            const coverFullPath = await getComicCover(comicPath);
            const metadata = await parseReadme(comicPath);

            comics.push({
                title: folder.name,
                path: comicPath,
                cover: coverFullPath ? '/comics/' + encodeURIComponent(folder.name) + '/' + encodeURIComponent(path.basename(coverFullPath)) : null,
                metadata,
            });
        }
        comicCache = comics;
        console.log(`Comic cache initialized with ${comicCache.length} comics.`);
    } catch (error) {
        console.error('Error initializing comic cache:', error);
    }
}

/**
 * 获取所有漫画的缓存数据
 * @returns {Array<object>} 漫画缓存数组
 */
function getAllComicsFromCache() {
    return comicCache;
}

/**
 * 根据漫画标题从缓存中获取单个漫画数据
 * @param {string} comicTitle - 漫画标题
 * @returns {object|undefined} 漫画数据或 undefined
 */
function getComicFromCacheByTitle(comicTitle) {
    return comicCache.find(comic => comic.title === comicTitle);
}

/**
 * 获取分页的漫画数据
 * @param {number} page - 当前页码
 * @param {number} limit - 每页数量
 * @returns {object} 包含分页漫画和总数的对象
 */
function getComics(page, limit) {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedComics = comicCache.slice(startIndex, endIndex);
    return { comics: paginatedComics, totalComics: comicCache.length };
}

/**
 * 更新漫画的标签
 * @param {string} comicTitle - 漫画标题
 * @param {Array<string>} newTags - 新的标签数组
 * @returns {Promise<boolean>} 是否更新成功
 */
async function updateComicTags(comicTitle, newTags) {
    logger.info(`Attempting to update tags for comic: ${comicTitle} with new tags: ${newTags.join(', ')}`);
    const comicIndex = comicCache.findIndex(comic => comic.title === comicTitle);
    if (comicIndex === -1) {
        logger.warn(`Comic not found in cache: ${comicTitle}`);
        return false;
    }

    const comic = comicCache[comicIndex];
    logger.debug(`Found comic in cache: ${comic.title}, path: ${comic.path}`);
    let readmePath = await findReadmeFile(comic.path);

    if (!readmePath) {
        logger.info(`No readme file found for comic: ${comicTitle}. Creating readme.md.`);
        readmePath = path.join(comic.path, 'readme.md');
        await fs.writeFile(readmePath, '', 'utf8'); // Create an empty readme.md file
    }

    try {
        logger.debug(`Readme file found (or created): ${readmePath}`);
        let readmeContent = await fs.readFile(readmePath, 'utf8');
        logger.debug(`Original readme content length: ${readmeContent.length}`);
        const tagsRegex = /标签：(.+)/;

        if (newTags.length > 0) {
            const newTagsLine = `标签：${newTags.join(' #')}`;
            if (readmeContent.match(tagsRegex)) {
                logger.debug(`Tags line found, replacing with: ${newTagsLine}`);
                readmeContent = readmeContent.replace(tagsRegex, newTagsLine);
            } else {
                logger.debug(`No tags line found, attempting to add new tags line: ${newTagsLine}`);
                const descriptionRegex = /(简介：[\s\S]+?)(?=\s*(?:作者：|$))/;
                if (readmeContent.match(descriptionRegex)) {
                    logger.debug('Description found, adding tags before description.');
                    readmeContent = readmeContent.replace(descriptionRegex, `$1\n${newTagsLine}`);
                } else {
                    logger.debug('No description found, adding tags at the end of the file.');
                    readmeContent += `\n${newTagsLine}`;
                }
            }
        } else {
            logger.debug('New tags array is empty, removing existing tags line.');
            readmeContent = readmeContent.replace(tagsRegex, '').trim();
        }

        await fs.writeFile(readmePath, readmeContent, 'utf8');
        logger.info(`Successfully updated readme file: ${readmePath}`);

        // Update cache after file write
        comic.metadata.tags = newTags;
        // Re-initialize cache to ensure all metadata is consistent
        await initComicCache();
        logger.info(`Comic cache re-initialized after updating tags for ${comicTitle}.`);
        return true;
    } catch (error) {
        logger.error(`Error updating tags for comic ${comicTitle}: ${error.message}`, error);
        return false;
    }
}

/**
 * 辅助函数：查找 readme 文件
 * @param {string} comicPath - 漫画的完整路径
 * @returns {Promise<string|null>} readme 文件的完整路径或 null
 */
async function findReadmeFile(comicPath) {
    logger.debug(`Searching for readme file in: ${comicPath}`);
    try {
        const files = await fs.readdir(comicPath);
        logger.debug(`Files found in ${comicPath}: ${files.join(', ')}`);
        const readmeFile = files.find(file => /^readme/i.test(file) && /\.(txt|md)$/i.test(file));
        if (readmeFile) {
            logger.debug(`Readme file found: ${readmeFile}`);
            return path.join(comicPath, readmeFile);
        } else {
            logger.warn(`No readme file matching pattern /^readme/i.test(file) && /\.(txt|md)$/i.test(file) found in ${comicPath}`);
            return null;
        }
    } catch (error) {
        logger.error(`Error finding readme file in ${comicPath}: ${error.message}`, error);
        return null;
    }
}

/**
 * 获取所有漫画的唯一标签
 * @returns {Array<string>} 所有唯一标签的数组
 */
function getAllUniqueTagsFromCache() {
    const allTags = new Set();
    comicCache.forEach(comic => {
        if (comic.metadata && Array.isArray(comic.metadata.tags)) {
            comic.metadata.tags.forEach(tag => allTags.add(tag));
        }
    });
    return Array.from(allTags);
}

module.exports = {
    initComicCache,
    getAllComicsFromCache,
    getComicFromCacheByTitle,
    getComics,
    getComicCover, // 导出辅助函数，因为 index.js 中可能还需要
    parseReadme,   // 导出辅助函数
    updateComicTags,
    getAllUniqueTagsFromCache, // 导出新函数
};