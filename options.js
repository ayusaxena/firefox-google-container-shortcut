async function saveOptions(e) {
  e.preventDefault();
  browser.storage.local.set({
    choice: document.querySelector("#choice").value
  });
}

async function restoreOptions() {
  opt = await browser.storage.local.get("choice");
  document.querySelector("#choice").value = opt.choice || "auto";
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("change", saveOptions);
