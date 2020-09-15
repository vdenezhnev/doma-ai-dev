# Smart Air Key - Site
## Установка
`npm i`
## Запуск
`npx gulp serveDist`
## Сборка
Запустить `npm run build`, в папке dist появятся 2 бандла intercom и admin. При этом в каждой папке будет по два index.html.
Локализация версий приложений отличается только этими двумя файлами. Поэтому на стенде нужно настроить прокси след образом
/ru/intercom -> intercom/index-ru.html в качестве index.html, вся остальная статика из intercom
/en/intercom -> intercom/index-en.html в качестве index.html, вся остальная статика из intercom
/ru/admin -> admin/index-ru.html в качестве index.html, вся остальная статика из admin, англ локали нет
/en/admin -> ru/admin
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