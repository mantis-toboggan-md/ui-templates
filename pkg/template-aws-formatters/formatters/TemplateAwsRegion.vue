<script>
import { exceptionToErrorsArray } from '@shell/utils/error';
import LabeledSelect from '@shell/components/form/LabeledSelect';

const CLOUD_CRED_VARIABLE_NAME = 'cloudCredential';

export default {
  name: 'AwsRegionTemplateFormatter',

  emits: ['update:value', 'validation-passed'],

  components: { LabeledSelect },

  props: {
    value: {
      type:    [Object, Array, Number, String, Boolean],
      default: null
    },

    placeholder: {
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
  },

  async fetch() {
    await setTimeout(() => {
      this.fetchRegionInfo();
    }, 1000);
  },

  data() {
    return { regionInfo: null, loading: false };
  },

  watch: {
    cloudCredentialId: {
      handler() {
        this.fetchRegionInfo();
      },
      immediate: true
    },

    value: {
      handler(neu) {
        if (!neu) {
          this.$emit('validation-passed', false);
        } else {
          this.$emit('validation-passed', true);
        }
      },
      immediate: true
    },

    globalVariableConfiguration: { deep: true }
  },

  computed: {
    credentialId() {
      return (this.globalVariableConfiguration).find((v) => v.name === CLOUD_CRED_VARIABLE_NAME)?.value;
    },

    regionOptions() {
      if ( !this.regionInfo ) {
        return [];
      }

      return this.regionInfo.Regions.map((obj) => {
        return obj.RegionName;
      }).sort();
    },
  },

  methods: {
    async fetchRegionInfo() {
      this.loading = true;
      this.errors = [];
      if ( !this.credentialId ) {
        this.loading = false;

        return;
      }

      try {
        const region = this.value || this.$store.getters['aws/defaultRegion'];

        if (!this.value && !this.placeholder) {
          this.$emit('update:value', region);
        }

        this.ec2Client = await this.$store.dispatch('aws/ec2', { region, cloudCredentialId: this.credentialId });

        this.regionInfo = await this.ec2Client.describeRegions({});
      } catch (e) {
        this.errors = exceptionToErrorsArray(e);
      }

      this.loading = false;
    }
  },
};
</script>

<template>
  <div>
    <LabeledSelect
      required
      :placeholder="placeholder"
      :loading="loading"
      label="AWS Region"
      :value="value"
      :options="regionOptions"
      @update:value="e=>$emit('update:value', e)"
    />
  </div>
</template>
