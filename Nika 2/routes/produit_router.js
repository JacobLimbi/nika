//On fait appel à express pour la gestion des routes
var express = require('express'),
  //Ceci est le module contenant la quasi totalité des fonctions utilisé dans cet API
  func = require("../models/includes/function"),
  router = express.Router();

//Appel à la base de données
var db_js = require("../models/db");

//Appel à la collection
var produit_model = require("../models/produit_dao");

//La route qui permet de créer un produit
router.post("/create", (req, res) => {
  //Dans le module contenant des fonctions on appel la fonctions addProduct
  func.addProduct(db_js, produit_model, req, res)

})

//La route permettant de récupérer les nouveaux produits
router.get("/getNew/:limit", (req, res) => {
  func.getNewProduct(db_js, produit_model, req, res)
})

//La route permettant de définir l'image d'un produit
router.post("/setImage", (req, res) => {
  func.setImageProduct(db_js, produit_model, req, res)
})

/**
 * La route qui permet de renvoyer les détails des produits venant du panier
 * En gardant à l'esprit que cette route n'est liée a aucun DAO, mais utilise les module du DAO produit
 */
router.post("/getDetailsFromCart", (req, res) => {

  var produitsId = req.body.listProduit.split("/"),
      id_client = req.body.id_client,
      listProduitRetour = [],
      sortieProduit = 1;
      objetRetour = require("./objet_retour").ObjetRetour();


      produit_model.initialize(db_js);

      if (produitsId.length > 2) {

        for (var indexProduit = 1; indexProduit < produitsId.length-1; indexProduit++) {

          produit_model.findOneById(produitsId[indexProduit], (isMatch, resultMessage, resultMatch) => {

            sortieProduit++;

            if (isMatch) {
              listProduitRetour.push(resultMatch)
            }

            if (sortieProduit == produitsId.length - 1) {
              
              if (listProduitRetour.length > 0) {
                objetRetour.getObjet = listProduitRetour;
                objetRetour.getEtat = true;

                res.send(objetRetour)
              } else {
                objetRetour.getMessage = "Aucun produit n'a été trouvé";
                objetRetour.getEtat = false;
                
                res.send(objetRetour)

              }
            }

          })
        }
      }else{
        objetRetour.getMessage = "Le panier est vide";
        objetRetour.getEtat = false;
        
        res.send(objetRetour)
      }
})

//La route permettant de récupérer les Tops produits
router.get("/getTop/:limit", (req, res) => {
  func.getTopProduct(db_js, produit_model, req, res)
})

module.exports = router;