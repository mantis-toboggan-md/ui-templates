<script>
import Loading from '@shell/components/Loading';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import YamlEditor from '@shell/components/YamlEditor';
import AsyncButton from '@shell/components/AsyncButton';
import CreateEditView from '@shell/mixins/create-edit-view';
import Banner from '@components/Banner/Banner.vue';

import Variables from './Variables/index.vue';
import UITemplateSubResource from './UITemplateSubResource.vue';
import { generateManifest } from '../utils/generate-manifest';

export default {
  name: 'UITemplate',

  mixins: [CreateEditView],

  components: {
    Variables,
    Loading,
    LabeledSelect,
    YamlEditor,
    AsyncButton,
    Banner,
    UITemplateSubResource
  },

  props: {
    resourceType: {
      type:    String,
      default: ''
    },

    // used to return to the same list view this creation process was initialized from
    liveModel: {
      type:    Object,
      default: () => {
        return {};
      }
    },
  },

  async fetch() {
    // if we got to this page, assume user can load templates
    const inStore = this.$store.getters['currentStore'](this.resource);

    this.templates = await this.$store.dispatch(`${ inStore }/findAll`, { type: 'toboggan.md.template' });
  },

  data() {
    return {
      errors:               [],
      templates:            [],
      selectedTemplate:     null,
      configuredVariables:  [],
      requestedResources:   {},
      allVariablesValid:    false,
      manifest:             '',
    };
  },

  watch: {
    selectedTemplate() {
      this.configuredVariables = [];
      this.requestedResources = {};
      this.manifest = '';
      this.initializeResourceRequests();
    }
  },

  computed: {
    doneLocationOverride() {
      return this.liveModel.listLocation;
    },

    availableTemplates() {
      return this.templates.filter((t) => t.targetTypes.includes(this.resourceType));
    },

    addableResources() {
      if (!this.selectedTemplate) {
        return [];
      }

      return (this.selectedTemplate.spec?.resources || []).filter((r) => r.max && r.max > r.min);
    },
  },

  methods: {
    generate() {
      this.manifest = generateManifest(this.$store, this.selectedTemplate, this.configuredVariables, this.requestedResources);
    },

    initializeResourceRequests() {
      const resources = this.selectedTemplate?.spec?.resources || [];

      resources.forEach((r) => {
        if (r.min > 0) {
          let i = 0;

          while (i < r.min) {
            // this.requestedResources.push({ name: r.name, overrides: [] });
            if (!this.requestedResources[r.name]) {
              this.requestedResources[r.name] = [];
            }
            this.requestedResources[r.name].push({ overrides: [] });
            i++;
          }
        }
      });
    },

    addInstanceOfResource(name) {
      if (!this.requestedResources[name]) {
        this.requestedResources[name] = [];
      }

      this.requestedResources[name].push({ overrides: [] });
    },

    removeInstanceOfResource(name, idx) {
      this.requestedResources[name].splice(idx, 1);
    },

    async saveManifest(cb) {
      try {
        const currentCluster = this.$store.getters['currentCluster'];

        await currentCluster.doAction('apply', { yaml: this.manifest });

        // eslint-disable-next-line node/no-callback-literal
        cb(true);
        this.done();
      } catch (e) {
        this.errors = [e];
        // eslint-disable-next-line node/no-callback-literal
        cb(false);
      }
    }
  }
};

</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else-if="manifest">
    <Banner
      v-for="error, i in errors"
      :key="i"
      color="error"
    >
      {{ error }}
    </Banner>
    <YamlEditor
      ref="yaml-editor"
      class="yaml-editor mb-10"
      :value="manifest"
    />
    <button
      class="btn role-secondary"
      @click="manifest=''"
    >
      go back
    </button>
    <AsyncButton
      class="btn role-primary"
      @click="saveManifest"
    >
      apply yaml manifest
    </AsyncButton>
  </div>

  <div v-else>
    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          v-model:value="selectedTemplate"
          option-label="id"
          :options="availableTemplates"
          label="Template"
        />
      </div>
    </div>
    <div v-if="selectedTemplate">
      <!-- GLOBAL VARIABLES -->
      <Variables
        v-model:value="configuredVariables"
        :uitemplate="selectedTemplate"
        @validation-passed="e=>allVariablesValid=e"
      />

      <!-- INDIVIDUAL RESOURCES POTENTIALLY WITH VARIABLE OVERRIDES -->
      <template v-if="addableResources && addableResources.length">
        <div
          v-for="resource in addableResources"
          :key="resource.name"
        >
          <UITemplateSubResource
            v-for="r, i in requestedResources[resource.name]"
            :key="i"
            v-model:overrides="r.overrides"
            :resource-name="resource.name"
            :selected-template="selectedTemplate"
            :global-variables="configuredVariables"
            @remove="removeInstanceOfResource(resource.name, i)"
          />
          <button @click="addInstanceOfResource(resource.name)">
            Add {{ resource.name }}
          </button>
        </div>
      </template>

      <button
        class="btn role-primary"
        :disabled="!allVariablesValid"
        @click="generate"
      >
        crunchatize me cap'n
      </button>
    </div>
    <div v-else>
      Select a template to get started.
    </div>
  </div>
</template>
