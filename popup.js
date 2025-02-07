document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const messagesDiv = document.getElementById('messages');
    const promptButtons = document.getElementById('prompt-buttons').querySelectorAll('button');
    const modelSelect = document.getElementById('model-select');

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

    // Charger les paramètres depuis le stockage
    chrome.storage.sync.get(['iaService', 'model', 'mistralApiKey', 'googleApiKey'], function(data) {
        iaService = data.iaService || 'mistral';

        // Mettre à jour les options du selecteur de modèle
        updateModelOptions(iaService, data.googleApiKey);
        // Charger le modèle après avoir mis à jour les options
        modelSelect.value = data.model || (iaService === 'mistral' ? 'mistral-small' : 'gemini-pro');
    });

    // Ajouter des écouteurs d'événements aux boutons de prompt
    promptButtons.forEach(button => {
        button.addEventListener('click', function() {
            messageInput.value = this.dataset.prompt + ": " + selectedText;
        });
    });

    let selectedText = "";

    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        if (request.message === "selectedText") {
          selectedText = request.text;
          messageInput.value = selectedText;
        }
      }
    );

    sendButton.addEventListener('click', function() {
        const message = messageInput.value;
        if (message.trim() !== '') {
            // Ajouter le message à l'interface
            addMessage('Vous', message);

            // Envoyer le message à l'IA
            sendMessageToIA(message);

            // Effacer le champ de saisie
            messageInput.value = '';
        }
    });

    function addMessage(sender, message) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.innerHTML = `<strong>${sender}:</strong> ${message} `;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to bottom
    }

    function sendMessageToIA(message) {
        chrome.storage.sync.get(['iaService', 'model', 'mistralApiKey', 'googleApiKey'], function(data) {
            const iaService = data.iaService || 'mistral';
            const model = modelSelect.value;
            let apiKey = '';

            if (iaService === 'mistral') {
                apiKey = data.mistralApiKey || '';
            } else if (iaService === 'google') {
                apiKey = data.googleApiKey || '';
            }

            let apiUrl = '';
            let requestBody = {};
            let headers = {
                'Content-Type': 'application/json'
            };

            if (iaService === 'mistral') {
                apiUrl = 'https://api.mistral.ai/v1/chat/completions';
                requestBody = {
                    model: model,
                    messages: [{ role: "user", content: message }]
                };
                headers['Authorization'] = `Bearer ${apiKey}`;
            } else if (iaService === 'google') {
                apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                requestBody = {
                    contents: [{ role: "user", parts: [{ text: message }] }]
                };
            }

            fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
            })
            .then(response => response.json())
            .then(data => {
                let iaResponse = '';
                if (iaService === 'mistral') {
                    iaResponse = data.choices[0].message.content;
                } else if (iaService === 'google') {
                    // Vérifier si data.candidates existe et n'est pas vide
                    if (data.candidates && data.candidates.length > 0) {
                        iaResponse = data.candidates[0].content.parts[0].text;
                    } else {
                        console.error("Réponse Google inattendue:", data);
                        iaResponse = "Erreur: Réponse Google inattendue.";
                    }
                }
                addMessage('IA', iaResponse);
            })
            .catch(error => {
                console.error('Error:', error);
                addMessage('IA', 'Erreur lors de la communication avec l\'IA.');
            });
        });
    }
});
