import { alias } from '@ember/object/computed';
import { hash } from 'rsvp';
import Route from '@ember/routing/route';
import PostNavRouteMixin from 'client/mixins/post-nav-route';

export default Route.extend(PostNavRouteMixin, {
  queryParams: {
    tags: {
      refreshModel: true
    }
  },

  _timelineItems: alias('controller.model.timelineItems'),
  _defaultQueryParams: {
    tags: [],
    relationships: [],
    lastTimelineItem: null,
    timelineItemId: null,
    comments: null
  },

  model(params) {
    this.setProperties({
      reachedFirstTimelineItem: false,
      reachedLastTimelineItem: false
    });

    const user = this.modelFor('users.user');

    return hash({
      timelineItems: this.store.query('timeline-item', { userId: user.id, tags: params.tags, direction: params.direction, fromTimelineItemId: params.postId, lastTimelineItem: params.lastTimelineItem, perPage: 5, include: 'timelineable, timelineable.panels, timelineable.currentUserReaction, user' }),
      user
    });
  }
});
