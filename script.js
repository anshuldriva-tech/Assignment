const API_URL = "https://fakestoreapi.com/products";
const shimmerLoading = document.getElementById("shimmer-loading");
let allProducts = [];
let filteredProducts = [];
let displayedProducts = [];
let perPage = 8;
let currentPage = 1;
let isLoading = false;

// backdrop for mobile menu stuff
const mobileBackdrop = document.getElementById("mobile-menu-backdrop");

// the actual mobile menu element
const mobileMenu = document.getElementById("mobile-menu");

// hamburger menu button
const menuBtn = document.getElementById("menu-btn");

// open the mobile menu when u click the button
menuBtn.addEventListener("click", () => {
    mobileBackdrop.style.opacity = 1;
    mobileBackdrop.style.pointerEvents = 'all';
    mobileMenu.style.transform = 'translateX(0%)';
});

// close the mobile menu when clicking the backdrop
mobileBackdrop.addEventListener("click", () => {
    mobileBackdrop.style.opacity = 0;
    mobileBackdrop.style.pointerEvents = 'none';
    mobileMenu.style.transform = 'translateX(-100%)';
});

// filter btn to show/hide filter menu
const filterButton = document.getElementById("filter-button");
const backdrop = document.getElementById("backdrop");

// show the filter menu
filterButton.addEventListener("click", () => {
    backdrop.style.display = 'flex';
});

// hide the filter menu on backdrop click
backdrop.addEventListener("click", async () => {
    // check if mobile or tab
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent); // add more tests for tablet devicse

    // only hide if mobile
    if (isMobile) {
        backdrop.style.display = 'none';
    }
});

// fetch products from api (makes a request to get data basically and calls populate function)
const fetchProducts = async () => {
    shimmerLoading.style.display = 'grid';
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Failed to fetch products.");
        allProducts = await response.json();
        populateFilters(); // categories get added dynamically
        filterProducts(); // default load for all category
    } catch (error) {
        console.error(error.message);
    }
};

// fill in the category filters based on data fetch
const populateFilters = () => {
    const categoryFilter = document.getElementById("category-filter");
    const uniqueCategories = [...new Set(allProducts.map(p => p.category))];
    uniqueCategories.forEach(category => {
        const label = document.createElement("label");
        label.innerHTML = `
            <input type="radio" name="category" value="${category}">
            ${category}
        `;
        categoryFilter.appendChild(label);
    });

    // listen to clicks on the radio buttons
    categoryFilter.addEventListener("change", filterProducts);
};

// filter products based on the selected category - like electronics, etc
const filterProducts = () => {
    const selectedCategory = document.querySelector('input[name="category"]:checked').value;
    if (selectedCategory === "all") {
        filteredProducts = allProducts;
    } else {
        filteredProducts = allProducts.filter(product => product.category === selectedCategory);
    }
    resetPagination();
};

// resets pagination stuff when filters change
const resetPagination = () => {
    currentPage = 1;
    displayedProducts = [];
    loadProducts(); // start fresh with page 1
};

// handles infinite scrolling loading visuals
const shimmerLoad = async () => {
    shimmerLoading.style.display = 'none';
    if (isLoading) {
        shimmerLoading.style.display = 'grid';
    }
};

shimmerLoading.style.display = 'none';

// load products in chunks -pagination logic
const loadProducts = async () => {
    if (isLoading) return; // dont fetch twice at the same time
    isLoading = true;

    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const moreProducts = filteredProducts.slice(start, end);

    if (moreProducts.length > 0) {
        shimmerLoading.style.display = 'grid'; // show loader
        displayedProducts = displayedProducts.concat(moreProducts);
        renderProducts(displayedProducts);
        currentPage++;
    }

    isLoading = false;
};

// takes product data and puts it into html
const renderProducts = (products) => {
    const productList = document.getElementById("product-list");
    productList.innerHTML = products.map(product => `
    <div class="product-card">
      <div>
        <img src="${product.image}" alt="${product.title}">
      </div>
      <div>
        <h3>${product.title}</h3>
        <p>${product.description}</p>
        <p><strong>$${product.price}</strong></p>
      </div>
    </div>
  `).join("");
};

// search functionality for product titles
document.getElementById("search-bar").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = filteredProducts.filter(product =>
        product.title.toLowerCase().includes(query)
    );
    renderProducts(filtered);
});

// sorting options dropdown - by price or name, asc/desc
document.getElementById("sort-options").addEventListener("change", (e) => {
    const sortBy = e.target.value;
    filteredProducts.sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "name-asc") return a.title.localeCompare(b.title);
        if (sortBy === "name-desc") return b.title.localeCompare(a.title);
    });
    resetPagination(); // refresh view after sorting
});

// infinite scrolling with intersection observer (todo: read more about intersection observer)
const createObserver = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                shimmerLoading.style.display = 'grid'; // show loader
                setTimeout(() => {
                    loadProducts(); // load more when reaching bottom
                    shimmerLoading.style.display = 'none'; // hide loader
                }, 1000);
            }
        });
    });

    const sentinel = document.getElementById("sentinel");
    if (sentinel) {
        observer.observe(sentinel);
    }
};

// start fetching and set up infinite scrolling
fetchProducts().then(createObserver);
