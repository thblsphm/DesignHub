package service

import (
	"context"
	"designhub/internal/models"
	"designhub/internal/repository"
	"fmt"
	"regexp"
	"strings"
	"time"
)

type CategoryService struct {
	categoryRepo repository.Category
}

func NewCategoryService(categoryRepo repository.Category) *CategoryService {
	return &CategoryService{categoryRepo: categoryRepo}
}

// Create создает новую категорию
func (s *CategoryService) Create(ctx context.Context, category models.CategoryCreate) (int, error) {
	// Генерируем slug из названия категории
	slug := generateSlug(category.Name)

	// Проверяем уникальность slug
	exists, err := s.categoryRepo.SlugExists(ctx, slug)
	if err != nil {
		return 0, fmt.Errorf("failed to check slug existence: %w", err)
	}
	if exists {
		return 0, fmt.Errorf("категория с таким slug уже существует")
	}

	// Создаем категорию
	newCategory := models.Category{
		Name:      category.Name,
		Slug:      slug,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	return s.categoryRepo.Create(ctx, newCategory)
}

// GetById получает категорию по ID
func (s *CategoryService) GetByID(ctx context.Context, id int) (models.Category, error) {
	return s.categoryRepo.GetByID(ctx, id)
}

// GetAll получает все категории
func (s *CategoryService) GetAll(ctx context.Context) ([]models.Category, error) {
	return s.categoryRepo.GetAll(ctx)
}

// Update обновляет категорию
func (s *CategoryService) Update(ctx context.Context, id int, category models.CategoryUpdate) error {
	// Проверяем, что категория существует
	_, err := s.categoryRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("category not found: %w", err)
	}

	// Если название изменилось, генерируем новый slug
	var slug string
	if category.Name != "" {
		slug = generateSlug(category.Name)

		// Проверяем уникальность slug
		exists, err := s.categoryRepo.SlugExistsExcept(ctx, slug, id)
		if err != nil {
			return fmt.Errorf("failed to check slug existence: %w", err)
		}
		if exists {
			return fmt.Errorf("категория с таким slug уже существует")
		}
	}

	// Обновляем категорию
	updatedCategory := models.Category{
		ID:        id,
		Name:      category.Name,
		Slug:      slug,
		UpdatedAt: time.Now(),
	}

	return s.categoryRepo.Update(ctx, updatedCategory)
}

// Delete удаляет категорию
func (s *CategoryService) Delete(ctx context.Context, id int) error {
	// Проверяем, что категория существует
	_, err := s.categoryRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("category not found: %w", err)
	}

	// Проверяем, что категория не используется в постах
	hasRelatedPosts, err := s.categoryRepo.HasRelatedPosts(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to check related posts: %w", err)
	}
	if hasRelatedPosts {
		return fmt.Errorf("невозможно удалить категорию, так как она используется в постах")
	}

	// Удаляем категорию
	return s.categoryRepo.Delete(ctx, id)
}

// generateSlug генерирует slug из названия категории
func generateSlug(name string) string {
	// Преобразуем в нижний регистр
	slug := strings.ToLower(name)

	// Заменяем пробелы на дефисы
	slug = strings.ReplaceAll(slug, " ", "-")

	// Удаляем специальные символы
	reg := regexp.MustCompile("[^a-z0-9-]")
	slug = reg.ReplaceAllString(slug, "")

	// Удаляем дублирующиеся дефисы
	reg = regexp.MustCompile("-+")
	slug = reg.ReplaceAllString(slug, "-")

	// Удаляем дефисы с начала и конца
	slug = strings.Trim(slug, "-")

	return slug
}
