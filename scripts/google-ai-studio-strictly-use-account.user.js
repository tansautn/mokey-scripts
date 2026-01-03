// ==UserScript==
// @name         Force Google AI Studio Account Selection
// @namespace    https://zuko.pro/
// @version      1.2
// @description  Bắt buộc chọn tài khoản (khác /u/0) trên AI Studio. Tự động mở menu chuyển tài khoản nếu chưa chỉ định tài khoản nào (mặc định).
// @author       Zuko <Gemini_Implemented>
// @match        https://aistudio.google.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=aistudio.google.com
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // CẤU HÌNH SELECTOR (Dựa trên mô tả của bạn & cấu trúc thường thấy)
    const SELECTORS = {
        avatarBtn: '#account-switcher-button', // Nút avatar
        popover: '#account-switcher',          // Dialog bung ra
        switchBtnIndex: 0,                      // Index của nút cần bấm trong popover (0 là nút đầu tiên)
        instantButton: '.account-switcher-container button',
    };

    /**
     * Hàm tiện ích đợi element xuất hiện (Dùng MutationObserver thay vì setInterval để tối ưu performace)
     */
    function waitForElement(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    /**
     * Logic chính
     */
    async function init() {
        const currentUrl = window.location.href;

        // REGEX GIẢI THÍCH:
        // \/u\/([1-9]) : Tìm chuỗi /u/ bắt đầu bằng số từ 0-9 (nghĩa là /u/0, /u/1...).
        // Nếu KHÔNG tìm thấy (tức là đang ở / hoặc không có /u/ nào) thì thực thi.
        // Ông nào dùng tới u mười mấy thì tự đi mà sửa :))
        const isSafeAccount = /\/u\/([0-9])/.test(currentUrl);

        if (isSafeAccount) {
            console.log("✅ [AI Studio Fix] Đang ở tài khoản phụ hợp lệ (/u/x).");
            return;
        }

        console.warn("⚠️ [AI Studio Fix] Đang ở tài khoản mặc định (/u/0 hoặc ẩn). Tiến hành nhắc nhở...");

        try {
            // 1. Đợi và click nút Avatar
            const avatarBtn = await waitForElement(SELECTORS.instantButton);
            // Delay nhẹ để UI ổn định
            setTimeout(() => {
                avatarBtn.click();
                console.log("👉 Đã click Avatar Button");
            }, 500);

            // 2. Đợi Popover xuất hiện
            const popover = await waitForElement(SELECTORS.popover);
            console.log("Found popover:", popover);

            // 3. Tìm nút bên trong popover
            // Lưu ý: Popover của Google thường load nội dung bất đồng bộ, cần đợi nút bên trong render
            setTimeout(() => {
                const buttons = popover.querySelectorAll('button');
                if (buttons && buttons.length > SELECTORS.switchBtnIndex) {
                    const targetBtn = buttons[SELECTORS.switchBtnIndex];
                    console.log("👉 Click nút nhắc nhở: ", targetBtn.textContent);
                    targetBtn.click();
                } else {
                    console.error("❌ Không tìm thấy nút trong popover tại index", SELECTORS.switchBtnIndex);
                }
            }, 300); // Đợi animation mở popover

        } catch (e) {
            console.error("❌ Lỗi trong quá trình auto-click:", e);
        }
    }

    // Chạy logic
    init();

})();
