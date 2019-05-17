//Appelle à la base de données
var db_js = require("./db");

var collection = {
    value: null
}

module.exports.initialize = function (db_js) {

    collection.value = db_js.get().collection("media");
}

/**
 * Module permettant d'ajouter un media
 * @param {Object} newMedia L'objet a insérer
 * @param {Function} callback La fonction de retour
 */
module.exports.create = (newMedia, callback) => {
    try {
        collection.value.insertOne(newMedia, (err, result) => {
            if (err) {
                callback(false, "Une erreur est survenue lors de l'insertion d'un Media : " +err)
            } else {
                if (result) {
                    callback(true, "Media créer avec succès", result.ops[0])
                } else {
                    callback(false, "Media non-créé")
                }
            }
        })
    } catch (exception) {
        callback(false, "Une exception a été lévée lors de l'insertion d'un Media : " +err)        
    }
}

/**
 * Module permettant de récupérer l'image pour un produit
 * @param {Object} product Le produit qu'on doit retrouvé son image
 * @param {Function} callback La fonction de retour
 */
module.exports.findImageForProduct = (product, callback) => {
    try {
        var filter = {
            "_id": require("mongodb").ObjectId(product.lien_produit)
        };
        
        collection.value.aggregate([
            {
                "$match": filter
            }
        ]).toArray((err, resultAggr) => {
            if (err) {
                callback(false, "Une erreur est survenue lors de la recupération de l'image : " + err, product)
            } else {
                if (resultAggr.length > 0) {
                    product.image = resultAggr[0];
                    callback(true, "Image trouvé", product)
                } else {
                    callback(false, "Aucune image pour ce produit", product)
                }
            }
        })
    } catch (exception) {
        
    }
}

module.exports.findOne = (product, callback) => {
    try {
        collection.value.aggregate([
            {
                "$match": {
                    "_id": require("mongodb").ObjectId(product.lien_produit)
                }
            }
        ]).toArray((err, resultAggr) => {
            if (err) {
                callback(false, "Une erreur est survenue lors de la recherche de l'image : " +err, product)
            } else {
                if (resultAggr.length > 0) {
                    product.image = resultAggr[0];
                    callback(true, "Image touvée", product)
                } else {
                    callback(false, "Aucune image", product)
                }
            }
        })
    } catch (exception) {
        callback(false, "Une exception a été lévée lors de la recherche de l'image : " +exception, product)
    }
}