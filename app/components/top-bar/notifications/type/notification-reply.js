import Component from '@ember/component';
import { computed } from '@ember/object';
import NotificationComponentMixin from 'client/mixins/notification-component';

export default Component.extend(NotificationComponentMixin, {
  transitionToNotification() {
    this.get('router').transitionTo('comments.comment', this.get('notification.comment.id'));
  },

  otherReplies: computed({
    get() {
      return this.get('notification.totalReplies') - 1;
    }
  })
});
