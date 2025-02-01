// ==UserScript==
// @name         Instagram Chat Deleter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.instagram.com/direct/*
// @grant        none
// ==/UserScript==

(() => {
  const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const getChatElements = () => {
    const chatElements = document.querySelectorAll(
      ".x13dflua.x19991ni > *"
    );
    console.log(`Found ${chatElements.length} chat elements`);
    // Convert to array and reverse in one step
    const reversedElements = [...chatElements].reverse();
    return reversedElements;
  };

  async function deleteOpenChat() {
    try {
      console.log("Starting deletion process for open chat");

      const infoButton = document.querySelector(
        'div[aria-expanded="false"]'
      );
      if (!infoButton) {
        throw new Error("Could not find info button");
      }

      infoButton.click();
      console.log("Clicked info button, waiting...");
      await sleep(1000);

      // Find and click delete button
      const deleteButton = Array.from(
        document.querySelectorAll('div[role="button"]')
      ).find((button) => button.textContent.includes("Delete chat"));
      if (!deleteButton) {
        throw new Error("Could not find delete button");
      }

      deleteButton.click();
      console.log("Clicked delete button, waiting...");
      await sleep(1000);

      // Find and click confirm button
      const confirmButton = Array.from(
        document.querySelectorAll("button")
      ).find((button) => button.textContent === "Delete");
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
      const lastMessageTime = chat.querySelector(".xdj266r");
      const avatarImage = chat.querySelector(
        'img[alt="User avatar"]'
      );
      const userName =
        chat.querySelector(".x1plvlek span")?.textContent;

      console.log("Checking chat:", {
        userName,
        timeStamp: lastMessageTime?.textContent,
        hasDeletedAvatar: avatarImage?.src?.includes(
          "84628273_176159830277856"
        ),
      });

      if (!lastMessageTime && !avatarImage) {
        console.log("Chat element missing required elements");
        return false;
      }

      if (
        lastMessageTime &&
        (lastMessageTime.textContent.includes("1y") ||
          lastMessageTime.textContent.includes("2y"))
      ) {
        console.log("Chat is old enough to delete");
        return true;
      }

      if (avatarImage?.src.includes("84628273_176159830277856")) {
        console.log("Chat has deleted account avatar");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error in isChatDeletable:", error);
      return false;
    }
  };

  async function openChat(chat) {
    chat.click();
    console.log("Clicked chat, waiting for load...");
    await sleep(1000);
  }

  async function deleteOldChats() {
    console.log("=== Starting deletion process for old chats ===");
    const chatElements = getChatElements();
    if (!chatElements.length) {
      console.log("No chat elements found on page");
      return;
    }
    chatElements
      .filter((c) => isChatOutdated(c))
      .map((c) => openChat(c).then(() => deleteOpenChat()));
    console.log("=== Deletion process completed ===");
  }

  async function deleteAllChatsWithConfirmation() {
    console.log("=== Starting deletion process for all chats ===");

    const chatElements = getChatElements();

    if (!chatElements.length) {
      console.log("No chat elements found on page");
      return;
    }

    console.log(
      `Found ${chatElements.length} chats to potentially delete`
    );

    let deletedCount = 0;
    for (const chat of chatElements) {
      console.log(
        `Attempting to delete chat ${deletedCount + 1} of ${
          chatElements.length
        }`
      );

      try {
        await openChat(chat);
        console.log("Chat opened, waiting for load...");
        await sleep(2000);

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
      await sleep(3000);
    }

    console.log("=== Deletion process completed ===");
    console.log(`Successfully deleted ${deletedCount} chats`);
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

  addButtons();
})();
