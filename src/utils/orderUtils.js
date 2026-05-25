/**
 * Marque une commande comme livrée
 * @param {number|string} orderId - L'ID de la commande à livrer
 * @param {string} apiUrl - L'URL de l'API (optionnelle, utilise la constante par défaut)
 * @returns {Promise<{success: boolean, message: string, data?: any}>}
 */
export const deliverOrderById = async (orderId) => {
  const  apiUrl = "http://localhost/prestashop2/module/orderapi/changeState"
    try {
    const response = await fetch(`${apiUrl}?id_order=${orderId}&id_state=5`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    
    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        message: result.message || `Commande ${orderId} marquée comme livrée`,
        data: result
      };
    } else {
      throw new Error(result.message || "Erreur lors de la livraison");
    }
  } catch (error) {
    console.error("Erreur lors de la livraison:", error);
    return {
      success: false,
      message: error.message || "Impossible de livrer la commande. Veuillez réessayer.",
      error: error
    };
  }
};