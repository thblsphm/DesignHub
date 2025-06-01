package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"designhub/internal/config"
	"designhub/internal/handler"
	"designhub/internal/repository"
	"designhub/internal/server"
	"designhub/internal/service"
	"designhub/pkg/migration"
	"designhub/pkg/storage"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
	"github.com/sirupsen/logrus"
)

// @title DesignHub API
// @version 1.0
// @description API для платформы публикации дизайнерских работ

// @host localhost:8080
// @BasePath /api/v1

// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name Authorization

func main() {
	// Инициализация логгера
	logrus.SetFormatter(&logrus.JSONFormatter{})
	logrus.SetOutput(os.Stdout)

	// Загрузка конфигурации
	cfg := config.NewConfig()

	// Инициализация БД
	db, err := initDB(cfg.DB)
	if err != nil {
		logrus.Fatalf("Failed to initialize db: %s", err.Error())
	}
	defer db.Close()

	// Запуск миграций базы данных
	if err := migration.RunMigrations(db, "migrations"); err != nil {
		logrus.Fatalf("Failed to run database migrations: %s", err.Error())
	}

	// Инициализация хранилища файлов
	fileStorage, err := storage.NewLocalStorage(cfg.Storage.MediaDir, cfg.Storage.BaseURL)
	if err != nil {
		logrus.Fatalf("Failed to initialize file storage: %s", err.Error())
	}

	// Инициализация слоев приложения
	repos := repository.NewRepository(db)
	services := service.NewService(repos, db, fileStorage)
	handlers := handler.NewHandler(services, fileStorage, cfg)

	// Инициализация HTTP сервера
	srv := server.NewServer(cfg.Server, handlers.InitRoutes())

	// Запуск сервера в горутине
	go func() {
		if err := srv.Run(); err != nil {
			logrus.Fatalf("Error occurred while running server: %s", err.Error())
		}
	}()

	logrus.Printf("DesignHub server started on port %s", cfg.Server.Port)

	// Ожидание сигнала для изящного завершения работы
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logrus.Print("DesignHub server shutting down...")

	// Установка тайм-аута для завершения работы сервера
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logrus.Fatalf("Server forced to shutdown: %s", err.Error())
	}

	logrus.Print("DesignHub server exited properly")
}

// initDB инициализирует подключение к базе данных
func initDB(cfg config.DBConfig) (*sqlx.DB, error) {
	db, err := sqlx.Open("postgres", cfg.GetDSN())
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(cfg.MaxOpenConns)
	db.SetMaxIdleConns(cfg.MaxIdleConns)
	db.SetConnMaxLifetime(cfg.ConnMaxLifetime)

	return db, nil
}
