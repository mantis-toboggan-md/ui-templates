import SteveModel from '@shell/plugins/steve/steve-class';

export default class UITemplate extends SteveModel {
  // which k8s resource type(s) this template creates
  // used to determine whether to show create from template btn in list view
  get targetTypes() {
    return (this.spec?.resources || []).reduce((all, r) => {
      console.log('**** spec resource', r);
      if (r['k8s-type'] && r.min > 0) {
        all.push(r['k8s-type']);
      }

      return all;
    }, []);
  }
}
