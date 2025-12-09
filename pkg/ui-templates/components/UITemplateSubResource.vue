<!-- eslint-disable @typescript-eslint/no-empty-function -->
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
    },

    resourceConfiguration: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    registerBeforeHook: {
      type:    Function,
      default: () => {}
    },

    registerAfterHook: {
      type:    Function,
      default: () => {}
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
      :register-before-hook="registerBeforeHook"
      :register-after-hook="registerAfterHook"
      :resource-scope="resourceName"
      :value="resourceVariables"
      :uitemplate="selectedTemplate"
      :global-variables="globalVariables"
      :hide-optional="hideOptional"
      :resource-configuration="resourceConfiguration"
      @update:value="e=>$emit('update:resourceVariables', e)"
      @validation-passed="e=>$emit('validation-passed', e)"
    />
    <Variables
      :register-before-hook="registerBeforeHook"
      :register-after-hook="registerAfterHook"
      :resource-scope="resourceName"
      :resource-override="resourceName"
      :value="overrides"
      :uitemplate="selectedTemplate"
      :resource-configuration="resourceConfiguration"
      :hide-optional="hideOptional"
      :global-variables="globalVariables"
      @update:value="e=>$emit('update:overrides', e)"
    />
  </div>
</template>
