import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  intl: service(),
  topBarManager: service(),

  model(params) {
    return this.store.findRecord('violation-report', params.id, { include: 'flags, flaggable, flaggable.user, flaggable.panels, flaggable.post, flaggable.post.panels, flaggable.post.user' });
  },

  afterModel() {
    const title = this.get('intl').t('moderation.report');
    this.set('titleToken', title);
    this.get('topBarManager').setTitle(title);

    this._super(...arguments);
  },

  actions: {
    deletePost(post, resolve) {
      post.destroyRecord().finally(() => resolve());
    },

    loadMorePosts(resolve, reject, shouldProgress) {
      resolve(shouldProgress ? { reachedFirstPost: true } : { reachedLastPost: true });
    }
  }
});