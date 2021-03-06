const Editor = require('./editor');
const axios = require('axios');
const Vue = require('vue');
const UIkit = require('uikit');

// для объекта window создаем свойство editor, куда записываем наш созданный класс Editor
window.editor = new Editor();

// сохранение vue в шлобальную переменную window.vue, чтобы к ней можно было обращаться из других модулей
window.vue = new Vue({
  el: '#app',
  data() {
    return {
      // имя текущей редактируемой страницы
      page: 'index.html',
      showLoader: true,
      pageList: [],
      backupList: [],
      meta: {
        title: '',
        keywords: '',
        description: '',
      },
      auth: false,
      password: '',
      loginError: false,
    };
  },
  methods: {
    onBtnSave() {
      this.enableLoader();
      window.editor.save(
        () => {
          this.loadBackupList();
          this.disableLoader();
          UIkit.notification({ message: 'Опубликовано', status: 'success' });
        },
        () => {
          this.disableLoader();
          this.errorNotification('Ошибка сохранения');
        }
      );
    },
    openPage(page) {
      this.page = page;
      this.loadBackupList();
      this.enableLoader();
      window.editor.open(page, () => {
        this.disableLoader();
        this.meta = window.editor.metaEditor.getMeta();
      });
    },
    loadBackupList() {
      axios.get('./backups/backups.json').then(res => {
        this.backupList = res.data.filter(backup => {
          return backup.page === this.page;
        });
      });
    },
    restoreBackup(backup) {
      UIkit.modal
        .confirm(
          'Вы действительно хотите восстановить страницу из этой резервной копии? Все несохраненные изменения будут утеряны.',
          {
            labels: {
              ok: 'Восстановить',
              cancel: 'Отмена',
            },
          }
        )
        .then(() => {
          this.enableLoader();
          return axios.post('./api/restoreBackup.php', {
            page: this.page,
            file: backup.file,
          });
        })
        .then(() => {
          this.openPage(this.page);
        });
    },
    applyMeta() {
      window.editor.metaEditor.setMeta(
        this.meta.title,
        this.meta.keywords,
        this.meta.description
      );
    },
    enableLoader() {
      this.showLoader = true;
    },
    disableLoader() {
      this.showLoader = false;
    },
    errorNotification(msg) {
      UIkit.notification({
        message: msg,
        status: 'danger',
      });
    },
    login() {
      if (this.password.length > 5) {
        axios.post('./api/login.php', { password: this.password })
          .then(res => {
            if (res.data.auth) {
              this.auth = true;
              this.start();
            } else {
              this.loginError = true;
            }
        });
      } else {
        this.loginError = true;
      }
    },
    logout() {
      axios.get('./api/logout.php')
        .then(() => {
          this.auth = false;
          window.location.replace('/');
      });
    },
    start() {
      this.openPage(this.page);

      axios.get('./api/pageList.php')
        .then(res => {
          this.pageList = res.data;
      });

      this.loadBackupList();
    },
  },
  created() {
    axios.get('./api/checkAuth.php')
      .then(res => {
        if(res.data.auth) {
          this.auth = res.data.auth;
          this.start()
        }
        
    });
  },
});
