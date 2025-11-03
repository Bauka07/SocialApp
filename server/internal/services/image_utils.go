package services

import (
	"errors"
	"mime/multipart"
	"path/filepath"
	"strings"
)

// ValidateImageFile validates uploaded image files
// Used by both user profile and post image uploads
func ValidateImageFile(fileHeader *multipart.FileHeader) error {
	// Check file size (max 10MB for posts, but this handles both)
	const maxSize = 10 * 1024 * 1024 // 10MB
	if fileHeader.Size > maxSize {
		return errors.New("image size must not exceed 10MB")
	}

	// Check file extension
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	validExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".webp": true,
	}

	if !validExts[ext] {
		return errors.New("only JPG, PNG, and WEBP images are allowed")
	}

	// Check MIME type
	contentType := fileHeader.Header.Get("Content-Type")
	validTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/webp": true,
	}

	if !validTypes[contentType] {
		return errors.New("invalid image format")
	}

	return nil
}

// ValidateUserImageFile validates user profile images (stricter - 5MB limit)
func ValidateUserImageFile(fileHeader *multipart.FileHeader) error {
	// Check file size (max 5MB for user profiles)
	const maxSize = 5 * 1024 * 1024 // 5MB
	if fileHeader.Size > maxSize {
		return errors.New("profile image size must not exceed 5MB")
	}

	// Check file extension
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	validExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".webp": true,
	}

	if !validExts[ext] {
		return errors.New("only JPG, PNG, and WEBP images are allowed")
	}

	// Check MIME type
	contentType := fileHeader.Header.Get("Content-Type")
	validTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/webp": true,
	}

	if !validTypes[contentType] {
		return errors.New("invalid image format")
	}

	return nil
}

// ValidatePostImageFile validates post images (10MB limit)
func ValidatePostImageFile(fileHeader *multipart.FileHeader) error {
	// Just use the main validation (10MB)
	return ValidateImageFile(fileHeader)
}
