"use strict";

class ImportFichier {

	inputFileEl;

	rappelErreur;
	rappelFinChargement;

	nbPas;
	listeSymboles;
	grilleInitiale;
	tabRegles;

	constructor(inputFileEl, rappelErreur, rappelFinChargement) {
		this.inputFileEl = inputFileEl;
		this.rappelErreur = rappelErreur;
		this.rappelFinChargement = rappelFinChargement;
		
		this.inputFileEl.addEventListener("change", (el) => { 
			this.importerFichierJson();
		});

		this.initialiserDonnees();
	}

	initialiserDonnees() {
		this.tabRegles = {};
		this.nbPas = 0;
		this.grilleInitiale = [];
		this.listeSymboles = "";
	}

	traitementDonneesPas(d, key) {
		let data = d[key];
		if(!data) throw "Propriété '" + key + "' manquante.";
		if(typeof(data) !== "number") throw "Propriété '" + key + "' de type invalide.";
		if(data < 0) throw "Propriété '" + key + "' ne doit pas être négative.";
		this.nbPas = data;
	}

	traitementDonneesSymboles(d, key) {
		let data = d[key];
		if(!data) throw "Propriété '" + key + "' manquante.";
		if(typeof(data) !== "string") throw "Propriété '" + key + "' de type invalide.";
		if(data.length === 0) throw "Propriété '" + key + "' ne doit pas être vide.";
		this.listeSymboles = data;
	}

	traitementDonneesEtatInitial(d, key, keyExtended) {
		let grille = d[key];
		if(!grille) throw "Propriété '" + key + "' manquante.";
		if(!Array.isArray(grille)) throw "Propriété '" + key + "' n'est pas un tableau valide.";
		if(grille.length === 0) throw "Propriété '" + key + "' ne doit pas être vide.";
		if(typeof(grille[0]) !== "string") throw "Propriété '" + key + "' n'est pas un tableau valide.";
		if(grille[0].length === 0) throw "Propriété '" + key + "' ne doit pas être de largeur nulle.";

		let symboleEtendu = d[keyExtended];
		if(!symboleEtendu) throw "Propriété '" + keyExtended + "' manquante.";
		if(typeof(symboleEtendu) !== "string") throw "Propriété '" + keyExtended + "' de type invalide.";
		if(symboleEtendu.length === 0) throw "Propriété '" + keyExtended + "' ne doit être vide.";
		if(symboleEtendu.length > 1) throw "Propriété '" + keyExtended + "' ne doit être constituée que d'un seul caractère.";
		if(!this.listeSymboles.includes(symboleEtendu)) throw "Propriété '" + keyExtended + "' n'est pas valide : symbole '" + symboleEtendu + "' non déclaré.";

		let hauteurGrille = grille.length;
		for(let i = 0; i < hauteurGrille; i++) // transforme les chaines en tableaux de caractères
			grille[i] = grille[i].split("");
		let largeurGrille = grille[0].length;

		/* --- on remplit les bordures supérieure et inférieure de la grille avec des "symboleEtendu" --- */
		this.grilleInitiale[0] = [];
		this.grilleInitiale[hauteurGrille + 1] = [];
		for(let i = 0; i < largeurGrille + 2; i++) {
			this.grilleInitiale[0][i] = symboleEtendu;
			this.grilleInitiale[hauteurGrille + 1][i] = symboleEtendu;
		}

		for(let i = 0; i < hauteurGrille; i++) {
			let ligne = grille[i];

			if(largeurGrille !== ligne.length)
				throw "Propriété '" + key + "' n'est pas un tableau valide : largeur de la grille non constante.";

			// i + 1 car il y a la bordure supérieure
			// et [0] car il y a la bordure gauche avec des 0
			this.grilleInitiale[i + 1] = [symboleEtendu];
			// [largeurGrille + 1] car il y a la bordure droite avec des 0
			this.grilleInitiale[i + 1][largeurGrille + 1] = symboleEtendu;

			for(let j = 0; j < largeurGrille; j++) {
				let Case = ligne[j];

				if(!this.listeSymboles.includes(Case))
					throw "Propriété '" + key + "' n'est pas un tableau valide : symbole '" + Case + "' non déclaré.";

				// i + 1 car il y a la bordure supérieure
				// j + 1 car il y a la bordure gauche
				this.grilleInitiale[i + 1][j + 1] = Case;
			}
		}
	}

	traitementDonneesRegles(d, key, keyWildCard) {
		let tabStrRegles = d[key];
		if(!Array.isArray(tabStrRegles)) throw "Propriété '" + key + "' n'est pas un tableau valide.";

		let wildCard = d[keyWildCard];
		if(wildCard) {
			if(typeof(wildCard) !== "string") throw "Propriété '" + keyWildCard + "' de type invalide.";
			if(wildCard.length > 1) throw "Propriété '" + keyWildCard + "' ne doit être constituée que d'un seul caractère.";
			if(this.listeSymboles.includes(wildCard)) throw "Propriété '" + keyWildCard + "' n'est pas valide : symbole '" + wildCard + "' déclaré dans la liste des symboles (ne devrait pas l'être).";
			if(wildCard.length === 0) wildCard = null;
		}
		
		let tabRegles =  {};
		const REGEX_REGLE = new RegExp('^...:...:...>.$');

		for(let i = 0; i < tabStrRegles.length; i++) {
			let strRegle = tabStrRegles[i];

			if(!REGEX_REGLE.test(strRegle))
				throw "Propriété '" + key + "' : la règle '" + strRegle + "'  est invalide.";

			let tmp = strRegle.split(">");

			let symboleSuivant = tmp[1];
			if(!this.listeSymboles.includes(symboleSuivant))
				throw "Propriété '" + key + "' : la règle '" + strRegle + "'  est invalide, symbole '" + symboleSuivant + "' non déclaré.";

			let tmp2 = tmp[0].split(":");
			let strCond = "";
			for(let j = 0; j < tmp2.length; j++)
				strCond += tmp2[j];

			function recCombinaisonRegles(strCond_rec, i_rec, listeSymboles) {
				for(; i_rec < 9; i_rec++) {
					let c = strCond_rec.charAt(i_rec);
					if(c === wildCard) {
						let sA = strCond_rec.substring(0, i_rec);
						let sB = strCond_rec.substring(i_rec + 1, strCond_rec.length);

						for(let j = 0; j < listeSymboles.length; j++)
							recCombinaisonRegles(sA + listeSymboles.charAt(j) + sB, i_rec + 1, listeSymboles);

						break;
					} else if(!listeSymboles.includes(c)) {
						throw "Propriété '" + key + "' : la règle '" + strRegle + "'  est invalide, symbole '" + c + "' non déclaré.";
					}
				}
				// à chaque feuille de l'arbre de récursion, on a une nouvelle combinaison
				if(i_rec >= 9) tabRegles[strCond_rec] = symboleSuivant;
			}

			recCombinaisonRegles(strCond, 0, this.listeSymboles);

		}

		this.tabRegles = tabRegles;
	}

	recupererDonnees() {
		return { 
			"regles": this.tabRegles,
			"nb-pas": this.nbPas,
			"grille-initiale": this.grilleInitiale,
			"symboles": this.listeSymboles
		};
	}

	importerChaineJson(text) {
		try {
			let data = JSON.parse(text);

			this.initialiserDonnees();
			
			this.traitementDonneesPas(data, "steps");
			this.traitementDonneesSymboles(data, "symbols");
			this.traitementDonneesEtatInitial(data, "initial-grid", "extended-symbol");
			this.traitementDonneesRegles(data, "rules", "wildcard");

			this.rappelFinChargement(this.recupererDonnees());
		} catch(erreur) {
			this.rappelErreur(erreur);
		}
	}

	importerFichierJson() {
		let file = this.inputFileEl.files["0"];

		if(file.type !== "application/json") {
			this.rappelErreur("N'est pas un fichier json.");
			return;
		}

		file.text().then(text => {
			this.importerChaineJson(text);
		});
	}

}

