# Smart Air Key - Site
## Сборка
`npm run build` в папке dist появятся 3 бандла intercom в двух локалях и admin
## Локализация
Все локали хранятся в `app/translation/po` и `app/translation/po`. При необходимости добавления новые текстовок
В `html` добавляется илентификатор вместо текста и тег `translate`:
```html
<h1 class="page-title" translate>html.abonent.new_title</h1>
```
В `js` делается вызов функции согласно локали:
```js
gettextCatalog.getString('LockMaintenancePerMonth')
```
Потом вызывается `npm run extract-i18n` для генерации файлов с локалями `~/app/translation/po/*.po`, где делаются конкретные правки текста для каждой из локалей
Далее вызывается `npm run compile-i18n` для компиляции в js файлы для последующего использования в коде