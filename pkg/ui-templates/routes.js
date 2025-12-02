import TemplateIndex from './pages/index.vue';

const routes = [
  {
    name:      'c-cluster-product-resource-template',
    path:      '/c/:cluster/:product/:resource/template',
    component: TemplateIndex,
  },
];

export default routes;
