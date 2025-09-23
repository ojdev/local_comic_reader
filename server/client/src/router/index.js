import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'ComicShelf',
    component: () => import('../views/ComicShelf.vue'),
  },
  {
    path: '/read/:comicTitle',
    name: 'ComicReader',
    component: () => import('../views/ComicReader.vue'),
    props: true,
  },
  {
    path: '/detail/:comicTitle',
    name: 'ComicDetail',
    component: () => import('../views/ComicDetail.vue'),
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;