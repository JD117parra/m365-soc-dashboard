package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/m365-soc-dashboard/config"
	"github.com/yourusername/m365-soc-dashboard/handlers"
	"github.com/yourusername/m365-soc-dashboard/routes"
	"github.com/yourusername/m365-soc-dashboard/services"
)

func main() {
	cfg := config.Load()

	graphSvc := services.NewGraphService(cfg)
	securityHandler := handlers.NewSecurityHandler(graphSvc)

	r := gin.Default()
	routes.Setup(r, cfg, securityHandler)

	addr := ":" + cfg.Port
	log.Printf("SOC Dashboard server listening on %s", addr)

	if err := r.Run(addr); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
