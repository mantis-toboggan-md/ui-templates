<script>
import Variables from './Variables/index.vue';

export default {
  name: 'UITemplateSubResource',

  emits: ['remove', 'update:overrides'],

  components: { Variables },

  props: {
    resourceName: {
      type:    String,
      default: ''
    },

    overrides: {
      type:    Array,
      default: () => []
    },

    selectedTemplate: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    globalVariables: {
      type:    Array,
      default: () => []
    }
  },

  computed: {
    potentialOverrides() {
      return [];
    },
  }
};
</script>

<template>
  <div>
    <Variables
      :resource-scope="resourceName"
      :value="overrides"
      :uitemplate="selectedTemplate"
      :global-variables="globalVariables"
      @update:value="e=>$emit('update:overrides', e)"
    />
    <button @click="$emit('remove')">
      remove
    </button>
  </div>
</template>
