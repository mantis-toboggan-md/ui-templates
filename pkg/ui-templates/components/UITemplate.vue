<script>
import Loading from '@shell/components/Loading';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import YamlEditor from '@shell/components/YamlEditor';

import Variables from './Variables/index.vue';
import { generateManifest } from '../utils/generate-manifest';
export default {
  name: 'UITemplate',

  components: {
    Variables,
    Loading,
    LabeledSelect,
    YamlEditor
  },

  props: {
    resourceType: {
      type:    String,
      default: ''
    },
  },

  async fetch() {
    // if we got to this page, assume user can load templates
    const inStore = this.$store.getters['currentStore'](this.resource);

    this.templates = await this.$store.dispatch(`${ inStore }/findAll`, { type: 'toboggan.md.template' });
  },

  data() {
    return {
      errors: [], templates: [], selectedTemplate: null, configuredVariables: [], requestedResources: [], allVariablesValid: false, manifest: ''
    };
  },

  watch: {
    selectedTemplate() {
      this.configuredVariables = [];
      this.requestedResources = [];
      this.manifest = '';
      this.initializeResourceRequests();
    }
  },

  computed: {
    availableTemplates() {
      return this.templates.filter((t) => t.targetTypes.includes(this.resourceType));
    }
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
            this.requestedResources.push({ name: r.name, overrides: [] });
            i++;
          }
        }
      });
    },

    updateValidation(e) {
      this.allVariablesValid = e;
    }
  }
};

</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else-if="manifest">
    <YamlEditor
      ref="yaml-editor"
      class="yaml-editor mb-10"
      :value="manifest"
    />
    <button
      class="btn role-primary"
      @click="manifest=''"
    >
      de-crunchatize me cap'n
    </button>
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
      <Variables
        v-model:value="configuredVariables"
        :uitemplate="selectedTemplate"
        @validation-passed="updateValidation"
      />
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
