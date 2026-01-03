<a href="http://zuko.pro/">
    <img src="https://avatars0.githubusercontent.com/u/6666271?v=3&s=96" alt="Z-Logo"
         title="Halu Universe" align="right" />
</a>
# mokey-scripts

# 💠 Zuko's Monkeys :diamond_shape_with_a_dot_inside:

Welcome to the **monkey-scripts** repository! This repository is dedicated to hosting and sharing custom userscripts for Tampermonkey (or Greasemonkey, Violentmonkey) and custom styles for webpages using the Stylebot or Stylus extension.

## What are user scripts?

[User scripts](https://en.wikipedia.org/wiki/Userscript) put you in control of your browsing experience. Once installed, they automatically make the sites you visit better by adding features, making them easier to use, or taking out the annoying bits. This repository contains a collection of userscripts designed to enhance your browsing experience by automating tasks or modifying webpage behavior. In addition, it includes custom styles that can be applied to webpages to improve their appearance or usability.

## Table of Contents

- [Introduction](#what-are-user-scripts)
- [Userscripts](#userscripts)
- [Custom Styles](#custom-styles)
- [Installation](#installation)
- [Contributing](#contributing)
- [License](#license)

## Userscripts

> These scripts are compatible with popular browser extensions such as [Tampermonkey](https://en.wikipedia.org/wiki/Tampermonkey), [Violentmonkey](https://en.wikipedia.org/wiki/Violentmonkey), and [Greasemonkey](https://en.wikipedia.org/wiki/Greasemonkey).

### Available Userscripts
| **Userscript Name**           | **Description**                                                                                               |
|-------------------------------|---------------------------------------------------------------------------------------------------------------|
| Soundcloud fck Tungtee         | Removing annoying tracks from "Tùng Tee - 0967671***". Music browsing becomes cleaner.                       |
| Gist copy raw file             | Add "Copy Raw" button to github Gist                                                                         |
| G-Drive auto download file     | Auto download from drive.google.com when visit single file url                                               |
| G-AI Studio-Account-Strictly   | Auto open account chooser when visiting Google AI studio (as i usually open from bookmark                    |
| *...*                          | *...*                                                                                                        |


## Custom Styles

> Custom styles are CSS rules that change the appearance of specific webpages. These styles can be applied using the Stylebot extension.

### Available Styles

| **Style Name**                 | **Description**                                                                                               |
|-------------------------------|---------------------------------------------------------------------------------------------------------------|
| SC Darkmode                    | Darkmode for soundcloud.com. Main part taken from somewhere. Modifications to playback controls and comments made by me. |
| Github Darkmode (with texture bg | Darkmode for github.com                                                                                    |
| *...*                          | *...*                                                                                                        |


## Installation

### Userscripts (Tampermonkey, Violentmonkey, Greasemonkey)

1. Install the [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), or [Greasemonkey](https://www.greasespot.net/) extension for your browser.
2. Browse the [Userscripts](#userscripts) section and click on the script you want to install.
3. The extension will prompt you to confirm the installation.

### Custom Styles (Stylebot)

1. Install the [Stylebot extension](https://stylebot.dev/) for your browser.
2. Browse the [Custom Styles](#custom-styles) section and copy the CSS code.
3. Open Stylebot on the webpage you want to apply the style to and paste the CSS code.

## Contributing

Contributions are welcome! If you have a userscript or custom style you'd like to share, please follow these steps:

1. Fork the repository.
2. Create a new branch with your changes.
3. Submit a pull request with a description of your contribution.

## Use IDE to develop JS ?
1. You will need a server to serve the developing js file.
2. Then create empty script that require your editing file.
+ Ex: `// @require      https://shx.test/script.js`.
+ Full header will be like:
```
// ==UserScript==
// @name         Hypeddit DownloadWallBypasser 2k24
// @namespace    http://tampermonkey.net/
// @version      2024-07-24
// @description  Bypass the fangates. Soundcloud and Spotify accounts are mandatory! Please make sure to log them on first before running the script!
// @author       fan1200
// @match        https://hypeddit.com/*
// @match        https://pumpyoursound.com/*
// @match        https://secure.soundcloud.com/connect*
// @match        https://secure.soundcloud.com/authorize*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hypeddit.com
// @grant        none
// @require      https://shx.test/script.js
// ==/UserScript==
```
+ The `shx.test` were run on my local development server.
4. Don't forget clear cached script on your Monkey extension
## License

This repository is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.
```
                                   M""""""""`M            dP
                                   Mmmmmm   .M            88
                                   MMMMP  .MMM  dP    dP  88  .dP   .d8888b.
                                   MMP  .MMMMM  88    88  88888"    88'  `88
                                   M' .MMMMMMM  88.  .88  88  `8b.  88.  .88
                                   M         M  `88888P'  dP   `YP  `88888P'
                                   MMMMMMMMMMM    -*-  Created by Zuko  -*-
                                          
                                   * * * * * * * * * * * * * * * * * * * * *
                                   * -    - -   F.R.E.E.M.I.N.D   - -    - *
                                   * -  Copyright © 2024 (Z) Programing  - *
                                   *    -  -  All Rights Reserved  -  -    *
                                   * * * * * * * * * * * * * * * * * * * * *
