package middleware

import (
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/yourusername/m365-soc-dashboard/config"
)

// azureJWK represents one key entry from the Azure AD JWKS endpoint.
type azureJWK struct {
	Kid string `json:"kid"`
	Kty string `json:"kty"`
	N   string `json:"n"` // base64url-encoded RSA modulus
	E   string `json:"e"` // base64url-encoded RSA exponent
}

// jwksResponse is the full response from the JWKS endpoint.
type jwksResponse struct {
	Keys []azureJWK `json:"keys"`
}

// jwksCache caches the public key set with a TTL.
type jwksCache struct {
	mu        sync.RWMutex
	keys      map[string]*rsa.PublicKey
	fetchedAt time.Time
	ttl       time.Duration
}

var cache = &jwksCache{
	keys: make(map[string]*rsa.PublicKey),
	ttl:  time.Hour,
}

// jwkToRSAPublicKey converts an Azure JWK entry to an *rsa.PublicKey using
// only the standard library — no external JWK parsing dependency needed.
func jwkToRSAPublicKey(j azureJWK) (*rsa.PublicKey, error) {
	nBytes, err := base64.RawURLEncoding.DecodeString(j.N)
	if err != nil {
		return nil, fmt.Errorf("decode modulus: %w", err)
	}
	eBytes, err := base64.RawURLEncoding.DecodeString(j.E)
	if err != nil {
		return nil, fmt.Errorf("decode exponent: %w", err)
	}
	n := new(big.Int).SetBytes(nBytes)
	e := int(new(big.Int).SetBytes(eBytes).Int64())
	return &rsa.PublicKey{N: n, E: e}, nil
}

// refreshKeys fetches the JWKS from Azure AD and populates the cache.
func refreshKeys(tenantID string) error {
	jwksURL := fmt.Sprintf(
		"https://login.microsoftonline.com/%s/discovery/v2.0/keys",
		tenantID,
	)

	resp, err := http.Get(jwksURL) //nolint:gosec // URL is constructed from trusted config
	if err != nil {
		return fmt.Errorf("fetch JWKS: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read JWKS body: %w", err)
	}

	var jwks jwksResponse
	if err := json.Unmarshal(body, &jwks); err != nil {
		return fmt.Errorf("unmarshal JWKS: %w", err)
	}

	newKeys := make(map[string]*rsa.PublicKey, len(jwks.Keys))
	for _, k := range jwks.Keys {
		if k.Kty != "RSA" {
			continue
		}
		pub, err := jwkToRSAPublicKey(k)
		if err != nil {
			continue
		}
		newKeys[k.Kid] = pub
	}

	cache.mu.Lock()
	cache.keys = newKeys
	cache.fetchedAt = time.Now()
	cache.mu.Unlock()

	return nil
}

// getKey returns the RSA public key for the given key ID, refreshing the
// cache if it is stale or the key is not found.
func getKey(kid, tenantID string) (*rsa.PublicKey, error) {
	cache.mu.RLock()
	key, ok := cache.keys[kid]
	stale := time.Since(cache.fetchedAt) > cache.ttl
	cache.mu.RUnlock()

	if ok && !stale {
		return key, nil
	}

	// Refresh and retry once.
	if err := refreshKeys(tenantID); err != nil {
		return nil, err
	}

	cache.mu.RLock()
	key, ok = cache.keys[kid]
	cache.mu.RUnlock()

	if !ok {
		return nil, fmt.Errorf("key %q not found in Azure AD JWKS", kid)
	}
	return key, nil
}

// ValidateTokenPublic parses and validates an Azure AD JWT using the tenant's
// public keys. Exported so the WebSocket route can reuse the same logic.
func ValidateTokenPublic(tokenStr string, cfg *config.Config) (*jwt.Token, error) {
	return jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		kid, ok := token.Header["kid"].(string)
		if !ok {
			return nil, fmt.Errorf("missing kid in token header")
		}
		return getKey(kid, cfg.TenantID)
	})
}

// AuthMiddleware validates the Bearer JWT in the Authorization header.
// It rejects requests without a valid Azure AD token.
func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing Authorization header"})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid Authorization header format"})
			return
		}

		token, err := ValidateTokenPublic(parts[1], cfg)
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}

		// Store claims for downstream handlers if needed.
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			c.Set("claims", claims)
		}

		c.Next()
	}
}
