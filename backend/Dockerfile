# Этап сборки
FROM golang:1.22-alpine3.19 AS builder

WORKDIR /build

# Копирование и кэширование Go модулей
COPY go.mod go.sum ./

# Игнорируем ошибки версии Go при скачивании модулей
RUN GOTOOLCHAIN=auto go mod download || true

# Копирование исходного кода
COPY . .

# Устанавливаем все зависимости и собираем приложение
RUN GOTOOLCHAIN=auto CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app ./cmd/app/main.go

# Финальный этап сборки
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

# Создание директорий для хранения медиафайлов
RUN mkdir -p /app/storage/media

# Копирование собранного приложения
COPY --from=builder /build/app /app/
COPY --from=builder /build/migrations /app/migrations

# Открытие порта
EXPOSE 8080

# Запуск приложения
CMD ["/app/app"] 