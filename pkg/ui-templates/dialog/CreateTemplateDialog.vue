<!-- eslint-disable node/no-callback-literal -->
<script>
import NameNsDescription from '@shell/components/form/NameNsDescription';
import AsyncButton from '@shell/components/AsyncButton';
import Banner from '@components/Banner/Banner.vue';
import { Card } from '@components/Card';

export default {
  name: 'CreateTemplateDialog',

  components: {
    NameNsDescription,
    AsyncButton,
    Banner,
    Card
  },

  props: {
    uitemplate: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    variableConfiguration: {
      type:    Array,
      default: () => []
    },

    resourceConfiguration: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    doneLocation: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  async fetch() {
    const currentStore = this.$store.getters['currentStore']('toboggan.md.template');

    this.model = await this.$store.dispatch(`${ currentStore }/clone`, { resource: this.uitemplate });
    this.model.cleanForNew();
    this.addDefaultsToNewTemplate();
    if (currentStore === 'management') {
      this.namespaceOverride = await this.$store.dispatch(`${ currentStore }/findAll`, { type: 'namespace' });
    }
  },

  data() {
    return { model: null, namespaceOverride: null };
  },

  methods: {
    addDefaultsToNewTemplate() {
      (this.model?.spec?.variables || []).forEach((v) => {
        const userConfiguration = this.variableConfiguration.find((variable) => variable.name === v.name);
        const openSchema = v.schema.openAPIV3Schema || {};

        if (userConfiguration && userConfiguration.value !== undefined) {
          openSchema.default = userConfiguration.value;
        }
      });

      this.model.spec.resourceDefaults = (Object.keys(this.resourceConfiguration) || []).reduce((all, resourceName) => {
        all.push(...this.resourceConfiguration[resourceName].map((val) => {
          return {
            name: resourceName, overrides: val.overrides, variables: val.variables
          };
        }));

        return all;
      }, []);
    },

    async save(cb) {
      this.errors = [];
      try {
        await this.model.save();
        cb(true);
        setTimeout(() => {
          this.$router.replace(this.doneLocation);
          this.close();
        }, 500);
      } catch (e) {
        this.errors = [e];
        cb(false);
      }
    },

    close() {
      this.$emit('close');
    },
  },
};
</script>

<template>
  <Card
    v-if="model"
    class="create-template-container"
  >
    <template #title>
      <h4>Create a new Template</h4>
    </template>
    <template #body>
      <Banner
        v-for="err, i in errors"
        :key="i"
        color="error"
      >
        {{ err }}
      </Banner>
      <div class="row mb-20">
        <div class="col span-12">
          <NameNsDescription
            :value="model"
            :namespace-options="namespaceOverride"
            mode="create"
          />
        </div>
      </div>
    </template>
    <template #actions>
      <div class="row mb-20">
        <div class="col span-12">
          <button
            class="btn role-secondary mr-10"
            @click="close"
          >
            Cancel
          </button>
          <AsyncButton
            @click="save"
          >
            Save Template
          </AsyncButton>
        </div>
      </div>
    </template>
  </Card>
</template>

<style>
.create-template-container {
  &.card-container {
    box-shadow: none;
    border: none !important;
  }

  :deep() .card-actions {
    display: flex;
    justify-content: center;
  }
}
</style>
