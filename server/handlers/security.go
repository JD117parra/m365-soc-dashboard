package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/m365-soc-dashboard/services"
	"nhooyr.io/websocket"
	"nhooyr.io/websocket/wsjson"
)

// SecurityHandler exposes HTTP and WebSocket handlers for the Graph Security API.
type SecurityHandler struct {
	graphSvc *services.GraphService
}

// NewSecurityHandler creates a SecurityHandler backed by the given GraphService.
func NewSecurityHandler(graphSvc *services.GraphService) *SecurityHandler {
	return &SecurityHandler{graphSvc: graphSvc}
}

// respond writes raw JSON bytes returned by the Graph service directly to the
// response, avoiding a round-trip through Go structs for maximum flexibility.
func respond(c *gin.Context, data []byte, err error) {
	if err != nil {
		log.Printf("graph service error: %v", err)
		c.AbortWithStatusJSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	// Validate that the body is JSON before forwarding.
	if !json.Valid(data) {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "invalid JSON from Graph API"})
		return
	}

	c.Data(http.StatusOK, "application/json; charset=utf-8", data)
}

// GetAlerts handles GET /api/security/alerts
func (h *SecurityHandler) GetAlerts(c *gin.Context) {
	data, err := h.graphSvc.GetAlerts()
	respond(c, data, err)
}

// GetIncidents handles GET /api/security/incidents
func (h *SecurityHandler) GetIncidents(c *gin.Context) {
	data, err := h.graphSvc.GetIncidents()
	respond(c, data, err)
}

// GetRiskyUsers handles GET /api/identity/riskyUsers
func (h *SecurityHandler) GetRiskyUsers(c *gin.Context) {
	data, err := h.graphSvc.GetRiskyUsers()
	respond(c, data, err)
}

// GetSecureScores handles GET /api/security/secureScores
func (h *SecurityHandler) GetSecureScores(c *gin.Context) {
	data, err := h.graphSvc.GetSecureScores()
	respond(c, data, err)
}

// graphProbeResult is returned by DebugGraph for each Graph endpoint.
type graphProbeResult struct {
	Endpoint string `json:"endpoint"`
	OK       bool   `json:"ok"`
	Error    string `json:"error,omitempty"`
	Bytes    int    `json:"bytes,omitempty"`
}

// DebugGraph probes all four Graph API endpoints and returns a summary of
// which ones succeed and which return errors (e.g. 403 "not provisioned").
// Useful for diagnosing tenant licensing / permission issues.
// Route: GET /api/debug/graph  (requires valid Bearer token)
func (h *SecurityHandler) DebugGraph(c *gin.Context) {
	type probe struct {
		name string
		fn   func() ([]byte, error)
	}
	probes := []probe{
		{"/security/alerts_v2", h.graphSvc.GetAlerts},
		{"/security/incidents", h.graphSvc.GetIncidents},
		{"/identityProtection/riskyUsers", h.graphSvc.GetRiskyUsers},
		{"/security/secureScores", h.graphSvc.GetSecureScores},
	}

	results := make([]graphProbeResult, 0, len(probes))
	for _, p := range probes {
		data, err := p.fn()
		r := graphProbeResult{Endpoint: p.name}
		if err != nil {
			r.Error = err.Error()
		} else {
			r.OK = true
			r.Bytes = len(data)
		}
		results = append(results, r)
	}

	c.JSON(http.StatusOK, gin.H{"probes": results})
}

// wsMessage is the shape of messages pushed over the WebSocket connection.
type wsMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

// HandleWebSocket upgrades the connection and pushes fresh alert data every 30 s.
// Token validation is performed by the route layer before this handler is called.
func (h *SecurityHandler) HandleWebSocket(c *gin.Context) {
	conn, err := websocket.Accept(c.Writer, c.Request, &websocket.AcceptOptions{
		// Allow the Vite dev server origin in development.
		InsecureSkipVerify: true,
	})
	if err != nil {
		log.Printf("websocket accept error: %v", err)
		return
	}
	defer conn.CloseNow()

	ctx := conn.CloseRead(context.Background())

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	// Send an initial payload immediately on connect.
	h.pushAlerts(ctx, conn)

	for {
		select {
		case <-ticker.C:
			h.pushAlerts(ctx, conn)
		case <-ctx.Done():
			conn.Close(websocket.StatusNormalClosure, "client disconnected")
			return
		}
	}
}

// pushAlerts fetches alerts from Graph and writes them to the WebSocket connection.
func (h *SecurityHandler) pushAlerts(ctx context.Context, conn *websocket.Conn) {
	data, err := h.graphSvc.GetAlerts()
	if err != nil {
		log.Printf("pushAlerts: graph error: %v", err)
		return
	}

	msg := wsMessage{
		Type:    "alerts",
		Payload: json.RawMessage(data),
	}

	writeCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	if err := wsjson.Write(writeCtx, conn, msg); err != nil {
		log.Printf("pushAlerts: write error: %v", err)
	}
}
