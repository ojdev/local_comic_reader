<template>
  <div class="comic-shelf">
    <div class="header">
      <h1>漫画书架</h1>
      <button @click="refreshComics" class="refresh-button">刷新缓存</button>
    </div>
    <div v-if="pulling" class="pull-to-refresh-indicator" :style="{ height: pullDistance + 'px' }">
      <span v-if="pullDistance < refreshThreshold">下拉刷新...</span>
      <span v-else>释放刷新</span>
    </div>
    <div class="tag-filter-container">
      <span
        v-for="tag in allAvailableTags"
        :key="tag"
        :class="['filter-tag', { 'selected': selectedTags.includes(tag) }]"
        @click="toggleTag(tag)"
      >
        {{ tag }}
      </span>
    </div>
    <div v-if="showRefreshPrompt" class="refresh-prompt">
      检测到新的漫画目录，请点击刷新缓存按钮。
    </div>
    <div class="comic-grid">
      <div v-for="comic in filteredComics" :key="comic.title" class="comic-card" @click="viewComicDetail(comic.title)">
        <img v-lazy="comic.cover" :alt="comic.title" class="comic-cover" />
        <h3 class="comic-title">{{ formatComicTitle(comic.title) }}</h3>
      </div>
    </div>
    <button v-if="showBackToTopButton" @click="scrollToTop" class="back-to-top-button">
      ↑
    </button>
  </div>
</template>

<script setup>
import { defineComponent, ref, onMounted, computed, nextTick } from 'vue';
import apiClient from '../api'; // 引入封装的 apiClient
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import axios from 'axios';
import '../assets/common.css';

const comics = ref([]);
const router = useRouter();
const showRefreshPrompt = ref(false);
const currentComicCount = ref(0);
const showBackToTopButton = ref(false);
const allAvailableTags = ref([]); // New state to store all unique tags from all comics
const selectedTags = ref([]); // New state to store selected tags for filtering

const page = ref(1);
const pageSize = 20; // 每页显示20个漫画
const hasMoreComics = ref(true);
const isLoading = ref(false);

// Pull-to-refresh states
const startY = ref(0);
const pulling = ref(false);
const pullDistance = ref(0);
const refreshThreshold = 80; // 下拉刷新阈值

const fetchComics = async (loadMore = false) => {
  if (isLoading.value || (!hasMoreComics.value && loadMore)) return;
  isLoading.value = true;
  try {
    const response = await apiClient.get(`/comics?page=${page.value}&limit=${pageSize}`);
    const fetchedComics = response.data.comics; // 从 response.data 中获取 comics 数组
    const totalComics = response.data.totalComics; // 获取总漫画数量

    if (loadMore) {
      comics.value = [...comics.value, ...fetchedComics];
    } else {
      comics.value = fetchedComics;
    }

    hasMoreComics.value = comics.value.length < totalComics; // 根据已加载漫画数量和总数判断是否还有更多

    // Extract all unique tags from all comics
    const tagsSet = new Set();
    comics.value.forEach(c => {
      if (c.metadata && c.metadata.tags) {
        c.metadata.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    allAvailableTags.value = Array.from(tagsSet).sort();

    // After fetching comics, update the count and store it
    // currentComicCount.value = comics.value.length;
    // localStorage.setItem('lastComicCount', currentComicCount.value);
  } catch (error) {
    console.error('Error fetching comics:', error);
  } finally {
    isLoading.value = false;
  }
};

const loadMoreComics = () => {
  if (hasMoreComics.value && !isLoading.value) {
    page.value++;
    fetchComics(true);
  }
};

const checkNewComics = async () => {
  try {
    const response = await apiClient.get('/comic-count');
    console.log('API Response for comic-count:', response.data);
    const serverComicCount = response.data.count;
    const lastComicCount = parseInt(localStorage.getItem('lastComicCount') || '0');

    console.log('Debug: serverComicCount =', serverComicCount);
    console.log('Debug: lastComicCount =', lastComicCount);
    console.log('Debug: serverComicCount > lastComicCount =', serverComicCount > lastComicCount);

    if (serverComicCount > lastComicCount) {
      showRefreshPrompt.value = true;
    } else {
      showRefreshPrompt.value = false;
    }
    // Always update localStorage with the current server comic count after the check
    // This ensures that for the next check, lastComicCount reflects the latest known server count.
    localStorage.setItem('lastComicCount', serverComicCount);

  } catch (error) {
    console.error('Error checking new comics:', error);
  }
};

const handleScroll = () => {
  showBackToTopButton.value = window.scrollY > 200; // 当滚动超过200px时显示按钮

  // Infinite scroll logic
  const bottomOfWindow = document.documentElement.scrollTop + window.innerHeight >= document.documentElement.offsetHeight - 100; // 距离底部100px时加载
  if (bottomOfWindow && hasMoreComics.value && !isLoading.value) {
    loadMoreComics();
  }
};

const handleTouchStart = (e) => {
  startY.value = e.touches[0].clientY;
  pulling.value = true;
};

const handleTouchMove = (e) => {
  if (!pulling.value) return;

  const currentY = e.touches[0].clientY;
  const distance = currentY - startY.value;

  if (distance > 0 && window.scrollY === 0) { // Only pull down when at the top of the page
    e.preventDefault(); // Prevent scrolling
    pullDistance.value = distance;
  } else {
    pulling.value = false; // Reset if not pulling down from the top
    pullDistance.value = 0;
  }
};

const handleTouchEnd = async () => {
  if (pulling.value && pullDistance.value > refreshThreshold) {
    await refreshComics();
  }
  pulling.value = false;
  pullDistance.value = 0;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

onMounted(async () => {
  const savedPage = sessionStorage.getItem('comicShelfPage');
  let targetPage = 1;

  if (savedPage) {
    targetPage = parseInt(savedPage);
    sessionStorage.removeItem('comicShelfPage');
  }

  // 确保在恢复滚动位置前加载所有必要的漫画数据
  comics.value = []; // 清空现有漫画列表
  page.value = 1; // 从第一页开始加载

  await fetchComics(); // 加载第一页

  if (targetPage > 1) {
    for (let i = 2; i <= targetPage; i++) {
      await new Promise(resolve => setTimeout(resolve, 200)); // 引入延迟以避免“Too Many Requests”
      page.value = i; // 更新页码
      await fetchComics(true); // 加载后续页面数据并追加
    }
  }

  checkNewComics();
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('touchstart', handleTouchStart);
  window.addEventListener('touchmove', handleTouchMove, { passive: false });
  window.addEventListener('touchend', handleTouchEnd);
  // 恢复滚动位置
  nextTick(() => {
    const savedScrollPos = sessionStorage.getItem('comicShelfScrollPos');
    if (savedScrollPos) {
      const parsedScrollPos = parseInt(savedScrollPos);
      // 尝试使用多种方式设置滚动位置，以提高兼容性
      document.documentElement.scrollTop = parsedScrollPos;
      document.body.scrollTop = parsedScrollPos;
      window.scrollTo({
        top: parsedScrollPos,
        behavior: 'auto'
      });
      sessionStorage.removeItem('comicShelfScrollPos'); // 清除保存的位置
    }
  });
});

onBeforeRouteLeave((to, from, next) => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('touchstart', handleTouchStart);
  window.removeEventListener('touchmove', handleTouchMove);
  window.removeEventListener('touchend', handleTouchEnd);
  // 保存滚动位置和当前页码
  const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
  sessionStorage.setItem('comicShelfScrollPos', scrollY.toString());
  sessionStorage.setItem('comicShelfPage', page.value.toString());
  next();
});

const refreshComics = async () => {
  try {
    await apiClient.post('/refresh-cache');
    page.value = 1; // Reset page to 1
    comics.value = []; // Clear existing comics
    await fetchComics();
    await checkNewComics(); // Add this line to update localStorage after refresh
    showRefreshPrompt.value = false; // 点击刷新后隐藏提示
    alert('漫画缓存已刷新！');
  } catch (error) {
    console.error('Error refreshing comic cache:', error);
    alert('刷新漫画缓存失败！');
  }
};

const formatComicTitle = (title) => {
  // 移除开头的数字串和减号，例如 "833991-[Teru] Chin Nii-chan" 变为 "[Teru] Chin Nii-chan"
  if (typeof title !== 'string') {
    return ''; // 或者根据需要返回其他默认值
  }
  return title.replace(/^\d+\s*-\s*/, '');
};

const toggleTag = (tag) => {
  const index = selectedTags.value.indexOf(tag);
  if (index > -1) {
    selectedTags.value.splice(index, 1);
  } else {
    selectedTags.value.push(tag);
  }
};

const filteredComics = computed(() => {
  if (selectedTags.value.length === 0) {
    return comics.value;
  }
  return comics.value.filter(comic => {
    return selectedTags.value.every(selectedTag => {
      return comic.metadata.tags && comic.metadata.tags.includes(selectedTag);
    });
  });
});

const viewComicDetail = (comicTitle) => {
  router.push({ name: 'ComicDetail', params: { comicTitle } });
};
</script>

<style scoped>
.comic-shelf {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.refresh-button {
  background-color: #4CAF50; /* Green */
  border: none;
  color: white;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 8px;
}

.comic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
}

.comic-card {
  border: 1px solid #ccc;
  padding: 10px;
  text-align: center;
  cursor: pointer; /* Add cursor pointer to indicate it's clickable */
}

.comic-cover {
  max-width: 100%;
  height: auto;
}

.comic-title {
  font-size: 1.2em;
  margin-top: 10px;
}

.refresh-prompt {
  background-color: #ffeb3b;
  color: #333;
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 8px;
  text-align: center;
  font-weight: bold;
}

.back-to-top-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  font-size: 1.2em;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.back-to-top-button:hover {
  background-color: #0056b3;
}

.back-to-top-button .icon {
  width: 48px;
  height: 48px;
}

@media (max-width: 768px) {
  .back-to-top-button {
    width: 48px;
    height: 48px;
  }
}
</style>

<script>
    const deleteComic = async (id) => {
      try {
        await apiClient.delete(`/comics/${id}`);
        fetchComics(); // 重新加载漫画列表
      } catch (error) {
        console.error('Error deleting comic:', error);
        // 错误已经在 apiClient 的响应拦截器中处理
      }
    };
</script>