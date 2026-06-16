import { useState, useEffect } from 'react';
import {
  Globe, Truck, Phone, Search, Plus, Trash2, Link2, Megaphone
} from 'lucide-react';
import { useAdminToast } from '../components/Toast';
import useAdminStore from '../store/adminStore';
import { getSettings, updateSettings, uploadImage } from '../adminApi';

const CORAL = '#111111';
const TABS = [
  { id:'general',  label:'General',      icon: Globe },
  { id:'shipping', label:'Shipping',     icon: Truck },
  { id:'contact',  label:'Contact Info', icon: Phone },
  { id:'seo',      label:'SEO Defaults', icon: Search },
  { id:'promo',    label:'Promo Banner', icon: Megaphone },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'AED', 'CAD', 'AUD'];
const TIMEZONES  = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Karachi', 'Asia/Dubai', 'Asia/Tokyo'];

// ─── Input helper ─────────────────────────────────────────────────────────────
const inputCls = 'w-full border border-[#D0D0CA] rounded-sm px-3 py-2.5 text-sm text-[#111111] outline-none focus:border-[#C9A96E] transition-all bg-white';
const labelCls = 'block text-xs font-semibold text-[#6B6B6B] mb-1.5';

function Field({ label, children }) {
  return <div><label className={labelCls}>{label}</label>{children}</div>;
}

// ─── Upload zone ──────────────────────────────────────────────────────────────
function UploadZone({ preview, onUpload, label, size = 'full' }) {
  const [uploading, setUploading] = useState(false);
  const { showToast } = useAdminToast();

  const handleUpload = async (file) => {
    if (!file) return;
    try {
      setUploading(true);
      const res = await uploadImage(file);
      onUpload(res.url);
    } catch (err) {
      showToast('error', 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className={`border-2 border-dashed border-[#D0D0CA] rounded-sm p-4 text-center cursor-pointer hover:border-[#C9A96E] transition-colors flex flex-col items-center gap-2 ${size === 'sm' ? 'w-20 h-20 justify-center p-2' : 'h-28 justify-center'} ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={() => document.getElementById(`upload-${label.replace(/\s/g,'')}`).click()}>
        {preview
          ? <img src={preview} alt="preview" className="max-h-full max-w-full object-contain rounded-sm" />
          : <><span className="text-[#9E9E9E] text-2xl">{uploading ? '...' : '+'}</span><p className="text-xs text-[#9E9E9E]">{uploading ? 'Uploading...' : 'Click to upload'}</p></>}
        <input id={`upload-${label.replace(/\s/g,'')}`} type="file" accept="image/*" className="hidden"
          onChange={e => handleUpload(e.target.files[0])} />
      </div>
    </div>
  );
}

// ─── General Tab ─────────────────────────────────────────────────────────────
function GeneralTab({ onSave, settings }) {
  const [form, setForm] = useState({
    siteName: settings.siteName || 'Store',
    logo: settings.logo || null,
    currency: settings.currency || 'USD',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="space-y-5">
      <Field label="Site Name"><input className={inputCls} value={form.siteName} onChange={e => set('siteName', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-5">
        <UploadZone label="Site Logo" preview={form.logo} onUpload={v => set('logo', v)} />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <Field label="Default Currency">
          <select className={inputCls} value={form.currency} onChange={e => set('currency', e.target.value)}>
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <button onClick={() => onSave(form)} className="px-6 py-2.5 rounded-sm text-sm font-semibold text-white hover:opacity-90 transition-all" style={{ background: CORAL }}>Save Settings</button>
    </div>
  );
}

// ─── Shipping Tab ─────────────────────────────────────────────────────────────
function ShippingTab({ onSave, settings }) {
  const [form, setForm] = useState({
    shippingCost: settings.shippingCost ?? 8.99,
    freeShippingAbove: settings.freeShippingAbove ?? 50,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <Field label="Default Shipping Cost ($)"><input type="number" className={inputCls} value={form.shippingCost} onChange={e => set('shippingCost', e.target.value)} /></Field>
        <Field label="Free Shipping Threshold ($)"><input type="number" className={inputCls} value={form.freeShippingAbove} onChange={e => set('freeShippingAbove', e.target.value)} /></Field>
      </div>
      <button onClick={() => onSave(form)} className="px-6 py-2.5 rounded-sm text-sm font-semibold text-white hover:opacity-90 transition-all" style={{ background: CORAL }}>Save Settings</button>
    </div>
  );
}

// ─── Contact Tab ──────────────────────────────────────────────────────────────
function ContactTab({ onSave, settings }) {
  const ci = settings.contactInfo || {};
  const [form, setForm] = useState({
    email: ci.email || '',
    phone: ci.phone || '',
    address: ci.address || '',
  });

  const socials = [
    { k:'instagram', icon: Link2, label:'Instagram', placeholder:'https://instagram.com/store' },
    { k:'facebook',  icon: Link2, label:'Facebook',  placeholder:'https://facebook.com/store' },
    { k:'twitter',   icon: Link2, label:'Twitter/X', placeholder:'https://twitter.com/store' },
    { k:'youtube',   icon: Link2, label:'YouTube',   placeholder:'https://youtube.com/@store' },
  ];

  // Build social links from settings
  const existingSocials = {};
  (settings.socialLinks || []).forEach(s => { existingSocials[s.platform] = s.url; });
  const [socialForm, setSocialForm] = useState(existingSocials);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setSocial = (k, v) => setSocialForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    const socialLinks = Object.entries(socialForm)
      .filter(([_, url]) => url.trim())
      .map(([platform, url]) => ({ platform, url }));
    onSave({ contactInfo: form, socialLinks });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <Field label="Phone Number"><input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
        <Field label="Email Address"><input type="email" className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} /></Field>
      </div>
      <Field label="Physical Address"><textarea rows={3} className={`${inputCls} resize-none`} value={form.address} onChange={e => set('address', e.target.value)} /></Field>

      <div>
        <label className={labelCls}>Social Media Links</label>
        <div className="space-y-3">
          {socials.map(({ k, icon: Icon, label, placeholder }) => (
            <div key={k} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm flex items-center justify-center text-[#9E9E9E] bg-[#F8F8F6] shrink-0">
                {Icon ? <Icon size={16} /> : <span className="text-xs font-bold">TT</span>}
              </div>
              <input className={inputCls} value={socialForm[k] || ''} onChange={e => setSocial(k, e.target.value)} placeholder={placeholder} />
            </div>
          ))}
        </div>
      </div>
      <button onClick={handleSave} className="px-6 py-2.5 rounded-sm text-sm font-semibold text-white hover:opacity-90 transition-all" style={{ background: CORAL }}>Save Settings</button>
    </div>
  );
}

// ─── SEO Tab ──────────────────────────────────────────────────────────────────
function SeoTab({ onSave, settings }) {
  const mt = settings.metaTags || {};
  const [form, setForm] = useState({
    title: mt.title || '',
    description: mt.description || '',
    keywords: mt.keywords || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls.replace('mb-1.5','')}>Default Meta Title</label>
          <span className={`text-xs ${(form.title?.length || 0) > 60 ? 'text-[#9B2226]' : 'text-[#9E9E9E]'}`}>{form.title?.length || 0}/60</span>
        </div>
        <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} maxLength={70} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls.replace('mb-1.5','')}>Default Meta Description</label>
          <span className={`text-xs ${(form.description?.length || 0) > 160 ? 'text-[#9B2226]' : 'text-[#9E9E9E]'}`}>{form.description?.length || 0}/160</span>
        </div>
        <textarea rows={3} className={`${inputCls} resize-none`} value={form.description} onChange={e => set('description', e.target.value)} maxLength={180} />
      </div>
      <Field label="Keywords (comma-separated)"><input className={inputCls} value={form.keywords} onChange={e => set('keywords', e.target.value)} placeholder="ecommerce, shopping, deals" /></Field>
      <button onClick={() => onSave({ metaTags: form })} className="px-6 py-2.5 rounded-sm text-sm font-semibold text-white hover:opacity-90 transition-all" style={{ background: CORAL }}>Save Settings</button>
    </div>
  );
}

// ─── Promo Banner Tab ─────────────────────────────────────────────────────────
function PromoBannerTab({ onSave, settings }) {
  const pb = settings.promoBanner || {};
  const [form, setForm] = useState({
    enabled:    pb.enabled !== false,
    eyebrow:    pb.eyebrow || 'Limited Time',
    heading:    pb.heading || 'Up to 50% Off This Week',
    subtext:    pb.subtext || "Don't miss our biggest sale. Limited stock — act fast.",
    buttonText: pb.buttonText || 'Shop the Sale →',
    buttonLink: pb.buttonLink || '/products',
    image:      pb.image || '',
    endDate:    pb.endDate ? new Date(pb.endDate).toISOString().slice(0, 16) : '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    const payload = { ...form };
    if (payload.endDate) payload.endDate = new Date(payload.endDate).toISOString();
    onSave({ promoBanner: payload });
  };

  return (
    <div className="space-y-5">
      <p className="text-xs text-[#9E9E9E]">Configure the promotional banner that appears on the home page below "Why Shop With Us".</p>

      {/* Enable/Disable */}
      <div className="flex items-center justify-between p-3 bg-[#F8F8F6] rounded-sm border border-[#E8E8E4]">
        <div>
          <p className="text-sm font-semibold text-[#111111]">Enable Promo Banner</p>
          <p className="text-xs text-[#9E9E9E]">Show or hide the banner on the home page</p>
        </div>
        <button
          onClick={() => set('enabled', !form.enabled)}
          className="relative cursor-pointer"
          style={{ width: 44, height: 24, borderRadius: 9999, background: form.enabled ? CORAL : '#E8E8E4', border: 'none', transition: 'background 0.2s' }}
        >
          <div style={{ position: 'absolute', top: 3, left: form.enabled ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Field label="Eyebrow Text (small label)">
          <input className={inputCls} value={form.eyebrow} onChange={e => set('eyebrow', e.target.value)} placeholder="e.g. Limited Time" />
        </Field>
        <Field label="Sale End Date">
          <input type="datetime-local" className={inputCls} value={form.endDate} onChange={e => set('endDate', e.target.value)} />
        </Field>
      </div>

      <Field label="Heading">
        <input className={inputCls} value={form.heading} onChange={e => set('heading', e.target.value)} placeholder="e.g. Up to 50% Off This Week" />
      </Field>

      <Field label="Description">
        <textarea className={inputCls} rows={2} value={form.subtext} onChange={e => set('subtext', e.target.value)} placeholder="e.g. Don't miss our biggest sale..." />
      </Field>

      <div className="grid grid-cols-2 gap-5">
        <Field label="Button Text">
          <input className={inputCls} value={form.buttonText} onChange={e => set('buttonText', e.target.value)} placeholder="e.g. Shop the Sale →" />
        </Field>
        <Field label="Button Link">
          <input className={inputCls} value={form.buttonLink} onChange={e => set('buttonLink', e.target.value)} placeholder="e.g. /products" />
        </Field>
      </div>

      <UploadZone label="Background Image (optional)" preview={form.image} onUpload={v => set('image', v)} />
      {form.image && (
        <button onClick={() => set('image', '')} className="text-xs text-[#9B2226] hover:underline cursor-pointer bg-transparent border-none">Remove background image</button>
      )}

      <button onClick={handleSubmit} className="px-6 py-2.5 rounded-sm text-sm font-semibold text-white hover:opacity-90 transition-all" style={{ background: CORAL }}>Save Promo Banner</button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Settings() {
  const { setBreadcrumbs } = useAdminStore();
  const { showToast, ToastUI } = useAdminToast();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setBreadcrumbs([{ label:'Dashboard', path:'/admin' }, { label:'Settings', path:'/admin/settings' }]);
    // Load saved settings from backend
    getSettings()
      .then(data => {
        if (data) setSettings(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (tabData) => {
    try {
      const merged = { ...settings, ...tabData };
      const result = await updateSettings(merged);
      setSettings(result || merged);
      showToast('Settings saved successfully ✓', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save settings', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: CORAL, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div>
      <ToastUI />
      <h1 className="text-xl font-black text-[#111111] mb-5">Settings</h1>

      <div className="flex gap-5 items-start">
        {/* Vertical tabs */}
        <div className="bg-white rounded-sm border border-[#E8E8E4] p-2 w-48 shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-sm font-medium mb-0.5 transition-all ${activeTab === id ? 'text-white' : 'text-[#6B6B6B] hover:bg-[#F8F8F6] hover:text-[#111111]'}`}
              style={activeTab === id ? { background: CORAL } : {}}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 bg-white rounded-sm border border-[#E8E8E4] p-6">
          {activeTab === 'general'  && <GeneralTab  onSave={handleSave} settings={settings} />}
          {activeTab === 'shipping' && <ShippingTab onSave={handleSave} settings={settings} />}
          {activeTab === 'contact'  && <ContactTab  onSave={handleSave} settings={settings} />}
          {activeTab === 'seo'      && <SeoTab      onSave={handleSave} settings={settings} />}
          {activeTab === 'promo'    && <PromoBannerTab onSave={handleSave} settings={settings} />}
        </div>
      </div>
    </div>
  );
}
