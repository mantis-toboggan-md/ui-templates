<script>
import Loading from '@shell/components/Loading';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import YamlEditor from '@shell/components/YamlEditor';
import AsyncButton from '@shell/components/AsyncButton';
import CreateEditView from '@shell/mixins/create-edit-view';
import Banner from '@components/Banner/Banner.vue';
import Accordion from '@components/Accordion/Accordion.vue';
import ToggleSwitch from '@components/Form/ToggleSwitch/ToggleSwitch.vue';

import Variables from './Variables/index.vue';
import UITemplateSubResource from './UITemplateSubResource.vue';
import { generateManifest } from '../utils/generate-manifest';
import { MANAGEMENT } from '@shell/config/types';

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
    Accordion,
    ToggleSwitch,
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
      errors:                [],
      templates:             [],
      selectedTemplate:      null,
      configuredVariables:   [],
      requestedResources:    {},
      globalVariablesValid:  false,
      resourceValid:         {},
      manifest:              '',
      hideOptional:         false, // TODO nb
      disabledResources:    {}
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

      // return (this.selectedTemplate.spec?.resources || []).filter((r) => r.max && r.max > r.min);
      return (this.selectedTemplate.spec?.resources || []).filter((r) => r.variables?.length || r.overrides?.length);
    },

    allVariablesValid() {
      return this.globalVariablesValid && !Object.keys(this.resourceValid).find((k) => !this.resourceValid[k]);
    },
  },

  methods: {
    generate() {
      this.manifest = generateManifest(this.$store, this.selectedTemplate, this.configuredVariables, this.requestedResources);
    },

    initializeResourceRequests() {
      const resourceDefaults = this.selectedTemplate?.spec?.resourceDefaults || [];

      resourceDefaults.forEach((r) => {
        if (!this.requestedResources[r.name]) {
          this.requestedResources[r.name] = [];
        }
        this.requestedResources[r.name].push({ overrides: r.overrides || [], variables: r.variables || [] });
      });
    },

    addInstanceOfResource(name) {
      if (!this.requestedResources[name]) {
        this.requestedResources[name] = [];
      }

      this.requestedResources[name].push({ overrides: [], variables: [] });
      const resourceConfig = this.addableResources.find((r) => r.name === name);

      if (this.requestedResources[name].length >= resourceConfig.max) {
        this.disabledResources[name] = true;
      }
    },

    removeInstanceOfResource(name, idx) {
      this.requestedResources[name].splice(idx, 1);
    },

    setResourceValid(name, e) {
      this.resourceValid[name] = e;
    },

    async saveManifest(cb) {
      try {
        let currentCluster = this.$store.getters['currentCluster'];

        if (!currentCluster) {
          currentCluster = await this.$store.dispatch('management/find', { type: MANAGEMENT.CLUSTER, id: 'local' });
        }

        await currentCluster.doAction('apply', { yaml: this.manifest });

        // eslint-disable-next-line node/no-callback-literal
        cb(true);
        this.done();
      } catch (e) {
        this.errors = [e];
        // eslint-disable-next-line node/no-callback-literal
        cb(false);
      }
    },

    createNewTemplate() {
      this.$store.dispatch('management/promptModal', {
        component:      'CreateTemplateDialog',
        componentProps: {
          uitemplate:            this.selectedTemplate,
          variableConfiguration: this.configuredVariables,
          resourceConfiguration: this.requestedResources,
          doneLocation:          this.doneLocationOverride
        }
      });
    },
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
    <div class="center row">
      <div class="center col span-6">
        <LabeledSelect
          v-model:value="selectedTemplate"
          option-label="id"
          :options="availableTemplates"
          label="Template"
        />
      </div>
      <div class="center col span-6">
        <ToggleSwitch
          v-if="selectedTemplate"
          v-model:value="hideOptional"
          on-label="Hide optional fields"
        />
      </div>
    </div>
    <div v-if="selectedTemplate">
      <!-- GLOBAL VARIABLES -->
      <Variables
        v-model:value="configuredVariables"
        :uitemplate="selectedTemplate"
        :global-variables="configuredVariables"
        :resource-configuration="resourceConfiguration"
        :hide-populated="hidePopulated"
        :hide-optional="hideOptional"
        @validation-passed="e=>globalVariablesValid=e"
      />

      <!-- INDIVIDUAL RESOURCES POTENTIALLY WITH VARIABLES -->
      <template v-if="addableResources && addableResources.length">
        <div
          v-for="resource in addableResources"
          :key="resource.name"
        >
          <button
            v-if="resource.max !== 1"
            class="btn btn-sm role-primary mt-20"
            :disabled="disabledResources[resource.name]"
            @click="addInstanceOfResource(resource.name)"
          >
            Add {{ resource.name }}
          </button>
          <template
            v-for="r, i in requestedResources[resource.name]"
            :key="i"
          >
            <Accordion
              class="mt-20"
              :open-initially="true"
              :title="resource.max !== 1 ?`${resource.name} ${ i+1 }` : resource.name"
            >
              <template #header>
                <div class="resource-header">
                  <h2>{{ resource.max !== 1 ?`${resource.name} ${ i+1 }` : resource.name }}</h2>
                  <button
                    v-if="resource.max !== 1"
                    class="btn btn-sm role-tertiary"
                    @click="removeInstanceOfResource(resource.name, i)"
                  >
                    remove
                  </button>
                </div>
              </template>
              <UITemplateSubResource
                v-model:overrides="r.overrides"
                v-model:resource-variables="r.variables"
                :resource-name="resource.name"
                :selected-template="selectedTemplate"
                :global-variables="configuredVariables"
                :hide-populated="hidePopulated"
                :hide-optional="hideOptional"
                @validation-passed="e=>setResourceValid(resource.name, e)"
              />
            </Accordion>
          </template>
        </div>
      </template>
      <div class="footer">
        <button
          class="btn role-secondary"
          @click="createNewTemplate"
        >
          create a new template with these values
        </button>
        <button
          class="btn role-primary"
          :disabled="!allVariablesValid"
          @click="generate"
        >
          Create
        </button>
      </div>
    </div>
    <div v-else>
    </div>
  </div>
</template>

<style lang=scss scoped>
  .resource-header{
    display: flex;
    justify-content: space-between;
    width: 100%;
    & button {
      position: relative;
      top: -10px;
    }
  }

.footer {
  position: sticky;
  bottom: 0px;
  background: var(--body-bg);
  padding-top: 12px;
  border-top: 1px solid var(--border);
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  & button {
    margin-right: 4px;
  }
}

.col.center{
  align-self: center;
}
</style>
