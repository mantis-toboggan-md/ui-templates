import { NotificationLevel } from '@shell/types/notifications';
import * as jsyaml from 'js-yaml';
import Handlebars from 'handlebars';
import { set } from '@shell/utils/object';
import cloneDeep from 'lodash/cloneDeep';

/**
 * Generate YAML manifest using template and variable configuration
 * variableConfiguration: array of {name, value} objects to apply globally
 * requestedResources: array of {name, overrides} where name corresponds to some template.resources[].name and overrides is an array of variables {name, value}
 * each time a user adds a resource an entry is added to requestedResources
 */

export const generateManifest = (store, uitemplate, variableConfiguration = [], requestedResources = []) => {
  const { resources, variables, patches } = (uitemplate?.spec || {});

  if (!resources || !variables || !patches) {
    return null;
  }

  const resourceTemplatesJS = {};

  resources.map((r, idx) => {
    const yaml = r.template;
    const name = r.name;

    try {
      const obj = jsyaml.load(yaml);

      resourceTemplatesJS[name] = obj ;
    } catch (e) {
      store.dispatch('notifications/add',
        {
          level:      NotificationLevel.Warning,
          title:      `Error generating manifest for resource number${ idx }${ 1 }`,
          message: e
        }
      );
    }
  });
  /**
   *
   * Constructing patch values should use variableConfiguration, with the relevant resources requestedResources.overrides overwriting variableConfiguration values of the same name
   * for each patch in the template, apply to each requestedResources that matches the target of that patch
   */

  const constructPatchValue = (p = {}, variableConfigs = []) => {
    const templateContext = variableConfigs.reduce((all, v) => {
      all[v.name] = v.value;

      return all;
    }, {});
    const patchTemplate = Handlebars.compile(p.template);

    return patchTemplate({ variables: templateContext });
  };

  const resourcesToPatch = requestedResources.map((req) => {
    const name = req.name;
    const defaultTemplate = resourceTemplatesJS[name];

    return { name, value: cloneDeep(defaultTemplate) };
  });

  patches.forEach((p = {}) => {
    const { target } = p;

    if (!target) {
      return;
    }

    const targetResources = requestedResources.filter((r) => r.name === target);

    targetResources.forEach((r) => {
      const objectToBePatched = resourcesToPatch.find((resource) => resource.name === r.name)?.value;

      const overrides = r.overrides || [];

      const overriddenNames = overrides.map((o) => o.name);

      const relevantGlobalVariables = variableConfiguration.filter((v) => !overriddenNames.includes(v.name));

      const patchValue = constructPatchValue(p, [...relevantGlobalVariables, ...overrides]);

      set(objectToBePatched, p.path, patchValue);
    });
  });
  let out;

  try {
    out = resourcesToPatch.map((r) => jsyaml.dump(r.value)).join('\n---\n\n');
  } catch (e) {
    store.dispatch('notifications/add',
      {
        level:      NotificationLevel.Warning,
        title:      `Error generating manifest`,
        message: e
      }
    );
  }

  return out;
};
