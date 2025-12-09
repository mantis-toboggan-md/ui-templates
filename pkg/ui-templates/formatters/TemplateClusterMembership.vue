<!-- eslint-disable @typescript-eslint/no-empty-function -->
<script>
import { CAPI } from '@shell/config/types';
import ClusterMembershipEditor from '@shell/components/form/Members/ClusterMembershipEditor.vue';

export default {
  name: 'ClusterMembershipTemplateFormatter',

  components: { ClusterMembershipEditor },

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
  },

  created() {
    this.registerAfterHook(this.saveRoleBindings, 'saveRoleBindings');
  },

  data() {
    return { membershipUpdate: null };
  },

  methods: {
    async getNormanCluster() {
      console.log('*** GETTING NORMAN CLUSTER');
      // const clusterConfig = Object.keys(this.resourceConfiguration).find((resourceName) => {
      //   const resources = this.resourceConfiguration[resourceName];

      //   const provClusterResource = resources.find((r) => {
      //     return r?.['k8s-type'] === CAPI.RANCHER_CLUSTER;
      //   });

      //   if (provClusterResource) {
      //     return true;
      //   }

      //   return false;
      // });

      const clusterConfig = this.resourceConfiguration['cluster']?.[0];

      debugger;
      const clusterObject = clusterConfig.objectToBePatched;

      const provCluster = await this.$store.dispatch('management/find', { type: CAPI.RANCHER_CLUSTER, id: `${ clusterObject?.metadata?.namespace }/${ clusterObject?.metadata?.name }` });

      return await provCluster.findNormanCluster();
    },

    onMembershipUpdate(update) {
      this['membershipUpdate'] = update;
    },

    async saveRoleBindings() {
      const normanCluster = await this.getNormanCluster();

      if (this.membershipUpdate?.save) {
        await this.membershipUpdate.save(normanCluster.id);
      }
    },
  },
};
</script>

<template>
  <ClusterMembershipEditor
    mode="create"
    :parent-id="null"
    @membership-update="onMembershipUpdate"
  />
</template>
