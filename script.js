(function () {
    const API_URL = "https://fakestoreapi.com/products";
    const shimmerLoading = document.getElementById("shimmer-loading");
    const productList = document.getElementById("product-list");
    const categoryFilter = document.getElementById("category-filter");
    const sentinel = document.getElementById("sentinel");
    const perPage = 8;
    let allProducts = [];
    let filteredProducts = [];
    let displayedProducts = [];
    let currentPage = 1;
    let isLoading = false;

    const setupMenus = () => {
        const mobileBackdrop = document.getElementById("mobile-menu-backdrop");
        const mobileMenu = document.getElementById("mobile-menu");
        const menuBtn = document.getElementById("menu-btn");

        menuBtn.addEventListener("click", () => {
            mobileBackdrop.style.opacity = 1;
            mobileBackdrop.style.pointerEvents = 'all';
            mobileMenu.style.transform = 'translateX(0%)';
        });

        mobileBackdrop.addEventListener("click", () => {
            mobileBackdrop.style.opacity = 0;
            mobileBackdrop.style.pointerEvents = 'none';
            mobileMenu.style.transform = 'translateX(-100%)';
        });

        const filterButton = document.getElementById("filter-button");
        const backdrop = document.getElementById("backdrop");

        filterButton.addEventListener("click", () => {
            backdrop.style.display = 'flex';
        });

        backdrop.addEventListener("click", async () => {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) backdrop.style.display = 'none';
        });
    };

    const fetchProducts = async () => {
        shimmerLoading.style.display = "grid";
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Failed to fetch products.");
            allProducts = await response.json();
            filteredProducts = [...allProducts];
            populateFilters();
            resetPagination();
        } catch (error) {
            console.error("Error fetching products:", error.message);
        } finally {
            shimmerLoading.style.display = "none";
        }
    };

    const populateFilters = () => {
        if (!categoryFilter) return;
        const uniqueCategories = [...new Set(allProducts.map((product) => product.category))];

        categoryFilter.innerHTML = `<label><input type="radio" name="category" value="all" checked>All Categories</label>`;
        uniqueCategories.forEach((category) => {
            const label = document.createElement("label");
            label.innerHTML = `<input type="radio" name="category" value="${category}">${category}`;
            categoryFilter.appendChild(label);
        });

        categoryFilter.addEventListener("change", filterProducts);
    };

    const filterProducts = () => {
        const selectedCategory = document.querySelector('input[name="category"]:checked').value;
        if (selectedCategory === "all") {
            filteredProducts = allProducts;
        } else {
            filteredProducts = allProducts.filter((product) => product.category === selectedCategory);
        }

        const sortOptions = document.getElementById("sort-options");
        if (sortOptions) {
            sortOptions.selectedIndex = 0;
        }

        resetPagination();
    };

    const resetPagination = () => {
        currentPage = 1;
        displayedProducts = [];
        productList.innerHTML = "";
        loadProducts();
    };

    const loadProducts = async () => {
        if (isLoading) return;
        isLoading = true;

        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        const moreProducts = filteredProducts.slice(start, end);

        if (moreProducts.length > 0) {
            shimmerLoading.style.display = "grid";
            setTimeout(() => {
                displayedProducts = [...displayedProducts, ...moreProducts];
                renderProducts(displayedProducts);
                currentPage++;
                shimmerLoading.style.display = "none";
                isLoading = false;
            }, 500);
        } else {
            shimmerLoading.style.display = "none";
            isLoading = false;
        }
    };

    const renderProducts = (products) => {
        if (products.length === 0) {
            productList.innerHTML = `<p style="grid-column: 3; color: rgba(0, 0, 0, 0.5);" class="no-products-message">No products found</p>`;
        } else {
            productList.innerHTML = products
                .map(
                    (product) => `
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
          `
                )
                .join("");
        }
    };


    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };

    document.getElementById("search-bar").addEventListener(
        "input",
        debounce((e) => {
            const query = e.target.value.toLowerCase();
            const filtered = filteredProducts.filter(product => product.title.toLowerCase().includes(query));
            renderProducts(filtered);
        }, 300)
    );

    document.getElementById("sort-options").addEventListener("change", (e) => {
        const sortBy = e.target.value;
        filteredProducts.sort((a, b) => {
            if (sortBy === "price-asc") return a.price - b.price;
            if (sortBy === "price-desc") return b.price - a.price;
            if (sortBy === "name-asc") return a.title.localeCompare(b.title);
            if (sortBy === "name-desc") return b.title.localeCompare(a.title);
        });
        resetPagination();
    });

    const createObserver = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !isLoading) loadProducts();
            });
        });

        if (sentinel) observer.observe(sentinel);
    };

    fetchProducts().then(() => {
        createObserver();
        setupMenus();
    });
})();