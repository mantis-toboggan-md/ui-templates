
export const ANNOTATIONS = {
  GROUP:                'toboggan.md/group', // group in a sub-section
  SECTION:              'toboggan.md/section', // add to existing top-level section or insert new one
  HIGHLIGHT:            'toboggan.md/highlight', // show description more prominently and with info, warning, or error icon + colors
  LABEL:                'toboggan.md/label', // human-readable label
  DOCS:                 'toboggan.md/docs', // link out to documentation
  TOGGLED_BY:           'toboggan.md/toggled-by', // gate visibility on a boolean var - template responsible for grouping
  SEARCH_TYPE:          'toboggan.md/type', // k8s resource type to search for and populate labeledselect w/
  DASHBAORD_COMPONENT:  'toboggan.md/component', // dashboard compon ent to render as the form input. Should be a component that lives in a formatter folder. Can load components from other extensions
  WIDEST:              'toboggan.md/widest' // render this component using the full width of the form, instead of half width as usual. Incompatible with highlight
};
