'use strict';

function genJsonReglesJDLV(symboleVivant, symboleMort, largeur, hauteur) {
	if(symboleVivant.length !== 1 || symboleMort.length !== 1)
		return null;

	// génération des paramètres du fichier
	let chaineJson = '{\n';
	chaineJson += '\t"steps":30,\n';
	chaineJson += '\t"symbols":"'+ symboleVivant +''+ symboleMort +'",\n';
	chaineJson += '\t"extended-symbol":"'+ symboleMort +'",\n';

	let chaineGrid = '\t"initial-grid":[\n';
	for(let i = 0; i < largeur; i++) {
		chaineGrid += '\t\t"';
		for(let j = 0; j < hauteur; j++)
			chaineGrid += symboleMort;
		chaineGrid += '"';
		if(i !== largeur - 1)
			chaineGrid += ',\n';
	}
	chaineGrid += '\n\t],\n';

	chaineJson += chaineGrid;

	// retourne dans un tableau de chaine, l'ensemble des regles pour un cas comme :
	// pour "nbVivantsAutour" cellules vivantes autour d'une cellule courante 
	// "valPrec", on passe à l'état "valSuiv"
	function genReglesVivantsAutour(nbVivantsAutour, valPrec, valSuiv) {
		// tableau des chaines que l'on retourner à la fin 
		// (une chaine = une regle de la forme xxx:xxx:xxx>x)
		let strL = [];

		/* generation de toutes les combinaisons de n (nbVivantsAutour) cellules 
		vivantes autour d'une cellule donnée (on ne s'occupe pas 
		de la cellule centrale ni de la syntaxe des regles a ce stade) */
		// occ = nombre d'occurences restantes à ajouter de cellules vivantes
		// seq = sequence unique de cellules (vivantes/mortes) obtenue
		function genCombVivants(occ, seq) {
			if(seq.length === 8)
				strL.push(seq);
			else {
				if(seq.length + occ < 8)
					genCombVivants(occ, seq + symboleMort);
				if(occ > 0)
					genCombVivants(occ - 1, seq + symboleVivant);
			}
		}
		// premier appel à la fonction
		genCombVivants(nbVivantsAutour, '');

		// on transforme les chaines obtenues en regles de la forme voulue (bonne syntaxe)
		for(let i = 0; i < strL.length; i++) {
			strL[i] = 
				strL[i].substring(0,3) + ':'
				+ strL[i].substring(3,4) + valPrec + strL[i].substring(4,5) + ':'
				+ strL[i].substring(5,8) + '>' + valSuiv;
		}

		return strL; // on retourne le tableau de regles ainsi obtenu
	}

	// tableau des tableaux des chaines des règles
	let tabRegles = [];

	// une cellule morte possédant exactement trois voisines vivantes devient vivante
	tabRegles.push(genReglesVivantsAutour(3, symboleMort, symboleVivant));

	/* une cellule vivante possédant deux ou trois voisines vivantes le reste, sinon elle meurt 
	(ici on ne traite que les changements d'état, puisque implicitement
	le simulateur maintient les cellules dans leur état courant si aucune regle n'est spécifiée) */
	tabRegles.push(genReglesVivantsAutour(0, symboleVivant, symboleMort));
	tabRegles.push(genReglesVivantsAutour(1, symboleVivant, symboleMort));
	tabRegles.push(genReglesVivantsAutour(4, symboleVivant, symboleMort));
	tabRegles.push(genReglesVivantsAutour(5, symboleVivant, symboleMort));
	tabRegles.push(genReglesVivantsAutour(6, symboleVivant, symboleMort));
	tabRegles.push(genReglesVivantsAutour(7, symboleVivant, symboleMort));
	tabRegles.push(genReglesVivantsAutour(8, symboleVivant, symboleMort));

	// on recompose la chaine JSON dans la syntaxe voulu à partir des chaines de tabRegles
	let chaineRules = '\t"rules":[\n';
	for(let i = 0; i < tabRegles.length; i++) {
		for(let j = 0; j < tabRegles[i].length; j++) {
			chaineRules += '\t\t"' + tabRegles[i][j] + '"';
			if(!(i === tabRegles.length - 1 && j === tabRegles[i].length - 1))
				chaineRules += ',\n';
		}
	}
	chaineRules += '\n\t]\n}\n';

	return chaineJson + chaineRules;
}

function exporterVersFichierJson(jsonStr, nom) {
	let data = new Blob([jsonStr], {type: "application/json"});
	let url = window.URL.createObjectURL(data);
	let downloadButton = document.createElement("a");
	downloadButton.setAttribute("href",url);
	downloadButton.setAttribute("download", nom + ".json");
	downloadButton.click();
}