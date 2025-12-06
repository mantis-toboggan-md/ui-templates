<script>
export default {
  name: 'AwsVpcTemplateFormatter',

  emits: ['update:value', 'validation-passed'],

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
  <div>
    <LabeledSelect
      :loading="$fetchState.pending"
      label="Kubernetes Version"
      :options="k3sVersionOptions || []"
      :value="value"
      @update:value="e=>$emit('update:value', e)"
    />
  </div>
</template>
