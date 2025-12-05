<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  name: 'K3sVersionTemplateFormatter',

  emits: ['update:value'],

  components: { LabeledSelect },

  props: {
    value: {
      type:    String,
      default: null
    }
  },

  async fetch() {
    this.k3sVersions = await this.$store.dispatch('management/request', { url: '/v1-k3s-release/releases' });
  },

  data() {
    return { k3sVersions: {} };
  },

  watch: {
    k3sVersionOptions(neu = []) {
      if (!this.value) {
        this.$emit('update:value', neu[0]);
      }
    },
  },

  computed: {
    k3sVersionOptions() {
      return (this.k3sVersions?.data || []).map((d) => d.version).reverse();
    },

  },
};
</script>

<template>
  <div class="wider">
    <LabeledSelect
      :loading="$fetchState.pending"
      label="Kubernetes Version"
      :options="k3sVersionOptions || []"
      :value="value"
      @update:value="e=>$emit('update:value', e)"
    />
  </div>
</template>
