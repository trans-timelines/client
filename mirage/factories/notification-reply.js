import { Factory, faker } from 'ember-cli-mirage';

export default Factory.extend({
  date: faker.date.past,

  totalReplies: 5
});
