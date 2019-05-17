//On fait appel à express pour la gestion des routes
var express = require('express'),
  //Ceci est le module contenant la quasi totalité des fonctions utilisé dans cet API
  func = require("../models/includes/function"),
  router = express.Router();

//Appel à la base de données
var db_js = require("../models/db");

//Appel à la collection
var commande_model = require("../models/commande_dao");

//La route permettant de sauvegardé la commnde
router.post("/save", (req, res) => {
    func.saveCommande(db_js, commande_model, req, res)
})

//La route permettant de définir que la livraison a été faite
router.get("/setSuccesfull/:id_commande", (req, res) => {
    func.setSuccessfullyDelivered(db_js, commande_model, req, res)
})

module.exports = router;