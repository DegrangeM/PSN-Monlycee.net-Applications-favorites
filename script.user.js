// ==UserScript==
// @name         PSN-Monlycee.net-Applications-favorites
// @namespace    http://tampermonkey.net/
// @version      2024-08-31
// @description  try to take over the world!
// @author       Mathieu Degrange
// @match        https://ent.iledefrance.fr/welcome
// @match        https://psn.monlycee.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=iledefrance.fr
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

function getApps() {
    return fetch('https://ent.iledefrance.fr/auth/oauth2/userinfo').then(x => x.json()).then(x => x.apps);
}

function getFavoritesList() {
    return fetch('https://ent.iledefrance.fr/userbook/preference/apps').then(x => x.json()).then(x => JSON.parse(x.preference).bookmarks);
}

function getFavoritesApps() {
    return getApps().then(
        apps => getFavoritesList().then(
            favorites => apps.filter(app => favorites.includes(app.name))
        )
    );
}

function saveFavorites() {
    getFavoritesApps().then(x => {
        GM_setValue('favoritesApps', JSON.stringify(x));
    });
}

function getFavorites() {
    return JSON.parse(GM_getValue('favoritesApps', '[]'));
}

function cloneAttributes(source, target) {
    source.getAttributeNames().forEach(x => target.setAttribute(x, source.getAttribute(x)));
}

function displayName(name) {
    const names = {
        "lystore": "Lystore",
        "support": "Assistance ENT",
        "admin.header": "Console d'administration",
        "timeline": "Fil de nouveautés",
        "stats": "Statistiques",
        "blog": "Blog",
        "rbs": "Réservation de ressources",
        "news": "Actualités",
        "pages": "Pages",
        "wiki": "Wiki",
        "collaborativewall": "Mur Collaboratif",
        "timelinegenerator": "Frise chronologique",
        "exercizer": "Exercices",
        "mindmap": "Carte mentale",
        "scrapbook": "Cahier multimédia",
        "workspace": "Espace documentaire",
        "community": "Communautés",
        "forum": "Forum",
        "collaborativeeditor": "Pad",
        "directory.user": "Annuaire",
        "sharebigfiles": "Poste-fichiers",
        "archive": "Mes données",
        "rack": "Casier"
    }
    return names[name] || name;
}

function displayFavorites() {
    let favorites = getFavorites();
    let servicesNode = document.getElementById('services');
    let favoritesNodeHead = servicesNode.querySelector('.box-head').cloneNode(true);
    favoritesNodeHead.querySelector('h2').innerText = 'Favoris';
    servicesNode.appendChild(favoritesNodeHead);
    let servicesNodeUl = servicesNode.querySelector('ul');
    let favoritesNodeUl = document.createElement('ul');
    cloneAttributes(servicesNodeUl, favoritesNodeUl);
    let servicesNodeLi = servicesNodeUl.querySelector('li');
    favorites.forEach(app => {
        let favoritesNodeLi = servicesNodeLi.cloneNode(true);
        let img = favoritesNodeLi.querySelector('img');
        img.addEventListener('error', () => {
            img.setAttribute('src', 'https://psn.monlycee.net/assets/outils-pedagogiques-BrqyhJKR.svg');     
        });
        img.setAttribute('src', new URL(app.icon, 'https://ent.iledefrance.fr').href);
        img.setAttribute('alt', displayName(app.displayName));
        let a = favoritesNodeLi.querySelector('a');
        a.setAttribute('href', new URL(app.address, 'https://ent.iledefrance.fr').href);
        a.querySelector('h3').innerText = displayName(app.displayName);
        favoritesNodeLi.querySelector('p:not(.picto)').remove()
        favoritesNodeUl.appendChild(favoritesNodeLi);
    });
    servicesNode.appendChild(favoritesNodeUl);
}

function waitAndDisplayFavorites() {
    if (document.querySelector('#services li')) {
        displayFavorites();
    } else {
        setTimeout(waitAndDisplayFavorites, 100);
    }
}

(function () {
    'use strict';

    if (location.hostname === 'ent.iledefrance.fr') {
        saveFavorites();
    } else if (location.hostname === 'psn.monlycee.net') {
        waitAndDisplayFavorites();
    }

})();
