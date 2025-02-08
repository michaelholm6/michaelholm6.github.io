const pdfFiles = [
    "/assets/publications/first author/IITSEC_2021.pdf",
    "/assets/publications/first author/LIM_2024.pdf",
    "/assets/publications/first author/JIST_2024.pdf"
];

function generateFlexGrid() {
    const grid = document.getElementById("flex-grid");
    grid.innerHTML = ""; // Clear old items

    pdfFiles.forEach(pdfUrl => {
        const item = document.createElement("div");
        item.classList.add("flex-item");

        const canvas = document.createElement("canvas");
        item.appendChild(canvas);

        const title = document.createElement("div");
        title.classList.add("pdf-title");
        title.textContent = pdfUrl.split('/').pop();
        item.appendChild(title);

        grid.appendChild(item);

        renderPDF(pdfUrl, canvas);

        item.addEventListener("click", () => openPDF(pdfUrl));
    });
}

async function renderPDF(url, canvas) {
    const pdf = await pdfjsLib.getDocument(url).promise;
    const page = await pdf.getPage(1); // Render first page
    const context = canvas.getContext("2d");
    const viewport = page.getViewport({ scale: 1.0 });

    // Set canvas dimensions
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext = { canvasContext: context, viewport: viewport };
    await page.render(renderContext).promise;
}

window.addEventListener("load", generateFlexGrid);

let pdfDoc = null;
    let currentPage = 1;
    let scale = 1.5; // Adjust scale for better readability

    async function openPDF(pdfUrl) {
        document.getElementById("pdf-modal").style.display = "flex";
        const pdfContainer = document.getElementById("pdf-container");
        pdfContainer.innerHTML = ""; // Clear previous content

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
    
        // Use the default viewport to avoid text distortion
        const viewport = page.getViewport({ scale: 2 });  
    
        // Set the canvas dimensions to match the PDF page
        canvas.width = viewport.width;
        canvas.height = viewport.height;
    
        const context = canvas.getContext("2d");
        const renderContext = { canvasContext: context, viewport: viewport };
        await page.render(renderContext).promise;
    
        // Let CSS handle responsiveness instead of modifying the scale
        canvas.style.width = "100%";
        canvas.style.height = "auto";
    }

    function closePDF(event) {
        // If clicked outside the content area, close the modal
        if (event.target.id === "pdf-modal" || event.target.classList.contains("close-btn")) {
            document.getElementById("pdf-modal").style.display = "none";
        }
    }