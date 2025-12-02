<script>
export default {
  name: 'MaybeCreateFromTemplate',

  async fetch() {
    const isClusterScoped = this.$route?.params?.cluster && this.$route.params.cluster !== '_';

    this.steveStore = isClusterScoped ? 'cluster' : 'management';

    try {
      const currentTypeSchema = await this.$store.dispatch(`${ this.steveStore }/find`, { type: 'schema', id: this.currentType });

      this.canCreate = currentTypeSchema?.collectionMethods.find((x) => x.toLowerCase() === 'post');
    } catch {}

    if (this.canCreate) {
      let templateSchema;

      try {
        templateSchema = await this.$store.dispatch(`${ this.steveStore }/find`, { type: 'schema', id: 'toboggan.md.template' });
      } catch {}
      if (templateSchema) {
        this.templates = await this.$store.dispatch(`${ this.steveStore }/findAll`, { type: 'toboggan.md.template' });
      }
    }
  },

  data() {
    return {
      canCreate: false, steveStore: '', templates: []
    };
  },

  computed: {
    currentType() {
      return this.$route?.params?.resource;
    },

    hasTemplates() {
      if (!this.currentType) {
        return false;
      }

      return !!(this.templates || []).find((t) => (t.targetTypes || []).includes(this.currentType));
    },

    createFromTemplateRoute() {
      const name = `${ this.$route.name }-template`;
      const path = `${ this.$route.path }/template`;
      const fullPath = `${ this.$route.fullPath }/template`;

      return {
        ...this.$route, name, path, fullPath
      };
    },

    showCreateFromTemplate() {
      return this.hasTemplates && this.canCreate;
    }
  },

};
</script>

<template>
  <div
    v-if="showCreateFromTemplate"
    class="button-container"
  >
    <router-link
      class="btn role-secondary"
      :to="createFromTemplateRoute"
    >
      crunchatize me cap'n
    </router-link>
  </div>
</template>

<style>
.button-container{
    display: flex;
    justify-content: flex-end;
    position: relative;
    margin-bottom: 20px;
}

</style>
