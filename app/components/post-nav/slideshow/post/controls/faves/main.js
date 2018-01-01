import { capitalize } from '@ember/string';
import { computed } from '@ember/object';
import { oneWay, alias, notEmpty } from '@ember/object/computed';
import { guidFor } from '@ember/object/internals';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import AuthenticatedActionMixin from 'client/mixins/authenticated-action';

export default Component.extend(AuthenticatedActionMixin, {
  tagName: '',

  disabled: false,
  types: ['moon', 'star', 'sun'],

  currentUser: service(),
  store: service(),

  user: oneWay('currentUser.user'),

  currentUserFav: alias('favable.currentUserFav.content'),
  faved: notEmpty('currentUserFav'),
  selectedCurrentType: oneWay('currentUserFav.type'),

  currentType: computed('selectedCurrentType', {
    get() {
      return this.get('selectedCurrentType') || 'star';
    }
  }),

  currentFavId: computed({
    get() {
      return `${guidFor(this)}_current_fav`;
    }
  }),

  currentFavIdHash: computed('currentFavId', {
    get() {
      return `#${this.get('currentFavId')}`
    }
  }),

  _handleSelection(type) {
    const { favable, user }= this.getProperties('favable', 'user');

    if (this.get('shouldDisplayAllTypes')) {
      if (this.get('faved')) {
        this._changeFavType(type, favable);
      } else {
        this._createNewFav(type, user, favable);
      }
    } else {
      if (this.get('faved')) {
        this._destroyFav(favable);
      } else {
        this._createNewFav(type, user, favable);
      }
    }
  },

  _createNewFav(type, user, favable) {
    this.set('disabled', true);
    this.get('store').createRecord('fav', {
      user,
      favable,
      type
    }).save().then((fav) => {
      favable.set('currentUserFav', fav);
      favable.incrementProperty('totalFaves');
      favable.incrementProperty(`total${capitalize(type)}s`);
    }).finally(() => {
      this.setProperties({
        disabled: false,
        shouldDisplayAllTypes: false
      });
    });
  },

  _changeFavType(newType, favable) {
    const currentUserFav = this.get('currentUserFav');
    const previousType = currentUserFav.get('type');

    if (previousType !== newType) {
      currentUserFav.set('type', newType);
      this.set('disabled', true);
      currentUserFav.save().then(() => {
        favable.decrementProperty(`total${capitalize(previousType)}s`);
        favable.incrementProperty(`total${capitalize(newType)}s`);
      }).catch(() => {
        currentUserFav.set('type', previousType);
      }).finally(() => {
        this.setProperties({
          disabled: false,
          shouldDisplayAllTypes: false
        });
      });
    } else {
      this.set('shouldDisplayAllTypes', false);
    }
  },

  _destroyFav(favable) {
    const currentUserFav = this.get('currentUserFav');
    const previousType = currentUserFav.get('type');

    this.set('disabled', true);
    currentUserFav.destroyRecord().then(() => {
      this.set('favable.currentUserFav', null);
      favable.decrementProperty('totalFaves');
      favable.decrementProperty(`total${capitalize(previousType)}s`);
    }).finally(() => {
      this.set('disabled', false);
    });
  },

  actions: {
    completeDisplayAllTypes() {
      this.set('isOpeningDisplayAllTypes', false);
    },

    displayAllTypes() {
      this.setProperties({
        isOpeningDisplayAllTypes: true,
        shouldDisplayAllTypes: true,
      });
    },

    selectType(type) {
      this.authenticatedAction().then(() => {
        if (!this.get('disabled')) this._handleSelection(type);
      }).catch(() => {
        this.setProperties({
          currentType: type,
          shouldDisplayAllTypes: false
        });
      });
    }
  }
});
