<script>
import Variables from './Variables/index.vue';

export default {
  name: 'UITemplateSubResource',

  emits: ['remove', 'update:overrides', 'update:resourceVariables', 'validation-passed'],

  components: { Variables },

  props: {
    hideOptional: {
      type:    Boolean,
      default: false
    },

    hidePopulated: {
      type:    Boolean,
      default: false
    },

    resourceName: {
      type:    String,
      default: ''
    },

    overrides: {
      type:    Array,
      default: () => []
    },

    resourceVariables: {
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
    // potentialOverrides() {
    //   return [];
    // },
    // resourceScopedVaribleDefinitions() {
    //   const resourceDef = (this.uitemplate?.spec?.resources || []).find((r) => r.name === this.resourceScope);

    //   return resourceDef.variables || [];
    // },
  }
};
</script>

<template>
  <div>
    <Variables
      :resource-scope="resourceName"
      :value="resourceVariables"
      :uitemplate="selectedTemplate"
      :global-variables="globalVariables"
      :hide-optional="hideOptional"
      @update:value="e=>$emit('update:resourceVariables', e)"
      @validation-passed="e=>$emit('validation-passed', e)"
    />
    <Variables
      :resource-scope="resourceName"
      :resource-override="resourceName"
      :value="overrides"
      :uitemplate="selectedTemplate"
      :hide-optional="hideOptional"
      :global-variables="globalVariables"
      @update:value="e=>$emit('update:overrides', e)"
    />
  </div>
</template>
