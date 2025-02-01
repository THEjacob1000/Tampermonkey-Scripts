// ==UserScript==
// @name         Auto Endorser
// @namespace    http://tampermonkey.net/
// @version      2024-01-29
// @description  try to take over the world!
// @author       You
// @match        https://www.linkedin.com/in/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(() => {
  let interval = null;
  let skills = null;

  const endorseBtnSelector =
    "ul.pvs-list .pv2 button.artdeco-button .artdeco-button__text";
  const loadMoreBtnSelector = ".scaffold-finite-scroll__load-button";

  const getSkillsToEndorse = () => {
    return Array.from(
      document.querySelectorAll(endorseBtnSelector)
    ).filter((e) => e.innerText === "Endorse");
  };

  const stop = () => {
    clearInterval(interval);
    console.log("Done!");
  };

  const run = () => {
    interval = setInterval(() => {
      const loadMoreBtn = document.querySelector(loadMoreBtnSelector);
      skills = getSkillsToEndorse();

      if (loadMoreBtn && !skills.length) {
        loadMoreBtn.click();
        clearInterval(interval);
        setTimeout(() => {
          run();
        }, 500);
      } else {
        const skills = getSkillsToEndorse();
        if (!skills.length) {
          stop();
        } else {
          skills[0].click();
        }
      }
    }, 3000);
  };

  // Listen for keydown event
  document.addEventListener("keydown", (e) => {
    // Check if Ctrl+Alt+A is pressed
    if (e.ctrlKey && e.altKey && e.key === "a") {
      run(); // Run the script only when Ctrl+Alt+A is pressed
    }
  });
})();
