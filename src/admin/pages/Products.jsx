import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight,
  X, ChevronDown, Upload, GripVertical, AlertCircle, Loader2
} from 'lucide-react';
import useAdminStore from '../store/adminStore';
import { getAdminProducts, createProduct as apiCreateProduct, updateProduct as apiUpdateProduct, deleteProduct as apiDeleteProduct, getAdminCategories, uploadImage } from '../adminApi';
import { useCurrency } from '../../utils/currency';

const CORAL = '#111111';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const CATEGORIES_MAP = {
  Electronics: ['Phones', 'Laptops', 'Cameras', 'Audio', 'Accessories'],
  Fashion: ['Men', 'Women', 'Kids', 'Accessories'],
  'Home & Living': ['Furniture', 'Decor', 'Kitchen', 'Bedding'],
  Sports: ['Fitness', 'Outdoor', 'Team Sports'],
  Beauty: ['Skincare', 'Makeup', 'Fragrance'],
};

const INITIAL_PRODUCTS = [
  { id:1,  name:'Wireless Noise-Cancelling Headphones', sku:'SKU-001', category:'Electronics', price:149, stock:20, status:'active',  bg:'linear-gradient(135deg,#667eea,#764ba2)' },
  { id:2,  name:'Ultra-Slim Smart Watch Series X',       sku:'SKU-002', category:'Electronics', price:299, stock:8,  status:'active',  bg:'linear-gradient(135deg,#f093fb,#f5576c)' },
  { id:3,  name:'Premium Leather Backpack',              sku:'SKU-003', category:'Fashion',     price:89,  stock:35, status:'active',  bg:'linear-gradient(135deg,#4facfe,#00f2fe)' },
  { id:4,  name:'Ergonomic Office Chair Pro',            sku:'SKU-004', category:'Home & Living',price:399,stock:3,  status:'active',  bg:'linear-gradient(135deg,#43e97b,#38f9d7)' },
  { id:5,  name:'Mechanical Gaming Keyboard RGB',        sku:'SKU-005', category:'Electronics', price:129, stock:50, status:'active',  bg:'linear-gradient(135deg,#fa709a,#fee140)' },
  { id:6,  name:'Portable Bluetooth Speaker 360°',       sku:'SKU-006', category:'Electronics', price:79,  stock:22, status:'active',  bg:'linear-gradient(135deg,#a18cd1,#fbc2eb)' },
  { id:7,  name:'Premium Non-Slip Yoga Mat Pro',         sku:'SKU-007', category:'Sports',      price:49,  stock:60, status:'active',  bg:'linear-gradient(135deg,#fddb92,#d1fdff)' },
  { id:8,  name:'Smart Coffee Maker 12-Cup',             sku:'SKU-008', category:'Home & Living',price:119,stock:18, status:'inactive',bg:'linear-gradient(135deg,#89f7fe,#66a6ff)' },
  { id:9,  name:'Lightweight Trail Running Shoes',       sku:'SKU-009', category:'Sports',      price:189, stock:0,  status:'inactive',bg:'linear-gradient(135deg,#fddb92,#d1fdff)' },
  { id:10, name:'Hydrating Skincare Essentials Set',     sku:'SKU-010', category:'Beauty',      price:69,  stock:100,status:'active',  bg:'linear-gradient(135deg,#ffecd2,#fcb69f)' },
  { id:11, name:'LED Architect Desk Lamp',               sku:'SKU-011', category:'Home & Living',price:55, stock:7,  status:'active',  bg:'linear-gradient(135deg,#a1c4fd,#c2e9fb)' },
  { id:12, name:'Insulated Protein Shaker Bottle',       sku:'SKU-012', category:'Sports',      price:29,  stock:200,status:'active',  bg:'linear-gradient(135deg,#d4fc79,#96e6a1)' },
];

const STATUS_BADGE = {
  active:   { label:'Active',       bg:'#dcfce7', text:'#16a34a' },
  inactive: { label:'Inactive',     bg:'#F8F8F6', text:'#64748b' },
  draft:    { label:'Draft',        bg:'#fef9c3', text:'#ca8a04' },
};

// ─── Skeleton Rows ─────────────────────────────────────────────────────────────
function SkeletonRows() {
  return Array.from({ length: 8 }).map((_, i) => (
    <tr key={i} className="border-b border-[#E8E8E4] animate-pulse">
      <td className="px-4 py-3"><div className="w-4 h-4 bg-[#E8E8E4] rounded" /></td>
      <td className="px-4 py-3"><div className="w-10 h-10 bg-[#E8E8E4] rounded-sm" /></td>
      <td className="px-4 py-3"><div className="h-3 w-40 bg-[#E8E8E4] rounded-full" /></td>
      <td className="px-4 py-3"><div className="h-3 w-24 bg-[#E8E8E4] rounded-full" /></td>
      <td className="px-4 py-3"><div className="h-3 w-16 bg-[#E8E8E4] rounded-full" /></td>
      <td className="px-4 py-3"><div className="h-3 w-10 bg-[#E8E8E4] rounded-full" /></td>
      <td className="px-4 py-3"><div className="h-6 w-16 bg-[#E8E8E4] rounded-full" /></td>
      <td className="px-4 py-3"><div className="flex gap-2"><div className="w-7 h-7 bg-[#E8E8E4] rounded-sm" /><div className="w-7 h-7 bg-[#E8E8E4] rounded-sm" /></div></td>
    </tr>
  ));
}

// ─── Section wrapper — MUST be outside ProductForm so React doesn't remount it ─
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-sm border border-[#E8E8E4] p-5 mb-4">
      <h3 className="font-bold text-[#111111] mb-4 pb-3 border-b border-[#E8E8E4]">{title}</h3>
      {children}
    </div>
  );
}

// ─── Product Form ─────────────────────────────────────────────────────────────
function ProductForm({ initial, saving, onCancel, onSave, categories }) {
  const { formatPrice, symbol } = useCurrency();
  const defaults = {
    name:'', category:'', subcategory:'', brand:'', status:'active',
    price:'', comparePrice:'', costPrice:'', sku:'', barcode:'', stock:'', trackInventory:true,
    description:'', metaTitle:'', metaDescription:'', metaKeywords:'', slug:'',
    images:[], variants:[], specs:{}, isFeatured: false,
  };
  const [form, setForm] = useState({ ...defaults, ...(initial || {}), images: (initial?.images || []), variants: (initial?.variants || []), specs: (initial?.specs || {}) });
  const [variantRow, setVariantRow] = useState({ size:'', color:'', price:'', stock:'' });
  const [bulkSpecs, setBulkSpecs] = useState('');

  const parseBulkSpecsText = (text) => {
    if (!text || !text.trim()) return {};
    const lines = text.split('\n');
    const newSpecs = {};
    lines.forEach(line => {
      let separator = ':';
      if (!line.includes(':') && line.includes('-')) separator = '-';
      if (!line.includes(':') && !line.includes('-') && line.includes('\t')) separator = '\t';
      
      const parts = line.split(separator);
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join(separator).trim();
        if (key && val) newSpecs[key] = val;
      }
    });
    return newSpecs;
  };

  const addBulkSpecs = () => {
    const parsed = parseBulkSpecsText(bulkSpecs);
    if (Object.keys(parsed).length > 0) {
      set('specs', { ...form.specs, ...parsed });
    }
    setBulkSpecs('');
  };

  const removeSpec = (k) => {
    const newSpecs = { ...form.specs };
    delete newSpecs[k];
    set('specs', newSpecs);
  };

  const set = (key, val) => setForm(f => {
    const updated = { ...f, [key]: val };
    if (key === 'name') {
      updated.slug = val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    return updated;
  });

  const addVariant = () => {
    if (!variantRow.size && !variantRow.color) return;
    set('variants', [...form.variants, { ...variantRow, id: Date.now() }]);
    setVariantRow({ size:'', color:'', price:'', stock:'' });
  };

  const inputCls = 'w-full border border-[#D0D0CA] rounded-sm px-3 py-2.5 text-sm text-[#111111] outline-none focus:border-[#C9A96E] transition-all bg-white';
  const labelCls = 'block text-xs font-semibold text-[#6B6B6B] mb-1.5';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-[#111111]">{initial ? 'Edit Product' : 'Add New Product'}</h2>
          <p className="text-[#9E9E9E] text-sm mt-0.5">Fill in the details below</p>
        </div>
        <button onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-sm font-medium text-[#6B6B6B] hover:bg-[#F8F8F6] transition-all">
          <X size={15} /> Cancel
        </button>
      </div>

      {/* Section 1 — Basic Info */}
      <Section title="Basic Information">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelCls}>Product Name *</label>
            <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Enter product name" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Category</label>
              <select className={inputCls} value={form.category} onChange={e => { set('category', e.target.value); set('subcategory',''); }}>
                <option value="">Select category</option>
                {(categories || []).map(c => <option key={c._id || c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Subcategory</label>
              <select className={inputCls} value={form.subcategory} onChange={e => set('subcategory', e.target.value)} disabled={!form.category}>
                <option value="">Select subcategory</option>
                {(CATEGORIES_MAP[form.category] || []).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Brand</label>
              <input className={inputCls} value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Brand name" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <div className="flex gap-2">
              {['active','inactive','draft'].map(s => (
                <button key={s} onClick={() => set('status', s)}
                  className={`px-4 py-2 rounded-sm text-sm font-medium border-2 capitalize transition-all ${form.status === s ? 'border-[#111111] text-[#111111] bg-[#111111]/10' : 'border-slate-200 text-[#6B6B6B]'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Section 2 — Pricing & Stock */}
      <Section title="Pricing & Inventory">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
          {[[`Selling Price (${symbol})`, 'price'], [`Original Price / MRP (${symbol})`, 'comparePrice'], [`Cost Price (${symbol})`, 'costPrice']].map(([l, k]) => (
            <div key={k}>
              <label className={labelCls}>{l}</label>
              <input type="number" className={inputCls} value={form[k]} onChange={e => set(k, e.target.value)} placeholder="0.00" />
            </div>
          ))}
        </div>
        {form.price && form.comparePrice && Number(form.comparePrice) > Number(form.price) && (
          <p className="text-xs mb-4 text-[#E53935] font-semibold">
            🏷️ Discount: {Math.round(((Number(form.comparePrice) - Number(form.price)) / Number(form.comparePrice)) * 100)}% OFF — Customer will see crossed-out original price
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[['SKU', 'sku'], ['Barcode', 'barcode'], ['Stock Qty', 'stock']].map(([l, k]) => (
            <div key={k}>
              <label className={labelCls}>{l}</label>
              <input className={inputCls} value={form[k]} onChange={e => set(k, e.target.value)} placeholder={l} />
            </div>
          ))}
        </div>
        <label className="flex items-center gap-2 mt-4 cursor-pointer">
          <input type="checkbox" checked={form.trackInventory} onChange={e => set('trackInventory', e.target.checked)} className="accent-orange-500 w-4 h-4" />
          <span className="text-sm text-[#6B6B6B]">Track Inventory</span>
        </label>
      </Section>

      {/* Section 3 — Images */}
      <Section title="Product Images">
        <div className="border-2 border-dashed border-[#D0D0CA] rounded-sm p-8 text-center hover:border-[#C9A96E] transition-colors cursor-pointer mb-4"
          onClick={() => document.getElementById('img-upload').click()}>
          <Upload size={32} className="mx-auto mb-3 text-[#9E9E9E]" />
          <p className="text-sm font-semibold text-[#6B6B6B]">Drop images here or click to browse</p>
          <p className="text-xs text-[#9E9E9E] mt-1">PNG, JPG, WEBP — Max 5MB each (Recommended: 800x800px)</p>
          {/* Uploads to Cloudinary: fetch POST to https://api.cloudinary.com/v1_1/${VITE_CLOUDINARY_CLOUD_NAME}/image/upload with FormData */}
          <input id="img-upload" type="file" multiple accept="image/*" className="hidden"
            onChange={e => {
              const files = Array.from(e.target.files);
              const previews = files.map(f => ({ url: URL.createObjectURL(f), name: f.name, id: Date.now() + Math.random(), file: f }));
              set('images', [...form.images, ...previews]);
            }} />
        </div>
        {form.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {form.images.map((img, i) => (
              <div key={img.id} className="relative rounded-sm overflow-hidden border border-[#D0D0CA] aspect-square">
                <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                <button onClick={() => set('images', form.images.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-6 h-6 bg-[#9B2226] text-white rounded-full flex items-center justify-center text-xs hover:bg-[#7A1B1E]">
                  <X size={10} />
                </button>
                <div className="absolute bottom-1 left-1 text-[#9E9E9E] cursor-move"><GripVertical size={14} /></div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Section 4 — Description (simple textarea fallback — ReactQuill requires SSR setup) */}
      <Section title="Product Description">
        <p className="text-xs text-[#9E9E9E] mb-2">Rich text editor (ReactQuill) — install with: npm install react-quill</p>
        <textarea rows={6} className={`${inputCls} resize-none`} value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Enter detailed product description..." />
      </Section>

      {/* Section 5 — Variants */}
      <Section title="Product Variants">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {[['Size', 'size'], ['Color', 'color'], ['Price', 'price'], ['Stock', 'stock']].map(([l, k]) => (
            <div key={k}>
              <label className={labelCls}>{l}</label>
              <input className={inputCls} value={variantRow[k]} onChange={e => setVariantRow(r => ({ ...r, [k]: e.target.value }))} placeholder={l} />
            </div>
          ))}
        </div>
        <button onClick={addVariant} className="text-sm font-semibold px-4 py-2 rounded-sm border-2 transition-all border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white">
          + Add Variant
        </button>
        {form.variants.length > 0 && (
          <div className="mt-3 rounded-sm overflow-hidden border border-[#D0D0CA]">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F8F6]">
                <tr>{['Size','Color','Price','Stock',''].map(h => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-[#6B6B6B]">{h}</th>)}</tr>
              </thead>
              <tbody>
                {form.variants.map((v, i) => (
                  <tr key={v.id} className="border-t border-[#E8E8E4]">
                    <td className="px-3 py-2">{v.size}</td>
                    <td className="px-3 py-2">{v.color}</td>
                    <td className="px-3 py-2">{formatPrice(v.price)}</td>
                    <td className="px-3 py-2">{v.stock}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => set('variants', form.variants.filter((_,j) => j !== i))} className="text-[#9B2226] hover:text-[#9B2226]"><X size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Section 5.5 — Specifications */}
      <Section title="Product Specifications">
        <div className="mb-3">
          <label className={labelCls}>Paste Specifications (e.g. "Material: Leather" - one per line)</label>
          <textarea 
            className={`${inputCls} min-h-[100px] mb-2`}
            value={bulkSpecs}
            onChange={e => setBulkSpecs(e.target.value)}
            placeholder={`Material: Genuine Leather\nColor: Black\nHardware: Silver Tone`}
          />
          <button onClick={addBulkSpecs} className="text-sm font-semibold px-4 py-2 rounded-sm border-2 transition-all border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white">
            Parse & Add Specifications
          </button>
        </div>
        {Object.keys(form.specs || {}).length > 0 && (
          <div className="mt-3 rounded-sm overflow-hidden border border-[#D0D0CA]">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F8F6]">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#6B6B6B]">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#6B6B6B]">Value</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(form.specs).map(([k, v]) => (
                  <tr key={k} className="border-t border-[#E8E8E4]">
                    <td className="px-3 py-2 font-medium text-[#111111]">{k}</td>
                    <td className="px-3 py-2 text-[#6B6B6B]">{v}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => removeSpec(k)} className="text-[#9B2226] hover:text-[#9B2226]"><X size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Section 6 — SEO */}
      <Section title="SEO & Search">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1.5">
              <label className={labelCls.replace('mb-1.5','')}>Meta Title</label>
              <span className={`text-xs ${form.metaTitle.length > 60 ? 'text-[#9B2226]' : 'text-[#9E9E9E]'}`}>{form.metaTitle.length}/60</span>
            </div>
            <input className={inputCls} value={form.metaTitle} onChange={e => set('metaTitle', e.target.value)} placeholder="SEO page title" maxLength={70} />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className={labelCls.replace('mb-1.5','')}>Meta Description</label>
              <span className={`text-xs ${form.metaDescription.length > 160 ? 'text-[#9B2226]' : 'text-[#9E9E9E]'}`}>{form.metaDescription.length}/160</span>
            </div>
            <textarea rows={3} className={`${inputCls} resize-none`} value={form.metaDescription}
              onChange={e => set('metaDescription', e.target.value)} placeholder="SEO description" maxLength={180} />
          </div>
          <div>
            <label className={labelCls}>SEO Keywords (comma-separated)</label>
            <input className={inputCls} value={form.metaKeywords} onChange={e => set('metaKeywords', e.target.value)} placeholder="leather wallet, premium wallet, handmade leather" />
          </div>
          <div>
            <label className={labelCls}>URL Slug</label>
            <input className={inputCls} value={form.slug} onChange={e => set('slug', e.target.value)} />
          </div>
          {/* Google preview */}
          {(form.metaTitle || form.name) && (
            <div className="p-4 rounded-sm bg-[#F8F8F6] border border-[#D0D0CA]">
              <p className="text-xs text-[#9E9E9E] mb-2 font-semibold">Google Preview</p>
              <p className="text-blue-600 text-base font-medium leading-tight hover:underline cursor-pointer">
                {form.metaTitle || form.name || 'Page Title'}
              </p>
              <p className="text-[#2D6A4F] text-xs mt-0.5">crafthid.com/products/{form.slug || 'product-slug'}</p>
              <p className="text-[#6B6B6B] text-sm mt-1 leading-relaxed">
                {form.metaDescription || 'No description provided. Add a meta description to improve search visibility.'}
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* Form Footer */}
      <div className="flex gap-3 justify-end py-4">
        <button onClick={onCancel} disabled={saving} className="px-6 py-2.5 rounded-sm text-sm font-semibold text-[#6B6B6B] border border-[#D0D0CA] hover:bg-[#F8F8F6] transition-all disabled:opacity-50">
          Cancel
        </button>
        <button 
          onClick={() => {
            const finalForm = { ...form };
            const parsedSpecs = parseBulkSpecsText(bulkSpecs);
            if (Object.keys(parsedSpecs).length > 0) {
              finalForm.specs = { ...finalForm.specs, ...parsedSpecs };
            }
            if (variantRow.size || variantRow.color) {
              finalForm.variants = [...finalForm.variants, { ...variantRow, id: Date.now() }];
            }
            onSave({ ...finalForm, status: 'draft' });
          }} 
          disabled={saving}
          className="px-6 py-2.5 rounded-sm text-sm font-semibold border-2 transition-all disabled:opacity-50 border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white"
        >
          {saving ? <span className="flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> Saving...</span> : 'Save Draft'}
        </button>
        <button 
          onClick={() => {
            const finalForm = { ...form };
            const parsedSpecs = parseBulkSpecsText(bulkSpecs); if (Object.keys(parsedSpecs).length > 0) {
              finalForm.specs = { ...finalForm.specs, ...parsedSpecs };
            }
            if (variantRow.size || variantRow.color) {
              finalForm.variants = [...finalForm.variants, { ...variantRow, id: Date.now() }];
            }
            onSave({ ...finalForm, status: 'active' });
          }} 
          disabled={saving}
          className="px-6 py-2.5 rounded-sm text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 bg-[#111111]"
        >
          {saving ? <span className="flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> Publishing...</span> : 'Publish Product'}
        </button>
      </div>
    </div>
  );
}

// ─── Products Table ───────────────────────────────────────────────────────────
export default function Products() {
  const { setBreadcrumbs } = useAdminStore();
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [liveCategories, setLiveCategories] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editingStock, setEditingStock] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [bulkAction, setBulkAction] = useState('');
  const [saveError, setSaveError] = useState('');
  const PER_PAGE = 10;

  useEffect(() => {
    setBreadcrumbs([{ label:'Dashboard', path:'/aytsam-abdullah' }, { label:'Products', path:'/aytsam-abdullah/products' }]);
    loadProducts();
    // Also load real categories for the form
    getAdminCategories()
      .then((data) => {
        const items = Array.isArray(data) ? data : [];
        setLiveCategories(items);
      })
      .catch(() => {});
  }, []);

  const loadProducts = () => {
    setLoading(true);
    getAdminProducts()
      .then((data) => {
        const items = data?.products || data || [];
        setProducts(items.map((p, i) => ({
          id: p._id, _id: p._id, name: p.name, sku: p.SKU || p.sku || '',
          category: typeof p.category === 'object' ? p.category?.name : p.category || 'Uncategorized',
          price: p.price, comparePrice: p.comparePrice || '', stock: p.stock,
          status: p.isActive ? 'active' : 'inactive',
          isFeatured: p.isFeatured || false,
          slug: p.slug,
          description: p.description || '',
          brand: p.brand || '',
          images: p.images || [],
          variants: p.variants || [],
          specs: p.specs || {},
          metaTitle: p.metaTitle || '',
          metaDescription: p.metaDescription || '',
          metaKeywords: p.metaKeywords || '',
          bg: `linear-gradient(135deg,${['#667eea,#764ba2','#f093fb,#f5576c','#4facfe,#00f2fe','#43e97b,#38f9d7','#fa709a,#fee140','#a18cd1,#fbc2eb'][i % 6]})`
        })));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || p.category === categoryFilter;
    const matchStatus = !statusFilter || (statusFilter === 'out-of-stock' ? p.stock === 0 : p.status === statusFilter);
    return matchSearch && matchCat && matchStatus;
  });

  const paginated = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(s => s.length === paginated.length ? [] : paginated.map(p => p.id));

  const applyBulk = async () => {
    if (!bulkAction || selected.length === 0) return;
    const promises = selected.map(id => {
      if (bulkAction === 'delete') return apiDeleteProduct(id);
      return apiUpdateProduct(id, { isActive: bulkAction === 'active' });
    });
    try { 
      const results = await Promise.allSettled(promises);
      const errors = results.filter(r => r.status === 'rejected');
      if (errors.length > 0) alert(`Failed to apply action to ${errors.length} items.`);
    } catch(_) {}
    loadProducts();
    setSelected([]);
  };

  const saveStock = async (id, val) => {
    const stock = parseInt(val) || 0;
    const previousProducts = [...products];
    setProducts(p => p.map(x => x.id === id ? { ...x, stock } : x));
    setEditingStock(null);
    try { 
      await apiUpdateProduct(id, { stock }); 
    } catch(err) {
      alert('Failed to update stock');
      setProducts(previousProducts);
    }
  };

  const handleDelete = async (id) => {
    const previousProducts = [...products];
    setProducts(p => p.filter(x => x.id !== id));
    setConfirmDelete(null);
    try {
      await apiDeleteProduct(id);
    } catch (err) {
      alert('Failed to delete product');
      setProducts(previousProducts);
    } 
  };

  const handleSave = async (data) => {
    setSaveError('');
    setSaving(true);
    try {
      // Upload new images sequentially to avoid Cloudinary concurrent rate limits
      const uploadedImages = [];
      for (const img of (data.images || [])) {
        if (img.file) {
          const result = await uploadImage(img.file);
          if (result && result.url) {
            uploadedImages.push({ url: result.url, alt: data.name, isPrimary: false });
          } else {
            throw new Error(`Failed to upload image "${img.name || 'unknown'}". Please try again.`);
          }
        } else if (img.url && !img.url.startsWith('blob:')) {
          uploadedImages.push({ url: img.url, alt: img.alt || data.name, isPrimary: false });
        }
      }

      // Map form fields → backend model fields
      const payload = {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: data.description || data.name,
        shortDescription: data.description?.slice(0, 120) || '',
        brand: data.brand || '',
        SKU: data.sku || `SKU-${Date.now()}`,
        price: Number(data.price) || 0,
        comparePrice: Number(data.comparePrice) || undefined,
        stock: Number(data.stock) || 0,
        isActive: data.status === 'active',
        isFeatured: data.isFeatured || false,
        // category: use ObjectId if available from liveCategories lookup
        category: (() => {
          const match = liveCategories.find(
            c => c.name === data.category || c.slug === data.category
          );
          return match ? match._id : data.category;
        })(),
        variants: data.variants || [],
        specs: data.specs || {},
        images: uploadedImages,
        metaTitle: data.metaTitle || data.name,
        metaDescription: data.metaDescription || '',
        metaKeywords: data.metaKeywords || '',
      };

      if (editProduct) {
        await apiUpdateProduct(editProduct.id, payload);
      } else {
        await apiCreateProduct(payload);
      }
      // Reload from server so the list is fresh
      loadProducts();
      setShowForm(false);
      setEditProduct(null);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save product. Check all required fields.');
    } finally {
      setSaving(false);
    }
  };

  if (showForm) {
    return (
      <>
        {saveError && (
          <div className="mb-4 px-4 py-3 rounded-sm bg-[#FEF2F2] border border-red-200 flex items-center gap-2 text-[#9B2226] text-sm font-medium">
            <AlertCircle size={15} /> {saveError}
          </div>
        )}
        <ProductForm
          initial={editProduct}
          saving={saving}
          onCancel={() => { setShowForm(false); setEditProduct(null); setSaveError(''); }}
          onSave={handleSave}
          categories={liveCategories}
        />
      </>
    );
  }


  return (
    <div>
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-xl font-black text-[#111111]">Products ({products.length})</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or SKU…"
              className="pl-9 pr-4 py-2.5 text-sm border border-[#D0D0CA] rounded-sm outline-none focus:border-[#C9A96E] transition-all w-full sm:w-52" />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="text-sm border border-[#D0D0CA] rounded-sm px-3 py-2.5 outline-none focus:border-[#C9A96E] text-[#6B6B6B] bg-white">
            <option value="">All Categories</option>
            {liveCategories.map(c => <option key={c._id || c.name} value={c.name}>{c.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-[#D0D0CA] rounded-sm px-3 py-2.5 outline-none focus:border-[#C9A96E] text-[#6B6B6B] bg-white">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
          <button onClick={() => { setShowForm(true); setEditProduct(null); }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-sm text-sm font-semibold text-white transition-all hover:opacity-90 bg-[#111111]">
            <Plus size={15} /> Add Product
          </button>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-[#F8F8F6] border border-[#C9A96E] rounded-sm">
          <span className="text-sm font-semibold text-orange-700">{selected.length} selected</span>
          <select value={bulkAction} onChange={e => setBulkAction(e.target.value)}
            className="text-sm border border-[#C9A96E] rounded-sm px-3 py-1.5 outline-none bg-white">
            <option value="">Bulk Action</option>
            <option value="active">Activate</option>
            <option value="inactive">Deactivate</option>
            <option value="delete">Delete</option>
          </select>
          <button onClick={applyBulk} className="px-4 py-1.5 text-sm font-semibold text-white rounded-sm bg-[#111111]">Apply</button>
          <button onClick={() => setSelected([])} className="text-[#9E9E9E] hover:text-[#6B6B6B] ml-auto"><X size={16} /></button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-sm border border-[#E8E8E4] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8E8E4] bg-[#F8F8F6]">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={selected.length === paginated.length && paginated.length > 0} onChange={toggleAll} className="accent-orange-500" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#9E9E9E] uppercase tracking-wider w-12">IMG</th>
                {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#9E9E9E] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows /> : paginated.map(p => {
                const sc = STATUS_BADGE[p.status] || STATUS_BADGE.active;
                const isDeleting = confirmDelete === p.id;
                return (
                  <tr key={p.id} className={`border-b border-[#E8E8E4] hover:bg-[#F8F8F6]/50 transition-colors ${selected.includes(p.id) ? 'bg-[#F8F8F6]/40' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} className="accent-orange-500" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-sm shrink-0" style={{ background: p.bg }} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-[#111111] max-w-[200px] truncate">{p.name}</p>
                      <p className="text-xs text-[#9E9E9E]">{p.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6B6B6B] whitespace-nowrap">{p.category}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#111111]">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3">
                      {editingStock === p.id ? (
                        <input type="number" defaultValue={p.stock} autoFocus
                          className="w-16 border border-[#C9A96E] rounded-sm px-2 py-1 text-sm outline-none"
                          onBlur={e => saveStock(p.id, e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveStock(p.id, e.target.value)} />
                      ) : (
                        <span onClick={() => setEditingStock(p.id)}
                          className={`text-sm font-semibold cursor-pointer hover:underline ${p.stock < 10 ? 'text-[#9B2226]' : 'text-[#111111]'}`}>
                          {p.stock}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.text }}>{sc.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {isDeleting ? (
                        <span className="flex items-center gap-2 text-xs">
                          <span className="text-[#6B6B6B]">Sure?</span>
                          <button onClick={() => handleDelete(p.id)} className="text-[#9B2226] font-semibold hover:underline">Yes</button>
                          <button onClick={() => setConfirmDelete(null)} className="text-[#9E9E9E] hover:underline">No</button>
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { setEditProduct(p); setShowForm(true); }}
                            className="w-8 h-8 rounded-sm flex items-center justify-center text-[#9E9E9E] hover:text-[#C9A96E] hover:bg-[#F8F8F6] transition-all">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setConfirmDelete(p.id)}
                            className="w-8 h-8 rounded-sm flex items-center justify-center text-[#9E9E9E] hover:text-[#9B2226] hover:bg-[#FEF2F2] transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && paginated.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-[#9E9E9E] text-sm">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8E8E4]">
            <p className="text-xs text-[#9E9E9E]">Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="w-8 h-8 rounded-sm flex items-center justify-center border border-[#D0D0CA] text-[#6B6B6B] hover:border-[#C9A96E] disabled:opacity-30 transition-all">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i+1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-sm text-xs font-semibold border transition-all ${page === n ? 'bg-[#111111] text-white border-[#111111]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="w-8 h-8 rounded-sm flex items-center justify-center border border-[#D0D0CA] text-[#6B6B6B] hover:border-[#C9A96E] disabled:opacity-30 transition-all">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
