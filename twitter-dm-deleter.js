// ==UserScript==
// @name         Twitter Chat Deleter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://x.com/messages/*
// @grant        none
// @require      file://C:/Users/Sandy/Documents/GitHub/Tampermonkey-Scripts/twitter-dm-deleter.js
// ==/UserScript==

(() => {
  let isScriptRunning = false;
  let cancelRequested = false;

  const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const getChatElements = () => {
    const chatElements = document.querySelectorAll(
      'div[role="none"][data-testid="conversation"]'
    );
    console.log(`Found ${chatElements.length} chat elements`);
    // Convert to array and reverse in one step
    const reversedElements = [...chatElements].reverse();
    return reversedElements;
  };

  async function deleteOpenChat() {
    if (cancelRequested) return false;
    try {
      console.log("Starting deletion process for open chat");

      const infoButton = document.querySelector(
        'a[role="link"][aria-label="Conversation info"][href^="/messages/"][href$="/info"]'
      );
      if (!infoButton) {
        throw new Error("Could not find info button");
      }

      infoButton.click();
      console.log("Clicked info button, waiting...");
      await sleep(1000);

      if (cancelRequested) return false;

      // Find and click delete button
      const leaveButton = Array.from(
        document.querySelectorAll('button[role="button"]')
      ).find((button) => {
        const spanText = button.querySelector(
          'span:not([class*="r-"])'
        );
        return spanText?.textContent.trim() === "Leave conversation";
      });
      if (!leaveButton) {
        throw new Error("Could not find delete button");
      }

      leaveButton.click();
      console.log("Clicked delete button, waiting...");
      await sleep(1000);

      if (cancelRequested) return false;

      // Find and click confirm button
      const confirmButton = document.querySelector(
        'button[data-testid="confirmationSheetConfirm"]'
      );
      if (!confirmButton) {
        throw new Error("Could not find confirm button");
      }

      confirmButton.click();
      console.log("Clicked confirm button, waiting...");
      await sleep(2000); // Increased wait time after deletion

      return true;
    } catch (error) {
      console.error("Error deleting chat:", error);
      return false;
    }
  }

  const isChatOutdated = (chat) => {
    try {
      const dateElement = chat.querySelector("time[datetime]");
      if (!dateElement) {
        console.log("Chat element missing date information");
        return false;
      }

      const chatDate = new Date(dateElement.getAttribute("datetime"));
      const currentDate = new Date();
      const sixMonthsAgo = new Date(
        currentDate.setMonth(currentDate.getMonth() - 6)
      );

      const isOutdated = chatDate < sixMonthsAgo;

      return isOutdated;
    } catch (error) {
      console.error("Error in isChatOutdated:", error);
      return false;
    }
  };

  async function openChat(chat) {
    if (cancelRequested) return;
    chat.click();
    console.log("Clicked chat, waiting for load...");
    await sleep(1000);
  }

  async function deleteOldChats() {
    console.log("=== Starting deletion process for old chats ===");
    isScriptRunning = true;
    cancelRequested = false;
    addCancelButton();

    let hasMoreChatsToDelete = true;

    while (hasMoreChatsToDelete && !cancelRequested) {
      const chatElements = getChatElements();
      if (!chatElements.length) {
        console.log("No chat elements found on page");
        hasMoreChatsToDelete = false;
        break;
      }

      const outdatedChats = chatElements.filter((c) =>
        isChatOutdated(c)
      );
      if (outdatedChats.length === 0) {
        console.log("No more outdated chats found");
        hasMoreChatsToDelete = false;
        break;
      }

      console.log(
        `Found ${outdatedChats.length} outdated chats to delete`
      );

      for (const chat of outdatedChats) {
        if (cancelRequested) break;
        await openChat(chat);
        await deleteOpenChat();
        await sleep(2000); // Wait for deletion to complete and page to update
      }

      // Wait for the page to potentially load more chats
      if (!cancelRequested) await sleep(5000);
    }

    console.log(
      cancelRequested
        ? "=== Deletion process cancelled ==="
        : "=== Deletion process completed ==="
    );
    isScriptRunning = false;
    removeCancelButton();
  }

  async function deleteAllChatsWithConfirmation() {
    console.log("=== Starting deletion process for all chats ===");
    isScriptRunning = true;
    cancelRequested = false;
    addCancelButton();

    const chatElements = getChatElements();

    if (!chatElements.length) {
      console.log("No chat elements found on page");
      isScriptRunning = false;
      removeCancelButton();
      return;
    }

    console.log(
      `Found ${chatElements.length} chats to potentially delete`
    );

    let deletedCount = 0;
    for (const chat of chatElements) {
      if (cancelRequested) break;
      console.log(
        `Attempting to delete chat ${deletedCount + 1} of ${
          chatElements.length
        }`
      );

      try {
        await openChat(chat);
        console.log("Chat opened, waiting for load...");
        await sleep(2000);

        if (cancelRequested) break;

        if (confirm("Do you want to delete this chat?")) {
          console.log(
            "User confirmed deletion, attempting to delete"
          );
          const success = await deleteOpenChat();
          if (success) {
            deletedCount++;
            console.log(
              `Successfully deleted chat ${deletedCount} of ${chatElements.length}`
            );
          } else {
            console.error("Failed to delete chat");
          }
        } else {
          deletedCount++;
          console.log("Chat deletion cancelled by user");
          await sleep(2000);
        }

        if (cancelRequested) break;

        // Navigate back to the inbox
        const backButton = document.querySelector(
          'div[role="button"][aria-label="Back"]'
        );
        if (backButton) {
          backButton.click();
          await sleep(2000);
        }
      } catch (error) {
        console.error("Error processing chat:", error);
      }

      // Wait a bit before moving to the next chat
      if (!cancelRequested) await sleep(3000);
    }

    console.log(
      cancelRequested
        ? "=== Deletion process cancelled ==="
        : "=== Deletion process completed ==="
    );
    console.log(`Successfully deleted ${deletedCount} chats`);
    isScriptRunning = false;
    removeCancelButton();
  }

  const addButtons = () => {
    const bulkButton = document.createElement("button");
    bulkButton.textContent = "Delete Old Chats";
    bulkButton.style.cssText = `
            position: fixed;
            top: 15px;
            right: 130px;
            z-index: 9999;
            padding: 10px;
            background: #ff3040;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;
    bulkButton.onclick = () => {
      console.log("Delete Old Chats button clicked");
      deleteOldChats();
    };
    document.body.appendChild(bulkButton);

    const singleButton = document.createElement("button");
    singleButton.textContent = "Delete This Chat";
    singleButton.style.cssText = `
            position: fixed;
            top: 15px;
            right: 260px;
            z-index: 9999;
            padding: 10px;
            background: #ff3040;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;
    singleButton.onclick = () => {
      console.log("Delete This Chat button clicked");
      deleteOpenChat();
    };
    document.body.appendChild(singleButton);

    const allChatsButton = document.createElement("button");
    allChatsButton.textContent = "Delete All Chats";
    allChatsButton.style.cssText = `
            position: fixed;
            top: 15px;
            right: 390px;
            z-index: 9999;
            padding: 10px;
            background: #ff3040;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;
    allChatsButton.onclick = () => {
      console.log("Delete All Chats button clicked");
      deleteAllChatsWithConfirmation();
    };
    document.body.appendChild(allChatsButton);

    console.log("Delete buttons added to page");
  };

  const addCancelButton = () => {
    const cancelButton = document.createElement("button");
    cancelButton.id = "cancelScriptButton";
    cancelButton.textContent = "Cancel Deletion";
    cancelButton.style.cssText = `
            position: fixed;
            top: 15px;
            right: 520px;
            z-index: 9999;
            padding: 10px;
            background: #1DA1F2;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;
    cancelButton.onclick = () => {
      console.log("Cancel button clicked");
      cancelRequested = true;
    };
    document.body.appendChild(cancelButton);
  };

  const removeCancelButton = () => {
    const cancelButton = document.getElementById(
      "cancelScriptButton"
    );
    if (cancelButton) {
      cancelButton.remove();
    }
  };

  addButtons();
})();
