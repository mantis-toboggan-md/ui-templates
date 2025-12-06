<script>
import { exceptionToErrorsArray } from '@shell/utils/error';

const CLOUD_CRED_VARIABLE_NAME = 'cloudCredential';

export default {
  name: 'AwsRegionTemplateFormatter',

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
  },

  async fetch() {
    this.errors = [];
    if ( !this.credentialId ) {
      return;
    }

    try {
      const region = this.value.region || this.$store.getters['aws/defaultRegion'];

      if (!this.value) {
        this.$emit('update:value', region);
      }

      this.ec2Client = await this.$store.dispatch('aws/ec2', { region, cloudCredentialId: this.credentialId });

      this.regionInfo = await this.ec2Client.describeRegions({});

      if ( !this.value.zone ) {
        this.value['zone'] = 'a';
      }
    } catch (e) {
      this.errors = exceptionToErrorsArray(e);
    }
  },

  data() {
    return { regionInfo: {} };
  },

  watch: {
    cloudCredentialId() {
      this.fetch();
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
    }
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

  }
};
</script>

<template>
  <div>
    <LabeledSelect
      required
      label="AWS Region"
      :value="value"
      :options="regionOptions"
      @input="e=>$emit('update:value')"
    />
  </div>
</template>
