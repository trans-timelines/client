import { A } from '@ember/array';
import { isBlank, isEmpty } from '@ember/utils';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { oneWay, filterBy, mapBy } from '@ember/object/computed';
import EmberObject, { computed, get } from '@ember/object';
import { capitalize } from '@ember/string';
import { pluralize } from 'ember-inflector';

const Summary = EmberObject.extend({
  selected: computed('component.selectedTagNames', 'component.selectedUserNames', {
    get() {
      return this.get('type') === 'tag' ?
        this.get('component.selectedTagNames').includes(this.get('model.name')) :
        this.get('component.selectedUserNames').includes(this.get('model.username'));
    }
  }),
  selectedTimelineItemIds: oneWay('component.selectedTimelineItemIds'),
  isValid: computed('amount', 'component.filter', {
    get() {
      const name = this.get('model.name') || this.get('model.username');

      return this.amount > 0 && (isBlank(this.component.filter) || name.toLowerCase().indexOf(this.component.filter.toLowerCase()) > -1);
    }
  }),
  amount: computed('selectedTimelineItemIds.[]', {
    get() {
      const { timelineItemIds, selectedTimelineItemIds } = this.getProperties('timelineItemIds', 'selectedTimelineItemIds');

      if (selectedTimelineItemIds.length === 0) return timelineItemIds.length;

      const validTagTimelineItemIds = selectedTimelineItemIds.filter((id) => timelineItemIds.includes(id));

      return validTagTimelineItemIds.length;
    }
  })
})

export default Component.extend({
  filter: '',
  tagName: '',

  currentUser: service(),
  router: service(),

  selectedUsers: filterBy('users', 'selected'),
  selectedTags: filterBy('tags', 'selected'),

  clearButtonDisabled: computed('selectedTags.[]', 'selectedUsers.[]', {
    get() {
      return this.get('selectedTags.length') === 0 && this.get('selectedUsers.length') === 0;
    }
  }),

  currentSubmenu: computed('submenu', {
    get() {
      return this.get('submenu') || 'tags';
    }
  }),

  selectedTimelineItemIds: computed('selectedTags.[]', 'selectedUsers.[]', {
    get() {
      const { selectedUsers, selectedTags } = this.getProperties('selectedUsers', 'selectedTags');
      const selectedSummaries = selectedUsers.concat(selectedTags);

      if (isEmpty(selectedSummaries)) return [];

      const timelineItemIdSets = selectedSummaries.map((summary) => summary.get('timelineItemIds')).sort((a, b) => a.length - b.length);
      const smallestSet = timelineItemIdSets.shift();

      return smallestSet.reduce((selectedTimelineItemIds, timelineItemId) => {
        if (timelineItemIdSets.every((timelineItemIdSet) => timelineItemIdSet.includes(timelineItemId))) selectedTimelineItemIds.pushObject(timelineItemId);

        return selectedTimelineItemIds;
      }, A()).uniq();
    }
  }),

  sourceUsernames: computed('selectedUserNames.[]', {
    get() {
      return this.get('selectedUserNames').concat([this.get('tagSummaries.firstObject.subject.username')]);
    }
  }),

  users: computed('tagSummaries.[]', 'sourceUsernames.[]', {
    get() {
      return this._generateSummaries('user');
    }
  }),

  tags: computed('tagSummaries.[]', 'sourceUsernames.[]', {
    get() {
      return this._generateSummaries('tag');
    }
  }),

  _privateFollowedUsernames: computed('currentUser.user.followeds.@each.canViewPrivate', {
    get() {
      return (this.get('currentUser.user.followeds') || []).
        filter((follow) => follow.get('canViewPrivate')).
        map((follow) => follow.get('followed.username'));
    }
  }),

  _generateSummaries(type) {
    const privateFollowedUsernames = this.get('_privateFollowedUsernames');
    const tagSummaries = this.get('tagSummaries').filter((tagSummary) => this.get('sourceUsernames').includes(tagSummary.get('author.username')));

    return tagSummaries.reduce((summaries, tagSummary) => {
      const privateTimelineItemIds = get(tagSummary, 'privateTimelineItemIds');
      const items = get(tagSummary, `userTagSummary${pluralize(capitalize(type))}`);

      items.forEach((item) => {
        let timelineItemIds = item.get('timelineItemIds');
        if (!privateFollowedUsernames.includes(tagSummary.get('author.username'))) timelineItemIds = timelineItemIds.filter((id) => !privateTimelineItemIds.includes(id));

        if (timelineItemIds.length > 0) {
          const itemId = item.get(`${type}.id`);
          const previousSummary = summaries.find((summary) => summary.get('id') === itemId && summary.get('type') === type);

          if (previousSummary) {
            const previousTimelineItemIds = previousSummary.get('timelineItemIds');
            timelineItemIds.forEach((timelineItemId) => {
              if (!previousTimelineItemIds.includes(timelineItemId)) previousTimelineItemIds.push(timelineItemId);
            });
          } else {
            summaries.pushObject(Summary.create({
              id: itemId,
              model: item.get(type),
              type,
              timelineItemIds,
              component: this
            }))
          }
        }
      });

      return summaries;
    }, A());
  },

  actions: {
    clear() {
      this.get('router').transitionTo('users.user.profile', { queryParams: { tags: [], relationships: [], submenu: this.get('submenu') }})
      this.set('filter', '');
    },

    changeSubmenu(submenu) {
      const { selectedTagNames, selectedUserNames } = this.getProperties('selectedTagNames', 'selectedUserNames');
      this.get('router').transitionTo('users.user.profile', { queryParams: { tags: selectedTagNames, relationships: selectedUserNames, submenu: submenu === 'tags' ? null : submenu }});
    },

    filter(filter) {
      this.set('filter', filter);
    },

    toggleTag(tag) {
      const type = tag.get('type');
      const { selectedTagNames, selectedUserNames, submenu } = this.getProperties('selectedTagNames', 'selectedUserNames', 'submenu');

      if (type === 'tag') {
        const tagName = tag.get('model.name');
        this.get('router').transitionTo('users.user.timeline', { queryParams: { tags: [tagName] } });
        // const tags = selectedTagNames.includes(tagName) ? selectedTagNames.filter((tag) => tag !== tagName) : selectedTagNames.concat([tagName]);
        // this.get('router').transitionTo('users.user.profile', { queryParams: { tags, relationships: selectedUserNames, submenu }})
      } else if (type === 'user') {
        const username = tag.get('model.username');
        this.get('router').transitionTo('users.user.timeline', { queryParams: { relationships: [username] } });
        // const relationships = selectedUserNames.includes(username) ? selectedUserNames.filter((user) => user !== username) : selectedUserNames.concat([username]);
        // this.get('router').transitionTo('users.user.profile', { queryParams: { tags: selectedTagNames, relationships, submenu }});
        // this.attrs.addUserTagSummary(username);
      }
    }
  }
});
