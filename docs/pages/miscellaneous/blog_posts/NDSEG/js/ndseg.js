pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

const ndsegPdfs = [
    { url: "/pages/miscellaneous/blog_posts/NDSEG/assets/NDSEG_Essays.pdf", caption: "NDSEG Application Essays" },
    { url: "/pages/miscellaneous/blog_posts/NDSEG/assets/Redacted_Resume.pdf", caption: "Application Resume (Redacted)" },
];

function isMobile() {
    const userAgent = navigator.userAgent;
    return /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);
}

function generateFlexGrid(flex_grid_name, pdfFiles) {
    const grid = document.getElementById(flex_grid_name);
    grid.innerHTML = "";

    const isTouchDevice = isMobile();

    pdfFiles.forEach(pdf => {
        const item = document.createElement("div");
        item.classList.add("flex-item");

        const previewContainer = document.createElement("div");
        previewContainer.classList.add("pdf-preview-container");

        const canvas = document.createElement("canvas");
        previewContainer.appendChild(canvas);

        const downloadBtn = document.createElement("a");
        downloadBtn.classList.add("pdf-download-btn");
        downloadBtn.href = pdf.url;
        downloadBtn.download = pdf.url.split('/').pop();
        downloadBtn.target = "_blank";
        downloadBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
        `;
        downloadBtn.addEventListener("click", (event) => event.stopPropagation());

        if (isTouchDevice) {
            downloadBtn.classList.add("always-visible");
        }

        previewContainer.appendChild(downloadBtn);
        item.appendChild(previewContainer);

        const title = document.createElement("a");
        title.classList.add("pdf-title");
        title.href = pdf.url;
        title.textContent = pdf.caption;
        title.target = "_blank";
        title.rel = "noopener noreferrer";
        title.addEventListener("click", (event) => event.stopPropagation());
        item.appendChild(title);

        grid.appendChild(item);

        renderPDF(pdf.url, canvas);
        item.addEventListener("click", () => openPDF(pdf.url));
    });
}

async function renderPDF(url, canvas) {
    const pdf = await pdfjsLib.getDocument(url).promise;
    const page = await pdf.getPage(1);
    const context = canvas.getContext("2d");
    const viewport = page.getViewport({ scale: 1.0 });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport: viewport }).promise;
}

async function openPDF(pdfUrl) {
    document.getElementById("pdf-modal").style.display = "flex";
    document.body.style.overflow = "hidden";
    const pdfContainer = document.getElementById("pdf-container");
    pdfContainer.innerHTML = "";

    const pdfDoc = await pdfjsLib.getDocument(pdfUrl).promise;
    const totalPages = pdfDoc.numPages;

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
        const canvas = document.createElement("canvas");
        pdfContainer.appendChild(canvas);
        renderPDFPage(pdfDoc, pageNumber, canvas);
    }
}

async function renderPDFPage(pdfDoc, pageNumber, canvas) {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext("2d");
    await page.render({ canvasContext: context, viewport: viewport }).promise;

    canvas.style.width = "100%";
    canvas.style.height = "auto";
}

function closePDF(event) {
    if (event.target.id === "pdf-modal" || event.target.classList.contains("close-btn")) {
        document.getElementById("pdf-modal").style.display = "none";
        document.body.style.overflow = "auto";
    }
}

window.addEventListener("load", () => generateFlexGrid("ndseg-pdf-grid", ndsegPdfs));