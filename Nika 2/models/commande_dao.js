//------------Définition des variables globales
//cette variable est destinée à contenir une référence à l'objet collection qui dérivera de "db_js"
var db_js = require("./db");

var collection = {
    value: null
}

//Ici on initialise la variable "collection" en lui passant
//la valeur provenant de "db_js". NB: cette fonction sera accessible
//en dehors de ce fichier
module.exports.initialize = (db_js) => {

    collection.value = db_js.get().collection("commande");
}

/**
 * Module permettant d'enregistrer la commande
 * @param {Object} new_commande La nouvel commande
 * @param {Function} callback La fonction de retour
*/
module.exports.create = (new_commande, callback) => {
    try {
        var qteCommande = 0;
        for (let index = 0; index < new_commande.produit.length; index++) {
            
            const element = new_commande.produit[index];
            qteCommande += parseInt(element.quantite, 10);
            
        }
        
        if (qteCommande > 6) {
            insertCommande(new_commande, callback);            
        } else {
            callback(false, "veuillez vous rendre au point de service")
        }
        
    } catch (exception) {
        callback(false, "Une exception a été lévée lors de l'insertion de la commande : " +exception)        
    }
}

/**
 * Une petite fonction pour faciliter l'insertion
 * @param {Object} new_commande La commande a sauvegardé
 * @param {Function} callback La fonction de retour
 */
function insertCommande(new_commande, callback) {
    collection.value.insertOne(new_commande, (err, result) => {
        if (err) {
            callback(false, "Une erreur est survenue lors de l'insertion de la commande : " + err);
        }
        else {
            if (result) {
                callback(true, "La commande a été inséré", result.ops[0]);
            }
            else {
                callback(false, "La commande n'a pas été inséré");
            }
        }
    });
}

/**
 * Module permettant de définir si la livraison est faite avec succès
 * @param {String} id_commande 
 * @param {Function} callback La fonction de retour
*/
module.exports.successfullyDelivered = (id_commande, callback) => {
    try {
        var filter = {
            "_id": require("mongodb").objectId(id_commande)
        },
        update = {
            "$set": {
                "flag": true
            }
        };
        
        collection.value.updateOne(filter, update, (err, result) => {
            if (err) {
                callback(false, "Une erreur est survenue lors de la définition du flag : " +err)
            } else {
                if (result) {
                    callback(true, "La commande a été faite avec succès", result)
                } else {
                    callback(false, "La définition du flag de la commande n'a pas abouti")
                }
            }
        })
    } catch (exception) {
        callback(false, "Une exception a été lévée lors de la définition du flag : " +exception)        
    }
}

module.exports.getIdProduitTop = (limit, callback) => {
    try {
        collection.value.aggregate([
            {
                "$unwind": "$produit"
            },
            {
                "$group": {
                    "_id": "$produit.id_produit",
                    "quantite": {"$sum": "$produit.quantite"}
                }
            },
            {
                "$sort": {
                    "quantite": -1
                }
            },
            {
                "$limit": parseInt(limit, 10)
            }
        ]).toArray((err, resultAggr) => {
            if (err) {
                callback(false, "Une erreur est survenue lors de la récupération des top produits : " +err)
            } else {
                
                if (resultAggr.length > 0) {
                    var idProduits = [];
                    
                    for (let index = 0; index < resultAggr.length; index++) {
                        const element = resultAggr[index];
                        idProduits.push("" + element._id)
                    }
                    
                    callback(true, "Les identifiants des tops produits ont été renvoyé", idProduits)                    
                } else {
                    callback(false, "Aucun top produit")
                }
            }
        })
    } catch (exception) {
        callback(false, "Une exception a été lévée lors de la récupération des top produits : " +exception)
    }
}