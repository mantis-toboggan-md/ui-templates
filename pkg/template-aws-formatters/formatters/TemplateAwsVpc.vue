<script>
import { exceptionToErrorsArray } from '@shell/utils/error';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { sortBy } from '@shell/utils/sort';
import { addObject, addObjects, findBy } from '@shell/utils/array';
import { isEmpty } from '@shell/utils/object';
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
      this.fetchVpcInfo();
    }, 1000);
  },

  data() {
    return {
      vpcInfo: null, loading: false, selectedNetwork: this.value?.vpcId || this.value?.subnetId
    };
  },

  watch: {
    cloudCredentialId: {
      handler() {
        this.fetchVpcInfo();
      },
      immediate: true
    },

    region: {
      handler() {
        this.fetchVpcInfo();
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

    region() {
      return (this.globalVariableConfiguration).find((v) => v.name === 'region')?.value;
    },

    allNetworkOptions() {
      if ( !this.vpcInfo || !this.subnetInfo ) {
        return [];
      }
      let vpcs = [];
      const subnetsByVpc = {};

      for ( const obj of this.vpcInfo.Vpcs ) {
        const name = obj.Tags && obj.Tags?.length ? obj.Tags.find((t) => t.Key === 'Name')?.Value : null;
        const hasIpv6 = !!obj.Ipv6CidrBlockAssociationSet && !isEmpty(obj.Ipv6CidrBlockAssociationSet);
        const hasIpv4 = !!obj.CidrBlock;

        vpcs.push({
          label:     name || obj.VpcId,
          subLabel:  name ? obj.VpcId : obj.CidrBlock,
          isDefault: obj.IsDefault || false,
          kind:      'vpc',
          value:     obj.VpcId,
          // disabled:  this.enableIpv6 !== hasIpv6,
          hasIpv6,
          hasIpv4
        });
      }

      vpcs = sortBy(vpcs, ['isDefault:desc', 'label']);

      for ( const obj of this.subnetInfo.Subnets ) {
        if ( obj.AvailabilityZone !== `${ this.region }${ this.zone }` ) {
          continue;
        }

        const hasIpv6 = !!obj.Ipv6CidrBlockAssociationSet && !isEmpty(obj.Ipv6CidrBlockAssociationSet);
        const hasIpv4 = !!obj.CidrBlock;

        // if (this.enableIpv6 !== hasIpv6) {
        //   continue;
        // }

        let entry = subnetsByVpc[obj.VpcId];

        if ( !entry ) {
          entry = [];
          subnetsByVpc[obj.VpcId] = entry;
        }

        const name = obj.Tags && obj.Tags?.length ? obj.Tags.find((t) => t.Key === 'Name')?.Value : null;

        entry.push({
          label:     name || obj.SubnetId,
          subLabel:  name ? obj.SubnetId : obj.CidrBlock,
          kind:      'subnet',
          isDefault: obj.DefaultForAz || false,
          value:     obj.SubnetId,
          vpcId:     obj.VpcId,
          hasIpv6,
          hasIpv4
        });
      }

      const out = [];

      for ( const obj of vpcs ) {
        if (!obj.disabled || subnetsByVpc[obj.value]) {
          addObject(out, obj);
        }

        if ( subnetsByVpc[obj.value] ) {
          addObjects(out, sortBy(subnetsByVpc[obj.value], ['isDefault:desc', 'label']));
        }
      }

      return out;
    },

  },

  methods: {
    async fetchVpcInfo() {
      this.loading = true;
      this.errors = [];
      if ( !this.credentialId ) {
        this.loading = false;

        return;
      }

      try {
        const region = this.region || this.$store.getters['aws/defaultRegion'];

        this.ec2Client = await this.$store.dispatch('aws/ec2', { region, cloudCredentialId: this.credentialId });

        this.vpcInfo = await this.ec2Client.describeVpcs({});
        this.subnetInfo = await this.ec2Client.describeSubnets({});
      } catch (e) {
        this.errors = exceptionToErrorsArray(e);
      }

      this.loading = false;
    },

    updateNetwork(value) {
      let obj;

      if ( value ) {
        obj = findBy(this.allNetworkOptions, 'value', value);
      }

      if ( obj?.kind === 'subnet' ) {
        // this.$emit('update:subnetId', value);
        // this.$emit('update:vpcId', obj.vpcId);
        this.$emit('update:value', { vpcId: obj.vpcId, subnetId: value });
        this.selectedNetwork = value;
      } else if ( obj ) {
        // this.$emit('update:subnetId', null);
        // this.$emit('update:vpcId', value);
        this.$emit('update:value', { vpcId: value, subnetId: null });
        this.selectedNetwork = value;
      } else {
        // this.$emit('update:subnetId', null);
        // this.$emit('update:vpcId', null);
        this.$emit('update:value', { vpcId: null, subnetId: null });

        this.selectedNetwork = null;
      }
    },

  },
};
</script>

<template>
  <div>
    <LabeledSelect
      required
      :placeholder="placeholder?.subnetId || placeholder?.vpcId || ''"
      :loading="loading"
      label="Network"
      :value="selectedNetwork"
      :options="allNetworkOptions"
      @update:value="updateNetwork"
    />
  </div>
</template>
