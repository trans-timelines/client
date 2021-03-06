import Service from '@ember/service';
import { assign } from '@ember/polyfills';
import { inject as service } from '@ember/service';
import { isBlank } from '@ember/utils';

export default Service.extend({
  intl: service(),
  messageBus: service(),
  router: service(),

  restorePreviousState() {
    this._setProperties(this.get('_previousState'));
  },

  setTitleLink(name, linkRoute, linkModelId) {
    this._setProperties({
      title: {
        name,
        linkRoute,
        linkModelId
      }
    });
  },

  setTitle(name) {
    this._setProperties({
      title: {
        name
      }
    });
  },

  showSearchBar() {
    const action = (args) => {
      if (isBlank(args.searchValue)) document.getElementById('top_bar_search').focus();
      else if (/@[^\s#*@]+$/.test(args.searchValue)) {
        this.get('router').transitionTo('users.user.profile.index', args.searchValue.split('@')[1]);
      } else {
        this.get('router').transitionTo('search', { queryParams: { query: args.searchValue }});
      }
    };

    this._setProperties({
      canSearch: true,
      icon: {
        name: 'search',
        action,
        args: {}
      }
    });
  },

  showCloseComments() {
    const action = (args) => {
      this.get('messageBus').publish('closeComments');
    };

    this._setProperties({
      showingCloseComments: true,
      title: {
        name: this.get('intl').t('comments.comments')
      },
      icon: {
        name: 'angle-left',
        action
      },
    });
  },

  _setProperties(properties) {
    const action = () => {
      this.get('router').transitionTo('application');
    };

    this.set('_previousState', this.get('state'));

    this.set('state', assign({
      canSearch: false,
      icon: 'home',
      title: null,
      icon: {
        name: 'home',
        action
      }
    }, properties));
  }
});
