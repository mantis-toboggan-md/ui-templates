import { importTypes } from '@rancher/auto-import';
import { IPlugin, PanelLocation } from '@shell/core/types';
import routes from './routes'

// Init the package
export default function(plugin: IPlugin): void {
  // // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  plugin.metadata = require('./package.json');

  plugin.addRoutes(routes);

  plugin.addPanel(PanelLocation.RESOURCE_LIST,
  {
    mode: ['list']
  },
  { component: () => import('./components/MaybeCreateButton.vue') }
)
}
