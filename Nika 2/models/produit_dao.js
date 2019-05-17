//------------Définition des variables globales
//cette variable est destinée à contenir une référence à l'objet collection qui dérivera de "db_js"
var db_js = require("./db"),
    constante = require("./includes/constante");

var collection = {
    value: null
}

//Ici on initialise la variable "collection" en lui passant
//la valeur provenant de "db_js". NB: cette fonction sera accessible
//en dehors de ce fichier
module.exports.initialize = (db_js) => {

    collection.value = db_js.get().collection("produit");
}

/**
 * La fonction qui permet d'ajouter un produit
 * @param {*} new_product Le nouveau produit à sauvegarder
 * @param {Function} callback La fonction de retour
 */
module.exports.create = (new_product, callback) => {

    try { //Si ce bloc passe

        //On appele la méthode insertOne (une methode propre à mongoDB) de notre collection qui doit prendre la structure de l'entité
        collection.value.insertOne(new_product, function (err, resultProduit) {

            //On test s'il y a erreur
            if (err) {
                callback(false, "Une erreur est survénue lors de l'ajout du produit", "" + err);
            } else { //S'il n'y a pas erreur

                //On vérifie s'il y a des résultat renvoyé
                if (resultProduit) {
                    callback(true, "Produit ajouté", resultProduit.ops[0])
                } else { //Si non l'etat sera false et on envoi un message
                    callback(false, "Aucun produit n'a été rajouté")
                }
            }
        })

    } catch (exception) { //Si ce bloc ne passe pas on lève une exception
        callback(false, "Une exception a été lévée lors de l'ajout du produit : " + exception);
    }
}

/**
 * Module permettant de récupérer les nouveaux produit suivant une limite
 * @param {Number} limit La limit de la galerie
 * @param {Function} callback La fonction de retour
 */
module.exports.getNewProduct = (limit, callback) => {
    try {

        var limitPipeline = !isNaN(limit) ? {
            "$limit": parseInt(limit, 10)
        } : {
            "$match": {}
        };

        collection.value.aggregate([{
                "$match": {}
            },
            {
                "$sort": {
                    "date": -1
                }
            },
            limitPipeline
        ]).toArray((err, resultAggr) => {
            if (err) {
                callback(false, "Une erreur est survenue lors de la récupération des nouveaux produits : " + err)
            } else {
                if (resultAggr.length > 0) {
                    var objetRetour = {
                            "messages": [{
                                "attachment": {
                                    "type": "template",
                                    "payload": {
                                        "template_type": "generic",
                                        "image_aspect_ratio": "square",
                                        "elements": []
                                    }
                                }
                            }]
                        },
                        sortieProduit = 0,
                        media_dao = require("./media_dao");

                    media_dao.initialize(db_js);

                    for (let index = 0; index < resultAggr.length; index++) {
                        media_dao.findImageForProduct(resultAggr[index], (isFound, message, resultFound) => {

                            sortieProduit++;
                            if (isFound) {
                                var gallerieTab = {
                                    "title": resultFound.intitule + " : " + resultFound.pu + " $",
                                    "image_url": constante.Link().LINK_API + resultFound.image.path.split("public/")[1] + "/" + resultFound.image.name,
                                    "subtitle": resultFound.annotation,
                                    "buttons": [{
                                        "type": "web_url",
                                        "url": constante.Link().LINK_WEB_SITE + resultFound._id,
                                        "title": "Ajouter au panier"
                                    }]
                                };

                                objetRetour.messages[0].attachment.payload.elements.push(gallerieTab);
                            } else {
                                var gallerieTab = {
                                    "title": resultFound.intitule + " : " + resultFound.pu + " $",
                                    "image_url": constante.Link().LINK_API + "public/images/default.jpg",
                                    "subtitle": resultFound.annotation,
                                    "buttons": [{
                                        "type": "web_url",
                                        "url": constante.Link().LINK_WEB_SITE + resultFound._id,
                                        "title": "Ajouter au panier"
                                    }]
                                };

                                objetRetour.messages[0].attachment.payload.elements.push(gallerieTab);
                            }

                            if (sortieProduit == resultAggr.length) {
                                callback(true, "La gallérie a été renvoyé avec succès", objetRetour)
                            }
                        })
                    }

                } else {
                    callback(false, "La gelarie de produits est vide...")
                }

            }
        })
    } catch (exception) {
        callback(false, "Une exception a été lévée lors de la récupération des nouveaux produits : " + exception)
    }
}

/**
 * Module permettant de définir l'image du produit
 * @param {Object} props L'ensemble des propriété
 * @param {Function} callback La fonction de retour
 */
module.exports.setImage = (props, callback) => {
    try {
        var filter = {
                "_id": require("mongodb").ObjectId(props.id_produit)
            },
            update = {
                "$set": {
                    "lien_produit": "" + props.id_media
                }
            };

        collection.value.updateOne(filter, update, (err, resultUpdate) => {
            if (err) {
                callback(false, "Une erreur est survenue lors de la mise à jour de l'image de ce produit : " + err)
            } else {
                if (resultUpdate) {
                    callback(true, "Mise à jour a été faite", resultUpdate)
                } else {
                    callback(false, "La mise à jour n'a pas abouti")
                }
            }
        })
    } catch (exception) {
        callback(false, "Une exception a été lévée lors de la mise à jour de l'image de ce produit : " + exception)
    }
}

/**
 * Module permettant de récupérer les tops produits suivant la spécification de la limit
 * @param {Number} limit La limit des tops produits a récupéré
 * @param {Function} callback La fonction de retour
 */
module.exports.getTop = (limit, callback) => {
    try {
        var commande_dao = require("./commande_dao");

        commande_dao.initialize(db_js);
        commande_dao.getIdProduitTop(limit, (isGet, messageCommande, resultCommande) => {
            //console.log(resultCommande);
            if (isGet) {
                if (limit == resultCommande.length) {
                    
                    prepareGalleries(resultCommande, callback);
                } else {
                    var difference = parseInt(limit, 10) - resultCommande.length;
                    
                    collection.value.aggregate([{
                            "$match": {}
                        },
                        {
                            "$sort": {
                                "date": -1
                            }
                        },
                        {
                            "$project": {
                                "_id": 1
                            }
                        },
                        {
                            "$limit": parseInt(difference, 10)
                        }
                    ]).toArray((err, resultAggr) => {
                        if (err) {
                            callback(false, "Une erreur est survenue lors de l'ajout des produits en cas de manque : " + err)
                        } else {
                            if (resultAggr.length > 0) {

                                for (let index = 0; index < resultAggr.length; index++) {
                                    resultCommande.push("" + resultAggr[index]._id)
                                }
                                prepareGalleries(resultCommande, callback);

                            } else {
                                prepareGalleries(resultCommande, callback);
                            }
                        }
                    })
                }
            } else {
                module.exports.getNewProduct(limit, (isGet, messageNewProduct, resultNewProduct) => {
                    if (isGet) {
                        callback(true, messageNewProduct, resultNewProduct)
                    } else {
                        callback(false, messageNewProduct)
                    }
                })
            }

        })
    } catch (exception) {
        callback(false, "Une exception a été lévée lors de la récupération des Tops produits : " + exception)
    }
}

/**
 * Fonction préparant les données brutes à afficher dans la gallerie
 * @param {Array} resultCommande Le tableau contenant les identifiants des produits à afficher dans la gellerie
 * @param {Function} callback La fonction de retour
 */
function prepareGalleries(resultCommande, callback) {
    var sortieId = 0,
        product = [];
    for (let index = 0; index < resultCommande.length; index++) {
        module.exports.findOneById(resultCommande[index], (isFound, message, result) => {
            sortieId++;
            
            if (isFound) {
                product.push(result);
            }
            if (sortieId == resultCommande.length) {
                getGalleries(product, (isGet, messageGalleries, resultGalleries) => {
                    if (isGet) {
                        callback(true, messageGalleries, resultGalleries);
                    } else {
                        callback(false, "La gallerie n'a pas été renvoyé");
                    }
                });
            }
        });
    }
}

/**
 * Fonction qui nous ressort la gallerie
 * @param {Array} ArrayProduct Le tableau contenant les details desdits produits
 * @param {Function} callback La fonction de retour
 */
function getGalleries(ArrayProduct, callback) {
    var objetRetour = {
            "messages": [{
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "image_aspect_ratio": "square",
                        "elements": []
                    }
                }
            }]
        },
        sortieProduit = 0,
        media_dao = require("./media_dao");

    media_dao.initialize(db_js);

    for (let index = 0; index < ArrayProduct.length; index++) {
        media_dao.findImageForProduct(ArrayProduct[index], (isFound, message, resultFound) => {
            sortieProduit++;
            if (isFound) {
                var gallerieTab = {
                    "title": resultFound.intitule + " : " + resultFound.pu + " $",
                    "image_url": constante.Link().LINK_API + resultFound.image.path.split("public/")[1] + "/" + resultFound.image.name,
                    "subtitle": resultFound.annotation,
                    "buttons": [{
                        "type": "web_url",
                        "url": constante.Link().LINK_WEB_SITE + resultFound._id,
                        "title": "Ajouter au panier"
                    }]
                };

                objetRetour.messages[0].attachment.payload.elements.push(gallerieTab);
            } else {
                var gallerieTab = {
                    "title": resultFound.intitule + " : " + resultFound.pu + " $",
                    "image_url": constante.Link().LINK_API + "public/images/default.jpg",
                    "subtitle": resultFound.annotation,
                    "buttons": [{
                        "type": "web_url",
                        "url": constante.Link().LINK_WEB_SITE + resultFound._id,
                        "title": "Ajouter au panier"
                    }]
                };

                objetRetour.messages[0].attachment.payload.elements.push(gallerieTab);
            }

            if (sortieProduit == ArrayProduct.length) {
                callback(true, "La gallérie a été renvoyé avec succès", objetRetour)
            }
        })
    }
}

/**
 * Module permettant de retrouvé les détails d'un produit via son identifiat
 * @param {String} id_produit L'indentifiant du produit
 * @param {Function} callback La fonction de retour
 */
module.exports.findOneById = (id_produit, callback) => {
    try {
        
        collection.value.findOne({"_id": require("mongodb").ObjectId(id_produit)}, (err, result) => {
            if (err) {
                callback(false, "Une erreur est survenue lors de la recherche du produit : " + err)
            } else {
                if (result) {
                   
                    var media_dao = require("./media_dao");

                    media_dao.initialize(db_js);
                    media_dao.findOne(result, (isFound, messageMedia, resultWithMedia) => {
                        callback(true, "Les détails de ce produit a été renvoyé avec succès", resultWithMedia)
                    })
                } else {
                    callback(false, "Ce produit n'existe pas")
                }
            }
        })
    } catch (exception) {
        callback(false, "Une exception a été lévée lors de la recherche du produit : " + exception)
    }
}