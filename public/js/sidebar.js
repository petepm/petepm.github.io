document.addEventListener("DOMContentLoaded", function () {
  // Initialize all tree nodes as collapsed by default
  const treeChildren = document.querySelectorAll(".tree-children");
  treeChildren.forEach((child) => {
    child.classList.add("collapsed");
    child.classList.remove("expanded");
  });

  // Handle tree toggle clicks
  const treeToggles = document.querySelectorAll(".tree-toggle");
  treeToggles.forEach((toggle) => {
    // Handle clicks on the tree icon only (desktop) or the entire toggle (mobile)
    const treeIcon = toggle.querySelector(".tree-icon");

    // Desktop: click only on icon
    if (treeIcon) {
      treeIcon.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleTreeNode(toggle);
      });
    }

    // Mobile: click on entire toggle when icons are hidden
    toggle.addEventListener("click", function (e) {
      // Only handle if we're on mobile (icons hidden) or if clicking outside the icon
      const isMobile = window.innerWidth <= 767;
      const clickedIcon = e.target.classList.contains("tree-icon");

      if (isMobile || !clickedIcon) {
        // Don't interfere with link navigation on the tree-label
        if (
          !e.target.classList.contains("tree-label") &&
          !e.target.closest(".tree-label")
        ) {
          e.preventDefault();
          e.stopPropagation();
          toggleTreeNode(toggle);
        }
      }
    });

    // Handle keyboard accessibility on the toggle
    toggle.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        // If Enter is pressed, let the link navigate normally
        if (e.key === "Enter") {
          const link = this.querySelector(".tree-label");
          if (link && link.href) {
            return; // Allow normal navigation
          }
        }
        // If Space is pressed, toggle the tree
        if (e.key === " ") {
          e.preventDefault();
          toggleTreeNode(toggle);
        }
      }
    });
  });

  // Helper function to toggle tree nodes
  function toggleTreeNode(toggle) {
    const targetId = toggle.getAttribute("data-target");
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      // Toggle the expanded/collapsed state
      const isExpanded = targetElement.classList.contains("expanded");

      if (isExpanded) {
        targetElement.classList.remove("expanded");
        targetElement.classList.add("collapsed");
        toggle.classList.remove("expanded");
      } else {
        targetElement.classList.remove("collapsed");
        targetElement.classList.add("expanded");
        toggle.classList.add("expanded");
      }

      // Store the state in localStorage
      const storageKey = "tree-" + targetId;
      localStorage.setItem(storageKey, !isExpanded);
    }
  }

  // Auto-expand logic: both parents (when viewing children) and children (when viewing parents)
  const activeItems = document.querySelectorAll(
    ".sidebar-nav-item.active, .tree-toggle.active",
  );
  const autoExpandedTargets = new Set();

  activeItems.forEach((activeItem) => {
    // 1. Expand all parent containers (for context when viewing child pages)
    let parent = activeItem.closest(".tree-children");
    while (parent) {
      parent.classList.remove("collapsed");
      parent.classList.add("expanded");
      autoExpandedTargets.add(parent.id);

      // Find the corresponding toggle
      const parentId = parent.id;
      const parentToggle = document.querySelector(
        `[data-target="${parentId}"]`,
      );
      if (parentToggle) {
        parentToggle.classList.add("expanded");
      }

      // Move up to the next parent
      parent = parent.parentElement.closest(".tree-children");
    }

    // 2. If this is a tree-toggle (parent page), expand its children too
    if (activeItem.classList.contains("tree-toggle")) {
      const targetId = activeItem.getAttribute("data-target");
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        targetElement.classList.remove("collapsed");
        targetElement.classList.add("expanded");
        autoExpandedTargets.add(targetId);
        activeItem.classList.add("expanded");
      }
    }
  });

  // Restore tree states from localStorage (but don't override auto-expanded items)
  treeToggles.forEach((toggle) => {
    const targetId = toggle.getAttribute("data-target");
    const targetElement = document.getElementById(targetId);

    if (targetElement && !autoExpandedTargets.has(targetId)) {
      const storageKey = "tree-" + targetId;
      const savedState = localStorage.getItem(storageKey);

      if (savedState === "true") {
        targetElement.classList.remove("collapsed");
        targetElement.classList.add("expanded");
        toggle.classList.add("expanded");
      }
    }
  });

  // Sidebar Search Functionality
  const searchInput = document.getElementById("sidebar-search-input");
  const searchClear = document.getElementById("search-clear");
  const sidebar = document.getElementById("sidebar-nav");

  if (searchInput && sidebar) {
    // Get all searchable items
    const getAllSearchableItems = () => {
      return sidebar.querySelectorAll(
        ".sidebar-nav-item, .tree-toggle, .tree-node",
      );
    };

    // Highlight matching text
    const highlightText = (element, searchTerm) => {
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false,
      );

      const textNodes = [];
      let node;
      while ((node = walker.nextNode())) {
        textNodes.push(node);
      }

      textNodes.forEach((textNode) => {
        if (
          textNode.parentNode.tagName !== "SCRIPT" &&
          textNode.parentNode.tagName !== "STYLE"
        ) {
          const text = textNode.textContent;
          if (
            searchTerm &&
            text.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            const regex = new RegExp(`(${searchTerm})`, "gi");
            const highlightedText = text.replace(
              regex,
              '<span class="search-highlight">$1</span>',
            );
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = highlightedText;

            while (tempDiv.firstChild) {
              textNode.parentNode.insertBefore(tempDiv.firstChild, textNode);
            }
            textNode.remove();
          }
        }
      });
    };

    // Remove highlights
    const removeHighlights = () => {
      const highlights = sidebar.querySelectorAll(".search-highlight");
      highlights.forEach((highlight) => {
        const parent = highlight.parentNode;
        parent.replaceChild(
          document.createTextNode(highlight.textContent),
          highlight,
        );
        parent.normalize();
      });
    };

    // Filter items based on search
    const filterItems = (searchTerm) => {
      const items = getAllSearchableItems();
      let hasVisibleItems = false;

      items.forEach((item) => {
        const text = item.textContent.toLowerCase();
        const matches = !searchTerm || text.includes(searchTerm.toLowerCase());

        if (matches) {
          item.classList.remove("search-hidden");
          hasVisibleItems = true;

          // If this is a song (tree-leaf), make sure its parent album is visible and expanded
          if (item.classList.contains("tree-leaf")) {
            const parentAlbum = item.closest(".tree-node");
            if (parentAlbum) {
              parentAlbum.classList.remove("search-hidden");
              const albumToggle = parentAlbum.querySelector(".tree-toggle");
              const albumChildren = parentAlbum.querySelector(".tree-children");
              if (albumToggle && albumChildren) {
                albumChildren.classList.remove("collapsed");
                albumChildren.classList.add("expanded");
                albumToggle.classList.add("expanded");
              }
            }

            // Also ensure the main music section is expanded when searching
            const musicTree = document.getElementById("music-tree");
            const musicToggle = document.querySelector(
              '[data-target="music-tree"]',
            );
            if (musicTree && musicToggle) {
              musicTree.classList.remove("collapsed");
              musicTree.classList.add("expanded");
              musicToggle.classList.add("expanded");
            }
          }

          // If this is an album, ensure music section is expanded
          if (
            item.classList.contains("tree-toggle") &&
            item.closest(".music-albums")
          ) {
            const musicTree = document.getElementById("music-tree");
            const musicToggle = document.querySelector(
              '[data-target="music-tree"]',
            );
            if (musicTree && musicToggle) {
              musicTree.classList.remove("collapsed");
              musicTree.classList.add("expanded");
              musicToggle.classList.add("expanded");
            }
          }
        } else {
          item.classList.add("search-hidden");
        }
      });

      return hasVisibleItems;
    };

    // Search input handler
    searchInput.addEventListener("input", function (e) {
      const searchTerm = e.target.value.trim();

      // Remove previous highlights
      removeHighlights();

      if (searchTerm) {
        searchClear.style.display = "block";
        filterItems(searchTerm);

        // Add highlights
        const visibleItems = sidebar.querySelectorAll(
          ".sidebar-nav-item:not(.search-hidden), .tree-label:not(.search-hidden)",
        );
        visibleItems.forEach((item) => {
          if (
            item.textContent.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            highlightText(item, searchTerm);
          }
        });
      } else {
        searchClear.style.display = "none";
        filterItems("");

        // Restore original tree state
        treeChildren.forEach((child) => {
          child.classList.add("collapsed");
          child.classList.remove("expanded");
        });

        // Re-apply auto-expansion logic
        activeItems.forEach((activeItem) => {
          let parent = activeItem.closest(".tree-children");
          while (parent) {
            parent.classList.remove("collapsed");
            parent.classList.add("expanded");
            const parentId = parent.id;
            const parentToggle = document.querySelector(
              `[data-target="${parentId}"]`,
            );
            if (parentToggle) {
              parentToggle.classList.add("expanded");
            }
            parent = parent.parentElement.closest(".tree-children");
          }

          if (activeItem.classList.contains("tree-toggle")) {
            const targetId = activeItem.getAttribute("data-target");
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
              targetElement.classList.remove("collapsed");
              targetElement.classList.add("expanded");
              activeItem.classList.add("expanded");
            }
          }
        });
      }
    });

    // Clear button handler
    searchClear.addEventListener("click", function () {
      searchInput.value = "";
      searchInput.dispatchEvent(new Event("input"));
      searchInput.focus();
    });

    // Clear on Escape key
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        searchInput.value = "";
        searchInput.dispatchEvent(new Event("input"));
      }
    });
  }
});
