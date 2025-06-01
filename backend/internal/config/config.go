package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
)

const (
	defaultServerPort         = "8080"
	defaultServerReadTimeout  = 10 * time.Second
	defaultServerWriteTimeout = 10 * time.Second
	defaultServerMaxBodyBytes = 32 * 1024 * 1024 // 32 MB

	defaultDBPort            = "5432"
	defaultDBMaxOpenConns    = 20
	defaultDBMaxIdleConns    = 20
	defaultDBConnMaxLifetime = time.Hour
)

type (
	Config struct {
		Server ServerConfig
		DB     DBConfig
		JWT    JWTConfig
		Storage StorageConfig
	}

	ServerConfig struct {
		Port         string
		ReadTimeout  time.Duration
		WriteTimeout time.Duration
		MaxBodyBytes int64
		Secure       bool
	}

	DBConfig struct {
		Host            string
		Port            string
		Username        string
		Password        string
		DBName          string
		SSLMode         string
		MaxOpenConns    int
		MaxIdleConns    int
		ConnMaxLifetime time.Duration
	}

	JWTConfig struct {
		SigningKey string
		TokenTTL   time.Duration
	}

	StorageConfig struct {
		MediaDir   string
		BaseURL    string
		MaxSize    int64
		AllowTypes []string
	}
)

// NewConfig создает новый экземпляр конфигурации
func NewConfig() *Config {
	if err := godotenv.Load(); err != nil {
		logrus.Warning("No .env file found, using environment variables")
	}

	return &Config{
		Server: ServerConfig{
			Port:         getEnv("SERVER_PORT", defaultServerPort),
			ReadTimeout:  getEnvAsDuration("SERVER_READ_TIMEOUT", defaultServerReadTimeout),
			WriteTimeout: getEnvAsDuration("SERVER_WRITE_TIMEOUT", defaultServerWriteTimeout),
			MaxBodyBytes: getEnvAsInt64("SERVER_MAX_BODY_BYTES", defaultServerMaxBodyBytes),
			Secure:       getEnvAsBool("SERVER_SECURE", false),
		},
		DB: DBConfig{
			Host:            getEnv("DB_HOST", "localhost"),
			Port:            getEnv("DB_PORT", defaultDBPort),
			Username:        getEnv("DB_USERNAME", "postgres"),
			Password:        getEnv("DB_PASSWORD", "postgres"),
			DBName:          getEnv("DB_NAME", "designhub"),
			SSLMode:         getEnv("DB_SSLMODE", "disable"),
			MaxOpenConns:    getEnvAsInt("DB_MAX_OPEN_CONNS", defaultDBMaxOpenConns),
			MaxIdleConns:    getEnvAsInt("DB_MAX_IDLE_CONNS", defaultDBMaxIdleConns),
			ConnMaxLifetime: getEnvAsDuration("DB_CONN_MAX_LIFETIME", defaultDBConnMaxLifetime),
		},
		JWT: JWTConfig{
			SigningKey: getEnv("JWT_SIGNING_KEY", "qrkjk#4#%35FSFJlja#4353KSFjH"),
			TokenTTL:   getEnvAsDuration("JWT_TOKEN_TTL", 24*time.Hour),
		},
		Storage: StorageConfig{
			MediaDir: getEnv("STORAGE_MEDIA_DIR", "./storage/media"),
			BaseURL:  getEnv("STORAGE_BASE_URL", "http://localhost:8080/media"),
			MaxSize:  getEnvAsInt64("STORAGE_MAX_SIZE", 10*1024*1024), // 10 MB
			AllowTypes: []string{
				"image/jpeg",
				"image/png",
				"image/gif",
				"video/mp4",
				"video/webm",
			},
		},
	}
}

// GetDSN возвращает строку подключения к базе данных
func (cfg *DBConfig) GetDSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.Username, cfg.Password, cfg.DBName, cfg.SSLMode,
	)
}

// Вспомогательные функции для получения значений из переменных окружения
func getEnv(key, defaultVal string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultVal
}

func getEnvAsInt(key string, defaultVal int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultVal
}

func getEnvAsInt64(key string, defaultVal int64) int64 {
	valueStr := getEnv(key, "")
	if value, err := strconv.ParseInt(valueStr, 10, 64); err == nil {
		return value
	}
	return defaultVal
}

func getEnvAsBool(key string, defaultVal bool) bool {
	valueStr := getEnv(key, "")
	if value, err := strconv.ParseBool(valueStr); err == nil {
		return value
	}
	return defaultVal
}

func getEnvAsDuration(key string, defaultVal time.Duration) time.Duration {
	valueStr := getEnv(key, "")
	if value, err := time.ParseDuration(valueStr); err == nil {
		return value
	}
	return defaultVal
} 