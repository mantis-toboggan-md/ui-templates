<script>
import {
  _VIEW, _EDIT, _CLONE, _IMPORT, _STAGE, _CREATE,
  AS, _YAML, _DETAIL, _CONFIG, PREVIEW, MODE,
} from '@shell/config/query-params';
import { SCHEMA } from '@shell/config/types';
import { createYaml } from '@shell/utils/create-yaml';
import Loading from '@shell/components/Loading';
import Masthead from '@shell/components/ResourceDetail/Masthead';

import UITemplate from '../components/UITemplate.vue';

// async function getYaml(store, model) {
//   let yaml;
//   const opt = { headers: { accept: 'application/yaml' } };

//   if ( model.hasLink('view') ) {
//     yaml = (await model.followLink('view', opt)).data;
//   }

//   return model.cleanForDownload(yaml);
// }

export default {
  name: 'UITemplateIndex',

  components: {
    UITemplate,
    Masthead,
    Loading
  },

  async fetch() {
    const store = this.$store;
    const route = this.$route;
    const params = route.params;
    let resourceType = this.resourceOverride || params.resource;

    const inStore = this.storeOverride || store.getters['currentStore'](resourceType);
    // const realMode = this.realMode;
    const realMode = _CREATE;

    // eslint-disable-next-line prefer-const
    let { namespace, id } = params;

    // There are 6 "real" modes that can be put into the query string
    // These are mapped down to the 3 regular page "mode"s that create-edit-view components
    // know about:  view, edit, create (stage, import and clone become "create")
    const mode = ([_CLONE, _IMPORT, _STAGE].includes(realMode) ? _CREATE : realMode);

    const hasCustomDetail = store.getters['type-map/hasCustomDetail'](resourceType, id);
    const hasCustomEdit = store.getters['type-map/hasCustomEdit'](resourceType, id);

    const schemas = store.getters[`${ inStore }/all`](SCHEMA);

    // As determines what component will be rendered
    // const requested = route.query[AS];
    let as = _CONFIG;
    const notFound = false;

    // if ( mode === _VIEW && hasCustomDetail && (!requested || requested === _DETAIL) ) {
    //   as = _DETAIL;
    // } else if ( hasCustomEdit && (!requested || requested === _CONFIG) ) {
    //   as = _CONFIG;
    // } else {
    //   as = _YAML;
    // }

    this.as = as;

    const options = store.getters[`type-map/optionsFor`](resourceType);

    this.showMasthead = [_CREATE, _EDIT].includes(mode) ? options.resourceEditMasthead : true;
    const canViewYaml = options.canYaml;

    if ( options.resource ) {
      resourceType = options.resource;
    }

    const schema = store.getters[`${ inStore }/schemaFor`](resourceType);
    let model, initialModel, liveModel, yaml;

    if ( realMode === _CREATE || realMode === _IMPORT ) {
      if ( !namespace ) {
        namespace = store.getters['defaultNamespace'];
      }

      const data = { type: resourceType };

      if ( schema?.attributes?.namespaced ) {
        data.metadata = { namespace };
      }

      liveModel = await store.dispatch(`${ inStore }/create`, data);
      initialModel = await store.dispatch(`${ inStore }/clone`, { resource: liveModel });
      model = await store.dispatch(`${ inStore }/clone`, { resource: liveModel });
      if (model.forceYaml === true) {
        as = _YAML;
        this.as = as;
      }

      if ( as === _YAML ) {
        if (schema?.fetchResourceFields) {
          // fetch resourceFields for createYaml
          await schema.fetchResourceFields();
        }

        yaml = createYaml(schemas, resourceType, data);
      }
    }
    // else {
    //   let fqid = id;

    //   if ( schema.attributes?.namespaced && namespace ) {
    //     fqid = `${ namespace }/${ fqid }`;
    //   }

    //   try {
    //     liveModel = await store.dispatch(`${ inStore }/find`, {
    //       type: resourceType,
    //       id:   fqid,
    //       opt:  { watch: true }
    //     });
    //   } catch (e) {
    //     if (e.status === 404 || e.status === 403) {
    //       store.dispatch('loadingError', new Error(this.t('nav.failWhale.resourceIdNotFound', { resource: resourceType, fqid }, true)));
    //     }
    //     console.debug(`Could not find '${ resourceType }' with id '${ id }''`, e); // eslint-disable-line no-console
    //     liveModel = {};
    //     notFound = fqid;
    //   }

    //   try {
    //     if (realMode === _VIEW) {
    //       model = liveModel;
    //     } else {
    //       model = await store.dispatch(`${ inStore }/clone`, { resource: liveModel });
    //     }
    //     initialModel = await store.dispatch(`${ inStore }/clone`, { resource: liveModel });

    //     if ( as === _YAML ) {
    //       yaml = await getYaml(this.$store, liveModel);
    //     }
    //   } catch (e) {
    //     this.errors.push(e);
    //   }
    //   if ( as === _YAML ) {
    //     try {
    //       yaml = await getYaml(this.$store, liveModel);
    //     } catch (e) {
    //       this.errors.push(e);
    //     }
    //   }

    //   if ( [_CLONE, _IMPORT, _STAGE].includes(realMode) ) {
    //     model.cleanForNew();
    //     yaml = model.cleanYaml(yaml, realMode);
    //   }
    // }

    // Ensure common properties exists
    try {
      model = await store.dispatch(`${ inStore }/cleanForDetail`, model);
    } catch (e) {
      this.errors.push(e);
    }

    const out = {
      hasCustomDetail,
      hasCustomEdit,
      canViewYaml,
      resourceType,
      as,
      yaml,
      initialModel,
      liveModel,
      mode,
      value: model,
      notFound,
    };

    for ( const key in out ) {
      this[key] = out[key];
    }

    if ( this.mode === _CREATE ) {
      this.value.applyDefaults(this, realMode);
    }
  },

  data() {
    return {
      resourceSubtype: null,

      // Set by fetch
      resourceType:    null,
      asYaml:          null,
      yaml:            null,
      liveModel:       null,
      initialModel:    null,
      mode:            null,
      as:              null,
      value:           null,
      model:           null,
      notFound:        null,
      canViewYaml:     null,
      errors:          []
    };
  },
};

</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <div v-else>
    <Masthead
      v-if="showMasthead"
      v-ui-context="{ icon: 'icon-folder', value: liveModel.name, tag: liveModel.kind?.toLowerCase(), description: liveModel.kind }"
      :resource="resourceType"
      :value="liveModel"
      :mode="mode"
      :real-mode="realMode"
      :as="as"
      :has-detail="hasCustomDetail"
      :has-edit="hasCustomEdit"
      :can-view-yaml="canViewYaml"
      :resource-subtype="resourceSubtype"
      :parent-route-override="parentRouteOverride"
      :store-override="storeOverride"
    />
    <UITemplate
      :mode="mode"
      :resource-type="resourceType"
      :live-model="liveModel"
    />
  </div>
</template>
