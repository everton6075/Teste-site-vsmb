import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.4/dist/esm/axios.js';

const DISCORD_CLIENT_ID = '1233802594841919639';
const REDIRECT_URI = 'http://localhost:5173/';  // Seu URL de callback
const API_URL = 'https://seu-site-ou-api.com/api/give-daily';

const loginContainer = document.getElementById('login-container');
const userInfoContainer = document.getElementById('user-info');
const dailyContainer = document.getElementById('daily-container');
const discordLoginBtn = document.getElementById('discord-login');
const logoutBtn = document.getElementById('logout-btn');
const dailyBtn = document.getElementById('daily-btn');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const dailyResult = document.getElementById('daily-result');

function checkLoginStatus() {
    const token = localStorage.getItem('discord_token');
    const userInfo = JSON.parse(localStorage.getItem('user_info'));

    if (token && userInfo) {
        loginContainer.classList.add('hidden');
        userInfoContainer.classList.remove('hidden');
        dailyContainer.classList.remove('hidden');

        userAvatar.src = userInfo.avatar;
        userName.textContent = userInfo.username;

        checkDailyEligibility();
    }
}

function loginWithDiscord() {
    const scope = 'identify';
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${scope}`;
    window.location.href = authUrl;
}

function parseDiscordCallback() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');

    if (token) {
        localStorage.setItem('discord_token', token);
        fetchUserInfo(token);
    }
}

async function fetchUserInfo(token) {
    try {
        const response = await axios.get('https://discord.com/api/users/@me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const userData = response.data;
        const avatarUrl = userData.avatar 
            ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` 
            : `https://cdn.discordapp.com/embed/avatars/0.png`;

        const userInfo = {
            id: userData.id,
            username: userData.username,
            avatar: avatarUrl
        };

        localStorage.setItem('user_info', JSON.stringify(userInfo));
        checkLoginStatus();
    } catch (error) {
        console.error('Erro ao obter informações do usuário', error);
    }
}

function checkDailyEligibility() {
    const lastDaily = localStorage.getItem('last_daily');
    const today = new Date().toISOString().split('T')[0];

    if (lastDaily === today) {
        dailyBtn.disabled = true;
        dailyResult.textContent = 'Daily já resgatada hoje';
    }
}

async function claimDaily() {
    try {
        const userInfo = JSON.parse(localStorage.getItem('user_info'));
        const amount = Math.floor(Math.random() * 5001) + 1000;

        const response = await axios.post(API_URL, {
            userId: userInfo.id,
            amount: amount,
            auth: 'sua_senha_super_secreta'
        });

        dailyResult.textContent = `Você ganhou ${amount} moedas!`;
        dailyBtn.disabled = true;
        localStorage.setItem('last_daily', new Date().toISOString().split('T')[0]);
    } catch (error) {
        console.error('Erro ao resgatar daily', error);
        dailyResult.textContent = 'Erro ao resgatar daily';
    }
}

function logout() {
    localStorage.removeItem('discord_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('last_daily');
    window.location.reload();
}

discordLoginBtn.addEventListener('click', loginWithDiscord);
dailyBtn.addEventListener('click', claimDaily);
logoutBtn.addEventListener('click', logout);

// Verifica se está na página de callback do Discord
if (window.location.hash.includes('access_token')) {
    parseDiscordCallback();
} else {
    checkLoginStatus();
}