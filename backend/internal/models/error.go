package models

// StandardError модель стандартной ошибки для API
type StandardError struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
	Detail  string `json:"detail,omitempty"`
}

// ValidationError модель ошибки валидации
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ValidationErrors список ошибок валидации
type ValidationErrors struct {
	Status int               `json:"status"`
	Errors []ValidationError `json:"errors"`
}
