    // ==UserScript==
    // @name         PSN-Monlycee.net-Applications-favorites
    // @namespace    http://tampermonkey.net/
    // @version      2024-08-31
    // @description  Permet d'afficher ses applications favorites directement sur le PSN
    // @author       Mathieu Degrange
    // @match        https://ent.iledefrance.fr/welcome
    // @match        https://psn.monlycee.net/*
    // @icon         https://monlycee.net/assets/img/favicon.ico
    // @grant        GM_setValue
    // @grant        GM_getValue
    // ==/UserScript==

    /*
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
    */

    async function getFavoritesApps() {
        let favoritesApps = Array.from(document.querySelectorAll('#bookmarked-apps>article'));
        let jsonApp = {};
        if(!localStorage.getItem('appsCache') || !localStorage.getItem('appsCacheId') !== (document.cookie.match(/XSRF-TOKEsqdfdfN=([0-9-a-f\-]+)/)||["",""])[1].substring(0,8)) {
            jsonApp = await fetch('https://ent.iledefrance.fr/auth/oauth2/userinfo').then(x => x.json()).then(x => x.apps);
            localStorage.setItem('appsCache', JSON.stringify(jsonApp));
            localStorage.setItem('appsCacheId', (document.cookie.match(/XSRF-TOKEN=([0-9-a-f\-]+)/)||["",""])[1].substring(0,8));
        } else {
            jsonApp = JSON.parse(localStorage.getItem('appsCache'));
        }
        favoritesApps = favoritesApps.map(x => {
            let app = {};
            let img = x.querySelector('img');
            app.icon = img.getAttribute('src');
            if (app.icon.startsWith('/workspace/')) {
                // On ne peut accéder à l'image que si l'on est connecté à l'ent
                // Il faut donc récupérer le contenu de l'image
                let c = document.createElement('canvas');
                c.height = img.naturalHeight;
                c.width = img.naturalWidth;
                var ctx = c.getContext('2d');
                ctx.drawImage(img, 0, 0, c.width, c.height);
                app.icon = c.toDataURL();
            }
            app.displayName = x.querySelector('span').innerText;
            // app.address = x.querySelector('a').getAttribute('href');
            app.address = Object.values(jsonApp).find(y => y.name === x.getAttribute('id'))?.address;
            return app;
        });
        return favoritesApps;
    }

    function saveFavorites() {
        getFavoritesApps().then(x=>{
            GM_setValue('favoritesApps', JSON.stringify(x));
        });
        
    }


    function waitAndSaveFavorites() {
        if (document.querySelector('#bookmarked-apps>article')) {
            saveFavorites();
        } else {
            setTimeout(waitAndSaveFavorites, 100);
        }
    }
    function getFavorites() {
        return JSON.parse(GM_getValue('favoritesApps', '[]'));
    }

    function cloneAttributes(source, target) {
        source.getAttributeNames().forEach(x => target.setAttribute(x, source.getAttribute(x)));
    }

    /*
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
    */

    function displayName(name) {
        return name;
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
            let url;
            try {
                url = new URL(app.address).href;
            } catch (e) {
                // C'est une URL locale
                url = new URL(app.address, 'https://ent.iledefrance.fr'); // On la transforme en URL absolue
                url = 'https://ent.iledefrance.fr/auth/openid/login?callback=' + encodeURIComponent(url.href); // On ajoute le login
            }
            a.setAttribute('href', url);
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
            waitAndSaveFavorites();
        } else if (location.hostname === 'psn.monlycee.net') {
            waitAndDisplayFavorites();
        }

    })();
