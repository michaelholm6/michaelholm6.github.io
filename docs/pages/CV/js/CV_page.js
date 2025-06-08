const CV = [{url: "/pages/CV/CV.pdf", caption: "Curriculum Vitae"}]

function isMobile() {
    const userAgent = navigator.userAgent;
    // Check for mobile devices based on the user agent (Android, iPhone, iPad, etc.)
    return /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);
  }

function generateFlexGrid(flex_grid_name, pdfFiles) {
    const grid = document.getElementById(flex_grid_name);
    grid.innerHTML = ""; // Clear old items

    const isTouchDevice = isMobile();

    pdfFiles.forEach(pdf => {
        const item = document.createElement("div");
        item.classList.add("flex-item");

        // Create container for preview (for hover effect)
        const previewContainer = document.createElement("div");
        previewContainer.classList.add("pdf-preview-container");

        // Create canvas for PDF preview
        const canvas = document.createElement("canvas");
        previewContainer.appendChild(canvas);

        // Create download button
        const downloadBtn = document.createElement("a");
        downloadBtn.classList.add("pdf-download-btn");
        downloadBtn.href = pdf.url;
        downloadBtn.download = pdf.url.split('/').pop(); // Extract filename
        downloadBtn.target = "_blank"; // Open in new tab

        // Add SVG download icon
        downloadBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
        `;

        downloadBtn.addEventListener("click", (event) => {
            event.stopPropagation(); // Stops the click from reaching the parent
        });

        if (isTouchDevice) {
            downloadBtn.classList.add("always-visible");
        }

        previewContainer.appendChild(downloadBtn);
        item.appendChild(previewContainer);

        // Create title
        const title = document.createElement("a");
        title.classList.add("pdf-title");
        title.textContent = pdf.caption;
        title.rel = "noopener noreferrer"; // Security best practice
        item.appendChild(title);
        title.addEventListener("click", (event) => {
            event.stopPropagation(); // Stops the click from reaching the parent
        });

        // Append item to grid
        grid.appendChild(item);

        // Render PDF preview
        renderPDF(pdf.url, canvas);

        // Click event to open full PDF
        item.addEventListener("click", () => openPDF(pdf.url));
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

window.addEventListener("load", generateFlexGrid("CV", CV));

let pdfDoc = null;
    let currentPage = 1;
    let scale = 1.5; // Adjust scale for better readability

    async function openPDF(pdfUrl) {
        document.getElementById("pdf-modal").style.display = "flex";
        document.body.style.overflow = "hidden";
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
            document.body.style.overflow = "auto";
        }
    }