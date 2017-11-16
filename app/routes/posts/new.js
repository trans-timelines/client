import { computed, get, set } from '@ember/object';
import { oneWay } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { isBlank, typeOf } from '@ember/utils';
import Route from '@ember/routing/route';
import { task } from 'ember-concurrency';
import config from '../../config/environment';

export default Route.extend({
  currentUser: service(),
  fileQueue: service(),

  user: oneWay('currentUser.user'),

  model() {
    const user = this.get('user');

    return this.store.createRecord('post', {
      user,
      date: Date.now()
    });
  },

  queue: computed({
    get() {
      const queues = get(this, 'fileQueue');
      return queues.find('uploadQueue') ||
             queues.create('uploadQueue');
    }
  }),


  uploadImageTask: task(function * (panel) {
    const file = panel.get('file');

    if (isBlank(file)) return;

    try {
      const dataURL = yield file.readAsDataURL();
      const img = document.createElement('img');
      const canvas = document.createElement('canvas');
      canvas.height = 1350;
      canvas.width = 1080;
      img.src = dataURL;

      img.onload = () => {
        if (img.naturalHeight / img.naturalWidth < 1350 / 1080) {
          const width = (img.naturalHeight / 1350) * 1080;
          const percentX = panel.get('positioning.x') / 100;
          const startX = (percentX * img.naturalWidth) - (percentX * width);

          canvas.getContext('2d').drawImage(img, startX, 0, width, img.naturalHeight, 0, 0, 1080, 1350);
        } else {
          const height = (img.naturalWidth / 1080) * 1350;
          const percentY = panel.get('positioning.y') / 100;
          const startY = (percentY * img.naturalHeight) - (percentY * height);

          canvas.getContext('2d').drawImage(img, 0, startY, img.naturalWidth, height, 0, 0, 1080, 1350);
        }

        canvas.toBlob((blob) => {
          blob.name = get(file, 'name');
          const [newFile] = this.get('queue')._addFiles([blob], 'blob');
          newFile.upload(`${config.rootURL}images/upload`).then((result) => {
            set(panel, 'src', get(result, 'body.data.attributes.src'));
            panel.save();
          });
        }, 'image/jpeg');
      }
    } catch (e) {
      console.log(e);
    }
  }).maxConcurrency(3).enqueue(),

  actions: {
    uploadFile(file, type) {
      get(this, 'uploadImageTask').perform(file, type);
    },

    submit(model) {
      model.get('panels').forEach((panel) => {
        get(this, 'uploadImageTask').perform(panel);
      });
      model.save();
    }
  }
});
