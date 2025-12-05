import { NotificationLevel } from '@shell/types/notifications';
import * as jsyaml from 'js-yaml';
import Handlebars from 'handlebars';
import { get, set } from '@shell/utils/object';
import cloneDeep from 'lodash/cloneDeep';
import { patch } from 'semver';
import { isArray } from 'lodash';

/**
 * Generate YAML manifest using template and variable configuration
 * variableConfiguration: array of {name, value} objects to apply globally
 * requestedResources: array of {name, overrides} where name corresponds to some template.resources[].name and overrides is an array of variables {name, value}
 * each time a user adds a resource an entry is added to requestedResources
 */

export const generateManifest = (store, uitemplate, variableConfiguration = [], requestedResources = {}) => {
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
  const constructPatchValue = (p = {}, variableConfigs = [], iterateConfig = {}) => {
    const templateContext = variableConfigs.reduce((all, v) => {
      all[v.name] = v.value;

      return all;
    }, {});
    const patchTemplate = Handlebars.compile(p.template);

    const patchedValue = patchTemplate({ variables: templateContext, iterate: iterateConfig });

    try {
      const objectified = jsyaml.load(patchedValue);

      return objectified;
    } catch {
      return patchedValue;
    }
  };

  Object.keys(requestedResources).forEach( (resourceName) => {
    const defaultTemplate = resourceTemplatesJS[resourceName];

    requestedResources[resourceName].forEach((r) => {
      r.objectToBePatched = cloneDeep(defaultTemplate);
    });
  });

  patches.forEach((p = {}) => {
    const { target, op = 'replace', iterate } = p;

    if (!target) {
      return;
    }

    if (iterate) {
      // for each resourceConfiguration matching iterate, generate and apply patch
      const resourcesToIterateThrough = requestedResources[iterate] || [];

      if (resourcesToIterateThrough.length) {
        resourcesToIterateThrough.forEach((iteratedResource, idx) => {
          const iterateResourceConfiguration = iteratedResource.objectToBePatched || {};
          const iterateResourceOverrides = iteratedResource.overrides || [];
          const overriddenIterateNames = iterateResourceOverrides.map((o) => o.name);
          const relevantGlobalIterateVariables = variableConfiguration.filter((v) => !overriddenIterateNames.includes(v.name));

          const allIterateVariables = [...relevantGlobalIterateVariables, ...iterateResourceOverrides];

          const iterateVariablesForTemplateContext = allIterateVariables.reduce((all, v) => {
            all[v.name] = v.value;

            return all;
          }, {});

          const iterateConfig = {
            resource:  iterateResourceConfiguration,
            overrides: iterateVariablesForTemplateContext,
            index:     idx
          };

          // get other variables
          // do patch
          const targetResources = requestedResources[target];

          targetResources.forEach((r) => {
            const objectToBePatched = r.objectToBePatched;

            const overrides = r.overrides || [];

            const overriddenNames = overrides.map((o) => o.name);

            const relevantGlobalVariables = variableConfiguration.filter((v) => !overriddenNames.includes(v.name));

            const patchValue = constructPatchValue(p, [...relevantGlobalVariables, ...overrides], iterateConfig);

            if (op === 'append') {
              const currentVal = get(objectToBePatched, p.path);

              if (!isArray(currentVal)) {
                set(objectToBePatched, p.path, [patchValue]);
              } else {
                currentVal.push(patchValue);
              }
            } else {
              set(objectToBePatched, p.path, patchValue);
            }
          });
        });
      }
    } else {
      const targetResources = requestedResources[target];

      targetResources.forEach((r) => {
        const objectToBePatched = r.objectToBePatched;

        const overrides = r.overrides || [];

        const overriddenNames = overrides.map((o) => o.name);

        const relevantGlobalVariables = variableConfiguration.filter((v) => !overriddenNames.includes(v.name));

        const patchValue = constructPatchValue(p, [...relevantGlobalVariables, ...overrides]);

        set(objectToBePatched, p.path, patchValue);
      });
    }
  });

  let out;

  // finally, yamlize all resources and combine them into one yaml manifest
  try {
    const allResourcesToSave = Object.keys(requestedResources).reduce((all, resourceName) => {
      all.push(...requestedResources[resourceName].map((r) => r.objectToBePatched));

      return all;
    }, []);

    out = allResourcesToSave.map((r) => jsyaml.dump(r)).join('\n---\n\n');
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
