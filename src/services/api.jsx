const defaultConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || "5000"),
  headers: {
    "Content-Type": "application/json",
  },
};

/**
 * Fonction pour créer une requête fetch avec timeout
 * @param {string} url - L'URL complète ou relative
 * @param {object} options - Options de fetch
 * @returns {Promise} - Promise de la requête fetch
 */
async function fetchWithTimeout(url, options = {}) {
  const { timeout = defaultConfig.timeout, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Crée une instance d'API fetch avec les intercepteurs
 * @param {object} config - Configuration personnalisée
 * @returns {object} - Objet API avec méthodes HTTP
 */
function createApi(config = {}) {
  const apiConfig = { ...defaultConfig, ...config };

  const buildUrl = (url) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `${apiConfig.baseURL}${url}`;
  };

  // Intercepteur de requête (avant envoi)
  const requestInterceptor = (url, options) => {
    console.log("Requête envoyée:", options.method || "GET", url);
    return { url, options };
  };

  // Intercepteur de réponse (après réception)
  const responseInterceptor = async (response) => {
    return response;
  };

  const errorInterceptor = (error) => {
    console.error("Erreur API:", error.message);
    throw error;
  };

  const api = {
    /**
     * Requête GET
     * @param {string} url - URL de la requête
     * @param {object} options - Options supplémentaires
     */
    async get(url, options = {}) {
      try {
        const fullUrl = buildUrl(url);
        const { url: interceptedUrl, options: interceptedOptions } =
          requestInterceptor(fullUrl, {
            ...options,
            method: "GET",
          });

        const response = await fetchWithTimeout(interceptedUrl, {
          ...interceptedOptions,
          method: "GET",
          headers: { ...apiConfig.headers, ...options.headers },
        });

        await responseInterceptor(response);
        return response;
      } catch (error) {
        errorInterceptor(error);
        throw error;
      }
    },

    /**
     * Requête POST
     * @param {string} url - URL de la requête
     * @param {object} data - Données à envoyer
     * @param {object} options - Options supplémentaires
     */
    async post(url, data = null, options = {}) {
      try {
        const fullUrl = buildUrl(url);
        const body = data ? JSON.stringify(data) : null;

        const { url: interceptedUrl, options: interceptedOptions } =
          requestInterceptor(fullUrl, {
            ...options,
            method: "POST",
            body,
          });

        const response = await fetchWithTimeout(interceptedUrl, {
          ...interceptedOptions,
          method: "POST",
          headers: { ...apiConfig.headers, ...options.headers },
          body,
        });

        await responseInterceptor(response);
        return response;
      } catch (error) {
        errorInterceptor(error);
        throw error;
      }
    },

    /**
     * Requête PUT
     * @param {string} url - URL de la requête
     * @param {object} data - Données à envoyer
     * @param {object} options - Options supplémentaires
     */
    async put(url, data = null, options = {}) {
      try {
        const fullUrl = buildUrl(url);
        const body = data ? JSON.stringify(data) : null;

        const { url: interceptedUrl, options: interceptedOptions } =
          requestInterceptor(fullUrl, {
            ...options,
            method: "PUT",
            body,
          });

        const response = await fetchWithTimeout(interceptedUrl, {
          ...interceptedOptions,
          method: "PUT",
          headers: { ...apiConfig.headers, ...options.headers },
          body,
        });

        await responseInterceptor(response);
        return response;
      } catch (error) {
        errorInterceptor(error);
        throw error;
      }
    },

    /**
     * Requête PATCH
     * @param {string} url - URL de la requête
     * @param {object} data - Données à envoyer
     * @param {object} options - Options supplémentaires
     */
    async patch(url, data = null, options = {}) {
      try {
        const fullUrl = buildUrl(url);
        const body = data ? JSON.stringify(data) : null;

        const { url: interceptedUrl, options: interceptedOptions } =
          requestInterceptor(fullUrl, {
            ...options,
            method: "PATCH",
            body,
          });

        const response = await fetchWithTimeout(interceptedUrl, {
          ...interceptedOptions,
          method: "PATCH",
          headers: { ...apiConfig.headers, ...options.headers },
          body,
        });

        await responseInterceptor(response);
        return response;
      } catch (error) {
        errorInterceptor(error);
        throw error;
      }
    },

    /**
     * Requête DELETE
     * @param {string} url - URL de la requête
     * @param {object} options - Options supplémentaires
     */
    async delete(url, options = {}) {
      try {
        const fullUrl = buildUrl(url);

        const { url: interceptedUrl, options: interceptedOptions } =
          requestInterceptor(fullUrl, {
            ...options,
            method: "DELETE",
          });

        const response = await fetchWithTimeout(interceptedUrl, {
          ...interceptedOptions,
          method: "DELETE",
          headers: { ...apiConfig.headers, ...options.headers },
        });

        await responseInterceptor(response);
        return response;
      } catch (error) {
        errorInterceptor(error);
        throw error;
      }
    },

    /**
     * Méthode générique pour faire une requête
     * @param {string} method - Méthode HTTP
     * @param {string} url - URL
     * @param {object} data - Données
     * @param {object} options - Options
     */
    async request(method, url, data = null, options = {}) {
      const methods = {
        GET: () => this.get(url, options),
        POST: () => this.post(url, data, options),
        PUT: () => this.put(url, data, options),
        PATCH: () => this.patch(url, data, options),
        DELETE: () => this.delete(url, options),
      };

      const methodFunc = methods[method.toUpperCase()];
      if (!methodFunc) {
        throw new Error(`Méthode HTTP non supportée: ${method}`);
      }

      return methodFunc();
    },
  };

  return api;
}

// Créer l'instance par défaut
const api = createApi();

// Export de l'instance par défaut et de la fonction de création
export default api;
export { createApi, fetchWithTimeout };
