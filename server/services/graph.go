package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/yourusername/m365-soc-dashboard/config"
)

const graphBaseURL = "https://graph.microsoft.com/v1.0"

// tokenResponse is the shape of the Azure AD token endpoint response.
type tokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
}

// cachedToken holds an access token and its expiry.
type cachedToken struct {
	value     string
	expiresAt time.Time
}

// GraphService performs authenticated requests against the Microsoft Graph API
// using the OAuth 2.0 client credentials flow.
type GraphService struct {
	cfg        *config.Config
	httpClient *http.Client
	mu         sync.Mutex
	token      *cachedToken
}

// NewGraphService creates a new GraphService.
func NewGraphService(cfg *config.Config) *GraphService {
	return &GraphService{
		cfg:        cfg,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// getAccessToken returns a valid access token, refreshing it when expired.
func (g *GraphService) getAccessToken() (string, error) {
	g.mu.Lock()
	defer g.mu.Unlock()

	if g.token != nil && time.Now().Before(g.token.expiresAt) {
		return g.token.value, nil
	}

	tokenURL := fmt.Sprintf(
		"https://login.microsoftonline.com/%s/oauth2/v2.0/token",
		g.cfg.TenantID,
	)

	data := url.Values{}
	data.Set("grant_type", "client_credentials")
	data.Set("client_id", g.cfg.ClientID)
	data.Set("client_secret", g.cfg.ClientSecret)
	data.Set("scope", "https://graph.microsoft.com/.default")

	resp, err := g.httpClient.Post(tokenURL, "application/x-www-form-urlencoded", strings.NewReader(data.Encode()))
	if err != nil {
		return "", fmt.Errorf("token request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("token endpoint returned %d: %s", resp.StatusCode, string(body))
	}

	var tr tokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tr); err != nil {
		return "", fmt.Errorf("decode token response: %w", err)
	}

	// Cache the token with a 60-second buffer before expiry.
	g.token = &cachedToken{
		value:     tr.AccessToken,
		expiresAt: time.Now().Add(time.Duration(tr.ExpiresIn-60) * time.Second),
	}

	return g.token.value, nil
}

// get performs an authenticated GET request to the given Graph API endpoint
// and returns the raw response body.
func (g *GraphService) get(endpoint string) ([]byte, error) {
	token, err := g.getAccessToken()
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodGet, graphBaseURL+endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/json")

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("execute request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("graph API %s returned %d: %s", endpoint, resp.StatusCode, string(body))
	}

	return body, nil
}

// GetAlerts returns the raw JSON from /security/alerts_v2.
func (g *GraphService) GetAlerts() ([]byte, error) {
	return g.get("/security/alerts_v2?$top=100&$orderby=createdDateTime desc")
}

// GetIncidents returns the raw JSON from /security/incidents.
func (g *GraphService) GetIncidents() ([]byte, error) {
	return g.get("/security/incidents?$top=50&$orderby=createdDateTime desc")
}

// GetRiskyUsers returns the raw JSON from /identityProtection/riskyUsers.
func (g *GraphService) GetRiskyUsers() ([]byte, error) {
	return g.get("/identityProtection/riskyUsers?$top=100&$orderby=riskLastUpdatedDateTime desc")
}

// GetSecureScores returns the raw JSON from /security/secureScores.
func (g *GraphService) GetSecureScores() ([]byte, error) {
	return g.get("/security/secureScores?$top=10&$orderby=createdDateTime desc")
}
