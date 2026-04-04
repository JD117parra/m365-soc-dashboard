package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all environment-driven configuration for the server.
type Config struct {
	TenantID     string
	ClientID     string
	ClientSecret string
	Port         string
}

// Load reads configuration from environment variables.
// It attempts to load a .env file first; missing files are silently ignored
// so that production environments can rely on real env vars.
func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment")
	}

	cfg := &Config{
		TenantID:     os.Getenv("TENANT_ID"),
		ClientID:     os.Getenv("CLIENT_ID"),
		ClientSecret: os.Getenv("CLIENT_SECRET"),
		Port:         os.Getenv("PORT"),
	}

	if cfg.Port == "" {
		cfg.Port = "8080"
	}

	if cfg.TenantID == "" || cfg.ClientID == "" || cfg.ClientSecret == "" {
		log.Println("Warning: TENANT_ID, CLIENT_ID, or CLIENT_SECRET is not set. Graph API calls will fail.")
	}

	return cfg
}
