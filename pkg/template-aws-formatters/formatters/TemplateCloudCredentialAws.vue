<!-- eslint-disable @typescript-eslint/no-empty-function -->
<script>
import SelectCredential from '@shell/edit/provisioning.cattle.io.cluster/SelectCredential.vue';

export default {
  name: 'AWSCredentialTemplateFormatter',

  emits: ['update:value', 'validation-passed'],

  components: { SelectCredential },

  props: {
    value: {
      type:    [Object, Array, Number, String, Boolean],
      default: null
    },

    variableDefinition: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    uitemplate: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    globalVariableConfiguration: {
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
  }
};
</script>

<template>
  <SelectCredential
    :value="value"
    mode="create"
    provider="aws"
    :default-on-cancel="true"
    :showing-form="true"
    :cancel="cancelCredential"
    @update:value="e=>$emit('update:value', e)"
  />
</template>
