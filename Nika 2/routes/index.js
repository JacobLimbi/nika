var express = require('express');
var router = express.Router();
var multer = require("multer");
var path = require("path");

var db = require("../models/db");

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Express'
  });
});

//Route permettant d'uploder une image
router.post('/upload/image/:type/:fieldname', function (req, res) {
  
  console.log("Un upload d'image a été fait");
  var type = req.params.type, //Le type d'opération qu'on veut faire
    fieldname = req.params.fieldname, //Le name de l'input qu'on envoie
    destination = null, //Destination où sera logée l'image uploader
    objetRetour = require("./objet_retour").ObjetRetour();

  if (/produit/i.test(type)) {

    destination = "public/images/produit";

  }else {
    return;
  }

  //Si destination existe
  if (destination != null) {
    moveMedia("Image", type, fieldname, destination, objetRetour, req, res);
  } else {
    objetRetour.getEtat = false;
    objetRetour.getMessage = "Media incorrect !!!";
    
    res.send(objetRetour);
  }

})

/**
 * Cette fonction deplace tout d'abord le fichier uploader vers le serveur dans un dossier bien spécifier, ensuite met les infos dans la base de données
 * @param {String} typeUpload Spécifie le type d'upload qu'on souhaite réaliser
 * @param {String} type Spécifie une indication de l'upload
 * @param {*} fieldname Le name du fichier qu'on a uploder
 * @param {*} destination La désitination où sera loger le fichier uplaoder dans le serveur
 * @param {*} objetRetour L'objet de retour
 * @param {*} req La requête envoyé
 * @param {*} res La reponse qu'on veut envoyer
 */
function moveMedia(typeUpload, type, fieldname, destination, objetRetour, req, res) {
  var storage = multer.diskStorage({
    destination: destination,
    filename: function (req, file, cb) {
      cb(null, "Nika_" + file.originalname.split(".")[0] + "_" + Date.now() + path.extname(file.originalname))
    }
  });

  var upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        checkFile(file, typeUpload, cb)
    }
  }).single(fieldname);

  upload(req, res, function (err) {
    if (err) {
      objetRetour.getEtat = false;
      objetRetour.getMessage = "Erreur: " + err;

      res.send(objetRetour);
    } else {
      if (req.file == undefined) {
        objetRetour.getEtat = false;
        objetRetour.getMessage = "Aucune "+ typeUpload +" n'a été choisi";
      } else {

          var mediaDao = require("../models/media_dao"),
            media_entity = require("../models/entities/media_entity").Media();

          media_entity.name = req.file.filename;
          media_entity.path = req.file.destination;
          media_entity.size = req.file.size;
          media_entity.type = type + " " + typeUpload;

          mediaDao.initialize(db);
          mediaDao.create(media_entity, (isCreated, messageMedia, resultMedia) => {
            if (isCreated) {
              objetRetour.getEtat = true;
              objetRetour.getObjet = resultMedia;
              objetRetour.getMessage = messageMedia;

              res.send(objetRetour);
            } else {
              objetRetour.getEtat = false;
              objetRetour.getMessage = messageMedia;

              res.send(objetRetour)
            }
          })

        

      }
    }
  })


}

/**
 * La fonction permet de vérifier que le fichier envoyer, son extension correspond exactement a ce qui était attendu
 * @param {file} file Le fichier qu'on a envoyer
 * @param {*} typeUpload le type d'upload qu'on veut faire, pour un début la fonction ne supporte que les images et les vidéos(Tous les extensions)
 * @param {Function} cb La fonction de retour
 */
function checkFile(file, typeUpload, cb) {
  //Gestion d'extension
  const filesType = /Image/i.test(typeUpload) ? /jpeg|jpg|png|gif/ : (/Video/i.test(typeUpload) ? /avi|mp4|3gp|mkv/ : null);
  
  //Teste d'extension et du mimetype
  const extname = filesType.test(path.extname(file.originalname).toLowerCase());
  const mimeType = filesType.test(file.mimetype);

  if (mimeType && extname) {
    return cb(null, true)
  } else {
    cb(typeUpload + " seulement...")
  }
} 

module.exports = router;