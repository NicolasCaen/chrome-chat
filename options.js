document.addEventListener('DOMContentLoaded', function() {
    const iaServiceSelect = document.getElementById('ia-service');
    const modelSelect = document.getElementById('model');
    const saveButton = document.getElementById('save');
    const mistralApiKeyInput = document.getElementById('mistral-api-key');
    const googleApiKeyInput = document.getElementById('google-api-key');
    const apiKeysContainer = document.getElementById('api-keys-container');
    const mistralApiKeyContainer = document.getElementById('mistral-api-key-container');
    const googleApiKeyContainer = document.getElementById('google-api-key-container');

    // Fonction pour peupler les options du selecteur de modèle
    function populateModelOptions(models) {
        modelSelect.innerHTML = ''; // Effacer les options existantes
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            modelSelect.appendChild(option);
        });
    }

    // Fonction pour mettre à jour les options de modèle
    function updateModelOptions(iaService, googleApiKey) {
        let models = [];

        if (iaService === 'mistral') {
            models = ['mistral-small', 'mistral-medium', 'mistral-large'];
            populateModelOptions(models);
        } else if (iaService === 'google') {
            if (googleApiKey) {
                // Récupérer les modèles depuis l'API Google
                fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${googleApiKey}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.models) {
                            // Filtrer pour ne garder que les modèles Gemini
                            models = data.models
                                .filter(model => model.name.startsWith('models/gemini'))
                                .map(model => model.name.replace('models/', ''));
                        } else {
                            console.error("Erreur lors de la récupération des modèles Google:", data);
                            alert("Erreur lors de la récupération des modèles Google. Vérifiez votre clé API.");
                            models = ['gemini-pro']; // Fallback
                        }
                        populateModelOptions(models);
                    })
                    .catch(error => {
                        console.error("Erreur lors de la récupération des modèles Google:", error);
                        alert("Erreur lors de la récupération des modèles Google. Vérifiez votre clé API et votre connexion.");
                        models = ['gemini-pro']; // Fallback
                        populateModelOptions(models);
                    });
            } else {
                alert("Veuillez entrer votre clé API Google.");
                models = ['gemini-pro']; // Fallback
                populateModelOptions(models);
            }
        }
    }

    // Charger les valeurs enregistrées
    chrome.storage.sync.get(['iaService', 'model', 'mistralApiKey', 'googleApiKey'], function(data) {
        iaServiceSelect.value = data.iaService || 'mistral';
        mistralApiKeyInput.value = data.mistralApiKey || '';
        googleApiKeyInput.value = data.googleApiKey || '';

        // Afficher/cacher les champs de clé API
        mistralApiKeyContainer.style.display = data.iaService === 'mistral' ? 'block' : 'none';
        googleApiKeyContainer.style.display = data.iaService === 'google' ? 'block' : 'none';

        updateModelOptions(data.iaService || 'mistral', data.googleApiKey);
        // Charger le modèle après avoir mis à jour les options
        modelSelect.value = data.model || (data.iaService === 'mistral' ? 'mistral-small' : 'gemini-pro');
    });

    // Mettre à jour les options de modèle lors du changement de service IA
    iaServiceSelect.addEventListener('change', function() {
        const iaService = this.value;

        // Afficher/cacher les champs de clé API
        mistralApiKeyContainer.style.display = iaService === 'mistral' ? 'block' : 'none';
        googleApiKeyContainer.style.display = iaService === 'google' ? 'block' : 'none';

        updateModelOptions(iaService, googleApiKeyInput.value);
        modelSelect.value = (iaService === 'mistral' ? 'mistral-small' : 'gemini-pro');
    });

    // Enregistrer les valeurs
    saveButton.addEventListener('click', function() {
        const iaService = iaServiceSelect.value;
        const model = modelSelect.value;
        const mistralApiKey = mistralApiKeyInput.value;
        const googleApiKey = googleApiKeyInput.value;

        chrome.storage.sync.set({
            iaService: iaService,
            model: model,
            mistralApiKey: mistralApiKey,
            googleApiKey: googleApiKey
        }, function() {
            alert('Options enregistrées !');
        });
    });
});
