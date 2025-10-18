package services

import (
	"github.com/Bauka07/SocialApp/internal/database"
	"github.com/Bauka07/SocialApp/internal/models"
)

func SaveContactMessage(msg *models.Contact) error {
	return database.DB.Create(msg).Error
}
