import Mixin from '@ember/object/mixin';
import DS from 'ember-data';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Mixin.create({
  currentUser: service(),

  reactions: DS.hasMany('reaction'),

  moonCount: DS.attr('number'),
  starCount: DS.attr('number'),
  sunCount: DS.attr('number'),
  reactionCount: DS.attr('number'),

  currentUserReaction: computed('currentUser.user.id', 'reactions.[]', '_cachedCurrentUserReaction', {
    get() {
      const currentUserId = this.get('currentUser.user.id');

      return this.set('_cachedCurrentUserReaction', this.get('_cachedCurrentUserReaction') ||
        this.get('reactions').find((reaction) => reaction.get('user.id') === currentUserId));
    },
    set(key, value) {
      return this.set('_cachedCurrentUserReaction', value);
    }
  })
});
