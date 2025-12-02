
export const ANNOTATIONS = {
  GROUP:        'turtles-capi.cattle.io/group', // group in a sub-section
  SECTION:      'turtles-capi.cattle.io/section', // add to existing top-level section or insert new one
  HIGHLIGHT:    'turtles-capi.cattle.io/highlight', // show description more prominently and with info, warning, or error icon + colors
  LABEL:        'turtles-capi.cattle.io/label', // human-readable label
  DOCS:        'turtles-capi.cattle.io/docs', // link out to documentation

  TOGGLED_BY: 'turtles-capi.cattle.io/toggled-by', // gate visibility on a boolean var - template responsible for grouping

  SEARCH_TYPE: 'turtles-capi.cattle.io/type' // k8s resource type to search for and populate labeledselect w/
};
