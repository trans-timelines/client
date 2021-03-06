import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';

export default Route.extend(AuthenticatedRouteMixin, {
  currentUser: service(),
  intl: service(),
  paperToaster: service(),
  topBarManager: service(),

  beforeModel(...args) {
    this._super(...args);

    const title = this.get('intl').t('account.account');

    this.set('titleToken', title);
    this.get('topBarManager').setTitle(title);
  },

  model() {
    return {
      emailChange: this.store.createRecord('email-change'),
      passwordChange: this.store.createRecord('user-password'),
      currentUser: this.currentUser.user
    }
  },

  actions: {
    changeEmail(changeset, resolve, reject) {
      changeset.save().then(() => {
        this.store.unloadAll('email-change');
        this.set('controller.model.emailChange', this.store.createRecord('email-change'));
        this.get('paperToaster').show(this.get('intl').t('account.emailChangeSuccess'), {
          duration: 4000
        });
        resolve();
      }).catch((...args) => {
        reject(...args);
      });
    },

    changePassword(changeset, resolve, reject) {
      changeset.save().then(() => {
        this.store.unloadAll('user-password');
        this.set('controller.model.passwordChange', this.store.createRecord('user-password'));
        this.get('paperToaster').show(this.get('intl').t('account.passwordChangeSuccess'), {
          duration: 4000
        });
        resolve();
      }).catch((...args) => {
        reject(...args);
      });
    },

    toggleIsPublic() {
      this.currentUser.user.toggleProperty('isPublic');
      this.currentUser.user.save().then(() => {
        this.get('paperToaster').show(this.get('intl').t(`users.${this.currentUser.user.isPublic ? 'isPublicPublicChangeSuccess' : 'isPublicPrivateChangeSuccess'}`), {
          duration: 4000
        });
      });
    },

    willTransition(...args) {
      this.store.unloadAll('email-change');
      this.store.unloadAll('user-password');
    }
  }
});
