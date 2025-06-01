package server

import (
	"context"
	"designhub/internal/config"
	"net/http"
)

// Server представляет HTTP сервер
type Server struct {
	httpServer *http.Server
}

// NewServer создает новый экземпляр сервера
func NewServer(cfg config.ServerConfig, handler http.Handler) *Server {
	return &Server{
		httpServer: &http.Server{
			Addr:           ":" + cfg.Port,
			Handler:        handler,
			MaxHeaderBytes: 1 << 20, // 1 MB
			ReadTimeout:    cfg.ReadTimeout,
			WriteTimeout:   cfg.WriteTimeout,
		},
	}
}

// Run запускает HTTP сервер
func (s *Server) Run() error {
	return s.httpServer.ListenAndServe()
}

// Shutdown выполняет корректное завершение работы сервера
func (s *Server) Shutdown(ctx context.Context) error {
	return s.httpServer.Shutdown(ctx)
}
