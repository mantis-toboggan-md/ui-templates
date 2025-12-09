## Getting started
Apply the template CRD from /pkg/ui-templates/resources/template-crd.yaml to whatever cluster you wish to use templates within. Example templates are defined in ./example-templates. Template CRs must be defined within the cluster using them - eg, these provisioning examples must be added to the local cluster; the configmap example may be added to any cluster that the template crd has beed added to.




#### Template Variable Annotations
ui-templates supports a small collection of annotations that may be applied to variables to improve their display.


|  Name | Description|
| --- | --- |
| `toboggan.md/section` | Add variables to an expandable section. You can add variables to existing sections in the cluster form using one of the following values: `general`, `controlplane`, `networking`, or `workers`|
| `toboggan.md/group` | Group variables within a section. Groups within groups are not supported.|
| `toboggan.md/highlight` | Call extra attention to a variable, giving it a larger label and expanded description. Optionally, use a value of `warning` or `error` to add an icon and coloration (yellow for warning, red for error)|
| `toboggan.md/label` | Add a label to your variable. Alternatively, name your variable one of the keys listed under `capi.variables` in ./pkg/capi/en-us.yaml|
| `toboggan.md/docs` | Add documentation link to your variable description. Requires highlight|
| `toboggan.md/toggled-by` | Tell the UI that this variable should only be shown when other variables are truthy. This is a comma-separated list of variable names. Boolean type variables that appear in another variable's toggled-by annotation will be rendered as toggle switches instead of checkboxes. It is the responsibility of the clusterclass author to group toggled variables near their toggle.|
| `toboggan.md/type` | The value of this annotation should be a kubernetes resource type eg `infrastructure.cluster.x-k8s.io.azureclusteridentity` Tell the UI that this variable should be a reference to some kubernetes resource in the current cluster. The UI will automatically search for all instances of this resource type and provide the user a dropdown to select one, or manually enter a name if they do not have permission to view the resource but know its there. This annotation may only be used with object type variables that specify a name key and, if the resource is namespaced, a namespace key.|
| `toboggan.md/component` | Load a custom Dashboard input component for this variable. If a component matching this annotation cannot be found, the UI will default to loading a generic dashboard input component based of the variable's type.
| `toboggan.md/widest` | Used in conjunction with the component annotation to allow custom components to use the full width of the form. This annotation will not work well if the highlight annotation is present, too.