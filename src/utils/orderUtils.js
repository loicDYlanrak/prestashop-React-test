import { updateResource } from "../hooks/useMutationPrestashop";

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

export const cancelOrderById = async (orderId) => {
  try {
    const response = await updateResource("order", orderId, {
      id: orderId,
      current_state: "6", // ID du statut "Annulé"
    });

    if (response) {
      return {
        success: true,
        message: `Commande ${orderId} annulée avec succès`,
        data: response
      };
    } else {
      throw new Error("Erreur lors de l'annulation de la commande");
    }
  } catch (error) {
    console.error("Erreur lors de l'annulation:", error);
    return {
      success: false,
      message: error.message || "Impossible d'annuler la commande. Veuillez réessayer.",
      error: error
    };
  }
};