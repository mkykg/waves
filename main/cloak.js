function cloak() {
    const win = window.open("about:blank", "_blank");
    if (!win) return alert("Popup blocked! Please allow popups.");

    const doc = win.document;
    const iframe = doc.createElement("iframe");

    iframe.src = location.href;
    iframe.style.border = "none";
    iframe.style.width = "100vw";
    iframe.style.height = "100vh";

    doc.body.style.margin = "0";
    doc.body.appendChild(iframe);

    window.location.replace("https://google.com/");
}