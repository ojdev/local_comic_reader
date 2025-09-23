<template>
  <div class="comic-reader" @mouseenter="showControls = true" @mouseleave="showControls = false">
    <div :class="['header-controls', { 'show': showControls }]">
      <h2 v-if="comicTitle">{{ formatComicTitle(comicTitle) }}</h2>
      <button @click="goBack">⬅</button>
    </div>
    <div class="comic-page-container" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
      <img :src="currentPage" alt="Comic Page" class="comic-page" />
    </div>
    <div :class="['navigation-controls', { 'show': showControls }]">
      <button @click="prevPage" :disabled="currentPageIndex === 0">上一页</button>
      <span>{{ currentPageIndex + 1 }} / {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPageIndex === totalPages - 1">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '../api'; // 引入封装的 apiClient

const route = useRoute();
const router = useRouter();
const comicTitle = ref(route.params.comicTitle);
const comicPages = ref([]);
const currentPageIndex = ref(0);
const currentPage = ref('');
const totalPages = ref(0);
const showControls = ref(false);
const loading = ref(false);
const error = ref(null);
// const currentImage = ref(''); // Remove this line

// Swipe functionality variables
const startX = ref(0);
const threshold = 50; // Minimum distance for a swipe to be registered

const fetchComicPages = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await apiClient.get(`/comic/${comicTitle.value}`);
    comicPages.value = response.data.images;
    totalPages.value = comicPages.value.length; // Update totalPages
    if (comicPages.value.length > 0) {
      currentPage.value = comicPages.value[0]; // Set initial currentPage
    }
  } catch (err) {
    error.value = 'Failed to load comic pages.';
    console.error('Error fetching comic pages:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchComicPages(comicTitle.value);
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

watch(currentPageIndex, (newIndex) => {
  if (comicPages.value.length > 0) {
    currentPage.value = comicPages.value[newIndex];
  }
});

const prevPage = () => {
  if (currentPageIndex.value > 0) {
    currentPageIndex.value--;
  }
};

const nextPage = () => {
  if (currentPageIndex.value < totalPages.value - 1) {
    currentPageIndex.value++;
  }
};

const goBack = () => {
  router.push('/');
};

const formatComicTitle = (title) => {
  // 移除开头的数字串和减号，例如 "833991-[Teru] Chin Nii-chan" 变为 "[Teru] Chin Nii-chan"
  if (typeof title !== 'string') {
    return ''; // 或者根据需要返回其他默认值
  }
  return title.replace(/^\d+\s*-\s*/, '');
};

// Swipe handlers
const handleTouchStart = (event) => {
  startX.value = event.touches[0].clientX;
};

const handleTouchMove = (event) => {
  event.preventDefault(); // Prevent scrolling while swiping
};

const handleTouchEnd = (event) => {
  const endX = event.changedTouches[0].clientX;
  const diff = startX.value - endX;

  if (diff > threshold) {
    // Swipe left, go to next page
    nextPage();
  } else if (diff < -threshold) {
    // Swipe right, go to previous page
    prevPage();
  }
};

// Keyboard handlers
const handleKeyDown = (event) => {
  if (event.key === 'ArrowLeft') {
    prevPage();
  } else if (event.key === 'ArrowRight') {
    nextPage();
  }
};
</script>

<style scoped>
.comic-reader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  padding: 0; /* 确保没有内边距 */
  text-align: center;
  background-color: #000;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 消除滚动条 */
}

.header-controls {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 10px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  z-index: 10;
}

.header-controls.show {
  opacity: 1;
}

.header-controls h2 {
  margin: 0;
  color: #fff;
}

.comic-page-container {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.comic-page {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border: none;
  display: block; /* 确保图片是块级元素，消除可能存在的额外空间 */
}

.navigation-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 10px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  z-index: 10;
}

.navigation-controls.show {
  opacity: 1;
}

.navigation-controls button {
  background-color: #333;
  color: #fff;
  border: none;
  padding: 8px 15px;
  cursor: pointer;
  margin: 0 10px;
  border-radius: 4px;
}

.navigation-controls button:disabled {
  background-color: #555;
  cursor: not-allowed;
}

.navigation-controls span {
  color: #fff;
  margin: 0 10px;
}

@media (max-width: 768px) {
  .header-controls {
    padding: 8px;
  }

  .header-controls h2 {
    font-size: 1.2em;
  }

  .header-controls button {
    padding: 6px 12px;
    font-size: 0.9em;
  }

  .navigation-controls {
    padding: 8px;
  }

  .navigation-controls button {
    padding: 6px 12px;
    font-size: 0.9em;
    margin: 0 5px;
  }

  .navigation-controls span {
    font-size: 0.9em;
    margin: 0 5px;
  }
}
</style>