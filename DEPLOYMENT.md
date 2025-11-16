# Инструкция по развертыванию SocialApp на VPS

## Предварительные требования

1. Ubuntu/Debian VPS сервер
2. Доменное имя maqsatto.tech настроено на IP вашего сервера
3. SSH доступ к серверу

## Шаг 1: Установка зависимостей на сервере

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Установка Go 1.21+
wget https://go.dev/dl/go1.25.2.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.25.2.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Установка Nginx
sudo apt install -y nginx

# Установка Certbot для SSL
sudo apt install -y certbot python3-certbot-nginx

# Установка PostgreSQL (если нужно)
sudo apt install -y postgresql postgresql-contrib

# Установка PM2 для управления процессами
sudo npm install -g pm2
```

## Шаг 2: Клонирование проекта

```bash
# Создать директорию для проекта
mkdir -p ~/projects
cd ~/projects

# Клонировать репозиторий
git clone https://github.com/Bauka07/SocialApp.git
cd SocialApp
```

## Шаг 3: Настройка Backend (Go)

```bash
cd ~/projects/SocialApp/server

# Создать .env файл
nano .env
```

Добавьте в .env:
```env
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=socialapp
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=https://maqsatto.tech
ENV=production
```

```bash
# Установить Go зависимости
go mod download

# Собрать проект
go build -o socialapp ./cmd/main.go

# Запустить с PM2
pm2 start ./socialapp --name "socialapp-backend"
pm2 save
pm2 startup
```

## Шаг 4: Настройка Frontend (React + Vite)

```bash
cd ~/projects/SocialApp/client

# Создать .env файл
nano .env
```

Добавьте в .env:
```env
VITE_API_URL=https://maqsatto.tech/api
VITE_GOOGLE_CLIENT_ID=78805272321-hh7q631f2pj8ljv4rm6fvtoet9rguho1.apps.googleusercontent.com
VITE_RECAPTCHA_SITE_KEY=6LdE4Q0sAAAAAJK7dB03Q2S0CfdJe1A3yQ3x0p_m
```

```bash
# Установить зависимости
npm install

# Запустить в режиме разработки с PM2
pm2 start npm --name "socialapp-frontend" -- run dev

# ИЛИ собрать production версию и использовать serve
npm run build
pm2 serve dist 5173 --name "socialapp-frontend" --spa

pm2 save
```

## Шаг 5: Настройка Nginx

```bash
# Скопировать конфигурацию nginx
sudo cp ~/projects/SocialApp/nginx-production.conf /etc/nginx/sites-available/maqsatto.tech

# Создать символическую ссылку
sudo ln -s /etc/nginx/sites-available/maqsatto.tech /etc/nginx/sites-enabled/

# Удалить дефолтную конфигурацию
sudo rm /etc/nginx/sites-enabled/default

# Проверить конфигурацию
sudo nginx -t

# Перезапустить Nginx
sudo systemctl restart nginx
```

## Шаг 6: Получение SSL сертификата

```bash
# Получить SSL сертификат от Let's Encrypt
sudo certbot --nginx -d maqsatto.tech -d www.maqsatto.tech

# Certbot автоматически настроит SSL в nginx конфигурации
# Сертификат будет автоматически обновляться
```

## Шаг 7: Настройка Firewall

```bash
# Разрешить HTTP, HTTPS и SSH
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## Управление приложением

### Посмотреть статус процессов
```bash
pm2 status
```

### Посмотреть логи
```bash
# Все логи
pm2 logs

# Backend логи
pm2 logs socialapp-backend

# Frontend логи
pm2 logs socialapp-frontend
```

### Перезапустить приложение
```bash
pm2 restart socialapp-backend
pm2 restart socialapp-frontend
```

### Остановить приложение
```bash
pm2 stop socialapp-backend
pm2 stop socialapp-frontend
```

## Обновление проекта

```bash
cd ~/projects/SocialApp

# Получить последние изменения
git pull

# Обновить backend
cd server
go build -o socialapp ./cmd/main.go
pm2 restart socialapp-backend

# Обновить frontend
cd ../client
npm install
npm run build
pm2 restart socialapp-frontend
```

## Альтернатива: Использование npm run dev и go run

Если вы хотите запускать в режиме разработки:

```bash
# Backend
cd ~/projects/SocialApp/server
pm2 start "go run ./cmd/main.go" --name "socialapp-backend"

# Frontend
cd ~/projects/SocialApp/client
pm2 start "npm run dev" --name "socialapp-frontend"

pm2 save
```

## Мониторинг

```bash
# Установить PM2 мониторинг
pm2 monitor

# Просмотр использования ресурсов
pm2 monit
```

## Автоматическое обновление SSL сертификата

Certbot автоматически добавит задачу в cron для обновления сертификата.
Проверить:
```bash
sudo systemctl status certbot.timer
```

## Проверка работы

1. Откройте браузер и перейдите на https://maqsatto.tech
2. Фронтенд должен открыться
3. API должен быть доступен по https://maqsatto.tech/api
4. WebSocket должен работать по wss://maqsatto.tech/ws

## Troubleshooting

### Проверить порты
```bash
sudo netstat -tulpn | grep LISTEN
```

### Проверить логи Nginx
```bash
sudo tail -f /var/log/nginx/maqsatto.tech.error.log
sudo tail -f /var/log/nginx/maqsatto.tech.access.log
```

### Проверить статус Nginx
```bash
sudo systemctl status nginx
```

### Перезагрузить Nginx
```bash
sudo systemctl reload nginx
```
