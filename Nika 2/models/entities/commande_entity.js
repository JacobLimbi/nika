/**
 * L'entité de sauvegarde de la commande
*/
module.exports.Commande = function Commande() {
    return{
        "produit" : [],
        "adresse" : null,
        "paiement" : null,
        "date": new Date(),
        "flag": true
    }
}