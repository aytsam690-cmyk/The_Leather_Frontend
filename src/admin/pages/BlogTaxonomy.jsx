import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, Tag as TagIcon, FolderTree } from 'lucide-react';
import Modal from '../components/Modal';
import { useAdminToast } from '../components/Toast';
import {
  getBlogCategories, createBlogCategory, updateBlogCategory, deleteBlogCategory,
  getBlogTags, createBlogTag, updateBlogTag, deleteBlogTag,
} from '../adminApi';

const CORAL = '#111111';

const inputCls = 'w-full border border-[#D0D0CA] rounded-sm px-3 py-2.5 text-sm text-[#111111] outline-none focus:border-[#C9A96E] transition-all bg-white';
const labelCls = 'block text-xs font-semibold text-[#6B6B6B] mb-1.5';

// ─── Category / Tag edit modal ─────────────────────────────────────────────────
function EditModal({ kind, item, onSave, onCancel, saving }) {
  const [name, setName] = useState(item?.name || '');
  const [slug, setSlug] = useState(item?.slug || '');
  const [description, setDescription] = useState(item?.description || '');

  const submit = () => {
    if (!name.trim()) return;
    const payload = { name: name.trim(), slug: slug.trim() || undefined };
    if (kind === 'category') payload.description = description.trim();
    onSave(payload);
  };

  return (
    <Modal isOpen onClose={onCancel} title={`${item ? 'Edit' : 'New'} ${kind === 'category' ? 'Category' : 'Tag'}`} size="sm"
      footer={
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-sm text-sm font-semibold text-[#6B6B6B] border border-[#D0D0CA] hover:bg-[#F8F8F6] transition-all">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="px-4 py-2 rounded-sm text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
            style={{ background: CORAL }}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            {item ? 'Save' : 'Create'}
          </button>
        </div>
      }>
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Name *</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder={kind === 'category' ? 'e.g. Guides' : 'e.g. leather-care'} />
        </div>
        <div>
          <label className={labelCls}>Slug</label>
          <input className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated from name" />
        </div>
        {kind === 'category' && (
          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={3} className={`${inputCls} resize-none`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── One taxonomy column (category or tag) ─────────────────────────────────────
function TaxonomyColumn({ kind, title, icon: Icon, items, loading, onNew, onEdit, onDelete }) {
  return (
    <div className="bg-white border border-[#E8E8E4] rounded-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-[#E8E8E4] bg-[#F8F8F6]">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-[#6B6B6B]" />
          <h2 className="text-sm font-bold text-[#111111]">{title}</h2>
        </div>
        <button onClick={onNew} className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-semibold rounded-sm transition-all hover:opacity-90" style={{ background: CORAL }}>
          <Plus size={14} /> Add
        </button>
      </div>
      <div className="divide-y divide-[#E8E8E4]">
        {loading ? (
          <p className="p-6 text-center text-sm text-[#9E9E9E]">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-sm text-[#9E9E9E]">No {kind === 'category' ? 'categories' : 'tags'} yet.</p>
        ) : (
          items.map((it) => (
            <div key={it._id} className="flex items-center justify-between p-4 hover:bg-[#F8F8F6]/50 transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#111111] truncate">{it.name}</p>
                <p className="text-xs text-[#9E9E9E] truncate">/{it.slug} · {it.postCount || 0} post{it.postCount === 1 ? '' : 's'}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => onEdit(it)} className="p-1.5 text-[#9E9E9E] hover:text-[#111111] transition-colors" title="Edit"><Pencil size={15} /></button>
                <button onClick={() => onDelete(it)} className="p-1.5 text-[#9E9E9E] hover:text-[#9B2226] transition-colors" title="Delete"><Trash2 size={15} /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function BlogTaxonomy() {
  const { showToast, ToastUI } = useAdminToast();
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingTags, setLoadingTags] = useState(true);
  const [saving, setSaving] = useState(false);
  // modal: { kind: 'category'|'tag', item: obj|null } | null
  const [modal, setModal] = useState(null);

  const fetchCats = useCallback(async () => {
    try { setLoadingCats(true); setCategories(await getBlogCategories() || []); }
    catch (err) { console.error(err); showToast('Failed to load categories', 'error'); }
    finally { setLoadingCats(false); }
  }, []);

  const fetchTags = useCallback(async () => {
    try { setLoadingTags(true); setTags(await getBlogTags() || []); }
    catch (err) { console.error(err); showToast('Failed to load tags', 'error'); }
    finally { setLoadingTags(false); }
  }, []);

  useEffect(() => { fetchCats(); fetchTags(); }, [fetchCats, fetchTags]);

  const handleSave = async (payload) => {
    const { kind, item } = modal;
    try {
      setSaving(true);
      if (kind === 'category') {
        if (item) await updateBlogCategory(item._id, payload);
        else await createBlogCategory(payload);
        await fetchCats();
      } else {
        if (item) await updateBlogTag(item._id, payload);
        else await createBlogTag(payload);
        await fetchTags();
      }
      showToast(`${kind === 'category' ? 'Category' : 'Tag'} ${item ? 'updated' : 'created'}`);
      setModal(null);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (kind, item) => {
    const msg = kind === 'category'
      ? `Delete "${item.name}"? Posts in this category will become Uncategorized.`
      : `Delete "${item.name}"? It will be removed from all posts.`;
    if (!window.confirm(msg)) return;
    try {
      if (kind === 'category') { await deleteBlogCategory(item._id); await fetchCats(); }
      else { await deleteBlogTag(item._id); await fetchTags(); }
      showToast(`${kind === 'category' ? 'Category' : 'Tag'} deleted`);
    } catch (err) {
      console.error(err);
      showToast('Delete failed', 'error');
    }
  };

  return (
    <>
      <ToastUI />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111111]">Blog Taxonomy</h1>
        <p className="text-sm text-[#6B6B6B]">Manage blog categories and tags</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaxonomyColumn
          kind="category" title="Categories" icon={FolderTree}
          items={categories} loading={loadingCats}
          onNew={() => setModal({ kind: 'category', item: null })}
          onEdit={(it) => setModal({ kind: 'category', item: it })}
          onDelete={(it) => handleDelete('category', it)}
        />
        <TaxonomyColumn
          kind="tag" title="Tags" icon={TagIcon}
          items={tags} loading={loadingTags}
          onNew={() => setModal({ kind: 'tag', item: null })}
          onEdit={(it) => setModal({ kind: 'tag', item: it })}
          onDelete={(it) => handleDelete('tag', it)}
        />
      </div>

      {modal && (
        <EditModal
          kind={modal.kind}
          item={modal.item}
          saving={saving}
          onSave={handleSave}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  );
}
