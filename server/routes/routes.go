package routes

import (
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/yourusername/m365-soc-dashboard/config"
	"github.com/yourusername/m365-soc-dashboard/handlers"
	"github.com/yourusername/m365-soc-dashboard/middleware"
)

// Setup registers all routes and middleware on the provided Gin engine.
func Setup(r *gin.Engine, cfg *config.Config, h *handlers.SecurityHandler) {
	// CORS — allow the Vite dev server and any same-origin production request.
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodOptions},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
		MaxAge:           12 * 60 * 60, // 12 hours preflight cache
	}))

	// Health check — no auth required.
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Authenticated API routes.
	api := r.Group("/api", middleware.AuthMiddleware(cfg))
	{
		api.GET("/security/alerts", h.GetAlerts)
		api.GET("/security/incidents", h.GetIncidents)
		api.GET("/identity/riskyUsers", h.GetRiskyUsers)
		api.GET("/security/secureScores", h.GetSecureScores)
	}

	// WebSocket endpoint.
	// Browsers cannot send custom headers during a WebSocket upgrade, so the
	// client passes the access token as a query parameter: /ws?token=<token>
	r.GET("/ws", func(c *gin.Context) {
		tokenStr := c.Query("token")
		if tokenStr == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing token query parameter"})
			return
		}

		if _, err := middleware.ValidateTokenPublic(tokenStr, cfg); err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		h.HandleWebSocket(c)
	})
}
