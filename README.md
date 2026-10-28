# SpiritusVenti — Django без базы данных

## Временная ссылка в интернете с ноутбука

```powershell
.venv\Scripts\python.exe host_public.py
```

Скрипт запускает Waitress и Cloudflare Tunnel, выводит HTTPS-ссылку и сохраняет её в `public-url.txt`. Оставьте окно открытым, ноутбук включённым и подключённым к интернету. Сон ноутбука прерывает доступ. После перезапуска адрес меняется. Для остановки нажмите Ctrl+C или выполните в другом окне:

```powershell
.venv\Scripts\python.exe host_public.py --stop
```

Если сервер запущен в фоне, ссылка находится в `public-url.txt`, журналы — в `.hosting/`. Повторный запуск блокируется, пока работает предыдущий экземпляр.

Если в `.hosting/tunnel.log` появляется `failed to request quick Tunnel` / `context deadline exceeded`, ноутбук не получил ответ от `api.trycloudflare.com`. Проверьте подключение через другую сеть или VPN и повторите запуск. Пока адрес не появился в `public-url.txt`, сайт не опубликован.

Для этого режима отладка автоматически отключается, создаётся случайный секретный ключ, разрешается только выданный публичный домен и локальные адреса. Waitress слушает только loopback, считает запросы HTTPS, поскольку публичный доступ идёт через HTTPS-туннель. Настройки `.env` для обычной локальной разработки не изменяются. SMTP берётся из `.env`.

Утилита `tools/cloudflared.exe` загружается из [официальных релизов Cloudflare](https://github.com/cloudflare/cloudflared/releases/latest). [Quick Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/) предназначен для временного показа и тестирования, без гарантии постоянной доступности. Для постоянного адреса нужен управляемый туннель с доменом.

## Запуск на Windows

В PowerShell из этой папки:

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.venv\Scripts\python.exe manage.py runserver
```

Откройте http://127.0.0.1:8000/. Страница теперь является Django-шаблоном: открывать index.html двойным щелчком не нужно. Если `.env` уже настроен, не перезаписывайте его.

## Структура

```text
manage.py               команды Django
config/                 настройки, маршруты, WSGI и ASGI
website/
  forms.py              проверка полей заявки
  views.py              страница и отправка email
  urls.py               маршруты / и /api/contact/
  tests.py              проверки без базы данных
index.html              шаблон страницы
static/script.js        галерея, меню, форма, анимации
static/style.css        оформление
assets/gallery/         локальные изображения
.env.example            образец настроек
requirements.txt        зависимости
```

База данных, ORM-модели, миграции, авторизация и Django admin не используются. Команду migrate запускать не нужно. Заявки не сохраняются на диске: сервер передаёт их по SMTP. Без настроенного SMTP форма сообщает о недоступности отправки, а не показывает ложный успех.

## Почта

Заполните `.env` данными своего почтового провайдера:

```dotenv
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_HOST_USER=site@example.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=true
EMAIL_USE_SSL=false
DEFAULT_FROM_EMAIL=site@example.com
CONTACT_EMAIL=owner@example.com
```

Для порта 465 обычно нужны `EMAIL_USE_TLS=false` и `EMAIL_USE_SSL=true`. Адрес отправителя должен быть разрешён провайдером. Ответ на письмо направляется на email клиента, если он заполнен. После изменения настроек перезапустите сервер.

Форма отправляет POST с CSRF-токеном на `/api/contact/`. Сервер проверяет имя, телефон, email и длину сообщения. Ответы: 200 — SMTP принял письмо; 400 — ошибка полей; 403 — неверный CSRF-токен; 502 — ошибка почтового сервера; 503 — почта не настроена. Принятие SMTP не гарантирует попадание во входящие.

## Элементы страницы

Навигация и кнопки ведут к разделам; галерея и просмотр фотографий работают через JavaScript; телефон и email используют `tel:` и `mailto:`. Соцсети остаются в футере. Реальные контактные данные редактируются в `index.html`. Facebook и Twitter / X пока имеют исходные ссылки `#`: замените их адресами ваших профилей. Instagram использует существующий адрес. Часть фото по-прежнему загружается с внешних сайтов; список находится в `static/script.js`.

## Проверка

```powershell
.venv\Scripts\python.exe manage.py check
.venv\Scripts\python.exe manage.py test
```

Тесты используют почту в оперативной памяти, не отправляют реальные письма и не создают базу данных.

## Размещение на сервере

Укажите `DJANGO_DEBUG=false`, длинный случайный `DJANGO_SECRET_KEY` и домен в `DJANGO_ALLOWED_HOSTS`. Настройте HTTPS перед приложением. Затем:

```powershell
.venv\Scripts\python.exe manage.py collectstatic --noinput
.venv\Scripts\waitress-serve.exe --listen=127.0.0.1:8000 config.wsgi:application
```

WhiteNoise раздаёт собранную статику. Прокси должен направлять запросы сайта на этот адрес; настройки доверенного прокси зависят от хостинга. Для публичной формы настройте ограничение частоты запросов на прокси. `.env` не публикуйте.

Отправка почты основана на [EmailMessage в документации Django](https://docs.djangoproject.com/en/5.2/topics/email/).

## Редактирование контента и публикация

Данные компании находятся в `website/content.py`. Старые цифры, сроки, гарантии и утверждения сохранены в `UNVERIFIED_COMPANY_DETAILS` и не выводятся посетителям. Контакты из `CONTACT_DETAILS` видны только после установки `verified: True` для конкретного подтверждённого значения. Не отмечайте демонстрационные контакты как подтверждённые. Фотографии в галерее подписаны как иллюстрации, а не как подтверждённые проекты компании.

Форма использует существующий `/api/contact/` с CSRF и серверной валидацией. Пока не заполнены `EMAIL_HOST`, `DEFAULT_FROM_EMAIL` и `CONTACT_EMAIL`, поля и отправка отключены с понятным сообщением. Наличие настроек не подтверждает доставку: форма показывает успех только после положительного ответа SMTP; ошибки остаются видны рядом с формой, введённые данные сохраняются. Настройте SMTP в переменных окружения сервера, не в публичном контенте.

Перед перезапуском на Render выполните:

```text
python manage.py collectstatic --noinput
```

Стили, скрипты и изображения используют manifest-хеши: новая версия получает новый URL, поэтому браузер не должен сохранять старое оформление после деплоя. Сбор статических файлов обязателен перед запуском production-сервера.

Проверки без отправки реальных писем:

```text
python manage.py check
python manage.py test
```

Браузерная проверка (дополнительные инструменты разработки: `pip install playwright Pillow`; установлен Microsoft Edge): запустите `python manage.py runserver 127.0.0.1:8765 --noreload`, затем `python tools/verify_layout.py`. Она проверяет 320, 375, 768, 1024 и 1440 px, якоря, клавиатуру, галерею, режим уменьшенного движения и отключённый JavaScript. Ответы формы подменяются в браузере, реальные заявки не отправляются. Скриншоты и отчёт сохраняются в `.hosting/design-review/`.

`python tools/optimize_gallery.py` создаёт WebP-миниатюры и изображения для увеличенного просмотра из сохранённых оригиналов (нужен Pillow). Эти инструменты не требуются для работы сайта на сервере.
