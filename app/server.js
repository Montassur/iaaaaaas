const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
app.use(express.json({ limit: "1mb" }));

const serverPort = process.env.PORT || 3000;
const dbUri = process.env.MONGO_URI || "mongodb://mongo:27017/store";

let database;
let itemsCollection;

const seedItems = [
  {
    name: "ThinkBook Pro 14",
    price: 1299,
    description: "Lightweight 14\" laptop with a crisp display and all-day battery life.",
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600",
    stock: 12
  },
  {
    name: "Aurora Smartphone X",
    price: 799,
    description: "Flagship phone with triple camera and OLED display.",
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600",
    stock: 25
  },
  {
    name: "SoundWave Headphones",
    price: 199,
    description: "Wireless over-ear headphones with active noise cancellation.",
    category: "Audio",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
    stock: 40
  },
  {
    name: "UrbanRunner Sneakers",
    price: 129,
    description: "Comfortable everyday sneakers built for the city.",
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
    stock: 60
  }
];

async function initDatabase() {
  const client = new MongoClient(dbUri);
  let attempt = 0;
  while (attempt < 30) {
    try {
      await client.connect();
      database = client.db();
      itemsCollection = database.collection("products");
      const itemCount = await itemsCollection.countDocuments();
      if (itemCount === 0) {
        await itemsCollection.insertMany(seedItems);
      }
      return;
    } catch (err) {
      attempt += 1;
      console.error(`Mongo connect attempt ${attempt} failed: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  throw new Error("MongoDB connection failed");
}

function sanitizeProduct(body) {
  const product = {};
  if (typeof body.name === "string") product.name = body.name.trim();
  if (body.price !== undefined) product.price = Number(body.price);
  if (typeof body.description === "string") product.description = body.description.trim();
  if (typeof body.category === "string") product.category = body.category.trim();
  if (typeof body.image === "string") product.image = body.image.trim();
  if (body.stock !== undefined) product.stock = Number(body.stock);
  return product;
}

function validateProduct(product, { partial = false } = {}) {
  const errors = [];
  if (!partial || product.name !== undefined) {
    if (!product.name) errors.push("name is required");
  }
  if (!partial || product.price !== undefined) {
    if (product.price === undefined || Number.isNaN(product.price) || product.price < 0) {
      errors.push("price must be a positive number");
    }
  }
  if (product.stock !== undefined && (Number.isNaN(product.stock) || product.stock < 0)) {
    errors.push("stock must be a positive number");
  }
  return errors;
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/products", async (req, res) => {
  try {
    const products = await itemsCollection.find({}).sort({ _id: -1 }).toArray();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await itemsCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: "Invalid product id" });
  }
});

app.post("/api/products", async (req, res) => {
  const product = sanitizeProduct(req.body || {});
  const errors = validateProduct(product);
  if (errors.length) return res.status(400).json({ errors });
  try {
    const result = await itemsCollection.insertOne(product);
    res.status(201).json({ _id: result.insertedId, ...product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/products/:id", async (req, res) => {
  const product = sanitizeProduct(req.body || {});
  const errors = validateProduct(product, { partial: true });
  if (errors.length) return res.status(400).json({ errors });
  try {
    const result = await itemsCollection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: product },
      { returnDocument: "after" }
    );
    const updated = result.value || result;
    if (!updated) return res.status(404).json({ error: "Product not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const result = await itemsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Product not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: "Invalid product id" });
  }
});

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nimbus Marketplace</title>
  <style>
    :root {
      --bg: #0f172a;
      --bg-soft: #111c34;
      --card: #1b2540;
      --card-hover: #22305a;
      --border: #2a3a66;
      --text: #e2e8f0;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --accent-strong: #0ea5e9;
      --danger: #ef4444;
      --success: #22c55e;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    a { color: var(--accent); text-decoration: none; }
    header {
      background: linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%);
      padding: 24px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }
    header h1 { margin: 0; font-size: 1.6rem; letter-spacing: 0.5px; }
    header .tagline { color: rgba(255,255,255,0.85); font-size: 0.9rem; margin-top: 4px; }
    main { max-width: 1200px; margin: 0 auto; padding: 32px 24px 80px; }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      gap: 16px;
      flex-wrap: wrap;
    }
    .search {
      flex: 1;
      min-width: 240px;
      padding: 12px 16px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--bg-soft);
      color: var(--text);
      font-size: 0.95rem;
    }
    .search:focus { outline: none; border-color: var(--accent); }
    button {
      cursor: pointer;
      font-size: 0.92rem;
      font-weight: 600;
      border-radius: 10px;
      padding: 11px 18px;
      border: none;
      transition: transform 0.12s, background 0.2s;
    }
    button:hover { transform: translateY(-1px); }
    .btn-primary { background: var(--accent-strong); color: white; }
    .btn-primary:hover { background: var(--accent); }
    .btn-secondary { background: transparent; color: var(--text); border: 1px solid var(--border); }
    .btn-secondary:hover { background: var(--card-hover); }
    .btn-danger { background: var(--danger); color: white; }
    .btn-danger:hover { background: #dc2626; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.18s, box-shadow 0.18s;
    }
    .card:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .card .image {
      width: 100%;
      aspect-ratio: 4 / 3;
      background: #0b1226 center/cover no-repeat;
      border-bottom: 1px solid var(--border);
    }
    .card .body { padding: 16px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .card .category { color: var(--accent); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; }
    .card .name { font-size: 1.05rem; font-weight: 600; }
    .card .desc { color: var(--muted); font-size: 0.85rem; line-height: 1.45; flex: 1; }
    .card .row { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
    .card .price { font-size: 1.15rem; font-weight: 700; color: var(--accent); }
    .card .stock { font-size: 0.8rem; color: var(--muted); }
    .card .actions { display: flex; gap: 8px; padding: 0 16px 16px; }
    .card .actions button { flex: 1; padding: 8px; font-size: 0.85rem; }
    .empty {
      text-align: center;
      padding: 80px 0;
      color: var(--muted);
    }
    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(2, 8, 23, 0.75);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 50;
      padding: 24px;
    }
    .modal-backdrop.open { display: flex; }
    .modal {
      background: var(--bg-soft);
      border: 1px solid var(--border);
      border-radius: 16px;
      width: 100%;
      max-width: 520px;
      padding: 28px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6);
    }
    .modal h2 { margin: 0 0 18px; font-size: 1.3rem; }
    .form-grid { display: grid; gap: 14px; }
    label { display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; color: var(--muted); }
    input, textarea, select {
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--text);
      font-family: inherit;
      font-size: 0.95rem;
    }
    input:focus, textarea:focus, select:focus { outline: none; border-color: var(--accent); }
    textarea { min-height: 80px; resize: vertical; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--card);
      border: 1px solid var(--border);
      border-left: 4px solid var(--success);
      color: var(--text);
      padding: 14px 18px;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      transform: translateY(120%);
      transition: transform 0.3s;
      z-index: 100;
    }
    .toast.show { transform: translateY(0); }
    .toast.error { border-left-color: var(--danger); }
    footer { text-align: center; color: var(--muted); font-size: 0.85rem; padding: 24px; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Nimbus Marketplace</h1>
      <div class="tagline">Discover, list and manage products in real time</div>
    </div>
    <button class="btn-primary" id="addBtn">+ New Product</button>
  </header>

  <main>
    <div class="toolbar">
      <input class="search" id="search" placeholder="Search products by name, category, description..." />
      <button class="btn-secondary" id="refreshBtn">Refresh</button>
    </div>
    <div id="grid" class="grid"></div>
    <div id="empty" class="empty" style="display:none;">No products yet. Click "New Product" to add one.</div>
  </main>

  <div class="modal-backdrop" id="modal">
    <div class="modal">
      <h2 id="modalTitle">New Product</h2>
      <form id="productForm" class="form-grid">
        <input type="hidden" id="productId" />
        <label>Name<input id="name" required maxlength="120" /></label>
        <label>Description<textarea id="description" maxlength="500"></textarea></label>
        <div class="row-2">
          <label>Price ($)<input id="price" type="number" min="0" step="0.01" required /></label>
          <label>Stock<input id="stock" type="number" min="0" step="1" value="0" /></label>
        </div>
        <label>Category
          <select id="category">
            <option>Electronics</option>
            <option>Audio</option>
            <option>Fashion</option>
            <option>Home</option>
            <option>Books</option>
            <option>Other</option>
          </select>
        </label>
        <label>Image URL<input id="image" type="url" placeholder="https://..." /></label>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" id="cancelBtn">Cancel</button>
          <button type="submit" class="btn-primary" id="saveBtn">Save</button>
        </div>
      </form>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <footer>Nimbus Marketplace &middot; Powered by Node, Express & MongoDB</footer>

  <script>
    const grid = document.getElementById("grid");
    const empty = document.getElementById("empty");
    const modal = document.getElementById("modal");
    const form = document.getElementById("productForm");
    const toast = document.getElementById("toast");
    const search = document.getElementById("search");
    let products = [];

    function showToast(msg, isError) {
      toast.textContent = msg;
      toast.classList.toggle("error", !!isError);
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 2500);
    }

    function openModal(product) {
      document.getElementById("modalTitle").textContent = product ? "Edit Product" : "New Product";
      document.getElementById("productId").value = product ? product._id : "";
      document.getElementById("name").value = product ? product.name : "";
      document.getElementById("description").value = product ? (product.description || "") : "";
      document.getElementById("price").value = product ? product.price : "";
      document.getElementById("stock").value = product ? (product.stock || 0) : 0;
      document.getElementById("category").value = product ? (product.category || "Other") : "Electronics";
      document.getElementById("image").value = product ? (product.image || "") : "";
      modal.classList.add("open");
    }

    function closeModal() { modal.classList.remove("open"); }

    function renderCard(p) {
      const img = p.image ? \`background-image:url('\${p.image.replace(/'/g, "%27")}')\` : "";
      return \`
        <article class="card" data-id="\${p._id}">
          <div class="image" style="\${img}"></div>
          <div class="body">
            <div class="category">\${(p.category || "Other")}</div>
            <div class="name">\${escapeHtml(p.name)}</div>
            <div class="desc">\${escapeHtml(p.description || "No description")}</div>
            <div class="row">
              <span class="price">$\${Number(p.price).toFixed(2)}</span>
              <span class="stock">\${p.stock != null ? p.stock + " in stock" : ""}</span>
            </div>
          </div>
          <div class="actions">
            <button class="btn-secondary" data-edit>Edit</button>
            <button class="btn-danger" data-delete>Delete</button>
          </div>
        </article>\`;
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    function render() {
      const q = search.value.trim().toLowerCase();
      const filtered = !q ? products : products.filter(p =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      );
      grid.innerHTML = filtered.map(renderCard).join("");
      empty.style.display = filtered.length ? "none" : "block";
    }

    async function loadProducts() {
      const res = await fetch("/api/products");
      products = await res.json();
      render();
    }

    grid.addEventListener("click", async (e) => {
      const card = e.target.closest(".card");
      if (!card) return;
      const id = card.dataset.id;
      if (e.target.matches("[data-edit]")) {
        const p = products.find(x => x._id === id);
        openModal(p);
      } else if (e.target.matches("[data-delete]")) {
        if (!confirm("Delete this product?")) return;
        const res = await fetch(\`/api/products/\${id}\`, { method: "DELETE" });
        if (res.ok) { showToast("Product deleted"); loadProducts(); }
        else showToast("Failed to delete", true);
      }
    });

    document.getElementById("addBtn").addEventListener("click", () => openModal(null));
    document.getElementById("cancelBtn").addEventListener("click", closeModal);
    document.getElementById("refreshBtn").addEventListener("click", loadProducts);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
    search.addEventListener("input", render);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("productId").value;
      const payload = {
        name: document.getElementById("name").value,
        description: document.getElementById("description").value,
        price: parseFloat(document.getElementById("price").value),
        stock: parseInt(document.getElementById("stock").value || "0", 10),
        category: document.getElementById("category").value,
        image: document.getElementById("image").value
      };
      const url = id ? \`/api/products/\${id}\` : "/api/products";
      const method = id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(id ? "Product updated" : "Product created");
        closeModal();
        loadProducts();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.errors ? err.errors.join(", ") : (err.error || "Save failed"), true);
      }
    });

    loadProducts();
  </script>
</body>
</html>`;

app.get("/", (req, res) => {
  res.type("html").send(indexHtml);
});

initDatabase()
  .then(() => {
    app.listen(serverPort, "0.0.0.0", () => {
      console.log(`Server listening on ${serverPort}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
