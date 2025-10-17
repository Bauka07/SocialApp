package database

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	dsn := "postgresql://admin:r6CE8362jHPGblokTzsRrHDeehOe7gq6@dpg-d3p6ah15pdvs73adnj40-a.frankfurt-postgres.render.com/socapp"

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	DB = db
	fmt.Println("Database connected successfully")
}
