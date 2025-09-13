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
    // Handle clicks on the tree icon only
    const treeIcon = toggle.querySelector(".tree-icon");
    if (treeIcon) {
      treeIcon.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

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
      });
    }

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
          const treeIcon = this.querySelector(".tree-icon");
          if (treeIcon) {
            treeIcon.click();
          }
        }
      }
    });
  });

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
});
