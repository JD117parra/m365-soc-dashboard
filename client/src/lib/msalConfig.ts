import {
  PublicClientApplication,
  type Configuration,
  LogLevel,
} from '@azure/msal-browser'

const msalConfiguration: Configuration = {
  auth: {
    clientId:    import.meta.env.VITE_CLIENT_ID as string,
    authority:   `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID as string}`,
    redirectUri: (import.meta.env.VITE_REDIRECT_URI as string) ?? window.location.origin,
  },
  cache: {
    cacheLocation:        'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback(level, message, containsPii) {
        if (containsPii) return
        switch (level) {
          case LogLevel.Error:   console.error(message); break
          case LogLevel.Warning: console.warn(message);  break
          case LogLevel.Info:    console.info(message);  break
          case LogLevel.Verbose: console.debug(message); break
        }
      },
      piiLoggingEnabled: false,
      logLevel: import.meta.env.DEV ? LogLevel.Info : LogLevel.Warning,
    },
  },
}

/**
 * Singleton MSAL PublicClientApplication instance.
 *
 * IMPORTANT: Call `await msalInstance.initialize()` before mounting the Vue
 * app (done in main.ts). Using MSAL before initialization causes errors.
 */
export const msalInstance = new PublicClientApplication(msalConfiguration)

/** Scopes requested when acquiring tokens for the Go backend / Graph API proxy. */
export const graphScopes = ['https://graph.microsoft.com/.default']
