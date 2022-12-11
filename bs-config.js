const { ESLint } = require('eslint');

const JS_FILES = 'build/js/**/*.js';

module.exports = {
  server: 'build',
  ui: false,
  files: [
    {
      match: ['build/*.html', 'build/css/**/*.css'],
    },
    {
      match: JS_FILES,
      async fn() {
        try {
          const eslint = new ESLint();
          const results = await eslint.lintFiles(JS_FILES);
          const formatter = await eslint.loadFormatter('stylish');

          if (results.filter(({ messages }) => messages.length).length) {
            console.log(formatter.format(results));
          }
          this.reload();
        } catch (err) {
          process.exitCode = 1;
          console.error(err);
        }
      },
    },
  ],
};
