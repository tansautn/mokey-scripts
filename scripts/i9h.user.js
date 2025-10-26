/*
 *             M""""""""`M            dP
 *             Mmmmmm   .M            88
 *             MMMMP  .MMM  dP    dP  88  .dP   .d8888b.
 *             MMP  .MMMMM  88    88  88888"    88'  `88
 *             M' .MMMMMMM  88.  .88  88  `8b.  88.  .88
 *             M         M  `88888P'  dP   `YP  `88888P'
 *             MMMMMMMMMMM    -*-  Created by Zuko  -*-
 *
 *             * * * * * * * * * * * * * * * * * * * * *
 *             * -    - -   F.R.E.E.M.I.N.D   - -    - *
 *             * -  Copyright © 2025 (Z) Programing  - *
 *             *    -  -  All Rights Reserved  -  -    *
 *             * * * * * * * * * * * * * * * * * * * * *
 */

// ==UserScript==
// @name         i9 Helper | by Zuko®
// @namespace    https://zuko.pro/
// @version      1.3
// @description  Filter bet history and auto apply promotions. Supported provider: PG, FC
// @author       Zuko <tansautn@gmail.com>
// @match        https://*.zmcyu9ypy.com/*
// @match        https://*.x1skf.com/*
// @match        https://i9sanh.net/*
// @match        https://*.1w6mqs3panmvik7y1u8z.site/*
// @match        https://*.fcg178.net/*
// @match        *://*/index?Params=*
// @grant        none
// ==/UserScript==

// Version history:
// 1.0: Add PG support
// 1.1: Add iframe removing
// 1.2: Add FC
// 1.3: Enhanced with fixes for auto apply, account storage, selectable text, and manual links
(function () {
    'use strict';

    // Configuration
    const CONFIG = {
        gids: [65, 128],
        ocrServer: 'https://f.zuko.pro/api/ocr',
        activityMapping: {
            yearOf25: 99,
            hasFreeGame: 109,
            over300: 108
        },
        fcProvider: {
            apiBaseUrl: 'https://webapi.fcg178.net',
            imageBaseUrl: 'https://a6hzy7rm-player-report.fcg178.net/assets/images/game/vn'
        },
        promotionUrls: {
            yearOf25: 'https://i9sanh.net/Activity/detail/id/99',
            hasFreeGame: 'https://i9sanh.net/Activity/detail/id/109',
            over300: 'https://i9sanh.net/Activity/detail/id/108'
        }
    };

    // Global state
    let currentAccount = null;
    let currentFilterResults = null;

    // Provider Detection
    function getProviderType(url) {
        url = url || location.href;
        if (url.includes('/index?Params=')) {
            return 'fc';
        }
        const affectedDomains = ['1w6mqs3panmvik7y1u8z.site', 'zmcyu9ypy.com', 'i9sanh.net', 'x1skf.com'];
        if (affectedDomains.some(domain => url.includes(domain))) {
            return 'pg';
        }
        return null;
    }

    function isAffectedUrl(url) {
        return getProviderType() !== null;
    }

    function shouldShowIframeControls() {
        return isAffectedUrl(location.href) && location.pathname.includes('/LoginToSupplier');
    }

    // Hash parameter parsing and setting
    function parseHashParams() {
        const hash = window.location.hash.substring(1);
        if (!hash) return {};

        const params = {};
        hash.split('&').forEach(param => {
            const [key, value] = param.split('=');
            if (key && value) {
                params[key] = decodeURIComponent(value);
            }
        });
        return params;
    }

    function setInputValues() {
        const params = parseHashParams();
        if (Object.keys(params).length === 0) return;

        // Wait for inputs to be available
        setTimeout(() => {
            Object.entries(params).forEach(([key, value]) => {
                const input = document.querySelector(`input[name="${key}"], #${key}, input[data-field="${key}"]`);
                if (input) {
                    input.value = value;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`Set ${key} = ${value}`);
                }
            });
        }, 1000);
    }

    // FC Provider Functions
    function extractJWTFromUrl() {
        const urlParams = new URLSearchParams(location.search);
        return urlParams.get('Params');
    }

    async function fetchFCBetSummary() {
        const jwt = extractJWTFromUrl();
        if (!jwt) {
            throw new Error('JWT token not found in URL params');
        }

        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 1);

        const payload = {
            startDate: startDate.toISOString().slice(0, 19).replace('T', ' '),
            endDate: endDate.toISOString().slice(0, 19).replace('T', ' ')
        };

        const response = await fetch(`${CONFIG.fcProvider.apiBaseUrl}/PlayerReport/GetAllHistory`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': jwt
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`FC API error: ${response.status}`);
        }

        const data = await response.json();
        return data.returnObject || [];
    }

    async function fetchFCBetHistory(gameID, startDate) {
        const jwt = extractJWTFromUrl();
        if (!jwt) {
            throw new Error('JWT token not found in URL params');
        }

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        const payload = {
            inputGameID: gameID.toString(),
            startDate: startDate.toISOString().slice(0, 19).replace('T', ' '),
            endDate: endDate.toISOString().slice(0, 19).replace('T', ' ')
        };

        const response = await fetch(`${CONFIG.fcProvider.apiBaseUrl}/PlayerReport/GetRecordList`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': jwt
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`FC API error: ${response.status}`);
        }

        const data = await response.json();
        return data.returnObject || [];
    }

    function processFCSummary(summaryData) {
        const groupedData = {};

        summaryData.forEach(item => {
            const date = item.createTime.split(' ')[0];
            const gameID = item.gameID;
            const key = `${gameID}_${date}`;

            if (!groupedData[key]) {
                groupedData[key] = {
                    gameID: gameID,
                    date: date,
                    totalWinLose: 0,
                    rounds: 0
                };
            }

            groupedData[key].totalWinLose += item.totalWinLose || 0;
            groupedData[key].rounds += item.round || 0;
        });

        return Object.values(groupedData).sort((a, b) => b.totalWinLose - a.totalWinLose);
    }

    function filterFCBetHistory(historyData) {
        const results = {
            hasFreeGame: null,
            over300: null,
            yearOf25: null
        };

        const sortedHistory = historyData.sort((a, b) => (b.winLose || 0) - (a.winLose || 0));

        results.hasFreeGame = sortedHistory.find(item =>
            item.gameMode === 3
        ) || null;

        results.over300 = sortedHistory.find(item =>
            item.gameMode === 1 && (item.winLose || 0) >= 300
        ) || null;

        results.yearOf25 = sortedHistory.find(item =>
            item.recordID && (
                item.recordID.toString().endsWith('2025') ||
                item.recordID.toString().endsWith('25')
            )
        ) || null;

        return results;
    }

    window.closeFCSummaryPopup = function closeFCSummaryPopup() {
        const popup = document.getElementById('fc-summary-popup');
        const overlay = document.getElementById('fc-summary-overlay');
        if (popup) popup.remove();
        if (overlay) overlay.remove();
    };

    function showFCSummaryPopup(summaryData) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 800px;
            max-height: 600px;
            background: white;
            border: 2px solid #333;
            border-radius: 10px;
            padding: 20px;
            z-index: 999999;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            user-select: text;
        `;

        let content = '<h3>FC Bet Summary - Select Game & Date</h3>';
        content += '<div style="display: grid; gap: 10px;">';

        summaryData.forEach((item, index) => {
            const winLoseColor = item.totalWinLose >= 0 ? '#4CAF50' : '#f44336';
            content += `
                <div style="display: flex; align-items: center; padding: 10px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer;"
                     onclick="selectFCGame(${item.gameID}, '${item.date}', this)">
                    <img src="${CONFIG.fcProvider.imageBaseUrl}/${item.gameID}.png"
                         style="width: 50px; height: 50px; margin-right: 15px;"
                         onerror="this.src='data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"50\\" height=\\"50\\"><rect width=\\"50\\" height=\\"50\\" fill=\\"#ccc\\"/><text x=\\"25\\" y=\\"25\\" text-anchor=\\"middle\\" dy=\\".3em\\" fill=\\"white\\">Game</text></svg>'">
                    <div style="flex: 1;">
                        <div><strong>Game ID:</strong> ${item.gameID}</div>
                        <div><strong>Date:</strong> ${item.date}</div>
                        <div><strong>Rounds:</strong> ${item.rounds}</div>
                        <div style="color: ${winLoseColor};"><strong>Win/Lose:</strong> ${item.totalWinLose.toFixed(2)}</div>
                    </div>
                </div>
            `;
        });

        content += '</div>';
        content += '<div style="margin-top: 20px; text-align: center;">';
        content += '<button onclick="closeFCSummaryPopup()" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>';
        content += '</div>';

        popup.innerHTML = content;
        popup.id = 'fc-summary-popup';
        document.body.appendChild(popup);

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 999998;
        `;
        overlay.id = 'fc-summary-overlay';
        overlay.onclick = window.closeFCSummaryPopup;
        document.body.appendChild(overlay);

        window.selectFCGame = async function(gameID, date, element) {
            const existingSelected = document.querySelector('.fc-selected');
            if (existingSelected) {
                existingSelected.classList.remove('fc-selected');
            }
            element.classList.add('fc-selected');
            element.style.backgroundColor = '#e3f2fd';

            try {
                console.log(`Fetching FC bet history for game ${gameID} on ${date}`);
                const startDate = new Date(date);
                const historyData = await fetchFCBetHistory(gameID, startDate);
                const filteredResults = filterFCBetHistory(historyData);

                console.log('FC Filtered results:', filteredResults);
                window.closeFCSummaryPopup();

                showFilterResults(filteredResults, 'fc');

            } catch (error) {
                console.error('Error fetching FC bet history:', error);
                alert('Error: ' + error.message);
            }
        };
    }

    // Original PG Provider Functions
    function getDateRange() {
        const now = new Date();
        const userHour = now.getHours();

        let startDate, endDate;

        if (userHour < 11) {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 1);
            startDate.setHours(11, 0, 0, 0);

            endDate = new Date(now);
            endDate.setHours(10, 59, 59, 999);
        } else {
            startDate = new Date(now);
            startDate.setHours(11, 0, 0, 0);

            endDate = new Date(now);
            endDate.setDate(endDate.getDate() + 1);
            endDate.setHours(10, 59, 59, 999);
        }

        return {
            dtf: startDate.getTime(),
            dtt: endDate.getTime()
        };
    }

    function filterBetHistory(jsonData) {
        const bhArray = jsonData.dt?.bh || [];

        const sortedBh = bhArray.sort((a, b) => {
            const gtbaA = parseFloat(a.gtba?.source || a.gtba || 0);
            const gtbaB = parseFloat(b.gtba?.source || b.gtba || 0);
            return gtbaB - gtbaA;
        });

        const results = {
            hasFreeGame: null,
            over300: null,
            yearOf25: null
        };

        results.hasFreeGame = sortedBh.find(item =>
            item.fscc !== 0 && CONFIG.gids.includes(Number(item.gid))
        ) || null;

        results.over300 = sortedBh.find(item => {
            const gtwla = parseFloat(item.gtwla?.source || item.gtwla || 0);
            return item.fscc === 0 && gtwla >= 300;
        }) || null;

        results.yearOf25 = sortedBh.find(item =>
            item.tid && item.tid.toString().endsWith('2025')
        ) || null;

        if (!results.yearOf25) {
            results.yearOf25 = sortedBh.find(item =>
                item.tid && item.tid.toString().endsWith('25')
            ) || null;
        }

        return results;
    }

    function getAccessToken() {
        try {
            const cacheData = sessionStorage.getItem('com.pgsoft.plugin.login$prefkeysep$cache');
            if (!cacheData) return null;

            const parsedData = JSON.parse(cacheData);
            const firstKey = Object.keys(parsedData)[0];
            if (!firstKey) return null;

            return parsedData[firstKey]?.public?.gsSession || null;
        } catch (error) {
            console.error('Error getting access token:', error);
            return null;
        }
    }

    async function fetchBetHistory(pageNumber = 1, recordCount = 1500) {
        const atk = getAccessToken();
        if (!atk) {
            throw new Error('Access token not found in sessionStorage');
        }

        const traceId = localStorage.getItem('bet_history_traceId');
        if (!traceId) {
            throw new Error('TraceId not found. Please wait for it to be captured or enter manually.');
        }

        const dateRange = getDateRange();
        const formData = new URLSearchParams();

        CONFIG.gids.forEach(gid => {
            formData.append('gid', gid.toString());
        });

        formData.append('dtf', dateRange.dtf.toString());
        formData.append('dtt', dateRange.dtt.toString());
        formData.append('bn', pageNumber.toString());
        formData.append('rc', recordCount.toString());
        formData.append('atk', atk);
        formData.append('pf', '1');
        formData.append('wk', '0_C');
        formData.append('btt', '1');

        const apiDomain = location.hostname.replace(/^m\./, 'api.');
        const response = await fetch(`https://${apiDomain}/web-api/game-proxy/v2/BetHistory/Get?traceId=${traceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': location.origin + '/',
                'Origin': location.origin
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    async function fetchAllBetHistory() {
        let allBhItems = [];
        let pageNumber = 1;
        let hasMorePages = true;

        while (hasMorePages) {
            try {
                const data = await fetchBetHistory(pageNumber);
                const bhItems = data.dt?.bh || [];
                allBhItems = allBhItems.concat(bhItems);
                hasMorePages = bhItems.length === 1500;
                pageNumber++;
                console.log(`Fetched page ${pageNumber - 1}: ${bhItems.length} items`);
            } catch (error) {
                console.error(`Error fetching page ${pageNumber}:`, error);
                hasMorePages = false;
            }
        }

        return allBhItems;
    }

    // Promotion functions
    async function solveCaptcha() {
        try {
            const captchaResponse = await fetch(`https://i9sanh.net/Activity/verify?t=${Math.random()}`);
            const captchaBlob = await captchaResponse.blob();

            const base64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(captchaBlob);
            });

            const ocrResponse = await fetch(CONFIG.ocrServer, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    base64Image: base64,
                    language: 'eng',
                    OCREngine: 3
                })
            });

            const ocrResult = await ocrResponse.json();

            if (ocrResult.ok && ocrResult.data?.ParsedResults?.[0]?.ParsedText) {
                return ocrResult.data.ParsedResults[0].ParsedText.trim();
            }

            throw new Error('OCR failed: ' + (ocrResult.error || 'Unknown error'));
        } catch (error) {
            console.error('OCR failed:', error);
            return prompt('Please enter captcha manually:') || '';
        }
    }

    async function applyPromotion(tid, activityId, account, betAmount) {
        try {
            const captcha = await solveCaptcha();

            const formData = new FormData();
            formData.append('account', account);
            formData.append('data[0]', betAmount);
            formData.append('data[1]', tid);
            formData.append('activity_id', activityId.toString());
            formData.append('verify', captcha);

            const response = await fetch('https://i9sanh.net/Activity/apply', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Apply promotion failed:', error);
            return {status: 0, msg: 'Apply failed: ' + error.message};
        }
    }

    async function checkPromotionStatus(account, activityId) {
        try {
            const formData = new URLSearchParams();
            formData.append('account', account);
            formData.append('activity', activityId.toString());

            const response = await fetch('https://i9sanh.net/Activity/scheduleWap', {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
                body: formData
            });

            return await response.json();
        } catch (error) {
            console.error('Check status failed:', error);
            return {status: 0, msg: 'Check failed: ' + error.message};
        }
    }

    // Enhanced promotion process
    async function processPromotionsForResults(results, account) {
        const applyResults = {};
        const statusResults = {};

        for (const [key, item] of Object.entries(results)) {
            if (item) {
                const activityId = CONFIG.activityMapping[key];
                const tid = item.tid || item.recordID;
                const betAmount = item.gtba?.source || item.gtba || item.bet || 0;

                console.log(`Applying ${key} promotion for TID: ${tid}`);
                const result = await applyPromotion(tid, activityId, account, betAmount);
                applyResults[key] = result;

                // Wait a bit before checking status
                await new Promise(resolve => setTimeout(resolve, 2000));

                if (result.status === 1) {
                    const status = await checkPromotionStatus(account, activityId);
                    statusResults[key] = status;
                }
            }
        }

        return { applyResults, statusResults };
    }

    // Enhanced results display
    function showFilterResults(results, providerType) {
        console.log(`${providerType.toUpperCase()} Filtered results:`, results);
        currentFilterResults = results;

        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 700px;
            max-height: 500px;
            background: white;
            border: 2px solid #333;
            border-radius: 10px;
            padding: 20px;
            z-index: 999999;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            user-select: text;
            font-family: Arial, sans-serif;
        `;

        let content = `<h3 style="user-select: text;">${providerType.toUpperCase()} Provider - Filter Results</h3>`;

        for (const [key, item] of Object.entries(results)) {
            content += `<div style="margin-bottom: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">`;
            content += `<div style="font-weight: bold; margin-bottom: 10px; user-select: text;">${key}:</div>`;

            if (item) {
                if (providerType === 'fc') {
                    content += `<div style="user-select: text;"><strong>Record ID:</strong> ${item.recordID}</div>`;
                    content += `<div style="user-select: text;"><strong>Game ID:</strong> ${item.gameID}</div>`;
                    content += `<div style="user-select: text;"><strong>Win/Lose:</strong> ${item.winLose}</div>`;
                    content += `<div style="user-select: text;"><strong>Bet:</strong> ${item.bet}</div>`;
                } else {
                    content += `<div style="user-select: text;"><strong>TID:</strong> ${item.tid}</div>`;
                    content += `<div style="user-select: text;"><strong>GTBA:</strong> ${item.gtba?.source || item.gtba}</div>`;
                }
                content += `<div style="color: green; margin-top: 5px; user-select: text;">✓ Found</div>`;

                // Add manual apply link
                const linkParams = providerType === 'fc'
                    ? `tid=${item.recordID}&gtba=${item.bet}`
                    : `tid=${item.tid}&gtba=${item.gtba?.source || item.gtba}`;

                if (CONFIG.promotionUrls[key]) {
                    const manualUrl = `${CONFIG.promotionUrls[key]}#${linkParams}`;
                    content += `<div style="margin-top: 8px;">`;
                    content += `<a href="${manualUrl}" target="_blank" style="color: #2196F3; text-decoration: none; padding: 5px 10px; border: 1px solid #2196F3; border-radius: 3px; font-size: 12px;">Manual Apply</a>`;
                    content += `</div>`;
                }
            } else {
                content += `<div style="color: red; user-select: text;">✗ Not Found</div>`;
            }
            content += `</div>`;
        }

        if (providerType === 'pg') {
            content += '<div style="margin-top: 20px; text-align: center; border-top: 1px solid #ddd; padding-top: 15px;">';
            content += '<button id="autoApplyBtn" style="padding: 12px 24px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px; font-weight: bold;">Auto Apply All</button>';
            content += '</div>';
        }

        content += '<div style="margin-top: 10px; text-align: center;">';
        content += '<button onclick="this.parentElement.parentElement.remove()" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>';
        content += '</div>';

        popup.innerHTML = content;
        document.body.appendChild(popup);

        // Add auto apply functionality for PG
        if (providerType === 'pg') {
            const autoApplyBtn = popup.querySelector('#autoApplyBtn');
            if (autoApplyBtn) {
                autoApplyBtn.onclick = async function() {
                    if (!currentAccount) {
                        alert('Account not found. Please restart the process.');
                        return;
                    }

                    autoApplyBtn.textContent = 'Processing...';
                    autoApplyBtn.disabled = true;

                    try {
                        const { applyResults, statusResults } = await processPromotionsForResults(results, currentAccount);
                        popup.remove();
                        showPromotionResults(applyResults, statusResults);
                    } catch (error) {
                        console.error('Auto apply error:', error);
                        alert('Auto apply failed: ' + error.message);
                    } finally {
                        autoApplyBtn.textContent = 'Auto Apply All';
                        autoApplyBtn.disabled = false;
                    }
                };
            }
        }
    }

    function showPromotionResults(applyResults, statusResults) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            max-height: 500px;
            background: white;
            border: 2px solid #333;
            border-radius: 10px;
            padding: 20px;
            z-index: 999999;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            user-select: text;
            font-family: Arial, sans-serif;
        `;

        let content = '<h3 style="user-select: text;">Promotion Results</h3>';

        for (const [key, result] of Object.entries(applyResults)) {
            const status = statusResults[key];
            const bgColor = result.status === 1 ? '#e8f5e8' : '#ffe8e8';

            content += `<div style="margin-bottom: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: ${bgColor};">`;
            content += `<div style="font-weight: bold; margin-bottom: 10px; user-select: text;">${key}:</div>`;
            content += `<div style="user-select: text;"><strong>Apply Status:</strong> ${result.status === 1 ? 'Success' : 'Failed'}</div>`;
            content += `<div style="user-select: text;"><strong>Message:</strong> ${result.msg || 'N/A'}</div>`;

            if (status) {
                content += `<div style="user-select: text; margin-top: 8px;"><strong>Status Check:</strong> ${status.status}</div>`;
                if (status.list) {
                    content += `<div style="user-select: text;"><strong>Details:</strong> ${status.list}</div>`;
                }
            }
            content += `</div>`;
        }

        content += '<div style="margin-top: 20px; text-align: center;">';
        content += '<button onclick="this.parentElement.parentElement.remove()" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>';
        content += '</div>';

        popup.innerHTML = content;
        document.body.appendChild(popup);
    }

    // TraceId finder
    function initTraceIdFinder() {
        const originalFetch = window.fetch;
        const originalXHROpen = XMLHttpRequest.prototype.open;

        window.fetch = function (...args) {
            const url = args[0];
            if (typeof url === 'string' && url.includes('/web-api/game-proxy/v2/BetHistory/Get?traceId=')) {
                const traceId = url.split('traceId=')[1];
                localStorage.setItem('bet_history_traceId', traceId);
                console.log('TraceId captured:', traceId);
            }
            return originalFetch.apply(this, args);
        };

        XMLHttpRequest.prototype.open = function (method, url, ...args) {
            if (typeof url === 'string' && url.includes('/web-api/game-proxy/v2/BetHistory/Get?traceId=')) {
                const traceId = url.split('traceId=')[1];
                localStorage.setItem('bet_history_traceId', traceId);
                console.log('TraceId captured:', traceId);
            }
            return originalXHROpen.call(this, method, url, ...args);
        };
    }

    // Check if on i9sanh domain
    function isI9sanhDomain() {
        return location.hostname.includes('i9sanh.net');
    }

    // Show all activity status
    async function showAllActivityStatus() {
        if (!currentAccount) {
            currentAccount = prompt('Enter account name to check status:');
            if (!currentAccount) return;
        }

        const statusResults = {};
        const activityNames = {
            99: 'Year of 25',
            109: 'Has Free Game',
            108: 'Over 300'
        };

        try {
            // Check status for all activities
            for (const [key, activityId] of Object.entries(CONFIG.activityMapping)) {
                console.log(`Checking status for activity ${activityId} (${key})`);
                const status = await checkPromotionStatus(currentAccount, activityId);
                statusResults[key] = {
                    ...status,
                    activityId: activityId,
                    activityName: activityNames[activityId]
                };

                // Small delay between requests
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            showActivityStatusPopup(statusResults);

        } catch (error) {
            console.error('Error checking activity status:', error);
            alert('Error checking status: ' + error.message);
        }
    }

    function showActivityStatusPopup(statusResults) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 700px;
            max-height: 600px;
            background: white;
            border: 2px solid #333;
            border-radius: 10px;
            padding: 20px;
            z-index: 999999;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            user-select: text;
            font-family: Arial, sans-serif;
        `;

        let content = '<h3 style="user-select: text; margin-bottom: 20px;">Activity Status Results</h3>';
        content += `<div style="margin-bottom: 15px; user-select: text;"><strong>Account:</strong> ${currentAccount}</div>`;

        for (const [key, result] of Object.entries(statusResults)) {
            const statusColor = result.status === 1 ? '#4CAF50' :
                               result.status === 0 ? '#f44336' : '#FF9800';

            content += `<div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">`;
            content += `<div style="font-weight: bold; margin-bottom: 10px; user-select: text; color: ${statusColor};">`;
            content += `${result.activityName} (ID: ${result.activityId})`;
            content += `</div>`;

            content += `<div style="user-select: text; margin-bottom: 5px;"><strong>Status:</strong> `;
            if (result.status === 1) {
                content += `<span style="color: #4CAF50;">Success/Active</span>`;
            } else if (result.status === 0) {
                content += `<span style="color: #f44336;">Failed/Inactive</span>`;
            } else {
                content += `<span style="color: #FF9800;">Unknown (${result.status})</span>`;
            }
            content += `</div>`;

            if (result.msg) {
                content += `<div style="user-select: text; margin-bottom: 5px;"><strong>Message:</strong> ${result.msg}</div>`;
            }

            if (result.list) {
                content += `<div style="user-select: text; margin-bottom: 5px;"><strong>Details:</strong> ${result.list}</div>`;
            }

            // Add manual apply link
            const promotionUrl = CONFIG.promotionUrls[key];
            if (promotionUrl) {
                content += `<div style="margin-top: 10px;">`;
                content += `<a href="${promotionUrl}" target="_blank" style="color: #2196F3; text-decoration: none; padding: 8px 12px; border: 1px solid #2196F3; border-radius: 4px; font-size: 13px; background: #f0f8ff;">Apply Manually</a>`;
                content += `</div>`;
            }

            content += `</div>`;
        }

        content += '<div style="margin-top: 20px; text-align: center; border-top: 1px solid #ddd; padding-top: 15px;">';
        content += '<button onclick="this.parentElement.parentElement.remove()" style="padding: 12px 24px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Close</button>';
        content += '</div>';

        popup.innerHTML = content;
        document.body.appendChild(popup);

        // Add overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 999998;
        `;
        overlay.onclick = () => {
            popup.remove();
            overlay.remove();
        };
        document.body.appendChild(overlay);
    }

    // Button creation functions
    function createProcessButton() {
        const providerType = getProviderType();
        if (!providerType) return;

        // Hide process button on i9sanh domain
        if (isI9sanhDomain()) {
            createShowResultsButton();
            return;
        }

        const button = document.createElement('button');
        button.innerHTML = providerType === 'pg' ? 'Process PG Bets' : 'Process FC Bets';
        button.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 10000;
            padding: 10px 15px;
            background: ${providerType === 'pg' ? '#4CAF50' : '#FF9800'};
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
        `;

        button.onclick = async function () {
            try {
                button.innerHTML = 'Processing...';
                button.disabled = true;

                if (providerType === 'pg') {
                    // Get account name if not stored
                    if (!currentAccount) {
                        currentAccount = prompt('Enter account name:');
                        if (!currentAccount) return;
                    }

                    let traceId = localStorage.getItem('bet_history_traceId');
                    if (!traceId) {
                        traceId = prompt('TraceId not found. Please enter manually:');
                        if (!traceId) return;
                        localStorage.setItem('bet_history_traceId', traceId);
                    }

                    console.log('Fetching PG bet history data...');
                    const allBhItems = await fetchAllBetHistory();
                    console.log(`Total items fetched: ${allBhItems.length}`);

                    const jsonData = {dt: {bh: allBhItems}};
                    const results = filterBetHistory(jsonData);
                    showFilterResults(results, 'pg');

                } else if (providerType === 'fc') {
                    console.log('Fetching FC bet summary...');
                    const summaryData = await fetchFCBetSummary();
                    const processedSummary = processFCSummary(summaryData);
                    showFCSummaryPopup(processedSummary);
                }

                button.innerHTML = providerType === 'pg' ? 'Process PG Bets' : 'Process FC Bets';
                button.disabled = false;

            } catch (error) {
                console.error('Process failed:', error);
                alert('Process failed: ' + error.message);
                button.innerHTML = providerType === 'pg' ? 'Process PG Bets' : 'Process FC Bets';
                button.disabled = false;
            }
        };

        document.body.appendChild(button);
    }

    function createShowResultsButton() {
        const button = document.createElement('button');
        button.innerHTML = 'Show Results';
        button.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 10000;
            padding: 10px 15px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
        `;

        button.onclick = async function () {
            button.innerHTML = 'Loading...';
            button.disabled = true;

            try {
                await showAllActivityStatus();
            } catch (error) {
                console.error('Show results failed:', error);
                alert('Show results failed: ' + error.message);
            } finally {
                button.innerHTML = 'Show Results';
                button.disabled = false;
            }
        };

        document.body.appendChild(button);
    }

    // Iframe functions
    async function getIframeFinalUrl(iframe) {
        return new Promise((resolve) => {
            try {
                const iframeUrl = iframe.contentWindow.location.href;
                resolve(iframeUrl);
            } catch (e) {
                console.log('Cannot access iframe URL directly due to CORS');
                let lastUrl = iframe.src;
                const checkUrl = () => {
                    try {
                        const currentUrl = iframe.contentWindow.location.href;
                        if (currentUrl !== lastUrl) {
                            lastUrl = currentUrl;
                            setTimeout(checkUrl, 100);
                        } else {
                            resolve(currentUrl);
                        }
                    } catch (e) {
                        resolve(iframe.src);
                    }
                };
                setTimeout(checkUrl, 1000);
            }
        });
    }

    async function removeIframeLoading() {
        const iframe = document.querySelector('.viewport-boundary iframe');
        if (!iframe) {
            alert('No iframe found in ng-content');
            return;
        }

        try {
            const finalUrl = await getIframeFinalUrl(iframe);
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                z-index: 10002;
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                font-family: Arial, sans-serif;`;

            const content = document.createElement('div');
            content.style.cssText = `
                background: white;
                color: black;
                padding: 30px;
                border-radius: 10px;
                max-width: 80%;
                word-wrap: break-word;
                user-select: text;`;

            content.innerHTML = `
                <h3>Iframe Final URL</h3>
                <p><strong>URL:</strong></p>
                <input type="text" value="${finalUrl}" readonly style="width: 100%; padding: 10px; margin: 10px 0; font-size: 14px; user-select: all;">
                <div style="margin-top: 20px;">
                    <button id="openUrl" style="padding: 10px 20px; margin-right: 10px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Open URL</button>
                    <button id="copyUrl" style="padding: 10px 20px; margin-right: 10px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer;">Copy URL</button>
                    <button id="closeOverlay" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
                </div>`;

            overlay.appendChild(content);
            document.body.innerHTML = '';
            document.body.appendChild(overlay);

            content.querySelector('#openUrl').onclick = () => {
                location.href = finalUrl;
            };

            content.querySelector('#copyUrl').onclick = () => {
                navigator.clipboard.writeText(finalUrl).then(() => {
                    alert('URL copied to clipboard!');
                });
            };

            content.querySelector('#closeOverlay').onclick = () => {
                overlay.remove();
            };

            const loadingElements = iframe.parentElement.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="loader"]');
            loadingElements.forEach(el => el.remove());

        } catch (error) {
            console.error('Error getting iframe URL:', error);
            alert('Error getting iframe URL: ' + error.message);
        }
    }

    function createRemoveIframeButton() {
        console.info('Creating iframe button called');
        const button = document.createElement('button');
        button.innerHTML = 'Remove Iframe';
        button.style.cssText = `
            position: fixed;
            top: 110px;
            left: 10px;
            z-index: 100000000;
            padding: 10px 15px;
            background: #FF9800;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
        `;
        button.id = 'remove-iframe-btn';
        button.onclick = removeIframeLoading;
        document.querySelector('body .cdk-drag.navigation').appendChild(button);
    }

    // Initialize script
    function init() {
        const providerType = getProviderType();
        if (!providerType) return;

        console.log(`${providerType.toUpperCase()} Provider detected - Bet History Filter Script initialized`);

        if (providerType === 'pg') {
            initTraceIdFinder();
        }

        // Set input values from hash if available
        setInputValues();

        // Create process button for main functionality
        setTimeout(createProcessButton, 1000);

        // Create iframe button for LoginToSupplier pages
        if (shouldShowIframeControls()) {
            console.log('Creating iframe button');
            setTimeout(createRemoveIframeButton, 1000);
        }
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
