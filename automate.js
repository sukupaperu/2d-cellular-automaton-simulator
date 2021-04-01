"use strict";

class Automate {
	canvasEl;
	ctx;
	tailleAff = {"x": 0, "y": 0};
	decalageAff = {"x": 0, "y": 0};
	tailleCellule = 0;
	tabCouleurs;

	nbPas;
	nbPasMax;
	intervalle;
	grille;
	grilleInitiale;
	tabRegles;

	estInitialise;

	timeOutId;

	constructor(canvasEl, intervalle) {
		this.canvasEl = canvasEl;
		this.ctx = this.canvasEl.getContext('2d');

		this.estInitialise = false;
		this.timeOutId = null;

		this.reglerIntervalle(intervalle);
	}

	reglerIntervalle(i) {
		i = parseInt(i);
		this.intervalle = i === 10 ? 0 : 1000/Math.pow(2, i);
	}

	mettreAjourDimensions(outrepasserTest) {
		if(outrepasserTest 
			|| this.tailleAff.y !== this.canvasEl.offsetWidth 
			|| this.tailleAff.x !== this.canvasEl.offsetHeight) {
			this.tailleAff.x = this.canvasEl.offsetWidth;
			this.tailleAff.y = this.canvasEl.offsetHeight;
			let ratioHL = this.tailleAff.x/this.tailleAff.y;
			
			let	nbColonnes = this.grille[0].length - 2;
			let	nbLignes = this.grille.length - 2;
			let ratioLC = nbColonnes/nbLignes;

			this.tailleCellule = (ratioHL > ratioLC ? this.tailleAff.y/nbLignes : this.tailleAff.x/nbColonnes);

			this.decalageAff.x = (this.tailleAff.x - this.tailleCellule*nbColonnes)/2;
			this.decalageAff.y = (this.tailleAff.y - this.tailleCellule*nbLignes)/2;
		}
	}

	initialiserDonnees(data) {
		if(this.timeOutId) {
			window.clearTimeout(this.timeOutId);
			this.timeOutId = null;
		}
		this.nbPas = 0;
		this.nbPasMax = data["nb-pas"];
		this.grille = data["grille-initiale"];
		this.grilleInitiale = this.copierGrille(this.grille);
		this.tabRegles = data["regles"];

		let listeSymboles = data["symboles"];
		let nbSymboles = listeSymboles.length;
		this.tabCouleurs = {};
		for(let i = 0; i < nbSymboles; i++) {
			let symbole = listeSymboles.charAt(i);
			this.tabCouleurs[symbole] = "hsl(" + (360*(i/nbSymboles) + 45)%360 + ",80%,65%)";
		}

		this.estInitialise = true;
		this.mettreAjourDimensions(true);
	}

	remettreEtatInitial() {
		this.nbPas = 0;
		this.grille = this.copierGrille(this.grilleInitiale);
		this.estInitialise = true;
	}

	raffraichirAffichage() {
		let nbColonnes = this.grille[0].length - 2;
		let nbLignes = this.grille.length - 2;

		this.ctx.clearRect(0, 0, this.tailleAff.x, this.tailleAff.y);

		this.ctx.font = this.tailleCellule*.5 + "px Arial";
		this.ctx.textAlign = "center";

		for(let x = 0; x < nbColonnes; x++) {
			for(let y = 0; y < nbLignes; y++) {
				let symbole = this.grille[y + 1][x + 1];
				let coordX = this.tailleCellule*x + this.decalageAff.x;
				let coordY = this.tailleCellule*y + this.decalageAff.y;

				this.ctx.fillStyle = this.tabCouleurs[symbole];
				this.ctx.fillRect(coordX, coordY, this.tailleCellule + 1, this.tailleCellule + 1);

				this.ctx.fillStyle = "rgb(255,255,255)";
				this.ctx.fillText(symbole, coordX + this.tailleCellule*.5, coordY + this.tailleCellule*.7);
			}
		}
	}

	copierGrille(grille) {
		let copieGrille = [];

		for(let i = 0; i < grille.length; i++) {
			copieGrille[i] = [];
			for(let j = 0; j < grille[i].length; j++)
				copieGrille[i][j] = grille[i][j];
		}

		return copieGrille;
	}

	pause() {
		if(this.estInitialise)
			window.clearTimeout(this.timeOutId);
	}

	executer(rappelPas, rappelFinExecution) {
		if(!this.estInitialise)
			return;

		this.timeOutId = window.setTimeout(() => {
			if(this.nbPas++ < this.nbPasMax) {
				let nbColonnes = this.grille[0].length;
				let nbLignes = this.grille.length;
				let copieGrille = this.copierGrille(this.grille);

				for(let i = 1; i < nbLignes - 1; i++) {
					for(let j = 1; j < nbColonnes - 1; j++) {

						let hashCellulesVoisines = "";
						for(let k = i - 1; k <= i + 1; k++)
							for(let l = j - 1; l <= j + 1; l++)
								hashCellulesVoisines += copieGrille[k][l];

						let nouvelleValeur = this.tabRegles[hashCellulesVoisines];

						if(nouvelleValeur !== undefined)
							this.grille[i][j] = nouvelleValeur;
					}
				}

				this.raffraichirAffichage();

				rappelPas(this.nbPas, this.nbPasMax);

				this.executer(rappelPas, rappelFinExecution); ;
			} else {
				this.estInitialise = false;
				rappelFinExecution();
			}

		}, this.intervalle);

	}

}