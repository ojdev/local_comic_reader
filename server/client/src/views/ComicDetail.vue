<template>
  <div class="comic-detail">

    <div class="content">
      <img v-if="comic.images && comic.images.length > 0" :src="comic.images[0]" alt="Comic Cover" class="comic-cover" />
      <div class="metadata-panel">
        <div class="comic-title-container">
          <div>
            <h1>{{ comic.title }}</h1>
            <p v-if="comicPagesCount > 0">共 {{ comicPagesCount }} 页</p>
          </div>
        </div>
        <p v-if="comic.metadata.author"><strong>作者:</strong> {{ comic.metadata.author }}</p>
        <p v-if="comic.metadata.description"><strong>简介:</strong> {{ comic.metadata.description }}</p>
        <div class="tags-section">
          <p><strong>标签:</strong></p>
          <div class="tags-display">
            <span v-for="(tag, index) in comic.metadata.tags" :key="index" class="tag">
              {{ tag }}
              <button @click="removeTag(tag)" class="remove-tag-button">x</button>
            </span>
            <button v-if="!showTagInput" @click="showTagInput = true" class="add-tag-plus-button">+</button>
          </div>
          <div v-if="showTagInput" class="tag-input-container">
            <input
              type="text"
              v-model="newTag"
              @keyup.enter="addTag"
              placeholder="添加新标签"
              class="tag-input"
            />
            <button @click="addTag" class="add-tag-button">✓</button>
            <button @click="showTagInput = false" class="cancel-tag-button">✗</button>
          </div>
          <div v-if="showTagInput && allAvailableTags.length > 0" class="available-tags-container">
            <span
              v-for="(tag, index) in filteredAvailableTags"
              :key="index"
              @click="addExistingTag(tag)"
              class="available-tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="actions">
      <button @click="goBack" class="back-to-shelf-button">返回书架</button>
      <button @click="startReading" class="read-button">开始阅读</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '../api';

const route = useRoute();
const router = useRouter();
const comic = ref({
  title: '',
  cover: '',
  metadata: {
    author: '',
    description: '',
    tags: [],
  },
  images: [], // Add images array to initial state
});
const newTag = ref(''); // New state to control visibility
const showTagInput = ref(false); // New state to control visibility
const comicPagesCount = ref(0); // New state to store comic pages count
const allAvailableTags = ref([]); // New state to store all unique tags from all comics;
const loading = ref(false);
const error = ref(null);
const comicTitle = ref(route.params.comicTitle);

const fetchComicDetail = async () => {
  loading.value = true;
  try {
    // Fetch specific comic details using the new API endpoint
    const response = await apiClient.get(`/comic/${encodeURIComponent(comicTitle.value)}`);
    const fetchedComic = response.data;
    comic.value = {
      ...fetchedComic,
      metadata: {
        ...fetchedComic.metadata,
        tags: fetchedComic.metadata?.tags || [], // Ensure tags is an array
      },
    };
  } catch (err) {
    error.value = 'Failed to load comic details.';
  } finally {
    loading.value = false;
  }
};

const addTag = async () => {
  if (newTag.value.trim() !== '' && !comic.value.metadata.tags.includes(newTag.value.trim())) {
    const updatedTags = [...comic.value.metadata.tags, newTag.value.trim()];
    await updateComicTags(updatedTags);
    newTag.value = '';
  }
};

const removeTag = async (tagToRemove) => {
  const updatedTags = comic.value.metadata.tags.filter(tag => tag !== tagToRemove);
  await updateComicTags(updatedTags);
};

const updateComicTags = async (tags) => {
  try {
    await apiClient.put(`/comic/${comic.value.title}/tags`, { tags });
    comic.value.metadata.tags = tags; // Update local state on success
  } catch (error) {
    // console.error('Error updating comic tags:', error);
    alert('Failed to update tags.');
  }
};

const goBack = () => {
  router.back();
};

const startReading = () => {
  router.push(`/read/${comic.value.title}`);
};

const filteredAvailableTags = computed(() => {
  if (!newTag.value) {
    return allAvailableTags.value.filter(tag => !comic.value.metadata.tags.includes(tag));
  }
  return allAvailableTags.value.filter(
    tag => tag.toLowerCase().includes(newTag.value.toLowerCase()) && !comic.value.metadata.tags.includes(tag)
  );
});

const addExistingTag = async (tag) => {
  if (!comic.value.metadata.tags.includes(tag)) {
    const updatedTags = [...comic.value.metadata.tags, tag];
    await updateComicTags(updatedTags);
    newTag.value = ''; // Clear input after adding
    showTagInput.value = false; // Hide input after adding
  }
};

onMounted(async () => {
  await fetchComicDetail();
  await fetchAllAvailableTags();
});

// 获取所有可用标签
const fetchAllAvailableTags = async () => {
            try {
                const response = await apiClient.get('/tags');
                allAvailableTags.value = response.data.tags;
                // console.log('Fetched all available tags:', allAvailableTags.value);
            } catch (error) {
                // console.error('Error fetching all available tags:', error);
            }
        };
</script>

<style scoped>
.comic-detail {
  padding: 20px;
  color: #fff;
  width: 100%; /* Changed from max-width: 800px; to width: 100% */
  margin: 0 auto;
}

.comic-title-container {
  /* background-color: #fff; */ /* Add a white background to the title container */
  padding: 5px 10px;
  border-radius: 5px;
  /* height: 100%; */ /* Removed as it's now in content flex item */
  display: flex;
  flex-direction: column;
  justify-content: center; /* Center content vertically */
  /* flex-grow: 1; */ /* Allow it to take available space */
}

.comic-title-container h1 {
  font-size: 1em; /* Adjusted font size to match author's font size */
  margin: 0;
}

.comic-title-container p {
  font-size: 1em; /* Increased font size for page count */
  color: #555;
}

.content {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  align-items: stretch; /* Align items to stretch to fill the container height */
}

.comic-cover {
  width: 100%; /* Changed from fixed width to 100% */
  height: auto; /* Changed from fixed height to auto */
  max-width: 300px; /* Added max-width to limit size on larger screens */
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.metadata-panel {
  flex-grow: 1;
  background-color: #333;
  padding: 15px;
  border-radius: 8px;
  min-width: 0; /* Allow metadata panel to shrink */
  overflow: hidden; /* Added to hide overflowing content */
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.metadata-panel p {
  margin-bottom: 10px;
  line-height: 1.5;
}

.tags-section {
  margin-top: 20px;
  padding: 15px;
  background-color: #333;
  border-radius: 8px;
  overflow: hidden; /* Added to prevent content overflow */
}

.tags-header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 5px;
  margin-bottom: 10px;
  overflow: hidden; /* Added to prevent content overflow */
}

.tag {
  background-color: #555;
  color: #fff;
  padding: 5px 10px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.7em; /* Adjusted font size for tags */
}

.remove-tag-button {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 0.7em; /* Adjusted font size */
  padding: 0 3px;
}

.tag-input-container {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.tag-input {
  flex-grow: 1;
  padding: 8px;
  border-radius: 5px;
  border: 1px solid #555;
  background-color: #444;
  color: #fff;
  font-size: 0.7em;
}

.add-tag-button {
  background-color: #28a745; /* Green for checkmark */
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  font-size: 0.7em;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-tag-button:hover {
  background-color: #218838;
}

.cancel-tag-button {
  background-color: #6c757d; /* Gray for 'x' */
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  font-size: 0.7em;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-tag-button:hover {
  background-color: #5a6268;
}

.add-tag-plus-button {
  background-color: transparent;
  color: #f8f8f8;
  border: none;
  border-radius: 0;
  width: 30px;
  height: 30px;
  font-size: 0.7em; /* Adjusted font size */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.add-tag-plus-button:hover {
  background-color: #28a745;
  color: white;
}

.actions {
  text-align: center;
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 20px; /* Add some space between buttons */
}

.read-button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 1.2em;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 150px; /* Set a fixed width */
  height: 50px; /* Set a fixed height */
}

.read-button:hover {
  background-color: #218838;
}

.back-to-shelf-button {
  background-color: #6c757d; /* A neutral color for the back button */
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 1.2em;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 150px; /* Set a fixed width */
  height: 50px; /* Set a fixed height */
}

.back-to-shelf-button:hover {
  background-color: #5a6268;
}

.available-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  max-height: 150px; /* Limit height and add scroll if many tags */
  overflow-y: auto;
  background-color: #333;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #555;
}

.available-tag {
  background-color: #555;
  color: #fff;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.7em; /* Adjusted font size */
}

.available-tag:hover {
  background-color: #007bff;
}

@media (max-width: 768px) {
  .comic-detail {
    padding: 10px;
    width: 100%;
    box-sizing: border-box;
    overflow-x: hidden; /* 隐藏横向滚动条 */
    overflow-y: auto; /* 允许垂直滚动 */
  }

  .content {
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }

  .comic-cover {
    width: 80%; /* 调整封面宽度为父容器的80% */
    height: auto; /* 高度自动，保持比例 */
    max-width: 300px; /* 最大宽度限制 */
  }

  .metadata-panel {
    padding: 10px;
    width: 100%;
    max-width: 100%; /* 确保不溢出 */
    box-sizing: border-box; /* 包含内边距在宽度计算内 */
  }

  .comic-title-container h1 {
    font-size: 1.2em;
  }

  .comic-title-container p {
    font-size: 0.9em;
  }

  .tags-section {
    margin-top: 10px;
  }

  .tag {
    font-size: 0.8em;
    padding: 4px 8px;
  }

  .remove-tag-button {
    font-size: 0.8em;
  }

  .tag-input-container {
    flex-direction: row; /* Changed to row to place input and buttons on the same line */
    gap: 8px;
  }

  .tag-input {
    flex-grow: 1; /* Allow input to grow and fill available space */
    font-size: 0.9em;
    padding: 10px;
    width: auto; /* Remove fixed width */
  }

  .add-tag-button,
  .cancel-tag-button {
    width: auto; /* Allow buttons to size based on content */
    font-size: 0.9em;
    padding: 10px;
  }

  .add-tag-plus-button {
    width: 25px;
    height: 25px;
    font-size: 0.8em;
  }

  .actions {
    flex-direction: row; /* Changed to row to place buttons on the same line */
    justify-content: center; /* Center the buttons horizontally */
    gap: 15px;
  }

  .read-button,
  .back-to-shelf-button {
    width: auto; /* Allow buttons to size based on content */
    flex-grow: 1; /* Allow buttons to grow and fill available space */
    max-width: 150px; /* Limit max width for better appearance on smaller screens */
    font-size: 1em;
    padding: 12px;
    height: auto;
  }

  .available-tags-container {
    max-height: 100px;
    padding: 8px;
  }

  .available-tag {
    font-size: 0.8em;
    padding: 4px 8px;
  }
}
</style>