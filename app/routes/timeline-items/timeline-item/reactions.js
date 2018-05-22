import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import InfinityRoute from "ember-infinity/mixins/route";

export default Route.extend(InfinityRoute, {
  perPageParam: 'page_size',

  intl: service(),
  topBarManager: service(),

  model() {
    return this.infinityModel('reaction', { perPage: 12, startingPage: 1, filter: { timeline_item_id: this.modelFor('timeline_items.timeline_item').id }, include: 'user' });
  },

  beforeModel(...args) {
    this._super(...args);

    const title = this.get('intl').t('post.reactions');

    this.get('topBarManager').setTitleLink(title, 'timeline_items.timeline_item', this.modelFor('timeline_items.timeline_item').id);
    this.set('titleToken', title);
  }
});