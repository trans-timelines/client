import Component from '@ember/component';
import { computed } from '@ember/object';
import NotificationComponentMixin from 'client/mixins/notification-component';

export default Component.extend(NotificationComponentMixin, {
  transitionToNotification() {
    this.get('router').transitionTo('users.user.profile.index', this.get('notification.follower.username'));
  },

  otherFollows: computed({
    get() {
      return this.get('notification.totalFollows') - 1;
    }
  })
});
