// ==UserScript==
// @name         G-Drive auto download file
// @namespace    http://zuko.pro/
// @version      1.0
// @description  auto download when visiting drive url
// @author       Zuko <tansautn@gmail.com>
// @match        https://drive.usercontent.google.com/*
// @match        https://drive.google.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=drive.google.com
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  const uri = new URL(location.href);
  if(uri.searchParams.has('export') && uri.searchParams.get('export') == 'download'){
    const frm = document.getElementById('download-form');
    frm && frm.submit();
    console.info('click download in export - submit form download');
  }
  const tryRedirect = () => {
/*     const btnDown = document.querySelector('[role="button"][aria-label="Tải xuống"]');
    console.log(btnDown);
    if(btnDown){
      console.info('trying click');
      btnDown.click();
      //    return;
    } */
    const regex = /\/file\/d\/([^\/]+)\/view/;
    const match = uri.pathname.match(regex);
    if (match) {
      if (uri.host.includes('drive.google.com') && !confirm('Skip to download ?'))
        return;
      const id = match[1];

      console.log(id); // Output: 1KR2s5JG0-B8wJd7IzVOlQERHQRz-Vi1U
      console.log('id matched')
/*       const btnDown = document.querySelector('[role="button"][aria-label="Tải xuống"]');
      console.log(btnDown);
      if(btnDown){
        console.info('trying click 2');
        btnDown.click();
        //return;
      } */
      setTimeout(() => {
        const newUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download`;
        console.log('set href = ', newUrl);
        location.href = newUrl;
      },500)
    }
  }
  setTimeout(tryRedirect, 150);
  // Your code here...
})();
